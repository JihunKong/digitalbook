import { Request, Response } from 'express';
import { notificationService } from '../services/notification.service';
import { AppError } from '../middlewares/errorHandler';

export const notificationController = {
  // Get user notifications
  async getUserNotifications(req: Request, res: Response) {
    try {
      const { userId } = req.user as any;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      
      const result = await notificationService.getUserNotifications(userId, page, limit);
      res.json(result);
    } catch (error) {
      console.error('Get notifications error:', error);
      res.status(500).json({ error: 'Failed to get notifications' });
    }
  },

  // Get unread count
  async getUnreadCount(req: Request, res: Response) {
    try {
      const { userId } = req.user as any;
      const count = await notificationService.getUnreadCount(userId);
      res.json({ count });
    } catch (error) {
      console.error('Get unread count error:', error);
      res.status(500).json({ error: 'Failed to get unread count' });
    }
  },

  // Mark notification as read
  async markAsRead(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { userId } = req.user as any;
      
      const notification = await notificationService.markAsRead(id, userId);
      res.json(notification);
    } catch (error) {
      console.error('Mark as read error:', error);
      res.status(500).json({ error: 'Failed to mark notification as read' });
    }
  },

  // Mark all notifications as read
  async markAllAsRead(req: Request, res: Response) {
    try {
      const { userId } = req.user as any;
      
      const result = await notificationService.markAllAsRead(userId);
      res.json(result);
    } catch (error) {
      console.error('Mark all as read error:', error);
      res.status(500).json({ error: 'Failed to mark all notifications as read' });
    }
  },
};