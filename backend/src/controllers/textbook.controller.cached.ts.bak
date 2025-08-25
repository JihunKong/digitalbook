import { Request, Response, NextFunction } from 'express';
import { getDatabase } from '../config/database';
import { cacheService, CacheService } from '../services/cache.service';
import { Cacheable, CacheInvalidate } from '../decorators/cache.decorator';
import { aiService } from '../services/ai.service';
import { AppError } from '../middlewares/errorHandler';
import { logger } from '../utils/logger';

class CachedTextbookController {
  private readonly CACHE_PREFIX = CacheService.PREFIXES.TEXTBOOK;
  private readonly CACHE_TTL = CacheService.TTL.MEDIUM;

  async getTextbooks(req: Request, res: Response, next: NextFunction) {
    try {
      const { role, userId } = req.user!;
      const cacheKey = cacheService.createKey(this.CACHE_PREFIX, 'list', userId, role);
      
      // Try cache first
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        res.setHeader('X-Cache', 'HIT');
        return res.json(cached);
      }

      const prisma = getDatabase();
      
      let textbooks;
      if (role === 'TEACHER') {
        textbooks = await prisma.textbook.findMany({
          where: { teacherId: userId },
          include: {
            classes: {
              include: {
                class: true,
              },
            },
            _count: {
              select: {
                studyRecords: true,
                pages: true,
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
            OR: [
              {
                classes: {
                  some: {
                    classId: { in: classIds },
                  },
                },
              },
              { isPublic: true },
            ],
            isPublished: true,
          },
          include: {
            teacher: {
              select: { name: true },
            },
            _count: {
              select: {
                studyRecords: true,
                pages: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        });
      }

      // Cache the result
      await cacheService.set(cacheKey, textbooks, { ttl: this.CACHE_TTL });
      
      res.setHeader('X-Cache', 'MISS');
      res.json(textbooks);
    } catch (error) {
      next(error);
    }
  }

  async getTextbook(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { userId, role } = req.user!;
      const cacheKey = cacheService.createKey(this.CACHE_PREFIX, 'detail', id, userId);

      // Try cache first
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        res.setHeader('X-Cache', 'HIT');
        return res.json(cached);
      }

      const prisma = getDatabase();
      
      const textbook = await prisma.textbook.findUnique({
        where: { id },
        include: {
          teacher: {
            select: { id: true, name: true, email: true },
          },
          classes: {
            include: {
              class: true,
            },
          },
          pages: {
            orderBy: { pageNumber: 'asc' },
          },
          _count: {
            select: {
              studyRecords: true,
              highlights: true,
              bookmarks: true,
            },
          },
        },
      });

      if (!textbook) {
        throw new AppError(404, 'Textbook not found');
      }

      // Check access permissions
      if (role === 'STUDENT') {
        const hasAccess = await this.checkStudentAccess(userId, textbook);
        if (!hasAccess) {
          throw new AppError(403, 'Access denied');
        }
      } else if (role === 'TEACHER' && textbook.teacherId !== userId) {
        throw new AppError(403, 'Access denied');
      }

      // Add user-specific data
      if (role === 'STUDENT') {
        const studyProgress = await prisma.studyRecord.findMany({
          where: {
            userId,
            textbookId: id,
          },
          orderBy: { updatedAt: 'desc' },
          take: 10,
        });

        (textbook as any).userProgress = {
          records: studyProgress,
          totalTimeSpent: studyProgress.reduce((sum, record) => sum + record.timeSpent, 0),
          completedChapters: studyProgress.filter(r => r.completed).length,
        };
      }

      // Cache the result
      await cacheService.set(cacheKey, textbook, { ttl: this.CACHE_TTL });
      
      res.setHeader('X-Cache', 'MISS');
      res.json(textbook);
    } catch (error) {
      next(error);
    }
  }

  async createTextbook(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.user!;
      const { title, subject, grade, description, aiSettings } = req.body;
      
      const prisma = getDatabase();
      
      const textbook = await prisma.textbook.create({
        data: {
          title,
          subject,
          grade,
          description,
          teacherId: userId,
          content: { chapters: [] },
          aiSettings: aiSettings || {
            model: 'gpt-4',
            temperature: 0.7,
            includeExamples: true,
          },
        },
      });

      // Invalidate teacher's textbook list cache
      await cacheService.deletePattern(
        cacheService.createKey(this.CACHE_PREFIX, 'list', userId, '*')
      );

      logger.info(`Textbook created: ${textbook.id} by teacher ${userId}`);
      res.status(201).json(textbook);
    } catch (error) {
      next(error);
    }
  }

  async updateTextbook(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { userId } = req.user!;
      
      const prisma = getDatabase();
      
      // Check ownership
      const existing = await prisma.textbook.findUnique({
        where: { id },
        select: { teacherId: true },
      });

      if (!existing || existing.teacherId !== userId) {
        throw new AppError(403, 'Access denied');
      }

      const updated = await prisma.textbook.update({
        where: { id },
        data: req.body,
      });

      // Invalidate caches
      await cacheService.invalidate([
        cacheService.createKey(this.CACHE_PREFIX, 'detail', id, '*'),
        cacheService.createKey(this.CACHE_PREFIX, 'list', userId, '*'),
        cacheService.createKey(CacheService.PREFIXES.SEARCH, '*'),
      ]);

      logger.info(`Textbook updated: ${id}`);
      res.json(updated);
    } catch (error) {
      next(error);
    }
  }

