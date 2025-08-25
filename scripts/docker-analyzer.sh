#!/bin/bash

# ==========================================================
# Docker 컨테이너 상태 확인 및 로그 분석 도구
# ==========================================================

set -e

# 색상 설정
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# 로그 파일
LOG_FILE="/tmp/docker-analysis-$(date +%Y%m%d_%H%M%S).log"
PROJECT_DIR="/home/ubuntu/digitalbook"

echo -e "${BLUE}========================================"
echo -e "Docker 컨테이너 분석 도구"
echo -e "시간: $(date)"
echo -e "로그 파일: $LOG_FILE"
echo -e "========================================${NC}"

# 로그 기록 함수
log() {
    echo -e "$1" | tee -a "$LOG_FILE"
}

# 섹션 헤더
section_header() {
    echo -e "\n${PURPLE}========================================${NC}"
    echo -e "${PURPLE} $1${NC}"
    echo -e "${PURPLE}========================================${NC}"
    log "=== $1 ==="
}

# Docker 설치 확인
check_docker() {
    section_header "Docker 환경 확인"
    
    if ! command -v docker &> /dev/null; then
        log "${RED}❌ Docker가 설치되지 않았습니다${NC}"
        return 1
    fi
    
    log "${GREEN}✅ Docker 설치됨: $(docker --version)${NC}"
    
    # Docker 서비스 상태
    if systemctl is-active --quiet docker; then
        log "${GREEN}✅ Docker 서비스 실행 중${NC}"
    else
        log "${RED}❌ Docker 서비스가 실행되지 않습니다${NC}"
        return 1
    fi
    
    # Docker Compose 확인
    if command -v docker-compose &> /dev/null; then
        log "${GREEN}✅ Docker Compose 설치됨: $(docker-compose --version)${NC}"
    else
        log "${RED}❌ Docker Compose가 설치되지 않았습니다${NC}"
    fi
    
    # Docker 권한 확인
    if groups | grep -q docker; then
        log "${GREEN}✅ 현재 사용자가 docker 그룹에 속해있습니다${NC}"
    else
        log "${YELLOW}⚠️  현재 사용자가 docker 그룹에 속해있지 않습니다${NC}"
        log "sudo usermod -aG docker \$USER 명령어로 추가하세요"
    fi
}

# 컨테이너 상태 분석
analyze_containers() {
    section_header "컨테이너 상태 분석"
    
    log "전체 컨테이너 목록:"
    docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}\t{{.Image}}" >> "$LOG_FILE" 2>&1
    
    # Digital Book 관련 컨테이너들
    CONTAINERS=("digitalbook-backend" "digitalbook-frontend" "digitalbook-postgres" "digitalbook-redis")
    
    for container in "${CONTAINERS[@]}"; do
        echo -e "\n${YELLOW}🔍 분석 중: $container${NC}"
        
        if docker ps -a --format "{{.Names}}" | grep -q "^$container$"; then
            # 컨테이너 상태
            STATUS=$(docker ps -a --format "{{.Status}}" --filter name="$container")
            if [[ "$STATUS" == Up* ]]; then
                log "${GREEN}✅ $container: 실행 중 ($STATUS)${NC}"
            else
                log "${RED}❌ $container: 실행되지 않음 ($STATUS)${NC}"
            fi
            
            # 포트 정보
            PORTS=$(docker ps --format "{{.Ports}}" --filter name="$container")
            if [ -n "$PORTS" ]; then
                log "   포트: $PORTS"
            else
                log "   포트: 설정되지 않음"
            fi
            
            # 이미지 정보
            IMAGE=$(docker ps -a --format "{{.Image}}" --filter name="$container")
            log "   이미지: $IMAGE"
            
            # 컨테이너 세부 정보
            log "   컨테이너 세부 정보:"
            docker inspect "$container" --format '   Created: {{.Created}}' >> "$LOG_FILE" 2>&1
            docker inspect "$container" --format '   RestartCount: {{.RestartCount}}' >> "$LOG_FILE" 2>&1
            
            # 리소스 사용량 (실행 중인 경우에만)
            if [[ "$STATUS" == Up* ]]; then
                log "   리소스 사용량:"
                docker stats "$container" --no-stream --format "   CPU: {{.CPUPerc}}, Memory: {{.MemUsage}} ({{.MemPerc}})" >> "$LOG_FILE" 2>&1
            fi
            
        else
            log "${RED}❌ $container: 컨테이너를 찾을 수 없음${NC}"
        fi
    done
}

