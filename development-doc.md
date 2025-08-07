# 개발 가이드

## 목차
- [개발 환경 설정](#개발-환경-설정)
- [프로젝트 구조](#프로젝트-구조)
- [코딩 규칙](#코딩-규칙)
- [Git 워크플로우](#git-워크플로우)
- [테스트 작성](#테스트-작성)
- [디버깅](#디버깅)
- [개발 도구](#개발-도구)

## 개발 환경 설정

### 필수 도구
- Node.js 18.0.0 이상
- pnpm 8.0.0 이상 (패키지 매니저)
- Docker Desktop
- Visual Studio Code 또는 WebStorm
- Git

### 초기 설정

#### 1. 저장소 클론 및 의존성 설치
```bash
# 저장소 클론
git clone https://github.com/your-org/ai-textbook.git
cd ai-textbook

# pnpm 설치 (없는 경우)
npm install -g pnpm

# 의존성 설치
pnpm install

# Git hooks 설정
pnpm prepare
```

#### 2. 환경 변수 설정
```bash
# .env 파일 생성
cp examples/.env.example .env.local

# 필수 환경 변수 설정
NODE_ENV=development
DATABASE_URL=postgresql://postgres:password@localhost:5432/ai_textbook_dev
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-development-secret
CLAUDE_API_KEY=your-claude-api-key
DALLE_API_KEY=your-dalle-api-key
```

#### 3. 로컬 데이터베이스 설정
```bash
# Docker로 PostgreSQL 실행
docker run -d \
  --name ai-textbook-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=ai_textbook_dev \
  -p 5432:5432 \
  postgres:15-alpine

# Redis 실행
docker run -d \
  --name ai-textbook-redis \
  -p 6379:6379 \
  redis:7-alpine

# 데이터베이스 마이그레이션
pnpm db:migrate

# 시드 데이터 생성 (선택사항)
pnpm db:seed
```

#### 4. 개발 서버 실행
```bash
# 모든 서비스 동시 실행
pnpm dev

# 개별 서비스 실행
pnpm dev:auth     # Auth Service
pnpm dev:core     # Core Service
pnpm dev:ai       # AI Service
pnpm dev:teacher  # Teacher Frontend
pnpm dev:student  # Student Frontend
```

### VS Code 설정

#### 권장 확장 프로그램
```json
// .vscode/extensions.json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "prisma.prisma",
    "bradlc.vscode-tailwindcss",
    "formulahendry.auto-rename-tag",
    "usernamehw.errorlens",
    "yoavbls.pretty-ts-errors"
  ]
}
```

#### 워크스페이스 설정
```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
    ["cx\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
  ]
}
```

## 프로젝트 구조

### 모노레포 구조
```
ai-textbook/
├── apps/                    # 애플리케이션
│   ├── teacher-web/        # 교사용 웹앱
│   ├── student-web/        # 학생용 웹앱
│   └── admin-web/          # 관리자 웹앱
├── services/               # 백엔드 서비스
│   ├── auth/              # 인증 서비스
│   ├── core/              # 핵심 서비스
│   └── ai/                # AI 서비스
├── packages/              # 공유 패키지
│   ├── ui/                # UI 컴포넌트
│   ├── types/             # TypeScript 타입
│   ├── utils/             # 유틸리티 함수
│   └── config/            # 공통 설정
└── infrastructure/        # 인프라 설정
    ├── docker/           # Docker 설정
    └── k8s/              # Kubernetes 매니페스트
```

### 서비스별 구조
```
services/core/
├── src/
│   ├── modules/           # 기능 모듈
│   │   ├── textbook/     # 교재 관련
│   │   ├── assessment/   # 평가 관련
│   │   └── progress/     # 진도 관련
│   ├── common/           # 공통 요소
│   │   ├── decorators/   # 데코레이터
│   │   ├── filters/      # 예외 필터
│   │   ├── guards/       # 가드
│   │   ├── interceptors/ # 인터셉터
│   │   └── pipes/        # 파이프
│   ├── config/           # 설정
│   ├── database/         # DB 관련
│   └── main.ts           # 진입점
├── test/                 # 테스트
├── prisma/               # Prisma 스키마
└── package.json
```

## 코딩 규칙

### TypeScript 스타일 가이드

#### 명명 규칙
```typescript
// 인터페이스: PascalCase, I 접두사 사용 안 함
interface User {
  id: string;
  email: string;
}

// 타입: PascalCase
type UserRole = 'teacher' | 'student' | 'admin';

// 열거형: PascalCase, 멤버도 PascalCase
enum Status {
  Draft = 'DRAFT',
  Published = 'PUBLISHED',
  Archived = 'ARCHIVED'
}

// 클래스: PascalCase
class TextbookService {
  // private 멤버: _ 접두사
  private _repository: TextbookRepository;
  
  // 메서드: camelCase
  async createTextbook(data: CreateTextbookDto): Promise<Textbook> {
    // ...
  }
}

// 상수: UPPER_SNAKE_CASE
const MAX_PAGE_SIZE = 100;
const API_TIMEOUT = 30000;

// 함수: camelCase
function calculateReadingTime(text: string): number {
  // ...
}
```

#### 파일 명명 규칙
```
// 컴포넌트: PascalCase
TextbookEditor.tsx
StudentDashboard.tsx

// 유틸리티: camelCase
textSegmenter.ts
koreanNlp.utils.ts

// 타입/인터페이스: camelCase
user.types.ts
textbook.interface.ts

// 테스트: *.test.ts 또는 *.spec.ts
textbookService.test.ts
authController.spec.ts
```

### React/Next.js 컨벤션

#### 컴포넌트 구조
```tsx
// components/TextbookCard.tsx
import { FC, memo } from 'react';
import { cn } from '@/lib/utils';

interface TextbookCardProps {
  title: string;
  author: string;
  coverImage?: string;
  onClick?: () => void;
  className?: string;
}

export const TextbookCard: FC<TextbookCardProps> = memo(({
  title,
  author,
  coverImage,
  onClick,
  className
}) => {
  return (
    <div 
      className={cn(
        "rounded-lg border p-4 hover:shadow-lg transition-shadow",
        className
      )}
      onClick={onClick}
    >
      {/* 컴포넌트 내용 */}
    </div>
  );
});

TextbookCard.displayName = 'TextbookCard';
```

#### 커스텀 훅
```tsx
// hooks/useTextbook.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { textbookApi } from '@/api/textbook';

export function useTextbook(id: string) {
  return useQuery({
    queryKey: ['textbook', id],
    queryFn: () => textbookApi.getById(id),
    staleTime: 5 * 60 * 1000, // 5분
  });
}

export function useCreateTextbook() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: textbookApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['textbooks'] });
    },
  });
}
```

### API 설계 원칙

#### RESTful 엔드포인트
```typescript
// ✅ 좋은 예
GET    /api/textbooks          // 목록 조회
GET    /api/textbooks/:id      // 단일 조회
POST   /api/textbooks          // 생성
PUT    /api/textbooks/:id      // 전체 수정
PATCH  /api/textbooks/:id      // 부분 수정
DELETE /api/textbooks/:id      // 삭제

// ✅ 중첩 리소스
GET    /api/textbooks/:id/pages
POST   /api/textbooks/:id/pages

// ❌ 나쁜 예
GET    /api/getTextbooks
POST   /api/createTextbook
POST   /api/textbook/update
```

#### DTO 사용
```typescript
// dto/create-textbook.dto.ts
import { IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';

export class CreateTextbookDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsOptional()
  subject?: string;

  @IsNumber()
  @Min(1)
  @Max(3)
  gradeLevel: number;
}
```

### 에러 처리

#### 커스텀 에러 클래스
```typescript
// common/errors/app.error.ts
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(400, message, 'VALIDATION_ERROR', details);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, `${resource} not found`, 'NOT_FOUND');
  }
}
```

#### 에러 핸들러
```typescript
// middleware/error.handler.ts
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  logger.error(err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details
      }
    });
  }

  // 예상치 못한 에러
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred'
    }
  });
}
```

## Git 워크플로우

### 브랜치 전략
```
main
├── develop
│   ├── feature/add-ai-tutor
│   ├── feature/implement-text-segmentation
│   └── feature/create-dashboard
├── release/v1.0.0
└── hotfix/fix-auth-bug
```

### 커밋 메시지 규칙
```
<type>(<scope>): <subject>

<body>

<footer>
```

#### Type
- `feat`: 새로운 기능
- `fix`: 버그 수정
- `docs`: 문서 수정
- `style`: 코드 포맷팅, 세미콜론 누락 등
- `refactor`: 코드 리팩토링
- `test`: 테스트 추가/수정
- `chore`: 빌드 프로세스, 도구 설정 등

#### 예시
```
feat(textbook): add text segmentation algorithm

- Implement Korean text segmentation based on semantic units
- Add support for grade-level based length calculation
- Include unit tests for edge cases

Closes #123
```

### Pull Request 템플릿
```markdown
## 변경 사항
<!-- 이 PR에서 변경된 내용을 간단히 설명해주세요 -->

## 관련 이슈
<!-- 관련된 이슈 번호를 적어주세요 (예: #123) -->

## 테스트
<!-- 어떻게 테스트했는지 설명해주세요 -->
- [ ] 단위 테스트 통과
- [ ] 통합 테스트 통과
- [ ] 수동 테스트 완료

## 체크리스트
- [ ] 코드 리뷰 요청 전 자체 리뷰 완료
- [ ] 문서 업데이트 (필요한 경우)
- [ ] 타입 정의 추가/수정 (필요한 경우)
```

## 테스트 작성

### 단위 테스트

#### Jest 설정
```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.interface.ts',
    '!src/main.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

#### 테스트 예시
```typescript
// textbook.service.test.ts
import { Test, TestingModule } from '@nestjs/testing';
import { TextbookService } from './textbook.service';
import { TextbookRepository } from './textbook.repository';

describe('TextbookService', () => {
  let service: TextbookService;
  let repository: jest.Mocked<TextbookRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TextbookService,
        {
          provide: TextbookRepository,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TextbookService>(TextbookService);
    repository = module.get(TextbookRepository);
  });

  describe('createTextbook', () => {
    it('should create a textbook with segmented pages', async () => {
      // Arrange
      const createDto = {
        title: '테스트 교재',
        content: '긴 텍스트 내용...',
        gradeLevel: 2,
      };
      
      const expectedTextbook = {
        id: 'uuid',
        ...createDto,
        pages: [{ pageNumber: 1, content: '...' }],
      };

      repository.create.mockResolvedValue(expectedTextbook);

      // Act
      const result = await service.createTextbook(createDto);

      // Assert
      expect(result).toEqual(expectedTextbook);
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: createDto.title,
        })
      );
    });

    it('should throw error for invalid content', async () => {
      // Arrange
      const createDto = {
        title: '테스트 교재',
        content: '', // 빈 내용
        gradeLevel: 2,
      };

      // Act & Assert
      await expect(service.createTextbook(createDto))
        .rejects
        .toThrow('Content cannot be empty');
    });
  });
});
```

### 통합 테스트

```typescript
// textbook.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('TextbookController (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // 인증 토큰 획득
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'teacher@test.com',
        password: 'password123',
      });
    
    authToken = loginResponse.body.token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('/textbooks (POST)', () => {
    return request(app.getHttpServer())
      .post('/textbooks')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: '새로운 교재',
        content: '교재 내용...',
        gradeLevel: 2,
      })
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty('id');
        expect(res.body.title).toBe('새로운 교재');
      });
  });
});
```

### React 컴포넌트 테스트

```tsx
// TextbookCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { TextbookCard } from './TextbookCard';

