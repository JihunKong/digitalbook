import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { validate } from '../middlewares/validation';
import { z } from 'zod';
import { emailService } from '../services/email.service';
import { logger } from '../utils/logger';

const router = Router();

// Validation schemas
const sendEmailSchema = z.object({
  to: z.union([z.string().email(), z.array(z.string().email())]),
  subject: z.string().min(1),
  template: z.string().optional(),
  html: z.string().optional(),
  text: z.string().optional(),
  data: z.record(z.any()).optional(),
});

const testEmailSchema = z.object({
  to: z.string().email(),
  template: z.string(),
  data: z.record(z.any()).optional(),
});

const notificationPreferencesSchema = z.object({
  assignments: z.boolean(),
  grades: z.boolean(),
  announcements: z.boolean(),
  reminders: z.boolean(),
  collaboration: z.boolean(),
  system: z.boolean(),
  weeklyDigest: z.boolean(),
});

// Send email (admin only)
router.post('/send', 
  authMiddleware,
  validate(sendEmailSchema),
  async (req, res) => {
    try {
      // Check if user is admin
      const user = (req as any).user;
      if (user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Only administrators can send emails'
        });
      }

      const { to, subject, template, html, text, data } = req.body;

      let success: boolean;

      if (template) {
        success = await emailService.sendTemplateEmail(template, to, data || {});
      } else {
        success = await emailService.sendEmail({
          to,
          subject,
          html,
          text,
        });
      }

      if (success) {
        res.json({
          success: true,
          message: 'Email sent successfully'
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to send email'
        });
      }
    } catch (error) {
      logger.error('Error sending email:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
);

// Send test email
router.post('/test',
  authMiddleware,
  validate(testEmailSchema),
  async (req, res) => {
    try {
      const { to, template, data } = req.body;
      const user = (req as any).user;

      // Add user info to data
      const emailData = {
        ...data,
        name: user.name,
        email: user.email,
        testMode: true,
      };

      const success = await emailService.sendTemplateEmail(template, to, emailData);

      if (success) {
        res.json({
          success: true,
          message: 'Test email sent successfully'
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to send test email'
        });
      }
    } catch (error) {
      logger.error('Error sending test email:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
);

// Get notification preferences
router.get('/preferences',
  authMiddleware,
  async (req, res) => {
    try {
      const userId = (req as any).user.id;
      
      // Mock implementation - replace with actual database query
      const preferences = {
        assignments: true,
        grades: true,
        announcements: true,
        reminders: true,
        collaboration: true,
        system: false,
        weeklyDigest: true,
      };

      res.json({
        success: true,
        data: preferences
      });
    } catch (error) {
      logger.error('Error fetching email preferences:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
);

// Update notification preferences
router.put('/preferences',
  authMiddleware,
  validate(notificationPreferencesSchema),
  async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const preferences = req.body;

      // Mock implementation - replace with actual database update
      logger.info(`Updated email preferences for user ${userId}:`, preferences);

      res.json({
        success: true,
        message: 'Email preferences updated successfully',
        data: preferences
      });
    } catch (error) {
      logger.error('Error updating email preferences:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
);

// Get email templates list
router.get('/templates',
  authMiddleware,
  async (req, res) => {
    try {
      const user = (req as any).user;
      
      // Basic templates available to all users
      let templates = [
        {
          id: 'assignmentCreated',
          name: '과제 생성 알림',
          description: '새로운 과제가 생성되었을 때 학생들에게 발송'
        },
        {
          id: 'assignmentDue',
          name: '과제 마감 알림',
          description: '과제 마감일이 다가왔을 때 발송'
        },
        {
          id: 'assignmentGraded',
          name: '과제 채점 완료',
          description: '과제 채점이 완료되었을 때 발송'
        },
        {
          id: 'weeklyDigest',
          name: '주간 학습 요약',
          description: '주간 학습 활동 요약 발송'
        }
      ];

      // Additional templates for admins
      if (user.role === 'admin') {
        templates = templates.concat([
          {
            id: 'welcomeTeacher',
            name: '교사 환영 메일',
            description: '새로운 교사 가입 시 발송'
          },
          {
            id: 'welcomeStudent',
            name: '학생 환영 메일',
            description: '새로운 학생 가입 시 발송'
          },
          {
            id: 'systemMaintenance',
            name: '시스템 점검 안내',
            description: '시스템 점검 시 발송'
          }
        ]);
      }

      res.json({
        success: true,
        data: templates
      });
    } catch (error) {
      logger.error('Error fetching email templates:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
);

// Get email statistics (admin only)
router.get('/stats',
  authMiddleware,
  async (req, res) => {
    try {
      const user = (req as any).user;
      if (user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Mock statistics - replace with actual database queries
      const stats = {
        totalSent: 1250,
        successRate: 98.5,
        lastWeek: {
          sent: 186,
          delivered: 183,
          opened: 124,
          clicked: 67
        },
        topTemplates: [
          { template: 'assignmentCreated', count: 45 },
          { template: 'assignmentDue', count: 38 },
          { template: 'weeklyDigest', count: 32 },
          { template: 'assignmentGraded', count: 28 }
        ],
        emailService: {
          enabled: emailService.isEmailEnabled(),
          provider: process.env.SMTP_HOST ? 'SMTP' : 'Disabled'
        }
      };

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Error fetching email statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
);

// Unsubscribe from emails
router.post('/unsubscribe',
  async (req, res) => {
    try {
      const { token, email } = req.body;

      if (!token && !email) {
        return res.status(400).json({
          success: false,
          message: 'Token or email is required'
        });
      }

      // Mock implementation - replace with actual unsubscribe logic
      logger.info(`Unsubscribe request - Token: ${token}, Email: ${email}`);

      res.json({
        success: true,
        message: 'Successfully unsubscribed from email notifications'
      });
    } catch (error) {
      logger.error('Error processing unsubscribe:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
);

// Email service status
router.get('/status',
  authMiddleware,
  async (req, res) => {
    try {
      const user = (req as any).user;
      if (user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      res.json({
        success: true,
        data: {
          enabled: emailService.isEmailEnabled(),
          provider: process.env.SMTP_HOST || 'Not configured',
          from: process.env.SMTP_FROM || process.env.SMTP_USER || 'Not configured'
        }
      });
    } catch (error) {
      logger.error('Error fetching email service status:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
);

export default router;