#!/bin/bash

# ==========================================================
# AWS Lightsail 서버 재배포 및 복구 스크립트
# ==========================================================

set -e

# 색상 설정
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# 설정
PROJECT_DIR="/home/ubuntu/digitalbook"
LOG_FILE="/tmp/server-recovery-$(date +%Y%m%d_%H%M%S).log"
BACKUP_DIR="/tmp/digitalbook-backup-$(date +%Y%m%d_%H%M%S)"

echo -e "${BLUE}========================================"
echo -e "AWS Lightsail 서버 복구 스크립트"
echo -e "시간: $(date)"
echo -e "로그 파일: $LOG_FILE"
echo -e "백업 디렉토리: $BACKUP_DIR"
echo -e "========================================${NC}"

# 로그 기록 함수
log() {
    echo -e "$1" | tee -a "$LOG_FILE"
}

# 에러 처리 함수
handle_error() {
    log "${RED}❌ 오류 발생: $1${NC}"
    log "복구 작업을 중단합니다."
    log "로그 파일을 확인하세요: $LOG_FILE"
    exit 1
}

# 사전 확인
pre_check() {
    echo -e "\n${PURPLE}========================================${NC}"
    echo -e "${PURPLE} 1. 사전 확인${NC}"
    echo -e "${PURPLE}========================================${NC}"
    
    log "=== 사전 확인 ==="
    
    # 권한 확인
    if [ "$EUID" -eq 0 ]; then
        log "${YELLOW}⚠️  루트 권한으로 실행 중${NC}"
    else
        log "${BLUE}ℹ️  일반 사용자 권한으로 실행 중${NC}"
    fi
    
    # Docker 설치 확인
    if ! command -v docker &> /dev/null; then
        handle_error "Docker가 설치되지 않았습니다"
    fi
    log "${GREEN}✅ Docker 설치 확인됨${NC}"
    
    # Docker Compose 확인
    if ! command -v docker-compose &> /dev/null; then
        handle_error "Docker Compose가 설치되지 않았습니다"
    fi
    log "${GREEN}✅ Docker Compose 설치 확인됨${NC}"
    
    # 프로젝트 디렉토리 확인
    if [ ! -d "$PROJECT_DIR" ]; then
        log "${YELLOW}⚠️  프로젝트 디렉토리가 없습니다. 생성합니다: $PROJECT_DIR${NC}"
        mkdir -p "$PROJECT_DIR"
    fi
    log "${GREEN}✅ 프로젝트 디렉토리 확인됨: $PROJECT_DIR${NC}"
    
    cd "$PROJECT_DIR"
}

# 현재 상태 백업
backup_current_state() {
    echo -e "\n${PURPLE}========================================${NC}"
    echo -e "${PURPLE} 2. 현재 상태 백업${NC}"
    echo -e "${PURPLE}========================================${NC}"
    
    log "=== 현재 상태 백업 ==="
    
    mkdir -p "$BACKUP_DIR"
    
    # Docker 컨테이너 상태 저장
    log "🐳 Docker 컨테이너 상태 백업"
    docker ps -a > "$BACKUP_DIR/docker-containers.txt" 2>&1 || true
    docker images > "$BACKUP_DIR/docker-images.txt" 2>&1 || true
    
    # 현재 설정 파일 백업
    if [ -f "docker-compose.prod.yml" ]; then
        cp "docker-compose.prod.yml" "$BACKUP_DIR/"
        log "${GREEN}✅ docker-compose.prod.yml 백업됨${NC}"
    fi
    
    if [ -f ".env.production" ]; then
        cp ".env.production" "$BACKUP_DIR/"
        log "${GREEN}✅ .env.production 백업됨${NC}"
    fi
    
    # 업로드 파일 백업 (크기 제한)
    if [ -d "uploads" ]; then
        UPLOAD_SIZE=$(du -sm uploads 2>/dev/null | cut -f1 || echo "0")
        if [ "$UPLOAD_SIZE" -lt 100 ]; then  # 100MB 미만일 때만 백업
            cp -r uploads "$BACKUP_DIR/"
            log "${GREEN}✅ uploads 폴더 백업됨 (크기: ${UPLOAD_SIZE}MB)${NC}"
        else
            log "${YELLOW}⚠️  uploads 폴더가 너무 큽니다 (${UPLOAD_SIZE}MB) - 백업 건너뜀${NC}"
        fi
    fi
    
    # 데이터베이스 백업 (실행 중인 경우)
    if docker ps --format "{{.Names}}" | grep -q "digitalbook-postgres"; then
        log "🗄️ 데이터베이스 백업 시도"
        docker exec digitalbook-postgres pg_dump -U postgres digitalbook > "$BACKUP_DIR/database-backup.sql" 2>/dev/null || \
            log "${YELLOW}⚠️  데이터베이스 백업 실패${NC}"
    fi
    
    log "${GREEN}✅ 백업 완료: $BACKUP_DIR${NC}"
}

