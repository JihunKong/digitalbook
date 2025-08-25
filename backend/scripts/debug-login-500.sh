#!/bin/bash
# 로그인 500 에러 디버깅 전용 스크립트
# Usage: ssh -i Korean-Text-Book.pem ubuntu@3.37.168.225 'bash -s' < debug-login-500.sh

echo "=========================================="
echo "Login 500 Error Debugging Script"
echo "Date: $(date)"
echo "=========================================="

# 색상 코드
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "\n${YELLOW}=== 1. Environment Variables Check ===${NC}"

# 필수 환경 변수 확인
echo "Checking critical environment variables..."

# JWT 시크릿 확인 (값은 숨김)
if [ -n "$JWT_SECRET" ]; then
    echo -e "${GREEN}✓${NC} JWT_SECRET is set (length: ${#JWT_SECRET})"
else
    echo -e "${RED}✗${NC} JWT_SECRET is not set"
fi

if [ -n "$JWT_REFRESH_SECRET" ]; then
    echo -e "${GREEN}✓${NC} JWT_REFRESH_SECRET is set (length: ${#JWT_REFRESH_SECRET})"
else
    echo -e "${RED}✗${NC} JWT_REFRESH_SECRET is not set"
fi

# 데이터베이스 URL 확인
if [ -n "$DATABASE_URL" ]; then
    echo -e "${GREEN}✓${NC} DATABASE_URL is set"
    # URL에서 호스트 추출 (비밀번호는 숨김)
    DB_HOST=$(echo "$DATABASE_URL" | sed 's/.*@\([^:]*\):.*/\1/')
    echo "  Database host: $DB_HOST"
else
    echo -e "${RED}✗${NC} DATABASE_URL is not set"
fi

# Redis URL 확인
if [ -n "$REDIS_URL" ]; then
    echo -e "${GREEN}✓${NC} REDIS_URL is set: $REDIS_URL"
else
    echo -e "${YELLOW}!${NC} REDIS_URL is not set (will use default)"
fi

# NODE_ENV 확인
echo "NODE_ENV: ${NODE_ENV:-not set}"

echo -e "\n${YELLOW}=== 2. Database Connection Test ===${NC}"

# PostgreSQL 연결 직접 테스트
echo "Testing PostgreSQL connection..."

# Docker 컨테이너를 통한 연결 테스트
if docker exec digitalbook-postgres-1 pg_isready -U postgres > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} PostgreSQL is accepting connections"
    
    # 데이터베이스 존재 확인
    DB_EXISTS=$(docker exec digitalbook-postgres-1 psql -U postgres -lqt | cut -d \| -f 1 | grep -w digitalbook | wc -l)
    if [ $DB_EXISTS -gt 0 ]; then
        echo -e "${GREEN}✓${NC} DigitalBook database exists"
        
        # 주요 테이블 존재 확인
        TABLES=$(docker exec digitalbook-postgres-1 psql -U postgres -d digitalbook -c "\dt" 2>/dev/null | grep -E "(users|sessions)" | wc -l)
        if [ $TABLES -gt 0 ]; then
            echo -e "${GREEN}✓${NC} Required tables exist (found $TABLES key tables)"
        else
            echo -e "${RED}✗${NC} Required tables missing"
        fi
    else
        echo -e "${RED}✗${NC} DigitalBook database does not exist"
    fi
else
    echo -e "${RED}✗${NC} Cannot connect to PostgreSQL"
fi

echo -e "\n${YELLOW}=== 3. Redis Connection Test ===${NC}"

# Redis 연결 테스트
if docker exec digitalbook-redis-1 redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Redis is responding"
    
    # Redis 메모리 정보
    REDIS_INFO=$(docker exec digitalbook-redis-1 redis-cli info memory | grep used_memory_human)
    echo "  $REDIS_INFO"
    
    # Redis 키 개수
    KEY_COUNT=$(docker exec digitalbook-redis-1 redis-cli dbsize)
    echo "  Keys in database: $KEY_COUNT"
else
    echo -e "${RED}✗${NC} Redis is not responding"
fi

echo -e "\n${YELLOW}=== 4. Backend Service Status ===${NC}"

# PM2 상태 확인
echo "Checking PM2 backend process..."
pm2 status backend

# PM2 로그 확인 (최근 50줄)
echo -e "\n${BLUE}Recent backend logs (last 50 lines):${NC}"
tail -50 ~/.pm2/logs/backend-out.log

echo -e "\n${BLUE}Recent backend errors (last 20 lines):${NC}"
tail -20 ~/.pm2/logs/backend-error.log

