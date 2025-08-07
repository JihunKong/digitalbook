import request from 'supertest';
import { app } from '../index';
import { getDatabase } from '../config/database';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

// Mock user for testing
const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  role: 'TEACHER'
};

// Generate test token
const generateTestToken = () => {
  return jwt.sign(mockUser, process.env.JWT_SECRET || 'test-secret', {
    expiresIn: '1h'
  });
};

describe('Multimedia API', () => {
  let authToken: string;
  let uploadedFileId: string;

  beforeAll(async () => {
    authToken = generateTestToken();
  });

  afterAll(async () => {
    // Clean up test files
    const db = getDatabase();
    await db.media.deleteMany({
      where: { userId: mockUser.id }
    });
  });

  describe('POST /api/multimedia/upload', () => {
    it('should upload a single image file', async () => {
      const testImagePath = path.join(__dirname, '../../../test-fixtures/test-image.jpg');
      
      const response = await request(app)
        .post('/api/multimedia/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('files', testImagePath)
        .field('textbookId', 'test-textbook-id');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.files).toHaveLength(1);
      expect(response.body.files[0].type).toBe('IMAGE');
      
      uploadedFileId = response.body.files[0].id;
    });

    it('should reject unauthorized requests', async () => {
      const response = await request(app)
        .post('/api/multimedia/upload')
        .attach('files', Buffer.from('test'), 'test.txt');

      expect(response.status).toBe(401);
    });

    it('should reject requests without files', async () => {
      const response = await request(app)
        .post('/api/multimedia/upload')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/multimedia/library', () => {
    it('should return paginated media library', async () => {
      const response = await request(app)
        .get('/api/multimedia/library')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: '1', limit: '10' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.pagination).toBeDefined();
    });

    it('should filter by media type', async () => {
      const response = await request(app)
        .get('/api/multimedia/library')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ type: 'IMAGE' });

      expect(response.status).toBe(200);
      expect(response.body.data.every((item: any) => item.type === 'IMAGE')).toBe(true);
    });
  });

  describe('GET /api/multimedia/:id', () => {
    it('should return a specific media file', async () => {
      const response = await request(app)
        .get(`/api/multimedia/${uploadedFileId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(uploadedFileId);
    });

    it('should return 404 for non-existent media', async () => {
      const response = await request(app)
        .get('/api/multimedia/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/multimedia/:id', () => {
    it('should update media metadata', async () => {
      const response = await request(app)
        .patch(`/api/multimedia/${uploadedFileId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          originalName: 'updated-name.jpg',
          metadata: { description: 'Test description' }
        });

      expect(response.status).toBe(200);
      expect(response.body.data.originalName).toBe('updated-name.jpg');
    });
  });

  describe('DELETE /api/multimedia/:id', () => {
    it('should delete a media file', async () => {
      const response = await request(app)
        .delete(`/api/multimedia/${uploadedFileId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(204);

      // Verify deletion
      const checkResponse = await request(app)
        .get(`/api/multimedia/${uploadedFileId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(checkResponse.status).toBe(404);
    });
  });

  describe('POST /api/multimedia/bulk-delete', () => {
    it('should delete multiple files', async () => {
      // First, upload some test files
      const uploads = await Promise.all([
        request(app)
          .post('/api/multimedia/upload')
          .set('Authorization', `Bearer ${authToken}`)
          .attach('files', Buffer.from('test1'), 'test1.txt'),
        request(app)
          .post('/api/multimedia/upload')
          .set('Authorization', `Bearer ${authToken}`)
          .attach('files', Buffer.from('test2'), 'test2.txt')
      ]);

      const ids = uploads.map(res => res.body.files[0].id);

      const response = await request(app)
        .post('/api/multimedia/bulk-delete')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ids });

      expect(response.status).toBe(200);
      expect(response.body.deleted).toBe(2);
    });
  });
});