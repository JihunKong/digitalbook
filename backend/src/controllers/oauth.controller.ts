import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { getDatabase } from '../config/database';
import { getRedis } from '../config/redis';
import { AppError } from '../middlewares/errorHandler';
import { logger } from '../utils/logger';
import { AuthProvider, UserRole } from '@prisma/client';
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
  sameSite: (process.env.NODE_ENV === 'production' ? 'strict' : 'lax') as 'strict' | 'lax',
  path: '/',
  // 프로덕션에서 도메인 설정
  ...(process.env.NODE_ENV === 'production' && {
    domain: '.xn--220bu63c.com'
  })
};

class OAuthController {
  // 토큰 생성 헬퍼 메서드
  private generateTokenPair(payload: JWTPayload): TokenPair {
    const jwtSecret = process.env.JWT_SECRET;
    const refreshSecret = process.env.JWT_REFRESH_SECRET;

    if (!jwtSecret || !refreshSecret) {
      throw new Error('JWT secrets are not configured');
    }

    const accessExpiresIn = process.env.ACCESS_TOKEN_EXPIRES || '15m';
    const refreshExpiresIn = process.env.REFRESH_TOKEN_EXPIRES || '7d';

    const accessToken = jwt.sign(
      payload as object,
      jwtSecret,
      { expiresIn: accessExpiresIn as jwt.SignOptions['expiresIn'] }
    );

    const refreshToken = jwt.sign(
      payload as object,
      refreshSecret,
      { expiresIn: refreshExpiresIn as jwt.SignOptions['expiresIn'] }
    );

    return { accessToken, refreshToken };
  }

  // Google OAuth 시작 (리디렉션)
  googleAuth = (req: Request, res: Response, next: NextFunction) => {
    // intent 파라미터를 세션에 저장 (signup/signin 구분용)
    const intent = req.query.intent as string;
    if (intent && ['signin', 'signup'].includes(intent)) {
      // 세션에 intent 저장 (쿠키나 임시 저장소 사용)
      res.cookie('auth_intent', intent, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 5 * 60 * 1000, // 5분
        sameSite: 'lax'
      });
    }
    
