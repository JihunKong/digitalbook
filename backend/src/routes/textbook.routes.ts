import { Router } from 'express';
import { textbookController } from '../controllers/textbook.controller';
import { authenticate, authorize } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validator';
import { textbookSchemas } from '../utils/validation/textbook.schemas';

const router = Router();

router.get(
  '/',
  authenticate,
  textbookController.getTextbooks
);

router.get(
  '/:id',
  authenticate,
  textbookController.getTextbook
);

router.post(
  '/',
  authenticate,
  authorize('TEACHER'),
  validateRequest(textbookSchemas.create),
  textbookController.createTextbook
);

router.put(
  '/:id',
  authenticate,
  authorize('TEACHER'),
  validateRequest(textbookSchemas.update),
  textbookController.updateTextbook
);

router.delete(
  '/:id',
  authenticate,
  authorize('TEACHER'),
  textbookController.deleteTextbook
);

router.post(
  '/:id/generate',
  authenticate,
  authorize('TEACHER'),
  textbookController.generateContent
);

router.post(
  '/generate-content',
  authenticate,
  authorize('TEACHER'),
  textbookController.generatePageContent
);

router.post(
  '/generate-questions',
  authenticate,
  authorize('TEACHER'),
  textbookController.generateQuestions
);

router.post(
  '/train-ai',
  authenticate,
  authorize('TEACHER'),
  textbookController.trainAI
);

router.post(
  '/:id/publish',
  authenticate,
  authorize('TEACHER'),
  textbookController.publishTextbook
);

// 교과서 공개 설정
router.patch(
  '/:id/public',
  authenticate,
  authorize('TEACHER'),
  textbookController.togglePublic
);

// 접근 코드 생성
router.post(
  '/:id/access-code',
  authenticate,
  authorize('TEACHER'),
  textbookController.generateAccessCode
);

// 공개 교과서 목록 조회 (인증 불필요)
router.get(
  '/public/list',
  textbookController.getPublicTextbooks
);

export default router;