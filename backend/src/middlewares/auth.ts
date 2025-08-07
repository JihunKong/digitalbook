import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Request 타입 확장
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
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

    if (!token) {
      return res.status(401).json({ error: '인증 토큰이 필요합니다.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;

    const teacher = await prisma.teacher.findUnique({
      where: { id: decoded.id }
    });

    if (!teacher) {
      return res.status(401).json({ error: '유효하지 않은 토큰입니다.' });
    }

    req.user = {
      id: teacher.id,
      email: teacher.email,
      name: teacher.name,
      role: 'TEACHER'
    };

    next();
  } catch (error) {
    console.error('교사 인증 오류:', error);
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
      where: { token },
      include: {
        student: true
      }
    });

    if (!session) {
      return res.status(401).json({ error: '유효하지 않은 세션입니다.' });
    }

    // 세션 만료 확인
    if (new Date() > session.expiresAt) {
      await prisma.session.delete({ where: { id: session.id } });
      return res.status(401).json({ error: '세션이 만료되었습니다.' });
    }

    if (!session.student) {
      return res.status(401).json({ error: '학생 정보를 찾을 수 없습니다.' });
    }

    req.student = {
      id: session.student.id,
      name: session.student.name,
      studentId: session.student.studentId,
      classId: session.student.classId
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

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;

    if (decoded.role !== 'ADMIN') {
      return res.status(403).json({ error: '관리자 권한이 필요합니다.' });
    }

    req.user = {
      id: decoded.id,
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

// 선택적 인증 (로그인 여부만 확인)
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
      
      if (decoded.role === 'TEACHER' || decoded.role === 'ADMIN') {
        const teacher = await prisma.teacher.findUnique({
          where: { id: decoded.id }
        });

        if (teacher) {
          req.user = {
            id: teacher.id,
            email: teacher.email,
            name: teacher.name,
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