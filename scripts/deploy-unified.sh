#!/bin/bash

# 통합 배포 스크립트 - 데모와 프로덕션 모두 지원
# Usage: ./deploy-unified.sh [--demo]

set -e

# 색상 코드
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 설정
SSH_KEY="/Users/jihunkong/DigitalBook/korean-digital-book.pem"
SERVER_IP="3.37.168.225"
SERVER_USER="ubuntu"
DEPLOY_DIR="/home/ubuntu/digitalbook"

# 데모 모드 플래그 확인
DEMO_MODE=false
if [[ "$1" == "--demo" ]]; then
    DEMO_MODE=true
    echo -e "${YELLOW}🎭 데모 모드로 배포합니다${NC}"
else
    echo -e "${GREEN}🚀 프로덕션 모드로 배포합니다${NC}"
fi

# 타임스탬프
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

echo -e "${BLUE}📦 1단계: 환경 설정 준비${NC}"
# 환경 변수 파일 백업
cp .env .env.backup.${TIMESTAMP}

# 데모 모드 설정
if [ "$DEMO_MODE" = true ]; then
    # .env 파일에서 DEMO_MODE 설정
    if grep -q "^DEMO_MODE=" .env; then
        sed -i.bak 's/^DEMO_MODE=.*/DEMO_MODE=true/' .env
    else
        echo "DEMO_MODE=true" >> .env
    fi
    echo -e "${YELLOW}  ✓ 데모 모드 활성화${NC}"
else
    # 프로덕션 모드 설정
    if grep -q "^DEMO_MODE=" .env; then
        sed -i.bak 's/^DEMO_MODE=.*/DEMO_MODE=false/' .env
    else
        echo "DEMO_MODE=false" >> .env
    fi
    echo -e "${GREEN}  ✓ 프로덕션 모드 설정${NC}"
fi

echo -e "${BLUE}📦 2단계: 프론트엔드 빌드${NC}"
# 기존 빌드 제거
rm -rf .next

# 의존성 설치
npm install --legacy-peer-deps

# 환경 변수 명시적 설정하여 빌드
if [ "$DEMO_MODE" = true ]; then
    NEXT_PUBLIC_DEMO_MODE=true \
    NEXT_PUBLIC_API_URL=https://xn--220bu63c.com/api \
    NEXT_PUBLIC_SOCKET_URL=https://xn--220bu63c.com \
    NODE_OPTIONS="--max-old-space-size=4096" npm run build
else
    NEXT_PUBLIC_DEMO_MODE=false \
    NEXT_PUBLIC_API_URL=https://xn--220bu63c.com/api \
    NEXT_PUBLIC_SOCKET_URL=https://xn--220bu63c.com \
    NODE_OPTIONS="--max-old-space-size=4096" npm run build
fi

echo -e "${GREEN}  ✓ 빌드 완료${NC}"

echo -e "${BLUE}📦 3단계: 백엔드 빌드${NC}"
cd backend
npm install --legacy-peer-deps
npm run build
cd ..
echo -e "${GREEN}  ✓ 백엔드 빌드 완료${NC}"

echo -e "${BLUE}📦 4단계: 배포 패키지 생성${NC}"
# 배포 파일 목록
DEPLOY_FILES=(
    ".next"
    "public"
    "package.json"
    "package-lock.json"
    "next.config.js"
    "app"
    "components" 
    "lib"
    "styles"
    "src"
    "backend/dist"
    "backend/package.json"
    "backend/package-lock.json"
    "backend/prisma"
    ".env"
)

# tar 생성
tar -czf digitalbook-deploy-${TIMESTAMP}.tar.gz "${DEPLOY_FILES[@]}" \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='*.log'

echo -e "${GREEN}  ✓ 배포 패키지 생성 완료${NC}"

echo -e "${BLUE}📦 5단계: 서버로 업로드${NC}"
scp -i "$SSH_KEY" digitalbook-deploy-${TIMESTAMP}.tar.gz ${SERVER_USER}@${SERVER_IP}:/tmp/
echo -e "${GREEN}  ✓ 업로드 완료${NC}"