# 서비스 중지
stop_services() {
    echo -e "\n${PURPLE}========================================${NC}"
    echo -e "${PURPLE} 3. 서비스 중지${NC}"
    echo -e "${PURPLE}========================================${NC}"
    
    log "=== 서비스 중지 ==="
    
    # systemd 서비스 중지 (digitalbook)
    if systemctl is-active --quiet digitalbook 2>/dev/null; then
        log "🛑 systemd digitalbook 서비스 중지"
        sudo systemctl stop digitalbook || log "${YELLOW}⚠️  digitalbook 서비스 중지 실패${NC}"
    fi
    
    # PM2 프로세스 중지
    if command -v pm2 &> /dev/null && pm2 list | grep -q "backend"; then
        log "🛑 PM2 backend 프로세스 중지"
        pm2 stop backend || log "${YELLOW}⚠️  PM2 backend 중지 실패${NC}"
        pm2 delete backend || log "${YELLOW}⚠️  PM2 backend 삭제 실패${NC}"
    fi
    
    # Docker Compose 서비스 중지
    if [ -f "docker-compose.prod.yml" ]; then
        log "🛑 Docker Compose 서비스 중지"
        docker-compose -f docker-compose.prod.yml down --remove-orphans 2>&1 | tee -a "$LOG_FILE" || \
            log "${YELLOW}⚠️  Docker Compose 중지 중 오류 발생${NC}"
    fi
    
    # 남은 컨테이너 강제 정리
    REMAINING_CONTAINERS=$(docker ps -a --filter "name=digitalbook" --format "{{.Names}}" 2>/dev/null || true)
    if [ -n "$REMAINING_CONTAINERS" ]; then
        log "🗑️ 남은 컨테이너 정리: $REMAINING_CONTAINERS"
        echo "$REMAINING_CONTAINERS" | xargs -r docker rm -f 2>&1 | tee -a "$LOG_FILE" || true
    fi
    
    log "${GREEN}✅ 서비스 중지 완료${NC}"
}

# 시스템 정리
cleanup_system() {
    echo -e "\n${PURPLE}========================================${NC}"
    echo -e "${PURPLE} 4. 시스템 정리${NC}"
    echo -e "${PURPLE}========================================${NC}"
    
    log "=== 시스템 정리 ==="
    
    # Docker 시스템 정리
    log "🧹 Docker 시스템 정리"
    docker system prune -f 2>&1 | tee -a "$LOG_FILE" || log "${YELLOW}⚠️  Docker 정리 중 오류 발생${NC}"
    
    # 사용하지 않는 이미지 정리
    log "🖼️ 사용하지 않는 Docker 이미지 정리"
    docker image prune -f 2>&1 | tee -a "$LOG_FILE" || log "${YELLOW}⚠️  이미지 정리 중 오류 발생${NC}"
    
    # 볼륨은 보존 (데이터 손실 방지)
    log "${BLUE}ℹ️  Docker 볼륨은 데이터 보존을 위해 유지합니다${NC}"
    
    # 임시 파일 정리
    log "📂 임시 파일 정리"
    find /tmp -name "*digitalbook*" -type f -mtime +7 -delete 2>/dev/null || true
    
    log "${GREEN}✅ 시스템 정리 완료${NC}"
}

