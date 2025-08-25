import { Request, Response, NextFunction } from 'express';
import { getDatabase } from '../config/database';
import { AppError } from '../middlewares/errorHandler';
import { logger } from '../utils/logger';

interface DashboardStats {
  totalTextbooks: number;
  totalStudents: number;
  totalClasses: number;
  weeklyProgress: number;
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
  async getTeacherDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.user!;
      const prisma = getDatabase();
      
      // Get teacher profile
      const teacherProfile = await prisma.teacherProfile.findUnique({
        where: { userId }
      });
      
      if (!teacherProfile) {
        throw new AppError('Teacher profile not found', 404);
      }
      
      // Get total textbooks created by this teacher
      const totalTextbooks = await prisma.textbook.count({
        where: { authorId: teacherProfile.id }
      });
      
      // Get total classes for this teacher
      const totalClasses = await prisma.class.count({
        where: { teacherId: teacherProfile.id }
      });
      
      // Get total students enrolled in teacher's classes
      const enrollmentCount = await prisma.classEnrollment.count({
        where: {
          class: {
            teacherId: teacherProfile.id
          }
        }
      });
      
      // Get recent activities (simplified for now)
      const recentTextbooks = await prisma.textbook.findMany({
        where: { authorId: teacherProfile.id },
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: {
          id: true,
          title: true,
          createdAt: true
        }
      });
      
      const recentClasses = await prisma.class.findMany({
        where: { teacherId: teacherProfile.id },
        orderBy: { createdAt: 'desc' },
        take: 2,
        select: {
          id: true,
          name: true,
          createdAt: true
        }
      });
      
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
      
      // Calculate weekly progress (placeholder)
      const weeklyProgress = Math.min(100, (totalTextbooks * 20) + (totalClasses * 15) + (enrollmentCount * 2));
      
      const dashboardStats: DashboardStats = {
        totalTextbooks,
        totalStudents: enrollmentCount,
        totalClasses,
        weeklyProgress,
        recentActivities,
        upcomingAssignments
      };
      
      res.json(dashboardStats);
    } catch (error) {
      logger.error('Dashboard stats error:', error);
      next(error);
    }
  }
  
  private formatTimestamp(date: Date): string {
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