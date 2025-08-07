# CSRF 보호 구현 가이드

## 개요

이 문서는 한국 디지털 교과서 플랫폼의 CSRF(Cross-Site Request Forgery) 보호 구현을 설명합니다.

## 구현된 기능

### 1. 백엔드 미들웨어

#### 기본 CSRF 보호 (`/src/middlewares/csrf.ts`)
- Synchronizer Token Pattern 구현
- 메모리 기반 토큰 저장 (개발 환경)
- 자동 토큰 만료 및 정리
- Double Submit Cookie 패턴 옵션

#### Redis 기반 CSRF 보호 (`/src/middlewares/csrf-redis.ts`)
- 확장 가능한 Redis 토큰 저장소
- 토큰 회전 지원
- Rate limiting 기능
- 통계 및 모니터링

### 2. 보안 기능

- **토큰 검증**: Header, Body, Query 파라미터에서 토큰 확인
- **자동 만료**: 24시간 후 자동 토큰 만료
- **세션 바인딩**: 각 세션별 고유 CSRF secret
- **Origin 검증**: 추가 보안 레이어
- **SameSite 쿠키**: CSRF 공격 방지 강화

## 프론트엔드 통합

### 1. CSRF 토큰 가져오기

```javascript
// 페이지 로드 시 또는 필요할 때
async function getCSRFToken() {
  const response = await fetch('/api/csrf/token', {
    method: 'GET',
    credentials: 'include', // 쿠키 포함 필수
  });
  
  const data = await response.json();
  return data.csrfToken;
}
```

### 2. API 요청에 토큰 포함

#### Fetch API 사용
```javascript
const csrfToken = await getCSRFToken();

const response = await fetch('/api/textbooks', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken, // 헤더에 토큰 추가
  },
  credentials: 'include',
  body: JSON.stringify(data),
});
```

#### Axios 사용
```javascript
import axios from 'axios';

// Axios 인터셉터 설정
axios.interceptors.request.use(async (config) => {
  if (['post', 'put', 'delete', 'patch'].includes(config.method)) {
    const token = await getCSRFToken();
    config.headers['X-CSRF-Token'] = token;
  }
  return config;
});

// 사용
await axios.post('/api/textbooks', data);
```

### 3. React 컴포넌트 예제

```tsx
import { useState, useEffect } from 'react';

function useCSRF() {
  const [csrfToken, setCSRFToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/csrf/token', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setCSRFToken(data.csrfToken);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch CSRF token:', err);
        setLoading(false);
      });
  }, []);

  return { csrfToken, loading };
}

// 컴포넌트에서 사용
function CreateTextbook() {
  const { csrfToken, loading } = useCSRF();

  const handleSubmit = async (data) => {
    if (loading || !csrfToken) return;

    const response = await fetch('/api/textbooks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    // 응답 처리...
  };

  return (
    // 폼 UI...
  );
}
```

### 4. Next.js 통합

```tsx
// pages/api/csrf.ts (Next.js API Route)
export default async function handler(req, res) {
  const response = await fetch('http://localhost:4000/api/csrf/token', {
    headers: {
      Cookie: req.headers.cookie || '',
    },
  });

  const data = await response.json();
  res.status(200).json(data);
}

// 클라이언트 컴포넌트
import { useEffect, useState } from 'react';

export function useCSRFToken() {
  const [token, setToken] = useState('');

  useEffect(() => {
    fetch('/api/csrf')
      .then(res => res.json())
      .then(data => setToken(data.csrfToken));
  }, []);

  return token;
}
```

## 환경 설정

### 필수 환경 변수

```env
# .env
COOKIE_SECRET=your-secure-cookie-secret
CSRF_TOKEN_EXPIRY=86400000  # 24시간 (밀리초)
CSRF_ROTATE_TOKENS=false    # 토큰 회전 활성화 (선택)
```

### 개발 환경 설정

개발 환경에서는 다음과 같이 간소화된 설정을 사용할 수 있습니다:

```javascript
// 개발 환경용 설정
if (process.env.NODE_ENV === 'development') {
  app.use(csrfDevelopmentMode()); // CSRF 검증 비활성화
} else {
  app.use(csrfProtection());
}
```

