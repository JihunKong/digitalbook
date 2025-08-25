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
          createdAt: true,
          studentProfile: {
            include: {
              enrollments: {
                include: {
                  class: true,
                },
              },
            },
          },
          _count: {
            select: {
              uploadedPDFs: true,
              activities: true,
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
      // TODO: Add profileImage field to User model in schema
      // const user = await prisma.user.update({
      //   where: { id: userId },
      //   data: { profileImage: `/uploads/avatars/${filename}` },
      // });
      
      res.json({ message: 'Profile image uploaded successfully', filename });
    } catch (error) {
      next(error);
    }
  }
  
  async getAchievements(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.user!;
      const prisma = getDatabase();
      
      // TODO: Implement achievement model in schema
      // const achievements = await prisma.achievement.findMany({
      //   where: { userId },
      //   orderBy: { earnedAt: 'desc' },
      // });
      
      res.json([]);
    } catch (error) {
      next(error);
    }
  }
  
  async getStudyProgress(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.user!;
      const prisma = getDatabase();
      
      const studyRecords = await prisma.studyRecord.findMany({
        where: { studentId: userId },
        orderBy: { createdAt: 'desc' },
      });
      
      // Calculate statistics
      const totalTimeSpent = studyRecords.reduce((sum, record) => sum + (record.duration || 0), 0);
      const completedChapters = studyRecords.filter(record => record.score && record.score > 0).length;
      const totalActivities = studyRecords.length;
      
      res.json({
        studyRecords,
        statistics: {
          totalTimeSpent,
          completedChapters,
          totalActivities,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();