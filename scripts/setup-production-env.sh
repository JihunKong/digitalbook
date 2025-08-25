#!/bin/bash

# ==========================================================
# AWS Lightsail 프로덕션 환경변수 설정 스크립트
# ==========================================================

set -e

# 색상 설정
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 프로젝트 디렉토리
PROJECT_DIR="/home/ubuntu/digitalbook"
ENV_FILE="$PROJECT_DIR/.env.production"

echo -e "${BLUE}========================================"
echo -e "프로덕션 환경변수 설정 스크립트"
echo -e "시간: $(date)"
echo -e "========================================${NC}"

# 프로젝트 디렉토리 확인
if [ ! -d "$PROJECT_DIR" ]; then
    echo -e "${RED}❌ 프로젝트 디렉토리가 없습니다: $PROJECT_DIR${NC}"
    echo -e "${YELLOW}📁 디렉토리를 생성하시겠습니까? (y/n)${NC}"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        mkdir -p "$PROJECT_DIR"
        echo -e "${GREEN}✅ 디렉토리 생성됨: $PROJECT_DIR${NC}"
    else
        echo -e "${RED}❌ 스크립트를 종료합니다${NC}"
        exit 1
    fi
fi

cd "$PROJECT_DIR"

# 보안 키 생성 함수
generate_secret() {
    openssl rand -hex 32
}

generate_jwt_secret() {
    openssl rand -hex 64
}

echo -e "\n${YELLOW}🔐 보안 키 생성 중...${NC}"

# JWT 시크릿 생성
JWT_SECRET=$(generate_jwt_secret)
JWT_REFRESH_SECRET=$(generate_jwt_secret)
SESSION_SECRET=$(generate_secret)
COOKIE_SECRET=$(generate_secret)

echo -e "${GREEN}✅ 보안 키 생성 완료${NC}"

echo -e "\n${YELLOW}🌐 도메인 및 CORS 설정${NC}"
DOMAIN="xn--220bu63c.com"
API_URL="https://$DOMAIN"
CORS_ORIGINS="https://$DOMAIN,https://내책.com"

echo -e "도메인: $DOMAIN"
echo -e "API URL: $API_URL"
echo -e "CORS Origins: $CORS_ORIGINS"

echo -e "\n${YELLOW}🗄️ 데이터베이스 설정${NC}"
echo -e "데이터베이스 비밀번호를 입력하세요 (기본값: digitalbook2024): "
read -s -r DB_PASSWORD
DB_PASSWORD=${DB_PASSWORD:-digitalbook2024}
echo -e "비밀번호 설정됨"

# PostgreSQL URL 설정
if docker ps | grep -q "digitalbook-postgres"; then
    # Docker 컨테이너 사용 시 내부 네트워크 주소
    DATABASE_URL="postgresql://postgres:$DB_PASSWORD@postgres:5432/digitalbook"
else
    # 로컬 PostgreSQL 사용 시
    DATABASE_URL="postgresql://postgres:$DB_PASSWORD@localhost:5432/digitalbook"
fi

echo -e "\n${YELLOW}📦 Redis 설정${NC}"
if docker ps | grep -q "digitalbook-redis"; then
    REDIS_URL="redis://redis:6379"
else
    REDIS_URL="redis://localhost:6379"
fi

echo -e "\n${YELLOW}🤖 AI 서비스 설정${NC}"
echo -e "OpenAI API 키를 입력하세요 (선택사항, Enter로 건너뛰기): "
read -s -r OPENAI_API_KEY
if [ -n "$OPENAI_API_KEY" ]; then
    echo -e "OpenAI API 키 설정됨"
else
    echo -e "OpenAI API 키 건너뜀 (mock 모드로 실행됨)"
fi

echo -e "\n${YELLOW}🔧 기타 설정${NC}"
NODE_ENV="production"
PORT="4000"
FRONTEND_PORT="3000"

# .env.production 파일 생성
echo -e "\n${YELLOW}📝 환경변수 파일 생성 중...${NC}"

# 기존 .env.production 파일 백업
if [ -f "$ENV_FILE" ]; then
    BACKUP_FILE="$ENV_FILE.backup.$(date +%Y%m%d_%H%M%S)"
    cp "$ENV_FILE" "$BACKUP_FILE"
    echo -e "${YELLOW}⚠️  기존 파일을 백업했습니다: $BACKUP_FILE${NC}"
fi

cat > "$ENV_FILE" << EOF
# ==========================================================
# 프로덕션 환경변수 설정
# 생성일: $(date)
# ==========================================================

# 실행 환경
NODE_ENV=$NODE_ENV
PORT=$PORT
FRONTEND_PORT=$FRONTEND_PORT

# 보안 키 (자동 생성됨 - 절대 공유하지 마세요!)
JWT_SECRET=$JWT_SECRET
JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET
SESSION_SECRET=$SESSION_SECRET
COOKIE_SECRET=$COOKIE_SECRET

# 데이터베이스
DATABASE_URL=$DATABASE_URL

# Redis
REDIS_URL=$REDIS_URL

# 도메인 및 CORS
CORS_ORIGIN=$CORS_ORIGINS
NEXT_PUBLIC_API_URL=$API_URL/api
NEXT_PUBLIC_DOMAIN=$DOMAIN

