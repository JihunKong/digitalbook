#!/bin/bash

# =============================================================================
# 한국 디지털 교과서 플랫폼 - 복구 스크립트
# =============================================================================
# 사용법: ./scripts/restore.sh [옵션]
# 옵션:
#   --backup-dir <path>      : 백업 디렉토리 경로
#   --backup-id <timestamp>  : 백업 ID (타임스탬프)
#   --type [full|db|files|config] : 복구 유형 (기본: full)
#   --target [prod|staging|dev]    : 대상 환경 (기본: prod)
#   --dry-run                      : 실제 복구 없이 시뮬레이션
#   --force                        : 확인 없이 강제 복구
# =============================================================================

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# 로그 함수
log_info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} INFO: $1"
}

log_success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} SUCCESS: $1"
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} WARNING: $1"
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} ERROR: $1"
}

log_debug() {
    if [ "$VERBOSE" = true ]; then
        echo -e "${PURPLE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} DEBUG: $1"
    fi
}

# 설정
PROJECT_ROOT="/Users/jihunkong/DigitalBook"
BACKUP_ROOT="${PROJECT_ROOT}/backups"
RESTORE_TYPE="full"
TARGET_ENV="prod"
DRY_RUN=false
FORCE=false
VERBOSE=false
BACKUP_DIR=""
BACKUP_ID=""

# 데이터베이스 설정
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-digitalbook}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-postgres}"

# 옵션 파싱
while [[ $# -gt 0 ]]; do
    case $1 in
        --backup-dir)
            BACKUP_DIR="$2"
            shift 2
            ;;
        --backup-id)
            BACKUP_ID="$2"
            shift 2
            ;;
        --type)
            RESTORE_TYPE="$2"
            shift 2
            ;;
        --target)
            TARGET_ENV="$2"
            shift 2
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --force)
            FORCE=true
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        *)
            log_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# 백업 디렉토리 확인
find_backup_directory() {
    if [ -n "$BACKUP_DIR" ]; then
        if [ -d "$BACKUP_DIR" ]; then
            echo "$BACKUP_DIR"
            return 0
        else
            log_error "백업 디렉토리를 찾을 수 없습니다: $BACKUP_DIR"
            exit 1
        fi
    fi
    
    if [ -n "$BACKUP_ID" ]; then
        local dir="${BACKUP_ROOT}/${BACKUP_ID}"
        if [ -d "$dir" ]; then
            echo "$dir"
            return 0
        else
            log_error "백업 ID에 해당하는 디렉토리를 찾을 수 없습니다: $BACKUP_ID"
            exit 1
        fi
    fi
    
    # 최신 백업 찾기
    local latest=$(ls -t "$BACKUP_ROOT" | head -1)
    if [ -n "$latest" ]; then
        echo "${BACKUP_ROOT}/${latest}"
    else
        log_error "백업을 찾을 수 없습니다"
        exit 1
    fi
}

# 백업 메타데이터 읽기
read_backup_metadata() {
    local backup_dir="$1"
    local metadata_file="${backup_dir}/metadata.json"
    
    if [ -f "$metadata_file" ]; then
        log_info "백업 메타데이터 읽기..."
        
        # jq를 사용하여 메타데이터 파싱
        if command -v jq &> /dev/null; then
            BACKUP_TIMESTAMP=$(jq -r '.timestamp' "$metadata_file")
            BACKUP_TYPE_META=$(jq -r '.type' "$metadata_file")
            BACKUP_COMPRESSED=$(jq -r '.compressed' "$metadata_file")
            BACKUP_ENCRYPTED=$(jq -r '.encrypted' "$metadata_file")
            
            log_info "  백업 시간: $BACKUP_TIMESTAMP"
            log_info "  백업 유형: $BACKUP_TYPE_META"
            log_info "  압축: $BACKUP_COMPRESSED"
            log_info "  암호화: $BACKUP_ENCRYPTED"
        else
            log_warning "jq가 설치되지 않아 메타데이터를 파싱할 수 없습니다"
        fi
    else
        log_warning "백업 메타데이터 파일이 없습니다"
    fi
}

# 백업 검증
verify_backup() {
    local backup_dir="$1"
    
    log_info "백업 무결성 검증 중..."
    
    local errors=0
    
    # 필수 파일 확인
    case "$RESTORE_TYPE" in
        full|db)
            if [ ! -f "${backup_dir}/database_"*.sql* ] && [ ! -f "${backup_dir}/database_"*.sql.gz* ]; then
                log_error "데이터베이스 백업 파일이 없습니다"
                ((errors++))
            fi
            ;;
        full|files)
            if [ ! -f "${backup_dir}/files_"*.tar* ]; then
                log_error "파일 백업이 없습니다"
                ((errors++))
            fi
            ;;
        full|config)
            if [ ! -f "${backup_dir}/config_"*.tar* ]; then
                log_error "설정 백업이 없습니다"
                ((errors++))
            fi
            ;;
    esac
    
    if [ $errors -gt 0 ]; then
        log_error "백업 검증 실패"
        return 1
    fi
    
    log_success "백업 검증 성공"
    return 0
}

