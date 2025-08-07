# 국어 디지털 교과서 플랫폼

AI 기반 맞춤형 국어 학습 플랫폼

## 🚀 주요 기능

### 교사용 기능
- **AI 교재 생성**: 텍스트를 업로드하면 AI가 자동으로 페이지 분할, 이미지 생성, 문제 출제
- **실시간 모니터링**: 학생들의 학습 진도와 성취도를 실시간으로 확인
- **맞춤형 과제**: 학생 수준에 맞는 개별화된 과제 생성
- **성과 분석**: 상세한 학습 데이터 분석 및 리포트

### 학생용 기능
- **대화형 학습**: 페이지별로 구성된 읽기 쉬운 콘텐츠
- **AI 튜터**: 24시간 질문 가능한 1:1 AI 튜터
- **즉각적 피드백**: 문제 풀이 시 실시간 피드백 제공
- **게이미피케이션**: 포인트, 뱃지, 리더보드로 학습 동기 부여

## 🛠️ 기술 스택

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **UI Components**: Radix UI, Framer Motion
- **State Management**: Zustand, React Query
- **AI Integration**: Claude API, DALL-E 3
- **Backend**: Node.js, Express (계획)
- **Database**: PostgreSQL, Redis (계획)

## 📋 시작하기

### 필수 요구사항
- Node.js 18.0.0 이상
- npm 또는 yarn

### 설치 및 실행

1. 저장소 클론
```bash
git clone https://github.com/your-username/korean-digital-textbook.git
cd korean-digital-textbook
```

2. 의존성 설치
```bash
npm install
# 또는
yarn install
```

3. 환경 변수 설정
```bash
cp .env.example .env.local
# .env.local 파일을 열어 필요한 값 설정
```

4. 개발 서버 실행
```bash
npm run dev
# 또는
yarn dev
```

5. 브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

## 📁 프로젝트 구조

```
korean-digital-textbook/
├── src/
│   ├── app/              # Next.js App Router 페이지
│   │   ├── teacher/      # 교사용 페이지
│   │   ├── student/      # 학생용 페이지
│   │   └── auth/         # 인증 관련 페이지
│   ├── components/       # React 컴포넌트
│   │   └── ui/          # UI 컴포넌트
│   ├── services/        # API 및 비즈니스 로직
│   ├── hooks/           # 커스텀 React 훅
│   ├── utils/           # 유틸리티 함수
│   └── types/           # TypeScript 타입 정의
├── public/              # 정적 파일
└── docs/               # 문서
```

## 🔧 주요 컴포넌트

### 교재 생성 흐름
1. 교사가 텍스트 업로드 또는 입력
2. AI가 텍스트를 적절한 길이로 분할
3. 각 페이지에 맞는 이미지 프롬프트 생성
4. 학습 문제 자동 생성
5. 미리보기 및 수정
6. 교재 발행

### AI 서비스
- **텍스트 분할**: 의미 단위를 고려한 지능적 분할
- **이미지 생성**: 텍스트 내용에 맞는 교육적 이미지
- **문제 생성**: 난이도별 다양한 유형의 문제
- **채팅 튜터**: 맥락을 이해하는 대화형 학습 도우미

## 🎨 UI/UX 특징

- **반응형 디자인**: 모든 기기에서 최적화된 경험
- **다크 모드**: 눈의 피로를 줄이는 다크 모드 지원
- **접근성**: WCAG 2.1 AA 기준 준수
- **애니메이션**: 부드러운 전환 효과로 사용성 향상

## 🚧 개발 로드맵

### Phase 1 (현재)
- [x] 기본 UI/UX 구현
- [x] 교사/학생 대시보드
- [x] 교재 생성 플로우
- [ ] AI 서비스 통합

### Phase 2
- [ ] 백엔드 API 구현
- [ ] 데이터베이스 연동
- [ ] 사용자 인증 시스템
- [ ] 실시간 학습 추적

### Phase 3
- [ ] 고급 분석 기능
- [ ] 협업 기능
- [ ] 모바일 앱
- [ ] 오프라인 모드

## 🤝 기여하기

기여를 환영합니다! PR을 제출하기 전에 다음을 확인해주세요:

1. 코드 스타일 가이드 준수
2. 테스트 작성
3. 문서 업데이트

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 📞 문의

- 이메일: purusil55@gmail.com
- 이슈 트래커: [GitHub Issues](https://github.com/JihunKong/korean-digital-textbook/issues)

---

Made with ❤️ for Korean Education