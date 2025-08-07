import request from 'supertest';
import express, { Express } from 'express';
import cookieParser from 'cookie-parser';
import { csrfProtection, csrfTokenHandler, doubleSubmitCsrf } from '../src/middlewares/csrf';

describe('CSRF Protection Middleware', () => {
  let app: Express;

  beforeEach(() => {
    app = express();
    app.use(cookieParser('test-secret'));
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
  });

  describe('Standard CSRF Protection', () => {
    beforeEach(() => {
      app.use(csrfProtection({
        skipRoutes: ['/login'],
      }));

      // Test routes
      app.get('/csrf-token', csrfTokenHandler);
      
      app.get('/protected', (req, res) => {
        res.json({ 
          message: 'GET request successful',
          csrfToken: req.csrfToken?.(),
        });
      });

      app.post('/protected', (req, res) => {
        res.json({ message: 'POST request successful' });
      });

      app.post('/login', (req, res) => {
        res.json({ message: 'Login successful' });
      });
    });

    test('GET 요청은 CSRF 토큰 없이도 성공해야 함', async () => {
      const response = await request(app)
        .get('/protected')
        .expect(200);

      expect(response.body.message).toBe('GET request successful');
      expect(response.body.csrfToken).toBeDefined();
      expect(response.headers['x-csrf-token']).toBeDefined();
    });

    test('CSRF 토큰 엔드포인트는 토큰을 반환해야 함', async () => {
      const response = await request(app)
        .get('/csrf-token')
        .expect(200);

      expect(response.body.csrfToken).toBeDefined();
      expect(response.body.headerName).toBe('X-CSRF-Token');
      expect(response.body.paramName).toBe('_csrf');
    });

    test('POST 요청은 CSRF 토큰 없이 실패해야 함', async () => {
      const response = await request(app)
        .post('/protected')
        .send({ data: 'test' })
        .expect(403);

      expect(response.body.error).toContain('CSRF');
    });

    test('유효한 CSRF 토큰으로 POST 요청이 성공해야 함', async () => {
      // 먼저 토큰 가져오기
      const tokenResponse = await request(app)
        .get('/csrf-token')
        .expect(200);

      const cookies = tokenResponse.headers['set-cookie'];
      const csrfToken = tokenResponse.body.csrfToken;

      // 토큰과 함께 POST 요청
      const postResponse = await request(app)
        .post('/protected')
        .set('Cookie', cookies)
        .set('X-CSRF-Token', csrfToken)
        .send({ data: 'test' })
        .expect(200);

      expect(postResponse.body.message).toBe('POST request successful');
    });

    test('잘못된 CSRF 토큰으로 POST 요청이 실패해야 함', async () => {
      // 먼저 세션 쿠키 가져오기
      const tokenResponse = await request(app)
        .get('/csrf-token')
        .expect(200);

      const cookies = tokenResponse.headers['set-cookie'];

      // 잘못된 토큰으로 POST 요청
      const postResponse = await request(app)
        .post('/protected')
        .set('Cookie', cookies)
        .set('X-CSRF-Token', 'invalid-token')
        .send({ data: 'test' })
        .expect(403);

      expect(postResponse.body.error).toContain('Invalid CSRF token');
    });

    test('제외된 경로는 CSRF 검증을 건너뛰어야 함', async () => {
      const response = await request(app)
        .post('/login')
        .send({ username: 'test', password: 'test' })
        .expect(200);

      expect(response.body.message).toBe('Login successful');
    });

    test('Body에 CSRF 토큰을 포함한 요청도 성공해야 함', async () => {
      // 토큰 가져오기
      const tokenResponse = await request(app)
        .get('/csrf-token')
        .expect(200);

      const cookies = tokenResponse.headers['set-cookie'];
      const csrfToken = tokenResponse.body.csrfToken;

      // Body에 토큰 포함
      const postResponse = await request(app)
        .post('/protected')
        .set('Cookie', cookies)
        .send({ 
          data: 'test',
          _csrf: csrfToken,
        })
        .expect(200);

      expect(postResponse.body.message).toBe('POST request successful');
    });

    test('Query 파라미터에 CSRF 토큰을 포함한 요청도 성공해야 함', async () => {
      // 토큰 가져오기
      const tokenResponse = await request(app)
        .get('/csrf-token')
        .expect(200);

      const cookies = tokenResponse.headers['set-cookie'];
      const csrfToken = tokenResponse.body.csrfToken;

      // Query 파라미터에 토큰 포함
      const postResponse = await request(app)
        .post(`/protected?_csrf=${csrfToken}`)
        .set('Cookie', cookies)
        .send({ data: 'test' })
        .expect(200);

      expect(postResponse.body.message).toBe('POST request successful');
    });
  });

  describe('Double Submit Cookie Pattern', () => {
    beforeEach(() => {
      app.use(doubleSubmitCsrf({
        skipRoutes: ['/login'],
      }));

      app.get('/protected', (req, res) => {
        res.json({ 
          message: 'GET request successful',
          csrfToken: req.csrfToken?.(),
        });
      });

      app.post('/protected', (req, res) => {
        res.json({ message: 'POST request successful' });
      });
    });

    test('GET 요청은 CSRF 쿠키를 설정해야 함', async () => {
      const response = await request(app)
        .get('/protected')
        .expect(200);

      expect(response.headers['set-cookie']).toBeDefined();
      const cookies = response.headers['set-cookie'];
      const csrfCookie = cookies.find((c: string) => c.includes('csrf-token'));
      expect(csrfCookie).toBeDefined();
    });

    test('쿠키와 헤더의 토큰이 일치하면 POST 요청이 성공해야 함', async () => {
      // GET 요청으로 쿠키 받기
      const getResponse = await request(app)
        .get('/protected')
        .expect(200);

      const cookies = getResponse.headers['set-cookie'];
      const csrfToken = getResponse.body.csrfToken;

      // POST 요청
      const postResponse = await request(app)
        .post('/protected')
        .set('Cookie', cookies)
        .set('X-CSRF-Token', csrfToken)
        .send({ data: 'test' })
        .expect(200);

      expect(postResponse.body.message).toBe('POST request successful');
    });

    test('쿠키와 헤더의 토큰이 불일치하면 POST 요청이 실패해야 함', async () => {
      // GET 요청으로 쿠키 받기
      const getResponse = await request(app)
        .get('/protected')
        .expect(200);

      const cookies = getResponse.headers['set-cookie'];

      // 다른 토큰으로 POST 요청
      const postResponse = await request(app)
        .post('/protected')
        .set('Cookie', cookies)
        .set('X-CSRF-Token', 'different-token')
        .send({ data: 'test' })
        .expect(403);

      expect(postResponse.body.error).toContain('CSRF validation failed');
    });
  });

  describe('PUT, DELETE, PATCH 메서드 테스트', () => {
    beforeEach(() => {
      app.use(csrfProtection());

      app.put('/resource', (req, res) => {
        res.json({ message: 'PUT successful' });
      });

      app.delete('/resource', (req, res) => {
        res.json({ message: 'DELETE successful' });
      });

      app.patch('/resource', (req, res) => {
        res.json({ message: 'PATCH successful' });
      });
    });

    test('PUT 요청은 CSRF 토큰이 필요함', async () => {
      const response = await request(app)
        .put('/resource')
        .send({ data: 'test' })
        .expect(403);

      expect(response.body.error).toContain('CSRF');
    });

    test('DELETE 요청은 CSRF 토큰이 필요함', async () => {
      const response = await request(app)
        .delete('/resource')
        .expect(403);

      expect(response.body.error).toContain('CSRF');
    });

    test('PATCH 요청은 CSRF 토큰이 필요함', async () => {
      const response = await request(app)
        .patch('/resource')
        .send({ data: 'test' })
        .expect(403);

      expect(response.body.error).toContain('CSRF');
    });
  });

  describe('토큰 만료 테스트', () => {
    beforeEach(() => {
      // 짧은 만료 시간 설정
      app.use(csrfProtection({
        tokenExpiry: 100, // 100ms
      }));

      app.get('/csrf-token', csrfTokenHandler);
      app.post('/protected', (req, res) => {
        res.json({ message: 'POST successful' });
      });
    });

    test('만료된 토큰은 거부되어야 함', async (done) => {
      // 토큰 가져오기
      const tokenResponse = await request(app)
        .get('/csrf-token')
        .expect(200);

      const cookies = tokenResponse.headers['set-cookie'];
      const csrfToken = tokenResponse.body.csrfToken;

      // 토큰 만료 대기
      setTimeout(async () => {
        // 만료된 토큰으로 요청
        const postResponse = await request(app)
          .post('/protected')
          .set('Cookie', cookies)
          .set('X-CSRF-Token', csrfToken)
          .send({ data: 'test' })
          .expect(403);

        expect(postResponse.body.error).toContain('CSRF');
        done();
      }, 150);
    });
  });
});