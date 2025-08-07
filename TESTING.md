# 테스트 가이드

## 개요
이 프로젝트는 AI 국어 디지털 교과서 플랫폼으로, 포괄적인 테스트 환경을 제공합니다.

## 새로운 기능 (완료됨)

### 1. 학생 코드 기반 접근 시스템
- **게스트 접근**: 학생들이 별도 로그인 없이 선생님의 접근 코드로 교과서 이용
- **학번/이름 입력**: 간단한 식별 정보만으로 학습 기록 관리
- **세션 관리**: 안전한 게스트 세션 토큰 기반 인증

### 2. 교과서 공개/공유 기능
- **공개 설정**: 선생님이 만든 교과서를 다른 선생님들과 공유
- **접근 코드 생성**: 6자리 랜덤 코드로 학생 접근 관리
- **공개 교과서 탐색**: 다른 선생님들의 우수 교과서 검색 및 활용

## 테스트 환경

### E2E 테스트 (Playwright)
프로젝트에는 다음과 같은 E2E 테스트가 포함되어 있습니다:

#### 테스트 케이스
1. **게스트 접근 테스트** (`tests/e2e/guest-access.spec.ts`)
   - 게스트 접근 페이지 로딩
   - 폼 유효성 검증
   - 탐색 페이지 네비게이션

2. **교사 교과서 관리 테스트** (`tests/e2e/teacher-textbook.spec.ts`)
   - 새 교과서 생성
   - 접근 코드 생성
   - 공개 상태 토글

3. **공개 교과서 테스트** (`tests/e2e/public-textbooks.spec.ts`)
   - 공개 교과서 브라우징
   - 미리보기 기능
   - 교과서 복사 기능

4. **AI 채팅 테스트** (`tests/e2e/ai-chat.spec.ts`)
   - 게스트 사용자 채팅
   - 채팅 제안 기능
   - 페이지 컨텍스트 유지

## 테스트 실행 방법

### 로컬 테스트
```bash
# Playwright 설치
npm install

# 브라우저 설치
npx playwright install

# 스모크 테스트 실행
npx playwright test tests/e2e/smoke.spec.ts

# 모든 E2E 테스트 실행
npm run test:e2e

# UI 모드로 테스트 실행
npm run test:e2e:ui

# 디버그 모드로 테스트 실행
npm run test:e2e:debug
```

### Docker 테스트
```bash
# 테스트 환경 실행
./test-docker.sh

# 또는 수동으로
docker-compose -f docker-compose.test.yml up --build
```

### 로컬 스크립트
```bash
# 권한 부여
chmod +x test-local.sh

# 실행
./test-local.sh
```

## 데이터베이스 스키마 변경사항

### 새로운 테이블
1. **GuestAccess**: 게스트 사용자 접근 관리
2. **GuestStudyRecord**: 게스트 학습 기록
3. **GuestChatMessage**: 게스트 채팅 메시지

### 기존 테이블 수정
- **Textbook**: `isPublic`, `accessCode` 필드 추가

## API 엔드포인트

### 게스트 API
- `POST /api/guest/access` - 접근 코드로 교과서 접근
- `POST /api/guest/study-record` - 게스트 학습 기록 저장
- `POST /api/guest/chat` - 게스트 채팅 메시지 저장
- `GET /api/guest/stats` - 게스트 학습 통계

### 교과서 공유 API
- `PATCH /api/textbooks/:id/public` - 공개 상태 변경
- `POST /api/textbooks/:id/access-code` - 접근 코드 생성
- `GET /api/textbooks/public/list` - 공개 교과서 목록

## 테스트 데이터
테스트용 시드 데이터는 `backend/src/utils/testSeed.ts`에서 관리됩니다:

- 테스트 교사: `teacher@test.com` / `password123`
- 테스트 학생: `student@test.com` / `password123`
- 테스트 교과서: "테스트 국어 교과서" (접근 코드: `TEST123`)
- 테스트 학급: "테스트 3학년 1반"

## CI/CD 통합
프로젝트는 GitHub Actions와 통합하여 자동화된 테스트를 지원합니다:

```yaml
# .github/workflows/test.yml 예시
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
```

## 주의사항
1. **환경 변수**: 테스트 실행 전 필요한 환경 변수 설정 확인
2. **서버 상태**: 로컬 테스트 시 개발 서버가 실행 중인지 확인
3. **브라우저**: Playwright가 필요한 브라우저를 자동으로 다운로드
4. **네트워크**: 일부 테스트는 외부 네트워크 연결이 필요할 수 있음

## 추가 리소스
- [Playwright 문서](https://playwright.dev/)
- [Docker Compose 가이드](https://docs.docker.com/compose/)
- [프로젝트 API 문서](./docs/API_INTEGRATION.md)