# 네트워크 분석
analyze_networks() {
    section_header "Docker 네트워크 분석"
    
    log "Docker 네트워크 목록:"
    docker network ls >> "$LOG_FILE" 2>&1
    
    # Digital Book 네트워크 확인
    if docker network ls --format "{{.Name}}" | grep -q "digitalbook"; then
        log "${GREEN}✅ digitalbook 네트워크 존재${NC}"
        
        log "네트워크 세부 정보:"
        docker network inspect digitalbook-network >> "$LOG_FILE" 2>&1 || log "digitalbook-network 세부 정보를 가져올 수 없음"
    else
        log "${RED}❌ digitalbook 관련 네트워크를 찾을 수 없음${NC}"
    fi
}

# 볼륨 분석
analyze_volumes() {
    section_header "Docker 볼륨 분석"
    
    log "Docker 볼륨 목록:"
    docker volume ls >> "$LOG_FILE" 2>&1
    
    # Digital Book 관련 볼륨 확인
    VOLUMES=("digitalbook_postgres_data" "digitalbook_redis_data")
    
    for volume in "${VOLUMES[@]}"; do
        if docker volume ls --format "{{.Name}}" | grep -q "$volume"; then
            log "${GREEN}✅ $volume 볼륨 존재${NC}"
            
            # 볼륨 세부 정보
            log "   볼륨 세부 정보:"
            docker volume inspect "$volume" >> "$LOG_FILE" 2>&1
        else
            log "${RED}❌ $volume 볼륨을 찾을 수 없음${NC}"
        fi
    done
}

# 컨테이너 로그 분석
analyze_logs() {
    section_header "컨테이너 로그 분석"
    
    CONTAINERS=("digitalbook-backend" "digitalbook-frontend" "digitalbook-postgres" "digitalbook-redis")
    
    for container in "${CONTAINERS[@]}"; do
        if docker ps -a --format "{{.Names}}" | grep -q "^$container$"; then
            echo -e "\n${YELLOW}📋 $container 로그 분석${NC}"
            
            # 로그 크기 확인
            LOG_SIZE=$(docker logs "$container" 2>&1 | wc -l)
            log "   로그 라인 수: $LOG_SIZE"
            
            # 최근 에러 찾기
            log "   최근 에러 메시지:"
            docker logs "$container" 2>&1 | grep -i "error\|exception\|fail" | tail -5 >> "$LOG_FILE" 2>&1 || echo "   에러 메시지 없음" >> "$LOG_FILE"
            
            # 최근 경고 찾기  
            log "   최근 경고 메시지:"
            docker logs "$container" 2>&1 | grep -i "warn\|warning" | tail -3 >> "$LOG_FILE" 2>&1 || echo "   경고 메시지 없음" >> "$LOG_FILE"
            
            # 최근 로그 (일반)
            log "   최근 로그 (마지막 10줄):"
            docker logs "$container" --tail 10 >> "$LOG_FILE" 2>&1
            
        else
            log "${RED}❌ $container: 컨테이너를 찾을 수 없어 로그 분석 불가${NC}"
        fi
    done
}

