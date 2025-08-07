import { Router } from 'express';
import { guestController } from '../controllers/guest.controller';
import { authenticateGuest } from '../middlewares/auth.unified';
import { validate } from '../middlewares/validation';
import Joi from 'joi';

const router = Router();

// 테스트 엔드포인트
router.get('/test', (req, res) => {
  res.json({ message: 'Guest routes working!' });
});

// 접근 코드로 교과서 접근
router.post(
  '/access',
  // validate({
  //   body: Joi.object({
  //     accessCode: Joi.string().required(),
  //     studentId: Joi.string().required(),
  //     studentName: Joi.string().required()
  //   })
  // }),
  guestController.accessTextbook
);

// 게스트 학습 기록 저장
router.post(
  '/study-record',
  authenticateGuest,
  validate({
    body: Joi.object({
      chapterId: Joi.string().required(),
      pageNumber: Joi.number().required(),
      timeSpent: Joi.number().required(),
      completed: Joi.boolean()
    })
  }),
  guestController.saveGuestStudyRecord
);

// 게스트 채팅 메시지 저장
router.post(
  '/chat',
  authenticateGuest,
  validate({
    body: Joi.object({
      content: Joi.string().required(),
      context: Joi.object()
    })
  }),
  guestController.saveGuestChatMessage
);

// 게스트 학습 통계 조회
router.get(
  '/stats',
  authenticateGuest,
  guestController.getGuestStats
);

export default router;