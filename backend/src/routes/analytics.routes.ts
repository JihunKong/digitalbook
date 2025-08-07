import { Router } from 'express';
import { analyticsController } from '../controllers/analytics.controller';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

router.get(
  '/dashboard',
  authenticate,
  analyticsController.getDashboardStats
);

router.get(
  '/class/:classId',
  authenticate,
  authorize('TEACHER'),
  analyticsController.getClassAnalytics
);

router.get(
  '/student/:studentId',
  authenticate,
  analyticsController.getStudentAnalytics
);

router.get(
  '/textbook/:textbookId',
  authenticate,
  analyticsController.getTextbookAnalytics
);

router.get(
  '/textbook/:textbookId/export-responses',
  authenticate,
  authorize('TEACHER'),
  analyticsController.exportQuestionResponses
);

// Advanced analytics routes
router.get(
  '/advanced',
  authenticate,
  analyticsController.getAdvancedAnalytics
);

router.get(
  '/user/:userId/insights',
  authenticate,
  analyticsController.getUserInsights
);

router.get(
  '/teacher/analytics',
  authenticate,
  authorize('TEACHER'),
  analyticsController.getTeacherAnalytics
);

router.get(
  '/activity-feed',
  authenticate,
  analyticsController.getActivityFeed
);

router.get(
  '/engagement',
  authenticate,
  analyticsController.getEngagementMetrics
);

export default router;