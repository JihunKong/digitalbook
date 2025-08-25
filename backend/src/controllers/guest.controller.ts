import { Request, Response, NextFunction } from 'express';
import { getDatabase } from '../config/database';
import { AppError } from '../middlewares/errorHandler';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';

class GuestController {
  // 학생이 접근 코드로 교과서에 접근
  async accessTextbook(req: Request, res: Response, next: NextFunction) {
    try {
      const { accessCode, studentId, studentName } = req.body;
      const prisma = getDatabase();
      
      // 접근 코드로 교과서 찾기
      const textbook = await prisma.textbook.findUnique({
        where: { accessCode },
        include: {
          teacher: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });
      
      if (!textbook) {
        throw new AppError('Invalid access code', 404);
      }
      
      // 게스트 접근 기록 생성
      const guestAccess = await prisma.guestAccess.create({
        data: {
          id: uuidv4(),
          sessionId: uuidv4(),
          textbookId: textbook.id,
          studentName,
          studentId,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24시간 후 만료
        },
      });
      
      // JWT 토큰 생성
      const token = jwt.sign(
        {
          guestId: guestAccess.id,
          sessionId: guestAccess.sessionId,
          textbookId: textbook.id,
          isGuest: true,
        },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '24h' }
      );
      
      res.json({
        token,
        textbook: {
          id: textbook.id,
          title: textbook.title,
          description: textbook.description,
          teacher: textbook.teacher,
        },
        guestAccess: {
          id: guestAccess.id,
          sessionId: guestAccess.sessionId,
          studentName: guestAccess.studentName,
          expiresAt: guestAccess.expiresAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // 게스트 학습 기록 저장 (임시로 비활성화 - DB 스키마 필요)
  async saveStudyRecord(req: Request, res: Response, next: NextFunction) {
    try {
      // TODO: Implement guest study records when DB schema is available
      res.json({ message: 'Study record feature temporarily disabled', success: true });
    } catch (error) {
      next(error);
    }
  }
  
  // 게스트 채팅 메시지 저장 (임시로 비활성화 - DB 스키마 필요)
  async saveGuestChatMessage(req: Request, res: Response, next: NextFunction) {
    try {
      // TODO: Implement guest chat messages when DB schema is available
      res.json({ message: 'Chat message feature temporarily disabled', success: true });
    } catch (error) {
      next(error);
    }
  }

  // 게스트 진행 상황 조회
  async getProgress(req: Request, res: Response, next: NextFunction) {
    try {
      const { guestId } = req.user as any;
      const prisma = getDatabase();
      
      // 게스트 접근 정보 조회
      const guest = await prisma.guestAccess.findUnique({
        where: { id: guestId },
        include: {
          textbook: {
            select: {
              id: true,
              title: true,
              totalPages: true,
            },
          },
        },
      });
      
      if (!guest) {
        throw new AppError('Guest session not found', 404);
      }
      
      // 임시 응답 (실제 진행 상황 데이터가 구현되면 대체)
      res.json({
        textbook: guest.textbook,
        progress: {
          completedPages: 0,
          totalPages: guest.textbook.totalPages || 0,
          percentage: 0
        },
        timeSpent: 0,
        chatCount: 0,
        lastActivity: guest.createdAt
      });
    } catch (error) {
      next(error);
    }
  }
}

export const guestController = new GuestController();