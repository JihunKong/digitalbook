import { Router } from 'express';
import { fileController, upload } from '../controllers/file.controller';
import { authenticate, requireRole } from '../middlewares/auth';

const router = Router();

// All file routes require authentication
router.use(authenticate);

// Upload single document (teachers and admins only)
router.post(
  '/upload',
  requireRole(['TEACHER', 'ADMIN']),
  upload.fields([{ name: 'file', maxCount: 1 }]),
  fileController.uploadDocument
);

// Upload multiple documents (teachers and admins only)
router.post(
  '/upload-multiple',
  requireRole(['TEACHER', 'ADMIN']),
  upload.array('documents', 5), // Max 5 files at once
  fileController.uploadMultipleDocuments
);

// Get uploaded file
router.get(
  '/:fileId',
  requireRole(['TEACHER', 'ADMIN']),
  fileController.getFile
);

// Serve uploaded file content (for PDF viewer, etc.)
router.get(
  '/:fileId/content',
  requireRole(['TEACHER', 'ADMIN']),
  fileController.serveFile
);

// Delete uploaded file
router.delete(
  '/:fileId',
  requireRole(['TEACHER', 'ADMIN']),
  fileController.deleteFile
);

export default router;