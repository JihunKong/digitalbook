#!/bin/bash

# =============================================================================
# 한국 디지털 교과서 플랫폼 - 스테이징 환경 배포 스크립트
# =============================================================================
# 사용법: ./scripts/deploy-staging.sh [옵션]
# 옵션:
#   --skip-tests     : 테스트 건너뛰기
#   --skip-build     : 빌드 건너뛰기 (이전 빌드 사용)
#   --rollback       : 이전 버전으로 롤백
#   --health-check   : 헬스체크만 실행
# =============================================================================

set -e  # 에러 발생 시 즉시 중단

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
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# =============================================================================
# 설정
# =============================================================================

# 스테이징 서버 정보
STAGING_HOST="staging.xn--220bu63c.com"
STAGING_USER="ubuntu"
STAGING_KEY="./Korean-Text-Book-Staging.pem"
STAGING_PATH="/home/ubuntu/digitalbook-staging"

# 로컬 경로
PROJECT_ROOT="/Users/jihunkong/DigitalBook"
BUILD_DIR="${PROJECT_ROOT}/build-staging"
BACKUP_DIR="${PROJECT_ROOT}/backups"

# Docker 설정
DOCKER_REGISTRY="your-registry.com"
IMAGE_TAG="staging-$(date +%Y%m%d-%H%M%S)"

# 옵션 파싱
SKIP_TESTS=false
SKIP_BUILD=false
ROLLBACK=false
HEALTH_CHECK_ONLY=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --rollback)
            ROLLBACK=true
            shift
            ;;
        --health-check)
            HEALTH_CHECK_ONLY=true
            shift
            ;;
        *)
            log_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# =============================================================================
# 함수 정의
# =============================================================================

# 환경 확인
check_environment() {
    log_info "환경 확인 중..."
    
    # Git 상태 확인
    if [[ -n $(git status -s) ]]; then
        log_warning "커밋되지 않은 변경사항이 있습니다."
        read -p "계속하시겠습니까? (y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    # SSH 키 확인
    if [ ! -f "$STAGING_KEY" ]; then
        log_error "SSH 키를 찾을 수 없습니다: $STAGING_KEY"
        exit 1
    fi
    
    # 스테이징 서버 연결 테스트
    if ! ssh -i "$STAGING_KEY" -o ConnectTimeout=5 "$STAGING_USER@$STAGING_HOST" "echo 'Connected'" > /dev/null 2>&1; then
        log_error "스테이징 서버에 연결할 수 없습니다"
        exit 1
    fi
    
    log_success "환경 확인 완료"
}

# 테스트 실행
run_tests() {
    if [ "$SKIP_TESTS" = true ]; then
        log_warning "테스트를 건너뜁니다"
        return
    fi
    
    log_info "테스트 실행 중..."
    
    # Backend 테스트
    cd "$PROJECT_ROOT/backend"
    npm test
    
    # Frontend 테스트
    cd "$PROJECT_ROOT"
    npm test
    
    # E2E 테스트 (스테이징 환경용)
    npm run test:e2e:staging
    
    log_success "모든 테스트 통과"
}

# 빌드
build_application() {
    if [ "$SKIP_BUILD" = true ]; then
        log_warning "빌드를 건너뜁니다"
        return
    fi
    
    log_info "애플리케이션 빌드 중..."
    
    # 빌드 디렉토리 생성
    rm -rf "$BUILD_DIR"
    mkdir -p "$BUILD_DIR"
    
    # Frontend 빌드
    cd "$PROJECT_ROOT"
    NODE_ENV=staging npm run build
    cp -r .next "$BUILD_DIR/"
    cp -r public "$BUILD_DIR/"
    cp package.json "$BUILD_DIR/"
    cp package-lock.json "$BUILD_DIR/"
    cp next.config.js "$BUILD_DIR/"
    
    # Backend 빌드
    cd "$PROJECT_ROOT/backend"
    NODE_ENV=staging npm run build
    cp -r dist "$BUILD_DIR/backend/"
    cp -r prisma "$BUILD_DIR/backend/"
    cp package.json "$BUILD_DIR/backend/"
    cp package-lock.json "$BUILD_DIR/backend/"
    
    # 환경변수 파일 생성 (스테이징용)
    cat > "$BUILD_DIR/.env.staging" << EOF
NODE_ENV=staging
PORT=4000
FRONTEND_PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/digitalbook_staging
REDIS_URL=redis://localhost:6379
JWT_SECRET=${STAGING_JWT_SECRET}
JWT_REFRESH_SECRET=${STAGING_JWT_REFRESH_SECRET}
NEXT_PUBLIC_API_URL=https://api-staging.xn--220bu63c.com
NEXT_PUBLIC_SITE_URL=https://staging.xn--220bu63c.com
EOF
    
    log_success "빌드 완료"
}

