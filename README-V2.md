# 📚 한국어 디지털 교과서 플랫폼 v2.0

## 🎯 프로젝트 소개

교사가 업로드한 문서를 기반으로 학생들이 AI 튜터와 함께 학습하는 혁신적인 교육 플랫폼입니다.

### 핵심 기능
- 📄 **다양한 문서 지원**: PDF, TXT, MD 파일 업로드
- 🤖 **소크라테스식 AI 튜터**: 단순 답변이 아닌 사고력 향상 코칭
- 🔢 **6자리 코드 시스템**: 간편한 수업 참여
- 📊 **실시간 모니터링**: 교사가 학생 질문을 실시간으로 확인

## 🚀 빠른 시작

### 1. 교사 (수업 생성)
1. 교사 대시보드 접속 (`/teacher/dashboard`)
2. "새 수업 만들기" 클릭
3. 수업 이름 입력 → 6자리 코드 생성
4. 학습 자료 업로드 (PDF/TXT/MD)
5. 생성된 코드를 학생들에게 공유

### 2. 학생 (수업 참여)
1. 학생 입장 페이지 접속 (`/student/join`)
2. 6자리 코드 입력
3. 이름과 학번 입력
4. 수업 참여 → 학습 시작

## 💻 개발 환경 설정

### 필요 도구
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 15
- Redis 7

### 로컬 실행

```bash
# 1. 의존성 설치
npm install
cd backend && npm install

# 2. 환경 변수 설정
cp .env.example .env
# .env 파일 편집

# 3. 데이터베이스 마이그레이션
cd backend
npx prisma migrate dev

# 4. 개발 서버 실행
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
npm run dev
```

## 🌐 프로덕션 배포

### 자동 배포 (추천)
```bash
./deploy-v2.sh
```

### 수동 배포
```bash
# 1. 서버 접속
ssh -i Korean-Text-Book.pem ubuntu@3.37.168.225

# 2. Docker Compose 실행
docker-compose up -d

# 3. 상태 확인
docker-compose ps
```

## 📁 프로젝트 구조

```
DigitalBook/
├── src/                    # Frontend (Next.js)
│   ├── app/
│   │   ├── teacher/       # 교사 페이지
│   │   │   ├── dashboard/ # 수업 관리
│   │   │   └── monitor/   # 질문 모니터링
│   │   └── student/       # 학생 페이지
│   │       ├── join/      # 수업 참여
│   │       └── classroom/ # 학습 화면
│   └── components/
│       ├── PDFViewer/     # PDF 뷰어
│       └── ChatBot/       # AI 챗봇
├── backend/               # Backend (Express)
│   ├── src/
│   │   ├── controllers/   # API 컨트롤러
│   │   ├── services/      # 비즈니스 로직
│   │   │   └── ai-chat.service.ts # AI 코칭
│   │   └── prisma/        # 데이터베이스
│   └── uploads/           # 업로드된 문서
└── docker-compose.yml     # 도커 설정
```

## 🔧 주요 API

### 교사 API
- `POST /api/teacher/class/create` - 수업 생성
- `POST /api/teacher/class/:id/document` - 문서 업로드
- `GET /api/teacher/class/:id/questions` - 질문 조회

### 학생 API
- `POST /api/student/join` - 수업 참여
- `GET /api/student/class/:id/document` - 문서 조회
- `POST /api/student/chat` - AI 채팅

## 🤖 AI 코칭 시스템

### 질문 유형 분류
- **KNOWLEDGE**: 단순 지식 → 직접 답변
- **REASONING**: 추론 → 단계별 사고 유도
- **CRITICAL**: 비판적 사고 → 다양한 관점 제시
- **CREATIVE**: 창의적 사고 → 상상력 자극
- **REFLECTION**: 성찰 → 메타인지 발달

### 프롬프트 예시
```javascript
// 추론 질문 응답
"먼저 ~를 생각해볼까요?"
"그렇다면 다음은 어떨까요?"
"어떤 연결고리가 있을까요?"
```

## 📊 데이터베이스 스키마

### 주요 테이블
- `Teacher`: 교사 정보
- `Class`: 수업 (6자리 코드)
- `Document`: 업로드된 문서
- `Student`: 학생 정보
- `Question`: 질문 및 AI 응답

## 🔒 보안

- JWT 기반 교사 인증
- 세션 토큰 기반 학생 인증
- 파일 업로드 검증 (50MB 제한)
- Rate Limiting
- CORS 설정

## 🐛 트러블슈팅

### 문서 업로드 실패
```bash
# 업로드 디렉토리 권한 확인
chmod 755 backend/uploads
```

### Docker 컨테이너 재시작
```bash
docker-compose restart backend
docker-compose logs -f backend
```

### 데이터베이스 초기화
```bash
docker exec digitalbook-backend npx prisma migrate reset
```

## 📝 환경 변수

```env
# 필수 설정
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
OPENAI_API_KEY=sk-...

# 선택 설정
REDIS_URL=redis://localhost:6379
PORT=4000
```

## 🚧 로드맵

- [x] 기본 문서 뷰어 + AI 챗봇
- [x] 6자리 코드 시스템
- [x] 소크라테스식 코칭
- [ ] HWP 파일 지원
- [ ] 음성 대화 기능
- [ ] 학습 분석 대시보드
- [ ] 모바일 앱

## 📞 지원

문제가 있으시면 이슈를 등록해주세요.

---

**Made with ❤️ for Korean Education**