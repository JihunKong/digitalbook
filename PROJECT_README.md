# AI 기반 한국어 디지털 교과서 플랫폼

AI를 활용한 혁신적인 한국어 디지털 교과서 플랫폼입니다.

## 주요 기능

### 교사용 기능
- **AI 교과서 생성**: 텍스트를 업로드하면 AI가 자동으로 구조화된 교과서 생성
- **실시간 학습 분석**: 학생들의 학습 진도와 성과를 실시간으로 모니터링
- **과제 관리**: 다양한 유형의 과제 생성 및 자동 평가
- **클래스 관리**: 학급 생성, 학생 초대, 교과서 할당

### 학생용 기능
- **인터랙티브 학습**: 텍스트 하이라이트, 북마크, 메모 기능
- **AI 튜터**: 1:1 맞춤형 AI 튜터와 실시간 대화
- **글쓰기 평가**: AI 기반 글쓰기 자동 평가 및 피드백
- **학습 진도 추적**: 개인별 학습 진도 및 성취도 확인

## 기술 스택

### Frontend
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Radix UI
- Framer Motion
- React Query

### Backend
- Express.js
- Prisma ORM
- PostgreSQL
- Redis
- Socket.io
- JWT Authentication

### AI Integration
- Claude API (텍스트 생성 및 평가)
- DALL-E 3 (이미지 생성)

### DevOps
- Docker & Docker Compose
- Kubernetes
- GitHub Actions
- AWS Lightsail

## 시작하기

### 필수 요구사항
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 15+
- Redis 7+

### 환경 설정

1. 저장소 클론
```bash
git clone https://github.com/your-repo/ai-textbook.git
cd ai-textbook
```

2. 환경 변수 설정
```bash
cp .env.example .env
cp backend/.env.example backend/.env
# 필요한 API 키와 설정값 입력
```

3. 의존성 설치
```bash
npm install
cd backend && npm install
```

4. 데이터베이스 마이그레이션
```bash
cd backend
npx prisma migrate dev
npm run seed
```

### 개발 서버 실행

#### Docker Compose 사용 (권장)
```bash
docker-compose up -d
```

#### 로컬 실행
```bash
# Frontend
npm run dev

# Backend
cd backend
npm run dev
```

## 배포

### Kubernetes 배포
```bash
./deploy.sh production
```

### 환경별 설정
- `k8s/base/`: 기본 Kubernetes 설정
- `k8s/overlays/production/`: 프로덕션 환경 설정
- `k8s/overlays/staging/`: 스테이징 환경 설정

## 테스트 계정

- 교사: teacher@example.com / teacher123
- 학생: student1@example.com / student123

## 프로젝트 구조

```
├── src/                    # Frontend 소스 코드
│   ├── app/               # Next.js App Router
│   ├── components/        # React 컴포넌트
│   ├── hooks/            # Custom Hooks
│   └── lib/              # 유틸리티 함수
├── backend/               # Backend 소스 코드
│   ├── src/
│   │   ├── controllers/  # API 컨트롤러
│   │   ├── services/     # 비즈니스 로직
│   │   ├── models/       # 데이터 모델
│   │   └── utils/        # 유틸리티
│   └── prisma/           # 데이터베이스 스키마
├── k8s/                   # Kubernetes 설정
├── docker-compose.yml     # Docker Compose 설정
└── deploy.sh             # 배포 스크립트
```

## 라이선스

이 프로젝트는 MIT 라이선스 하에 있습니다.