# 복호화
decrypt_backup() {
    local backup_dir="$1"
    
    log_info "백업 복호화 중..."
    
    local passphrase="${BACKUP_ENCRYPTION_KEY:-DefaultBackupKey123!}"
    
    find "$backup_dir" -name "*.gpg" | while read file; do
        local output_file="${file%.gpg}"
        
        if [ "$DRY_RUN" = true ]; then
            log_debug "[DRY-RUN] 복호화: $file -> $output_file"
        else
            gpg --batch --yes --passphrase "$passphrase" \
                --decrypt "$file" > "$output_file"
            
            if [ $? -eq 0 ]; then
                rm "$file"
                log_info "  복호화: $(basename $file)"
            else
                log_error "  복호화 실패: $(basename $file)"
                return 1
            fi
        fi
    done
    
    log_success "백업 복호화 완료"
}

# 압축 해제
decompress_backup() {
    local backup_dir="$1"
    
    log_info "백업 압축 해제 중..."
    
    find "$backup_dir" -name "*.gz" | while read file; do
        if [ "$DRY_RUN" = true ]; then
            log_debug "[DRY-RUN] 압축 해제: $file"
        else
            gunzip "$file"
            log_info "  압축 해제: $(basename $file)"
        fi
    done
    
    log_success "백업 압축 해제 완료"
}

# 현재 상태 백업 (복구 전)
create_restore_point() {
    log_info "복구 포인트 생성 중..."
    
    local restore_point_dir="${BACKUP_ROOT}/restore_points/$(date +%Y%m%d_%H%M%S)"
    
    if [ "$DRY_RUN" = true ]; then
        log_debug "[DRY-RUN] 복구 포인트 생성: $restore_point_dir"
        return 0
    fi
    
    mkdir -p "$restore_point_dir"
    
    # 현재 데이터베이스 백업
    PGPASSWORD="$DB_PASSWORD" pg_dump \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --format=custom \
        --no-owner \
        -f "${restore_point_dir}/database_current.sql" 2>/dev/null
    
    # 현재 설정 백업
    if [ -f "${PROJECT_ROOT}/.env.production" ]; then
        cp "${PROJECT_ROOT}/.env.production" "${restore_point_dir}/"
    fi
    
    log_success "복구 포인트 생성 완료: $restore_point_dir"
}