  async deleteTextbook(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { userId } = req.user!;
      
      const prisma = getDatabase();
      
      // Check ownership
      const existing = await prisma.textbook.findUnique({
        where: { id },
        select: { teacherId: true },
      });

      if (!existing || existing.teacherId !== userId) {
        throw new AppError(403, 'Access denied');
      }

      await prisma.textbook.delete({
        where: { id },
      });

      // Invalidate caches
      await cacheService.invalidate([
        cacheService.createKey(this.CACHE_PREFIX, 'detail', id, '*'),
        cacheService.createKey(this.CACHE_PREFIX, 'list', '*'),
        cacheService.createKey(CacheService.PREFIXES.SEARCH, '*'),
      ]);

      logger.info(`Textbook deleted: ${id}`);
      res.json({ message: 'Textbook deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async searchTextbooks(req: Request, res: Response, next: NextFunction) {
    try {
      const { q, subject, grade, page = 1, limit = 20 } = req.query;
      const { userId } = req.user!;
      
      // Create cache key from search params
      const cacheKey = cacheService.createKey(
        CacheService.PREFIXES.SEARCH,
        'textbooks',
        JSON.stringify({ q, subject, grade, page, limit })
      );

      // Try cache first
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        res.setHeader('X-Cache', 'HIT');
        return res.json(cached);
      }

      const prisma = getDatabase();
      
      const where: any = {
        isPublished: true,
        isPublic: true,
      };

      if (q) {
        where.OR = [
          { title: { contains: q as string, mode: 'insensitive' } },
          { subject: { contains: q as string, mode: 'insensitive' } },
          { description: { contains: q as string, mode: 'insensitive' } },
        ];
      }

      if (subject) {
        where.subject = subject;
      }

      if (grade) {
        where.grade = parseInt(grade as string);
      }

      const [textbooks, total] = await Promise.all([
        prisma.textbook.findMany({
          where,
          include: {
            teacher: {
              select: { name: true },
            },
            _count: {
              select: {
                studyRecords: true,
                classes: true,
              },
            },
          },
          skip: (parseInt(page as string) - 1) * parseInt(limit as string),
          take: parseInt(limit as string),
          orderBy: [
            { _count: { studyRecords: 'desc' } },
            { createdAt: 'desc' },
          ],
        }),
        prisma.textbook.count({ where }),
      ]);

      const result = {
        data: textbooks,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages: Math.ceil(total / parseInt(limit as string)),
        },
      };

      // Cache search results for shorter time
      await cacheService.set(cacheKey, result, { ttl: CacheService.TTL.SHORT });
      
      res.setHeader('X-Cache', 'MISS');
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async generateContent(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { chapterId, contentType, prompt } = req.body;
      const { userId } = req.user!;
      
      const prisma = getDatabase();
      
      // Check ownership
      const textbook = await prisma.textbook.findUnique({
        where: { id },
        select: {
          teacherId: true,
          title: true,
          subject: true,
          grade: true,
          aiSettings: true,
        },
      });

      if (!textbook || textbook.teacherId !== userId) {
        throw new AppError(403, 'Access denied');
      }

      // Generate AI content
      const systemPrompt = `You are an expert Korean language teacher creating content for a ${textbook.grade}th grade ${textbook.subject} textbook titled "${textbook.title}".`;
      
      const userPrompt = prompt || `Generate ${contentType} for chapter ${chapterId}`;
      
      const generatedContent = await aiService.generateText(
        systemPrompt,
        userPrompt,
        textbook.aiSettings as any
      );

      // Invalidate textbook detail cache
      await cacheService.deletePattern(
        cacheService.createKey(this.CACHE_PREFIX, 'detail', id, '*')
      );

      res.json({
        content: generatedContent,
        metadata: {
          chapterId,
          contentType,
          generatedAt: new Date(),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  private async checkStudentAccess(userId: string, textbook: any): Promise<boolean> {
    const prisma = getDatabase();
    
    // Check if textbook is public
    if (textbook.isPublic) {
      return true;
    }

    // Check if student is in a class with this textbook
    const classMembership = await prisma.classEnrollment.findFirst({
      where: {
        studentId: userId,
        class: {
          textbooks: {
            some: {
              textbookId: textbook.id,
            },
          },
        },
      },
    });

    return !!classMembership;
  }
}

export const cachedTextbookController = new CachedTextbookController();