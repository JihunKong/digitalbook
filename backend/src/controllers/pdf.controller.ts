import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import pdfService from '../services/pdf.service';
import { logger } from '../utils/logger';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), 'uploads', 'pdfs');
    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error as Error, '');
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `pdf-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Only accept PDF files
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'));
  }
};

export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  }
});

export class PDFController {
  /**
   * Upload a PDF file for a class
   */
  async uploadPDF(req: Request, res: Response) {
    try {
      const file = req.file;
      const { classId } = req.body;
      const teacherId = (req as any).user?.userId;

      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      if (!classId) {
        return res.status(400).json({ error: 'Class ID is required' });
      }

      if (!teacherId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Upload and process PDF
      const result = await pdfService.uploadPDF({
        classId,
        teacherId,
        filename: file.originalname,
        filepath: file.path,
        mimetype: file.mimetype,
        size: file.size,
      });

      res.status(201).json({
        success: true,
        data: result,
        message: 'PDF uploaded successfully. Processing will continue in background.',
      });
    } catch (error: any) {
      logger.error('PDF upload error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to upload PDF',
      });
    }
  }

  /**
   * Get PDF information
   */
  async getPDFInfo(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const pdfInfo = await pdfService.getPDFInfo(id);

      if (!pdfInfo) {
        return res.status(404).json({
          success: false,
          error: 'PDF not found',
        });
      }

      res.json({
        success: true,
        data: pdfInfo,
      });
    } catch (error: any) {
      logger.error('Get PDF info error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get PDF information',
      });
    }
  }

  /**
   * Get page content
   */
  async getPageContent(req: Request, res: Response) {
    try {
      const { id, pageNum } = req.params;
      const pageNumber = parseInt(pageNum);

      if (isNaN(pageNumber) || pageNumber < 1) {
        return res.status(400).json({
          success: false,
          error: 'Invalid page number',
        });
      }

      const pageContent = await pdfService.getPageContent(id, pageNumber);

      if (!pageContent) {
        return res.status(404).json({
          success: false,
          error: 'Page not found',
        });
      }

      res.json({
        success: true,
        data: pageContent,
      });
    } catch (error: any) {
      logger.error('Get page content error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get page content',
      });
    }
  }

  /**
   * Track page view
   */
  async trackPageView(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { pageNumber } = req.body;
      const studentId = (req as any).user?.userId || (req as any).student?.id;

      if (!studentId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
      }

      if (!pageNumber || pageNumber < 1) {
        return res.status(400).json({
          success: false,
          error: 'Invalid page number',
        });
      }

      const result = await pdfService.trackPageView(studentId, id, pageNumber);

      res.json(result);
    } catch (error: any) {
      logger.error('Track page view error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to track page view',
      });
    }
  }

  /**
   * Get current page tracking for a PDF
   */
  async getCurrentTracking(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const tracking = await pdfService.getCurrentPageTracking(id);

      res.json({
        success: true,
        data: tracking,
      });
    } catch (error: any) {
      logger.error('Get tracking error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get tracking data',
      });
    }
  }

  /**
   * Search PDF content
   */
  async searchPDF(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { query } = req.query;

      if (!query || typeof query !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Search query is required',
        });
      }

      const results = await pdfService.searchPDFContent(id, query);

      res.json({
        success: true,
        data: results,
      });
    } catch (error: any) {
      logger.error('Search PDF error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to search PDF',
      });
    }
  }

  /**
   * Delete PDF
   */
  async deletePDF(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const teacherId = (req as any).user?.userId;

      if (!teacherId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
      }

      // Check if teacher owns the PDF
      const pdfInfo = await pdfService.getPDFInfo(id);
      
      if (!pdfInfo) {
        return res.status(404).json({
          success: false,
          error: 'PDF not found',
        });
      }

      if (pdfInfo.uploadedBy !== teacherId) {
        return res.status(403).json({
          success: false,
          error: 'You do not have permission to delete this PDF',
        });
      }

      const result = await pdfService.deletePDF(id);

      res.json(result);
    } catch (error: any) {
      logger.error('Delete PDF error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to delete PDF',
      });
    }
  }

  /**
   * Get PDFs for a class
   */
  async getClassPDFs(req: Request, res: Response) {
    try {
      const { classId } = req.params;
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();

      const pdfs = await prisma.pDFTextbook.findMany({
        where: {
          classId,
        },
        select: {
          id: true,
          filename: true,
          fileSize: true,
          totalPages: true,
          status: true,
          createdAt: true,
          uploadedByUser: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      res.json({
        success: true,
        data: pdfs,
      });
    } catch (error: any) {
      logger.error('Get class PDFs error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get class PDFs',
      });
    }
  }
}

export default new PDFController();