    passport.authenticate('google', {
      scope: ['profile', 'email']
    })(req, res, next);
  };

  // Google OAuth 콜백 처리
  async googleCallback(req: Request, res: Response, next: NextFunction) {
    passport.authenticate('google', { session: false }, async (err: any, user: any) => {
      try {
        if (err) {
          logger.error('Google OAuth callback error:', err);
          return res.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://xn--220bu63c.com'}/auth/login?error=oauth_error`);
        }

        if (!user) {
          return res.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://xn--220bu63c.com'}/auth/login?error=oauth_denied`);
        }

        // intent 쿠키에서 읽기
        const intent = req.cookies.auth_intent || 'signin';
        
        // intent 쿠키 삭제
        res.clearCookie('auth_intent');

        // 기존 사용자인 경우 (needsSetup이 없는 경우)
        if (!user.needsSetup) {
          // Sign Up 의도로 왔지만 이미 계정이 있는 경우
          if (intent === 'signup') {
            return res.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://xn--220bu63c.com'}/auth/login?error=account_exists&message=이미 등록된 Google 계정입니다. 로그인을 시도하세요.`);
          }
          // 세션 생성
          const sessionId = uuidv4();
          const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

          const prisma = getDatabase();
          await prisma.session.create({
            data: {
              id: sessionId,
              token: sessionId,
              userId: user.id,
              expiresAt,
              ipAddress: req.ip,
              userAgent: req.headers['user-agent'],
            },
          });

          // JWT 토큰 생성
          const { accessToken, refreshToken } = this.generateTokenPair({
            userId: user.id,
            email: user.email,
            role: user.role,
            sessionId,
          });

          // Redis에 리프레시 토큰 저장
          const redis = getRedis();
          await redis.setex(
            `refresh:${user.id}:${sessionId}`,
            7 * 24 * 60 * 60,
            refreshToken
          );

          // 쿠키 설정
          res.cookie('accessToken', accessToken, {
            ...cookieOptions,
            maxAge: 15 * 60 * 1000, // 15분
          });

          res.cookie('refreshToken', refreshToken, {
            ...cookieOptions,
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7일
          });

          // 활동 로그 기록
          await prisma.userActivity.create({
            data: {
              userId: user.id,
              action: 'login',
              details: {
                method: 'google_oauth',
                timestamp: new Date().toISOString(),
              },
              ipAddress: req.ip,
              userAgent: req.headers['user-agent'],
            },
          });

          logger.info(`Google OAuth login success: ${user.email}`);
          
          // 역할에 따라 리디렉션
          const redirectUrl = user.role === UserRole.TEACHER || user.role === UserRole.ADMIN 
            ? '/teacher/dashboard' 
            : '/student/dashboard';
          
          return res.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://xn--220bu63c.com'}${redirectUrl}`);
        }

        // 새 사용자인 경우 - 역할 선택과 약관 동의가 필요
        if (intent === 'signin') {
          return res.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://xn--220bu63c.com'}/auth/login?error=account_not_found&message=등록되지 않은 Google 계정입니다. 회원가입을 먼저 해주세요.`);
        }

        // Sign Up 의도인 경우에만 계정 생성 진행
        // 임시 토큰 생성 (15분)
        const tempToken = jwt.sign(
          { 
            googleProfile: user.googleProfile,
            email: user.email,
            name: user.name,
            type: 'google_setup',
            intent: 'signup'
          },
          process.env.JWT_SECRET!,
          { expiresIn: '15m' }
        );

        // 역할 선택 페이지로 리디렉션
        res.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://xn--220bu63c.com'}/auth/google-setup?token=${tempToken}`);

      } catch (error) {
        logger.error('Google callback processing error:', error);
        next(error);
      }
    })(req, res, next);
  }

  // 역할 선택 및 계정 생성 완료
  async completeGoogleSetup(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, role, termsAccepted } = req.body;

      if (!token || !role || !termsAccepted) {
        throw new AppError('필수 정보가 누락되었습니다.', 400);
      }

      // 역할 검증
      if (!Object.values(UserRole).includes(role)) {
        throw new AppError('유효하지 않은 사용자 역할입니다.', 400);
      }

      // 임시 토큰 검증
      let decoded: any;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        if (decoded.type !== 'google_setup') {
          throw new Error('Invalid token type');
        }
      } catch (error) {
        throw new AppError('유효하지 않은 설정 토큰입니다.', 400);
      }

      const prisma = getDatabase();
      
      // 이미 등록된 이메일인지 확인
      const existingUser = await prisma.user.findUnique({
        where: { email: decoded.email },
      });

      if (existingUser) {
        throw new AppError('이미 등록된 이메일입니다.', 400);
      }

      // 트랜잭션으로 사용자 생성
      const result = await prisma.$transaction(async (tx: any) => {
        const user = await tx.user.create({
          data: {
            email: decoded.email,
            name: decoded.name,
            role,
            provider: AuthProvider.GOOGLE,
            providerId: decoded.googleProfile.id,
            termsAcceptedAt: new Date(),
            isActive: true,
          },
        });

        // 역할별 프로필 생성
        if (role === UserRole.TEACHER) {
          await tx.teacherProfile.create({
            data: {
              userId: user.id,
              school: null,
              subject: null,
              grade: null,
              bio: null,
            },
          });
        } else if (role === UserRole.STUDENT) {
          await tx.studentProfile.create({
            data: {
              userId: user.id,
              studentId: null,
              school: null,
              grade: null,
              className: null,
            },
          });
        }

        // 세션 생성
        const sessionId = uuidv4();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

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
      const redis = getRedis();
      await redis.setex(
        `refresh:${result.user.id}:${result.sessionId}`,
        7 * 24 * 60 * 60,
        refreshToken
      );

      // 쿠키 설정
      res.cookie('accessToken', accessToken, {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000,
      });

      res.cookie('refreshToken', refreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      // 활동 로그 기록
      await prisma.userActivity.create({
        data: {
          userId: result.user.id,
          action: 'register',
          details: {
            method: 'google_oauth',
            role: result.user.role,
            timestamp: new Date().toISOString(),
          },
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        },
      });

      logger.info(`Google OAuth registration complete: ${result.user.email} as ${role}`);

      res.status(201).json({
        message: 'Google 계정 설정이 완료되었습니다.',
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          role: result.user.role,
        },
      });

    } catch (error) {
      logger.error('Google setup completion error:', error);
      
      // Send more detailed error response
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          error: error.message
        });
      }
      
      // Handle Prisma errors specifically
      if ((error as any).code === 'P2021') {
        return res.status(500).json({
          error: '데이터베이스 스키마 오류가 발생했습니다.',
          message: 'Database schema mismatch. Please contact administrator.',
          details: (error as any).meta
        });
      }
      
      return res.status(500).json({
        error: 'Google 계정 설정 중 오류가 발생했습니다.',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

export const oauthController = new OAuthController();