# Docker 이미지 빌드
build_docker_images() {
    log_info "Docker 이미지 빌드 중..."
    
    cd "$PROJECT_ROOT"
    
    # Frontend 이미지
    docker build -f Dockerfile.frontend \
        --build-arg NODE_ENV=staging \
        -t "${DOCKER_REGISTRY}/digitalbook-frontend:${IMAGE_TAG}" \
        -t "${DOCKER_REGISTRY}/digitalbook-frontend:staging-latest" \
        .
    
    # Backend 이미지
    docker build -f backend/Dockerfile \
        --build-arg NODE_ENV=staging \
        -t "${DOCKER_REGISTRY}/digitalbook-backend:${IMAGE_TAG}" \
        -t "${DOCKER_REGISTRY}/digitalbook-backend:staging-latest" \
        ./backend
    
    log_success "Docker 이미지 빌드 완료"
}

# 배포 패키지 생성
create_deployment_package() {
    log_info "배포 패키지 생성 중..."
    
    cd "$BUILD_DIR"
    
    # docker-compose 파일 생성 (스테이징용)
    cat > docker-compose.staging.yml << 'EOF'
version: '3.8'

services:
  frontend:
    image: ${DOCKER_REGISTRY}/digitalbook-frontend:staging-latest
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=staging
    env_file:
      - .env.staging
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  backend:
    image: ${DOCKER_REGISTRY}/digitalbook-backend:staging-latest
    restart: unless-stopped
    ports:
      - "4000:4000"
    environment:
      - NODE_ENV=staging
    env_file:
      - .env.staging
    depends_on:
      - postgres
      - redis
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:4000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  postgres:
    image: postgres:15-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: digitalbook_staging
      POSTGRES_USER: dbuser
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data_staging:/var/lib/postgresql/data
    ports:
      - "5433:5432"

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    ports:
      - "6380:6379"
    volumes:
      - redis_data_staging:/data

  nginx:
    image: nginx:alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx-staging.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - frontend
      - backend

volumes:
  postgres_data_staging:
  redis_data_staging:
EOF
    
    # 배포 스크립트 생성
    cat > deploy.sh << 'EOF'
#!/bin/bash
set -e

echo "스테이징 환경 배포 시작..."

# Docker 이미지 Pull
docker-compose -f docker-compose.staging.yml pull

# 이전 버전 백업
docker-compose -f docker-compose.staging.yml down
docker tag digitalbook-frontend:staging-latest digitalbook-frontend:staging-backup || true
docker tag digitalbook-backend:staging-latest digitalbook-backend:staging-backup || true

# 새 버전 배포
docker-compose -f docker-compose.staging.yml up -d

# 헬스체크
sleep 10
if curl -f http://localhost:3000/health && curl -f http://localhost:4000/health; then
    echo "배포 성공!"
else
    echo "헬스체크 실패! 롤백 중..."
    docker-compose -f docker-compose.staging.yml down
    docker tag digitalbook-frontend:staging-backup digitalbook-frontend:staging-latest
    docker tag digitalbook-backend:staging-backup digitalbook-backend:staging-latest
    docker-compose -f docker-compose.staging.yml up -d
    exit 1
fi

# 마이그레이션 실행
docker-compose -f docker-compose.staging.yml exec backend npx prisma migrate deploy

echo "스테이징 배포 완료!"
EOF
    
    chmod +x deploy.sh
    
    # 패키지 압축
    tar -czf "${PROJECT_ROOT}/staging-deploy-${IMAGE_TAG}.tar.gz" .
    
    log_success "배포 패키지 생성 완료: staging-deploy-${IMAGE_TAG}.tar.gz"
}

