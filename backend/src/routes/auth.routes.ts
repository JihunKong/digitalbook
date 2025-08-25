import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { validateRequest } from '../middlewares/validator';
import { authSchemas } from '../utils/validation/auth.schemas';

const router = Router();

router.post(
  '/register',
  validateRequest(authSchemas.register),
  (req, res, next) => authController.register(req, res, next)
);

// Alias for frontend compatibility
router.post(
  '/signup',
  validateRequest(authSchemas.register),
  (req, res, next) => authController.register(req, res, next)
);

router.post(
  '/login',
  validateRequest(authSchemas.login),
  (req, res, next) => authController.login(req, res, next)
);

router.post(
  '/refresh',
  (req, res, next) => authController.refreshToken(req, res, next)
);

router.post(
  '/logout',
  (req, res, next) => authController.logout(req, res, next)
);

export default router;