echo -e "\n${YELLOW}=== 5. Manual Login Test with Detailed Logging ===${NC}"

# 수동 로그인 테스트 - 각 단계별로 확인
echo "Testing login API with curl..."

# 교사 계정으로 로그인 시도
TEACHER_EMAIL="${TEACHER_TEST_EMAIL:-teacher@test.com}"
TEACHER_PASSWORD="${TEACHER_TEST_PASSWORD:-testpass123}"

echo "Using test credentials: $TEACHER_EMAIL"

# 상세한 curl 요청
echo -e "\n${BLUE}Sending login request...${NC}"
RESPONSE=$(curl -v -s -w "\nHTTP_STATUS:%{http_code}\nTOTAL_TIME:%{time_total}\nCONNECT_TIME:%{time_connect}\n" \
    -X POST "https://xn--220bu63c.com/api/auth/login" \
    -H "Content-Type: application/json" \
    -H "User-Agent: DebugScript/1.0" \
    -H "Accept: application/json" \
    -d "{\"email\":\"$TEACHER_EMAIL\",\"password\":\"$TEACHER_PASSWORD\"}" \
    2>&1)

echo "Full curl response:"
echo "$RESPONSE"

# HTTP 상태 코드 추출
HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
echo -e "\n${BLUE}HTTP Status Code: $HTTP_STATUS${NC}"

if [ "$HTTP_STATUS" = "500" ]; then
    echo -e "${RED}500 Internal Server Error detected!${NC}"
    
    # 백엔드 로그에서 최근 에러 찾기
    echo -e "\n${BLUE}Checking for recent errors in backend logs...${NC}"
    tail -100 ~/.pm2/logs/backend-error.log | grep -A5 -B5 "$(date +'%Y-%m-%d')"
    
    # 실시간 로그 모니터링 (5초간)
    echo -e "\n${BLUE}Monitoring logs for 5 seconds...${NC}"
    timeout 5 tail -f ~/.pm2/logs/backend-out.log ~/.pm2/logs/backend-error.log &
    
    # 다시 한번 로그인 시도
    sleep 1
    curl -s -X POST "https://xn--220bu63c.com/api/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$TEACHER_EMAIL\",\"password\":\"$TEACHER_PASSWORD\"}" > /dev/null
    
    sleep 4
    
elif [ "$HTTP_STATUS" = "401" ]; then
    echo -e "${YELLOW}Authentication failed - checking if user exists${NC}"
    
    # 데이터베이스에서 사용자 확인
    echo "Checking if user exists in database..."
    USER_EXISTS=$(docker exec digitalbook-postgres-1 psql -U postgres -d digitalbook \
        -c "SELECT email FROM users WHERE email = '$TEACHER_EMAIL';" | grep -c "$TEACHER_EMAIL")
    
    if [ $USER_EXISTS -gt 0 ]; then
        echo -e "${GREEN}✓${NC} User exists in database"
    else
        echo -e "${RED}✗${NC} User does not exist in database"
        echo "Available users:"
        docker exec digitalbook-postgres-1 psql -U postgres -d digitalbook \
            -c "SELECT email, role FROM users LIMIT 5;"
    fi
    
elif [ "$HTTP_STATUS" = "200" ]; then
    echo -e "${GREEN}✓${NC} Login successful!"
else
    echo -e "${YELLOW}Unexpected status code: $HTTP_STATUS${NC}"
fi

echo -e "\n${YELLOW}=== 6. Backend Health Check ===${NC}"

# 백엔드 직접 연결 테스트
echo "Testing direct backend connection..."
BACKEND_HEALTH=$(curl -s -w "%{http_code}" "http://localhost:4000/api/health" 2>/dev/null)
echo "Direct backend response: $BACKEND_HEALTH"

# 백엔드 프로세스 확인
echo -e "\n${BLUE}Backend process information:${NC}"
ps aux | grep node | grep -v grep

echo -e "\n${YELLOW}=== 7. System Resources ===${NC}"

# 메모리 사용량
echo "Memory usage:"
free -h

# 디스크 사용량
echo -e "\nDisk usage:"
df -h

# 시스템 로드
echo -e "\nSystem load:"
uptime

echo -e "\n${YELLOW}=== 8. Nginx Configuration Check ===${NC}"

# Nginx 설정 테스트
echo "Testing Nginx configuration..."
nginx -t 2>&1

# Nginx 에러 로그 확인
echo -e "\n${BLUE}Recent Nginx errors:${NC}"
tail -20 /var/log/nginx/error.log

echo -e "\n=========================================="
echo "Debugging script completed"
echo "Check the output above for potential issues"
echo "=========================================="