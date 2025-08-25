import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { AppError } from '../middlewares/errorHandler';
import { logger } from '../utils/logger';
import { getDatabase } from '../config/database';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'documents');
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

// File filter to accept only specific document types
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = [
    'application/pdf',
    'text/plain',
    'text/markdown',
    'text/x-markdown',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword'
  ];
  
  const allowedExtensions = ['.pdf', '.txt', '.md', '.markdown', '.docx', '.doc'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedMimes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, TXT, MD, and DOCX files are allowed.'));
  }
};

// Configure multer upload
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit - increased from 50MB to match PDF upload limit
  }
});

class FileController {
  // Extract text from various file formats
  private async extractTextFromFile(filePath: string, mimeType: string): Promise<string> {
    const ext = path.extname(filePath).toLowerCase();
    
    try {
      // Handle text files (including markdown)
      if (mimeType === 'text/plain' || mimeType === 'text/markdown' || mimeType === 'text/x-markdown' || 
          ext === '.txt' || ext === '.md' || ext === '.markdown') {
        const content = await fs.readFile(filePath, 'utf-8');
        return content;
      }
      
      // Handle PDF files
      if (mimeType === 'application/pdf' || ext === '.pdf') {
        const dataBuffer = await fs.readFile(filePath);
        const data = await pdfParse(dataBuffer);
        return data.text;
      }
      
      // Handle Word documents
      if (mimeType.includes('wordprocessingml') || ext === '.docx') {
        const result = await mammoth.extractRawText({ path: filePath });
        return result.value;
      }
      
      // Handle old Word documents (.doc)
      if (mimeType === 'application/msword' || ext === '.doc') {
        // For .doc files, we might need a different library or conversion service
        // For now, return a message indicating manual processing needed
        return 'DOC 파일 형식은 현재 수동 처리가 필요합니다. DOCX 형식으로 변환 후 다시 업로드해주세요.';
      }
      
      throw new Error('Unsupported file format');
    } catch (error) {
      logger.error('Text extraction error:', error);
      throw new AppError('Failed to extract text from file', 500);
    }
  }

  // Upload and process document file
  uploadDocument = async (req: Request, res: Response, next: NextFunction) => {
    const prisma = getDatabase();
    
    try {
      if (!req.file) {
        throw new AppError('No file uploaded', 400);
      }
      
      const file = req.file;
      const userId = (req as any).userId;
      
      // Extract text from the uploaded file
      const extractedText = await this.extractTextFromFile(file.path, file.mimetype);
      
      // Save file information to database
      const uploadedFile = await prisma.file.create({
        data: {
          filename: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          path: file.path,
          uploadedBy: userId || 'anonymous',
          extractedText: extractedText.substring(0, 10000), // Store first 10000 chars
        },
      });
      
      // Calculate some basic statistics
      const wordCount = extractedText.split(/\s+/).filter(word => word.length > 0).length;
      const charCount = extractedText.length;
      const estimatedPages = Math.ceil(charCount / 500); // Assuming 500 chars per page
      
      logger.info(`Document uploaded: ${file.originalname} by user ${userId}`);
      
      res.status(200).json({
        message: 'File uploaded and processed successfully',
        file: {
          id: uploadedFile.id,
          filename: file.originalname,
          size: file.size,
          mimeType: file.mimetype,
        },
        content: {
          text: extractedText,
          statistics: {
            wordCount,
            charCount,
            estimatedPages,
          }
        }
      });
    } catch (error) {
      logger.error('File upload error:', error);
      
      // Clean up uploaded file if processing failed
      if (req.file) {
        try {
          await fs.unlink(req.file.path);
        } catch (unlinkError) {
          logger.error('Failed to delete uploaded file:', unlinkError);
        }
      }
      
      next(error);
    }
  }

