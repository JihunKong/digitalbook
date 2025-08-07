import { Request, Response, NextFunction } from 'express';
import Tokens from 'csrf';
import crypto from 'crypto';
import { logger, logSecurity } from '../utils/logger';
import { redisClient } from '../config/redis';

/**
 * Redis 기반 CSRF 보호 미들웨어
 * 프로덕션 환경에서 확장 가능한 CSRF 토큰 관리
 */

const tokens = new Tokens();

// CSRF 설정
interface CSRFConfig {
  skipRoutes?: string[];
  cookieName?: string;
  headerName?: string;
  paramName?: string;
  tokenExpiry?: number;
  redisPrefix?: string;
}

const defaultConfig: CSRFConfig = {
  skipRoutes: [
    '/api/auth/login',
    '/api/auth/signup',
    '/api/auth/refresh',
    '/api/auth/logout',
    '/api/health',
    '/api/guest/access',
    '/api/csrf/token',
    '/api/webhook',
  ],
  cookieName: '_csrf',
  headerName: 'x-csrf-token',
  paramName: '_csrf',
  tokenExpiry: 24 * 60 * 60, // 24시간 (초 단위)
  redisPrefix: 'csrf:',
};

/**
 * Redis에 CSRF Secret 저장
 */
async function storeCSRFSecret(
  sessionId: string,
  secret: string,
  expiry: number,
  prefix: string
): Promise<void> {
  const key = `${prefix}${sessionId}`;
  await redisClient.setex(key, expiry, secret);
}

/**
 * Redis에서 CSRF Secret 가져오기
 */
async function getCSRFSecret(
  sessionId: string,
  prefix: string
): Promise<string | null> {
  const key = `${prefix}${sessionId}`;
  return await redisClient.get(key);
}

/**
 * Redis에서 CSRF Secret 삭제
 */
async function deleteCSRFSecret(
  sessionId: string,
  prefix: string
): Promise<void> {
  const key = `${prefix}${sessionId}`;
  await redisClient.del(key);
}

/**
 * 세션 ID 생성 또는 가져오기
 */