echo -e "${BLUE}📦 6단계: 서버에서 배포 실행${NC}"
ssh -i "$SSH_KEY" ${SERVER_USER}@${SERVER_IP} << EOF
    set -e
    
    echo "📂 배포 디렉토리로 이동"
    cd ${DEPLOY_DIR}
    
    echo "🔄 기존 파일 백업"
    if [ -d ".next" ]; then
        mv .next .next.backup.${TIMESTAMP}
    fi
    if [ -d "backend/dist" ]; then
        mv backend/dist backend/dist.backup.${TIMESTAMP}
    fi
    
    echo "📦 새 파일 압축 해제"
    tar -xzf /tmp/digitalbook-deploy-${TIMESTAMP}.tar.gz
    
    echo "📚 의존성 설치"
    npm install --production --legacy-peer-deps
    cd backend
    npm install --production --legacy-peer-deps
    cd ..
    
    # 데모 모드일 경우 데모 데이터 시드
    if [ "$DEMO_MODE" = true ]; then
        echo "🌱 데모 데이터 시드"
        cd backend
        npx ts-node src/utils/seed.demo.ts
        cd ..
    fi
    
    echo "🔄 서비스 재시작"
    # PM2로 백엔드 재시작
    pm2 restart backend || pm2 start backend/dist/index.js --name backend
    
    # systemd로 프론트엔드 재시작
    sudo systemctl restart digitalbook
    
    # Nginx 재시작
    sudo systemctl reload nginx
    
    echo "🧹 임시 파일 정리"
    rm /tmp/digitalbook-deploy-${TIMESTAMP}.tar.gz
    
    echo "✅ 배포 완료!"
EOF

echo -e "${BLUE}📦 7단계: 배포 검증${NC}"
sleep 5

# 헬스 체크
echo "  🔍 API 헬스 체크..."
if curl -s https://xn--220bu63c.com/api/health | grep -q "healthy"; then
    echo -e "${GREEN}  ✓ API 정상 작동${NC}"
else
    echo -e "${RED}  ✗ API 응답 없음${NC}"
fi

# 데모 상태 체크
if [ "$DEMO_MODE" = true ]; then
    echo "  🔍 데모 모드 상태 체크..."
    if curl -s https://xn--220bu63c.com/api/demo/status | grep -q '"demoMode":true'; then
        echo -e "${GREEN}  ✓ 데모 모드 활성화 확인${NC}"
    else
        echo -e "${YELLOW}  ⚠ 데모 모드 상태 확인 필요${NC}"
    fi
fi

# 웹사이트 체크
echo "  🔍 웹사이트 접근 체크..."
if curl -s -o /dev/null -w "%{http_code}" https://xn--220bu63c.com | grep -q "200\|301\|302"; then
    echo -e "${GREEN}  ✓ 웹사이트 정상 접근${NC}"
else
    echo -e "${RED}  ✗ 웹사이트 접근 불가${NC}"
fi

echo -e "${BLUE}📦 8단계: 정리${NC}"
# 로컬 임시 파일 제거
rm digitalbook-deploy-${TIMESTAMP}.tar.gz

# 환경 변수 복원 (로컬)
mv .env.backup.${TIMESTAMP} .env.backup.latest

if [ "$DEMO_MODE" = true ]; then
    echo -e "${YELLOW}╔══════════════════════════════════════════════╗${NC}"
    echo -e "${YELLOW}║          🎭 데모 배포 완료!                   ║${NC}"
    echo -e "${YELLOW}╟──────────────────────────────────────────────╢${NC}"
    echo -e "${YELLOW}║  URL: https://xn--220bu63c.com               ║${NC}"
    echo -e "${YELLOW}║  데모 계정:                                  ║${NC}"
    echo -e "${YELLOW}║    교사: teacher1@demo.com / demo123!        ║${NC}"
    echo -e "${YELLOW}║    학생: student1@demo.com / demo123!        ║${NC}"
    echo -e "${YELLOW}║  데이터는 1시간마다 자동 리셋됩니다.         ║${NC}"
    echo -e "${YELLOW}╚══════════════════════════════════════════════╝${NC}"
else
    echo -e "${GREEN}╔══════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║        🚀 프로덕션 배포 완료!                 ║${NC}"
    echo -e "${GREEN}╟──────────────────────────────────────────────╢${NC}"
    echo -e "${GREEN}║  URL: https://xn--220bu63c.com               ║${NC}"
    echo -e "${GREEN}║  빌드 ID: $(cat .next/BUILD_ID)              ║${NC}"
    echo -e "${GREEN}║  시간: $(date)                               ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════╝${NC}"
fi