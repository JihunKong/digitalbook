# API 문서

## 목차
- [개요](#개요)
- [인증](#인증)
- [API 엔드포인트](#api-엔드포인트)
  - [Auth API](#auth-api)
  - [Textbook API](#textbook-api)
  - [AI API](#ai-api)
  - [Writing API](#writing-api)
  - [Progress API](#progress-api)
- [에러 처리](#에러-처리)
- [Rate Limiting](#rate-limiting)

## 개요

### Base URL
```
Production: https://api.ai-textbook.com
Development: http://localhost:3000
```

### 요청 형식
- Content-Type: `application/json`
- 문자 인코딩: `UTF-8`

### 응답 형식
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2024-01-20T10:00:00Z",
    "version": "1.0.0"
  }
}
```

### 에러 응답 형식
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "사람이 읽을 수 있는 에러 메시지",
    "details": { ... }
  }
}
```

## 인증

### JWT 토큰 사용
모든 보호된 엔드포인트는 Authorization 헤더에 Bearer 토큰이 필요합니다.

```http
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 토큰 갱신
토큰 만료 전 갱신 엔드포인트를 호출하여 새 토큰을 받을 수 있습니다.

## API 엔드포인트

### Auth API

#### 회원가입
```http
POST /api/auth/register
```

**요청 본문:**
```json
{
  "email": "teacher@school.com",
  "password": "SecurePass123!",
  "name": "김선생",
  "userType": "teacher",
  "schoolName": "한국고등학교",
  "gradeLevel": 2  // 학생인 경우
}
```

**응답:**
```json
{
  "success": true,
  "data": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "email": "teacher@school.com",
    "name": "김선생",
    "userType": "teacher",
    "token": "eyJhbGciOiJSUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJSUzI1NiIs..."
  }
}
```

#### 로그인
```http
POST /api/auth/login
```

**요청 본문:**
```json
{
  "email": "teacher@school.com",
  "password": "SecurePass123!"
}
```

**응답:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "teacher@school.com",
      "name": "김선생",
      "userType": "teacher",
      "schoolName": "한국고등학교"
    },
    "token": "eyJhbGciOiJSUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJSUzI1NiIs..."
  }
}
```

#### 토큰 갱신
```http
POST /api/auth/refresh
```

**요청 본문:**
```json
{
  "refreshToken": "eyJhbGciOiJSUzI1NiIs..."
}
```

#### 로그아웃
```http
POST /api/auth/logout
Authorization: Bearer {token}
```

#### 비밀번호 재설정 요청
```http
POST /api/auth/password/reset-request
```

**요청 본문:**
```json
{
  "email": "teacher@school.com"
}
```

### Textbook API

#### 교재 생성
```http
POST /api/textbooks
Authorization: Bearer {token}
```

**요청 본문:**
```json
{
  "title": "현대문학의 이해",
  "content": "전체 텍스트 내용...",
  "subject": "국어",
  "gradeLevel": 2,
  "options": {
    "targetPageLength": 500,
    "generateImages": true,
    "generateQuestions": true,
    "questionDifficulty": "medium"
  }
}
```

**응답:**
```json
{
  "success": true,
  "data": {
    "textbookId": "550e8400-e29b-41d4-a716-446655440001",
    "title": "현대문학의 이해",
    "totalPages": 15,
    "status": "processing",
    "pages": [
      {
        "pageNumber": 1,
        "content": "첫 페이지 내용...",
        "imagePrompt": "현대 문학을 상징하는 추상적인 이미지",
        "imageStatus": "generating",
        "questions": [
          {
            "id": "q1",
            "questionText": "이 단락의 주제는 무엇인가요?",
            "questionType": "comprehension",
            "difficulty": 3
          }
        ]
      }
    ]
  }
}
```

#### 교재 목록 조회
```http
GET /api/textbooks?page=1&limit=20&status=published
Authorization: Bearer {token}
```

**쿼리 파라미터:**
- `page`: 페이지 번호 (기본값: 1)
- `limit`: 페이지당 항목 수 (기본값: 20, 최대: 100)
- `status`: 상태 필터 (draft, published, archived)
- `subject`: 과목 필터
- `search`: 제목 검색

**응답:**
```json
{
  "success": true,
  "data": {
    "textbooks": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "title": "현대문학의 이해",
        "subject": "국어",
        "gradeLevel": 2,
        "totalPages": 15,
        "status": "published",
        "createdAt": "2024-01-20T10:00:00Z",
        "studentsCount": 25
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 87,
      "itemsPerPage": 20
    }
  }
}
```

#### 교재 상세 조회
```http
GET /api/textbooks/{textbookId}
Authorization: Bearer {token}
```

#### 교재 수정
```http
PUT /api/textbooks/{textbookId}
Authorization: Bearer {token}
```

#### 교재 삭제
```http
DELETE /api/textbooks/{textbookId}
Authorization: Bearer {token}
```

#### 페이지 조회
```http
GET /api/textbooks/{textbookId}/pages/{pageNumber}
Authorization: Bearer {token}
```

**응답:**
```json
{
  "success": true,
  "data": {
    "page": {
      "id": "page-uuid",
      "textbookId": "textbook-uuid",
      "pageNumber": 1,
      "content": "페이지 내용...",
      "imageUrl": "https://storage.ai-textbook.com/images/...",
      "estimatedReadingTime": 180,
      "questions": [
        {
          "id": "question-uuid",
          "questionText": "이 단락의 주제는 무엇인가요?",
          "questionType": "comprehension",
          "difficulty": 3,
          "hints": [
            "주인공의 감정 변화에 주목해보세요",
            "배경 묘사가 주는 의미를 생각해보세요"
          ]
        }
      ]
    },
    "navigation": {
      "previousPage": null,
      "nextPage": 2,
      "totalPages": 15
    }
  }
}
```

#### 페이지 이미지 재생성
```http
POST /api/textbooks/{textbookId}/pages/{pageNumber}/regenerate-image
Authorization: Bearer {token}
```

### AI API

#### AI 튜터 대화
```http
POST /api/ai/chat
Authorization: Bearer {token}
```

**요청 본문:**
```json
{
  "textbookId": "textbook-uuid",
  "pageId": "page-uuid",
  "message": "이 부분에서 은유가 무엇을 의미하는지 잘 모르겠어요",
  "sessionId": "session-uuid",
  "context": {
    "previousMessages": 3,
    "includePageContent": true
  }
}
```

**응답:**
```json
{
  "success": true,
  "data": {
    "response": "은유에 대해 궁금하신가요? 좋은 질문이에요! 먼저, 이 문단에서 어떤 표현이 은유라고 생각하시나요?",
    "conversationId": "conv-uuid",
    "suggestions": [
      "빛과 어둠의 대비가 의미하는 것은?",
      "주인공의 감정을 표현한 부분 찾기"
    ],
    "metadata": {
      "responseTime": 1.2,
      "tokensUsed": 150
    }
  }
}
```

#### 대화 기록 조회
```http
GET /api/ai/conversations/{sessionId}
Authorization: Bearer {token}
```

#### 학습 힌트 요청
```http
POST /api/ai/hint
Authorization: Bearer {token}
```

**요청 본문:**
```json
{
  "questionId": "question-uuid",
  "attemptCount": 2,
  "studentAnswer": "학생이 작성한 답변..."
}
```

### Writing API

#### 쓰기 과제 생성
```http
POST /api/writing/assignments
Authorization: Bearer {token}
```

**요청 본문:**
```json
{
  "title": "나의 꿈에 대하여",
  "prompt": "자신의 꿈과 그 꿈을 이루기 위한 계획을 구체적으로 서술하시오.",
  "genre": "narrative",
  "requirements": {
    "minLength": 500,
    "maxLength": 1000,
    "includeElements": ["서론", "본론", "결론"]
  },
  "dueDate": "2024-02-01T23:59:59Z",
  "targetStudents": ["class-2-1", "class-2-2"]
}
```

#### 쓰기 과제 제출
```http
POST /api/writing/submissions
Authorization: Bearer {token}
```

**요청 본문:**
```json
{
  "assignmentId": "assignment-uuid",
  "content": "학생이 작성한 글 내용...",
  "isDraft": false
}
```

#### AI 글쓰기 평가
```http
POST /api/writing/evaluate
Authorization: Bearer {token}
```

**요청 본문:**
```json
{
  "submissionId": "submission-uuid",
  "evaluationType": "comprehensive",
  "focusAreas": ["structure", "grammar", "coherence", "creativity"]
}
```

**응답:**
```json
{
  "success": true,
  "data": {
    "evaluation": {
      "overallScore": 82,
      "sections": [
        {
          "sectionType": "introduction",
          "startIndex": 0,
          "endIndex": 150,
          "score": 85,
          "feedback": "서론이 명확하고 독자의 관심을 끌기에 충분합니다.",
          "suggestions": ["좀 더 구체적인 예시를 추가하면 좋겠습니다."]
        }
      ],
      "strengths": [
        "논리적인 구성",
        "적절한 어휘 사용",
        "창의적인 표현"
      ],
      "improvements": [
        "문단 간 연결을 더 자연스럽게",
        "구체적인 예시 추가 필요"
      ],
      "detailedFeedback": {
        "structure": {
          "score": 85,
          "comment": "전체적인 구조가 잘 짜여있습니다."
        },
        "grammar": {
          "score": 90,
          "errors": [
            {
              "position": 234,
              "error": "조사 오류",
              "suggestion": "'에게' → '에게는'"
            }
          ]
        }
      }
    }
  }
}
```

### Progress API

#### 학습 진도 조회
```http
GET /api/progress/students/{studentId}/textbooks/{textbookId}
Authorization: Bearer {token}
```

**응답:**
```json
{
  "success": true,
  "data": {
    "progress": {
      "studentId": "student-uuid",
      "textbookId": "textbook-uuid",
      "currentPage": 7,
      "totalPages": 15,
      "completionRate": 46.7,
      "timeSpent": 3240,
      "lastAccessedAt": "2024-01-20T15:30:00Z",
      "pageProgress": [
        {
          "pageNumber": 1,
          "status": "completed",
          "timeSpent": 420,
          "questionsAnswered": 3,
          "correctAnswers": 2
        }
      ]
    }
  }
}
```

#### 학급 전체 진도 조회
```http
GET /api/progress/classes/{classId}/summary
Authorization: Bearer {token}
```

#### 학습 세션 시작
```http
POST /api/progress/sessions/start
Authorization: Bearer {token}
```

**요청 본문:**
```json
{
  "textbookId": "textbook-uuid",
  "pageNumber": 1
}
```

#### 학습 세션 종료
```http
POST /api/progress/sessions/{sessionId}/end
Authorization: Bearer {token}
```

#### 답안 제출
```http
POST /api/progress/answers
Authorization: Bearer {token}
```

**요청 본문:**
```json
{
  "questionId": "question-uuid",
  "answer": "학생의 답변",
  "timeSpent": 120
}
```

## 에러 처리

### 에러 코드

| 코드 | 설명 | HTTP 상태 |
|------|------|-----------|
| `AUTH_INVALID_CREDENTIALS` | 잘못된 이메일 또는 비밀번호 | 401 |
| `AUTH_TOKEN_EXPIRED` | 만료된 토큰 | 401 |
| `AUTH_TOKEN_INVALID` | 유효하지 않은 토큰 | 401 |
| `AUTH_INSUFFICIENT_PERMISSIONS` | 권한 부족 | 403 |
| `RESOURCE_NOT_FOUND` | 리소스를 찾을 수 없음 | 404 |
| `VALIDATION_ERROR` | 입력값 검증 실패 | 400 |
| `RATE_LIMIT_EXCEEDED` | API 호출 한도 초과 | 429 |
| `INTERNAL_SERVER_ERROR` | 서버 내부 오류 | 500 |
| `AI_SERVICE_UNAVAILABLE` | AI 서비스 일시적 불가 | 503 |

### 에러 응답 예시
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "입력값이 올바르지 않습니다.",
    "details": {
      "fields": {
        "email": "올바른 이메일 형식이 아닙니다.",
        "password": "비밀번호는 최소 8자 이상이어야 합니다."
      }
    }
  }
}
```

## Rate Limiting

### 기본 제한
- 인증된 사용자: 분당 100회
- 미인증 사용자: 분당 20회
- AI API: 분당 30회

### Rate Limit 헤더
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642680000
```

### 한도 초과 시 응답
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "API 호출 한도를 초과했습니다. 잠시 후 다시 시도해주세요.",
    "retryAfter": 60
  }
}
```

## 웹훅

### 웹훅 등록
```http
POST /api/webhooks
Authorization: Bearer {token}
```

**요청 본문:**
```json
{
  "url": "https://your-server.com/webhook",
  "events": ["textbook.created", "student.progress.updated"],
  "secret": "your-webhook-secret"
}
```

### 지원 이벤트
- `textbook.created`: 교재 생성 완료
- `textbook.image.generated`: 이미지 생성 완료
- `student.progress.updated`: 학생 진도 업데이트
- `writing.evaluated`: 글쓰기 평가 완료

### 웹훅 페이로드 예시
```json
{
  "event": "textbook.created",
  "timestamp": "2024-01-20T10:00:00Z",
  "data": {
    "textbookId": "textbook-uuid",
    "title": "현대문학의 이해",
    "totalPages": 15
  }
}
```

---

API 문서는 지속적으로 업데이트됩니다. 최신 정보는 [API Playground](/api/playground)에서 확인하실 수 있습니다.