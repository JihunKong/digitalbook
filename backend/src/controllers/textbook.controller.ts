import { Request, Response, NextFunction } from 'express';
import { getDatabase } from '../config/database';
import { getRedis } from '../config/redis';
import { aiService } from '../services/ai.service';
import { AppError } from '../middlewares/errorHandler';
import { logger } from '../utils/logger';

class TextbookController {
  async getTextbooks(req: Request, res: Response, next: NextFunction) {
    try {
      const { role, userId } = req.user!;
      const prisma = getDatabase();
      
      let textbooks;
      if (role === 'TEACHER') {
        // Get teacher profile first
        const teacherProfile = await prisma.teacherProfile.findUnique({
          where: { userId }
        });
        
        if (!teacherProfile) {
          return res.json([]);
        }
        
        textbooks = await prisma.textbook.findMany({
          where: { authorId: teacherProfile.id },
          include: {
            classes: {
              include: {
                class: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        });
      } else {
        // Students see textbooks assigned to their classes
        const studentClasses = await prisma.classEnrollment.findMany({
          where: { studentId: userId },
          select: { classId: true },
        });
        
        const classIds = studentClasses.map(c => c.classId);
        
        textbooks = await prisma.textbook.findMany({
          where: {
            classes: {
              some: {
                classId: { in: classIds },
              },
            },
            isPublic: true,
          },
          include: {
            author: {
              select: { 
                user: {
                  select: { name: true }
                }
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        });
      }
      
      res.json(textbooks);
    } catch (error) {
      next(error);
    }
  }
  
  async getTextbook(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;
      const prisma = getDatabase();
      
      const textbook = await prisma.textbook.findUnique({
        where: { id },
        include: {
          author: {
            include: {
              user: {
                select: { name: true, email: true }
              }
            }
          },
          pages: {
            orderBy: { pageNumber: 'asc' }
          },
          classes: {
            include: {
              class: true
            }
          }
        },
      });
      
      if (!textbook) {
        throw new AppError('Textbook not found', 404);
      }
      
      res.json(textbook);
    } catch (error) {
      next(error);
    }
  }
  
  async createTextbook(req: Request, res: Response, next: NextFunction) {
    try {
      const { title, description, content, metadata, aiGenerated, aiModel, aiPrompt } = req.body;
      const userId = req.user!.userId;
      const prisma = getDatabase();
      
      // Get or create teacher profile
      let teacherProfile = await prisma.teacherProfile.findUnique({
        where: { userId }
      });
      
      if (!teacherProfile) {
        teacherProfile = await prisma.teacherProfile.create({
          data: {
            userId,
            school: '',
            subject: '',
            grade: '',
            bio: ''
          }
        });
      }
      
      const textbook = await prisma.textbook.create({
        data: {
          title,
          description: description || '',
          authorId: teacherProfile.id,
          content: content || {},
          metadata: metadata || {},
          aiGenerated: aiGenerated || false,
          aiModel: aiModel || null,
          aiPrompt: aiPrompt || null,
          isPublic: false
        },
      });
      
      logger.info(`Textbook created: ${textbook.id}`);
      res.status(201).json(textbook);
    } catch (error) {
      next(error);
    }
  }
  
  async updateTextbook(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;
      const prisma = getDatabase();
      
      const textbook = await prisma.textbook.findUnique({
        where: { id },
      });
      
      if (!textbook) {
        throw new AppError('Textbook not found', 404);
      }
      
      // Check if user owns this textbook via TeacherProfile
      const teacherProfile = await prisma.teacherProfile.findUnique({
        where: { userId }
      });
      
      if (!teacherProfile || textbook.authorId !== teacherProfile.id) {
        throw new AppError('Unauthorized', 403);
      }
      
      const updated = await prisma.textbook.update({
        where: { id },
        data: req.body,
      });
      
      res.json(updated);
    } catch (error) {
      next(error);
    }
  }
  
  async deleteTextbook(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;
      const prisma = getDatabase();
      
      const textbook = await prisma.textbook.findUnique({
        where: { id },
      });
      
      if (!textbook) {
        throw new AppError('Textbook not found', 404);
      }
      
      // Check if user owns this textbook via TeacherProfile
      const teacherProfile = await prisma.teacherProfile.findUnique({
        where: { userId }
      });
      
      if (!teacherProfile || textbook.authorId !== teacherProfile.id) {
        throw new AppError('Unauthorized', 403);
      }
      
      await prisma.textbook.delete({
        where: { id },
      });
      
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
  
  async generateContent(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { text, settings } = req.body;
      const userId = req.user!.userId;
      const prisma = getDatabase();
      
      const textbook = await prisma.textbook.findUnique({
        where: { id },
      });
      
      if (!textbook) {
        throw new AppError('Textbook not found', 404);
      }
      
      // Check if user owns this textbook via TeacherProfile
      const teacherProfile = await prisma.teacherProfile.findUnique({
        where: { userId }
      });
      
      if (!teacherProfile || textbook.authorId !== teacherProfile.id) {
        throw new AppError('Unauthorized', 403);
      }
      
      // Generate content using AI
      const generatedContent = await aiService.generateTextbookContent(
        text,
        settings
      );
      
      // Parse and structure the generated content
      const structuredContent = JSON.parse(generatedContent.content);
      
      // Update textbook with generated content
      const updated = await prisma.textbook.update({
        where: { id },
        data: {
          content: structuredContent,
        },
      });
      
      logger.info(`Content generated for textbook: ${id}`);
      res.json(updated);
    } catch (error) {
      next(error);
    }
  }
  
  async publishTextbook(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;
      const prisma = getDatabase();
      
      const textbook = await prisma.textbook.findUnique({
        where: { id },
      });
      
      if (!textbook) {
        throw new AppError('Textbook not found', 404);
      }
      
      // Check if user owns this textbook via TeacherProfile
      const teacherProfile = await prisma.teacherProfile.findUnique({
        where: { userId }
      });
      
      if (!teacherProfile || textbook.authorId !== teacherProfile.id) {
        throw new AppError('Unauthorized', 403);
      }
      
      const updated = await prisma.textbook.update({
        where: { id },
        data: {
          isPublic: true,
        },
      });
      
      logger.info(`Textbook published: ${id}`);
      res.json(updated);
    } catch (error) {
      next(error);
    }
  }

  async generatePageContent(req: Request, res: Response, next: NextFunction) {
    try {
      const { type, context, pageTitle } = req.body;
      
      let prompt = '';
      switch (type) {
        case 'summary':
          prompt = `다음 내용을 학생들이 이해하기 쉽게 3-4문장으로 요약해주세요:\n${context}`;
          break;
        case 'keyPoints':
          prompt = `다음 내용에서 핵심 포인트 3-5개를 추출해주세요:\n${context}`;
          break;
      }
      
      const generatedContent = await aiService.generateTextbookContent(
        type === 'summary' ? prompt : context,
        { grade: 3 }
      );
      
      res.json({ content: generatedContent });
    } catch (error) {
      next(error);
    }
  }

  async generateQuestions(req: Request, res: Response, next: NextFunction) {
    try {
      const { content, count, types, difficulty } = req.body;
      
      const prompt = `
다음 텍스트를 바탕으로 ${count}개의 문제를 생성해주세요.

텍스트: ${content}

요구사항:
- 문제 유형: ${types.join(', ')}
- 난이도: ${difficulty}
- 각 문제는 명확하고 구체적이어야 함
- 정답과 해설 포함

JSON 형식으로 반환:
[
  {
    "type": "multiple-choice",
    "question": "문제",
    "options": ["선택지1", "선택지2", "선택지3", "선택지4"],
    "correctAnswer": "option-0",
    "explanation": "해설",
    "points": 10,
    "difficulty": "${difficulty}"
  }
]
`;
      
      const response = await aiService.generateTextbookContent(
        prompt,
        { grade: 3 }
      );
      
      const questions = JSON.parse(response.content);
      res.json({ questions });
    } catch (error) {
      next(error);
    }
  }

  async trainAI(req: Request, res: Response, next: NextFunction) {
    try {
      const { textbookId, trainingData, content } = req.body;
      const userId = req.user!.userId;
      const prisma = getDatabase();
      
      // Verify ownership
      const textbook = await prisma.textbook.findUnique({
        where: { id: textbookId },
      });
      
      if (!textbook || textbook.authorId !== userId) {
        throw new AppError('Unauthorized', 403);
      }
      
      // Store training data for the textbook
      const redis = getRedis();
      const trainingKey = `training:${textbookId}:${trainingData.type}`;
      
      await redis.setex(
        trainingKey,
        60 * 60 * 24 * 30, // 30 days
        JSON.stringify({
          ...trainingData,
          timestamp: new Date().toISOString(),
        })
      );
      
      logger.info(`AI training data added for textbook: ${textbookId}`);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  // 교과서 공개 설정
  async togglePublic(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { isPublic } = req.body;
      const userId = req.user!.userId;
      const prisma = getDatabase();
      
      const textbook = await prisma.textbook.findUnique({
        where: { id },
      });
      
      if (!textbook) {
        throw new AppError('Textbook not found', 404);
      }
      
      // Check if user owns this textbook via TeacherProfile
      const teacherProfile = await prisma.teacherProfile.findUnique({
        where: { userId }
      });
      
      if (!teacherProfile || textbook.authorId !== teacherProfile.id) {
        throw new AppError('Unauthorized', 403);
      }
      
      const updated = await prisma.textbook.update({
        where: { id },
        data: {
          isPublic,
        },
      });
      
      logger.info(`Textbook public status updated: ${id}, isPublic: ${isPublic}`);
      res.json(updated);
    } catch (error) {
      next(error);
    }
  }

  // 접근 코드 생성
  async generateAccessCode(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;
      const prisma = getDatabase();
      
      const textbook = await prisma.textbook.findUnique({
        where: { id },
      });
      
      if (!textbook) {
        throw new AppError('Textbook not found', 404);
      }
      
      // Check if user owns this textbook via TeacherProfile
      const teacherProfile = await prisma.teacherProfile.findUnique({
        where: { userId }
      });
      
      if (!teacherProfile || textbook.authorId !== teacherProfile.id) {
        throw new AppError('Unauthorized', 403);
      }
      
      // Note: accessCode field doesn't exist in Textbook schema
      // This feature may need to be implemented differently
      // For now, return a generated code without storing it
      const accessCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      logger.info(`Access code generated for textbook: ${id}`);
      res.json({ accessCode });
    } catch (error) {
      next(error);
    }
  }

  // 공개 교과서 목록 조회
  async getPublicTextbooks(req: Request, res: Response, next: NextFunction) {
    try {
      const { subject, grade, search } = req.query;
      const prisma = getDatabase();
      
      const where: any = {
        isPublic: true
      };
      
      if (subject) {
        where.metadata = { ...where.metadata, subject: subject as string };
      }
      
      if (grade) {
        where.metadata = { ...where.metadata, grade: grade as string };
      }
      
      if (search) {
        where.OR = [
          { title: { contains: search as string, mode: 'insensitive' } },
          { author: { user: { name: { contains: search as string, mode: 'insensitive' } } } },
        ];
      }
      
      const textbooks = await prisma.textbook.findMany({
        where,
        include: {
          author: {
            include: {
              user: {
                select: { name: true }
              }
            }
          },
        },
        orderBy: [
          { createdAt: 'desc' },
        ],
      });
      
      res.json(textbooks);
    } catch (error) {
      next(error);
    }
  }
}

export const textbookController = new TextbookController();