#!/bin/bash
# 서버에서 모든 테스트를 실행하는 마스터 스크립트
# 로컬에서 실행하여 서버의 모든 테스트를 순차적으로 수행

SERVER_USER="ubuntu"
SERVER_HOST="3.37.168.225"
KEY_FILE="Korean-Text-Book.pem"

echo "=========================================="
echo "Digital Book Server Test Suite Runner"
echo "Server: $SERVER_HOST"
echo "Date: $(date)"
echo "=========================================="

# 색상 코드
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 서버 연결 테스트
echo -e "\n${BLUE}Testing SSH connection to server...${NC}"
if ssh -i "$KEY_FILE" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_HOST" 'echo "SSH connection successful"'; then
    echo -e "${GREEN}✓ SSH connection established${NC}"
else
    echo -e "${RED}✗ Cannot connect to server${NC}"
    exit 1
fi

# 테스트 스크립트들을 서버로 업로드
echo -e "\n${BLUE}Uploading test scripts to server...${NC}"

# 서버에 scripts 디렉토리 생성
ssh -i "$KEY_FILE" "$SERVER_USER@$SERVER_HOST" 'mkdir -p ~/test-scripts'

# 테스트 스크립트들 업로드
scp -i "$KEY_FILE" backend/scripts/test-environment.sh "$SERVER_USER@$SERVER_HOST:~/test-scripts/"
scp -i "$KEY_FILE" backend/scripts/test-api-endpoints.sh "$SERVER_USER@$SERVER_HOST:~/test-scripts/"
scp -i "$KEY_FILE" backend/scripts/debug-login-500.sh "$SERVER_USER@$SERVER_HOST:~/test-scripts/"
scp -i "$KEY_FILE" backend/scripts/quick-docker-tests.sh "$SERVER_USER@$SERVER_HOST:~/test-scripts/"
scp -i "$KEY_FILE" backend/scripts/test-ssl-and-nginx.sh "$SERVER_USER@$SERVER_HOST:~/test-scripts/"

echo -e "${GREEN}✓ Test scripts uploaded${NC}"

# 스크립트 실행 권한 부여
ssh -i "$KEY_FILE" "$SERVER_USER@$SERVER_HOST" 'chmod +x ~/test-scripts/*.sh'

# 함수: 테스트 실행 및 결과 기록
run_test() {
    local test_name=$1
    local script_path=$2
    local description=$3
    
    echo -e "\n${YELLOW}======================================${NC}"
    echo -e "${YELLOW}Running: $test_name${NC}"
    echo -e "${YELLOW}Description: $description${NC}"
    echo -e "${YELLOW}======================================${NC}"
    
    # 테스트 시작 시간 기록
    START_TIME=$(date +%s)
    
    # 서버에서 테스트 실행
    if ssh -i "$KEY_FILE" "$SERVER_USER@$SERVER_HOST" "cd ~ && bash $script_path"; then
        END_TIME=$(date +%s)
        DURATION=$((END_TIME - START_TIME))
        echo -e "\n${GREEN}✓ $test_name completed successfully (${DURATION}s)${NC}"
        return 0
    else
        END_TIME=$(date +%s)
        DURATION=$((END_TIME - START_TIME))
        echo -e "\n${RED}✗ $test_name failed (${DURATION}s)${NC}"
        return 1
    fi
}

# 테스트 결과 추적
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# 1. 환경 테스트
((TOTAL_TESTS++))
if run_test "Environment Test" "test-scripts/test-environment.sh" "Basic environment and service health check"; then
    ((PASSED_TESTS++))
else
    ((FAILED_TESTS++))
fi

# 2. Docker 테스트
((TOTAL_TESTS++))
if run_test "Quick Docker Tests" "test-scripts/quick-docker-tests.sh" "Database and Redis connectivity tests"; then
    ((PASSED_TESTS++))
else
    ((FAILED_TESTS++))
fi

# 3. SSL/Nginx 테스트
((TOTAL_TESTS++))
if run_test "SSL & Nginx Tests" "test-scripts/test-ssl-and-nginx.sh" "SSL certificate and web server configuration"; then
    ((PASSED_TESTS++))
else
    ((FAILED_TESTS++))
fi

# 4. API 엔드포인트 테스트
((TOTAL_TESTS++))
if run_test "API Endpoint Tests" "test-scripts/test-api-endpoints.sh" "Comprehensive API functionality testing"; then
    ((PASSED_TESTS++))
else
    ((FAILED_TESTS++))
fi

