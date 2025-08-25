import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getDatabase } from '../config/database';
import { getRedis } from '../config/redis';
import { AppError } from './errorHandler';
import { UserRole } from '@prisma/client';

// JWT 토큰 페이로드 타입
interface TokenPayload {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
}

// 게스트 토큰 페이로드
interface GuestTokenPayload {
  guestId: string;
  accessCode: string;
  role: 'GUEST';
}

// 확장된 Request 타입
export interface AuthRequest extends Request {
  user?: TokenPayload & { sessionId?: string };
  guest?: GuestTokenPayload;
}

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET must be defined');
}

/**
 * 기본 인증 미들웨어
 * 토큰을 검증하고 사용자 정보를 req.user에 추가
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // 토큰 추출 (쿠키 우선, 헤더 폴백)
    const token = req.cookies?.accessToken || 
                  req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new AppError('인증 토큰이 없습니다', 401);
    }

    // 토큰 검증
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload | GuestTokenPayload;

    // 게스트 토큰 처리
    if ('guestId' in decoded) {
      const prisma = getDatabase();
      const guestAccess = await prisma.guestAccess.findUnique({
        where: { id: decoded.guestId }
      });

      if (!guestAccess || guestAccess.expiresAt < new Date()) {
        throw new AppError('게스트 액세스가 만료되었습니다', 401);
      }

      req.guest = decoded;
      return next();
    }

    // 일반 사용자 토큰 처리
    const userPayload = decoded as TokenPayload;
    const prisma = getDatabase();
    
    // 사용자 존재 및 활성화 확인
    const user = await prisma.user.findUnique({
      where: { id: userPayload.userId },
      select: { id: true, isActive: true }
    });

    if (!user || !user.isActive) {
      throw new AppError('유효하지 않은 사용자입니다', 401);
    }

    // 세션 ID 확인 (있는 경우)
    const sessionId = req.cookies?.sessionId;
    if (sessionId) {
      const redis = getRedis();
      const sessionExists = await redis.exists(`session:${sessionId}`);
      
      if (!sessionExists) {
        // 세션이 없으면 쿠키 삭제
        res.clearCookie('accessToken');
        res.clearCookie('sessionId');
        throw new AppError('세션이 만료되었습니다', 401);
      }

      // 세션 활동 시간 업데이트
      await redis.expire(`session:${sessionId}`, 7 * 24 * 60 * 60);
      req.user = { ...userPayload, sessionId };
    } else {
      req.user = userPayload;
    }

    // 마지막 활동 시간 업데이트 (비동기, 응답 지연 방지)
    prisma.session.updateMany({
      where: { 
        userId: userPayload.userId,
        token: sessionId || ''
      },
      data: { lastActivity: new Date() }
    }).catch(err => console.error('Failed to update session activity:', err));

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return next(new AppError('토큰이 만료되었습니다', 401));
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new AppError('유효하지 않은 토큰입니다', 401));
    }
    next(error);
  }
};

/**
 * 선택적 인증 미들웨어
 * 토큰이 있으면 검증하고, 없어도 통과
 */
export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies?.accessToken || 
                  req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return next(); // 토큰 없어도 통과
    }

    // 토큰이 있으면 검증
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    
    const prisma = getDatabase();
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, isActive: true }
    });

    if (user && user.isActive) {
      req.user = decoded;
    }

    next();
  } catch (error) {
    // 토큰 검증 실패해도 통과 (선택적 인증)
    next();
  }
};

/**
 * 역할 기반 접근 제어 미들웨어 생성 함수
 */
