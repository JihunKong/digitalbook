#!/bin/bash

# Script to run authentication E2E tests for Korean Digital Textbook Platform
# This script provides multiple ways to run the tests: local, Docker, or CI

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TEST_MODE="${1:-local}"  # local, docker, or ci

# Test user configuration (as specified in requirements)
export TEST_USER_NAME="테스트교사"
export TEST_USER_EMAIL="test@teacher.com"
export TEST_USER_PASSWORD="testpassword123"
export TEST_USER_ROLE="TEACHER"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    case $TEST_MODE in
        local)
            # Check for Node.js and npm
            if ! command -v node &> /dev/null; then
                print_error "Node.js is not installed"
                exit 1
            fi
            
            if ! command -v npm &> /dev/null; then
                print_error "npm is not installed"
                exit 1
            fi
            
            # Check for Playwright
            if ! npx playwright --version &> /dev/null; then
                print_warning "Playwright not found, installing..."
                npm install @playwright/test
                npx playwright install chromium
            fi
            ;;
            
        docker)
            # Check for Docker and Docker Compose
            if ! command -v docker &> /dev/null; then
                print_error "Docker is not installed"
                exit 1
            fi
            
            if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
                print_error "Docker Compose is not installed"
                exit 1
            fi
            ;;
    esac
    
    print_success "Prerequisites check passed"
}

# Function to cleanup previous test runs
cleanup_previous_runs() {
    print_status "Cleaning up previous test runs..."
    
    case $TEST_MODE in
        docker)
            # Stop and remove containers
            docker-compose -f docker-compose.auth-test.yml down --volumes --remove-orphans 2>/dev/null || true
            
            # Remove test images if they exist
            docker images | grep digitalbook | grep -E "(auth-test|e2e)" | awk '{print $3}' | xargs -r docker rmi -f 2>/dev/null || true
            ;;
            
        local)
            # Kill any running dev servers
            pkill -f "npm run dev" 2>/dev/null || true
            pkill -f "next dev" 2>/dev/null || true
            
            # Clean test artifacts
            rm -rf test-results playwright-report videos screenshots trace 2>/dev/null || true
            ;;
    esac
    
    print_success "Cleanup completed"
}

# Function to start services
start_services() {
    print_status "Starting services for $TEST_MODE mode..."
    
    case $TEST_MODE in
        local)
            # Set environment variables for local testing
            export BASE_URL="http://localhost:3000"
            export API_URL="http://localhost:4000"
            export NODE_ENV="test"
            
            # Start backend in background
            print_status "Starting backend server..."
            cd "$PROJECT_ROOT/backend"
            npm run dev &
            BACKEND_PID=$!
            
            # Wait a moment for backend to start
            sleep 5
            
            # Start frontend in background
            print_status "Starting frontend server..."
            cd "$PROJECT_ROOT"
            npm run dev &
            FRONTEND_PID=$!
            
            # Wait for services to be ready
            wait_for_service "http://localhost:3000" "Frontend"
            wait_for_service "http://localhost:4000/api/health" "Backend API"
            ;;
            
        docker)
            # Set environment variables for Docker testing
            export BASE_URL="http://localhost:3002"
            export API_URL="http://localhost:4002"
            
            # Build and start services
            print_status "Building and starting Docker services..."
            cd "$PROJECT_ROOT"
            docker-compose -f docker-compose.auth-test.yml up --build -d
            
            # Wait for services to be healthy
            print_status "Waiting for services to be healthy..."
            wait_for_docker_service "digitalbook-frontend-auth-test"
            wait_for_docker_service "digitalbook-backend-auth-test"
            ;;
    esac
    
    print_success "Services started successfully"
}

# Function to wait for a service to be ready
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=30
    local attempt=1
    
    print_status "Waiting for $service_name to be ready at $url..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -sf "$url" >/dev/null 2>&1; then
            print_success "$service_name is ready"
            return 0
        fi
        
        print_status "Attempt $attempt/$max_attempts: $service_name not ready yet..."
        sleep 2
        ((attempt++))
    done
    
    print_error "$service_name failed to start after $max_attempts attempts"
    return 1
}

# Function to wait for Docker service to be healthy
wait_for_docker_service() {
    local container_name=$1
    local max_attempts=30
    local attempt=1
    
    print_status "Waiting for container $container_name to be healthy..."
    
    while [ $attempt -le $max_attempts ]; do
        local health_status=$(docker inspect --format='{{.State.Health.Status}}' "$container_name" 2>/dev/null || echo "no-health-check")
        
        if [ "$health_status" = "healthy" ] || [ "$health_status" = "no-health-check" ]; then
            local container_status=$(docker inspect --format='{{.State.Status}}' "$container_name" 2>/dev/null || echo "not-found")
            if [ "$container_status" = "running" ]; then
                print_success "Container $container_name is ready"
                return 0
            fi
        fi
        
        print_status "Attempt $attempt/$max_attempts: Container $container_name not ready yet (status: $health_status)..."
        sleep 3
        ((attempt++))
    done
    
    print_error "Container $container_name failed to become healthy"
    docker logs "$container_name" --tail 20
    return 1
}