describe('TextbookCard', () => {
  const defaultProps = {
    title: '테스트 교재',
    author: '김선생',
    coverImage: '/test-image.jpg',
  };

  it('renders textbook information', () => {
    render(<TextbookCard {...defaultProps} />);
    
    expect(screen.getByText('테스트 교재')).toBeInTheDocument();
    expect(screen.getByText('김선생')).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute('src', '/test-image.jpg');
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<TextbookCard {...defaultProps} onClick={handleClick} />);
    
    fireEvent.click(screen.getByText('테스트 교재'));
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies custom className', () => {
    const { container } = render(
      <TextbookCard {...defaultProps} className="custom-class" />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
```

## 디버깅

### 로깅 설정

```typescript
// logger.config.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'ai-textbook' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

// 개발 환경에서 더 자세한 로그
if (process.env.NODE_ENV === 'development') {
  logger.add(new winston.transports.File({
    filename: 'debug.log',
    level: 'debug',
  }));
}

export default logger;
```

### VS Code 디버깅 설정

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Core Service",
      "skipFiles": ["<node_internals>/**"],
      "program": "${workspaceFolder}/services/core/src/main.ts",
      "preLaunchTask": "tsc: build - services/core/tsconfig.json",
      "outFiles": ["${workspaceFolder}/services/core/dist/**/*.js"],
      "env": {
        "NODE_ENV": "development",
        "DEBUG": "*"
      }
    },
    {
      "type": "chrome",
      "request": "launch",
      "name": "Debug Next.js",
      "url": "http://localhost:3000",
      "webRoot": "${workspaceFolder}/apps/teacher-web",
      "sourceMapPathOverrides": {
        "webpack://_N_E/*": "${webRoot}/*"
      }
    }
  ]
}
```

### 성능 프로파일링

```typescript
// 성능 측정 데코레이터
export function MeasurePerformance() {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const start = performance.now();
      
      try {
        const result = await originalMethod.apply(this, args);
        const end = performance.now();
        
        logger.debug(`${propertyKey} took ${end - start}ms`);
        
        return result;
      } catch (error) {
        const end = performance.now();
        logger.error(`${propertyKey} failed after ${end - start}ms`, error);
        throw error;
      }
    };

    return descriptor;
  };
}

// 사용 예
class TextbookService {
  @MeasurePerformance()
  async createTextbook(data: CreateTextbookDto) {
    // ...
  }
}
```

## 개발 도구

### 유용한 스크립트

```json
// package.json
{
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "test:watch": "turbo run test:watch",
    "test:cov": "turbo run test:cov",
    "lint": "turbo run lint",
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md}\"",
    "type-check": "turbo run type-check",
    "clean": "turbo run clean && rm -rf node_modules",
    "db:migrate": "prisma migrate dev",
    "db:push": "prisma db push",
    "db:seed": "ts-node prisma/seed.ts",
    "db:studio": "prisma studio",
    "analyze": "ANALYZE=true pnpm build",
    "prepare": "husky install"
  }
}
```

### 코드 생성기

```bash
# 새로운 서비스 모듈 생성
pnpm plop service

# 새로운 React 컴포넌트 생성
pnpm plop component

# API 엔드포인트 생성
pnpm plop api
```

### 의존성 관리

```bash
# 의존성 업데이트 확인
pnpm outdated

# 안전한 업데이트
pnpm update --interactive

# 취약점 검사
pnpm audit

# 사용하지 않는 의존성 찾기
pnpm dlx depcheck
```

### 빌드 최적화

```javascript
// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
});
```

---

이 가이드는 프로젝트의 발전에 따라 지속적으로 업데이트됩니다. 새로운 패턴이나 규칙이 필요한 경우 팀과 논의 후 문서를 갱신해주세요.