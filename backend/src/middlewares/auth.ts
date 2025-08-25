import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

// Request 타입 확장
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        name: string;
        role: 'TEACHER' | 'ADMIN';
      };
      student?: {
        id: string;
        name: string;
        studentId: string;
        classId: string;
      };
    }
  }
}

// 교사 인증 미들웨어
export const authenticateTeacher = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    // Enhanced debugging for 403 issues
    logger.info('Teacher authentication attempt', {
      path: req.path,
      method: req.method,
      hasToken: !!token,
      tokenPrefix: token ? token.substring(0, 20) + '...' : 'none',
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      headers: {
        authorization: req.headers.authorization ? 'present' : 'missing',
        contentType: req.headers['content-type'],
      }
    });

    if (!token) {
      logger.warn('Teacher auth failed: No token provided', {
        path: req.path,
        ip: req.ip
      });
      return res.status(401).json({ error: '인증 토큰이 필요합니다.' });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      logger.error('JWT_SECRET not configured');
      return res.status(500).json({ error: 'Server configuration error' });
    }
    
    const decoded = jwt.verify(token, jwtSecret) as any;
    logger.info('JWT token decoded successfully', {
      userId: decoded.userId,
      role: decoded.role,
      exp: decoded.exp,
      iat: decoded.iat
    });

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        teacherProfile: true
      }
    });

    if (!user) {
      logger.warn('Teacher auth failed: User not found in database', {
        decodedUserId: decoded.userId,
        path: req.path
      });
      return res.status(401).json({ error: '사용자를 찾을 수 없습니다.' });
    }

    if (user.role !== 'TEACHER') {
      logger.warn('Teacher auth failed: Insufficient role', {
        userId: user.id,
        userRole: user.role,
        requiredRole: 'TEACHER',
        path: req.path
      });
      return res.status(403).json({ error: '교사 권한이 필요합니다.' });
    }

    logger.info('Teacher authentication successful', {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    });

    req.user = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: 'TEACHER'
    };

    next();
  } catch (error) {
    logger.error('Teacher authentication error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      path: req.path,
      method: req.method
    });
    
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: '유효하지 않은 토큰입니다.' });
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: '토큰이 만료되었습니다.' });
    }
    
    return res.status(401).json({ error: '인증에 실패했습니다.' });
  }
};

// 학생 인증 미들웨어
export const authenticateStudent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: '세션 토큰이 필요합니다.' });
    }

    // 세션 조회
    const session = await prisma.session.findUnique({
      where: { token }
    });

    if (!session) {
      return res.status(401).json({ error: '유효하지 않은 세션입니다.' });
    }

    // 세션 만료 확인
    if (new Date() > session.expiresAt) {
      await prisma.session.delete({ where: { id: session.id } });
      return res.status(401).json({ error: '세션이 만료되었습니다.' });
    }

    // Get student info from session's userId
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        studentProfile: true
      }
    });

    if (!user || !user.studentProfile) {
      return res.status(401).json({ error: '학생 정보를 찾을 수 없습니다.' });
    }

    req.student = {
      id: user.studentProfile.id,
      name: user.name,
      studentId: user.studentProfile.studentId || '',
      classId: user.studentProfile.className || ''
    };

    // 세션 갱신 (선택사항)
    await prisma.session.update({
      where: { id: session.id },
      data: {
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24시간 연장
      }
    });

    next();
  } catch (error) {
    console.error('학생 인증 오류:', error);
    return res.status(401).json({ error: '인증에 실패했습니다.' });
  }
};

// 관리자 인증 미들웨어
export const authenticateAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: '인증 토큰이 필요합니다.' });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      logger.error('JWT_SECRET not configured');
      return res.status(500).json({ error: 'Server configuration error' });
    }
    
    const decoded = jwt.verify(token, jwtSecret) as any;

    if (decoded.role !== 'ADMIN') {
      return res.status(403).json({ error: '관리자 권한이 필요합니다.' });
    }

    req.user = {
      userId: decoded.userId || decoded.id, // Handle both old and new token formats
      email: decoded.email,
      name: decoded.name,
      role: 'ADMIN'
    };

    next();
  } catch (error) {
    console.error('관리자 인증 오류:', error);
    return res.status(401).json({ error: '인증에 실패했습니다.' });
  }
};

// 통합 사용자 인증 (교사 또는 학생)
export const authenticateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Check for token in header or cookies
    let token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      token = req.cookies?.accessToken;
    }

    if (!token) {
      return res.status(401).json({ error: '인증 토큰이 필요합니다.' });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      logger.error('JWT_SECRET not configured');
      return res.status(500).json({ error: 'Server configuration error' });
    }
    
    const decoded = jwt.verify(token, jwtSecret) as any;

    // Check if it's a teacher/admin based on ID
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        studentProfile: true,
        teacherProfile: true
      }
    });

    if (user) {
      req.user = {
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role as any
      };
      
      if (user.studentProfile) {
        req.student = {
          id: user.studentProfile.id,
          name: user.name,
          studentId: user.studentProfile.studentId,
          classId: user.studentProfile.className || ''
        };
      }
      
      return next();
    }

    return res.status(401).json({ error: '유효하지 않은 토큰입니다.' });
  } catch (error) {
    console.error('User authentication error:', error);
    return res.status(401).json({ error: '인증에 실패했습니다.' });
  }
};

// 별칭 exports for backward compatibility
export const authenticate = authenticateUser;
export const authorize = (role: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      if (user.role !== role && user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      
      next();
    } catch (error) {
      res.status(500).json({ error: 'Authorization error' });
    }
  };
};
export const authenticateToken = authenticateUser;
export const auth = authenticateUser;
export const authMiddleware = authenticateUser;

// 선택적 인증 (로그인 여부만 확인)
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (token) {
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        // In optional auth, we silently skip if JWT_SECRET is not configured
        return next();
      }
      
      const decoded = jwt.verify(token, jwtSecret) as any;
      
      if (decoded.role === 'TEACHER' || decoded.role === 'ADMIN') {
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId }
        });

        if (user) {
          req.user = {
            userId: user.id,
            email: user.email,
            name: user.name,
            role: decoded.role
          };
        }
      }
    }

    next();
  } catch (error) {
    // 토큰이 유효하지 않아도 계속 진행
    next();
  }
};

// Guest authentication function
export const authenticateGuest = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // For guest routes, no authentication required
  // Just set a guest user context if needed
  (req as any).user = { role: 'GUEST', userId: null };
  next();
};

// Role-based authorization middleware
export const requireRole = (roles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      
      logger.info('Role authorization attempt', {
        path: req.path,
        method: req.method,
        requiredRoles: roles,
        userRole: user?.role || 'none',
        userId: user?.userId || 'anonymous',
        hasUser: !!user
      });
      
      if (!user) {
        logger.warn('Role auth failed: No user context', {
          path: req.path,
          requiredRoles: roles
        });
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      if (!roles.includes(user.role)) {
        logger.warn('Role auth failed: Insufficient role', {
          path: req.path,
          userRole: user.role,
          requiredRoles: roles,
          userId: user.userId
        });
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      
      logger.info('Role authorization successful', {
        path: req.path,
        userRole: user.role,
        userId: user.userId
      });
      
      next();
    } catch (error) {
      logger.error('Role authorization error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        path: req.path,
        method: req.method
      });
      res.status(500).json({ error: 'Authorization error' });
    }
  };
};