# 환경변수 설정
setup_environment() {
    echo -e "\n${PURPLE}========================================${NC}"
    echo -e "${PURPLE} 5. 환경변수 설정${NC}"
    echo -e "${PURPLE}========================================${NC}"
    
    log "=== 환경변수 설정 ==="
    
    if [ ! -f ".env.production" ]; then
        log "${YELLOW}⚠️  .env.production 파일이 없습니다${NC}"
        log "환경변수 설정 스크립트를 실행하시겠습니까? (y/n)"
        
        # 자동 모드가 아닌 경우에만 사용자 입력 받기
        if [ "${AUTO_MODE:-}" != "true" ]; then
            read -r response
            if [[ "$response" =~ ^[Yy]$ ]]; then
                if [ -f "../scripts/setup-production-env.sh" ]; then
                    log "🔧 환경변수 설정 스크립트 실행"
                    bash ../scripts/setup-production-env.sh
                else
                    log "${RED}❌ 환경변수 설정 스크립트를 찾을 수 없습니다${NC}"
                fi
            fi
        else
            log "${BLUE}ℹ️  자동 모드 - 환경변수 설정 건너뜀${NC}"
        fi
    else
        log "${GREEN}✅ .env.production 파일 존재함${NC}"
        
        # 환경변수 유효성 간단 검증
        if grep -q "JWT_SECRET=" .env.production && grep -q "DATABASE_URL=" .env.production; then
            log "${GREEN}✅ 필수 환경변수 확인됨${NC}"
        else
            log "${YELLOW}⚠️  일부 환경변수가 누락될 수 있습니다${NC}"
        fi
    fi
}

# 서비스 재시작
restart_services() {
    echo -e "\n${PURPLE}========================================${NC}"
    echo -e "${PURPLE} 6. 서비스 재시작${NC}"
    echo -e "${PURPLE}========================================${NC}"
    
    log "=== 서비스 재시작 ==="
    
    # Docker Compose로 서비스 시작
    if [ -f "docker-compose.prod.yml" ]; then
        log "🚀 Docker Compose 서비스 시작"
        
        # 이미지 최신화
        log "📥 Docker 이미지 업데이트"
        docker-compose -f docker-compose.prod.yml pull 2>&1 | tee -a "$LOG_FILE" || \
            log "${YELLOW}⚠️  일부 이미지 업데이트 실패${NC}"
        
        # 서비스 시작 (백그라운드)
        log "🔄 서비스 시작 중..."
        docker-compose -f docker-compose.prod.yml up -d --build 2>&1 | tee -a "$LOG_FILE"
        
        # 서비스 상태 확인 (30초 대기)
        log "⏳ 서비스 시작 대기 중 (30초)..."
        sleep 30
        
        # 컨테이너 상태 확인
        log "🔍 컨테이너 상태 확인"
        docker-compose -f docker-compose.prod.yml ps >> "$LOG_FILE" 2>&1
        
        # 실행 중인 컨테이너 확인
        RUNNING_CONTAINERS=$(docker ps --filter "name=digitalbook" --format "{{.Names}}" | wc -l)
        log "실행 중인 컨테이너: $RUNNING_CONTAINERS개"
        
        if [ "$RUNNING_CONTAINERS" -gt 0 ]; then
            log "${GREEN}✅ Docker 서비스 시작됨${NC}"
        else
            log "${RED}❌ Docker 서비스 시작 실패${NC}"
        fi
        
    else
        log "${RED}❌ docker-compose.prod.yml 파일이 없습니다${NC}"
    fi
}

