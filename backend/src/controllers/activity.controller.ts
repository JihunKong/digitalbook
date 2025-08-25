import { Request, Response, NextFunction } from 'express';
import { activityService } from '../services/activity.service';
import { getDatabase } from '../config/database';
import { logger } from '../utils/logger';
import { AppError } from '../middlewares/errorHandler';

export class ActivityController {
  /**
   * Generate activities from PDF
   */
  async generateFromPDF(req: Request, res: Response, next: NextFunction) {
    try {
      const { pdfId } = req.params;
      const teacherId = (req as any).userId;
      const { autoGenerate = true } = req.body;
      
      if (!teacherId) {
        throw new AppError('Authentication required', 401);
      }
      
      const result = await activityService.generateActivitiesFromPDF(
        pdfId,
        teacherId,
        autoGenerate
      );
      
      res.status(201).json({
        message: 'Activities generated successfully',
        ...result
      });
    } catch (error) {
      logger.error('Generate activities error:', error);
      next(error);
    }
  }
  
  /**
   * Get activities for a class
   */
  async getClassActivities(req: Request, res: Response, next: NextFunction) {
    const prisma = getDatabase();
    
    try {
      const { classId } = req.params;
      const userId = (req as any).userId;
      
      // Verify user has access to this class
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          teacherProfile: true,
          studentProfile: true
        }
      });
      
      if (!user) {
        throw new AppError('User not found', 404);
      }
      
      // Check access based on role
      if (user.role === 'STUDENT' && user.studentProfile) {
        const enrollment = await prisma.classEnrollment.findUnique({
          where: {
            classId_studentId: {
              classId,
              studentId: user.studentProfile.id
            }
          }
        });
        
        if (!enrollment || !enrollment.isActive) {
          throw new AppError('Not enrolled in this class', 403);
        }
      } else if (user.role === 'TEACHER' && user.teacherProfile) {
        const classRoom = await prisma.class.findFirst({
          where: {
            id: classId,
            teacherId: user.teacherProfile.id
          }
        });
        
        if (!classRoom) {
          throw new AppError('Not authorized for this class', 403);
        }
      }
      
      // Get activities
      const activities = await prisma.activity.findMany({
        where: { classId },
        include: {
          textbook: {
            select: {
              id: true,
              filename: true
            }
          },
          _count: {
            select: {
              responses: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      // If student, include their responses
      let studentResponses = new Map();
      if (user.role === 'STUDENT') {
        const responses = await prisma.activityResponse.findMany({
          where: {
            studentId: userId,
            activityId: {
              in: activities.map(a => a.id)
            }
          }
        });
        
        responses.forEach(r => {
          studentResponses.set(r.activityId, {
            id: r.id,
            score: r.score,
            submittedAt: r.submittedAt
          });
        });
      }
      
      const formattedActivities = activities.map(activity => ({
        id: activity.id,
        title: activity.title,
        description: activity.description,
        type: activity.type,
        pdfFile: activity.textbook?.filename,
        totalResponses: activity._count.responses,
        myResponse: studentResponses.get(activity.id) || null,
        createdAt: activity.createdAt
      }));
      
      res.json({
        activities: formattedActivities,
        total: formattedActivities.length
      });
    } catch (error) {
      logger.error('Get class activities error:', error);
      next(error);
    }
  }
  
  /**
   * Get activity details
   */
  async getActivity(req: Request, res: Response, next: NextFunction) {
    const prisma = getDatabase();
    
    try {
      const { activityId } = req.params;
      const userId = (req as any).userId;
      
      const activity = await prisma.activity.findUnique({
        where: { id: activityId },
        include: {
          class: true,
          textbook: true
        }
      });
      
      if (!activity) {
        throw new AppError('Activity not found', 404);
      }
      
      // Verify access
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          studentProfile: true,
          teacherProfile: true
        }
      });
      
      if (user?.role === 'STUDENT' && user.studentProfile) {
        const enrollment = await prisma.classEnrollment.findUnique({
          where: {
            classId_studentId: {
              classId: activity.classId,
              studentId: user.studentProfile.id
            }
          }
        });
        
        if (!enrollment || !enrollment.isActive) {
          throw new AppError('Not enrolled in this class', 403);
        }
        
        // Get student's response if exists
        const response = await prisma.activityResponse.findFirst({
          where: {
            activityId,
            studentId: userId
          }
        });
        
        res.json({
          activity: {
            id: activity.id,
            title: activity.title,
            description: activity.description,
            type: activity.type,
            questions: activity.questions,
            className: activity.class.name,
            pdfFile: activity.textbook?.filename
          },
          myResponse: response ? {
            id: response.id,
            answers: response.answers,
            score: response.score,
            submittedAt: response.submittedAt
          } : null
        });
      } else {
        // Teacher or admin view
        res.json({
          activity: {
            id: activity.id,
            title: activity.title,
            description: activity.description,
            type: activity.type,
            questions: activity.questions,
            className: activity.class.name,
            pdfFile: activity.textbook?.filename,
            modifiable: activity.modifiable,
            createdBy: activity.createdBy,
            createdAt: activity.createdAt
          }
        });
      }
    } catch (error) {
      logger.error('Get activity error:', error);
      next(error);
    }
  }
  
  /**
   * Submit activity response
   */
  async submitResponse(req: Request, res: Response, next: NextFunction) {
    const prisma = getDatabase();
    
    try {
      const { activityId } = req.params;
      const { answers } = req.body;
      const studentId = (req as any).userId;
      
      if (!answers) {
        throw new AppError('Answers are required', 400);
      }
      
      // Verify student
      const user = await prisma.user.findUnique({
        where: { id: studentId }
      });
      
      if (!user || user.role !== 'STUDENT') {
        throw new AppError('Only students can submit responses', 403);
      }
      
      // Check if already submitted
      const existingResponse = await prisma.activityResponse.findFirst({
        where: {
          activityId,
          studentId
        }
      });
      
      if (existingResponse) {
        throw new AppError('Already submitted response for this activity', 400);
      }
      
      // Submit response
      const response = await activityService.submitResponse(
        activityId,
        studentId,
        answers
      );
      
      res.status(201).json({
        message: 'Response submitted successfully',
        response: {
          id: response.id,
          score: response.score,
          submittedAt: response.submittedAt
        }
      });
    } catch (error) {
      logger.error('Submit response error:', error);
      next(error);
    }
  }
  
  /**
   * Get activity responses (teacher only)
   */
  async getActivityResponses(req: Request, res: Response, next: NextFunction) {
    const prisma = getDatabase();
    
    try {
      const { activityId } = req.params;
      const teacherId = (req as any).userId;
      
      // Verify teacher owns this activity's class
      const activity = await prisma.activity.findUnique({
        where: { id: activityId },
        include: {
          class: {
            include: {
              teacher: true
            }
          }
        }
      });
      
      if (!activity) {
        throw new AppError('Activity not found', 404);
      }
      
      const teacher = await prisma.user.findUnique({
        where: { id: teacherId },
        include: { teacherProfile: true }
      });
      
      if (!teacher?.teacherProfile || 
          activity.class.teacherId !== teacher.teacherProfile.id) {
        throw new AppError('Not authorized to view responses', 403);
      }
      
      // Get all responses
      const responses = await prisma.activityResponse.findMany({
        where: { activityId },
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          submittedAt: 'desc'
        }
      });
      
      res.json({
        activity: {
          id: activity.id,
          title: activity.title,
          questions: activity.questions
        },
        responses: responses.map(r => ({
          id: r.id,
          student: {
            id: r.student.id,
            name: r.student.name,
            email: r.student.email
          },
          answers: r.answers,
          score: r.score,
          submittedAt: r.submittedAt
        })),
        totalResponses: responses.length
      });
    } catch (error) {
      logger.error('Get activity responses error:', error);
      next(error);
    }
  }
  
  /**
   * Update activity (teacher only)
   */
  async updateActivity(req: Request, res: Response, next: NextFunction) {
    const prisma = getDatabase();
    
    try {
      const { activityId } = req.params;
      const { title, description, questions } = req.body;
      const teacherId = (req as any).userId;
      
      // Verify teacher owns this activity
      const activity = await prisma.activity.findUnique({
        where: { id: activityId },
        include: {
          class: {
            include: {
              teacher: true
            }
          }
        }
      });
      
      if (!activity) {
        throw new AppError('Activity not found', 404);
      }
      
      if (!activity.modifiable) {
        throw new AppError('This activity cannot be modified', 400);
      }
      
      const teacher = await prisma.user.findUnique({
        where: { id: teacherId },
        include: { teacherProfile: true }
      });
      
      if (!teacher?.teacherProfile || 
          activity.class.teacherId !== teacher.teacherProfile.id) {
        throw new AppError('Not authorized to update this activity', 403);
      }
      
      // Update activity
      const updated = await prisma.activity.update({
        where: { id: activityId },
        data: {
          title: title || activity.title,
          description: description || activity.description,
          questions: questions || activity.questions
        }
      });
      
      res.json({
        message: 'Activity updated successfully',
        activity: {
          id: updated.id,
          title: updated.title,
          description: updated.description,
          type: updated.type
        }
      });
    } catch (error) {
      logger.error('Update activity error:', error);
      next(error);
    }
  }
}

export const activityController = new ActivityController();