function getOrCreateSessionId(req: Request, res: Response): string {
  // 기존 세션 ID 확인
  let sessionId = req.signedCookies?.['csrf-session'] || 
                  req.cookies?.['csrf-session'] ||
                  req.session?.id; // Express session이 있는 경우

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
 * Redis 기반 CSRF 보호 미들웨어
 */
export function csrfProtectionRedis(customConfig?: CSRFConfig) {
  const config = { ...defaultConfig, ...customConfig };

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 제외할 경로 확인
      const isSkipped = config.skipRoutes?.some(route => 
        req.path.startsWith(route) || req.path === route
      );

      if (isSkipped) {
        return next();
      }

      // 세션 ID 가져오기 또는 생성
      const sessionId = getOrCreateSessionId(req, res);

      // GET, HEAD, OPTIONS 요청은 토큰 생성만
      if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        // CSRF secret 가져오기 또는 생성
        let secret = await getCSRFSecret(sessionId, config.redisPrefix!);
        
        if (!secret) {
          secret = tokens.secretSync();
          await storeCSRFSecret(
            sessionId,
            secret,
            config.tokenExpiry!,
            config.redisPrefix!
          );
        }

        // 토큰 생성 함수 추가
        req.csrfToken = () => {
          const token = tokens.create(secret);
          res.setHeader('X-CSRF-Token', token);
          return token;
        };

        req.csrfSecret = secret;
        return next();
      }

      // 상태 변경 요청 검증
      const secret = await getCSRFSecret(sessionId, config.redisPrefix!);
      
      if (!secret) {
        logSecurity('CSRF validation failed - no secret in Redis', {
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

      // 토큰 추출
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
      const isValid = tokens.verify(secret, token);
      
      if (!isValid) {
        logSecurity('CSRF token invalid', {
          method: req.method,
          path: req.path,
          ip: req.ip,
        });
        
        return res.status(403).json({
          error: 'Invalid CSRF token',
          message: '유효하지 않은 CSRF 토큰입니다.',
        });
      }

      // 토큰 회전 (선택적)
      if (process.env.CSRF_ROTATE_TOKENS === 'true') {
        const newSecret = tokens.secretSync();
        await storeCSRFSecret(
          sessionId,
          newSecret,
          config.tokenExpiry!,
          config.redisPrefix!
        );
        
        req.csrfToken = () => {
          const newToken = tokens.create(newSecret);
          res.setHeader('X-CSRF-Token', newToken);
          return newToken;
        };
        
        req.csrfSecret = newSecret;
      } else {
        req.csrfToken = () => {
          const newToken = tokens.create(secret);
          res.setHeader('X-CSRF-Token', newToken);
          return newToken;
        };
        
        req.csrfSecret = secret;
      }

      next();
    } catch (error) {
      logger.error('CSRF middleware error:', error);
      
      // Redis 오류 시 보안을 위해 요청 거부
      if (process.env.NODE_ENV === 'production') {
        return res.status(503).json({
          error: 'Service temporarily unavailable',
          message: '일시적인 서비스 오류가 발생했습니다.',
        });
      }
      
      // 개발 환경에서는 에러 정보 표시
      return res.status(500).json({
        error: 'CSRF middleware error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };
}

/**
 * CSRF 토큰 무효화 (로그아웃 시 사용)
 */
export async function invalidateCSRFToken(
  sessionId: string,
  prefix: string = 'csrf:'
): Promise<void> {
  try {
    await deleteCSRFSecret(sessionId, prefix);
    logger.info(`CSRF token invalidated for session: ${sessionId}`);
  } catch (error) {
    logger.error('Error invalidating CSRF token:', error);
  }
}

/**
 * 모든 CSRF 토큰 정리 (크론 작업용)
 */
export async function cleanupExpiredCSRFTokens(
  prefix: string = 'csrf:'
): Promise<number> {
  try {
    const pattern = `${prefix}*`;
    const keys = await redisClient.keys(pattern);
    
    if (keys.length === 0) {
      return 0;
    }

    // TTL이 설정되어 있으므로 Redis가 자동으로 만료된 키를 제거함
    // 여기서는 추가 정리 로직 구현 가능
    
    logger.info(`CSRF token cleanup checked ${keys.length} keys`);
    return keys.length;
  } catch (error) {
    logger.error('Error cleaning up CSRF tokens:', error);
    return 0;
  }
}

/**
 * CSRF 통계 수집
 */
export async function getCSRFStats(
  prefix: string = 'csrf:'
): Promise<{
  totalTokens: number;
  memoryUsage: string;
}> {
  try {
    const keys = await redisClient.keys(`${prefix}*`);
    const info = await redisClient.info('memory');
    
    const memoryMatch = info.match(/used_memory_human:([^\r\n]+)/);
    const memoryUsage = memoryMatch ? memoryMatch[1] : 'unknown';
    
    return {
      totalTokens: keys.length,
      memoryUsage,
    };
  } catch (error) {
    logger.error('Error getting CSRF stats:', error);
    return {
      totalTokens: 0,
      memoryUsage: 'unknown',
    };
  }
}

/**
 * Rate limiting per session for CSRF token generation
 */
export async function checkCSRFRateLimit(
  sessionId: string,
  maxRequests: number = 10,
  windowSeconds: number = 60
): Promise<boolean> {
  try {
    const key = `csrf-rate:${sessionId}`;
    const current = await redisClient.incr(key);
    
    if (current === 1) {
      await redisClient.expire(key, windowSeconds);
    }
    
    if (current > maxRequests) {
      logSecurity('CSRF rate limit exceeded', {
        sessionId,
        requests: current,
        limit: maxRequests,
      });
      return false;
    }
    
    return true;
  } catch (error) {
    logger.error('Error checking CSRF rate limit:', error);
    return true; // 에러 시 통과 (가용성 우선)
  }
}