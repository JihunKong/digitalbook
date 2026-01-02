import { Router } from 'express';
import { oauthController } from '../controllers/oauth.controller';

const router = Router();

// Google OAuth 시작
router.get('/google', oauthController.googleAuth);

// Google OAuth 콜백
router.get('/google/callback', (req, res, next) => 
  oauthController.googleCallback(req, res, next)
);

// Google 계정 설정 완료 (역할 선택 및 약관 동의)
router.post('/google/complete', (req, res, next) => 
  oauthController.completeGoogleSetup(req, res, next)
);

export default router;