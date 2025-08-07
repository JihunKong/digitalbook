# AI 디지털 교과서 - OpenAI API 통합 가이드

## 개요
모든 AI 텍스트 생성 기능이 GPT-4o-mini로 통합되었으며, 이미지 생성은 DALL-E 3를 사용합니다.

## API 키 설정

### 1. OpenAI API 키 발급
1. [OpenAI Platform](https://platform.openai.com)에 접속
2. API Keys 섹션에서 새 키 생성
3. 생성된 키를 안전하게 보관

### 2. 환경 변수 설정

백엔드 `.env` 파일에 단일 키만 설정하면 됩니다:

```env
# OpenAI API Key - 모든 AI 기능에 사용
OPENAI_API_KEY=sk-xxxx...
```

### 3. 지원 기능
- **AI 튜터 채팅**: GPT-4o-mini
- **교과서 생성**: GPT-4o-mini
- **글쓰기 평가**: GPT-4o-mini  
- **문제 생성**: GPT-4o-mini
- **이미지 생성**: DALL-E 3

## GPT-4o-mini 특징

### 장점
- **빠른 응답 속도**: GPT-4 대비 훨씬 빠른 응답
- **저렴한 비용**: GPT-4 대비 약 60% 저렴
- **한국어 성능**: 우수한 한국어 이해 및 생성 능력
- **교육 특화**: 학생 수준에 맞는 설명 가능

### 사용 설정
```javascript
// backend/src/services/ai.service.ts
const response = await this.openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: openAIMessages,
  max_tokens: 1000,
  temperature: 0.7,  // 창의성 수준 (0.0~1.0)
  presence_penalty: 0.1,  // 반복 억제
  frequency_penalty: 0.1,  // 다양성 증가
});
```

## 채팅 시스템 구조

### 1. 메시지 흐름
```
학생 입력 → Frontend → Backend API → GPT-4o-mini → 응답 → Frontend 표시
```

### 2. 컨텍스트 관리
- 현재 페이지 내용 자동 전달
- 최근 20개 대화 기록 유지
- Redis에 1시간 캐싱

### 3. 응답 최적화
- 학생 수준에 맞춘 설명
- 구체적 예시 포함
- 이모지로 친근감 표현
- 격려와 긍정적 피드백

## 비용 예상

### GPT-4o-mini 가격 (2024년 기준)
- 입력: $0.00015 / 1K 토큰
- 출력: $0.0006 / 1K 토큰

### 예상 사용량 및 비용
1. **AI 튜터 채팅**
   - 평균 대화: 입력 200토큰 + 출력 400토큰
   - 학생당 일일 50회 질문
   - 월 비용: 약 $0.45/학생

2. **교과서 생성**
   - 평균 생성: 입력 1000토큰 + 출력 3000토큰
   - 교사당 일일 10회 생성
   - 월 비용: 약 $0.54/교사

3. **글쓰기 평가**
   - 평균 평가: 입력 1500토큰 + 출력 1000토큰
   - 학생당 일일 5회 평가
   - 월 비용: 약 $0.11/학생

4. **이미지 생성 (DALL-E 3)**
   - HD 품질: $0.08/이미지
   - 일일 20개 생성
   - 월 비용: 약 $48

### 총 예상 비용 (100명 학생 + 10명 교사)
- GPT-4o-mini: 약 $62/월
- DALL-E 3: 약 $48/월
- **총액**: 약 $110/월

## 모니터링

### 사용량 추적
```javascript
// 각 API 호출 시 토큰 사용량 로깅
logger.info('GPT-4o-mini usage', {
  promptTokens: response.usage.prompt_tokens,
  completionTokens: response.usage.completion_tokens,
  totalTokens: response.usage.total_tokens,
});
```

### 에러 처리
- API 제한 초과 시 자동 재시도
- 네트워크 오류 시 캐시된 응답 사용
- 사용자에게 친근한 에러 메시지 표시

## 추가 개선 사항

### 1. 응답 품질 향상
- 교과 과정별 프롬프트 최적화
- 학년별 어휘 수준 조정
- 문제 유형별 설명 템플릿

### 2. 성능 최적화
- 자주 묻는 질문 캐싱
- 유사 질문 그룹화
- 배치 처리로 비용 절감

### 3. 안전성
- 부적절한 질문 필터링
- 개인정보 보호
- 학습 목적 외 사용 방지