# 데이터베이스 복구
restore_database() {
    local backup_dir="$1"
    
    log_info "데이터베이스 복구 시작..."
    
    # 백업 파일 찾기
    local db_backup=$(find "$backup_dir" -name "database_*.sql" -o -name "database_*.sql.gz" | head -1)
    
    if [ -z "$db_backup" ]; then
        log_error "데이터베이스 백업 파일을 찾을 수 없습니다"
        return 1
    fi
    
    # 압축 해제 (필요한 경우)
    if [[ "$db_backup" == *.gz ]]; then
        gunzip "$db_backup"
        db_backup="${db_backup%.gz}"
    fi
    
    if [ "$DRY_RUN" = true ]; then
        log_debug "[DRY-RUN] 데이터베이스 복구: $db_backup"
        return 0
    fi
    
    # 기존 연결 종료
    log_info "기존 데이터베이스 연결 종료..."
    PGPASSWORD="$DB_PASSWORD" psql \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d postgres \
        -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='$DB_NAME' AND pid <> pg_backend_pid();" \
        2>/dev/null
    
    # 데이터베이스 삭제 및 재생성
    log_info "데이터베이스 재생성..."
    PGPASSWORD="$DB_PASSWORD" psql \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d postgres \
        -c "DROP DATABASE IF EXISTS $DB_NAME; CREATE DATABASE $DB_NAME;" \
        2>/dev/null
    
    # 백업 복원
    log_info "백업 데이터 복원 중..."
    PGPASSWORD="$DB_PASSWORD" pg_restore \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --verbose \
        --no-owner \
        --no-privileges \
        "$db_backup" 2>&1 | while read line; do
            log_debug "  $line"
        done
    
    if [ $? -eq 0 ]; then
        log_success "데이터베이스 복구 완료"
        
        # 테이블 수 확인
        table_count=$(PGPASSWORD="$DB_PASSWORD" psql \
            -h "$DB_HOST" \
            -p "$DB_PORT" \
            -U "$DB_USER" \
            -d "$DB_NAME" \
            -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public'" \
            2>/dev/null | tr -d ' ')
        
        log_info "복구된 테이블 수: $table_count"
    else
        log_error "데이터베이스 복구 실패"
        return 1
    fi
    
    # Redis 복구
    local redis_backup=$(find "$backup_dir" -name "redis_*.rdb" | head -1)
    if [ -n "$redis_backup" ]; then
        log_info "Redis 복구 중..."
        
        if [ "$DRY_RUN" = false ]; then
            # Redis 정지
            redis-cli SHUTDOWN NOSAVE
            sleep 2
            
            # RDB 파일 복사
            cp "$redis_backup" "/var/lib/redis/dump.rdb"
            
            # Redis 재시작
            redis-server --daemonize yes
            
            log_success "Redis 복구 완료"
        fi
    fi
}

# 파일 복구
restore_files() {
    local backup_dir="$1"
    
    log_info "파일 복구 시작..."
    
    # 백업 파일 찾기
    local files_backup=$(find "$backup_dir" -name "files_*.tar" -o -name "files_*.tar.gz" | head -1)
    
    if [ -z "$files_backup" ]; then
        log_error "파일 백업을 찾을 수 없습니다"
        return 1
    fi
    
    if [ "$DRY_RUN" = true ]; then
        log_debug "[DRY-RUN] 파일 복구: $files_backup"
        tar -tf "$files_backup" | head -20
        return 0
    fi
    
    # 기존 파일 백업
    log_info "기존 파일 백업 중..."
    for dir in uploads public/images public/documents; do
        if [ -d "${PROJECT_ROOT}/${dir}" ]; then
            mv "${PROJECT_ROOT}/${dir}" "${PROJECT_ROOT}/${dir}.old"
        fi
    done
    
    # 파일 복원
    log_info "파일 복원 중..."
    tar -xf "$files_backup" -C "$PROJECT_ROOT"
    
    if [ $? -eq 0 ]; then
        log_success "파일 복구 완료"
        
        # 권한 설정
        chmod -R 755 "${PROJECT_ROOT}/uploads"
        
        # 이전 백업 삭제
        for dir in uploads public/images public/documents; do
            if [ -d "${PROJECT_ROOT}/${dir}.old" ]; then
                rm -rf "${PROJECT_ROOT}/${dir}.old"
            fi
        done
    else
        log_error "파일 복구 실패"
        
        # 롤백
        for dir in uploads public/images public/documents; do
            if [ -d "${PROJECT_ROOT}/${dir}.old" ]; then
                mv "${PROJECT_ROOT}/${dir}.old" "${PROJECT_ROOT}/${dir}"
            fi
        done
        
        return 1
    fi
}

# 설정 파일 복구
restore_config() {
    local backup_dir="$1"
    
    log_info "설정 파일 복구 시작..."
    
    # 백업 파일 찾기
    local config_backup=$(find "$backup_dir" -name "config_*.tar" -o -name "config_*.tar.gz" | head -1)
    
    if [ -z "$config_backup" ]; then
        log_error "설정 백업을 찾을 수 없습니다"
        return 1
    fi
    
    if [ "$DRY_RUN" = true ]; then
        log_debug "[DRY-RUN] 설정 복구: $config_backup"
        tar -tf "$config_backup"
        return 0
    fi
    
    # 기존 설정 백업
    log_info "기존 설정 백업 중..."
    mkdir -p "${PROJECT_ROOT}/config.old"
    for file in .env.production next.config.js package.json docker-compose.prod.yml nginx.conf; do
        if [ -f "${PROJECT_ROOT}/${file}" ]; then
            cp "${PROJECT_ROOT}/${file}" "${PROJECT_ROOT}/config.old/"
        fi
    done
    
    # 설정 복원
    log_info "설정 복원 중..."
    tar -xf "$config_backup" -C "$PROJECT_ROOT"
    
    if [ $? -eq 0 ]; then
        log_success "설정 파일 복구 완료"
        
        # 이전 백업 삭제
        rm -rf "${PROJECT_ROOT}/config.old"
    else
        log_error "설정 파일 복구 실패"
        
        # 롤백
        cp "${PROJECT_ROOT}/config.old/"* "${PROJECT_ROOT}/"
        
        return 1
    fi
}

# 복구 후 처리
post_restore_tasks() {
    log_info "복구 후 작업 실행 중..."
    
    if [ "$DRY_RUN" = true ]; then
        log_debug "[DRY-RUN] 복구 후 작업 건너뜀"
        return 0
    fi
    
    # 데이터베이스 마이그레이션
    if [ "$RESTORE_TYPE" = "full" ] || [ "$RESTORE_TYPE" = "db" ]; then
        log_info "데이터베이스 마이그레이션 실행..."
        cd "${PROJECT_ROOT}/backend"
        npx prisma migrate deploy
    fi
    
    # 캐시 클리어
    log_info "캐시 클리어..."
    redis-cli FLUSHALL
    
    # 서비스 재시작
    log_info "서비스 재시작..."
    if [ "$TARGET_ENV" = "prod" ]; then
        sudo systemctl restart digitalbook
        pm2 restart backend
        sudo systemctl restart nginx
    fi
    
    log_success "복구 후 작업 완료"
}

# 복구 확인
verify_restore() {
    log_info "복구 상태 확인 중..."
    
    local checks_passed=0
    local checks_failed=0
    
    # 데이터베이스 연결 확인
    if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1" &>/dev/null; then
        log_success "데이터베이스 연결: OK"
        ((checks_passed++))
    else
        log_error "데이터베이스 연결: FAILED"
        ((checks_failed++))
    fi
    
    # Redis 연결 확인
    if redis-cli ping &>/dev/null; then
        log_success "Redis 연결: OK"
        ((checks_passed++))
    else
        log_error "Redis 연결: FAILED"
        ((checks_failed++))
    fi
    
    # 파일 확인
    if [ -d "${PROJECT_ROOT}/uploads" ]; then
        log_success "업로드 디렉토리: OK"
        ((checks_passed++))
    else
        log_error "업로드 디렉토리: FAILED"
        ((checks_failed++))
    fi
    
    # 애플리케이션 상태 확인
    if curl -f http://localhost:3000/health &>/dev/null; then
        log_success "Frontend 상태: OK"
        ((checks_passed++))
    else
        log_warning "Frontend 상태: NOT RUNNING"
    fi
    
    if curl -f http://localhost:4000/health &>/dev/null; then
        log_success "Backend 상태: OK"
        ((checks_passed++))
    else
        log_warning "Backend 상태: NOT RUNNING"
    fi
    
    echo
    log_info "검증 결과: 성공 $checks_passed / 실패 $checks_failed"
    
    if [ $checks_failed -eq 0 ]; then
        log_success "복구 검증 성공"
        return 0
    else
        log_error "복구 검증 실패"
        return 1
    fi
}

# 메인 복구 프로세스
main() {
    echo "========================================="
    echo "  한국 디지털 교과서 플랫폼 복구"
    echo "========================================="
    echo "시작 시간: $(date)"
    echo "복구 유형: $RESTORE_TYPE"
    echo "대상 환경: $TARGET_ENV"
    echo "드라이런: $DRY_RUN"
    echo "========================================="
    echo
    
    # 백업 디렉토리 찾기
    BACKUP_DIR=$(find_backup_directory)
    log_info "백업 디렉토리: $BACKUP_DIR"
    
    # 메타데이터 읽기
    read_backup_metadata "$BACKUP_DIR"
    
    # 백업 검증
    verify_backup "$BACKUP_DIR" || exit 1
    
    # 사용자 확인
    if [ "$FORCE" = false ] && [ "$DRY_RUN" = false ]; then
        echo
        log_warning "주의: 복구 작업은 현재 데이터를 덮어씁니다!"
        read -p "계속하시겠습니까? (yes/no): " -r
        if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
            log_info "복구 취소됨"
            exit 0
        fi
    fi
    
    # 복구 포인트 생성
    if [ "$DRY_RUN" = false ]; then
        create_restore_point
    fi
    
    # 암호화된 백업 복호화
    if [ "$BACKUP_ENCRYPTED" = "true" ]; then
        decrypt_backup "$BACKUP_DIR"
    fi
    
    # 압축된 백업 해제
    if [ "$BACKUP_COMPRESSED" = "true" ]; then
        decompress_backup "$BACKUP_DIR"
    fi
    
    # 복구 실행
    case "$RESTORE_TYPE" in
        full)
            restore_database "$BACKUP_DIR" || exit 1
            restore_files "$BACKUP_DIR" || exit 1
            restore_config "$BACKUP_DIR" || exit 1
            ;;
        db)
            restore_database "$BACKUP_DIR" || exit 1
            ;;
        files)
            restore_files "$BACKUP_DIR" || exit 1
            ;;
        config)
            restore_config "$BACKUP_DIR" || exit 1
            ;;
        *)
            log_error "알 수 없는 복구 유형: $RESTORE_TYPE"
            exit 1
            ;;
    esac
    
    # 복구 후 작업
    if [ "$DRY_RUN" = false ]; then
        post_restore_tasks
    fi
    
    # 복구 확인
    verify_restore
    
    echo
    echo "========================================="
    echo "  복구 완료"
    echo "========================================="
    echo "백업 소스: $BACKUP_DIR"
    echo "종료 시간: $(date)"
    echo "========================================="
    
    # 복구 로그 저장
    echo "$(date -Iseconds) | RESTORE | $RESTORE_TYPE | $BACKUP_DIR | $TARGET_ENV" >> "${BACKUP_ROOT}/restore.log"
}

# 에러 핸들링
trap 'log_error "복구 중 오류 발생!"; exit 1' ERR

# 메인 함수 실행
main