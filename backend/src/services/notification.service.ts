import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export class NotificationService {
  async getUserNotifications(userId: string, page: number = 1, limit: number = 20) {
    try {
      const skip = (page - 1) * limit;
      
      // Check if notification table exists, if not return empty result
      try {
        const [notifications, total] = await Promise.all([
          prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
          }),
          prisma.notification.count({ where: { userId } }),
        ]);
        
        return {
          notifications,
          total,
          page,
          totalPages: Math.ceil(total / limit),
        };
      } catch (dbError: any) {
        // If table doesn't exist, return empty results
        if (dbError.code === 'P2021' || dbError.message?.includes('does not exist')) {
          logger.warn('Notification table does not exist, returning empty results');
          return {
            notifications: [],
            total: 0,
            page: 1,
            totalPages: 0,
          };
        }
        throw dbError;
      }
    } catch (error) {
      logger.error('Failed to get user notifications:', error);
      throw error;
    }
  }
  
  async markAsRead(notificationId: string, userId: string) {
    try {
      return await prisma.notification.update({
        where: { 
          id: notificationId,
          userId, // Ensure user owns this notification
        },
        data: { isRead: true },
      });
    } catch (error) {
      logger.error('Failed to mark notification as read:', error);
      throw error;
    }
  }
  
  async markAllAsRead(userId: string) {
    try {
      return await prisma.notification.updateMany({
        where: { 
          userId,
          isRead: false,
        },
        data: { isRead: true },
      });
    } catch (error) {
      logger.error('Failed to mark all notifications as read:', error);
      throw error;
    }
  }
  
  async getUnreadCount(userId: string) {
    try {
      try {
        return await prisma.notification.count({
          where: {
            userId,
            isRead: false,
          },
        });
      } catch (dbError: any) {
        // If table doesn't exist, return 0
        if (dbError.code === 'P2021' || dbError.message?.includes('does not exist')) {
          logger.warn('Notification table does not exist, returning 0');
          return 0;
        }
        throw dbError;
      }
    } catch (error) {
      logger.error('Failed to get unread count:', error);
      throw error;
    }
  }
  
  async deleteNotification(notificationId: string, userId: string) {
    try {
      return await prisma.notification.delete({
        where: { 
          id: notificationId,
          userId, // Ensure user owns this notification
        },
      });
    } catch (error) {
      logger.error('Failed to delete notification:', error);
      throw error;
    }
  }
  
  async createNotification(data: {
    userId: string;
    title: string;
    content: string;
    type: string;
    metadata?: any;
  }) {
    try {
      return await prisma.notification.create({
        data: {
          userId: data.userId,
          title: data.title,
          content: data.content,
          type: data.type,
          metadata: data.metadata || {},
          isRead: false,
        },
      });
    } catch (error) {
      logger.error('Failed to create notification:', error);
      throw error;
    }
  }
}

export const notificationService = new NotificationService();