  // Upload multiple files
  uploadMultipleDocuments = async (req: Request, res: Response, next: NextFunction) => {
    const prisma = getDatabase();
    
    try {
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        throw new AppError('No files uploaded', 400);
      }
      
      const files = req.files as Express.Multer.File[];
      const userId = (req as any).userId;
      const results = [];
      
      for (const file of files) {
        try {
          // Extract text from each file
          const extractedText = await this.extractTextFromFile(file.path, file.mimetype);
          
          // Save file information to database
          const uploadedFile = await prisma.file.create({
            data: {
              filename: file.filename,
              originalName: file.originalname,
              mimeType: file.mimetype,
              size: file.size,
              path: file.path,
              uploadedBy: userId,
              extractedText: extractedText.substring(0, 10000),
            },
          });
          
          const wordCount = extractedText.split(/\s+/).filter(word => word.length > 0).length;
          const charCount = extractedText.length;
          
          results.push({
            id: uploadedFile.id,
            filename: file.originalname,
            size: file.size,
            mimeType: file.mimetype,
            wordCount,
            charCount,
            status: 'success'
          });
        } catch (error) {
          results.push({
            filename: file.originalname,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Processing failed'
          });
          
          // Clean up failed file
          try {
            await fs.unlink(file.path);
          } catch (unlinkError) {
            logger.error('Failed to delete file:', unlinkError);
          }
        }
      }
      
      logger.info(`Multiple documents uploaded by user ${userId}`);
      
      res.status(200).json({
        message: 'Files processed',
        results
      });
    } catch (error) {
      logger.error('Multiple file upload error:', error);
      
      // Clean up all uploaded files if processing failed
      if (req.files && Array.isArray(req.files)) {
        for (const file of req.files) {
          try {
            await fs.unlink(file.path);
          } catch (unlinkError) {
            logger.error('Failed to delete uploaded file:', unlinkError);
          }
        }
      }
      
      next(error);
    }
  }

  // Get uploaded file by ID
  getFile = async (req: Request, res: Response, next: NextFunction) => {
    const prisma = getDatabase();
    
    try {
      const { fileId } = req.params;
      const userId = (req as any).userId;
      
      const file = await prisma.file.findFirst({
        where: {
          id: fileId,
          uploadedBy: userId,
        },
      });
      
      if (!file) {
        throw new AppError('File not found', 404);
      }
      
      res.json({
        file: {
          id: file.id,
          filename: file.originalName,
          mimeType: file.mimeType,
          size: file.size,
          uploadedAt: file.createdAt,
          extractedText: file.extractedText,
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Serve uploaded file content
  serveFile = async (req: Request, res: Response, next: NextFunction) => {
    const prisma = getDatabase();
    
    try {
      const { fileId } = req.params;
      const userId = (req as any).userId;
      
      const file = await prisma.file.findFirst({
        where: {
          id: fileId,
          uploadedBy: userId,
        },
      });
      
      if (!file) {
        throw new AppError('File not found', 404);
      }

      // Check if file exists on disk
      try {
        await fs.access(file.path);
      } catch (error) {
        throw new AppError('File not found on disk', 404);
      }
      
      // Set appropriate headers
      res.setHeader('Content-Type', file.mimeType);
      res.setHeader('Content-Disposition', `inline; filename="${file.originalName}"`);
      res.setHeader('Content-Length', file.size.toString());
      
      // Stream the file
      const fileStream = require('fs').createReadStream(file.path);
      fileStream.pipe(res);
      
      logger.info(`File served: ${file.originalName} by user ${userId}`);
    } catch (error) {
      next(error);
    }
  }

  // Delete uploaded file
  deleteFile = async (req: Request, res: Response, next: NextFunction) => {
    const prisma = getDatabase();
    
    try {
      const { fileId } = req.params;
      const userId = (req as any).userId;
      
      const file = await prisma.file.findFirst({
        where: {
          id: fileId,
          uploadedBy: userId,
        },
      });
      
      if (!file) {
        throw new AppError('File not found', 404);
      }
      
      // Delete physical file
      try {
        await fs.unlink(file.path);
      } catch (error) {
        logger.error('Failed to delete physical file:', error);
      }
      
      // Delete database record
      await prisma.file.delete({
        where: { id: fileId },
      });
      
      logger.info(`File deleted: ${file.originalName} by user ${userId}`);
      
      res.json({
        message: 'File deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

export const fileController = new FileController();