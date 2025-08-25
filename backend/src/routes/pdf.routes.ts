import { Router } from 'express';
import pdfController, { upload } from '../controllers/pdf.controller';
import { authenticateTeacher, authenticateUser } from '../middlewares/auth';

const router = Router();

// Teacher routes (require teacher authentication)
router.post(
  '/upload',
  authenticateTeacher,
  upload.single('pdf'),
  pdfController.uploadPDF.bind(pdfController)
);

router.delete(
  '/:id',
  authenticateTeacher,
  pdfController.deletePDF.bind(pdfController)
);

// General routes (any authenticated user)
router.get(
  '/:id',
  authenticateUser,
  pdfController.getPDFInfo.bind(pdfController)
);

router.get(
  '/:id/page/:pageNum',
  authenticateUser,
  pdfController.getPageContent.bind(pdfController)
);

router.post(
  '/:id/track',
  authenticateUser,
  pdfController.trackPageView.bind(pdfController)
);

router.get(
  '/:id/tracking',
  authenticateUser,
  pdfController.getCurrentTracking.bind(pdfController)
);

router.get(
  '/:id/search',
  authenticateUser,
  pdfController.searchPDF.bind(pdfController)
);

router.get(
  '/class/:classId',
  authenticateUser,
  pdfController.getClassPDFs.bind(pdfController)
);

export default router;