# 쿠키 설정
COOKIE_DOMAIN=.$DOMAIN
COOKIE_SECURE=true
COOKIE_SAMESITE=strict

# AI 서비스
OPENAI_API_KEY=$OPENAI_API_KEY

# 로그 설정
LOG_LEVEL=info
LOG_TO_FILE=true

# 업로드 설정
MAX_FILE_SIZE=100MB
UPLOAD_PATH=/app/uploads

# 보안 설정
BCRYPT_ROUNDS=12
MAX_LOGIN_ATTEMPTS=5
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# SSL/TLS 설정
HTTPS_ONLY=true
SECURE_HEADERS=true

EOF

echo -e "${GREEN}✅ 환경변수 파일 생성됨: $ENV_FILE${NC}"

# 파일 권한 설정 (보안 강화)
chmod 600 "$ENV_FILE"
echo -e "${GREEN}✅ 파일 권한 설정됨 (소유자만 읽기/쓰기 가능)${NC}"

# .gitignore에 추가 (이미 있는지 확인)
if [ -f ".gitignore" ]; then
    if ! grep -q ".env.production" .gitignore; then
        echo ".env.production" >> .gitignore
        echo -e "${GREEN}✅ .gitignore에 .env.production 추가됨${NC}"
    else
        echo -e "${BLUE}ℹ️  .gitignore에 이미 .env.production이 포함됨${NC}"
    fi
else
    echo ".env.production" > .gitignore
    echo -e "${GREEN}✅ .gitignore 파일 생성됨${NC}"
fi

echo -e "\n${YELLOW}🧪 환경변수 검증 중...${NC}"

# 환경변수 로드 테스트
if source "$ENV_FILE" 2>/dev/null; then
    echo -e "${GREEN}✅ 환경변수 파일 로드 성공${NC}"
    
    # 필수 변수 확인
    MISSING_VARS=()
    
    [ -z "$JWT_SECRET" ] && MISSING_VARS+=("JWT_SECRET")
    [ -z "$DATABASE_URL" ] && MISSING_VARS+=("DATABASE_URL")
    [ -z "$REDIS_URL" ] && MISSING_VARS+=("REDIS_URL")
    
    if [ ${#MISSING_VARS[@]} -eq 0 ]; then
        echo -e "${GREEN}✅ 모든 필수 환경변수 설정됨${NC}"
    else
        echo -e "${RED}❌ 누락된 필수 환경변수: ${MISSING_VARS[*]}${NC}"
    fi
else
    echo -e "${RED}❌ 환경변수 파일 로드 실패${NC}"
fi

echo -e "\n${YELLOW}🐳 Docker Compose 설정 업데이트${NC}"

# docker-compose.prod.yml 파일에서 환경변수 사용하도록 수정
if [ -f "docker-compose.prod.yml" ]; then
    echo -e "${BLUE}ℹ️  docker-compose.prod.yml 파일이 존재합니다${NC}"
    echo -e "${YELLOW}⚠️  하드코딩된 환경변수를 외부 파일로 변경하시겠습니까? (y/n)${NC}"
    read -r response
    
    if [[ "$response" =~ ^[Yy]$ ]]; then
        # 백업 생성
        cp docker-compose.prod.yml "docker-compose.prod.yml.backup.$(date +%Y%m%d_%H%M%S)"
        
        # docker-compose.prod.yml 업데이트 (기본적인 수정만)
        echo -e "${YELLOW}📝 docker-compose.prod.yml을 수동으로 수정해주세요:${NC}"
        echo -e "1. backend 서비스에 env_file: [.env.production] 추가"
        echo -e "2. 하드코딩된 JWT_SECRET, JWT_REFRESH_SECRET 제거"
        echo -e "3. DATABASE_URL, REDIS_URL을 환경변수로 변경"
    fi
else
    echo -e "${RED}❌ docker-compose.prod.yml 파일이 없습니다${NC}"
fi

echo -e "\n${GREEN}=========================================="
echo -e "🎉 프로덕션 환경 설정 완료!"
echo -e "========================================${NC}"

echo -e "${BLUE}📋 설정된 내용:${NC}"
echo -e "• 환경변수 파일: $ENV_FILE"
echo -e "• JWT 시크릿: 자동 생성됨 (64자)"
echo -e "• 데이터베이스: $DATABASE_URL"
echo -e "• Redis: $REDIS_URL"
echo -e "• 도메인: $DOMAIN"
echo -e "• CORS Origin: $CORS_ORIGINS"

echo -e "\n${YELLOW}🔧 다음 단계:${NC}"
echo -e "1. docker-compose.prod.yml 파일에 env_file 설정 추가"
echo -e "2. Docker 컨테이너 재시작: docker-compose -f docker-compose.prod.yml up -d"
echo -e "3. API 테스트: curl https://$DOMAIN/api/health"
echo -e "4. 로그인 테스트 실행"

echo -e "\n${RED}🔐 보안 주의사항:${NC}"
echo -e "• .env.production 파일을 절대 Git에 커밋하지 마세요"
echo -e "• 정기적으로 JWT 시크릿을 교체하세요"
echo -e "• 데이터베이스 비밀번호를 안전하게 보관하세요"

echo -e "\n${BLUE}📝 환경변수 파일 확인:${NC}"
echo -e "cat $ENV_FILE"

echo -e "\n${GREEN}설정 스크립트 완료! 🚀${NC}"