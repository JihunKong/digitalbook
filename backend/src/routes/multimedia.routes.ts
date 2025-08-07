import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../middlewares/auth';
import { multimediaController } from '../controllers/multimedia.controller';
import { validate } from '../middlewares/validation';
import { z } from 'zod';

const router = Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
    files: 10, // Maximum 10 files at once
  },
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowedMimeTypes = [
      // Images
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      // Videos
      'video/mp4',
      'video/webm',
      'video/ogg',
      'video/quicktime',
      // Documents
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      // Text
      'text/plain',
      'text/csv',
      'text/markdown',
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not allowed`));
    }
  },
});

// Validation schemas
const uploadSchema = z.object({
  body: z.object({
    textbookId: z.string().uuid().optional(),
    classId: z.string().uuid().optional(),
  }),
});

const updateSchema = z.object({
  body: z.object({
    originalName: z.string().optional(),
    textbookId: z.string().uuid().nullable().optional(),
    classId: z.string().uuid().nullable().optional(),
    metadata: z.record(z.any()).optional(),
  }),
});

const bulkDeleteSchema = z.object({
  body: z.object({
    ids: z.array(z.string().uuid()).min(1),
  }),
});

const querySchema = z.object({
  query: z.object({
    type: z.enum(['IMAGE', 'VIDEO', 'PDF', 'DOCUMENT', 'OTHER']).optional(),
    textbookId: z.string().uuid().optional(),
    classId: z.string().uuid().optional(),
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
  }),
});

// Routes
router.use(authenticate);

// Upload files
router.post(
  '/upload',
  upload.array('files', 10),
  validate(uploadSchema),
  multimediaController.upload.bind(multimediaController)
);

// Get media library
router.get(
  '/library',
  validate(querySchema),
  multimediaController.getLibrary.bind(multimediaController)
);

// Get single media file
router.get(
  '/:id',
  multimediaController.getById.bind(multimediaController)
);

// Update media file metadata
router.patch(
  '/:id',
  validate(updateSchema),
  multimediaController.update.bind(multimediaController)
);

// Delete media file
router.delete(
  '/:id',
  multimediaController.delete.bind(multimediaController)
);

// Bulk delete media files
router.post(
  '/bulk-delete',
  validate(bulkDeleteSchema),
  multimediaController.bulkDelete.bind(multimediaController)
);

export default router;