import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import request from 'supertest';
import { app } from '../src/index';
import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

describe('PDF Management Tests', () => {
  let teacherToken: string;
  let classId: string;
  let pdfId: string;
  const testPdfPath = path.join(__dirname, 'fixtures', 'test.pdf');

  beforeAll(async () => {
    // Create test teacher
    const authResponse = await request(app)
      .post('/api/auth/signup')
      .send({
        email: 'pdf-teacher@test.com',
        password: 'SecurePass123!',
        name: '김선생님',
        role: 'TEACHER',
      });
    
    teacherToken = authResponse.body.accessToken;

    // Create test class
    const classResponse = await request(app)
      .post('/api/classes')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        name: 'PDF 테스트 수업',
        description: 'PDF 기능 테스트용',
      });
    
    classId = classResponse.body.class.id;

    // Create test PDF file
    await fs.mkdir(path.dirname(testPdfPath), { recursive: true });
    await fs.writeFile(testPdfPath, Buffer.from('%PDF-1.4\nTest PDF Content'));
  });

  afterAll(async () => {
    // Clean up
    await fs.unlink(testPdfPath).catch(() => {});
    await prisma.$disconnect();
  });

  describe('PDF Upload', () => {
    it('should upload PDF for a class', async () => {
      const response = await request(app)
        .post('/api/pdf/upload')
        .set('Authorization', `Bearer ${teacherToken}`)
        .field('classId', classId)
        .attach('pdf', testPdfPath);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.filename).toContain('.pdf');
      expect(response.body.data.status).toBe('processing');
      
      pdfId = response.body.data.id;
    });

    it('should reject non-PDF files', async () => {
      const txtPath = path.join(__dirname, 'fixtures', 'test.txt');
      await fs.writeFile(txtPath, 'Not a PDF');

      const response = await request(app)
        .post('/api/pdf/upload')
        .set('Authorization', `Bearer ${teacherToken}`)
        .field('classId', classId)
        .attach('pdf', txtPath);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('PDF');
      
      await fs.unlink(txtPath);
    });

    it('should enforce file size limit', async () => {
      // Mock large file
      jest.spyOn(fs, 'stat').mockResolvedValueOnce({
        size: 150 * 1024 * 1024, // 150MB
      } as any);

      const response = await request(app)
        .post('/api/pdf/upload')
        .set('Authorization', `Bearer ${teacherToken}`)
        .field('classId', classId)
        .attach('pdf', testPdfPath);

      expect(response.status).toBe(413);
      expect(response.body.error).toContain('크기');
    });
  });

  describe('PDF Content Access', () => {
    it('should get PDF information', async () => {
      const response = await request(app)
        .get(`/api/pdf/${pdfId}`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(pdfId);
      expect(response.body.data).toHaveProperty('totalPages');
    });

    it('should get specific page content', async () => {
      const response = await request(app)
        .get(`/api/pdf/${pdfId}/page/1`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('pageNumber');
      expect(response.body.data.pageNumber).toBe(1);
      expect(response.body.data).toHaveProperty('content');
    });

    it('should return 404 for non-existent page', async () => {
      const response = await request(app)
        .get(`/api/pdf/${pdfId}/page/999`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('페이지');
    });
  });

  describe('PDF Search', () => {
    it('should search PDF content', async () => {
      const response = await request(app)
        .get(`/api/pdf/${pdfId}/search`)
        .query({ query: 'test' })
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should require search query', async () => {
      const response = await request(app)
        .get(`/api/pdf/${pdfId}/search`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('검색어');
    });
  });

  describe('Page Tracking', () => {
    let studentToken: string;

    beforeAll(async () => {
      // Create student and join class
      const joinResponse = await request(app)
        .post('/api/classes/join')
        .send({
          code: 'TEST01', // Assuming class code
          studentName: '학생1',
          studentId: 'STU001',
        });
      
      studentToken = joinResponse.body.token;
    });

    it('should track page view for student', async () => {
      const response = await request(app)
        .post(`/api/pdf/${pdfId}/track`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          pageNumber: 1,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should get current page tracking', async () => {
      const response = await request(app)
        .get(`/api/pdf/${pdfId}/tracking`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });
  });

  describe('PDF Deletion', () => {
    it('should allow owner to delete PDF', async () => {
      const response = await request(app)
        .delete(`/api/pdf/${pdfId}`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should prevent non-owner from deleting PDF', async () => {
      // Create another teacher
      const otherTeacherResponse = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'other-teacher@test.com',
          password: 'SecurePass123!',
          name: '이선생님',
          role: 'TEACHER',
        });
      
      const otherToken = otherTeacherResponse.body.accessToken;

      const response = await request(app)
        .delete(`/api/pdf/${pdfId}`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('권한');
    });
  });

  describe('Class PDFs', () => {
    it('should list all PDFs for a class', async () => {
      const response = await request(app)
        .get(`/api/pdf/class/${classId}`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });
  });
});