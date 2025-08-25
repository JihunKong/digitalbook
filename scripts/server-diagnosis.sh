#!/bin/bash

# ==========================================================
# AWS Lightsail 서버 진단 스크립트 - 로그인 500 에러 해결용
# ==========================================================

set -e  # 에러 발생 시 스크립트 중지

# 색상 설정
RED='\033[0;31m'
GREEN='\033[0;32m' 
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 로그 파일 설정
LOG_FILE="/tmp/server-diagnosis-$(date +%Y%m%d_%H%M%S).log"

echo -e "${BLUE}========================================"
echo -e "AWS Lightsail 서버 진단 스크립트"
echo -e "시간: $(date)"
echo -e "로그 파일: $LOG_FILE"
echo -e "========================================${NC}"

# 로그 기록 함수
log() {
    echo -e "$1" | tee -a "$LOG_FILE"
}

# 에러 체크 함수
check_error() {
    if [ $? -eq 0 ]; then
        log "${GREEN}✅ $1 성공${NC}"
    else
        log "${RED}❌ $1 실패${NC}"
        echo "상세 로그: $LOG_FILE"
    fi
}

echo -e "${YELLOW}1단계: 시스템 기본 정보 확인${NC}"
log "========== 시스템 정보 =========="
log "호스트명: $(hostname)"
log "운영체제: $(cat /etc/os-release | grep PRETTY_NAME | cut -d'=' -f2 | tr -d '\"')"
log "커널 버전: $(uname -r)"
log "현재 시간: $(date)"
log "업타임: $(uptime)"

echo -e "\n${YELLOW}2단계: 메모리 및 디스크 사용량 확인${NC}"
log "========== 리소스 사용량 =========="
log "메모리 사용량:"
free -h >> "$LOG_FILE" 2>&1
check_error "메모리 정보 수집"

log "디스크 사용량:"
df -h >> "$LOG_FILE" 2>&1
check_error "디스크 정보 수집"

log "CPU 로드:"
cat /proc/loadavg >> "$LOG_FILE" 2>&1
check_error "CPU 로드 정보 수집"

echo -e "\n${YELLOW}3단계: Docker 환경 확인${NC}"
log "========== Docker 정보 =========="

# Docker 설치 확인
if command -v docker &> /dev/null; then
    log "${GREEN}Docker 설치됨: $(docker --version)${NC}"
    
    # Docker 서비스 상태
    log "Docker 서비스 상태:"
    systemctl status docker --no-pager >> "$LOG_FILE" 2>&1
    check_error "Docker 서비스 상태 확인"
    
    # Docker Compose 확인
    if command -v docker-compose &> /dev/null; then
        log "${GREEN}Docker Compose 설치됨: $(docker-compose --version)${NC}"
    else
        log "${RED}Docker Compose가 설치되지 않음${NC}"
    fi
    
    # 실행 중인 컨테이너 확인
    log "실행 중인 Docker 컨테이너:"
    docker ps -a >> "$LOG_FILE" 2>&1
    check_error "Docker 컨테이너 상태 확인"
    
else
    log "${RED}Docker가 설치되지 않음${NC}"
fi

echo -e "\n${YELLOW}4단계: 네트워크 및 포트 확인${NC}"
log "========== 네트워크 정보 =========="

log "네트워크 인터페이스:"
ip addr show >> "$LOG_FILE" 2>&1
check_error "네트워크 인터페이스 확인"

log "열린 포트 확인:"
ss -tulpn | grep -E "(80|443|3000|4000|5432|6379)" >> "$LOG_FILE" 2>&1
check_error "포트 상태 확인"

log "방화벽 상태 (ufw):"
sudo ufw status >> "$LOG_FILE" 2>&1
check_error "방화벽 상태 확인"

echo -e "\n${YELLOW}5단계: 웹서버 및 프로세스 확인${NC}"
log "========== 프로세스 정보 =========="

# Nginx 확인
if systemctl is-active --quiet nginx; then
    log "${GREEN}Nginx 실행 중${NC}"
    log "Nginx 설정 테스트:"
    sudo nginx -t >> "$LOG_FILE" 2>&1
    check_error "Nginx 설정 검증"
else
    log "${RED}Nginx가 실행되지 않음${NC}"
fi

# PM2 프로세스 확인
if command -v pm2 &> /dev/null; then
    log "${GREEN}PM2 설치됨${NC}"
    log "PM2 프로세스 목록:"
    pm2 list >> "$LOG_FILE" 2>&1
    check_error "PM2 프로세스 확인"
else
    log "${YELLOW}PM2가 설치되지 않음${NC}"
fi

# systemd 서비스 확인 (digitalbook)
if systemctl list-units --full -all | grep -q digitalbook; then
    log "digitalbook systemd 서비스 상태:"
    systemctl status digitalbook --no-pager >> "$LOG_FILE" 2>&1
    check_error "digitalbook 서비스 상태 확인"
else
    log "${YELLOW}digitalbook systemd 서비스를 찾을 수 없음${NC}"
fi

