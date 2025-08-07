import { Router } from 'express';
import { chatController } from '../controllers/chat.controller';
import { authenticate } from '../middlewares/auth';
import { authenticateFlexible } from '../middlewares/flexibleAuth';
import { validateRequest } from '../middlewares/validator';
import { chatSchemas } from '../utils/validation/chat.schemas';

const router = Router();

// Use flexible auth to support both regular and guest users
router.post(
  '/message',
  authenticateFlexible,
  validateRequest(chatSchemas.sendMessage),
  chatController.sendMessage
);

router.get(
  '/history/:sessionId',
  authenticateFlexible,
  chatController.getChatHistory
);

router.post(
  '/suggestions',
  authenticateFlexible,
  validateRequest(chatSchemas.getSuggestions),
  chatController.getSuggestions
);

export default router;