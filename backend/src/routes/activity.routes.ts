import { Router } from 'express';
import { activityController } from '../controllers/activity.controller';
import { authenticateTeacher, authenticateUser } from '../middlewares/auth';

const router = Router();

// Teacher routes
router.post(
  '/generate/:pdfId',
  authenticateTeacher,
  activityController.generateFromPDF.bind(activityController)
);

router.put(
  '/:activityId',
  authenticateTeacher,
  activityController.updateActivity.bind(activityController)
);

router.get(
  '/:activityId/responses',
  authenticateTeacher,
  activityController.getActivityResponses.bind(activityController)
);

// General authenticated user routes
router.get(
  '/class/:classId',
  authenticateUser,
  activityController.getClassActivities.bind(activityController)
);

router.get(
  '/:activityId',
  authenticateUser,
  activityController.getActivity.bind(activityController)
);

// Student routes
router.post(
  '/:activityId/submit',
  authenticateUser,
  activityController.submitResponse.bind(activityController)
);

export default router;