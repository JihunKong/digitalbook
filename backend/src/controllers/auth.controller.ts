import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDatabase } from '../config/database';
import { getRedis } from '../config/redis';
import { config } from '../config/env.validation';
import { AppError } from '../middlewares/errorHandler';
import { logger } from '../utils/logger';
import { UserRole } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

// JWT 페이로드 타입 정의
interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  sessionId?: string;
}

// 토큰 타입
interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

// 쿠키 옵션
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/'
};

class AuthController {
  // 토큰 생성 헬퍼 메서드
  private generateTokenPair(payload: JWTPayload): TokenPair {
    const accessToken = jwt.sign(
      payload as object,
      config.JWT_SECRET as string,
      { expiresIn: config.ACCESS_TOKEN_EXPIRES }
    );
    
    const refreshToken = jwt.sign(
      payload as object,
      config.JWT_REFRESH_SECRET as string,
      { expiresIn: config.REFRESH_TOKEN_EXPIRES }
    );
    
    return { accessToken, refreshToken };
  }

  // 역할별 프로필 생성 헬퍼 메서드
  private async createRoleProfile(
    prisma: any,
    userId: string,
    role: UserRole,
    profileData: any
  ) {
    switch (role) {
      case UserRole.TEACHER:
        return await prisma.teacherProfile.create({
          data: {
            userId,
            school: profileData.school,
            subject: profileData.subject,
            grade: profileData.grade,
            bio: profileData.bio,
          },
        });
      
      case UserRole.STUDENT:
        return await prisma.studentProfile.create({
          data: {
            userId,
            studentId: profileData.studentId,
            school: profileData.school,
            grade: profileData.grade,
            className: profileData.className,
          },
        });
      
      case UserRole.ADMIN:
        return await prisma.adminProfile.create({
          data: {
            userId,
            department: profileData.department,
            permissions: profileData.permissions || {},
          },
        });
      
      default:
        return null;
    }
  }

  async register(req: Request, res: Response, next: NextFunction) {
    const prisma = getDatabase();
    const redis = getRedis();
    
    try {
      const { email, password, name, role, profileData } = req.body;
      
      // 입력 검증
      if (!email || !password || !name || !role) {
        throw new AppError('Missing required fields', 400);
      }
      
      // 역할 검증
      if (!Object.values(UserRole).includes(role)) {
        throw new AppError('Invalid role', 400);
      }
      
      // 기존 사용자 확인
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });
      
      if (existingUser) {
        throw new AppError('User already exists', 400);
      }
      
      // 비밀번호 해싱
      const hashedPassword = await bcrypt.hash(password, 12);
      
      // 트랜잭션으로 사용자 및 프로필 생성
      const result = await prisma.$transaction(async (tx: any) => {
        // 사용자 생성
        const user = await tx.user.create({
          data: {
            email,
            password: hashedPassword,
            name,
            role,
            isActive: true,
          },
        });
        
        // 역할별 프로필 생성
        if (role !== UserRole.GUEST && profileData) {
          await this.createRoleProfile(tx, user.id, role, profileData);
        }
        
        // 세션 생성
        const sessionId = uuidv4();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7일
        
        await tx.session.create({
          data: {
            id: sessionId,
            token: sessionId,
            userId: user.id,
            expiresAt,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
          },
        });
        
        return { user, sessionId };
      });
      
      // JWT 토큰 생성
      const { accessToken, refreshToken } = this.generateTokenPair({
        userId: result.user.id,
        email: result.user.email,
        role: result.user.role,
        sessionId: result.sessionId,
      });
      
      // Redis에 리프레시 토큰 저장
      await redis.setex(
        `refresh:${result.user.id}:${result.sessionId}`,
        7 * 24 * 60 * 60,
        refreshToken
      );
      
      // httpOnly 쿠키 설정
      res.cookie('accessToken', accessToken, {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000, // 15분
      });
      
