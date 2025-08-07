# 🚀 디지털 교과서 플랫폼 v2.0 배포 완료

## 배포 상태
✅ **배포 완료** - 2025년 8월 4일

## 서버 정보
- **IP 주소**: 3.37.168.225
- **플랫폼**: AWS Lightsail (Ubuntu 22.04)
- **Docker 컨테이너**: 
  - PostgreSQL 15
  - Redis 7
  - Node.js Backend
  - Next.js Frontend

## 접속 정보

### 웹사이트
- **URL**: http://3.37.168.225:3000
- **상태**: 빌드 진행 중 (약 5-10분 소요)

### 주요 페이지
- 교사 대시보드: `/teacher/dashboard`
- 학생 입장: `/student/join`
- 학생 교실: `/student/classroom`

## 테스트 방법

### 1. 교사로 테스트
1. http://3.37.168.225:3000/teacher/dashboard 접속
2. "새 수업 만들기" 클릭
3. 수업 이름 입력 (예: "국어 3-1")
4. 6자리 코드 확인
5. 문서 업로드 (PDF, TXT, MD)

### 2. 학생으로 테스트
1. http://3.37.168.225:3000/student/join 접속
2. 6자리 코드 입력
3. 이름과 학번 입력
4. 수업 참여

## 주요 변경사항

### 제거된 기능
- ❌ DALL-E 이미지 생성
- ❌ 게이미피케이션 (포인트, 뱃지)
- ❌ 복잡한 교과서 편집기

### 새로운 기능
- ✅ 문서 뷰어 + AI 챗봇 인터페이스
- ✅ 6자리 코드 시스템
- ✅ 소크라테스식 AI 코칭
- ✅ 실시간 질문 모니터링

## 기술 스택
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Express.js, Prisma ORM
- **Database**: PostgreSQL 15
- **Cache**: Redis 7
- **AI**: OpenAI GPT-4

## 모니터링

### Docker 컨테이너 상태 확인
```bash
ssh -i Korean-Text-Book.pem ubuntu@3.37.168.225 "docker ps"
```

### 로그 확인
```bash
# Backend 로그
ssh -i Korean-Text-Book.pem ubuntu@3.37.168.225 "docker logs backend"

# Frontend 로그
ssh -i Korean-Text-Book.pem ubuntu@3.37.168.225 "docker logs frontend"
```

## 트러블슈팅

### 접속이 안 되는 경우
1. 5-10분 정도 기다려주세요 (빌드 시간)
2. 포트 3000이 열려있는지 확인
3. Docker 컨테이너 상태 확인

### 컨테이너 재시작
```bash
ssh -i Korean-Text-Book.pem ubuntu@3.37.168.225
docker restart backend frontend
```

## 향후 계획
- [ ] HTTPS 설정 (Let's Encrypt)
- [ ] 도메인 연결
- [ ] 자동 백업 설정
- [ ] 모니터링 대시보드 구축

---

**배포 완료!** 🎉

서버가 완전히 준비되면 http://3.37.168.225:3000 에서 확인하실 수 있습니다.