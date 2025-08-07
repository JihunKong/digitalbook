# AI 교과서 플랫폼

<div align="center">
  <h3>🎓 대한민국 교육 현장에 최적화된 오픈플랫폼 AI 교과서 시스템</h3>
  <p>
    <img src="https://img.shields.io/badge/version-0.1.0-blue.svg" />
    <img src="https://img.shields.io/badge/license-MIT-green.svg" />
    <img src="https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg" />
  </p>
</div>

## 🎯 프로젝트 소개

AI 교과서 플랫폼은 디지털 교육의 새로운 패러다임을 제시하는 혁신적인 학습 시스템입니다.

### 주요 특징
- 📚 **지능형 읽기 학습**: AI가 텍스트를 자동 분할하고 맞춤형 이미지 생성
- ✍️ **스마트 쓰기 평가**: 장르별 특성을 고려한 자동 평가 및 피드백
- 💬 **1:1 AI 튜터링**: 학생 개별 속도에 맞춘 대화형 학습 지원
- 📊 **실시간 학습 분석**: 교사를 위한 상세한 학습 모니터링 대시보드

## 🚀 빠른 시작

### 필수 요구사항
- Node.js 18.0.0 이상
- Docker & Docker Compose
- Kubernetes (Lightsail 환경)
- PostgreSQL 15+

### 설치 및 실행

```bash
# 1. 저장소 클론
git clone https://github.com/your-org/ai-textbook.git
cd ai-textbook

# 2. 환경 변수 설정
cp examples/.env.example .env
# .env 파일을 열어 필요한 값 설정

# 3. 의존성 설치
npm run install:all

# 4. 데이터베이스 마이그레이션
npm run db:migrate

# 5. 개발 서버 시작
npm run dev
```

### Docker를 사용한 실행

```bash
# 전체 스택 실행
docker-compose up -d

# 특정 서비스만 실행
docker-compose up -d postgres redis
```

## 📁 프로젝트 구조

```
ai-textbook/
├── services/           # 마이크로서비스
│   ├── backend/       # 백엔드 서비스들
│   └── frontend/      # 프론트엔드 앱들
├── k8s/               # Kubernetes 매니페스트
├── docs/              # 프로젝트 문서
├── scripts/           # 유틸리티 스크립트
└── database/          # DB 스키마 및 마이그레이션
```

## 📚 문서

### 개발 문서
- [아키텍처 가이드](./docs/ARCHITECTURE.md) - 시스템 설계 및 구조
- [API 문서](./docs/API.md) - REST API 엔드포인트 및 사용법
- [데이터베이스](./docs/DATABASE.md) - 스키마 및 모델 설계
- [개발 가이드](./docs/DEVELOPMENT.md) - 개발 환경 설정 및 코딩 규칙

### 운영 문서
- [배포 가이드](./docs/DEPLOYMENT.md) - Kubernetes 배포 절차
- [모니터링](./docs/MONITORING.md) - 시스템 모니터링 및 로깅
- [문제 해결](./docs/TROUBLESHOOTING.md) - 일반적인 문제 해결 방법

## 🛠️ 기술 스택

### Backend
- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL 15 + Redis
- **AI Integration**: Claude API, DALL-E 3

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand + React Query

### Infrastructure
- **Container**: Docker
- **Orchestration**: Kubernetes
- **Cloud**: AWS Lightsail
- **CI/CD**: GitHub Actions

## 🤝 기여하기

프로젝트에 기여하고 싶으신가요? [기여 가이드](./.github/CONTRIBUTING.md)를 참고해주세요.

### 기여 방법
1. 이 저장소를 Fork합니다
2. 새 브랜치를 생성합니다 (`git checkout -b feature/amazing-feature`)
3. 변경사항을 커밋합니다 (`git commit -m 'Add amazing feature'`)
4. 브랜치에 Push합니다 (`git push origin feature/amazing-feature`)
5. Pull Request를 생성합니다

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참고하세요.

## 👥 팀

- **프로젝트 리드**: [이름]
- **백엔드 개발**: [이름]
- **프론트엔드 개발**: [이름]
- **AI/ML 엔지니어**: [이름]

## 📞 문의

- 이메일: contact@ai-textbook.com
- 이슈 트래커: [GitHub Issues](https://github.com/your-org/ai-textbook/issues)

---

<div align="center">
  Made with ❤️ for Korean Education
</div>