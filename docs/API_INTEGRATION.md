# OpenAI API 통합 문서

## 개요
이 프로젝트는 모든 텍스트 AI 기능을 GPT-4o-mini로, 이미지 생성을 DALL-E 3로 통합하여 사용합니다.

## 사용 모델

### 1. GPT-4o-mini (모든 텍스트 생성)
- **용도**: 
  - AI 튜터 채팅
  - 교과서 콘텐츠 생성
  - 글쓰기 평가
  - 문제 생성
  - 요약 및 핵심 포인트 추출
- **특징**: 빠른 응답, 저렴한 비용, 우수한 한국어 성능
- **설정**:
  ```javascript
  model: 'gpt-4o-mini',
  temperature: 0.7-0.8,  // 용도에 따라 조정
  max_tokens: 1000-4000  // 용도에 따라 조정
  ```

### 2. DALL-E 3 (이미지 생성)
- **용도**: 교육용 일러스트레이션 생성
- **특징**: 고품질 이미지, 한국어 프롬프트 지원
- **설정**:
  ```javascript
  model: 'dall-e-3',
  size: '1024x1024',
  quality: 'hd'
  ```

## 비용 최적화

### 월간 예상 비용 (학생 100명 + 교사 10명 기준)
- **GPT-4o-mini (모든 텍스트)**: $62/월
  - 채팅: 학생당 일일 50회 질문
  - 교과서 생성: 교사당 일일 10회
  - 글쓰기 평가: 학생당 일일 5회
  
- **DALL-E 3 (이미지)**: $48/월
  - 일일 20개 이미지 생성
  - HD 품질 기준

**총 예상 비용**: 약 $110/월

### GPT-4o-mini의 장점
1. **비용 효율성**: GPT-4 대비 60% 저렴
2. **속도**: 5-10배 빠른 응답 시간
3. **품질**: 교육용으로 충분한 성능
4. **확장성**: 더 많은 사용자 수용 가능

## 모범 사례

### 1. 토큰 사용량 최적화
```javascript
// 프롬프트 압축
const compressedPrompt = prompt
  .replace(/\s+/g, ' ')
  .trim();

// 불필요한 반복 제거
const uniqueContent = [...new Set(contents)];
```

### 2. 캐싱 전략
```javascript
// Redis 캐싱으로 중복 요청 방지
const cacheKey = `response:${hashPrompt(prompt)}`;
const cached = await redis.get(cacheKey);
if (cached) return cached;
```

### 3. 에러 처리
```javascript
// 재시도 로직
const maxRetries = 3;
for (let i = 0; i < maxRetries; i++) {
  try {
    return await openai.chat.completions.create(params);
  } catch (error) {
    if (i === maxRetries - 1) throw error;
    await sleep(1000 * Math.pow(2, i)); // 지수 백오프
  }
}
```

## 보안 고려사항

### 1. API 키 관리
- 환경 변수로만 관리
- 절대 코드에 하드코딩 금지
- 정기적인 키 로테이션

### 2. 사용량 제한
- IP당 요청 제한
- 사용자별 일일 한도
- 비정상적 사용 패턴 감지

### 3. 콘텐츠 필터링
- 부적절한 입력 차단
- 생성된 콘텐츠 검증
- 교육 목적 외 사용 방지