# 5. 로그인 500 에러 디버깅 (실패한 테스트가 있을 경우에만)
if [ $FAILED_TESTS -gt 0 ]; then
    echo -e "\n${YELLOW}Some tests failed. Running detailed debugging...${NC}"
    ((TOTAL_TESTS++))
    if run_test "Login 500 Error Debug" "test-scripts/debug-login-500.sh" "Detailed debugging for login issues"; then
        ((PASSED_TESTS++))
    else
        ((FAILED_TESTS++))
    fi
fi

# 서버에서 종합 시스템 정보 수집
echo -e "\n${YELLOW}======================================${NC}"
echo -e "${YELLOW}Collecting System Information${NC}"
echo -e "${YELLOW}======================================${NC}"

ssh -i "$KEY_FILE" "$SERVER_USER@$SERVER_HOST" << 'EOF'
echo "=== System Information ==="
uname -a
echo ""
echo "=== Memory Usage ==="
free -h
echo ""
echo "=== Disk Usage ==="
df -h
echo ""
echo "=== Running Processes ==="
ps aux | grep -E "(node|nginx|postgres|redis|pm2)" | grep -v grep
echo ""
echo "=== Open Ports ==="
netstat -tuln | grep -E ":80 |:443 |:3000 |:4000 |:5432 |:6379 "
echo ""
echo "=== Docker Containers ==="
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""
echo "=== Recent System Load ==="
uptime
echo ""
echo "=== Environment Variables (Non-sensitive) ==="
env | grep -E "NODE_ENV|DATABASE_URL" | sed 's/=.*@.*$/=***HIDDEN***/'
EOF

# 로그 파일 다운로드 (최근 100줄만)
echo -e "\n${BLUE}Downloading recent logs for local analysis...${NC}"
mkdir -p logs
ssh -i "$KEY_FILE" "$SERVER_USER@$SERVER_HOST" 'tail -100 ~/.pm2/logs/backend-out.log' > logs/backend-out.log 2>/dev/null
ssh -i "$KEY_FILE" "$SERVER_USER@$SERVER_HOST" 'tail -100 ~/.pm2/logs/backend-error.log' > logs/backend-error.log 2>/dev/null
ssh -i "$KEY_FILE" "$SERVER_USER@$SERVER_HOST" 'sudo tail -100 /var/log/nginx/error.log' > logs/nginx-error.log 2>/dev/null
ssh -i "$KEY_FILE" "$SERVER_USER@$SERVER_HOST" 'sudo tail -100 /var/log/nginx/access.log' > logs/nginx-access.log 2>/dev/null

echo -e "${GREEN}✓ Logs downloaded to ./logs/ directory${NC}"

# 임시 파일 정리
echo -e "\n${BLUE}Cleaning up temporary files on server...${NC}"
ssh -i "$KEY_FILE" "$SERVER_USER@$SERVER_HOST" 'rm -rf ~/test-scripts'

# 최종 결과 리포트
echo -e "\n${YELLOW}=========================================="
echo -e "FINAL TEST RESULTS"
echo -e "==========================================${NC}"

echo -e "Total Tests Run: $TOTAL_TESTS"
echo -e "${GREEN}Tests Passed: $PASSED_TESTS${NC}"
echo -e "${RED}Tests Failed: $FAILED_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "\n${GREEN}🎉 ALL TESTS PASSED! 🎉${NC}"
    echo -e "${GREEN}Your server appears to be healthy and functioning correctly.${NC}"
    exit 0
else
    echo -e "\n${RED}⚠️  SOME TESTS FAILED ⚠️${NC}"
    echo -e "${RED}Please review the test output above and check the logs in ./logs/ directory.${NC}"
    
    # 일반적인 문제해결 가이드 출력
    echo -e "\n${BLUE}Common Issues and Solutions:${NC}"
    echo "1. 500 Error on Login:"
    echo "   - Check backend logs: tail -f ~/.pm2/logs/backend-error.log"
    echo "   - Verify environment variables: JWT_SECRET, DATABASE_URL"
    echo "   - Restart backend: pm2 restart backend"
    
    echo -e "\n2. Database Connection Issues:"
    echo "   - Check PostgreSQL status: docker ps | grep postgres"
    echo "   - Restart database: docker-compose restart postgres"
    echo "   - Check database URL in environment"
    
    echo -e "\n3. SSL/HTTPS Issues:"
    echo "   - Check certificate expiry: openssl x509 -in /etc/letsencrypt/live/xn--220bu63c.com/fullchain.pem -noout -dates"
    echo "   - Renew certificate: certbot renew"
    echo "   - Restart nginx: sudo systemctl restart nginx"
    
    echo -e "\n4. Memory Issues:"
    echo "   - Check memory usage: free -h"
    echo "   - Restart services if memory is low"
    echo "   - Consider upgrading server if consistently high memory usage"
    
    exit 1
fi