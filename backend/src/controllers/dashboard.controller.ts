import { Request, Response, NextFunction } from 'express';
import { getDatabase } from '../config/database';
import { AppError } from '../middlewares/errorHandler';
import { logger } from '../utils/logger';

interface DashboardStats {
  totalTextbooks: number;
  totalStudents: number;
  totalClasses: number;
  weeklyProgress: number;
  aiCredits?: number;
  aiUsageCount?: number;
  activeUsersPercentage?: number;
  recentActivities: Activity[];
  upcomingAssignments: Assignment[];
}

interface Activity {
  id: string;
  type: 'textbook' | 'student' | 'assignment' | 'ai';
  title: string;
  timestamp: string;
  icon?: string;
}

interface Assignment {
  id: string;
  title: string;
  className: string;
  dueDate: string;
  submissions: number;
  total: number;
}

class DashboardController {
  // Use arrow function to preserve 'this' binding when method is passed as callback
  getTeacherDashboard = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Enhanced error checking
      if (!req.user || !req.user.userId) {
        logger.error('Dashboard access without valid user context', {
          hasUser: !!req.user,
          userId: req.user?.userId || 'undefined'
        });
        throw new AppError('Authentication required', 401);
      }

      const { userId } = req.user;
      const prisma = getDatabase();
      
      logger.info('Getting teacher dashboard', { userId });
      
      // Get teacher profile with error handling
      let teacherProfile;
      try {
        teacherProfile = await prisma.teacherProfile.findUnique({
          where: { userId },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true
              }
            }
          }
        });
      } catch (dbError) {
        logger.error('Database error fetching teacher profile:', dbError);
        throw new AppError('Database connection error', 500);
      }
      
      if (!teacherProfile) {
        logger.warn('Teacher profile not found', { userId });
        throw new AppError('Teacher profile not found', 404);
      }
      
      // Initialize default values
      let totalTextbooks = 0;
      let totalClasses = 0;
      let enrollmentCount = 0;
      
      // Get statistics with individual error handling
      try {
        totalTextbooks = await prisma.textbook.count({
          where: { authorId: teacherProfile.id }
        });
      } catch (error) {
        logger.error('Error fetching textbook count:', error);
      }
      
      try {
        totalClasses = await prisma.class.count({
          where: { teacherId: teacherProfile.id }
        });
      } catch (error) {
        logger.error('Error fetching class count:', error);
      }
      
      try {
        enrollmentCount = await prisma.classEnrollment.count({
          where: {
            class: {
              teacherId: teacherProfile.id
            }
          }
        });
      } catch (error) {
        logger.error('Error fetching enrollment count:', error);
      }
      
      // Initialize default values for activities
      let recentTextbooks: any[] = [];
      let recentClasses: any[] = [];
      
      // Get recent activities with error handling
      try {
        recentTextbooks = await prisma.textbook.findMany({
          where: { authorId: teacherProfile.id },
          orderBy: { createdAt: 'desc' },
          take: 3,
          select: {
            id: true,
            title: true,
            createdAt: true
          }
        });
      } catch (error) {
        logger.error('Error fetching recent textbooks:', error);
      }
      
      try {
        recentClasses = await prisma.class.findMany({
          where: { teacherId: teacherProfile.id },
          orderBy: { createdAt: 'desc' },
          take: 2,
          select: {
            id: true,
            name: true,
            createdAt: true
          }
        });
      } catch (error) {
        logger.error('Error fetching recent classes:', error);
      }
      
      // Format recent activities
      const recentActivities: Activity[] = [
        ...recentTextbooks.map(book => ({
          id: book.id,
          type: 'textbook' as const,
          title: `교과서 "${book.title}" 생성됨`,
          timestamp: this.formatTimestamp(book.createdAt),
          icon: 'BookOpen'
        })),
        ...recentClasses.map(cls => ({
          id: cls.id,
          type: 'assignment' as const,
          title: `수업 "${cls.name}" 생성됨`,
          timestamp: this.formatTimestamp(cls.createdAt),
          icon: 'GraduationCap'
        }))
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5);
      
      // Get upcoming assignments (placeholder for now)
      const upcomingAssignments: Assignment[] = [];
      
      // Calculate AI-related stats
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      // Count AI usage with error handling
      let aiUsageCount = 0;
      try {
        aiUsageCount = await prisma.textbook.count({
          where: { 
            authorId: teacherProfile.id,
            createdAt: {
              gte: oneWeekAgo
            }
          }
        });
      } catch (error) {
        logger.error('Error fetching AI usage count:', error);
      }
      
      // Calculate active users percentage with error handling
      let activeUsersPercentage = 0;
      if (enrollmentCount > 0) {
        try {
          const activeStudents = await prisma.classEnrollment.count({
            where: {
              class: {
                teacherId: teacherProfile.id
              },
              updatedAt: {
                gte: oneWeekAgo
              }
            }
          });
          activeUsersPercentage = Math.round((activeStudents / enrollmentCount) * 100);
        } catch (error) {
          logger.error('Error calculating active users:', error);
        }
      }
      
      // Calculate weekly progress (based on actual activity)
      const weeklyProgress = Math.min(100, (totalTextbooks * 20) + (totalClasses * 15) + (enrollmentCount * 2));
      
      const dashboardStats: DashboardStats = {
        totalTextbooks,
        totalStudents: enrollmentCount,
        totalClasses,
        weeklyProgress,
        aiCredits: 1000, // Default credit amount - could be from user profile in future
        aiUsageCount,
        activeUsersPercentage,
        recentActivities,
        upcomingAssignments
      };
      
      logger.info('Dashboard stats successfully retrieved', {
        userId,
        totalTextbooks,
        totalClasses,
        enrollmentCount,
        activitiesCount: recentActivities.length
      });
      
      res.json(dashboardStats);
    } catch (error) {
      logger.error('Dashboard stats error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        userId: req.user?.userId || 'unknown'
      });
      next(error);
    }
  }
  
  private formatTimestamp(date: Date | null | undefined): string {
    // CRITICAL FIX: Handle null/undefined dates to prevent 500 errors
    if (!date) return '정보 없음';

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '방금 전';
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;

    return date.toLocaleDateString('ko-KR');
  }
}

export const dashboardController = new DashboardController();