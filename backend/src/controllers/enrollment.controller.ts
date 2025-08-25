import { Request, Response, NextFunction } from 'express';
import { getDatabase } from '../config/database';
import { logger } from '../utils/logger';
import { AppError } from '../middlewares/errorHandler';

export class EnrollmentController {
  /**
   * Enroll a student in a class using access code
   */
  async enrollWithCode(req: Request, res: Response, next: NextFunction) {
    const prisma = getDatabase();
    
    try {
      const { classCode } = req.body;
      const userId = (req as any).userId; // From auth middleware
      
      if (!classCode) {
        throw new AppError('Class code is required', 400);
      }
      
      if (!userId) {
        throw new AppError('Authentication required', 401);
      }
      
      // Get user with profile
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { studentProfile: true }
      });
      
      if (!user) {
        throw new AppError('User not found', 404);
      }
      
      if (user.role !== 'STUDENT') {
        throw new AppError('Only students can enroll in classes', 403);
      }
      
      if (!user.studentProfile) {
        throw new AppError('Student profile not found', 404);
      }
      
      // Find class by code
      const classRoom = await prisma.class.findUnique({
        where: { code: classCode.toUpperCase() },
        include: {
          teacher: {
            include: { user: true }
          }
        }
      });
      
      if (!classRoom) {
        throw new AppError('Invalid class code', 404);
      }
      
      if (!classRoom.isActive) {
        throw new AppError('Class is no longer active', 400);
      }
      
      if (classRoom.expiresAt && classRoom.expiresAt < new Date()) {
        throw new AppError('Class has expired', 400);
      }
      
      // Check if already enrolled
      const existingEnrollment = await prisma.classEnrollment.findUnique({
        where: {
          classId_studentId: {
            classId: classRoom.id,
            studentId: user.studentProfile.id
          }
        }
      });
      
      if (existingEnrollment) {
        if (existingEnrollment.isActive) {
          return res.status(200).json({
            message: 'Already enrolled in this class',
            class: {
              id: classRoom.id,
              name: classRoom.name,
              subject: classRoom.subject,
              grade: classRoom.grade,
              teacher: classRoom.teacher.user.name
            }
          });
        } else {
          // Reactivate enrollment
          await prisma.classEnrollment.update({
            where: { id: existingEnrollment.id },
            data: { isActive: true }
          });
          
          logger.info(`Student ${user.email} re-enrolled in class ${classRoom.name}`);
          
          return res.json({
            message: 'Successfully re-enrolled in class',
            class: {
              id: classRoom.id,
              name: classRoom.name,
              subject: classRoom.subject,
              grade: classRoom.grade,
              teacher: classRoom.teacher.user.name
            }
          });
        }
      }
      
      // Create new enrollment
      const enrollment = await prisma.classEnrollment.create({
        data: {
          classId: classRoom.id,
          studentId: user.studentProfile.id,
          isActive: true
        }
      });
      
      // Create notification for teacher
      await prisma.notification.create({
        data: {
          userId: classRoom.teacher.user.id,
          title: 'New Student Enrolled',
          message: `${user.name} has joined your class "${classRoom.name}"`,
          type: 'SYSTEM'
        }
      });
      
      // Log activity
      await prisma.userActivity.create({
        data: {
          userId: user.id,
          action: 'class_enrollment',
          details: {
            classId: classRoom.id,
            className: classRoom.name,
            classCode: classCode
          }
        }
      });
      
      logger.info(`Student ${user.email} enrolled in class ${classRoom.name}`);
      