# 헬스체크 분석
analyze_health() {
    section_header "컨테이너 헬스체크 분석"
    
    CONTAINERS=("digitalbook-backend" "digitalbook-frontend" "digitalbook-postgres" "digitalbook-redis")
    
    for container in "${CONTAINERS[@]}"; do
        if docker ps --format "{{.Names}}" | grep -q "^$container$"; then
            echo -e "\n${YELLOW}🏥 $container 헬스체크${NC}"
            
            # 헬스 상태 확인
            HEALTH_STATUS=$(docker inspect "$container" --format='{{.State.Health.Status}}' 2>/dev/null || echo "no-healthcheck")
            
            case "$HEALTH_STATUS" in
                "healthy")
                    log "${GREEN}✅ $container: 정상 (healthy)${NC}"
                    ;;
                "unhealthy")
                    log "${RED}❌ $container: 비정상 (unhealthy)${NC}"
                    ;;
                "starting")
                    log "${YELLOW}⏳ $container: 시작 중 (starting)${NC}"
                    ;;
                "no-healthcheck")
                    log "${BLUE}ℹ️  $container: 헬스체크 설정 없음${NC}"
                    ;;
                *)
                    log "${YELLOW}⚠️  $container: 알 수 없는 상태 ($HEALTH_STATUS)${NC}"
                    ;;
            esac
            
            # 포트 연결 테스트
            case "$container" in
                "digitalbook-backend")
                    if curl -f -s http://localhost:4000/api/health >/dev/null 2>&1; then
                        log "${GREEN}✅ Backend API 연결 가능 (포트 4000)${NC}"
                    else
                        log "${RED}❌ Backend API 연결 불가 (포트 4000)${NC}"
                    fi
                    ;;
                "digitalbook-frontend")
                    if curl -f -s http://localhost:3000 >/dev/null 2>&1; then
                        log "${GREEN}✅ Frontend 연결 가능 (포트 3000)${NC}"
                    else
                        log "${RED}❌ Frontend 연결 불가 (포트 3000)${NC}"
                    fi
                    ;;
                "digitalbook-postgres")
                    if docker exec "$container" pg_isready -U postgres >/dev/null 2>&1; then
                        log "${GREEN}✅ PostgreSQL 연결 가능${NC}"
                    else
                        log "${RED}❌ PostgreSQL 연결 불가${NC}"
                    fi
                    ;;
                "digitalbook-redis")
                    if docker exec "$container" redis-cli ping >/dev/null 2>&1; then
                        log "${GREEN}✅ Redis 연결 가능${NC}"
                    else
                        log "${RED}❌ Redis 연결 불가${NC}"
                    fi
                    ;;
            esac
        else
            log "${RED}❌ $container: 실행되지 않음 - 헬스체크 불가${NC}"
        fi
    done
}

# Docker Compose 상태 확인
analyze_compose() {
    section_header "Docker Compose 상태 분석"
    
    cd "$PROJECT_DIR" 2>/dev/null || {
        log "${RED}❌ 프로젝트 디렉토리에 접근할 수 없습니다: $PROJECT_DIR${NC}"
        return 1
    }
    
    # docker-compose.prod.yml 파일 확인
    if [ -f "docker-compose.prod.yml" ]; then
        log "${GREEN}✅ docker-compose.prod.yml 파일 존재${NC}"
        
        # 설정 유효성 검사
        if docker-compose -f docker-compose.prod.yml config >/dev/null 2>&1; then
            log "${GREEN}✅ Docker Compose 설정 유효${NC}"
        else
            log "${RED}❌ Docker Compose 설정 오류${NC}"
            log "설정 검증 결과:"
            docker-compose -f docker-compose.prod.yml config >> "$LOG_FILE" 2>&1 || echo "설정 검증 실패" >> "$LOG_FILE"
        fi
        
        # 서비스 상태 확인
        log "Docker Compose 서비스 상태:"
        docker-compose -f docker-compose.prod.yml ps >> "$LOG_FILE" 2>&1 || echo "서비스 상태 확인 실패" >> "$LOG_FILE"
        
    else
        log "${RED}❌ docker-compose.prod.yml 파일이 없습니다${NC}"
    fi
    
    # 환경변수 파일 확인
    if [ -f ".env.production" ]; then
        log "${GREEN}✅ .env.production 파일 존재${NC}"
        
        # 파일 권한 확인
        PERMISSIONS=$(stat -c "%a" .env.production 2>/dev/null || stat -f "%A" .env.production 2>/dev/null)
        if [ "$PERMISSIONS" = "600" ]; then
            log "${GREEN}✅ .env.production 파일 권한 안전 (600)${NC}"
        else
            log "${YELLOW}⚠️  .env.production 파일 권한: $PERMISSIONS (권장: 600)${NC}"
        fi
        
    else
        log "${YELLOW}⚠️  .env.production 파일이 없습니다${NC}"
    fi
}

