import { Router } from 'express';
import { assignmentController } from '../controllers/assignment.controller';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

// Get assignments for a class
router.get('/class/:classId', authenticate, assignmentController.getByClass);

// Get assignment details
router.get('/:id', authenticate, assignmentController.getById);

// Create assignment (teacher only)
router.post(
  '/',
  authenticate,
  authorize('TEACHER'),
  assignmentController.create
);

// Submit assignment (student)
router.post(
  '/:id/submit',
  authenticate,
  authorize('STUDENT'),
  assignmentController.submit
);

// Get submissions for an assignment (teacher only)
router.get(
  '/:id/submissions',
  authenticate,
  authorize('TEACHER'),
  assignmentController.getSubmissions
);

// Delete assignment (teacher only)
router.delete(
  '/:id',
  authenticate,
  authorize('TEACHER'),
  assignmentController.delete
);

export default router;