# Function to run tests
run_tests() {
    print_status "Running authentication E2E tests..."
    
    cd "$PROJECT_ROOT"
    
    case $TEST_MODE in
        local)
            # Run tests locally
            npx playwright test tests/e2e/auth-focused.spec.ts \
                --project=chromium-desktop \
                --reporter=html,list,json \
                --workers=1 \
                --retries=2 \
                --timeout=60000
            ;;
            
        docker)
            # Tests run inside Docker container automatically
            print_status "Tests are running inside Docker containers..."
            
            # Wait for test container to complete
            docker-compose -f docker-compose.auth-test.yml logs -f playwright-auth-test &
            LOGS_PID=$!
            
            # Wait for tests to complete
            docker-compose -f docker-compose.auth-test.yml wait playwright-auth-test
            TEST_EXIT_CODE=$?
            
            # Stop log following
            kill $LOGS_PID 2>/dev/null || true
            
            if [ $TEST_EXIT_CODE -eq 0 ]; then
                print_success "Docker tests completed successfully"
            else
                print_error "Docker tests failed"
                return $TEST_EXIT_CODE
            fi
            ;;
            
        ci)
            # CI mode - optimized for CI environments
            export CI=true
            npx playwright test tests/e2e/auth-focused.spec.ts \
                --project=chromium-desktop \
                --reporter=github,html,junit \
                --workers=2 \
                --retries=3 \
                --timeout=90000
            ;;
    esac
    
    print_success "Tests completed"
}

# Function to show test results
show_results() {
    print_status "Test results summary..."
    
    case $TEST_MODE in
        local|ci)
            if [ -f "playwright-report/index.html" ]; then
                print_success "HTML report generated: playwright-report/index.html"
                
                if command -v open &> /dev/null && [ "$TEST_MODE" = "local" ]; then
                    print_status "Opening report in browser..."
                    open playwright-report/index.html
                fi
            fi
            
            if [ -f "test-results/results.json" ]; then
                # Parse and display basic results
                if command -v jq &> /dev/null; then
                    local total=$(jq '.stats.expected + .stats.unexpected + .stats.flaky + .stats.skipped' test-results/results.json)
                    local passed=$(jq '.stats.expected' test-results/results.json)
                    local failed=$(jq '.stats.unexpected' test-results/results.json)
                    
                    print_status "Test Results:"
                    echo "  Total: $total"
                    echo "  Passed: $passed"
                    echo "  Failed: $failed"
                fi
            fi
            ;;
            
        docker)
            print_status "Docker test results are available at:"
            echo "  HTML Report: http://localhost:9324"
            echo "  Container logs: docker-compose -f docker-compose.auth-test.yml logs playwright-auth-test"
            ;;
    esac
}

# Function to cleanup after tests
cleanup_after_tests() {
    print_status "Cleaning up after tests..."
    
    case $TEST_MODE in
        local)
            # Kill background processes
            if [ ! -z "$BACKEND_PID" ]; then
                kill $BACKEND_PID 2>/dev/null || true
            fi
            if [ ! -z "$FRONTEND_PID" ]; then
                kill $FRONTEND_PID 2>/dev/null || true
            fi
            ;;
            
        docker)
            if [ "$KEEP_CONTAINERS" != "true" ]; then
                print_status "Stopping Docker containers..."
                docker-compose -f docker-compose.auth-test.yml down --volumes
            else
                print_status "Keeping containers running (KEEP_CONTAINERS=true)"
            fi
            ;;
    esac
    
    print_success "Cleanup completed"
}

# Main execution
main() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}Korean Digital Textbook - Auth E2E Tests${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo
    print_status "Test mode: $TEST_MODE"
    print_status "Test user: $TEST_USER_EMAIL"
    echo
    
    # Trap to ensure cleanup on exit
    trap cleanup_after_tests EXIT
    
    # Execute test pipeline
    check_prerequisites
    cleanup_previous_runs
    start_services
    
    if run_tests; then
        show_results
        print_success "All authentication tests passed! ✅"
        exit 0
    else
        print_error "Some tests failed ❌"
        show_results
        exit 1
    fi
}

# Help function
show_help() {
    echo "Usage: $0 [MODE]"
    echo
    echo "Modes:"
    echo "  local   - Run tests against local development servers (default)"
    echo "  docker  - Run tests in isolated Docker environment"
    echo "  ci      - Run tests in CI mode with optimized settings"
    echo
    echo "Environment variables:"
    echo "  KEEP_CONTAINERS=true  - Keep Docker containers running after tests"
    echo "  DEBUG=1              - Enable debug output"
    echo
    echo "Examples:"
    echo "  $0                   # Run tests locally"
    echo "  $0 docker           # Run tests in Docker"
    echo "  $0 ci               # Run tests in CI mode"
    echo "  KEEP_CONTAINERS=true $0 docker  # Keep containers after tests"
}

# Check for help flag
if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    show_help
    exit 0
fi

# Validate test mode
if [ "$TEST_MODE" != "local" ] && [ "$TEST_MODE" != "docker" ] && [ "$TEST_MODE" != "ci" ]; then
    print_error "Invalid test mode: $TEST_MODE"
    show_help
    exit 1
fi

# Run main function
main