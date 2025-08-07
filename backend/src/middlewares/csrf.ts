import { Request, Response, NextFunction } from 'express';
import Tokens from 'csrf';
import crypto from 'crypto';
import { logger, logSecurity } from '../utils/logger';

// CSRF 토큰 생성기 초기화
const tokens = new Tokens();

// Request 타입 확장
declare global {
  namespace Express {
    interface Request {
      csrfToken?: () => string;
      csrfSecret?: string;
    }
  }
}

// CSRF 설정 인터페이스
interface CSRFConfig {
  skipRoutes?: string[];
  cookieName?: string;
  headerName?: string;
  paramName?: string;
  secretLength?: number;
  saltLength?: number;
  tokenExpiry?: number; // 토큰 유효 시간 (밀리초)
}

// 기본 설정
const defaultConfig: CSRFConfig = {
  skipRoutes: [
    '/api/auth/login',
    '/api/auth/signup',
    '/api/auth/refresh',
    '/api/health',
    '/api/guest/access',
    '/api/webhook', // 외부 webhook 엔드포인트
  ],
  cookieName: '_csrf',
  headerName: 'x-csrf-token',
  paramName: '_csrf',
  secretLength: 18,
  saltLength: 8,
  tokenExpiry: 24 * 60 * 60 * 1000, // 24시간
};

// 토큰 저장소 (메모리 기반, 프로덕션에서는 Redis 사용 권장)
const tokenStore = new Map<string, { secret: string; expires: number }>();

// 주기적으로 만료된 토큰 정리
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of tokenStore.entries()) {
    if (value.expires < now) {
      tokenStore.delete(key);
    }
  }
}, 60 * 60 * 1000); // 1시간마다 정리

/**
 * CSRF Secret 생성 및 저장
 */
function generateCSRFSecret(sessionId: string, config: CSRFConfig): string {
  const secret = tokens.secretSync();
  const expires = Date.now() + (config.tokenExpiry || 24 * 60 * 60 * 1000);
  
  tokenStore.set(sessionId, { secret, expires });
  return secret;
}

/**
 * CSRF Secret 가져오기
 */
function getCSRFSecret(sessionId: string): string | null {
  const stored = tokenStore.get(sessionId);
  if (!stored) return null;
  
  if (stored.expires < Date.now()) {
    tokenStore.delete(sessionId);
    return null;
  }
  
  return stored.secret;
}

/**
 * 세션 ID 생성 또는 가져오기
 */
function getSessionId(req: Request, res: Response): string {
  // 기존 세션 ID 확인 (쿠키에서)
  let sessionId = req.signedCookies?.['csrf-session'] || req.cookies?.['csrf-session'];
  
  if (!sessionId) {
    // 새 세션 ID 생성
    sessionId = crypto.randomBytes(16).toString('hex');
    
    // 쿠키에 저장
    res.cookie('csrf-session', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24시간
      signed: true,
    });
  }
  
  return sessionId;
}

/**
 * CSRF 토큰 생성 미들웨어
 */
export function csrfProtection(customConfig?: CSRFConfig) {
  const config = { ...defaultConfig, ...customConfig };

  return (req: Request, res: Response, next: NextFunction) => {
    // 제외할 경로 확인
    const isSkipped = config.skipRoutes?.some(route => 
      req.path.startsWith(route) || req.path === route
    );

    if (isSkipped) {
      return next();
    }

    // 세션 ID 가져오기 또는 생성
    const sessionId = getSessionId(req, res);

    // GET 요청이거나 HEAD, OPTIONS 요청의 경우 토큰 생성만
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      // CSRF secret 가져오기 또는 생성
      let secret = getCSRFSecret(sessionId);
      if (!secret) {
        secret = generateCSRFSecret(sessionId, config);
      }

      // 토큰 생성 함수 추가
      req.csrfToken = () => {
        const token = tokens.create(secret);
        
        // 응답 헤더에 토큰 추가 (클라이언트가 쉽게 접근할 수 있도록)
        res.setHeader('X-CSRF-Token', token);
        
        return token;
      };

      req.csrfSecret = secret;
      return next();
    }

    // 상태 변경 요청 (POST, PUT, DELETE, PATCH)에 대한 검증
    const secret = getCSRFSecret(sessionId);
    
    if (!secret) {
      logSecurity('CSRF validation failed - no secret found', {
        sessionId,
        method: req.method,
        path: req.path,
        ip: req.ip,
      });
      
      return res.status(403).json({
        error: 'CSRF token validation failed',
        message: '세션이 만료되었습니다. 페이지를 새로고침해주세요.',
      });
    }

    // 토큰 추출 (우선순위: header > body > query)
    const token = 
      req.headers[config.headerName!] as string ||
      req.body?.[config.paramName!] ||
      req.query?.[config.paramName!] as string;

    if (!token) {
      logSecurity('CSRF token missing', {
        method: req.method,
        path: req.path,
        ip: req.ip,
      });
      
      return res.status(403).json({
        error: 'CSRF token missing',
        message: 'CSRF 토큰이 필요합니다.',
      });
    }

    // 토큰 검증
    try {
      const isValid = tokens.verify(secret, token);
      
      if (!isValid) {
        logSecurity('CSRF token invalid', {
          method: req.method,
          path: req.path,
          ip: req.ip,
          providedToken: token.substring(0, 10) + '...',
        });
        
        return res.status(403).json({
          error: 'Invalid CSRF token',
          message: '유효하지 않은 CSRF 토큰입니다.',
        });
      }

      // 토큰 재생성 함수 추가 (토큰 회전을 위해)
      req.csrfToken = () => {
        const newToken = tokens.create(secret);
        res.setHeader('X-CSRF-Token', newToken);
        return newToken;
      };

      req.csrfSecret = secret;
      next();
    } catch (error) {
      logSecurity('CSRF token verification error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        method: req.method,
        path: req.path,
        ip: req.ip,
      });
      
      return res.status(403).json({
        error: 'CSRF token verification failed',
        message: 'CSRF 토큰 검증에 실패했습니다.',
      });
    }
  };
}

