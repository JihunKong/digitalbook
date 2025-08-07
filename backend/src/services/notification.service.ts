import { getDatabase } from '../config/database';
import { SocketService } from './socket.service';
import { logger } from '../utils/logger';

interface CreateNotificationData {
  userId: string;
  type: 'NEW_ASSIGNMENT' | 'ASSIGNMENT_GRADED' | 'NEW_MESSAGE' | 'CLASS_ANNOUNCEMENT' | 'ACHIEVEMENT_EARNED' | 'STUDY_REMINDER' | 'TEACHER_ONLINE' | 'NEW_CONTENT';
  title: string;
  message: string;
  data?: any;
}

export class NotificationService {
  private socketService: SocketService | null = null;

  setSocketService(socketService: SocketService) {
    this.socketService = socketService;
  }

  async createNotification(data: CreateNotificationData) {
    try {
      const prisma = getDatabase();
      
      // Create notification in database
      const notification = await prisma.notification.create({
        data: {
          userId: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          data: data.data || null,
        },
      });
      
      // Send real-time notification if user is online
      if (this.socketService) {
        await this.socketService.sendNotificationToUser(data.userId, notification);
      }
      
      return notification;
    } catch (error) {
      logger.error('Failed to create notification:', error);
      throw error;
    }
  }

  async createBulkNotifications(userIds: string[], notificationData: Omit<CreateNotificationData, 'userId'>) {
    try {
      const prisma = getDatabase();
      
      // Create notifications for all users
      const notifications = await prisma.notification.createMany({
        data: userIds.map(userId => ({
          userId,
          type: notificationData.type,
          title: notificationData.title,
          message: notificationData.message,
          data: notificationData.data || null,
        })),
      });
      
      // Send real-time notifications to online users
      if (this.socketService) {
        for (const userId of userIds) {
          if (this.socketService.isUserOnline(userId)) {
            await this.socketService.sendNotificationToUser(userId, {
              type: notificationData.type,
              title: notificationData.title,
              message: notificationData.message,
              data: notificationData.data,
            });
          }
        }
      }
      
      return notifications;
    } catch (error) {
      logger.error('Failed to create bulk notifications:', error);
      throw error;
    }
  }

  async markAsRead(notificationId: string, userId: string) {
    try {
      const prisma = getDatabase();
      
      const notification = await prisma.notification.update({
        where: {
          id: notificationId,
          userId, // Ensure user owns the notification
        },
        data: {
          read: true,
          readAt: new Date(),
        },
      });
      
      return notification;
    } catch (error) {
      logger.error('Failed to mark notification as read:', error);
      throw error;
    }
  }

  async markAllAsRead(userId: string) {
    try {
      const prisma = getDatabase();
      
      await prisma.notification.updateMany({
        where: {
          userId,
          read: false,
        },
        data: {
          read: true,
          readAt: new Date(),
        },
      });
      
      return { success: true };
    } catch (error) {
      logger.error('Failed to mark all notifications as read:', error);
      throw error;
    }
  }

  async getUnreadCount(userId: string) {
    try {
      const prisma = getDatabase();
      
      const count = await prisma.notification.count({
        where: {
          userId,
          read: false,
        },
      });
      
      return count;
    } catch (error) {
      logger.error('Failed to get unread count:', error);
      throw error;
    }
  }

  async getUserNotifications(userId: string, page: number = 1, limit: number = 20) {
    try {
      const prisma = getDatabase();
      const skip = (page - 1) * limit;
      
      const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.notification.count({
          where: { userId },
        }),
      ]);
      
      return {
        notifications,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error('Failed to get user notifications:', error);
      throw error;
    }
  }

  // Specific notification creators
  async notifyNewAssignment(classId: string, assignment: any) {
    try {
      const prisma = getDatabase();
      
      // Get all students in the class
      const students = await prisma.classMember.findMany({
        where: {
          classId,
          role: 'STUDENT',
        },
        select: {
          userId: true,
        },
      });
      
      const userIds = students.map(s => s.userId);
      
      await this.createBulkNotifications(userIds, {
        type: 'NEW_ASSIGNMENT',
        title: 'New Assignment',
        message: `New assignment "${assignment.title}" has been posted`,
        data: {
          assignmentId: assignment.id,
          classId,
          dueDate: assignment.dueDate,
        },
      });
    } catch (error) {
      logger.error('Failed to notify new assignment:', error);
      throw error;
    }
  }

  async notifyAssignmentGraded(userId: string, assignment: any, grade: number) {
    await this.createNotification({
      userId,
      type: 'ASSIGNMENT_GRADED',
      title: 'Assignment Graded',
      message: `Your assignment "${assignment.title}" has been graded: ${grade}/${assignment.points}`,
      data: {
        assignmentId: assignment.id,
        grade,
        totalPoints: assignment.points,
      },
    });
  }

  async notifyTeacherOnline(classId: string, teacher: any) {
    try {
      const prisma = getDatabase();
      
      // Get all students in the class
      const students = await prisma.classMember.findMany({
        where: {
          classId,
          role: 'STUDENT',
        },
        select: {
          userId: true,
        },
      });
      
      const userIds = students.map(s => s.userId);
      
      await this.createBulkNotifications(userIds, {
        type: 'TEACHER_ONLINE',
        title: 'Teacher Online',
        message: `${teacher.name} is now online and available`,
        data: {
          teacherId: teacher.id,
          classId,
        },
      });
    } catch (error) {
      logger.error('Failed to notify teacher online:', error);
      throw error;
    }
  }
}

export const notificationService = new NotificationService();