# 서비스 검증
verify_services() {
    echo -e "\n${PURPLE}========================================${NC}"
    echo -e "${PURPLE} 7. 서비스 검증${NC}"
    echo -e "${PURPLE}========================================${NC}"
    
    log "=== 서비스 검증 ==="
    
    # 포트 확인
    log "🔌 포트 상태 확인"
    PORTS_STATUS=""
    for port in 3000 4000 5432 6379; do
        if ss -tlnp | grep ":$port " >/dev/null 2>&1; then
            PORTS_STATUS+="${GREEN}✅ $port ${NC}"
        else
            PORTS_STATUS+="${RED}❌ $port ${NC}"
        fi
    done
    log "   $PORTS_STATUS"
    
    # 헬스체크
    log "🏥 서비스 헬스체크"
    
    # PostgreSQL 확인
    if docker exec digitalbook-postgres pg_isready -U postgres >/dev/null 2>&1; then
        log "${GREEN}✅ PostgreSQL 연결 가능${NC}"
    else
        log "${RED}❌ PostgreSQL 연결 불가${NC}"
    fi
    
    # Redis 확인
    if docker exec digitalbook-redis redis-cli ping >/dev/null 2>&1; then
        log "${GREEN}✅ Redis 연결 가능${NC}"
    else
        log "${RED}❌ Redis 연결 불가${NC}"
    fi
    
    # Backend API 확인
    sleep 5  # 추가 대기
    if curl -f -s http://localhost:4000/api/health >/dev/null 2>&1; then
        log "${GREEN}✅ Backend API 응답 정상${NC}"
    else
        log "${RED}❌ Backend API 응답 없음${NC}"
        log "Backend 컨테이너 로그:"
        docker logs digitalbook-backend --tail 10 >> "$LOG_FILE" 2>&1 || true
    fi
    
    # Frontend 확인
    if curl -f -s http://localhost:3000 >/dev/null 2>&1; then
        log "${GREEN}✅ Frontend 응답 정상${NC}"
    else
        log "${RED}❌ Frontend 응답 없음${NC}"
        log "Frontend 컨테이너 로그:"
        docker logs digitalbook-frontend --tail 10 >> "$LOG_FILE" 2>&1 || true
    fi
}

# 로그인 테스트
test_login() {
    echo -e "\n${PURPLE}========================================${NC}"
    echo -e "${PURPLE} 8. 로그인 기능 테스트${NC}"
    echo -e "${PURPLE}========================================${NC}"
    
    log "=== 로그인 기능 테스트 ==="
    
    # 잠시 대기 (서비스 완전 시작 대기)
    log "⏳ 서비스 완전 시작 대기 (10초)..."
    sleep 10
    
    # 로그인 테스트
    TEST_EMAIL="teacher@example.com"
    TEST_PASSWORD="teacher123"
    
    log "🔐 로그인 테스트 실행"
    log "   테스트 계정: $TEST_EMAIL"
    
    LOGIN_STATUS=$(curl -s -w "%{http_code}" \
        -X POST \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}" \
        -o /tmp/login_test_response.json \
        "http://localhost:4000/api/auth/login" 2>/dev/null || echo "000")
    
    case "$LOGIN_STATUS" in
        "200")
            log "${GREEN}✅ 로그인 성공! (상태코드: 200)${NC}"
            log "🎉 500 에러 해결됨!"
            ;;
        "401")
            log "${YELLOW}⚠️  로그인 실패: 인증 정보 오류 (상태코드: 401)${NC}"
            log "   테스트 계정이 존재하지 않거나 비밀번호가 잘못되었습니다"
            ;;
        "500")
            log "${RED}❌ 로그인 실패: 서버 내부 오류 (상태코드: 500)${NC}"
            log "   🚨 500 에러가 여전히 발생합니다"
            log "   추가 디버깅이 필요합니다"
            
            if [ -f /tmp/login_test_response.json ]; then
                log "   에러 응답:"
                cat /tmp/login_test_response.json >> "$LOG_FILE" 2>&1
            fi
            ;;
        "000")
            log "${RED}❌ 연결 실패: 서버에 연결할 수 없습니다${NC}"
            ;;
        *)
            log "${YELLOW}⚠️  예상치 못한 응답: $LOGIN_STATUS${NC}"
            ;;
    esac
    
    # 임시 파일 정리
    rm -f /tmp/login_test_response.json 2>/dev/null || true
}

