#!/bin/bash
# 빠른 Docker 기반 테스트 스크립트
# 서버에서 직접 실행 가능한 간단한 테스트들

echo "=========================================="
echo "Quick Docker-based Tests"
echo "Date: $(date)"
echo "=========================================="

# 색상 코드
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "\n${YELLOW}=== Docker Containers Status ===${NC}"

# 실행중인 컨테이너 확인
echo -e "${BLUE}Running containers:${NC}"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo -e "\n${BLUE}All containers (including stopped):${NC}"
docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo -e "\n${YELLOW}=== Database Tests ===${NC}"

# PostgreSQL 연결 테스트
echo -e "${BLUE}Testing PostgreSQL connection...${NC}"
if docker exec digitalbook-postgres-1 pg_isready -U postgres > /dev/null 2>&1; then
    echo -e "${GREEN}✓ PostgreSQL is ready${NC}"
    
    # 데이터베이스 목록
    echo -e "\n${BLUE}Available databases:${NC}"
    docker exec digitalbook-postgres-1 psql -U postgres -l
    
    # DigitalBook 데이터베이스의 테이블 목록
    echo -e "\n${BLUE}Tables in digitalbook database:${NC}"
    docker exec digitalbook-postgres-1 psql -U postgres -d digitalbook -c "\dt"
    
    # 사용자 테이블 샘플 조회
    echo -e "\n${BLUE}Sample users (first 3):${NC}"
    docker exec digitalbook-postgres-1 psql -U postgres -d digitalbook -c "SELECT id, email, name, role, created_at FROM users LIMIT 3;"
    
else
    echo -e "${RED}✗ PostgreSQL is not responding${NC}"
fi

echo -e "\n${YELLOW}=== Redis Tests ===${NC}"

# Redis 연결 테스트
echo -e "${BLUE}Testing Redis connection...${NC}"
if docker exec digitalbook-redis-1 redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Redis is responding${NC}"
    
    # Redis 정보
    echo -e "\n${BLUE}Redis info:${NC}"
    docker exec digitalbook-redis-1 redis-cli info server | grep -E "(redis_version|uptime_in_seconds)"
    
    # Redis 메모리 사용량
    echo -e "\n${BLUE}Redis memory usage:${NC}"
    docker exec digitalbook-redis-1 redis-cli info memory | grep -E "(used_memory_human|used_memory_peak_human)"
    
    # Redis 키 개수
    echo -e "\n${BLUE}Redis keys:${NC}"
    KEY_COUNT=$(docker exec digitalbook-redis-1 redis-cli dbsize)
    echo "Total keys: $KEY_COUNT"
    
    if [ $KEY_COUNT -gt 0 ]; then
        echo "Sample keys:"
        docker exec digitalbook-redis-1 redis-cli keys "*" | head -5
    fi
    
else
    echo -e "${RED}✗ Redis is not responding${NC}"
fi

echo -e "\n${YELLOW}=== Direct API Tests (Docker Network) ===${NC}"

# Docker 네트워크 확인
echo -e "${BLUE}Docker networks:${NC}"
docker network ls

# 백엔드 컨테이너가 있다면 직접 테스트
if docker ps --format "{{.Names}}" | grep -q "backend"; then
    echo -e "\n${BLUE}Testing backend container directly...${NC}"
    docker exec backend curl -s http://localhost:4000/api/health || echo "Backend container direct test failed"
fi

echo -e "\n${YELLOW}=== Container Logs (Last 10 lines) ===${NC}"

# PostgreSQL 로그
echo -e "${BLUE}PostgreSQL logs:${NC}"
docker logs --tail=10 digitalbook-postgres-1

# Redis 로그
echo -e "\n${BLUE}Redis logs:${NC}"
docker logs --tail=10 digitalbook-redis-1

echo -e "\n${YELLOW}=== Container Resource Usage ===${NC}"

# 컨테이너 리소스 사용량
echo -e "${BLUE}Container resource usage:${NC}"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.NetIO}}"

echo -e "\n${YELLOW}=== Network Connectivity Tests ===${NC}"

# 컨테이너간 네트워크 연결 테스트
echo -e "${BLUE}Testing inter-container connectivity...${NC}"

# PostgreSQL에서 Redis 접근 테스트 (가능한 경우)
if docker exec digitalbook-postgres-1 which nc > /dev/null 2>&1; then
    if docker exec digitalbook-postgres-1 nc -z digitalbook-redis-1 6379; then
        echo -e "${GREEN}✓ PostgreSQL -> Redis connection works${NC}"
    else
        echo -e "${RED}✗ PostgreSQL -> Redis connection failed${NC}"
    fi
else
    echo -e "${YELLOW}! netcat not available in PostgreSQL container${NC}"
fi

echo -e "\n${YELLOW}=== Quick Database Query Tests ===${NC}"

# 간단한 데이터베이스 쿼리 테스트
echo -e "${BLUE}Testing database queries...${NC}"

# 테이블 존재 확인
TABLES_EXIST=$(docker exec digitalbook-postgres-1 psql -U postgres -d digitalbook -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name IN ('users', 'sessions', 'textbooks');" | grep -o '[0-9]\+' | head -1)

echo "Critical tables found: $TABLES_EXIST/3"

if [ "$TABLES_EXIST" -eq 3 ]; then
    echo -e "${GREEN}✓ All critical tables exist${NC}"
    
    # 각 테이블의 레코드 수 확인
    echo -e "\n${BLUE}Record counts:${NC}"
    USER_COUNT=$(docker exec digitalbook-postgres-1 psql -U postgres -d digitalbook -c "SELECT COUNT(*) FROM users;" | grep -o '[0-9]\+' | head -1)
    SESSION_COUNT=$(docker exec digitalbook-postgres-1 psql -U postgres -d digitalbook -c "SELECT COUNT(*) FROM sessions;" | grep -o '[0-9]\+' | head -1)
    TEXTBOOK_COUNT=$(docker exec digitalbook-postgres-1 psql -U postgres -d digitalbook -c "SELECT COUNT(*) FROM textbooks;" | grep -o '[0-9]\+' | head -1)
    
    echo "Users: $USER_COUNT"
    echo "Sessions: $SESSION_COUNT"
    echo "Textbooks: $TEXTBOOK_COUNT"
    
else
    echo -e "${RED}✗ Missing critical tables${NC}"
    echo "Available tables:"
    docker exec digitalbook-postgres-1 psql -U postgres -d digitalbook -c "\dt"
fi

echo -e "\n${YELLOW}=== Environment Variables in Containers ===${NC}"

# PostgreSQL 환경변수
echo -e "${BLUE}PostgreSQL environment:${NC}"
docker exec digitalbook-postgres-1 env | grep -E "(POSTGRES_|PGDATA)" | head -5

# Redis 환경변수 (있는 경우)
echo -e "\n${BLUE}Redis environment:${NC}"
docker exec digitalbook-redis-1 env | grep -i redis | head -3

echo -e "\n=========================================="
echo "Quick Docker tests completed"
echo "Use the debug-login-500.sh script for detailed error analysis"
echo "=========================================="