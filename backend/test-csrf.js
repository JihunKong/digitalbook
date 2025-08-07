/**
 * CSRF 보호 테스트 스크립트
 * 로컬 환경에서 CSRF 미들웨어 작동 확인
 */

const axios = require('axios');
const https = require('https');

// SSL 인증서 검증 비활성화 (로컬 테스트용)
const agent = new https.Agent({
  rejectUnauthorized: false
});

const BASE_URL = process.env.API_URL || 'http://localhost:4000';

// Axios 인스턴스 생성
const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  httpsAgent: agent,
  validateStatus: () => true, // 모든 상태 코드 허용
  jar: true, // 쿠키 자동 관리
});

// 쿠키 저장용
let cookies = '';

// 색상 코드
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testCSRF() {
  log('\n=== CSRF 보호 테스트 시작 ===\n', 'blue');

  try {
    // 1. CSRF 토큰 없이 POST 요청 (실패해야 함)
    log('1. CSRF 토큰 없이 POST 요청 테스트...', 'yellow');
    const response1 = await api.post('/api/textbooks', {
      title: '테스트 교과서',
      content: '테스트 내용'
    });
    
    if (response1.status === 403) {
      log('✓ 예상대로 403 에러 발생', 'green');
      log(`  에러 메시지: ${JSON.stringify(response1.data)}`, 'green');
    } else {
      log(`✗ 예상치 못한 응답: ${response1.status}`, 'red');
    }

    // 2. CSRF 토큰 가져오기
    log('\n2. CSRF 토큰 요청...', 'yellow');
    const tokenResponse = await api.get('/api/csrf/token');
    
    if (tokenResponse.status === 200) {
      const csrfToken = tokenResponse.data.csrfToken;
      log(`✓ CSRF 토큰 획득: ${csrfToken.substring(0, 20)}...`, 'green');
      
      // 쿠키 저장
      if (tokenResponse.headers['set-cookie']) {
        cookies = tokenResponse.headers['set-cookie'].join('; ');
        log(`✓ 세션 쿠키 저장됨`, 'green');
      }

      // 3. 유효한 CSRF 토큰으로 POST 요청
      log('\n3. 유효한 CSRF 토큰으로 POST 요청...', 'yellow');
      const response3 = await api.post('/api/textbooks', 
        {
          title: '테스트 교과서',
          content: '테스트 내용'
        },
        {
          headers: {
            'X-CSRF-Token': csrfToken,
            'Cookie': cookies
          }
        }
      );
      
      if (response3.status === 200 || response3.status === 201) {
        log('✓ 요청 성공!', 'green');
        log(`  응답: ${JSON.stringify(response3.data).substring(0, 100)}...`, 'green');
      } else if (response3.status === 401) {
        log('○ 인증이 필요합니다 (정상 동작)', 'yellow');
      } else {
        log(`✗ 예상치 못한 응답: ${response3.status}`, 'red');
        log(`  응답: ${JSON.stringify(response3.data)}`, 'red');
      }

      // 4. 잘못된 CSRF 토큰으로 POST 요청
      log('\n4. 잘못된 CSRF 토큰으로 POST 요청...', 'yellow');
      const response4 = await api.post('/api/textbooks',
        {
          title: '테스트 교과서',
          content: '테스트 내용'
        },
        {
          headers: {
            'X-CSRF-Token': 'invalid-token-12345',
            'Cookie': cookies
          }
        }
      );
      
      if (response4.status === 403) {
        log('✓ 예상대로 403 에러 발생', 'green');
        log(`  에러 메시지: ${JSON.stringify(response4.data)}`, 'green');
      } else {
        log(`✗ 예상치 못한 응답: ${response4.status}`, 'red');
      }

      // 5. 제외된 경로 테스트 (로그인)
      log('\n5. 제외된 경로 테스트 (/api/auth/login)...', 'yellow');
      const response5 = await api.post('/api/auth/login', {
        email: 'test@example.com',
        password: 'password123'
      });
      
      if (response5.status !== 403) {
        log('✓ CSRF 검증 없이 요청 처리됨', 'green');
        log(`  상태 코드: ${response5.status}`, 'green');
      } else {
        log('✗ 제외된 경로에서 CSRF 검증이 발생함', 'red');
      }

      // 6. GET 요청은 CSRF 토큰 없이도 가능
      log('\n6. GET 요청 테스트...', 'yellow');
      const response6 = await api.get('/api/textbooks');
      
      if (response6.status !== 403) {
        log('✓ GET 요청은 CSRF 토큰 없이 처리됨', 'green');
        log(`  상태 코드: ${response6.status}`, 'green');
      } else {
        log('✗ GET 요청에서 CSRF 검증이 발생함', 'red');
      }

      // 7. Body에 CSRF 토큰 포함 테스트
      log('\n7. Body에 CSRF 토큰 포함하여 POST 요청...', 'yellow');
      const response7 = await api.post('/api/textbooks',
        {
          title: '테스트 교과서',
          content: '테스트 내용',
          _csrf: csrfToken  // Body에 토큰 포함
        },
        {
          headers: {
            'Cookie': cookies
          }
        }
      );
      
      if (response7.status !== 403) {
        log('✓ Body의 CSRF 토큰으로 요청 처리됨', 'green');
        log(`  상태 코드: ${response7.status}`, 'green');
      } else {
        log('✗ Body의 CSRF 토큰이 인식되지 않음', 'red');
      }

    } else {
      log(`✗ CSRF 토큰 획득 실패: ${tokenResponse.status}`, 'red');
    }

  } catch (error) {
    log(`\n✗ 테스트 중 오류 발생: ${error.message}`, 'red');
    if (error.response) {
      log(`  응답 상태: ${error.response.status}`, 'red');
      log(`  응답 데이터: ${JSON.stringify(error.response.data)}`, 'red');
    }
  }

  log('\n=== CSRF 보호 테스트 완료 ===\n', 'blue');
}

// 서버 상태 확인
async function checkServerStatus() {
  try {
    log('서버 상태 확인 중...', 'yellow');
    const response = await api.get('/api/health');
    if (response.status === 200) {
      log('✓ 서버가 정상적으로 실행 중입니다.', 'green');
      return true;
    }
  } catch (error) {
    log('✗ 서버에 연결할 수 없습니다.', 'red');
    log(`  ${BASE_URL}이 실행 중인지 확인하세요.`, 'yellow');
    return false;
  }
}

// 메인 실행
async function main() {
  const serverReady = await checkServerStatus();
  if (serverReady) {
    await testCSRF();
  } else {
    log('\n서버를 먼저 시작해주세요:', 'yellow');
    log('  npm run dev', 'blue');
  }
}

main();