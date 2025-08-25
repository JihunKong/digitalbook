import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

// Teacher dashboard stats
router.get(
  '/teacher',
  authenticate,
  authorize('TEACHER'),
  dashboardController.getTeacherDashboard
);

export default router;