/**
 * CSRF 토큰 생성 엔드포인트 핸들러
 * GET /api/csrf-token 과 같은 엔드포인트에서 사용
 */
export function csrfTokenHandler(req: Request, res: Response) {
  if (!req.csrfToken) {
    return res.status(500).json({
      error: 'CSRF protection not enabled',
      message: 'CSRF 보호가 활성화되지 않았습니다.',
    });
  }

  const token = req.csrfToken();
  
  res.json({
    csrfToken: token,
    headerName: 'X-CSRF-Token',
    paramName: '_csrf',
  });
}

/**
 * Double Submit Cookie 패턴 구현 (대체 방식)
 * SameSite 쿠키와 함께 사용하면 더 강력한 보호 제공
 */
export function doubleSubmitCsrf(customConfig?: CSRFConfig) {
  const config = { ...defaultConfig, ...customConfig };

  return (req: Request, res: Response, next: NextFunction) => {
    // 제외할 경로 확인
    const isSkipped = config.skipRoutes?.some(route => 
      req.path.startsWith(route) || req.path === route
    );

    if (isSkipped) {
      return next();
    }

    // GET, HEAD, OPTIONS 요청은 토큰 생성만
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      // 랜덤 토큰 생성
      const token = crypto.randomBytes(32).toString('hex');
      
      // 쿠키에 저장
      res.cookie('csrf-token', token, {
        httpOnly: false, // JavaScript에서 읽을 수 있어야 함
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
        maxAge: 24 * 60 * 60 * 1000,
      });

      // 토큰 생성 함수 추가
      req.csrfToken = () => token;
      
      return next();
    }

    // 상태 변경 요청 검증
    const cookieToken = req.cookies?.['csrf-token'];
    const headerToken = req.headers[config.headerName!] as string ||
                       req.body?.[config.paramName!] ||
                       req.query?.[config.paramName!] as string;

    if (!cookieToken || !headerToken) {
      logSecurity('Double submit CSRF validation failed - missing token', {
        hasCookie: !!cookieToken,
        hasHeader: !!headerToken,
        method: req.method,
        path: req.path,
        ip: req.ip,
      });
      
      return res.status(403).json({
        error: 'CSRF validation failed',
        message: 'CSRF 토큰이 필요합니다.',
      });
    }

    // 토큰 비교
    if (cookieToken !== headerToken) {
      logSecurity('Double submit CSRF validation failed - token mismatch', {
        method: req.method,
        path: req.path,
        ip: req.ip,
      });
      
      return res.status(403).json({
        error: 'CSRF validation failed',
        message: '유효하지 않은 CSRF 토큰입니다.',
      });
    }

    // 새 토큰 생성 (토큰 회전)
    const newToken = crypto.randomBytes(32).toString('hex');
    res.cookie('csrf-token', newToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    });

    req.csrfToken = () => newToken;
    
    next();
  };
}

/**
 * AJAX 요청 확인 미들웨어 (추가 보안 레이어)
 * X-Requested-With 헤더를 확인하여 AJAX 요청인지 검증
 */
export function verifyAjaxRequest(req: Request, res: Response, next: NextFunction) {
  // GET, HEAD, OPTIONS 요청은 통과
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const xRequestedWith = req.headers['x-requested-with'];
  
  if (xRequestedWith !== 'XMLHttpRequest') {
    logSecurity('Non-AJAX request blocked', {
      method: req.method,
      path: req.path,
      ip: req.ip,
      headers: req.headers,
    });
    
    return res.status(403).json({
      error: 'Invalid request',
      message: 'AJAX 요청만 허용됩니다.',
    });
  }

  next();
}

/**
 * Origin 검증 미들웨어 (추가 보안 레이어)
 */
export function verifyOrigin(allowedOrigins: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    // GET, HEAD, OPTIONS 요청은 통과
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return next();
    }

    const origin = req.headers.origin || req.headers.referer;
    
    if (!origin) {
      logSecurity('Request without origin blocked', {
        method: req.method,
        path: req.path,
        ip: req.ip,
      });
      
      return res.status(403).json({
        error: 'Invalid request',
        message: 'Origin 헤더가 필요합니다.',
      });
    }

    const isAllowed = allowedOrigins.some(allowed => 
      origin.startsWith(allowed)
    );

    if (!isAllowed) {
      logSecurity('Invalid origin blocked', {
        origin,
        method: req.method,
        path: req.path,
        ip: req.ip,
      });
      
      return res.status(403).json({
        error: 'Invalid origin',
        message: '허용되지 않은 출처입니다.',
      });
    }

    next();
  };
}

// 개발 환경용 CSRF 비활성화 옵션
export function csrfDevelopmentMode() {
  return (req: Request, res: Response, next: NextFunction) => {
    // 개발 환경에서만 작동
    if (process.env.NODE_ENV !== 'development') {
      return next();
    }

    // 더미 토큰 생성 함수
    req.csrfToken = () => 'development-csrf-token';
    
    logger.warn('CSRF protection is disabled in development mode');
    next();
  };
}