## 제외 경로

다음 경로들은 CSRF 검증에서 제외됩니다:

- `/api/auth/login` - 로그인
- `/api/auth/signup` - 회원가입
- `/api/auth/refresh` - 토큰 갱신
- `/api/auth/logout` - 로그아웃
- `/api/health` - 헬스체크
- `/api/guest/access` - 게스트 접근
- `/api/csrf/token` - CSRF 토큰 발급
- `/api/webhook` - 외부 웹훅
- `/uploads/*` - 정적 파일

## 에러 처리

### CSRF 토큰 누락 (403)
```json
{
  "error": "CSRF token missing",
  "message": "CSRF 토큰이 필요합니다."
}
```

### 유효하지 않은 토큰 (403)
```json
{
  "error": "Invalid CSRF token",
  "message": "유효하지 않은 CSRF 토큰입니다."
}
```

### 세션 만료 (403)
```json
{
  "error": "CSRF token validation failed",
  "message": "세션이 만료되었습니다. 페이지를 새로고침해주세요."
}
```

## 모범 사례

### 1. 토큰 캐싱
```javascript
class CSRFManager {
  constructor() {
    this.token = null;
    this.expiry = 0;
  }

  async getToken() {
    if (!this.token || Date.now() > this.expiry) {
      const response = await fetch('/api/csrf/token', {
        credentials: 'include',
      });
      const data = await response.json();
      this.token = data.csrfToken;
      this.expiry = Date.now() + 23 * 60 * 60 * 1000; // 23시간
    }
    return this.token;
  }

  invalidate() {
    this.token = null;
    this.expiry = 0;
  }
}

const csrfManager = new CSRFManager();
```

### 2. 에러 재시도
```javascript
async function apiRequest(url, options = {}) {
  let attempts = 0;
  const maxAttempts = 2;

  while (attempts < maxAttempts) {
    try {
      const token = await csrfManager.getToken();
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'X-CSRF-Token': token,
        },
        credentials: 'include',
      });

      if (response.status === 403) {
        const data = await response.json();
        if (data.error?.includes('CSRF')) {
          csrfManager.invalidate();
          attempts++;
          continue;
        }
      }

      return response;
    } catch (error) {
      if (attempts === maxAttempts - 1) throw error;
      attempts++;
    }
  }
}
```

### 3. 폼 제출
```html
<!-- HTML 폼 -->
<form id="textbook-form">
  <input type="hidden" name="_csrf" id="csrf-token">
  <!-- 다른 폼 필드들 -->
</form>

<script>
// 폼 로드 시 토큰 설정
async function setupForm() {
  const token = await getCSRFToken();
  document.getElementById('csrf-token').value = token;
}

setupForm();
</script>
```

## 테스트

### 유닛 테스트 실행
```bash
npm test -- csrf.test.ts
```

### 수동 테스트
1. 브라우저 개발자 도구에서 Network 탭 열기
2. GET 요청 후 응답 헤더에서 `X-CSRF-Token` 확인
3. POST 요청 시 요청 헤더에 토큰 포함 확인
4. 잘못된 토큰으로 요청 시 403 에러 확인

## 보안 고려사항

1. **프로덕션 환경**: Redis 기반 CSRF 미들웨어 사용 권장
2. **HTTPS 필수**: 프로덕션에서는 반드시 HTTPS 사용
3. **SameSite 쿠키**: `strict` 또는 `lax` 설정 사용
4. **토큰 회전**: 중요한 작업 후 토큰 재생성 고려
5. **Rate Limiting**: 토큰 생성 요청에 대한 rate limiting 적용

## 문제 해결

### 토큰이 자주 만료되는 경우
- `CSRF_TOKEN_EXPIRY` 환경 변수 값 증가
- 클라이언트 측 토큰 캐싱 구현

### Redis 연결 오류
- Redis 서버 상태 확인
- 폴백으로 메모리 기반 CSRF 사용 고려

### CORS 관련 문제
- `CORS_ORIGIN` 환경 변수 확인
- 쿠키 설정에서 `credentials: 'include'` 확인

## 참고 자료

- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [MDN SameSite Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite)
- [Express.js Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)