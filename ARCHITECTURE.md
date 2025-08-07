# 🏗️ 한국 디지털 교과서 플랫폼 - 시스템 아키텍처

## 목차
1. [시스템 개요](#시스템-개요)
2. [아키텍처 다이어그램](#아키텍처-다이어그램)
3. [기술 스택](#기술-스택)
4. [시스템 구성 요소](#시스템-구성-요소)
5. [데이터 흐름](#데이터-흐름)
6. [보안 아키텍처](#보안-아키텍처)
7. [배포 아키텍처](#배포-아키텍처)
8. [확장성 전략](#확장성-전략)

## 시스템 개요

한국 디지털 교과서 플랫폼은 AI 기반 교육 플랫폼으로, 교사와 학생에게 맞춤형 디지털 교육 경험을 제공합니다.

### 핵심 특징
- 🎯 **역할 기반 접근 제어**: Admin, Teacher, Student, Guest
- 🤖 **AI 통합**: OpenAI GPT-4를 활용한 콘텐츠 생성 및 튜터링
- 📱 **반응형 디자인**: 데스크톱, 태블릿, 모바일 지원
- 🌐 **실시간 협업**: WebSocket 기반 실시간 통신
- 📊 **데이터 분석**: 학습 분석 및 진도 추적

## 아키텍처 다이어그램

```
┌──────────────────────────────────────────────────────────────┐
│                         Client Layer                          │
├────────────────┬────────────────┬─────────────────────────────┤
│   Web App      │  Mobile Web    │     Admin Dashboard         │
│  (Next.js)     │   (PWA)        │      (Next.js)              │
└────────┬───────┴────────┬───────┴──────────┬──────────────────┘
         │                 │                  │
         └─────────────────┼──────────────────┘
                           │
                    [Load Balancer]
                           │
┌──────────────────────────┴──────────────────────────────────┐
│                      API Gateway (Nginx)                      │
│  • SSL Termination  • Rate Limiting  • Request Routing       │
└──────────────┬───────────────────────────┬──────────────────┘
               │                           │
    ┌──────────┴──────────┐     ┌─────────┴──────────┐
    │    API Server       │     │   WebSocket Server  │
    │   (Express.js)      │     │    (Socket.io)      │
    │  • REST APIs        │     │  • Real-time Chat   │
    │  • Authentication   │     │  • Live Updates     │
    │  • Business Logic   │     │  • Notifications    │
    └──────────┬──────────┘     └─────────┬──────────┘
               │                           │
               └───────────┬───────────────┘
                           │
    ┌──────────────────────┼──────────────────────────┐
    │                      │                          │
┌───┴──────┐     ┌─────────┴─────────┐     ┌─────────┴────────┐
│PostgreSQL│     │      Redis          │     │   File Storage   │
│          │     │  • Session Cache    │     │  • Local/S3      │
│• Users   │     │  • Rate Limiting    │     │  • CDN           │
│• Content │     │  • Queue            │     │  • Media Files   │
│• Analytics│    └───────────────────┘      └──────────────────┘
└──────────┘

                    External Services
    ┌────────────┬─────────────┬──────────────┐
    │  OpenAI    │   Email     │   Analytics  │
    │   API      │   (SMTP)    │  (GA/Sentry) │
    └────────────┴─────────────┴──────────────┘
```

## 기술 스택

### Frontend
| 기술 | 버전 | 용도 |
|------|------|------|
| Next.js | 14.x | React 프레임워크 |
| TypeScript | 5.x | 타입 안정성 |
| Tailwind CSS | 3.x | 스타일링 |
| Zustand | 4.x | 상태 관리 |
| React Query | 5.x | 서버 상태 관리 |
| Socket.io Client | 4.x | 실시간 통신 |
| Framer Motion | 11.x | 애니메이션 |

### Backend
| 기술 | 버전 | 용도 |
|------|------|------|
| Node.js | 20.x | 런타임 |
| Express.js | 4.x | 웹 프레임워크 |
| TypeScript | 5.x | 타입 안정성 |
| Prisma | 5.x | ORM |
| Socket.io | 4.x | WebSocket |
| JWT | 9.x | 인증 |
| Bcrypt | 5.x | 암호화 |

### Database & Cache
| 기술 | 버전 | 용도 |
|------|------|------|
| PostgreSQL | 15.x | 주 데이터베이스 |
| Redis | 7.x | 캐싱 & 세션 |
| Prisma | 5.x | ORM |

### Infrastructure
| 기술 | 용도 |
|------|------|
| Docker | 컨테이너화 |
| Nginx | 리버스 프록시 |
| PM2 | 프로세스 관리 |
| AWS Lightsail | 호스팅 |
| Cloudflare | CDN & DDoS 보호 |

## 시스템 구성 요소

### 1. 프론트엔드 애플리케이션

#### 1.1 메인 웹 애플리케이션
```
/src
├── app/                    # Next.js App Router
│   ├── page.tsx           # 랜딩 페이지
│   ├── auth/              # 인증 페이지
│   ├── dashboard/         # 역할별 대시보드
│   ├── admin/             # 관리자 영역
│   ├── teacher/           # 교사 영역
│   └── student/           # 학생 영역
├── components/            # 재사용 컴포넌트
├── hooks/                 # 커스텀 훅
├── lib/                   # 유틸리티
└── styles/               # 글로벌 스타일
```

#### 1.2 역할별 라우팅
```typescript
// 역할 기반 접근 제어
const roleBasedRoutes = {
  ADMIN: '/admin/dashboard',
  TEACHER: '/teacher/dashboard',
  STUDENT: '/student/dashboard',
  GUEST: '/guest'
};
```

### 2. 백엔드 API 서버

#### 2.1 API 구조
```
/backend/src
├── controllers/           # 비즈니스 로직
├── middlewares/          # 미들웨어
│   ├── auth.ts          # 인증
│   ├── rbac.ts          # 권한 관리
│   ├── rateLimiter.ts   # 속도 제한
│   └── validator.ts     # 입력 검증
├── routes/               # API 라우트
├── services/             # 외부 서비스
└── utils/               # 유틸리티
```

#### 2.2 주요 API 엔드포인트
```
인증 (Authentication)
├── POST   /api/auth/register
├── POST   /api/auth/login
├── POST   /api/auth/refresh
└── POST   /api/auth/logout

사용자 관리 (User Management)
├── GET    /api/users
├── GET    /api/users/:id
├── PUT    /api/users/:id
└── DELETE /api/users/:id

교과서 (Textbooks)
├── GET    /api/textbooks
├── POST   /api/textbooks
├── GET    /api/textbooks/:id
├── PUT    /api/textbooks/:id
└── DELETE /api/textbooks/:id

수업 (Classes)
├── GET    /api/classes
├── POST   /api/classes
├── POST   /api/classes/:code/join
└── GET    /api/classes/:id/students

AI 서비스 (AI Services)
├── POST   /api/ai/generate-content
├── POST   /api/ai/chat
├── POST   /api/ai/evaluate
└── POST   /api/ai/generate-questions
```

### 3. 데이터베이스 설계

#### 3.1 주요 엔티티
```
User (통합 사용자)
├── id: UUID
├── email: String (unique)
├── password: String (nullable)
├── name: String
├── role: Enum (ADMIN|TEACHER|STUDENT|GUEST)
├── isActive: Boolean
└── timestamps

TeacherProfile
├── userId: UUID (FK)
├── school: String
├── subject: String
└── classes: Relation

StudentProfile
├── userId: UUID (FK)
├── studentId: String
├── grade: String
└── enrollments: Relation

Class
├── id: UUID
├── code: String (unique, 6 chars)
├── name: String
├── teacherId: UUID (FK)
└── enrollments: Relation

Textbook
├── id: UUID
├── title: String
├── content: JSON
├── authorId: UUID (FK)
├── isPublic: Boolean
└── aiGenerated: Boolean
```

## 데이터 흐름

### 1. 인증 플로우
```
1. 사용자 로그인 요청
   └→ POST /api/auth/login

2. 자격 증명 검증
   └→ Database 조회
   └→ 비밀번호 검증 (bcrypt)

3. JWT 토큰 생성
   └→ Access Token (15분)
   └→ Refresh Token (7일)

4. 토큰 저장
   └→ httpOnly Cookie
   └→ Redis Session

5. 클라이언트 리다이렉션
   └→ 역할별 대시보드
```

### 2. 실시간 통신 플로우
```
1. WebSocket 연결 수립
   └→ Socket.io handshake

2. 인증 검증
   └→ JWT 토큰 확인

3. 룸 참여
   └→ 수업별 채널 구독

4. 메시지 브로드캐스트
   └→ 참여자 전체 전송

5. 연결 관리
   └→ Heartbeat
   └→ 재연결 처리
```

## 보안 아키텍처

### 1. 인증 및 인가

#### 1.1 JWT 기반 인증
```typescript
// JWT 페이로드 구조
interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}
```

#### 1.2 역할 기반 접근 제어 (RBAC)
```typescript
// 권한 매트릭스
const permissions = {
  ADMIN: ['*'],
  TEACHER: [
    'textbook:create',
    'textbook:edit:own',
    'class:create',
    'student:view:own'
  ],
  STUDENT: [
    'textbook:view:assigned',
    'assignment:submit',
    'progress:view:own'
  ],
  GUEST: [
    'textbook:view:public'
  ]
};
```

### 2. 보안 미들웨어

#### 2.1 보안 헤더
```typescript
// Helmet 설정
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true
  }
}));
```

#### 2.2 Rate Limiting
```typescript
// API 속도 제한
const rateLimiter = {
  windowMs: 15 * 60 * 1000, // 15분
  max: 100, // 최대 요청 수
  keyGenerator: (req) => req.user?.id || req.ip
};
```

### 3. 데이터 보호

#### 3.1 암호화
- 비밀번호: bcrypt (rounds: 12)
- 민감 데이터: AES-256-GCM
- 전송: TLS 1.3

#### 3.2 입력 검증
```typescript
// Zod 스키마 검증
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100)
});
```

## 배포 아키텍처

### 1. 컨테이너 구성
```yaml
services:
  frontend:
    image: digitalbook-frontend:latest
    ports: ["3000:3000"]
    
  backend:
    image: digitalbook-backend:latest
    ports: ["4000:4000"]
    
  postgres:
    image: postgres:15
    volumes: ["./data:/var/lib/postgresql/data"]
    
  redis:
    image: redis:7-alpine
    
  nginx:
    image: nginx:alpine
    ports: ["80:80", "443:443"]
```

### 2. 환경별 설정

#### 2.1 개발 환경
- Hot Reload 활성화
- Debug 로깅
- Mock 데이터 사용 가능

#### 2.2 스테이징 환경
- 프로덕션과 동일한 구성
- 테스트 데이터 사용
- 성능 모니터링

#### 2.3 프로덕션 환경
- SSL/TLS 필수
- 로그 수집 (ELK Stack)
- APM 모니터링 (Sentry)
- 자동 백업

## 확장성 전략

### 1. 수평 확장

#### 1.1 로드 밸런싱
```
         [Load Balancer]
              ↓
    ┌─────────┼─────────┐
    ↓         ↓         ↓
[Server 1] [Server 2] [Server 3]
```

#### 1.2 데이터베이스 확장
- Read Replicas 구성
- Connection Pooling
- Query 최적화

### 2. 캐싱 전략

#### 2.1 캐시 레벨
```
L1 Cache: 브라우저 캐시
L2 Cache: CDN (CloudFlare)
L3 Cache: Redis
L4 Cache: Application Memory
```

#### 2.2 캐시 무효화
```typescript
// 캐시 키 전략
const cacheKey = `textbook:${id}:v${version}`;
const cacheTTL = 3600; // 1시간
```

### 3. 성능 최적화

#### 3.1 프론트엔드
- Code Splitting
- Lazy Loading
- Image Optimization (Sharp)
- Bundle Size 최적화

#### 3.2 백엔드
- Database Indexing
- Query Optimization
- Connection Pooling
- Async Processing (Bull Queue)

### 4. 모니터링 및 관찰성

#### 4.1 메트릭 수집
```
Application Metrics
├── Response Time
├── Error Rate
├── Throughput
└── Saturation

Infrastructure Metrics
├── CPU Usage
├── Memory Usage
├── Disk I/O
└── Network I/O
```

#### 4.2 로깅 전략
```
Log Levels
├── ERROR: 에러 및 예외
├── WARN: 경고 상황
├── INFO: 중요 이벤트
├── DEBUG: 디버깅 정보
└── TRACE: 상세 추적
```

## 재해 복구 (DR)

### 1. 백업 전략
- **데이터베이스**: 일일 자동 백업
- **파일 스토리지**: 실시간 동기화
- **설정 파일**: Git 버전 관리

### 2. 복구 절차
1. 최신 백업 확인
2. 새 인스턴스 프로비저닝
3. 데이터 복원
4. 서비스 검증
5. DNS 전환

### 3. RTO/RPO 목표
- **RTO** (Recovery Time Objective): 4시간
- **RPO** (Recovery Point Objective): 1시간

## 개발 가이드라인

### 1. 코드 표준
- ESLint + Prettier 설정 준수
- TypeScript strict mode
- 함수형 프로그래밍 선호

### 2. Git 워크플로우
```
main
  └→ develop
      └→ feature/xxx
      └→ bugfix/xxx
      └→ hotfix/xxx
```

### 3. API 버저닝
```
/api/v1/... (현재)
/api/v2/... (차기)
```

## 향후 개선 계획

### Phase 1 (현재 - MVP)
- [x] 통합 User 모델
- [x] 역할 기반 대시보드
- [ ] 보안 강화
- [ ] 테스트 커버리지 80%

### Phase 2 (MVP+)
- [ ] 마이크로서비스 전환
- [ ] GraphQL 도입
- [ ] 실시간 협업 강화
- [ ] AI 기능 고도화

### Phase 3 (Scale)
- [ ] 쿠버네티스 마이그레이션
- [ ] 멀티 리전 지원
- [ ] 기계학습 파이프라인
- [ ] 블록체인 인증서

---

> 📝 이 문서는 시스템의 현재 상태를 반영하며, 지속적으로 업데이트됩니다.
> 
> 최종 수정: 2024-08-07