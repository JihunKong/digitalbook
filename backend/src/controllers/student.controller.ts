import { Request, Response, NextFunction } from 'express';
import { getDatabase } from '../config/database';
import { logger } from '../utils/logger';
import { AppError } from '../middlewares/errorHandler';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

export class StudentController {
  /**
   * Create student account (signup)
   */
  async createStudent(req: Request, res: Response, next: NextFunction) {
    const prisma = getDatabase();
    
    try {
      const { email, password, name, studentId, className } = req.body;
      
      if (!email || !password || !name || !studentId) {
        throw new AppError('All fields are required', 400);
      }
      
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });
      
      if (existingUser) {
        throw new AppError('User already exists', 409);
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);
      
      // Create user with student profile
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role: 'STUDENT',
          isActive: true,
          studentProfile: {
            create: {
              studentId,
              className: className || '',
              grade: '',
              school: ''
            }
          }
        },
        include: {
          studentProfile: true
        }
      });
      
      logger.info(`Student account created: ${email}`);
      
      // Generate JWT tokens
      const jwtSecret = process.env.JWT_SECRET!;
      const payload = {
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      };
      
      const accessToken = jwt.sign(payload, jwtSecret, { expiresIn: '15m' });
      const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, { expiresIn: '7d' });
      
      // Set cookies
      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000 // 15 minutes
      });
      
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
      
      res.status(201).json({
        message: 'Student account created successfully',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          profile: user.studentProfile
        }
      });
    } catch (error) {
      logger.error('Student creation error:', error);
      next(error);
    }
  }
  
  /**
   * Join class using access code
   */
  async joinClass(req: Request, res: Response, next: NextFunction) {
    const prisma = getDatabase();
    
    try {
      const { code, name, studentId } = req.body;
      
      if (!code || !name || !studentId) {
        throw new AppError('Code, name, and student ID are required', 400);
      }
      
      // Find class by code
      const classData = await prisma.class.findUnique({
        where: { code: code.toUpperCase() },
        include: {
          teacher: {
            include: { user: true }
          }
        }
      });
      
      if (!classData) {
        throw new AppError('Invalid class code', 404);
      }
      
      // Check if class is active
      if (!classData.isActive) {
        throw new AppError('Class is no longer active', 400);
      }
      
      // Check expiration
      if (classData.expiresAt && new Date() > classData.expiresAt) {
        throw new AppError('Class has expired', 400);
      }
      
      // Create temporary student session (for demo purposes)
      const sessionToken = uuidv4();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      
      const session = await prisma.session.create({
        data: {
          token: sessionToken,
          userId: 'guest-' + studentId, // Temporary guest ID
          ipAddress: req.ip || '',
          userAgent: req.get('User-Agent') || '',
          expiresAt,
          lastActivity: new Date()
        }
      });
      
      logger.info(`Student ${name} (${studentId}) joined class ${classData.name}`);
      
      res.json({
        success: true,
        message: 'Successfully joined class',
        sessionToken,
        class: {
          id: classData.id,
          name: classData.name,
          teacher: classData.teacher.user.name,
          code: classData.code
        },
        student: {
          name,
          studentId
        }
      });
    } catch (error) {
      logger.error('Join class error:', error);
      next(error);
    }
  }
  
  /**
   * Validate student session
   */
  async validateSession(req: Request, res: Response, next: NextFunction) {
    const prisma = getDatabase();
    
    try {
      const { sessionToken } = req.body;
      
      if (!sessionToken) {
        throw new AppError('Session token is required', 400);
      }
      
      const session = await prisma.session.findUnique({
        where: { token: sessionToken }
      });
      
      if (!session) {
        throw new AppError('Invalid session', 401);
      }
      
      if (new Date() > session.expiresAt) {
        // Clean up expired session
        await prisma.session.delete({
          where: { id: session.id }
        });
        throw new AppError('Session expired', 401);
      }
      
      // Update last activity
      await prisma.session.update({
        where: { id: session.id },
        data: { lastActivity: new Date() }
      });
      
      res.json({
        valid: true,
        sessionToken,
        lastActivity: session.lastActivity
      });
    } catch (error) {
      logger.error('Session validation error:', error);
      next(error);
    }
  }
  
  /**
   * Get student's questions
   */
  async getMyQuestions(req: Request, res: Response, next: NextFunction) {
    const prisma = getDatabase();
    
    try {
      const { classId } = req.params;
      const studentId = (req as any).student?.id;
      
      if (!studentId) {
        throw new AppError('Student authentication required', 401);
      }
      
      const questions = await prisma.question.findMany({
        where: {
          studentId,
          // Assuming questions are related to a class context
        },
        orderBy: { createdAt: 'desc' },
        take: 50
      });
      
      res.json({
        questions: questions.map(q => ({
          id: q.id,
          question: q.question,
          aiResponse: q.aiResponse,
          questionType: q.questionType,
          context: q.context,
          timestamp: q.createdAt
        }))
      });
    } catch (error) {
      logger.error('Get questions error:', error);
      next(error);
    }
  }
  
  /**
   * Save student question
   */
  async saveQuestion(req: Request, res: Response, next: NextFunction) {
    const prisma = getDatabase();
    
    try {
      const { question, classId, context, questionType } = req.body;
      const studentId = (req as any).student?.id;
      
      if (!studentId || !question) {
        throw new AppError('Student ID and question are required', 400);
      }
      
      const savedQuestion = await prisma.question.create({
        data: {
          studentId,
          question,
          questionType: questionType || 'general',
          context: context || null,
          // Add other fields as needed
        }
      });
      
      logger.info(`Question saved for student ${studentId}`);
      
      res.status(201).json({
        success: true,
        questionId: savedQuestion.id,
        message: 'Question saved successfully'
      });
    } catch (error) {
      logger.error('Save question error:', error);
      next(error);
    }
  }
}

export const studentController = new StudentController();

// Export individual functions for backward compatibility
export const { createStudent, joinClass, validateSession, getMyQuestions, saveQuestion } = studentController;