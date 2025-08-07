/**
 * CSRF 보호 간단한 테스트
 * 서버 없이 미들웨어만 테스트
 */

const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');

// TypeScript 파일 로드를 위한 tsx 설정
require('tsx/cjs');

// CSRF 미들웨어 import
const { csrfProtection, csrfTokenHandler } = require('./src/middlewares/csrf');

const app = express();

// 미들웨어 설정
app.use(cookieParser('test-secret'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CSRF 보호 적용
app.use(csrfProtection({
  skipRoutes: ['/login', '/health'],
}));

// 테스트 라우트
app.get('/csrf-token', csrfTokenHandler);

app.get('/test', (req, res) => {
  res.json({ 
    message: 'GET request successful',
    csrfToken: req.csrfToken?.(),
  });
});

app.post('/test', (req, res) => {
  res.json({ message: 'POST request successful' });
});

app.post('/login', (req, res) => {
  res.json({ message: 'Login successful (no CSRF required)' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// 에러 핸들러
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message });
});

// 서버 시작
const PORT = 4001;
const server = app.listen(PORT, () => {
  console.log(`
========================================
   CSRF 테스트 서버 시작됨
   포트: ${PORT}
   
   테스트 방법:
   1. 다른 터미널에서: curl http://localhost:${PORT}/csrf-token
   2. 받은 토큰으로 POST 요청 테스트
========================================
  `);
});

// 간단한 테스트 실행
setTimeout(async () => {
  const http = require('http');
  
  console.log('\n=== 자동 테스트 시작 ===\n');
  
  // 1. CSRF 토큰 가져오기
  console.log('1. CSRF 토큰 요청...');
  
  const tokenRequest = new Promise((resolve, reject) => {
    http.get(`http://localhost:${PORT}/csrf-token`, (res) => {
      let data = '';
      const cookies = res.headers['set-cookie'];
      
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const result = JSON.parse(data);
        console.log('   ✓ 토큰 받음:', result.csrfToken.substring(0, 20) + '...');
        console.log('   ✓ 쿠키 설정됨');
        resolve({ token: result.csrfToken, cookies });
      });
    }).on('error', reject);
  });
  
  const { token, cookies } = await tokenRequest;
  
  // 2. CSRF 토큰 없이 POST 요청
  console.log('\n2. CSRF 토큰 없이 POST 요청...');
  
  await new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: PORT,
      path: '/test',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 403) {
          console.log('   ✓ 예상대로 403 에러');
          const result = JSON.parse(data);
          console.log('   에러:', result.error);
        } else {
          console.log('   ✗ 예상치 못한 응답:', res.statusCode);
        }
        resolve();
      });
    });
    
    req.write(JSON.stringify({ test: 'data' }));
    req.end();
  });
  
  // 3. 유효한 CSRF 토큰으로 POST 요청
  console.log('\n3. 유효한 CSRF 토큰으로 POST 요청...');
  
  await new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: PORT,
      path: '/test',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': token,
        'Cookie': cookies ? cookies.join('; ') : '',
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('   ✓ 요청 성공!');
          const result = JSON.parse(data);
          console.log('   응답:', result.message);
        } else {
          console.log('   ✗ 예상치 못한 응답:', res.statusCode);
        }
        resolve();
      });
    });
    
    req.write(JSON.stringify({ test: 'data' }));
    req.end();
  });
  
  // 4. 제외된 경로 테스트
  console.log('\n4. 제외된 경로 테스트 (/login)...');
  
  await new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: PORT,
      path: '/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('   ✓ CSRF 검증 없이 성공');
          const result = JSON.parse(data);
          console.log('   응답:', result.message);
        } else {
          console.log('   ✗ 예상치 못한 응답:', res.statusCode);
        }
        resolve();
      });
    });
    
    req.write(JSON.stringify({ username: 'test', password: 'test' }));
    req.end();
  });
  
  console.log('\n=== 테스트 완료 ===\n');
  console.log('서버를 종료하려면 Ctrl+C를 누르세요.');
  
}, 1000);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n서버 종료 중...');
  server.close(() => {
    console.log('서버가 종료되었습니다.');
    process.exit(0);
  });
});