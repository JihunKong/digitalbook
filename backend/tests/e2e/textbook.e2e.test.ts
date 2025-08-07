import request from 'supertest';
import express from 'express';
import { setupTestDatabase, teardownTestDatabase, prisma } from '../setup/testDatabase';
import { cleanupTestData, createTestUser, createTestClass } from '../setup/testHelpers';
import textbookRoutes from '../../src/routes/textbook.routes';
import { authenticateToken } from '../../src/middlewares/auth';
import { errorHandler } from '../../src/middlewares/errorHandler';

const app = express();
app.use(express.json());
app.use('/api/textbooks', authenticateToken, textbookRoutes);
app.use(errorHandler);

describe('Textbook Creation E2E Tests', () => {
  let teacherToken: string;
  let teacherId: string;
  let studentToken: string;
  let studentId: string;
  let testClassId: string;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await cleanupTestData();

    // Create test users
    const teacher = await createTestUser({
      email: 'teacher@test.com',
      password: 'Pass123!',
      name: 'Test Teacher',
      role: 'TEACHER',
    });
    teacherToken = teacher.token;
    teacherId = teacher.user.id;

    const student = await createTestUser({
      email: 'student@test.com',
      password: 'Pass123!',
      name: 'Test Student',
      role: 'STUDENT',
    });
    studentToken = student.token;
    studentId = student.user.id;

    // Create test class
    const testClass = await createTestClass(teacherId);
    testClassId = testClass.id;
  });

  describe('Textbook Creation Flow', () => {
    it('should complete full textbook creation process', async () => {
      const textbookData = {
        title: '5학년 국어 교과서',
        subject: '국어',
        grade: 5,
        description: '5학년 국어 학습을 위한 AI 기반 교과서',
        chapters: [
          {
            title: '1장: 우리말의 아름다움',
            sections: [
              {
                title: '1-1. 시와 감상',
                content: '시를 읽고 느낌을 표현해보기',
              },
              {
                title: '1-2. 우리말 바르게 쓰기',
                content: '올바른 맞춤법과 띄어쓰기',
              },
            ],
          },
        ],
        aiSettings: {
          model: 'gpt-4',
          temperature: 0.7,
          includeExamples: true,
          difficultyLevel: 'intermediate',
        },
      };

      // 1. Create textbook
      const createResponse = await request(app)
        .post('/api/textbooks')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(textbookData)
        .expect(201);

      expect(createResponse.body).toHaveProperty('id');
      expect(createResponse.body.title).toBe(textbookData.title);
      expect(createResponse.body.teacherId).toBe(teacherId);

      const textbookId = createResponse.body.id;

      // 2. Verify textbook in database
      const textbook = await prisma.textbook.findUnique({
        where: { id: textbookId },
      });
      expect(textbook).toBeTruthy();
      expect(textbook?.content).toHaveProperty('chapters');

      // 3. Update textbook
      const updateData = {
        isPublished: true,
        isPublic: true,
        accessCode: 'KOREA2024',
      };

      const updateResponse = await request(app)
        .put(`/api/textbooks/${textbookId}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(updateData)
        .expect(200);

      expect(updateResponse.body.isPublished).toBe(true);
      expect(updateResponse.body.accessCode).toBe('KOREA2024');

      // 4. Assign to class
      await request(app)
        .post(`/api/textbooks/${textbookId}/assign`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ classId: testClassId })
        .expect(200);

      // 5. Generate AI content for a chapter
      const aiContentResponse = await request(app)
        .post(`/api/textbooks/${textbookId}/generate-content`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          chapterId: 'chapter-1',
          contentType: 'examples',
          prompt: 'Generate practice examples for learning Korean poetry',
        })
        .expect(200);

      expect(aiContentResponse.body).toHaveProperty('content');
    });

    it('should handle textbook permissions correctly', async () => {
      // Create textbook as teacher
      const textbookData = {
        title: 'Private Textbook',
        subject: 'Korean',
        grade: 5,
        isPublic: false,
      };

      const createResponse = await request(app)
        .post('/api/textbooks')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(textbookData);

      const textbookId = createResponse.body.id;

      // Student should not be able to access private textbook
      await request(app)
        .get(`/api/textbooks/${textbookId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);

      // Teacher can access their own textbook
      await request(app)
        .get(`/api/textbooks/${textbookId}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      // Make textbook public
      await request(app)
        .put(`/api/textbooks/${textbookId}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ isPublic: true })
        .expect(200);

      // Now student can access
      await request(app)
        .get(`/api/textbooks/${textbookId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);
    });
  });

  describe('Textbook Content Management', () => {
    it('should handle page creation and navigation', async () => {
      // Create textbook
      const textbookResponse = await request(app)
        .post('/api/textbooks')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          title: 'Interactive Textbook',
          subject: 'Korean',
          grade: 5,
        });

      const textbookId = textbookResponse.body.id;

      // Add pages
      const pages = [
        {
          pageNumber: 1,
          content: {
            title: 'Introduction',
            text: 'Welcome to Korean language learning',
            exercises: [],
          },
        },
        {
          pageNumber: 2,
          content: {
            title: 'Basic Vocabulary',
            text: 'Common Korean words',
            exercises: [
              {
                type: 'multiple-choice',
                question: 'What does 안녕하세요 mean?',
                options: ['Hello', 'Goodbye', 'Thank you', 'Sorry'],
                correctAnswer: 0,
              },
            ],
          },
        },
      ];

      for (const page of pages) {
        await request(app)
          .post(`/api/textbooks/${textbookId}/pages`)
          .set('Authorization', `Bearer ${teacherToken}`)
          .send(page)
          .expect(201);
      }

      // Get all pages
      const pagesResponse = await request(app)
        .get(`/api/textbooks/${textbookId}/pages`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      expect(pagesResponse.body).toHaveLength(2);
      expect(pagesResponse.body[0].pageNumber).toBe(1);

      // Get specific page
      const pageResponse = await request(app)
        .get(`/api/textbooks/${textbookId}/pages/2`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      expect(pageResponse.body.content.title).toBe('Basic Vocabulary');
    });

    it('should handle multimedia content in textbook', async () => {
      // Create textbook
      const textbookResponse = await request(app)
        .post('/api/textbooks')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          title: 'Multimedia Textbook',
          subject: 'Korean',
          grade: 5,
        });

      const textbookId = textbookResponse.body.id;

      // Add multimedia content (simulate file upload)
      // In real test, you would use supertest's .attach() method
      const mediaData = {
        type: 'IMAGE',
        url: 'https://example.com/image.jpg',
        caption: 'Korean traditional house',
        pageNumber: 1,
      };

      await request(app)
        .post(`/api/textbooks/${textbookId}/media`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(mediaData)
        .expect(201);

      // Get textbook with media
      const textbookWithMedia = await request(app)
        .get(`/api/textbooks/${textbookId}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .query({ includeMedia: true })
        .expect(200);

      expect(textbookWithMedia.body.media).toHaveLength(1);
    });
  });

  describe('Textbook Search and Discovery', () => {
    beforeEach(async () => {
      // Create multiple textbooks
      const textbooks = [
        {
          title: '초등 국어 1학년',
          subject: '국어',
          grade: 1,
          isPublic: true,
        },
        {
          title: '초등 국어 2학년',
          subject: '국어',
          grade: 2,
          isPublic: true,
        },
        {
          title: '초등 수학 1학년',
          subject: '수학',
          grade: 1,
          isPublic: true,
        },
        {
          title: 'Private Textbook',
          subject: '국어',
          grade: 1,
          isPublic: false,
        },
      ];

      for (const textbook of textbooks) {
        await request(app)
          .post('/api/textbooks')
          .set('Authorization', `Bearer ${teacherToken}`)
          .send(textbook);
      }
    });

    it('should search textbooks with filters', async () => {
      // Search by subject
      const koreanBooks = await request(app)
        .get('/api/textbooks/search')
        .set('Authorization', `Bearer ${studentToken}`)
        .query({ subject: '국어' })
        .expect(200);

      expect(koreanBooks.body.length).toBe(2); // Only public ones

      // Search by grade
      const grade1Books = await request(app)
        .get('/api/textbooks/search')
        .set('Authorization', `Bearer ${studentToken}`)
        .query({ grade: 1 })
        .expect(200);

      expect(grade1Books.body.length).toBe(2);

      // Search with multiple filters
      const filtered = await request(app)
        .get('/api/textbooks/search')
        .set('Authorization', `Bearer ${studentToken}`)
        .query({ subject: '국어', grade: 1 })
        .expect(200);

      expect(filtered.body.length).toBe(1);
      expect(filtered.body[0].title).toBe('초등 국어 1학년');
    });

    it('should handle pagination in search results', async () => {
      // Get first page
      const page1 = await request(app)
        .get('/api/textbooks/search')
        .set('Authorization', `Bearer ${studentToken}`)
        .query({ page: 1, limit: 2 })
        .expect(200);

      expect(page1.body.data.length).toBe(2);
      expect(page1.body.pagination).toMatchObject({
        page: 1,
        limit: 2,
        total: 3, // Only public textbooks
      });

      // Get second page
      const page2 = await request(app)
        .get('/api/textbooks/search')
        .set('Authorization', `Bearer ${studentToken}`)
        .query({ page: 2, limit: 2 })
        .expect(200);

      expect(page2.body.data.length).toBe(1);
    });
  });
});