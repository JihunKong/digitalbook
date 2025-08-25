import { Router } from 'express';
import { authenticateTeacher, authenticateUser } from '../middlewares/auth';
import {
  createClass,
  uploadDocument,
  getTeacherClasses,
  getClassQuestions,
  deleteClass,
  upload
} from '../controllers/class.controller';
import { enrollmentController } from '../controllers/enrollment.controller';

const router = Router();

// 교사 전용 라우트
router.post('/teacher/class/create', authenticateTeacher, createClass);
router.get('/teacher/classes', authenticateTeacher, getTeacherClasses);
router.post('/teacher/class/:classId/document', authenticateTeacher, upload.single('document'), uploadDocument);
router.get('/teacher/class/:classId/questions', authenticateTeacher, getClassQuestions);
router.delete('/teacher/class/:classId', authenticateTeacher, deleteClass);

// 학생 enrollment 라우트
router.post('/enroll', authenticateUser, enrollmentController.enrollWithCode.bind(enrollmentController));
router.get('/my-classes', authenticateUser, enrollmentController.getMyClasses.bind(enrollmentController));
router.get('/:classId/details', authenticateUser, enrollmentController.getClassDetails.bind(enrollmentController));
router.delete('/:classId/leave', authenticateUser, enrollmentController.leaveClass.bind(enrollmentController));

export default router;