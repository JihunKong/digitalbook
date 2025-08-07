#!/bin/bash

# 색상 코드
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   디지털교과서 완전 배포 스크립트${NC}"
echo -e "${GREEN}========================================${NC}"

# 변수 설정
SERVER_IP="3.37.168.225"
KEY_FILE="/Users/jihunkong/DigitalBook/korean-digital-book.pem"
BUILD_DIR="/Users/jihunkong/DigitalBook"
REMOTE_USER="ubuntu"

# 1. 프론트엔드 빌드 패키지 생성
echo -e "\n${YELLOW}1. 프론트엔드 빌드 패키지 생성 중...${NC}"
cd "$BUILD_DIR"

# 기존 패키지 제거
rm -f digitalbook-frontend.tar.gz

# 새 패키지 생성 (필요한 파일들만 포함)
tar -czf digitalbook-frontend.tar.gz \
    .next \
    public \
    package.json \
    package-lock.json \
    next.config.js \
    .env.local \
    app \
    src \
    lib \
    styles \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='*.log'

echo -e "${GREEN}✓ 프론트엔드 패키지 생성 완료${NC}"

# 2. 백엔드 빌드 패키지 생성
echo -e "\n${YELLOW}2. 백엔드 빌드 패키지 생성 중...${NC}"
cd "$BUILD_DIR/backend"

# 기존 패키지 제거
rm -f ../digitalbook-backend.tar.gz

# 새 패키지 생성
tar -czf ../digitalbook-backend.tar.gz \
    src \
    prisma \
    package.json \
    package-lock.json \
    tsconfig.json \
    .env.production \
    --exclude='node_modules' \
    --exclude='dist' \
    --exclude='*.log'

cd "$BUILD_DIR"
echo -e "${GREEN}✓ 백엔드 패키지 생성 완료${NC}"

# 3. 서버로 파일 전송
echo -e "\n${YELLOW}3. 서버로 파일 전송 중...${NC}"

# 프론트엔드 전송
scp -i "$KEY_FILE" digitalbook-frontend.tar.gz "$REMOTE_USER@$SERVER_IP:/tmp/"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ 프론트엔드 패키지 전송 완료${NC}"
else
    echo -e "${RED}✗ 프론트엔드 패키지 전송 실패${NC}"
    exit 1
fi

# 백엔드 전송
scp -i "$KEY_FILE" digitalbook-backend.tar.gz "$REMOTE_USER@$SERVER_IP:/tmp/"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ 백엔드 패키지 전송 완료${NC}"
else
    echo -e "${RED}✗ 백엔드 패키지 전송 실패${NC}"
    exit 1
fi

# 4. 서버에서 배포 실행
echo -e "\n${YELLOW}4. 서버에서 배포 실행 중...${NC}"

ssh -i "$KEY_FILE" "$REMOTE_USER@$SERVER_IP" << 'ENDSSH'
    # 색상 코드
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    NC='\033[0m'

    echo -e "${YELLOW}서버 배포 시작...${NC}"

    # 프론트엔드 배포
    echo -e "\n${YELLOW}프론트엔드 배포 중...${NC}"
    cd /home/ubuntu/digitalbook
    
    # 백업 생성
    if [ -d ".next" ]; then
        cp -r .next .next.backup
        echo -e "${GREEN}✓ 기존 빌드 백업 완료${NC}"
    fi
    
    # 새 빌드 적용
    tar -xzf /tmp/digitalbook-frontend.tar.gz
    
    # 프로덕션 의존성 설치
    npm install --production --legacy-peer-deps
    
    # 환경 변수 설정
    export NODE_ENV=production
    export NEXT_PUBLIC_API_URL=https://xn--220bu63c.com/api
    export NEXT_PUBLIC_SOCKET_URL=https://xn--220bu63c.com
    export DEMO_MODE=false
    
    # 서비스 재시작
    sudo systemctl restart digitalbook
    sleep 3
    
    # 상태 확인
    if sudo systemctl is-active --quiet digitalbook; then
        echo -e "${GREEN}✓ 프론트엔드 서비스 시작 성공${NC}"
    else
        echo -e "${RED}✗ 프론트엔드 서비스 시작 실패${NC}"
        sudo journalctl -u digitalbook -n 20
    fi

    # 백엔드 배포
    echo -e "\n${YELLOW}백엔드 배포 중...${NC}"
    cd /home/ubuntu/digitalbook/backend
    
    # 새 코드 적용
    tar -xzf /tmp/digitalbook-backend.tar.gz
    
    # 의존성 설치
    npm install --production
    
    # Prisma 클라이언트 생성
    npx prisma generate
    
    # PM2로 백엔드 재시작
    pm2 restart backend || pm2 start src/index.unified.ts --name backend --interpreter tsx
    pm2 save
    
    # 상태 확인
    sleep 3
    pm2 list
    
    # Nginx 재시작
    echo -e "\n${YELLOW}Nginx 재시작 중...${NC}"
    sudo nginx -t && sudo systemctl reload nginx
    
    # 포트 확인
    echo -e "\n${YELLOW}서비스 포트 확인:${NC}"
    sudo ss -tlnp | grep -E ':80|:443|:3000|:4000'
    
    # 헬스 체크
    echo -e "\n${YELLOW}헬스 체크:${NC}"
    curl -s http://localhost:3000 > /dev/null && echo -e "${GREEN}✓ 프론트엔드 응답 정상${NC}" || echo -e "${RED}✗ 프론트엔드 응답 실패${NC}"
    curl -s http://localhost:4000/api/health && echo -e "\n${GREEN}✓ 백엔드 API 정상${NC}" || echo -e "\n${RED}✗ 백엔드 API 실패${NC}"
    
    # 정리
    rm -f /tmp/digitalbook-frontend.tar.gz /tmp/digitalbook-backend.tar.gz
    
    echo -e "\n${GREEN}========================================${NC}"
    echo -e "${GREEN}   배포 완료!${NC}"
    echo -e "${GREEN}   URL: https://xn--220bu63c.com${NC}"
    echo -e "${GREEN}========================================${NC}"
ENDSSH

# 5. 로컬 정리
echo -e "\n${YELLOW}5. 로컬 파일 정리 중...${NC}"
rm -f digitalbook-frontend.tar.gz digitalbook-backend.tar.gz

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}   전체 배포 프로세스 완료!${NC}"
echo -e "${GREEN}   웹사이트: https://xn--220bu63c.com${NC}"
echo -e "${GREEN}   (내책.com)${NC}"
echo -e "${GREEN}========================================${NC}"