# 스테이징 서버로 배포
deploy_to_staging() {
    log_info "스테이징 서버로 배포 중..."
    
    # 배포 패키지 전송
    scp -i "$STAGING_KEY" \
        "${PROJECT_ROOT}/staging-deploy-${IMAGE_TAG}.tar.gz" \
        "$STAGING_USER@$STAGING_HOST:/tmp/"
    
    # 스테이징 서버에서 배포 실행
    ssh -i "$STAGING_KEY" "$STAGING_USER@$STAGING_HOST" << EOF
        set -e
        
        # 백업 생성
        if [ -d "$STAGING_PATH" ]; then
            sudo tar -czf "/backup/staging-backup-\$(date +%Y%m%d-%H%M%S).tar.gz" "$STAGING_PATH"
        fi
        
        # 배포 디렉토리 준비
        sudo mkdir -p "$STAGING_PATH"
        cd "$STAGING_PATH"
        
        # 패키지 압축 해제
        sudo tar -xzf "/tmp/staging-deploy-${IMAGE_TAG}.tar.gz"
        
        # 배포 실행
        sudo ./deploy.sh
        
        # 임시 파일 정리
        rm -f "/tmp/staging-deploy-${IMAGE_TAG}.tar.gz"
EOF
    
    log_success "스테이징 서버 배포 완료"
}

# 헬스체크
health_check() {
    log_info "헬스체크 실행 중..."
    
    # API 헬스체크
    if curl -f "https://api-staging.xn--220bu63c.com/health" > /dev/null 2>&1; then
        log_success "API 서버: 정상"
    else
        log_error "API 서버: 응답 없음"
        return 1
    fi
    
    # Frontend 헬스체크
    if curl -f "https://staging.xn--220bu63c.com" > /dev/null 2>&1; then
        log_success "Frontend: 정상"
    else
        log_error "Frontend: 응답 없음"
        return 1
    fi
    
    # Database 연결 테스트
    ssh -i "$STAGING_KEY" "$STAGING_USER@$STAGING_HOST" \
        "docker-compose -f $STAGING_PATH/docker-compose.staging.yml exec postgres pg_isready" > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        log_success "Database: 정상"
    else
        log_error "Database: 연결 실패"
        return 1
    fi
    
    log_success "모든 서비스 정상 작동 중"
}

# 롤백
rollback() {
    log_warning "이전 버전으로 롤백 중..."
    
    ssh -i "$STAGING_KEY" "$STAGING_USER@$STAGING_HOST" << EOF
        cd "$STAGING_PATH"
        docker-compose -f docker-compose.staging.yml down
        docker tag digitalbook-frontend:staging-backup digitalbook-frontend:staging-latest
        docker tag digitalbook-backend:staging-backup digitalbook-backend:staging-latest
        docker-compose -f docker-compose.staging.yml up -d
EOF
    
    log_success "롤백 완료"
}

# 알림 전송
send_notification() {
    local status=$1
    local message=$2
    
    # Slack 웹훅 (설정된 경우)
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST "$SLACK_WEBHOOK_URL" \
            -H 'Content-Type: application/json' \
            -d "{\"text\":\"[Staging Deploy] ${status}: ${message}\"}"
    fi
    
    # 이메일 알림 (설정된 경우)
    if [ -n "$NOTIFICATION_EMAIL" ]; then
        echo "$message" | mail -s "[Staging Deploy] $status" "$NOTIFICATION_EMAIL"
    fi
}

# =============================================================================
# 메인 실행
# =============================================================================

main() {
    echo "========================================="
    echo "  한국 디지털 교과서 플랫폼"
    echo "  스테이징 환경 배포"
    echo "========================================="
    echo "시작 시간: $(date)"
    echo "========================================="
    
    # 헬스체크만 실행
    if [ "$HEALTH_CHECK_ONLY" = true ]; then
        health_check
        exit $?
    fi
    
    # 롤백 실행
    if [ "$ROLLBACK" = true ]; then
        rollback
        health_check
        exit $?
    fi
    
    # 정상 배포 프로세스
    check_environment
    run_tests
    build_application
    build_docker_images
    create_deployment_package
    deploy_to_staging
    health_check
    
    # 성공 알림
    send_notification "SUCCESS" "스테이징 배포가 성공적으로 완료되었습니다. (${IMAGE_TAG})"
    
    echo "========================================="
    echo "  배포 완료!"
    echo "  URL: https://staging.xn--220bu63c.com"
    echo "  종료 시간: $(date)"
    echo "========================================="
}

# 에러 핸들링
trap 'log_error "배포 중 오류 발생!"; send_notification "FAILED" "스테이징 배포 실패 (${IMAGE_TAG})"; exit 1' ERR

# 메인 함수 실행
main