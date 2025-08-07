import { Request, Response, NextFunction } from 'express';
import { getDatabase } from '../config/database';
import { aiService } from '../services/ai.service';
import { AppError } from '../middlewares/errorHandler';
import { logger } from '../utils/logger';
import { io } from '../index';

class ChatController {
  async sendMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const { message, sessionId, pageContent, pageNumber, textbookTitle } = req.body;
      const user = req.user as any;
      const prisma = getDatabase();
      
      let userMessage;
      let assistantMessage;
      
      // Check if guest user
      if (user.isGuest) {
        // Save guest user message
        userMessage = await prisma.guestChatMessage.create({
          data: {
            guestId: user.guestId,
            role: 'USER',
            content: message,
            context: {
              pageContent,
              pageNumber,
              textbookTitle,
            },
          },
        });
      } else {
        // Save regular user message
        userMessage = await prisma.chatMessage.create({
          data: {
            userId: user.userId,
            sessionId,
            role: 'USER',
            content: message,
            context: {
              pageContent,
              pageNumber,
              textbookTitle,
            },
          },
        });
      }
      
      // Get AI response using GPT-4o-mini
      const aiResponse = await aiService.chatWithTutor(
        message,
        {
          pageContent,
          pageNumber,
          textbookTitle,
        },
        sessionId
      );
      
      // Save AI response
      if (user.isGuest) {
        assistantMessage = await prisma.guestChatMessage.create({
          data: {
            guestId: user.guestId,
            role: 'ASSISTANT',
            content: aiResponse,
            context: {
              pageContent,
              pageNumber,
              textbookTitle,
            },
          },
        });
      } else {
        assistantMessage = await prisma.chatMessage.create({
          data: {
            userId: user.userId,
            sessionId,
            role: 'ASSISTANT',
            content: aiResponse,
            context: {
              pageContent,
              pageNumber,
              textbookTitle,
            },
          },
        });
      }
      
      // Emit to socket for real-time update
      io.to(`session:${sessionId}`).emit('new-message', assistantMessage);
      
      logger.info(`Chat message processed for session: ${sessionId}`);
      res.json({
        userMessage,
        assistantMessage,
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
        messages = await prisma.guestChatMessage.findMany({
          where: {
            guestId: user.guestId,
          },
          orderBy: {
            createdAt: 'asc',
          },
          take: 50, // Last 50 messages
        });
      } else {
        messages = await prisma.chatMessage.findMany({
          where: {
            userId: user.userId,
            sessionId,
          },
          orderBy: {
            createdAt: 'asc',
          },
          take: 50, // Last 50 messages
        });
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