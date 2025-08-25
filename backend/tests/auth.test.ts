import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import { app } from '../src/index';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

describe('Authentication API Tests', () => {
  let teacherToken: string;
  let studentToken: string;
  let refreshToken: string;
  
  beforeAll(async () => {
    // Clean database
    await prisma.$transaction([
      prisma.user.deleteMany(),
      prisma.session.deleteMany(),
    ]);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/auth/signup', () => {
    it('should create a new teacher account', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'teacher@test.com',
          password: 'SecurePass123!',
          name: '김선생님',
          role: 'TEACHER',
          profileData: {
            school: '서울고등학교',
            subject: '국어',
            grade: '1학년',
          },
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user.email).toBe('teacher@test.com');
      expect(response.body.user.role).toBe('TEACHER');
      
      teacherToken = response.body.accessToken;
      refreshToken = response.body.refreshToken;
    });

    it('should reject duplicate email', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'teacher@test.com',
          password: 'AnotherPass123!',
          name: '이선생님',
          role: 'TEACHER',
        });

      expect(response.status).toBe(409);
      expect(response.body.error).toContain('이미 존재하는 이메일');
    });

    it('should validate password strength', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'weak@test.com',
          password: '123',
          name: '박선생님',
          role: 'TEACHER',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('비밀번호');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'teacher@test.com',
          password: 'SecurePass123!',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user.email).toBe('teacher@test.com');
    });

    it('should reject invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'teacher@test.com',
          password: 'WrongPassword',
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('비밀번호가 올바르지 않습니다');
    });

    it('should reject non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'notfound@test.com',
          password: 'AnyPassword123!',
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('사용자를 찾을 수 없습니다');
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh access token with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: refreshToken,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body.accessToken).not.toBe(teacherToken);
    });

    it('should reject invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: 'invalid-token',
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('유효하지 않은 토큰');
    });
  });

  describe('Protected Routes', () => {
    it('should access protected route with valid token', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(response.status).toBe(200);
      expect(response.body.user.email).toBe('teacher@test.com');
    });

    it('should reject access without token', async () => {
      const response = await request(app)
        .get('/api/users/profile');

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('인증 토큰이 필요합니다');
    });

    it('should reject access with invalid token', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('유효하지 않은 토큰');
    });
  });

  describe('Student Enrollment', () => {
    let classCode: string;

    beforeEach(async () => {
      // Create a class
      const classResponse = await request(app)
        .post('/api/classes')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          name: '국어 1반',
          description: '1학년 국어 수업',
          subject: '국어',
          grade: '1학년',
        });
      
      classCode = classResponse.body.class.code;
    });

    it('should allow student to join class with valid code', async () => {
      const response = await request(app)
        .post('/api/classes/join')
        .send({
          code: classCode,
          studentName: '학생1',
          studentId: 'STU001',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body.student.name).toBe('학생1');
      
      studentToken = response.body.token;
    });

    it('should reject invalid class code', async () => {
      const response = await request(app)
        .post('/api/classes/join')
        .send({
          code: 'INVALID',
          studentName: '학생2',
          studentId: 'STU002',
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('수업을 찾을 수 없습니다');
    });
  });

  describe('Role-Based Access Control', () => {
    it('should allow teacher to create textbook', async () => {
      const response = await request(app)
        .post('/api/textbooks')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          title: '국어 교과서',
          description: '1학년 국어',
          content: { chapters: [] },
        });

      expect(response.status).toBe(201);
      expect(response.body.textbook.title).toBe('국어 교과서');
    });

    it('should prevent student from creating textbook', async () => {
      const response = await request(app)
        .post('/api/textbooks')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          title: '불가능한 교과서',
          description: '생성 불가',
          content: { chapters: [] },
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('권한이 없습니다');
    });
  });
});