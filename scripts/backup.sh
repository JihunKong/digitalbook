#!/bin/bash

# =============================================================================
# 한국 디지털 교과서 플랫폼 - 백업 스크립트
# =============================================================================
# 사용법: ./scripts/backup.sh [옵션]
# 옵션:
#   --type [full|db|files|config]  : 백업 유형 (기본: full)
#   --compress                     : 백업 압축 (gzip)
#   --encrypt                      : 백업 암호화
#   --remote                       : 원격 저장소로 업로드
#   --retention <days>             : 보관 기간 (기본: 30일)
# =============================================================================

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# 설정
PROJECT_ROOT="/Users/jihunkong/DigitalBook"
BACKUP_ROOT="${PROJECT_ROOT}/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_TYPE="full"
COMPRESS=false
ENCRYPT=false
REMOTE_UPLOAD=false
RETENTION_DAYS=30

# 원격 저장소 설정 (S3, GCS, etc.)
REMOTE_BUCKET="s3://digitalbook-backups"
AWS_PROFILE="digitalbook"

# 데이터베이스 설정
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-digitalbook}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-postgres}"

# 옵션 파싱
while [[ $# -gt 0 ]]; do
    case $1 in
        --type)
            BACKUP_TYPE="$2"
            shift 2
            ;;
        --compress)
            COMPRESS=true
            shift
            ;;
        --encrypt)
            ENCRYPT=true
            shift
            ;;
        --remote)
            REMOTE_UPLOAD=true
            shift
            ;;
        --retention)
            RETENTION_DAYS="$2"
            shift 2
            ;;
        *)
            log_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# 백업 디렉토리 생성
create_backup_directory() {
    local backup_dir="${BACKUP_ROOT}/${TIMESTAMP}"
    mkdir -p "$backup_dir"
    echo "$backup_dir"
}

# 데이터베이스 백업
backup_database() {
    log_info "데이터베이스 백업 시작..."
    
    local backup_dir="$1"
    local db_backup_file="${backup_dir}/database_${TIMESTAMP}.sql"
    
    # PostgreSQL 백업
    PGPASSWORD="$DB_PASSWORD" pg_dump \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --verbose \
        --format=custom \
        --no-owner \
        --no-privileges \
        --schema=public \
        -f "$db_backup_file" 2>&1 | while read line; do
            log_info "  $line"
        done
    
    if [ $? -eq 0 ]; then
        local size=$(du -h "$db_backup_file" | cut -f1)
        log_success "데이터베이스 백업 완료 (크기: $size)"
        
        # 백업 검증
        pg_restore --list "$db_backup_file" > /dev/null 2>&1
        if [ $? -eq 0 ]; then
            log_success "데이터베이스 백업 검증 성공"
        else
            log_error "데이터베이스 백업 검증 실패"
            return 1
        fi
    else
        log_error "데이터베이스 백업 실패"
        return 1
    fi
    
    # Redis 백업
    if command -v redis-cli &> /dev/null; then
        log_info "Redis 백업 시작..."
        
        # Redis 스냅샷 생성
        redis-cli BGSAVE
        sleep 5  # 스냅샷 생성 대기
        
        # RDB 파일 복사
        local redis_dump="/var/lib/redis/dump.rdb"
        if [ -f "$redis_dump" ]; then
            cp "$redis_dump" "${backup_dir}/redis_${TIMESTAMP}.rdb"
            log_success "Redis 백업 완료"
        else
            log_warning "Redis 덤프 파일을 찾을 수 없습니다"
        fi
    fi
}

# 파일 백업
backup_files() {
    log_info "파일 백업 시작..."
    
    local backup_dir="$1"
    local files_backup="${backup_dir}/files_${TIMESTAMP}.tar"
    
    # 백업할 디렉토리 목록
    local dirs_to_backup=(
        "uploads"
        "public/images"
        "public/documents"
    )
    
    # tar 아카이브 생성
    tar_command="tar -cf $files_backup"
    
    for dir in "${dirs_to_backup[@]}"; do
        if [ -d "${PROJECT_ROOT}/${dir}" ]; then
            tar_command="$tar_command -C ${PROJECT_ROOT} ${dir}"
            log_info "  추가: ${dir}"
        else
            log_warning "  디렉토리 없음: ${dir}"
        fi
    done
    
    # 실행
    eval $tar_command
    
    if [ $? -eq 0 ]; then
        local size=$(du -h "$files_backup" | cut -f1)
        log_success "파일 백업 완료 (크기: $size)"
    else
        log_error "파일 백업 실패"
        return 1
    fi
}