# 결과 요약 및 권장사항
summarize_and_recommend() {
    echo -e "\n${GREEN}=========================================="
    echo -e "🎯 서버 복구 결과 요약"
    echo -e "========================================${NC}"
    
    log "=== 복구 결과 요약 ==="
    
    # 서비스 상태 재확인
    RUNNING_CONTAINERS=$(docker ps --filter "name=digitalbook" --format "{{.Names}}" | wc -l)
    
    log "📊 최종 상태:"
    log "   실행 중인 컨테이너: $RUNNING_CONTAINERS개"
    log "   백업 위치: $BACKUP_DIR"
    log "   로그 파일: $LOG_FILE"
    
    # 성공/실패 판정
    if [ "$RUNNING_CONTAINERS" -ge 3 ]; then
        log "${GREEN}🎉 서버 복구 성공!${NC}"
        
        log "\n${BLUE}📋 권장 후속 작업:${NC}"
        log "1. 전체 API 테스트 실행: bash scripts/api-tester.sh"
        log "2. 로그 모니터링: docker-compose -f docker-compose.prod.yml logs -f"
        log "3. 정기적인 백업 설정 고려"
        
    else
        log "${RED}⚠️  서버 복구 부분적 성공${NC}"
        
        log "\n${YELLOW}🔧 추가 조치 필요:${NC}"
        log "1. 개별 컨테이너 상태 확인: docker ps -a"
        log "2. 컨테이너 로그 확인: docker logs <container-name>"
        log "3. 환경변수 설정 재검토"
        log "4. 수동 서비스 재시작 고려"
    fi
    
    # 모니터링 명령어
    log "\n${BLUE}🔍 모니터링 명령어:${NC}"
    log "• 실시간 로그: docker-compose -f docker-compose.prod.yml logs -f"
    log "• 컨테이너 상태: docker-compose -f docker-compose.prod.yml ps"
    log "• 시스템 리소스: docker stats"
    log "• API 테스트: curl http://localhost:4000/api/health"
    
    echo -e "\n${GREEN}복구 스크립트 완료! 🚀${NC}"
}

# 자동 복구 모드
auto_recovery() {
    log "${BLUE}🤖 자동 복구 모드로 실행합니다${NC}"
    export AUTO_MODE=true
    
    pre_check
    backup_current_state
    stop_services
    cleanup_system
    setup_environment
    restart_services
    verify_services
    test_login
    summarize_and_recommend
}

# 대화형 복구 모드
interactive_recovery() {
    log "${BLUE}👤 대화형 복구 모드로 실행합니다${NC}"
    
    echo -e "\n${YELLOW}다음 단계를 진행하시겠습니까?${NC}"
    echo -e "1. 사전 확인 및 현재 상태 백업"
    echo -e "2. 서비스 중지 및 시스템 정리"
    echo -e "3. 환경변수 설정"
    echo -e "4. 서비스 재시작 및 검증"
    echo -e "5. 로그인 테스트"
    
    read -p "계속하시겠습니까? (y/n): " -r
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log "복구 작업이 취소되었습니다."
        exit 0
    fi
    
    pre_check
    backup_current_state
    stop_services
    cleanup_system
    setup_environment
    restart_services
    verify_services
    test_login
    summarize_and_recommend
}

# 옵션 처리 및 메인 실행
case "${1:-}" in
    --help|-h)
        echo "사용법: $0 [옵션]"
        echo "옵션:"
        echo "  --help, -h        이 도움말 표시"
        echo "  --auto            자동 복구 모드 (사용자 입력 없음)"
        echo "  --interactive     대화형 복구 모드 (기본값)"
        echo "  --backup-only     백업만 수행"
        echo "  --restart-only    서비스 재시작만 수행"
        exit 0
        ;;
    --auto)
        auto_recovery
        ;;
    --interactive)
        interactive_recovery
        ;;
    --backup-only)
        pre_check
        backup_current_state
        log "${GREEN}백업 완료: $BACKUP_DIR${NC}"
        ;;
    --restart-only)
        pre_check
        restart_services
        verify_services
        test_login
        ;;
    *)
        # 기본값: 대화형 모드
        interactive_recovery
        ;;
esac