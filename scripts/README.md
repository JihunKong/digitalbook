# 🚀 AWS Lightsail 서버 테스트 및 복구 도구 모음

## 📋 개요

로그인 500 에러 해결을 위한 체계적인 서버 진단, 테스트, 복구 도구들입니다.

## 🛠️ 도구 목록

### 1. 서버 진단 스크립트 (`server-diagnosis.sh`)
- **목적**: 서버 전반적인 상태 진단
- **기능**: 시스템 정보, 메모리/디스크, Docker 환경, 네트워크, 로그 분석
- **실행법**: `./scripts/server-diagnosis.sh`

### 2. 환경변수 설정 스크립트 (`setup-production-env.sh`) 
- **목적**: 프로덕션 환경변수 자동 생성 및 보안 강화
- **기능**: JWT 시크릿 자동 생성, 데이터베이스/Redis 설정, CORS 구성
- **실행법**: `./scripts/setup-production-env.sh`

### 3. Docker 분석 도구 (`docker-analyzer.sh`)
- **목적**: Docker 컨테이너 상세 분석
- **기능**: 컨테이너 상태, 로그 분석, 헬스체크, 리소스 사용량 모니터링
- **실행법**: `./scripts/docker-analyzer.sh`

### 4. API 테스트 스크립트 (`api-tester.sh`)
- **목적**: 로그인 500 에러 집중 분석 및 API 엔드포인트 테스트
- **기능**: 연결성, 헬스체크, 인증 시스템, 성능/보안 테스트
- **실행법**: `./scripts/api-tester.sh`

### 5. 서버 복구 스크립트 (`server-recovery.sh`)
- **목적**: 서버 자동 복구 및 재배포
- **기능**: 백업, 서비스 중지/재시작, 검증, 로그인 테스트
- **실행법**: `./scripts/server-recovery.sh --auto` (자동 모드)

## 🎯 권장 사용 순서

### 긴급 상황 (로그인 500 에러 발생 시)

```bash
# SSH 서버 접속
ssh -i Korean-Text-Book.pem ubuntu@3.37.168.225

# 1. 서버 전체 상태 진단
./scripts/server-diagnosis.sh

# 2. Docker 컨테이너 상세 분석  
./scripts/docker-analyzer.sh

# 3. API 테스트 (로그인 500 에러 집중 분석)
./scripts/api-tester.sh

# 4. 문제 발견 시 자동 복구 실행
./scripts/server-recovery.sh --auto
```

### 정기 점검

```bash
# 1. 서버 상태 확인
./scripts/server-diagnosis.sh

# 2. API 엔드포인트 테스트
./scripts/api-tester.sh

# 3. 문제 없으면 완료, 문제 발견 시 복구 스크립트 실행
```

### 새 환경 설정

```bash
# 1. 환경변수 설정
./scripts/setup-production-env.sh

# 2. 서비스 시작
./scripts/server-recovery.sh --restart-only

# 3. 검증
./scripts/api-tester.sh
```

## 📊 예상 문제 해결 시나리오

### 시나리오 1: JWT_SECRET 누락 (80% 확률)
```bash
# 증상: 로그인 시 500 에러, "JWT secrets are not configured" 로그
# 해결: ./scripts/setup-production-env.sh 실행 후 서비스 재시작
```

### 시나리오 2: Redis 연결 실패 (15% 확률)
```bash
# 증상: Redis 관련 에러, 세션 저장 실패
# 해결: docker-compose restart redis
```

### 시나리오 3: PostgreSQL 연결 문제 (5% 확률) 
```bash
# 증상: 데이터베이스 연결 에러
# 해결: docker-compose restart postgres
```

## 🔍 각 스크립트별 주요 확인 사항

### server-diagnosis.sh
- ✅ 메모리 사용량 (914MB 제한)
- ✅ 디스크 공간
- ✅ Docker 서비스 상태
- ✅ 실행 중인 컨테이너
- ✅ 네트워크 포트 (3000, 4000, 5432, 6379)

### docker-analyzer.sh  
- ✅ 각 컨테이너별 상태 및 로그
- ✅ 헬스체크 결과
- ✅ 리소스 사용량
- ✅ 네트워크 및 볼륨 설정

### api-tester.sh
- ✅ HTTPS 연결성
- ✅ 헬스체크 엔드포인트
- ✅ 로그인 API (500 에러 집중 분석)
- ✅ CORS 설정
- ✅ Rate limiting

### setup-production-env.sh
- ✅ JWT 시크릿 자동 생성 (64자 랜덤)
- ✅ 데이터베이스 URL 설정
- ✅ Redis URL 설정  
- ✅ CORS Origin 구성
- ✅ 파일 권한 보안 (600)

### server-recovery.sh
- ✅ 현재 상태 백업
- ✅ 서비스 안전 중지
- ✅ 시스템 정리
- ✅ 서비스 재시작
- ✅ 로그인 테스트

## 🚨 중요 주의사항

1. **백업**: 복구 스크립트는 자동으로 현재 상태를 백업합니다
2. **권한**: 일부 명령어는 sudo 권한이 필요할 수 있습니다
3. **로그**: 모든 스크립트는 /tmp에 상세 로그를 생성합니다
4. **환경변수**: .env.production 파일을 절대 Git에 커밋하지 마세요

## 📞 문제 발생 시

1. 각 스크립트의 로그 파일 확인: `/tmp/[script-name]-[timestamp].log`
2. Docker 컨테이너 개별 로그 확인: `docker logs <container-name>`
3. 시스템 리소스 확인: `free -h`, `df -h`
4. 네트워크 상태 확인: `ss -tlnp | grep -E "(3000|4000|5432|6379)"`

## 🎉 성공 확인

로그인 500 에러가 해결되면 다음과 같이 확인됩니다:
- ✅ `api-tester.sh`에서 로그인 API 200 응답
- ✅ `https://xn--220bu63c.com`에서 정상 로그인 가능
- ✅ 모든 Docker 컨테이너 정상 실행 중

---
**생성일**: $(date)  
**대상 서버**: 3.37.168.225 (xn--220bu63c.com)  
**목적**: 로그인 500 에러 해결