# 시스템 리소스 분석
analyze_resources() {
    section_header "시스템 리소스 사용량 분석"
    
    # 전체 시스템 리소스
    log "시스템 메모리 사용량:"
    free -h >> "$LOG_FILE" 2>&1
    
    log "시스템 디스크 사용량:"
    df -h >> "$LOG_FILE" 2>&1
    
    # Docker 리소스 사용량
    if docker ps -q | head -1 >/dev/null 2>&1; then
        log "Docker 컨테이너 리소스 사용량:"
        docker stats --no-stream >> "$LOG_FILE" 2>&1
    else
        log "실행 중인 Docker 컨테이너가 없음"
    fi
    
    # Docker 시스템 정보
    log "Docker 시스템 정보:"
    docker system df >> "$LOG_FILE" 2>&1
}

# 문제점 요약
summarize_issues() {
    section_header "문제점 요약 및 권장사항"
    
    ISSUES=()
    WARNINGS=()
    
    # 로그 파일에서 문제점 추출
    if grep -q "❌" "$LOG_FILE"; then
        while IFS= read -r line; do
            ISSUES+=("$line")
        done < <(grep "❌" "$LOG_FILE" | sed 's/.*❌/❌/')
    fi
    
    if grep -q "⚠️" "$LOG_FILE"; then
        while IFS= read -r line; do
            WARNINGS+=("$line")
        done < <(grep "⚠️" "$LOG_FILE" | sed 's/.*⚠️/⚠️/')
    fi
    
    echo -e "\n${RED}🚨 발견된 문제점 (${#ISSUES[@]}개):${NC}"
    if [ ${#ISSUES[@]} -eq 0 ]; then
        echo -e "${GREEN}   문제점이 발견되지 않았습니다!${NC}"
    else
        for issue in "${ISSUES[@]}"; do
            echo -e "   $issue"
        done
    fi
    
    echo -e "\n${YELLOW}⚠️  주의사항 (${#WARNINGS[@]}개):${NC}"
    if [ ${#WARNINGS[@]} -eq 0 ]; then
        echo -e "${GREEN}   주의사항이 없습니다!${NC}"
    else
        for warning in "${WARNINGS[@]}"; do
            echo -e "   $warning"
        done
    fi
    
    # 권장사항
    echo -e "\n${BLUE}💡 권장사항:${NC}"
    echo -e "1. 실패한 컨테이너가 있다면 로그를 확인하세요: docker logs <container-name>"
    echo -e "2. 컨테이너를 재시작해보세요: docker-compose -f docker-compose.prod.yml restart"
    echo -e "3. 환경변수가 올바르게 설정되었는지 확인하세요"
    echo -e "4. 포트 충돌이 있는지 확인하세요: netstat -tlnp"
    echo -e "5. 디스크 공간이 부족한지 확인하세요: df -h"
}

# 메인 실행
main() {
    check_docker || exit 1
    analyze_containers
    analyze_networks
    analyze_volumes
    analyze_logs
    analyze_health
    analyze_compose
    analyze_resources
    summarize_issues
    
    echo -e "\n${GREEN}=========================================="
    echo -e "🎯 Docker 분석 완료!"
    echo -e "========================================${NC}"
    
    echo -e "${BLUE}📊 분석 결과:${NC}"
    echo -e "• 전체 로그: $LOG_FILE"
    echo -e "• 분석 시간: $(date)"
    
    echo -e "\n${YELLOW}📋 다음 단계:${NC}"
    echo -e "1. 로그 파일 검토: cat $LOG_FILE"
    echo -e "2. 발견된 문제점 해결"
    echo -e "3. API 테스트 실행"
    
    echo -e "\n${GREEN}분석 완료! 🐳${NC}"
}

# 스크립트 실행
main