echo -e "\n${YELLOW}6단계: Docker 컨테이너 상세 진단${NC}"
if command -v docker &> /dev/null; then
    log "========== Docker 컨테이너 상세 정보 =========="
    
    # 주요 컨테이너들 확인
    for container in "digitalbook-backend" "digitalbook-frontend" "digitalbook-postgres" "digitalbook-redis"; do
        if docker ps -a --format "table {{.Names}}" | grep -q "$container"; then
            log "=== $container 컨테이너 정보 ==="
            log "컨테이너 상태:"
            docker ps -a --filter "name=$container" >> "$LOG_FILE" 2>&1
            
            log "컨테이너 로그 (최근 20줄):"
            docker logs "$container" --tail 20 >> "$LOG_FILE" 2>&1
            
            log "컨테이너 리소스 사용량:"
            docker stats "$container" --no-stream >> "$LOG_FILE" 2>&1
            check_error "$container 컨테이너 정보 수집"
        else
            log "${YELLOW}$container 컨테이너를 찾을 수 없음${NC}"
        fi
    done
fi

echo -e "\n${YELLOW}7단계: 환경변수 및 설정 파일 확인${NC}"
log "========== 환경변수 확인 =========="

# 현재 디렉토리 확인
log "현재 작업 디렉토리: $(pwd)"
log "홈 디렉토리 파일 목록:"
ls -la ~/ >> "$LOG_FILE" 2>&1

# digitalbook 프로젝트 디렉토리 확인
if [ -d "/home/ubuntu/digitalbook" ]; then
    log "digitalbook 프로젝트 디렉토리 존재"
    log "프로젝트 파일 목록:"
    ls -la /home/ubuntu/digitalbook/ >> "$LOG_FILE" 2>&1
    
    # Docker Compose 파일 확인
    if [ -f "/home/ubuntu/digitalbook/docker-compose.prod.yml" ]; then
        log "${GREEN}docker-compose.prod.yml 파일 존재${NC}"
    else
        log "${RED}docker-compose.prod.yml 파일이 없음${NC}"
    fi
    
    # .env 파일들 확인
    log ".env 관련 파일들:"
    find /home/ubuntu/digitalbook -name ".env*" -o -name "*.env" >> "$LOG_FILE" 2>&1
else
    log "${RED}digitalbook 프로젝트 디렉토리가 없음${NC}"
fi

echo -e "\n${YELLOW}8단계: 로그 파일 확인${NC}"
log "========== 로그 파일 분석 =========="

# Nginx 로그 확인
if [ -f "/var/log/nginx/access.log" ]; then
    log "Nginx 액세스 로그 (최근 10줄):"
    sudo tail -10 /var/log/nginx/access.log >> "$LOG_FILE" 2>&1
fi

if [ -f "/var/log/nginx/error.log" ]; then
    log "Nginx 에러 로그 (최근 10줄):"
    sudo tail -10 /var/log/nginx/error.log >> "$LOG_FILE" 2>&1
fi

# systemd 저널 로그 확인
log "systemd 저널 로그 (digitalbook 관련, 최근 20줄):"
sudo journalctl -u digitalbook --lines 20 --no-pager >> "$LOG_FILE" 2>&1 || echo "digitalbook 서비스 로그 없음" >> "$LOG_FILE"

echo -e "\n${GREEN}=========================================="
echo -e "🎯 진단 완료!"
echo -e "========================================${NC}"

echo -e "${BLUE}📊 진단 결과 요약:${NC}"
echo -e "• 로그 파일: $LOG_FILE"
echo -e "• 시스템 시간: $(date)"

# 주요 문제점 요약
echo -e "\n${YELLOW}🔍 주의사항 체크:${NC}"

# 메모리 사용량 체크 (90% 이상 시 경고)
MEMORY_USAGE=$(free | grep Mem | awk '{printf("%.0f"), $3/$2 * 100.0}')
if [ "$MEMORY_USAGE" -gt 90 ]; then
    echo -e "${RED}⚠️  메모리 사용량이 높습니다: ${MEMORY_USAGE}%${NC}"
else
    echo -e "${GREEN}✅ 메모리 사용량 양호: ${MEMORY_USAGE}%${NC}"
fi

# 디스크 사용량 체크 (90% 이상 시 경고)
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 90 ]; then
    echo -e "${RED}⚠️  디스크 사용량이 높습니다: ${DISK_USAGE}%${NC}"
else
    echo -e "${GREEN}✅ 디스크 사용량 양호: ${DISK_USAGE}%${NC}"
fi

# Docker 실행 상태 체크
if docker ps | grep -q "digitalbook"; then
    echo -e "${GREEN}✅ Digital Book 컨테이너가 실행 중입니다${NC}"
else
    echo -e "${RED}⚠️  Digital Book 컨테이너가 실행되지 않습니다${NC}"
fi

echo -e "\n${BLUE}📋 다음 단계:${NC}"
echo -e "1. 로그 파일을 검토하세요: cat $LOG_FILE"
echo -e "2. 발견된 문제점들을 해결하세요"
echo -e "3. API 테스트 스크립트를 실행하세요"

echo -e "\n${GREEN}진단 스크립트 실행 완료! 🚀${NC}"