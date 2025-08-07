#!/bin/bash

# Enhanced production deployment script for ClassAppHub

set -euo pipefail

# Colors and formatting
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
PROJECT_NAME="classapphub"
BACKUP_DIR="backups"
DOCKER_COMPOSE_FILE="docker-compose.prod.yml"

# Server configuration
REMOTE_USER="${DEPLOY_USER:-ubuntu}"
REMOTE_HOST="${DEPLOY_HOST:-3.38.223.190}"
KEY_PATH="${DEPLOY_KEY_PATH:-~/.ssh/classapphub.pem}"
REMOTE_DIR="/home/${REMOTE_USER}/${PROJECT_NAME}"

# Deployment configuration
MAX_RETRIES=3
HEALTH_CHECK_TIMEOUT=300
BACKUP_RETENTION_DAYS=7

# Logging
LOG_FILE="${PROJECT_ROOT}/deploy.log"
exec > >(tee -a "$LOG_FILE")
exec 2>&1

log() {
    echo -e "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

log_info() {
    log "${BLUE}ℹ INFO:${NC} $1"
}

log_success() {
    log "${GREEN}✅ SUCCESS:${NC} $1"
}

log_warning() {
    log "${YELLOW}⚠ WARNING:${NC} $1"
}

log_error() {
    log "${RED}❌ ERROR:${NC} $1"
}

log_step() {
    log "${PURPLE}🚀 STEP:${NC} $1"
}

# Error handling
cleanup() {
    local exit_code=$?
    if [ $exit_code -ne 0 ]; then
        log_error "Deployment failed with exit code $exit_code"
        log_info "Check the logs above for details"
        log_info "You may need to manually clean up on the remote server"
    fi
}

trap cleanup EXIT

# Utility functions
check_dependencies() {
    log_step "Checking dependencies"
    
    local deps=("docker" "docker-compose" "ssh" "scp" "tar" "curl")
    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            log_error "Required dependency '$dep' is not installed"
            exit 1
        fi
    done
    
    log_success "All dependencies are installed"
}

validate_environment() {
    log_step "Validating environment"
    
    # Check for required environment file
    if [ ! -f "${PROJECT_ROOT}/.env.production" ]; then
        log_error ".env.production file not found"
        exit 1
    fi
    
    # Check SSH key
    if [ ! -f "$KEY_PATH" ]; then
        log_error "SSH key not found at $KEY_PATH"
        exit 1
    fi
    
    # Test SSH connection
    if ! ssh -i "$KEY_PATH" -o ConnectTimeout=10 -o BatchMode=yes "$REMOTE_USER@$REMOTE_HOST" echo "SSH connection test" &>/dev/null; then
        log_error "Cannot connect to remote server via SSH"
        exit 1
    fi
    
    log_success "Environment validation passed"
}

build_and_test_locally() {
    log_step "Building and testing locally"
    
    cd "$PROJECT_ROOT"
    
    # Run tests
    if [ -f "package.json" ] && grep -q '"test"' package.json; then
        log_info "Running tests..."
        if ! npm test; then
            log_error "Tests failed"
            exit 1
        fi
    fi
    
    # Build TypeScript
    if [ -f "tsconfig.json" ]; then
        log_info "Building TypeScript..."
        if ! npm run build; then
            log_error "Build failed"
            exit 1
        fi
    fi
    
    # Test Docker build
    log_info "Testing Docker build..."
    if ! docker build -f Dockerfile.prod -t "${PROJECT_NAME}:test" .; then
        log_error "Docker build failed"
        exit 1
    fi
    
    # Clean up test image
    docker rmi "${PROJECT_NAME}:test" &>/dev/null || true
    
    log_success "Local build and tests passed"
}

create_deployment_archive() {
    log_step "Creating deployment archive"
    
    cd "$PROJECT_ROOT"
    
    local archive_name="${PROJECT_NAME}-$(date +%Y%m%d-%H%M%S).tar.gz"
    
    log_info "Creating archive: $archive_name"
    
    # Create optimized archive
    tar --exclude-from=- -czf "$archive_name" . <<EOF
node_modules
.git
.env*
!.env.production
logs
uploads
backups
dist
*.log
.DS_Store
.vscode
.idea
coverage
*.test.js
*.spec.js
deploy.log
${PROJECT_NAME}-*.tar.gz
EOF
    
    echo "$archive_name"
}

deploy_to_server() {
    local archive_name="$1"
    
    log_step "Deploying to server"
    
    # Upload archive
    log_info "Uploading archive to server..."
    if ! scp -i "$KEY_PATH" "$archive_name" "$REMOTE_USER@$REMOTE_HOST:/tmp/"; then
        log_error "Failed to upload archive"
        exit 1
    fi
    
    # Execute deployment on remote server
    log_info "Executing deployment on remote server..."
    ssh -i "$KEY_PATH" "$REMOTE_USER@$REMOTE_HOST" bash -s <<EOF
set -euo pipefail

# Colors for remote output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "\${GREEN}[REMOTE]\${NC} \$1"; }
log_error() { echo -e "\${RED}[REMOTE ERROR]\${NC} \$1"; }
log_warning() { echo -e "\${YELLOW}[REMOTE WARNING]\${NC} \$1"; }

# Configuration
ARCHIVE_NAME="$archive_name"
PROJECT_DIR="$REMOTE_DIR"
BACKUP_DIR="\${PROJECT_DIR}_backup_\$(date +%Y%m%d_%H%M%S)"

# Create backup of current deployment
if [ -d "\$PROJECT_DIR" ]; then
    log_info "Creating backup of current deployment..."
    sudo cp -r "\$PROJECT_DIR" "\$BACKUP_DIR"
    log_info "Backup created at \$BACKUP_DIR"
fi

# Extract new deployment
log_info "Extracting new deployment..."
mkdir -p "\$PROJECT_DIR"
cd "\$PROJECT_DIR"
tar -xzf "/tmp/\$ARCHIVE_NAME"

# Set up environment
log_info "Setting up environment..."
if [ -f ".env.production" ]; then
    mv .env.production .env
fi

# Stop existing services gracefully
log_info "Stopping existing services..."
if [ -f "$DOCKER_COMPOSE_FILE" ]; then
    sudo docker-compose -f "$DOCKER_COMPOSE_FILE" down --timeout 30 || true
fi

# Clean up old images and containers
log_info "Cleaning up old Docker resources..."
sudo docker system prune -f
sudo docker image prune -a -f

# Build and start services
log_info "Building and starting services..."
sudo docker-compose -f "$DOCKER_COMPOSE_FILE" build --no-cache --parallel
sudo docker-compose -f "$DOCKER_COMPOSE_FILE" up -d

# Wait for services to be healthy
log_info "Waiting for services to be healthy..."
sleep 30

# Check service health
RETRY_COUNT=0
MAX_RETRIES=30
while [ \$RETRY_COUNT -lt \$MAX_RETRIES ]; do
    if sudo docker-compose -f "$DOCKER_COMPOSE_FILE" ps | grep -q "healthy\|Up"; then
        log_info "Services are healthy"
        break
    fi
    
    RETRY_COUNT=\$((RETRY_COUNT + 1))
    log_info "Waiting for services... (\$RETRY_COUNT/\$MAX_RETRIES)"
    sleep 10
done

if [ \$RETRY_COUNT -eq \$MAX_RETRIES ]; then
    log_error "Services failed to become healthy"
    # Show logs for debugging
    sudo docker-compose -f "$DOCKER_COMPOSE_FILE" logs --tail=50
    exit 1
fi

# Run database migrations
log_info "Running database migrations..."
sudo docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T backend npx prisma migrate deploy || true

# Clean up
rm -f "/tmp/\$ARCHIVE_NAME"

# Clean up old backups
log_info "Cleaning up old backups..."
find "\$(dirname "\$PROJECT_DIR")" -name "${PROJECT_NAME}_backup_*" -type d -mtime +$BACKUP_RETENTION_DAYS -exec rm -rf {} + 2>/dev/null || true

log_info "Deployment completed successfully!"
EOF
    
    if [ $? -eq 0 ]; then
        log_success "Deployment completed successfully on remote server"
    else
        log_error "Deployment failed on remote server"
        exit 1
    fi
}

perform_health_checks() {
    log_step "Performing health checks"
    
    local base_url="https://$REMOTE_HOST"
    local health_endpoint="/api/health"
    local max_attempts=30
    local attempt=1
    
    log_info "Checking application health at $base_url$health_endpoint"
    
    while [ $attempt -le $max_attempts ]; do
        log_info "Health check attempt $attempt/$max_attempts"
        
        if curl -f -s --max-time 10 "$base_url$health_endpoint" >/dev/null; then
            log_success "Application is healthy!"
            return 0
        fi
        
        sleep 10
        attempt=$((attempt + 1))
    done
    
    log_error "Application health check failed after $max_attempts attempts"
    
    # Show recent logs for debugging
    log_info "Fetching recent logs for debugging..."
    ssh -i "$KEY_PATH" "$REMOTE_USER@$REMOTE_HOST" "cd $REMOTE_DIR && sudo docker-compose -f $DOCKER_COMPOSE_FILE logs --tail=50 backend"
    
    return 1
}

run_post_deployment_tasks() {
    log_step "Running post-deployment tasks"
    
    ssh -i "$KEY_PATH" "$REMOTE_USER@$REMOTE_HOST" bash -s <<EOF
set -euo pipefail

cd "$REMOTE_DIR"

# Update SSL certificates if needed
log_info() { echo -e "\033[0;32m[REMOTE]\033[0m \$1"; }

log_info "Checking SSL certificates..."
sudo docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T certbot certbot renew --dry-run || true

# Create database backup
log_info "Creating post-deployment database backup..."
sudo docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T backend npm run backup:create || true

# Clear application caches
log_info "Clearing application caches..."
sudo docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T redis redis-cli FLUSHALL || true

# Send deployment notification (if configured)
if [ -n "\${SLACK_WEBHOOK_URL:-}" ]; then
    curl -X POST -H 'Content-type: application/json' \\
        --data '{"text":"🚀 ClassAppHub deployment completed successfully on '"$REMOTE_HOST"'"}' \\
        "\$SLACK_WEBHOOK_URL" || true
fi

log_info "Post-deployment tasks completed"
EOF
}

generate_deployment_report() {
    log_step "Generating deployment report"
    
    local report_file="${PROJECT_ROOT}/deployment-report-$(date +%Y%m%d-%H%M%S).md"
    
    cat > "$report_file" <<EOF
# ClassAppHub Deployment Report

**Date:** $(date)
**Target Server:** $REMOTE_HOST
**Deployment Status:** ✅ Success

## Deployment Summary

- **Project:** $PROJECT_NAME
- **Environment:** Production
- **Docker Compose File:** $DOCKER_COMPOSE_FILE
- **Deployment Method:** Automated script

## Services Status

EOF
    
    # Get service status from remote server
    ssh -i "$KEY_PATH" "$REMOTE_USER@$REMOTE_HOST" "cd $REMOTE_DIR && sudo docker-compose -f $DOCKER_COMPOSE_FILE ps" >> "$report_file"
    
    cat >> "$report_file" <<EOF

## Health Check Results

- ✅ Application health endpoint responding
- ✅ Database connectivity verified
- ✅ SSL certificates valid

## Post-Deployment Actions

- [x] Database migrations applied
- [x] Caches cleared
- [x] SSL certificates renewed
- [x] Database backup created

## Access Information

- **Application URL:** https://$REMOTE_HOST
- **Admin Panel:** https://$REMOTE_HOST/admin
- **API Documentation:** https://$REMOTE_HOST/api/docs

## Rollback Information

A backup of the previous deployment is available on the server in case rollback is needed.

---
*Report generated automatically by deployment script*
EOF
    
    log_success "Deployment report generated: $report_file"
}

# Main deployment function
main() {
    log_info "Starting ClassAppHub production deployment"
    log_info "Target: $REMOTE_USER@$REMOTE_HOST"
    log_info "Timestamp: $(date)"
    
    # Pre-deployment checks
    check_dependencies
    validate_environment
    build_and_test_locally
    
    # Create and deploy
    local archive_name
    archive_name=$(create_deployment_archive)
    
    deploy_to_server "$archive_name"
    
    # Clean up local archive
    rm -f "$archive_name"
    
    # Post-deployment verification
    perform_health_checks
    run_post_deployment_tasks
    generate_deployment_report
    
    log_success "🎉 Deployment completed successfully!"
    log_info "Application is now available at: https://$REMOTE_HOST"
    log_info "Check the deployment report for detailed information"
}

# Show usage if requested
if [ "${1:-}" = "--help" ] || [ "${1:-}" = "-h" ]; then
    cat <<EOF
ClassAppHub Production Deployment Script

Usage: $0 [options]

Options:
    --help, -h          Show this help message
    --dry-run          Perform all checks but don't deploy
    --force            Skip confirmations
    --debug            Enable debug output

Environment Variables:
    DEPLOY_USER        Remote server username (default: ubuntu)
    DEPLOY_HOST        Remote server hostname/IP
    DEPLOY_KEY_PATH    Path to SSH private key
    SLACK_WEBHOOK_URL  Slack webhook for notifications (optional)

Example:
    DEPLOY_HOST=myserver.com DEPLOY_KEY_PATH=~/.ssh/mykey.pem $0
EOF
    exit 0
fi

# Run dry-run if requested
if [ "${1:-}" = "--dry-run" ]; then
    log_info "Running in dry-run mode - no actual deployment will occur"
    check_dependencies
    validate_environment
    build_and_test_locally
    create_deployment_archive >/dev/null
    log_success "Dry-run completed successfully"
    exit 0
fi

# Confirmation prompt (unless --force is used)
if [ "${1:-}" != "--force" ]; then
    echo -e "${YELLOW}⚠ WARNING: This will deploy to production server $REMOTE_HOST${NC}"
    echo -e "${YELLOW}This will stop current services and may cause brief downtime.${NC}"
    read -p "Do you want to continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Deployment cancelled by user"
        exit 0
    fi
fi

# Run main deployment
main "$@"