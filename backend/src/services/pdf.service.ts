import { PrismaClient } from '@prisma/client';
import pdf from 'pdf-parse';
import * as fs from 'fs/promises';
import * as path from 'path';
import { logger } from '../utils/logger';
import Bull from 'bull';
import { getRedis } from '../config/redis';

const prisma = new PrismaClient();

// Parse Redis URL for Bull queue
function parseRedisUrl(url: string) {
  const parsedUrl = new URL(url);
  return {
    host: parsedUrl.hostname,
    port: parseInt(parsedUrl.port) || 6379,
  };
}

const redisConfig = parseRedisUrl(process.env.REDIS_URL || 'redis://redis:6379');

// PDF processing queue for background jobs
const pdfQueue = new Bull('pdf-processing', {
  redis: redisConfig,
});

interface PDFUploadData {
  classId: string;
  teacherId: string;
  filename: string;
  filepath: string;
  mimetype: string;
  size: number;
}

interface PDFPageContent {
  pageNumber: number;
  text: string;
  metadata?: any;
}

export class PDFService {
  /**
   * Upload and process a PDF file for a class
   */
  async uploadPDF(data: PDFUploadData) {
    try {
      // Create database record
      const pdfTextbook = await prisma.pDFTextbook.create({
        data: {
          classId: data.classId,
          filename: data.filename,
          fileUrl: data.filepath,
          uploadedBy: data.teacherId,
          fileSize: data.size,
          status: 'processing',
        },
      });

      // Add to processing queue
      await pdfQueue.add('process-pdf', {
        pdfId: pdfTextbook.id,
        filepath: data.filepath,
      });

      return pdfTextbook;
    } catch (error) {
      logger.error('PDF upload error:', error);
      throw new Error('Failed to upload PDF');
    }
  }

  /**
   * Process PDF and extract content
   */
  async processPDF(pdfId: string, filepath: string) {
    try {
      // Read PDF file
      const dataBuffer = await fs.readFile(filepath);
      const pdfData = await pdf(dataBuffer);

      // Extract text and metadata
      const pages: PDFPageContent[] = [];
      const lines = pdfData.text.split('\n');
      let currentPage = 1;
      let pageText = '';
      
      // Simple page detection (can be improved with better PDF parsing)
      for (const line of lines) {
        if (line.includes(`Page ${currentPage + 1}`) || line.match(/^\d+$/)) {
          if (pageText) {
            pages.push({
              pageNumber: currentPage,
              text: pageText.trim(),
            });
          }
          currentPage++;
          pageText = '';
        } else {
          pageText += line + '\n';
        }
      }

      // Add last page
      if (pageText) {
        pages.push({
          pageNumber: currentPage,
          text: pageText.trim(),
        });
      }

      // If no pages detected, treat entire content as one page
      if (pages.length === 0) {
        pages.push({
          pageNumber: 1,
          text: pdfData.text,
        });
      }

      // Update database with processed content
      await prisma.pDFTextbook.update({
        where: { id: pdfId },
        data: {
          totalPages: pdfData.numpages || pages.length,
          parsedContent: JSON.parse(JSON.stringify({
            pages: pages,
            metadata: pdfData.info,
            version: pdfData.version,
          })),
          status: 'completed',
        },
      });

      // Cache page content in Redis for fast access
      const redis = getRedis();
      for (const page of pages) {
        await redis.set(
          `pdf:${pdfId}:page:${page.pageNumber}`,
          JSON.stringify(page),
          'EX',
          3600 * 24 // Cache for 24 hours
        );
        
        // Generate and cache page insights for AI context
        try {
          const { aiService } = await import('./ai.service');
          const insights = await aiService.generatePageInsights(
            page.text,
            '5', // Default grade
            '국어' // Default subject
          );
          
          if (insights) {
            await redis.set(
              `pdf:${pdfId}:insights:${page.pageNumber}`,
              JSON.stringify(insights),
              'EX',
              3600 * 24
            );
          }
        } catch (insightError) {
          logger.warn(`Failed to generate insights for page ${page.pageNumber}:`, insightError);
        }
      }

      return {
        success: true,
        totalPages: pages.length,
        pdfId,
      };
    } catch (error) {
      logger.error('PDF processing error:', error);
      
      // Update status to failed
      await prisma.pDFTextbook.update({
        where: { id: pdfId },
        data: { status: 'failed' },
      });

      throw error;
    }
  }