      res.status(201).json({
        message: 'Successfully enrolled in class',
        enrollment: {
          id: enrollment.id,
          enrolledAt: enrollment.enrolledAt
        },
        class: {
          id: classRoom.id,
          name: classRoom.name,
          subject: classRoom.subject,
          grade: classRoom.grade,
          teacher: classRoom.teacher.user.name,
          description: classRoom.description
        }
      });
    } catch (error) {
      logger.error('Enrollment error:', error);
      next(error);
    }
  }
  
  /**
   * Get student's enrolled classes
   */
  async getMyClasses(req: Request, res: Response, next: NextFunction) {
    const prisma = getDatabase();
    
    try {
      const userId = (req as any).userId;
      
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { studentProfile: true }
      });
      
      if (!user || !user.studentProfile) {
        throw new AppError('Student profile not found', 404);
      }
      
      const enrollments = await prisma.classEnrollment.findMany({
        where: {
          studentId: user.studentProfile.id,
          isActive: true
        },
        include: {
          class: {
            include: {
              teacher: {
                include: { user: true }
              },
              pdfTextbooks: {
                where: { status: 'completed' },
                select: {
                  id: true,
                  filename: true,
                  totalPages: true
                }
              },
              activities: {
                select: {
                  id: true,
                  title: true,
                  type: true
                }
              },
              _count: {
                select: {
                  enrollments: true
                }
              }
            }
          }
        },
        orderBy: {
          enrolledAt: 'desc'
        }
      });
      
      const classes = enrollments.map(enrollment => ({
        id: enrollment.class.id,
        name: enrollment.class.name,
        subject: enrollment.class.subject,
        grade: enrollment.class.grade,
        teacher: enrollment.class.teacher.user.name,
        enrolledAt: enrollment.enrolledAt,
        studentCount: enrollment.class._count.enrollments,
        materials: enrollment.class.pdfTextbooks.length,
        activities: enrollment.class.activities.length
      }));
      
      res.json({
        classes,
        total: classes.length
      });
    } catch (error) {
      logger.error('Get classes error:', error);
      next(error);
    }
  }
  
  /**
   * Leave a class (soft delete enrollment)
   */
  async leaveClass(req: Request, res: Response, next: NextFunction) {
    const prisma = getDatabase();
    
    try {
      const { classId } = req.params;
      const userId = (req as any).userId;
      
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { studentProfile: true }
      });
      
      if (!user || !user.studentProfile) {
        throw new AppError('Student profile not found', 404);
      }
      
      const enrollment = await prisma.classEnrollment.findUnique({
        where: {
          classId_studentId: {
            classId,
            studentId: user.studentProfile.id
          }
        }
      });
      
      if (!enrollment) {
        throw new AppError('Not enrolled in this class', 404);
      }
      
      // Soft delete - just mark as inactive
      await prisma.classEnrollment.update({
        where: { id: enrollment.id },
        data: { isActive: false }
      });
      
      // Log activity
      await prisma.userActivity.create({
        data: {
          userId: user.id,
          action: 'class_leave',
          details: { classId }
        }
      });
      
      logger.info(`Student ${user.email} left class ${classId}`);
      
      res.json({
        message: 'Successfully left the class'
      });
    } catch (error) {
      logger.error('Leave class error:', error);
      next(error);
    }
  }
  
  /**
   * Get class details for enrolled student
   */
  async getClassDetails(req: Request, res: Response, next: NextFunction) {
    const prisma = getDatabase();
    
    try {
      const { classId } = req.params;
      const userId = (req as any).userId;
      
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { studentProfile: true }
      });
      
      if (!user || !user.studentProfile) {
        throw new AppError('Student profile not found', 404);
      }
      
      // Check enrollment
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
      
      // Get class details
      const classRoom = await prisma.class.findUnique({
        where: { id: classId },
        include: {
          teacher: {
            include: { user: true }
          },
          pdfTextbooks: {
            where: { status: 'completed' },
            orderBy: { createdAt: 'desc' }
          },
          activities: {
            orderBy: { createdAt: 'desc' },
            include: {
              _count: {
                select: { responses: true }
              }
            }
          },
          announcements: {
            orderBy: { createdAt: 'desc' },
            take: 5
          },
          _count: {
            select: {
              enrollments: {
                where: { isActive: true }
              }
            }
          }
        }
      });
      
      if (!classRoom) {
        throw new AppError('Class not found', 404);
      }
      
      // Get student's activity progress
      const studentResponses = await prisma.activityResponse.findMany({
        where: {
          studentId: user.id,
          activity: {
            classId
          }
        },
        select: {
          activityId: true,
          submittedAt: true,
          score: true
        }
      });
      
      const responseMap = new Map(
        studentResponses.map(r => [r.activityId, r])
      );
      
      res.json({
        class: {
          id: classRoom.id,
          name: classRoom.name,
          description: classRoom.description,
          subject: classRoom.subject,
          grade: classRoom.grade,
          teacher: {
            name: classRoom.teacher.user.name,
            email: classRoom.teacher.user.email
          },
          studentCount: classRoom._count.enrollments,
          materials: classRoom.pdfTextbooks.map(pdf => ({
            id: pdf.id,
            filename: pdf.filename,
            totalPages: pdf.totalPages,
            uploadedAt: pdf.createdAt
          })),
          activities: classRoom.activities.map(activity => ({
            id: activity.id,
            title: activity.title,
            type: activity.type,
            totalResponses: activity._count.responses,
            myResponse: responseMap.get(activity.id) || null,
            createdAt: activity.createdAt
          })),
          announcements: classRoom.announcements
        },
        enrolledAt: enrollment.enrolledAt
      });
    } catch (error) {
      logger.error('Get class details error:', error);
      next(error);
    }
  }
}

export const enrollmentController = new EnrollmentController();