#!/bin/bash

# =============================================================================
# 한국 디지털 교과서 플랫폼 - 프로덕션 환경 검증 스크립트
# =============================================================================
# 사용법: ./scripts/validate-production.sh [옵션]
# 옵션:
#   --fix        : 자동 수정 가능한 문제들을 수정
#   --verbose    : 상세 출력
#   --env-file   : 환경변수 파일 경로 (기본: .env.production)
# =============================================================================

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 로그 함수
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# 설정
PROJECT_ROOT="/Users/jihunkong/DigitalBook"
ENV_FILE=".env.production"
FIX_MODE=false
VERBOSE=false
ERRORS=0
WARNINGS=0

# 옵션 파싱
while [[ $# -gt 0 ]]; do
    case $1 in
        --fix)
            FIX_MODE=true
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        --env-file)
            ENV_FILE="$2"
            shift 2
            ;;
        *)
            log_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# =============================================================================
# 검증 함수들
# =============================================================================

# 1. 환경변수 검증
check_environment_variables() {
    log_info "환경변수 검증 중..."
    
    local required_vars=(
        "NODE_ENV"
        "DATABASE_URL"
        "REDIS_URL"
        "JWT_SECRET"
        "JWT_REFRESH_SECRET"
        "SESSION_SECRET"
        "COOKIE_SECRET"
        "ENCRYPTION_KEY"
        "ENCRYPTION_IV"
        "NEXT_PUBLIC_API_URL"
        "NEXT_PUBLIC_SITE_URL"
        "CORS_ORIGIN"
    )
    
    local optional_vars=(
        "OPENAI_API_KEY"
        "SMTP_HOST"
        "AWS_ACCESS_KEY_ID"
        "SENTRY_DSN"
    )
    
    if [ ! -f "$ENV_FILE" ]; then
        log_error "환경변수 파일을 찾을 수 없습니다: $ENV_FILE"
        ((ERRORS++))
        
        if [ "$FIX_MODE" = true ]; then
            log_info "환경변수 파일 생성 중..."
            cp "$PROJECT_ROOT/.env.example" "$ENV_FILE"
            log_success "환경변수 파일 생성됨"
        fi
        return
    fi
    
    # 필수 변수 체크
    for var in "${required_vars[@]}"; do
        if ! grep -q "^$var=" "$ENV_FILE"; then
            log_error "필수 환경변수 누락: $var"
            ((ERRORS++))
        else
            value=$(grep "^$var=" "$ENV_FILE" | cut -d'=' -f2-)
            
            # 보안 검증
            if [[ "$var" == *"SECRET"* ]] || [[ "$var" == "JWT_"* ]]; then
                if [[ "$value" == *"CHANGE_THIS"* ]] || [[ "$value" == "secret" ]]; then
                    log_error "$var 가 기본값을 사용중입니다. 변경 필요!"
                    ((ERRORS++))
                fi
                
                if [ ${#value} -lt 32 ]; then
                    log_warning "$var 가 너무 짧습니다 (최소 32자 권장)"
                    ((WARNINGS++))
                fi
            fi
            
            # HTTPS 체크
            if [[ "$var" == "NEXT_PUBLIC_"* ]] && [[ "$value" != "https://"* ]]; then
                log_warning "$var 가 HTTPS를 사용하지 않습니다"
                ((WARNINGS++))
            fi
        fi
    done
    
    # 선택적 변수 체크
    for var in "${optional_vars[@]}"; do
        if ! grep -q "^$var=" "$ENV_FILE"; then
            log_warning "선택적 환경변수 누락: $var (일부 기능 비활성화)"
            ((WARNINGS++))
        fi
    done
    
    # NODE_ENV 체크
    node_env=$(grep "^NODE_ENV=" "$ENV_FILE" | cut -d'=' -f2-)
    if [ "$node_env" != "production" ]; then
        log_error "NODE_ENV가 'production'이 아닙니다: $node_env"
        ((ERRORS++))
    fi
    
    log_success "환경변수 검증 완료"
}

# 2. SSL/TLS 인증서 검증
check_ssl_certificates() {
    log_info "SSL/TLS 인증서 검증 중..."
    
    local cert_dir="/etc/letsencrypt/live/xn--220bu63c.com"
    local cert_files=("fullchain.pem" "privkey.pem")
    
    if [ ! -d "$cert_dir" ]; then
        log_warning "SSL 인증서 디렉토리를 찾을 수 없습니다"
        ((WARNINGS++))
        return
    fi
    
    for cert in "${cert_files[@]}"; do
        if [ ! -f "$cert_dir/$cert" ]; then
            log_error "SSL 인증서 파일 누락: $cert"
            ((ERRORS++))
        else
            # 인증서 만료 체크
            if [ "$cert" = "fullchain.pem" ]; then
                expiry=$(openssl x509 -enddate -noout -in "$cert_dir/$cert" 2>/dev/null | cut -d= -f2)
                expiry_epoch=$(date -d "$expiry" +%s 2>/dev/null || date -j -f "%b %d %H:%M:%S %Y %Z" "$expiry" +%s)
                current_epoch=$(date +%s)
                days_left=$(( (expiry_epoch - current_epoch) / 86400 ))
                
                if [ $days_left -lt 30 ]; then
                    log_warning "SSL 인증서가 ${days_left}일 후 만료됩니다"
                    ((WARNINGS++))
                    
                    if [ "$FIX_MODE" = true ]; then
                        log_info "인증서 갱신 시도 중..."
                        sudo certbot renew --quiet
                    fi
                else
                    log_success "SSL 인증서 유효 (${days_left}일 남음)"
                fi
            fi
        fi
    done
}

# 3. 데이터베이스 연결 검증
check_database_connection() {
    log_info "데이터베이스 연결 검증 중..."
    
    if [ -f "$ENV_FILE" ]; then
        source "$ENV_FILE"
    fi
    
    # PostgreSQL 연결 테스트
    if command -v psql &> /dev/null; then
        if PGPASSWORD="${DB_PASSWORD:-postgres}" psql -h "${DB_HOST:-localhost}" -U "${DB_USER:-postgres}" -d "${DB_NAME:-digitalbook}" -c "SELECT 1" &> /dev/null; then
            log_success "PostgreSQL 연결 성공"
            
            # 테이블 존재 확인
            table_count=$(PGPASSWORD="${DB_PASSWORD:-postgres}" psql -h "${DB_HOST:-localhost}" -U "${DB_USER:-postgres}" -d "${DB_NAME:-digitalbook}" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public'" 2>/dev/null | tr -d ' ')
            
            if [ "$table_count" -eq 0 ]; then
                log_warning "데이터베이스에 테이블이 없습니다. 마이그레이션 필요"
                ((WARNINGS++))
                
                if [ "$FIX_MODE" = true ]; then
                    log_info "마이그레이션 실행 중..."
                    cd "$PROJECT_ROOT/backend"
                    npx prisma migrate deploy
                fi
            else
                log_success "데이터베이스 스키마 확인 ($table_count 테이블)"
            fi
        else
            log_error "PostgreSQL 연결 실패"
            ((ERRORS++))
        fi
    else
        log_warning "psql이 설치되지 않았습니다. 데이터베이스 연결을 확인할 수 없습니다"
        ((WARNINGS++))
    fi
}

# 4. Redis 연결 검증
check_redis_connection() {
    log_info "Redis 연결 검증 중..."
    
    if command -v redis-cli &> /dev/null; then
        if redis-cli -h "${REDIS_HOST:-localhost}" -p "${REDIS_PORT:-6379}" ping &> /dev/null; then
            log_success "Redis 연결 성공"
            
            # 메모리 사용량 체크
            used_memory=$(redis-cli -h "${REDIS_HOST:-localhost}" -p "${REDIS_PORT:-6379}" INFO memory | grep used_memory_human | cut -d: -f2 | tr -d '\r')
            log_info "Redis 메모리 사용량: $used_memory"
        else
            log_error "Redis 연결 실패"
            ((ERRORS++))
        fi
    else
        log_warning "redis-cli가 설치되지 않았습니다. Redis 연결을 확인할 수 없습니다"
        ((WARNINGS++))
    fi
}

# 5. 파일 권한 검증
check_file_permissions() {
    log_info "파일 권한 검증 중..."
    
    # 업로드 디렉토리
    if [ -d "$PROJECT_ROOT/uploads" ]; then
        perms=$(stat -c %a "$PROJECT_ROOT/uploads" 2>/dev/null || stat -f %A "$PROJECT_ROOT/uploads")
        if [ "$perms" != "755" ]; then
            log_warning "uploads 디렉토리 권한이 올바르지 않습니다: $perms (권장: 755)"
            ((WARNINGS++))
            
            if [ "$FIX_MODE" = true ]; then
                chmod 755 "$PROJECT_ROOT/uploads"
                log_success "uploads 디렉토리 권한 수정됨"
            fi
        fi
    else
        log_warning "uploads 디렉토리가 없습니다"
        ((WARNINGS++))
        
        if [ "$FIX_MODE" = true ]; then
            mkdir -p "$PROJECT_ROOT/uploads"
            chmod 755 "$PROJECT_ROOT/uploads"
            log_success "uploads 디렉토리 생성됨"
        fi
    fi
    
    # 로그 디렉토리
    if [ -d "$PROJECT_ROOT/logs" ]; then
        perms=$(stat -c %a "$PROJECT_ROOT/logs" 2>/dev/null || stat -f %A "$PROJECT_ROOT/logs")
        if [ "$perms" != "755" ]; then
            log_warning "logs 디렉토리 권한이 올바르지 않습니다: $perms (권장: 755)"
            ((WARNINGS++))
        fi
    else
        if [ "$FIX_MODE" = true ]; then
            mkdir -p "$PROJECT_ROOT/logs"
            chmod 755 "$PROJECT_ROOT/logs"
            log_success "logs 디렉토리 생성됨"
        fi
    fi
}

# 6. 포트 확인
check_ports() {
    log_info "포트 사용 확인 중..."
    
    local ports=("3000" "4000" "5432" "6379" "80" "443")
    
    for port in "${ports[@]}"; do
        if lsof -i :$port &> /dev/null || netstat -tuln | grep ":$port " &> /dev/null; then
            log_success "포트 $port 사용 중"
        else
            if [ "$port" = "80" ] || [ "$port" = "443" ]; then
                log_warning "포트 $port 가 사용되지 않음 (웹 서버)"
                ((WARNINGS++))
            elif [ "$port" = "3000" ] || [ "$port" = "4000" ]; then
                log_warning "포트 $port 가 사용되지 않음 (애플리케이션)"
                ((WARNINGS++))
            fi
        fi
    done
}

# 7. Docker 상태 확인
check_docker() {
    log_info "Docker 상태 확인 중..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker가 설치되지 않았습니다"
        ((ERRORS++))
        return
    fi
    
    if ! docker info &> /dev/null; then
        log_error "Docker 데몬이 실행중이지 않습니다"
        ((ERRORS++))
        
        if [ "$FIX_MODE" = true ]; then
            log_info "Docker 시작 시도 중..."
            sudo systemctl start docker || sudo service docker start
        fi
        return
    fi
    
    log_success "Docker 실행 중"
    
    # Docker Compose 체크
    if command -v docker-compose &> /dev/null; then
        log_success "Docker Compose 설치됨"
        
        # 실행 중인 컨테이너 체크
        if [ -f "$PROJECT_ROOT/docker-compose.prod.yml" ]; then
            running=$(docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" ps -q | wc -l)
            log_info "실행 중인 컨테이너: $running"
        fi
    else
        log_warning "Docker Compose가 설치되지 않았습니다"
        ((WARNINGS++))
    fi
}

# 8. 빌드 상태 확인
check_build_status() {
    log_info "빌드 상태 확인 중..."
    
    # Frontend 빌드
    if [ -d "$PROJECT_ROOT/.next" ]; then
        log_success "Frontend 빌드 존재"
        
        # 빌드 시간 체크
        if [ -f "$PROJECT_ROOT/.next/BUILD_ID" ]; then
            build_time=$(stat -c %Y "$PROJECT_ROOT/.next/BUILD_ID" 2>/dev/null || stat -f %m "$PROJECT_ROOT/.next/BUILD_ID")
            current_time=$(date +%s)
            age_hours=$(( (current_time - build_time) / 3600 ))
            
            if [ $age_hours -gt 24 ]; then
                log_warning "Frontend 빌드가 ${age_hours}시간 전에 생성됨"
                ((WARNINGS++))
            fi
        fi
    else
        log_error "Frontend 빌드가 없습니다"
        ((ERRORS++))
        
        if [ "$FIX_MODE" = true ]; then
            log_info "Frontend 빌드 시작..."
            cd "$PROJECT_ROOT"
            npm run build
        fi
    fi
    
    # Backend 빌드
    if [ -d "$PROJECT_ROOT/backend/dist" ]; then
        log_success "Backend 빌드 존재"
    else
        log_error "Backend 빌드가 없습니다"
        ((ERRORS++))
        
        if [ "$FIX_MODE" = true ]; then
            log_info "Backend 빌드 시작..."
            cd "$PROJECT_ROOT/backend"
            npm run build
        fi
    fi
}

# 9. 보안 헤더 확인
check_security_headers() {
    log_info "보안 헤더 확인 중..."
    
    local url="${NEXT_PUBLIC_SITE_URL:-https://xn--220bu63c.com}"
    
    if command -v curl &> /dev/null; then
        headers=$(curl -s -I "$url" 2>/dev/null)
        
        # 필수 보안 헤더
        local required_headers=(
            "Strict-Transport-Security"
            "X-Content-Type-Options"
            "X-Frame-Options"
            "Content-Security-Policy"
        )
        
        for header in "${required_headers[@]}"; do
            if echo "$headers" | grep -qi "$header"; then
                log_success "보안 헤더 존재: $header"
            else
                log_warning "보안 헤더 누락: $header"
                ((WARNINGS++))
            fi
        done
    fi
}

# 10. 백업 확인
check_backup_setup() {
    log_info "백업 설정 확인 중..."
    
    # 백업 디렉토리
    if [ -d "$PROJECT_ROOT/backups" ]; then
        log_success "백업 디렉토리 존재"
        
        # 최근 백업 확인
        latest_backup=$(ls -t "$PROJECT_ROOT/backups" 2>/dev/null | head -1)
        if [ -n "$latest_backup" ]; then
            log_info "최근 백업: $latest_backup"
        else
            log_warning "백업이 없습니다"
            ((WARNINGS++))
        fi
    else
        log_warning "백업 디렉토리가 없습니다"
        ((WARNINGS++))
        
        if [ "$FIX_MODE" = true ]; then
            mkdir -p "$PROJECT_ROOT/backups"
            log_success "백업 디렉토리 생성됨"
        fi
    fi
    
    # Cron 작업 확인
    if crontab -l 2>/dev/null | grep -q "backup.sh"; then
        log_success "백업 cron 작업 설정됨"
    else
        log_warning "백업 cron 작업이 설정되지 않았습니다"
        ((WARNINGS++))
    fi
}

# =============================================================================
# 메인 실행
# =============================================================================

main() {
    echo "========================================="
    echo "  프로덕션 환경 검증"
    echo "========================================="
    echo "시작 시간: $(date)"
    echo "환경 파일: $ENV_FILE"
    echo "수정 모드: $FIX_MODE"
    echo "========================================="
    echo
    
    # 검증 실행
    check_environment_variables
    check_ssl_certificates
    check_database_connection
    check_redis_connection
    check_file_permissions
    check_ports
    check_docker
    check_build_status
    check_security_headers
    check_backup_setup
    
    # 결과 출력
    echo
    echo "========================================="
    echo "  검증 결과"
    echo "========================================="
    
    if [ $ERRORS -eq 0 ]; then
        log_success "오류 없음"
    else
        log_error "오류: $ERRORS 개"
    fi
    
    if [ $WARNINGS -eq 0 ]; then
        log_success "경고 없음"
    else
        log_warning "경고: $WARNINGS 개"
    fi
    
    echo "========================================="
    
    # 프로덕션 준비 상태
    if [ $ERRORS -eq 0 ]; then
        echo -e "${GREEN}✓ 프로덕션 배포 준비 완료${NC}"
        exit 0
    else
        echo -e "${RED}✗ 프로덕션 배포 준비 안됨${NC}"
        echo "오류를 수정한 후 다시 시도하세요."
        
        if [ "$FIX_MODE" = false ]; then
            echo "자동 수정을 위해 --fix 옵션을 사용하세요."
        fi
        exit 1
    fi
}

# 스크립트 실행
main