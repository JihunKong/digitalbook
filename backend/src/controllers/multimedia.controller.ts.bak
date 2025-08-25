import { Request, Response, NextFunction } from 'express';
import { getDatabase } from '../config/database';
import { AppError } from '../middlewares/errorHandler';
import { logger } from '../utils/logger';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

class MultimediaController {
  private readonly UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'multimedia');
  private readonly MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
  private readonly ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  private readonly ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg'];
  private readonly ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

  constructor() {
    // Ensure upload directory exists
    this.ensureUploadDirectory();
  }

  private async ensureUploadDirectory() {
    try {
      await fs.mkdir(this.UPLOAD_DIR, { recursive: true });
    } catch (error) {
      logger.error('Failed to create upload directory:', error);
    }
  }

  private getMediaType(mimeType: string): 'IMAGE' | 'VIDEO' | 'PDF' | 'DOCUMENT' | 'OTHER' {
    if (this.ALLOWED_IMAGE_TYPES.includes(mimeType)) return 'IMAGE';
    if (this.ALLOWED_VIDEO_TYPES.includes(mimeType)) return 'VIDEO';
    if (mimeType === 'application/pdf') return 'PDF';
    if (this.ALLOWED_DOCUMENT_TYPES.includes(mimeType)) return 'DOCUMENT';
    return 'OTHER';
  }

  private async processImage(buffer: Buffer, outputPath: string) {
    // Process and optimize images
    await sharp(buffer)
      .resize(2000, 2000, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: 90, progressive: true })
      .toFile(outputPath.replace(/\.[^.]+$/, '.jpg'));
    
    return outputPath.replace(/\.[^.]+$/, '.jpg');
  }

  async upload(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const files = req.files as Express.Multer.File[];
      const { textbookId, classId } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      if (!files || files.length === 0) {
        throw new AppError('No files uploaded', 400);
      }

      const db = getDatabase();
      const uploadedFiles = [];

      for (const file of files) {
        // Validate file size
        if (file.size > this.MAX_FILE_SIZE) {
          throw new AppError(`File ${file.originalname} exceeds maximum size of 100MB`, 400);
        }

        const fileId = uuidv4();
        const ext = path.extname(file.originalname);
        const mediaType = this.getMediaType(file.mimetype);
        
        let filename = `${fileId}${ext}`;
        let filePath = path.join(this.UPLOAD_DIR, filename);

        // Create subdirectories based on type
        const typeDir = path.join(this.UPLOAD_DIR, mediaType.toLowerCase());
        await fs.mkdir(typeDir, { recursive: true });
        filePath = path.join(typeDir, filename);

        // Process based on file type
        if (mediaType === 'IMAGE') {
          // Optimize images
          const processedPath = await this.processImage(file.buffer, filePath);
          filename = path.basename(processedPath);
          filePath = processedPath;
        } else {
          // Save other files as-is
          await fs.writeFile(filePath, file.buffer);
        }

        // Generate thumbnail for videos and PDFs
        let thumbnailUrl = null;
        if (mediaType === 'VIDEO' || mediaType === 'PDF') {
          // For now, we'll leave thumbnail generation as a TODO
          // This would require ffmpeg for videos and pdf-thumbnail for PDFs
          thumbnailUrl = null;
        }

        // Save to database
        const media = await db.media.create({
          data: {
            id: fileId,
            filename,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            url: `/uploads/multimedia/${mediaType.toLowerCase()}/${filename}`,
            type: mediaType,
            userId,
            textbookId: textbookId || null,
            classId: classId || null,
            metadata: {
              thumbnailUrl,
              uploadedAt: new Date().toISOString(),
            },
          },
        });

        uploadedFiles.push(media);
      }

      logger.info(`${uploadedFiles.length} files uploaded by user ${userId}`);
      res.json({ 
        success: true,
        files: uploadedFiles 
      });
    } catch (error) {
      next(error);
    }
  }

  async getLibrary(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const { type, textbookId, classId, page = '1', limit = '20' } = req.query;

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const db = getDatabase();
      
      // Build where clause
      const where: any = { userId };
      if (type) where.type = type as string;
      if (textbookId) where.textbookId = textbookId as string;
      if (classId) where.classId = classId as string;

      // Pagination
      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
      const take = parseInt(limit as string);

      // Get total count
      const total = await db.media.count({ where });

      // Get media files
      const media = await db.media.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          textbook: {
            select: {
              id: true,
              title: true,
            },
          },
          class: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      res.json({
        success: true,
        data: media,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          totalPages: Math.ceil(total / take),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const db = getDatabase();
      const media = await db.media.findFirst({
        where: {
          id,
          userId,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          textbook: {
            select: {
              id: true,
              title: true,
            },
          },
          class: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!media) {
        throw new AppError('Media not found', 404);
      }

      res.json({
        success: true,
        data: media,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { originalName, textbookId, classId, metadata } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const db = getDatabase();
      
      // Check if media exists and belongs to user
      const existingMedia = await db.media.findFirst({
        where: { id, userId },
      });

      if (!existingMedia) {
        throw new AppError('Media not found', 404);
      }

      // Update media
      const updatedMedia = await db.media.update({
        where: { id },
        data: {
          ...(originalName && { originalName }),
          ...(textbookId !== undefined && { textbookId }),
          ...(classId !== undefined && { classId }),
          ...(metadata && { 
            metadata: {
              ...existingMedia.metadata as object,
              ...metadata,
            },
          }),
          updatedAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          textbook: {
            select: {
              id: true,
              title: true,
            },
          },
          class: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      logger.info(`Media ${id} updated by user ${userId}`);
      res.json({
        success: true,
        data: updatedMedia,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const db = getDatabase();
      
      // Check if media exists and belongs to user
      const media = await db.media.findFirst({
        where: { id, userId },
      });

      if (!media) {
        throw new AppError('Media not found', 404);
      }

      // Delete physical file
      try {
        const filePath = path.join(process.cwd(), media.url);
        await fs.unlink(filePath);
      } catch (error) {
        logger.error(`Failed to delete physical file: ${media.url}`, error);
      }

      // Delete from database
      await db.media.delete({
        where: { id },
      });

      logger.info(`Media ${id} deleted by user ${userId}`);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async bulkDelete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { ids } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      if (!Array.isArray(ids) || ids.length === 0) {
        throw new AppError('Invalid media IDs', 400);
      }

      const db = getDatabase();
      
      // Get all media files that belong to the user
      const mediaFiles = await db.media.findMany({
        where: {
          id: { in: ids },
          userId,
        },
      });

      if (mediaFiles.length === 0) {
        throw new AppError('No media files found', 404);
      }

      // Delete physical files
      for (const media of mediaFiles) {
        try {
          const filePath = path.join(process.cwd(), media.url);
          await fs.unlink(filePath);
        } catch (error) {
          logger.error(`Failed to delete physical file: ${media.url}`, error);
        }
      }

      // Delete from database
      const result = await db.media.deleteMany({
        where: {
          id: { in: mediaFiles.map(m => m.id) },
        },
      });

      logger.info(`${result.count} media files deleted by user ${userId}`);
      res.json({
        success: true,
        deleted: result.count,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const multimediaController = new MultimediaController();