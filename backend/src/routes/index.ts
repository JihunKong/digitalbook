import { Router } from 'express';
import authRoutes from './auth.routes';
import oauthRoutes from './oauth.routes';
import userRoutes from './user.routes';
import textbookRoutes from './textbook.routes';
import classRoutes from './class.routes';
import chatRoutes from './chat.routes';
// import analyticsRoutes from './analytics.routes';
import imagesRoutes from './images.routes';
// import guestRoutes from './guest.routes'; // TODO: Fix guest controller
import studentRoutes from './student.routes';
// import multimediaRoutes from './multimedia.routes';
import notificationRoutes from './notification.routes';
// import performanceRoutes from './performance.routes';
// import backupRoutes from './backup.routes';
// import i18nRoutes from './i18n.routes';
import healthRoutes from './health.routes';
import csrfRoutes from './csrf.routes';
// import ttsRoutes from './tts.routes'; // TTS 기능 제거됨
import fileRoutes from './file.routes';
import pdfRoutes from './pdf.routes';
import activityRoutes from './activity.routes';
import dashboardRoutes from './dashboard.routes';
import cblRoutes from './cbl.routes'; // CBL 학습 시스템
import assessmentRoutes from './assessment.routes'; // 서술형 평가 시스템
// Phase 4: 특화 교육 프레임워크
import startupRoutes from './startup.routes'; // 창업교육
import pblRoutes from './pbl.routes'; // 프로젝트 기반 학습
import selRoutes from './sel.routes'; // 사회정서학습
import gcedRoutes from './gced.routes'; // 세계시민교육

const router = Router();

router.use('/csrf', csrfRoutes);
router.use('/auth', authRoutes);
router.use('/oauth', oauthRoutes);
router.use('/users', userRoutes);
router.use('/textbooks', textbookRoutes);
router.use('/classes', classRoutes);
router.use('/chat', chatRoutes);
// router.use('/analytics', analyticsRoutes);
router.use('/images', imagesRoutes);
// router.use('/guest', guestRoutes); // TODO: Fix guest controller
router.use('/students', studentRoutes);
// router.use('/multimedia', multimediaRoutes);
router.use('/notifications', notificationRoutes);
// router.use('/performance', performanceRoutes);
// router.use('/backup', backupRoutes);
// router.use('/i18n', i18nRoutes);
router.use('/health', healthRoutes);
// router.use('/tts', ttsRoutes); // TTS 기능 제거됨
router.use('/files', fileRoutes);
router.use('/pdf', pdfRoutes);
router.use('/activities', activityRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/cbl', cblRoutes); // CBL 학습 시스템
router.use('/assessment', assessmentRoutes); // 서술형 평가 시스템
// Phase 4: 특화 교육 프레임워크
router.use('/startup', startupRoutes); // 창업교육
router.use('/pbl', pblRoutes); // 프로젝트 기반 학습
router.use('/sel', selRoutes); // 사회정서학습
router.use('/gced', gcedRoutes); // 세계시민교육

export default router;