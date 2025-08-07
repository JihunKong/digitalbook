import { Router } from 'express';
import { authenticateTeacher } from '../middlewares/auth';
import {
  createClass,
  uploadDocument,
  getTeacherClasses,
  getClassQuestions,
  deleteClass,
  upload
} from '../controllers/class.controller';

const router = Router();

// 교사 전용 라우트
router.post('/teacher/class/create', authenticateTeacher, createClass);
router.get('/teacher/classes', authenticateTeacher, getTeacherClasses);
router.post('/teacher/class/:classId/document', authenticateTeacher, upload.single('document'), uploadDocument);
router.get('/teacher/class/:classId/questions', authenticateTeacher, getClassQuestions);
router.delete('/teacher/class/:classId', authenticateTeacher, deleteClass);

export default router;