# 설정 파일 백업
backup_config() {
    log_info "설정 파일 백업 시작..."
    
    local backup_dir="$1"
    local config_backup="${backup_dir}/config_${TIMESTAMP}.tar"
    
    # 백업할 설정 파일 목록
    local config_files=(
        ".env.production"
        "next.config.js"
        "package.json"
        "package-lock.json"
        "backend/package.json"
        "backend/package-lock.json"
        "backend/prisma/schema.prisma"
        "docker-compose.prod.yml"
        "nginx.conf"
    )
    
    # tar 아카이브 생성
    tar_command="tar -cf $config_backup"
    
    for file in "${config_files[@]}"; do
        if [ -f "${PROJECT_ROOT}/${file}" ]; then
            tar_command="$tar_command -C ${PROJECT_ROOT} ${file}"
            log_info "  추가: ${file}"
        else
            log_warning "  파일 없음: ${file}"
        fi
    done
    
    # 실행
    eval $tar_command
    
    if [ $? -eq 0 ]; then
        log_success "설정 파일 백업 완료"
    else
        log_error "설정 파일 백업 실패"
        return 1
    fi
}

# 백업 압축
compress_backup() {
    local backup_dir="$1"
    
    log_info "백업 압축 중..."
    
    # gzip 압축
    find "$backup_dir" -type f ! -name "*.gz" -exec gzip {} \;
    
    if [ $? -eq 0 ]; then
        log_success "백업 압축 완료"
        
        # 압축 후 크기 확인
        local total_size=$(du -sh "$backup_dir" | cut -f1)
        log_info "압축된 백업 크기: $total_size"
    else
        log_error "백업 압축 실패"
        return 1
    fi
}

# 백업 암호화
encrypt_backup() {
    local backup_dir="$1"
    
    log_info "백업 암호화 중..."
    
    # GPG 암호화 (대칭키 방식)
    local passphrase="${BACKUP_ENCRYPTION_KEY:-DefaultBackupKey123!}"
    
    find "$backup_dir" -type f ! -name "*.gpg" | while read file; do
        gpg --batch --yes --passphrase "$passphrase" \
            --cipher-algo AES256 \
            --symmetric \
            --output "${file}.gpg" \
            "$file"
        
        if [ $? -eq 0 ]; then
            rm "$file"  # 원본 파일 삭제
            log_info "  암호화: $(basename $file)"
        else
            log_error "  암호화 실패: $(basename $file)"
        fi
    done
    
    log_success "백업 암호화 완료"
}

# 원격 저장소 업로드
upload_to_remote() {
    local backup_dir="$1"
    
    log_info "원격 저장소로 업로드 중..."
    
    # AWS S3 업로드
    if command -v aws &> /dev/null; then
        aws s3 sync "$backup_dir" "${REMOTE_BUCKET}/${TIMESTAMP}/" \
            --profile "$AWS_PROFILE" \
            --storage-class STANDARD_IA \
            --metadata "backup-type=${BACKUP_TYPE},retention-days=${RETENTION_DAYS}"
        
        if [ $? -eq 0 ]; then
            log_success "원격 저장소 업로드 완료"
            
            # 업로드 검증
            remote_files=$(aws s3 ls "${REMOTE_BUCKET}/${TIMESTAMP}/" --profile "$AWS_PROFILE" | wc -l)
            local_files=$(find "$backup_dir" -type f | wc -l)
            
            if [ "$remote_files" -eq "$local_files" ]; then
                log_success "업로드 검증 성공 (파일 수: $remote_files)"
            else
                log_warning "업로드 검증 실패 (로컬: $local_files, 원격: $remote_files)"
            fi
        else
            log_error "원격 저장소 업로드 실패"
            return 1
        fi
    else
        log_error "AWS CLI가 설치되지 않았습니다"
        return 1
    fi
}

# 오래된 백업 정리
cleanup_old_backups() {
    log_info "오래된 백업 정리 중..."
    
    # 로컬 백업 정리
    find "$BACKUP_ROOT" -maxdepth 1 -type d -mtime +$RETENTION_DAYS | while read dir; do
        if [ "$dir" != "$BACKUP_ROOT" ]; then
            rm -rf "$dir"
            log_info "  삭제: $(basename $dir)"
        fi
    done
    
    # 원격 백업 정리 (S3)
    if [ "$REMOTE_UPLOAD" = true ] && command -v aws &> /dev/null; then
        aws s3 ls "$REMOTE_BUCKET/" --profile "$AWS_PROFILE" | \
        while read -r date time size name; do
            backup_date=$(echo $name | cut -d'_' -f1)
            if [ -n "$backup_date" ]; then
                days_old=$(( ($(date +%s) - $(date -d $backup_date +%s 2>/dev/null || echo 0)) / 86400 ))
                if [ $days_old -gt $RETENTION_DAYS ]; then
                    aws s3 rm --recursive "${REMOTE_BUCKET}/${name}" --profile "$AWS_PROFILE"
                    log_info "  원격 삭제: $name"
                fi
            fi
        done
    fi
    
    log_success "백업 정리 완료"
}

