import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authRateLimiter } from '../middlewares/rateLimiter';
import { validateRequest } from '../middlewares/validator';
import { authSchemas } from '../utils/validation/auth.schemas';

const router = Router();

router.post(
  '/register',
  authRateLimiter,
  validateRequest(authSchemas.register),
  authController.register
);

router.post(
  '/login',
  authRateLimiter,
  validateRequest(authSchemas.login),
  authController.login
);

router.post(
  '/refresh',
  authRateLimiter,
  authController.refreshToken
);

router.post(
  '/logout',
  authController.logout
);

export default router;