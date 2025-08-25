import { Router } from 'express';
import pdfController, { upload } from '../controllers/pdf.controller';
import { authenticateTeacher, authenticateUser, requireRole } from '../middlewares/auth';

const router = Router();

// All PDF routes require authentication
router.use(authenticateUser);

// Teacher/Admin routes (require teacher or admin role)
router.post(
  '/upload',
  requireRole(['TEACHER', 'ADMIN']),
  upload.single('pdf'),
  pdfController.uploadPDF.bind(pdfController)
);

router.delete(
  '/:id',
  requireRole(['TEACHER', 'ADMIN']),
  pdfController.deletePDF.bind(pdfController)
);

// General routes (already authenticated by router.use above)
router.get(
  '/:id',
  pdfController.getPDFInfo.bind(pdfController)
);

router.get(
  '/:id/page/:pageNum',
  pdfController.getPageContent.bind(pdfController)
);

router.post(
  '/:id/track',
  pdfController.trackPageView.bind(pdfController)
);

router.get(
  '/:id/tracking',
  pdfController.getCurrentTracking.bind(pdfController)
);

router.get(
  '/:id/search',
  pdfController.searchPDF.bind(pdfController)
);

router.get(
  '/class/:classId',
  pdfController.getClassPDFs.bind(pdfController)
);

export default router;