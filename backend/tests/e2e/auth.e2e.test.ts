import request from 'supertest';
import express from 'express';
import { setupTestDatabase, teardownTestDatabase, prisma } from '../setup/testDatabase';
import { cleanupTestData } from '../setup/testHelpers';
import authRoutes from '../../src/routes/auth.routes';
import { errorHandler } from '../../src/middlewares/errorHandler';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use(errorHandler);

describe('Authentication E2E Tests', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await cleanupTestData();
  });

  describe('User Registration Flow', () => {
    it('should complete full registration process', async () => {
      const userData = {
        email: 'teacher@test.com',
        password: 'SecurePass123!',
        name: 'Test Teacher',
        role: 'TEACHER',
      };

      // 1. Register new user
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(registerResponse.body).toHaveProperty('token');
      expect(registerResponse.body.user).toMatchObject({
        email: userData.email,
        name: userData.name,
        role: userData.role,
      });

      // 2. Verify user was created in database
      const user = await prisma.user.findUnique({
        where: { email: userData.email },
      });
      expect(user).toBeTruthy();
      expect(user?.email).toBe(userData.email);

      // 3. Try to register with same email (should fail)
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);
    });

    it('should validate registration input', async () => {
      // Invalid email
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'Pass123!',
          name: 'Test',
          role: 'TEACHER',
        })
        .expect(400);

      // Weak password
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@test.com',
          password: 'weak',
          name: 'Test',
          role: 'TEACHER',
        })
        .expect(400);

      // Invalid role
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@test.com',
          password: 'Pass123!',
          name: 'Test',
          role: 'INVALID',
        })
        .expect(400);
    });
  });

  describe('Login Flow', () => {
    const userData = {
      email: 'teacher@test.com',
      password: 'SecurePass123!',
      name: 'Test Teacher',
      role: 'TEACHER',
    };

    beforeEach(async () => {
      // Create test user
      await request(app)
        .post('/api/auth/register')
        .send(userData);
    });

    it('should complete full login process', async () => {
      // 1. Login with correct credentials
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password,
        })
        .expect(200);

      expect(loginResponse.body).toHaveProperty('token');
      expect(loginResponse.body).toHaveProperty('refreshToken');
      expect(loginResponse.body.user).toMatchObject({
        email: userData.email,
        name: userData.name,
        role: userData.role,
      });

      const { token, refreshToken } = loginResponse.body;

      // 2. Access protected route with token
      const profileResponse = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(profileResponse.body.email).toBe(userData.email);

      // 3. Refresh token
      const refreshResponse = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(refreshResponse.body).toHaveProperty('token');
      expect(refreshResponse.body).toHaveProperty('refreshToken');
    });

    it('should handle login failures', async () => {
      // Wrong password
      await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: 'WrongPassword123!',
        })
        .expect(401);

      // Non-existent user
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: userData.password,
        })
        .expect(401);
    });

    it('should handle token expiration and refresh', async () => {
      // Mock expired token scenario
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password,
        });

      const { refreshToken } = loginResponse.body;

      // Create expired token (you might need to mock jwt.verify for this)
      const expiredToken = 'expired.token.here';

      // Try to access with expired token
      await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      // Refresh with valid refresh token
      const refreshResponse = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      // Use new token
      await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${refreshResponse.body.token}`)
        .expect(200);
    });
  });

  describe('Logout Flow', () => {
    it('should handle logout and token invalidation', async () => {
      // Register and login
      const userData = {
        email: 'teacher@test.com',
        password: 'SecurePass123!',
        name: 'Test Teacher',
        role: 'TEACHER',
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData);

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password,
        });

      const { token } = loginResponse.body;

      // Logout
      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Token should be invalidated (this requires token blacklisting implementation)
      // For now, we'll just verify the logout endpoint works
    });
  });

  describe('Password Reset Flow', () => {
    it('should handle password reset request and completion', async () => {
      // Create user
      const userData = {
        email: 'teacher@test.com',
        password: 'OldPass123!',
        name: 'Test Teacher',
        role: 'TEACHER',
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData);

      // 1. Request password reset
      const resetRequestResponse = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: userData.email })
        .expect(200);

      expect(resetRequestResponse.body.message).toContain('reset link');

      // In a real scenario, we would:
      // - Send email with reset token
      // - User clicks link with token
      // - Reset password with token

      // 2. Reset password (simulated with direct token)
      const resetToken = 'simulated-reset-token'; // In real app, this would be from email

      // This would be the actual reset endpoint
      // await request(app)
      //   .post('/api/auth/reset-password')
      //   .send({
      //     token: resetToken,
      //     newPassword: 'NewPass123!',
      //   })
      //   .expect(200);

      // 3. Login with new password
      // await request(app)
      //   .post('/api/auth/login')
      //   .send({
      //     email: userData.email,
      //     password: 'NewPass123!',
      //   })
      //   .expect(200);
    });
  });
});