  /**
   * Get PDF page content
   */
  async getPageContent(pdfId: string, pageNumber: number): Promise<PDFPageContent | null> {
    try {
      // Try to get from cache first
      const redis = getRedis();
      const cached = await redis.get(`pdf:${pdfId}:page:${pageNumber}`);
      if (cached) {
        return JSON.parse(cached);
      }

      // Get from database
      const pdfTextbook = await prisma.pDFTextbook.findUnique({
        where: { id: pdfId },
      });

      if (!pdfTextbook || !pdfTextbook.parsedContent) {
        return null;
      }

      const content = pdfTextbook.parsedContent as any;
      const page = content.pages?.find((p: any) => p.pageNumber === pageNumber);

      if (page) {
        // Cache for next time
        const redis = getRedis();
        await redis.set(
          `pdf:${pdfId}:page:${pageNumber}`,
          JSON.stringify(page),
          'EX',
          3600 * 24
        );
      }

      return page || null;
    } catch (error) {
      logger.error('Get page content error:', error);
      return null;
    }
  }

  /**
   * Track page view by student
   */
  async trackPageView(studentId: string, pdfId: string, pageNumber: number) {
    try {
      // Create page view record
      await prisma.pageView.create({
        data: {
          studentId,
          textbookId: pdfId,
          pageNumber,
        },
      });

      // Update real-time tracking in Redis
      const redis = getRedis();
      const key = `tracking:${pdfId}:current`;
      await redis.hset(key, studentId, pageNumber);
      await redis.expire(key, 3600); // Expire after 1 hour

      return { success: true };
    } catch (error) {
      logger.error('Track page view error:', error);
      return { success: false };
    }
  }

  /**
   * Get current page tracking for all students
   */
  async getCurrentPageTracking(pdfId: string) {
    try {
      const redis = getRedis();
      const key = `tracking:${pdfId}:current`;
      const tracking = await redis.hgetall(key);
      
      return Object.entries(tracking).map(([studentId, pageNumber]) => ({
        studentId,
        pageNumber: parseInt(pageNumber),
      }));
    } catch (error) {
      logger.error('Get page tracking error:', error);
      return [];
    }
  }

  /**
   * Search PDF content
   */
  async searchPDFContent(pdfId: string, query: string) {
    try {
      const pdfTextbook = await prisma.pDFTextbook.findUnique({
        where: { id: pdfId },
      });

      if (!pdfTextbook || !pdfTextbook.parsedContent) {
        return [];
      }

      const content = pdfTextbook.parsedContent as any;
      const results: any[] = [];

      // Search through pages
      for (const page of content.pages || []) {
        if (page.text.toLowerCase().includes(query.toLowerCase())) {
          const index = page.text.toLowerCase().indexOf(query.toLowerCase());
          const snippet = page.text.substring(
            Math.max(0, index - 50),
            Math.min(page.text.length, index + query.length + 50)
          );

          results.push({
            pageNumber: page.pageNumber,
            snippet: '...' + snippet + '...',
          });
        }
      }

      return results;
    } catch (error) {
      logger.error('Search PDF error:', error);
      return [];
    }
  }

  /**
   * Get PDF metadata and status
   */
  async getPDFInfo(pdfId: string) {
    try {
      const pdfTextbook = await prisma.pDFTextbook.findUnique({
        where: { id: pdfId },
        include: {
          class: {
            select: {
              id: true,
              name: true,
            },
          },
          uploadedByUser: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return pdfTextbook;
    } catch (error) {
      logger.error('Get PDF info error:', error);
      return null;
    }
  }

  /**
   * Delete PDF and associated data
   */
  async deletePDF(pdfId: string) {
    try {
      // Get PDF info
      const pdfTextbook = await prisma.pDFTextbook.findUnique({
        where: { id: pdfId },
      });

      if (!pdfTextbook) {
        throw new Error('PDF not found');
      }

      // Delete file from storage
      try {
        await fs.unlink(pdfTextbook.fileUrl);
      } catch (error) {
        logger.warn('File deletion failed:', error);
      }

      // Clear Redis cache
      const redis = getRedis();
      const keys = await redis.keys(`pdf:${pdfId}:*`);
      if (keys.length > 0) {
        await redis.del(...keys);
      }

      // Delete from database
      await prisma.pDFTextbook.delete({
        where: { id: pdfId },
      });

      return { success: true };
    } catch (error) {
      logger.error('Delete PDF error:', error);
      throw error;
    }
  }
}

// Process PDF queue jobs
pdfQueue.process('process-pdf', async (job) => {
  const { pdfId, filepath } = job.data;
  const pdfService = new PDFService();
  return await pdfService.processPDF(pdfId, filepath);
});

export default new PDFService();