# 백업 메타데이터 생성
create_backup_metadata() {
    local backup_dir="$1"
    
    cat > "${backup_dir}/metadata.json" << EOF
{
  "timestamp": "${TIMESTAMP}",
  "type": "${BACKUP_TYPE}",
  "compressed": ${COMPRESS},
  "encrypted": ${ENCRYPT},
  "retention_days": ${RETENTION_DAYS},
  "project_root": "${PROJECT_ROOT}",
  "database": {
    "host": "${DB_HOST}",
    "port": "${DB_PORT}",
    "name": "${DB_NAME}"
  },
  "files": $(find "$backup_dir" -type f -exec basename {} \; | jq -R . | jq -s .),
  "total_size": "$(du -sh "$backup_dir" | cut -f1)",
  "created_at": "$(date -Iseconds)",
  "created_by": "$(whoami)",
  "hostname": "$(hostname)"
}
EOF
    
    log_info "백업 메타데이터 생성됨"
}

# 백업 알림 전송
send_notification() {
    local status="$1"
    local message="$2"
    local backup_dir="$3"
    
    # Slack 웹훅 (설정된 경우)
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        local color="good"
        [ "$status" = "ERROR" ] && color="danger"
        [ "$status" = "WARNING" ] && color="warning"
        
        curl -X POST "$SLACK_WEBHOOK_URL" \
            -H 'Content-Type: application/json' \
            -d "{
                \"attachments\": [{
                    \"color\": \"$color\",
                    \"title\": \"백업 알림 - $status\",
                    \"text\": \"$message\",
                    \"fields\": [
                        {\"title\": \"타입\", \"value\": \"$BACKUP_TYPE\", \"short\": true},
                        {\"title\": \"시간\", \"value\": \"$TIMESTAMP\", \"short\": true}
                    ]
                }]
            }" 2>/dev/null
    fi
    
    # 이메일 알림 (설정된 경우)
    if [ -n "$NOTIFICATION_EMAIL" ]; then
        echo "$message" | mail -s "[Backup $status] Digital Textbook Platform" "$NOTIFICATION_EMAIL"
    fi
}

# 메인 백업 프로세스
main() {
    echo "========================================="
    echo "  한국 디지털 교과서 플랫폼 백업"
    echo "========================================="
    echo "시작 시간: $(date)"
    echo "백업 유형: $BACKUP_TYPE"
    echo "압축: $COMPRESS"
    echo "암호화: $ENCRYPT"
    echo "원격 업로드: $REMOTE_UPLOAD"
    echo "========================================="
    
    # 백업 디렉토리 생성
    BACKUP_DIR=$(create_backup_directory)
    log_info "백업 디렉토리: $BACKUP_DIR"
    
    # 백업 실행
    case "$BACKUP_TYPE" in
        full)
            backup_database "$BACKUP_DIR" || exit 1
            backup_files "$BACKUP_DIR" || exit 1
            backup_config "$BACKUP_DIR" || exit 1
            ;;
        db)
            backup_database "$BACKUP_DIR" || exit 1
            ;;
        files)
            backup_files "$BACKUP_DIR" || exit 1
            ;;
        config)
            backup_config "$BACKUP_DIR" || exit 1
            ;;
        *)
            log_error "알 수 없는 백업 유형: $BACKUP_TYPE"
            exit 1
            ;;
    esac
    
    # 압축
    if [ "$COMPRESS" = true ]; then
        compress_backup "$BACKUP_DIR" || exit 1
    fi
    
    # 암호화
    if [ "$ENCRYPT" = true ]; then
        encrypt_backup "$BACKUP_DIR" || exit 1
    fi
    
    # 메타데이터 생성
    create_backup_metadata "$BACKUP_DIR"
    
    # 원격 업로드
    if [ "$REMOTE_UPLOAD" = true ]; then
        upload_to_remote "$BACKUP_DIR" || exit 1
    fi
    
    # 오래된 백업 정리
    cleanup_old_backups
    
    # 최종 크기 확인
    FINAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
    
    echo "========================================="
    echo "  백업 완료"
    echo "========================================="
    echo "백업 위치: $BACKUP_DIR"
    echo "백업 크기: $FINAL_SIZE"
    echo "종료 시간: $(date)"
    echo "========================================="
    
    # 알림 전송
    send_notification "SUCCESS" "백업이 성공적으로 완료되었습니다. (크기: $FINAL_SIZE)" "$BACKUP_DIR"
    
    # 백업 로그 저장
    echo "$(date -Iseconds) | SUCCESS | $BACKUP_TYPE | $BACKUP_DIR | $FINAL_SIZE" >> "${BACKUP_ROOT}/backup.log"
}

# 에러 핸들링
trap 'log_error "백업 중 오류 발생!"; send_notification "ERROR" "백업 중 오류가 발생했습니다" "$BACKUP_DIR"; exit 1' ERR

# 메인 함수 실행
main