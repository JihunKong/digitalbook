import { Router } from 'express';
import { fileController, upload } from '../controllers/file.controller';
import { authenticate } from '../middlewares/auth';
import { authorize } from '../middlewares/authorize';

const router = Router();

// All file routes require authentication
router.use(authenticate);

// Upload single document (teachers and admins only)
router.post(
  '/upload',
  authorize(['TEACHER', 'ADMIN']),
  upload.single('document'),
  fileController.uploadDocument
);

// Upload multiple documents (teachers and admins only)
router.post(
  '/upload-multiple',
  authorize(['TEACHER', 'ADMIN']),
  upload.array('documents', 5), // Max 5 files at once
  fileController.uploadMultipleDocuments
);

// Get uploaded file
router.get(
  '/:fileId',
  authorize(['TEACHER', 'ADMIN']),
  fileController.getFile
);

// Delete uploaded file
router.delete(
  '/:fileId',
  authorize(['TEACHER', 'ADMIN']),
  fileController.deleteFile
);

export default router;