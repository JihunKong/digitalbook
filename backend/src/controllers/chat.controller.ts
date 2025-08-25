import { Request, Response, NextFunction } from 'express';
import { getDatabase } from '../config/database';
import { aiService } from '../services/ai.service';
import { AppError } from '../middlewares/errorHandler';
import { logger } from '../utils/logger';
import { io } from '../index';

class ChatController {
  async sendMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const { message, sessionId, pageContent, pageNumber, textbookTitle, pdfId } = req.body;
      const user = req.user as any;
      const userId = (req as any).userId;
      const prisma = getDatabase();
      
      let aiResponse;
      
      // Check if PDF context is available
      if (pdfId && pageNumber) {
        // Use enhanced PDF context chat
        aiResponse = await aiService.chatWithPDFContext(
          message,
          pdfId,
          pageNumber,
          userId
        );
      } else {
        // Use regular chat with provided context
        aiResponse = await aiService.chatWithTutor(
          message,
          {
            pageContent,
            pageNumber,
            textbookTitle,
          },
          sessionId || `user-${userId}`
        );
      }
      
      // Track the question in database (already done in chatWithPDFContext if PDF context used)
      if (!pdfId) {
        await prisma.question.create({
          data: {
            studentId: userId,
            question: message,
            aiResponse: aiResponse,
            context: {
              pageContent: pageContent?.substring(0, 500),
              pageNumber,
              textbookTitle,
            },
            questionType: 'KNOWLEDGE',
            aiModel: 'gpt-4o-mini'
          }
        });
      }
      
      // Emit to socket for real-time update (if socket.io is enabled)
      try {
        io.to(`session:${sessionId}`).emit('new-message', {
          role: 'assistant',
          content: aiResponse,
          timestamp: new Date()
        });
      } catch (socketError) {
        logger.warn('Socket.io not available:', socketError);
      }
      
      logger.info(`Chat message processed for user: ${userId}`);
      res.json({
        userMessage: {
          role: 'user',
          content: message,
          timestamp: new Date()
        },
        assistantMessage: {
          role: 'assistant',
          content: aiResponse,
          timestamp: new Date()
        }
      });
    } catch (error) {
      next(error);
    }
  }
  
  async getChatHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const { sessionId } = req.params;
      const user = req.user as any;
      const prisma = getDatabase();
      
      let messages;
      
      if (user.isGuest) {
        // TODO: Implement guestChatMessage model or use alternative storage
        messages = []; // Temporary empty array
        // messages = await prisma.guestChatMessage.findMany({
        //   where: {
        //     guestId: user.guestId,
        //   },
        //   orderBy: {
        //     createdAt: 'asc',
        //   },
        //   take: 50, // Last 50 messages
        // });
      } else {
        // TODO: Implement chatMessage model or use alternative storage
        messages = []; // Temporary empty array
        // messages = await prisma.chatMessage.findMany({
        //   where: {
        //     userId: user.userId,
        //     sessionId,
        //   },
        //   orderBy: {
        //     createdAt: 'asc',
        //   },
        //   take: 50, // Last 50 messages
        // });
      }
      
      res.json(messages);
    } catch (error) {
      next(error);
    }
  }
  
  async getSuggestions(req: Request, res: Response, next: NextFunction) {
    try {
      const { pageContent, currentTopic } = req.body;
      
      // Generate contextual suggestions based on current content
      const suggestions = [
        `${currentTopic}의 핵심 개념을 설명해주세요`,
        `${currentTopic}와 관련된 예시를 들어주세요`,
        '이 내용을 실생활에 어떻게 적용할 수 있나요?',
        '더 깊이 있게 공부하려면 어떻게 해야 하나요?',
        '이 부분에서 자주 틀리는 실수는 무엇인가요?',
      ];
      
      res.json({ suggestions });
    } catch (error) {
      next(error);
    }
  }
}

export const chatController = new ChatController();