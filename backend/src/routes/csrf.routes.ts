import { Router } from 'express';
import { csrfTokenHandler } from '../middlewares/csrf';

const router = Router();

/**
 * @route   GET /api/csrf-token
 * @desc    CSRF 토큰 발급
 * @access  Public
 */
router.get('/token', csrfTokenHandler);

export default router;