export const requireRole = (...roles: UserRole[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      // 먼저 인증 확인
      if (!req.user) {
        throw new AppError('인증이 필요합니다', 401);
      }

      // 역할 확인
      if (!roles.includes(req.user.role)) {
        throw new AppError('접근 권한이 없습니다', 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * 관리자 전용 미들웨어
 */
export const requireAdmin = requireRole('ADMIN');

/**
 * 교사 이상 권한 미들웨어
 */
export const requireTeacher = requireRole('ADMIN', 'TEACHER');

/**
 * 학생 이상 권한 미들웨어
 */
export const requireStudent = requireRole('ADMIN', 'TEACHER', 'STUDENT');

/**
 * 게스트 액세스 검증 미들웨어
 */
export const validateGuestAccess = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      throw new AppError('게스트 토큰이 없습니다', 401);
    }

    const decoded = jwt.verify(token, JWT_SECRET) as GuestTokenPayload;
    
    if (decoded.role !== 'GUEST') {
      throw new AppError('유효하지 않은 게스트 토큰입니다', 401);
    }

    const prisma = getDatabase();
    const guestAccess = await prisma.guestAccess.findUnique({
      where: { id: decoded.guestId }
    });

    if (!guestAccess) {
      throw new AppError('게스트 액세스를 찾을 수 없습니다', 404);
    }

    if (guestAccess.expiresAt < new Date()) {
      throw new AppError('게스트 액세스가 만료되었습니다', 401);
    }

    // 질문 수 제한 확인
    if (guestAccess.questionsUsed >= guestAccess.maxQuestions) {
      throw new AppError('질문 한도를 초과했습니다', 403);
    }

    req.guest = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new AppError('유효하지 않은 토큰입니다', 401));
    }
    next(error);
  }
};

/**
 * 자신의 리소스에만 접근 가능하도록 하는 미들웨어
 */
export const requireOwnership = (resourceUserIdParam: string = 'userId') => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('인증이 필요합니다', 401);
      }

      const resourceUserId = req.params[resourceUserIdParam] || req.body[resourceUserIdParam];
      
      // Admin은 모든 리소스 접근 가능
      if (req.user.role === 'ADMIN') {
        return next();
      }

      // 자신의 리소스인지 확인
      if (req.user.userId !== resourceUserId) {
        throw new AppError('접근 권한이 없습니다', 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * API 키 인증 미들웨어 (외부 서비스용)
 */
export const authenticateApiKey = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const apiKey = req.headers['x-api-key'] as string;
    
    if (!apiKey) {
      throw new AppError('API 키가 없습니다', 401);
    }

    // API 키 검증 (실제로는 DB나 환경변수에서 확인)
    const validApiKeys = process.env.VALID_API_KEYS?.split(',') || [];
    
    if (!validApiKeys.includes(apiKey)) {
      throw new AppError('유효하지 않은 API 키입니다', 401);
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * 세션 검증 미들웨어
 */
export const validateSession = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const sessionId = req.cookies?.sessionId;
    
    if (!sessionId) {
      throw new AppError('세션이 없습니다', 401);
    }

    const redis = getRedis();
    const sessionData = await redis.get(`session:${sessionId}`);
    
    if (!sessionData) {
      res.clearCookie('sessionId');
      throw new AppError('유효하지 않은 세션입니다', 401);
    }

    const session = JSON.parse(sessionData);
    
    // IP 주소 검증 (선택적)
    if (process.env.VALIDATE_SESSION_IP === 'true' && session.ipAddress !== req.ip) {
      throw new AppError('세션 IP가 일치하지 않습니다', 401);
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Role-based authorization middleware
export const authorize = (role: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.user.role !== role && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

// Guest authentication middleware
export const authenticateGuest = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const guestToken = req.headers.authorization?.replace('Bearer ', '') ||
                      req.cookies?.guestToken;

    if (!guestToken) {
      return res.status(401).json({ error: 'Guest token required' });
    }

    // Simple guest token validation (you can enhance this)
    req.user = {
      id: 'guest-' + guestToken,
      email: 'guest@example.com',
      name: 'Guest User',
      role: 'GUEST' as any,
      userId: 'guest-' + guestToken,
    };

    next();
  } catch (error) {
    next(error);
  }
};