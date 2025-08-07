import { Request, Response, NextFunction } from 'express';
import { getDatabase } from '../config/database';
import { AppError } from '../middlewares/errorHandler';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

class UserController {
  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.user!;
      const prisma = getDatabase();
      
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          profileImage: true,
          createdAt: true,
          classes: {
            include: {
              class: true,
            },
          },
          _count: {
            select: {
              textbooks: true,
              achievements: true,
            },
          },
        },
      });
      
      if (!user) {
        throw new AppError('User not found', 404);
      }
      
      res.json(user);
    } catch (error) {
      next(error);
    }
  }
  
  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.user!;
      const { name } = req.body;
      const prisma = getDatabase();
      
      const user = await prisma.user.update({
        where: { id: userId },
        data: { name },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          profileImage: true,
        },
      });
      
      res.json(user);
    } catch (error) {
      next(error);
    }
  }
  
  async uploadAvatar(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.user!;
      const file = req.file;
      
      if (!file) {
        throw new AppError('No file uploaded', 400);
      }
      
      // Process image
      const filename = `avatar-${userId}-${Date.now()}.jpg`;
      const uploadPath = path.join(process.cwd(), 'uploads', 'avatars', filename);
      
      await fs.mkdir(path.dirname(uploadPath), { recursive: true });
      
      await sharp(file.buffer)
        .resize(200, 200)
        .jpeg({ quality: 80 })
        .toFile(uploadPath);
      
      const prisma = getDatabase();
      const user = await prisma.user.update({
        where: { id: userId },
        data: { profileImage: `/uploads/avatars/${filename}` },
      });
      
      res.json({ profileImage: user.profileImage });
    } catch (error) {
      next(error);
    }
  }
  
  async getAchievements(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.user!;
      const prisma = getDatabase();
      
      const achievements = await prisma.achievement.findMany({
        where: { userId },
        orderBy: { earnedAt: 'desc' },
      });
      
      res.json(achievements);
    } catch (error) {
      next(error);
    }
  }
  
  async getStudyProgress(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.user!;
      const prisma = getDatabase();
      
      const studyRecords = await prisma.studyRecord.findMany({
        where: { userId },
        include: {
          textbook: {
            select: {
              title: true,
              subject: true,
              grade: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      });
      
      // Calculate statistics
      const totalTimeSpent = studyRecords.reduce((sum, record) => sum + record.timeSpent, 0);
      const completedChapters = studyRecords.filter(record => record.completed).length;
      const textbooksInProgress = new Set(studyRecords.map(record => record.textbookId)).size;
      
      res.json({
        studyRecords,
        statistics: {
          totalTimeSpent,
          completedChapters,
          textbooksInProgress,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();