      res.cookie('refreshToken', refreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7일
      });
      
      logger.info(`User registered: ${email} with role ${role}`);
      
      res.status(201).json({
        message: 'User registered successfully',
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          role: result.user.role,
        },
      });
    } catch (error) {
      logger.error('Registration error:', error);
      next(error);
    }
  }
  
  async login(req: Request, res: Response, next: NextFunction) {
    const prisma = getDatabase();
    const redis = getRedis();
    
    try {
      const { email, password } = req.body;
      
      // 입력 검증
      if (!email || !password) {
        throw new AppError('Email and password are required', 400);
      }
      
      // 사용자 조회 (먼저 기본 정보만)
      const user = await prisma.user.findUnique({
        where: { email },
      });
      
      if (!user) {
        throw new AppError('Invalid credentials', 401);
      }
      
      // 역할에 따른 프로필 포함하여 다시 조회
      const userWithProfile = await prisma.user.findUnique({
        where: { email },
        include: {
          teacherProfile: user.role === UserRole.TEACHER,
          studentProfile: user.role === UserRole.STUDENT,
          adminProfile: user.role === UserRole.ADMIN,
        },
      });
      
      // 계정 활성화 확인
      if (!userWithProfile.isActive) {
        throw new AppError('Account is deactivated', 403);
      }
      
      // 비밀번호 검증 (소셜 로그인이나 게스트는 비밀번호가 없을 수 있음)
      if (userWithProfile.password) {
        const isPasswordValid = await bcrypt.compare(password, userWithProfile.password);
        
        if (!isPasswordValid) {
          throw new AppError('Invalid credentials', 401);
        }
      } else if (userWithProfile.role !== UserRole.GUEST) {
        throw new AppError('Please use social login', 400);
      }
      
      // 기존 세션 정리 (선택적)
      const existingSessions = await prisma.session.findMany({
        where: {
          userId: userWithProfile.id,
          expiresAt: { gt: new Date() },
        },
      });
      
      // 최대 세션 수 제한 (예: 5개)
      if (existingSessions.length >= 5) {
        // 가장 오래된 세션 삭제
        const oldestSession = existingSessions.sort(
          (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
        )[0];
        
        await prisma.session.delete({
          where: { id: oldestSession.id },
        });
        
        await redis.del(`refresh:${userWithProfile.id}:${oldestSession.id}`);
      }
      
      // 새 세션 생성
      const sessionId = uuidv4();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      
      await prisma.session.create({
        data: {
          id: sessionId,
          token: sessionId,
          userId: userWithProfile.id,
          expiresAt,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        },
      });
      
      // JWT 토큰 생성
      const { accessToken, refreshToken } = this.generateTokenPair({
        userId: userWithProfile.id,
        email: userWithProfile.email,
        role: userWithProfile.role,
        sessionId,
      });
      
      // Redis에 리프레시 토큰 저장
      await redis.setex(
        `refresh:${userWithProfile.id}:${sessionId}`,
        7 * 24 * 60 * 60,
        refreshToken
      );
      
      // 마지막 로그인 시간 업데이트
      await prisma.user.update({
        where: { id: userWithProfile.id },
        data: { lastLoginAt: new Date() },
      });
      
      // 활동 로그 기록
      await prisma.userActivity.create({
        data: {
          userId: userWithProfile.id,
          action: 'login',
          details: {
            method: 'password',
            timestamp: new Date().toISOString(),
          },
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        },
      });
      
      // httpOnly 쿠키 설정
      res.cookie('accessToken', accessToken, {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000,
      });
      
      res.cookie('refreshToken', refreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      
      logger.info(`User logged in: ${userWithProfile.email}`);
      
      // 프로필 정보 포함한 응답
      const profile = userWithProfile.teacherProfile || userWithProfile.studentProfile || userWithProfile.adminProfile;
      
      res.json({
        message: 'Login successful',
        user: {
          id: userWithProfile.id,
          email: userWithProfile.email,
          name: userWithProfile.name,
          role: userWithProfile.role,
          profile,
        },
      });
    } catch (error) {
      logger.error('Login error:', error);
      next(error);
    }
  }
  
  async refreshToken(req: Request, res: Response, next: NextFunction) {
    const prisma = getDatabase();
    const redis = getRedis();
    
    try {
      // 쿠키에서 리프레시 토큰 가져오기
      const refreshToken = req.cookies.refreshToken;
      
      if (!refreshToken) {
        throw new AppError('Refresh token required', 401);
      }
      
      // 리프레시 토큰 검증
      let decoded: JWTPayload;
      try {
        decoded = jwt.verify(
          refreshToken,
          config.JWT_REFRESH_SECRET
        ) as JWTPayload;
      } catch (error) {
        throw new AppError('Invalid refresh token', 401);
      }
      
      // Redis에서 저장된 토큰 확인
      const storedToken = await redis.get(
        `refresh:${decoded.userId}:${decoded.sessionId}`
      );
      
      if (!storedToken || storedToken !== refreshToken) {
        throw new AppError('Invalid refresh token', 401);
      }
      
      // 세션 유효성 확인
      const session = await prisma.session.findUnique({
        where: { id: decoded.sessionId },
        include: { user: true },
      });
      
      if (!session || session.expiresAt < new Date()) {
        throw new AppError('Session expired', 401);
      }
      
      // 사용자 활성화 상태 확인
      if (!session.user.isActive) {
        throw new AppError('Account is deactivated', 403);
      }
      
      // 새 액세스 토큰 생성
      const newAccessToken = jwt.sign(
        {
          userId: session.user.id,
          email: session.user.email,
          role: session.user.role,
          sessionId: session.id,
        } as object,
        config.JWT_SECRET as string,
        { expiresIn: config.ACCESS_TOKEN_EXPIRES }
      );
      
      // 세션 활동 시간 업데이트
      await prisma.session.update({
        where: { id: session.id },
        data: { lastActivity: new Date() },
      });
      
      // 새 액세스 토큰을 쿠키에 설정
      res.cookie('accessToken', newAccessToken, {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000,
      });
      
      res.json({
        message: 'Token refreshed successfully',
        user: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          role: session.user.role,
        },
      });
    } catch (error) {
      logger.error('Token refresh error:', error);
      next(error);
    }
  }
  
  async logout(req: Request, res: Response, next: NextFunction) {
    const prisma = getDatabase();
    const redis = getRedis();
    
    try {
      // 쿠키에서 액세스 토큰 가져오기
      const accessToken = req.cookies.accessToken;
      
      if (accessToken) {
        try {
          const decoded = jwt.verify(
            accessToken,
            config.JWT_SECRET
          ) as JWTPayload;
          
          // 세션 삭제
          if (decoded.sessionId) {
            await prisma.session.delete({
              where: { id: decoded.sessionId },
            }).catch(() => {
              // 세션이 이미 없어도 계속 진행
            });
            
            // Redis에서 리프레시 토큰 삭제
            await redis.del(`refresh:${decoded.userId}:${decoded.sessionId}`);
          }
          
          // 활동 로그 기록
          await prisma.userActivity.create({
            data: {
              userId: decoded.userId,
              action: 'logout',
              details: {
                timestamp: new Date().toISOString(),
              },
              ipAddress: req.ip,
              userAgent: req.headers['user-agent'],
            },
          }).catch(() => {
            // 로그 실패해도 로그아웃은 계속
          });
        } catch (error) {
          // 토큰 검증 실패해도 쿠키는 삭제
        }
      }
      
      // 쿠키 삭제
      res.clearCookie('accessToken', cookieOptions);
      res.clearCookie('refreshToken', cookieOptions);
      
      res.json({ message: 'Logout successful' });
    } catch (error) {
      logger.error('Logout error:', error);
      next(error);
    }
  }

  // 게스트 액세스 생성
  async createGuestAccess(req: Request, res: Response, next: NextFunction) {
    const prisma = getDatabase();
    
    try {
      const { textbookId, duration = 24 } = req.body; // duration in hours
      
      // 6자리 액세스 코드 생성
      const accessCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      // 게스트 사용자 생성
      const guestUser = await prisma.user.create({
        data: {
          email: `guest_${accessCode}@temporary.com`,
          name: `Guest ${accessCode}`,
          role: UserRole.GUEST,
          password: null,
        },
      });
      
      // 게스트 액세스 기록 생성
      const guestAccess = await prisma.guestAccess.create({
        data: {
          accessCode,
          textbookId,
          expiresAt: new Date(Date.now() + duration * 60 * 60 * 1000),
          maxQuestions: 50,
        },
      });
      
      // 세션 생성
      const sessionId = uuidv4();
      await prisma.session.create({
        data: {
          id: sessionId,
          token: sessionId,
          userId: guestUser.id,
          expiresAt: new Date(Date.now() + duration * 60 * 60 * 1000),
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        },
      });
      
      // JWT 토큰 생성
      const { accessToken, refreshToken } = this.generateTokenPair({
        userId: guestUser.id,
        email: guestUser.email,
        role: UserRole.GUEST,
        sessionId,
      });
      
      // 쿠키 설정
      res.cookie('accessToken', accessToken, {
        ...cookieOptions,
        maxAge: duration * 60 * 60 * 1000,
      });
      
      res.cookie('refreshToken', refreshToken, {
        ...cookieOptions,
        maxAge: duration * 60 * 60 * 1000,
      });
      
      logger.info(`Guest access created: ${accessCode}`);
      
      res.status(201).json({
        message: 'Guest access created',
        accessCode,
        expiresAt: guestAccess.expiresAt,
        user: {
          id: guestUser.id,
          name: guestUser.name,
          role: guestUser.role,
        },
      });
    } catch (error) {
      logger.error('Guest access creation error:', error);
      next(error);
    }
  }

  // 현재 사용자 정보 조회
  async getCurrentUser(req: Request, res: Response, next: NextFunction) {
    const prisma = getDatabase();
    
    try {
      // 미들웨어에서 설정한 사용자 정보 사용
      const userId = (req as any).userId;
      
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }
      
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          teacherProfile: true,
          studentProfile: true,
          adminProfile: true,
        },
      });
      
      if (!user) {
        throw new AppError('User not found', 404);
      }
      
      const profile = user.teacherProfile || user.studentProfile || user.adminProfile;
      
      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          profile,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();