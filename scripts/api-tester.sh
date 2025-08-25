#!/bin/bash

# ==========================================================
# Digital Book API 자동화 테스트 스크립트 - 로그인 500 에러 집중 분석
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
DOMAIN="xn--220bu63c.com"
BASE_URL="https://$DOMAIN"
LOCAL_URL="http://localhost:4000"
LOG_FILE="/tmp/api-test-$(date +%Y%m%d_%H%M%S).log"
COOKIE_FILE="/tmp/api-cookies-$(date +%Y%m%d_%H%M%S).txt"

# 테스트 계정 정보
TEST_EMAIL="teacher@example.com"
TEST_PASSWORD="teacher123"

echo -e "${BLUE}========================================"
echo -e "Digital Book API 테스트 스크립트"
echo -e "도메인: $DOMAIN"
echo -e "시간: $(date)"
echo -e "로그 파일: $LOG_FILE"
echo -e "========================================${NC}"

# 로그 기록 함수
log() {
    echo -e "$1" | tee -a "$LOG_FILE"
}

# HTTP 응답 분석 함수
analyze_response() {
    local url="$1"
    local method="$2"
    local data="$3"
    local expected_status="$4"
    
    local response_file="/tmp/response_$(date +%s).json"
    local headers_file="/tmp/headers_$(date +%s).txt"
    
    log "🔍 테스트: $method $url"
    
    # curl 실행
    local status_code
    if [ -n "$data" ]; then
        status_code=$(curl -s -w "%{http_code}" \
            -X "$method" \
            -H "Content-Type: application/json" \
            -H "User-Agent: DigitalBook-APITester/1.0" \
            -d "$data" \
            -c "$COOKIE_FILE" \
            -b "$COOKIE_FILE" \
            -D "$headers_file" \
            -o "$response_file" \
            "$url" 2>>"$LOG_FILE")
    else
        status_code=$(curl -s -w "%{http_code}" \
            -X "$method" \
            -H "User-Agent: DigitalBook-APITester/1.0" \
            -c "$COOKIE_FILE" \
            -b "$COOKIE_FILE" \
            -D "$headers_file" \
            -o "$response_file" \
            "$url" 2>>"$LOG_FILE")
    fi
    
    # 응답 분석
    log "   상태 코드: $status_code"
    
    # 헤더 정보
    log "   응답 헤더:"
    if [ -f "$headers_file" ]; then
        grep -E "(Content-Type|Set-Cookie|X-|Access-Control)" "$headers_file" | while read -r line; do
            log "     $line"
        done >> "$LOG_FILE" 2>&1
    fi
    
    # 응답 본문
    if [ -f "$response_file" ]; then
        local response_size=$(wc -c < "$response_file" 2>/dev/null || echo "0")
        log "   응답 크기: ${response_size}bytes"
        
        if [ "$response_size" -gt 0 ] && [ "$response_size" -lt 10000 ]; then
            log "   응답 내용:"
            cat "$response_file" | head -20 >> "$LOG_FILE" 2>&1
        fi
    fi
    
    # 상태 코드 검증
    if [ "$status_code" = "$expected_status" ]; then
        log "${GREEN}   ✅ 성공 (예상: $expected_status, 실제: $status_code)${NC}"
        return 0
    else
        log "${RED}   ❌ 실패 (예상: $expected_status, 실제: $status_code)${NC}"
        
        # 500 에러인 경우 상세 분석
        if [ "$status_code" = "500" ]; then
            log "${RED}   🚨 500 Internal Server Error 상세 분석:${NC}"
            
            # 응답 본문에서 에러 정보 추출
            if [ -f "$response_file" ] && grep -q "error" "$response_file"; then
                log "   에러 메시지:"
                cat "$response_file" >> "$LOG_FILE" 2>&1
            fi
            
            # 서버 로그 확인 제안
            log "   💡 서버 로그 확인 명령어:"
            log "      docker logs digitalbook-backend --tail 50"
            log "      pm2 logs backend --lines 20"
        fi
        
        return 1
    fi
    
    # 임시 파일 정리
    rm -f "$response_file" "$headers_file" 2>/dev/null
}

# 기본 연결성 테스트
test_connectivity() {
    echo -e "\n${PURPLE}========================================${NC}"
    echo -e "${PURPLE} 1. 기본 연결성 테스트${NC}"
    echo -e "${PURPLE}========================================${NC}"
    
    log "=== 기본 연결성 테스트 ==="
    
    # HTTPS 도메인 연결 테스트
    log "🌐 HTTPS 도메인 연결 테스트"
    if curl -I -s --connect-timeout 10 "$BASE_URL" >/dev/null 2>&1; then
        log "${GREEN}✅ HTTPS 도메인 연결 성공: $BASE_URL${NC}"
    else
        log "${RED}❌ HTTPS 도메인 연결 실패: $BASE_URL${NC}"
    fi
    
    # 로컬 백엔드 연결 테스트
    log "🏠 로컬 백엔드 연결 테스트"
    if curl -I -s --connect-timeout 5 "$LOCAL_URL" >/dev/null 2>&1; then
        log "${GREEN}✅ 로컬 백엔드 연결 성공: $LOCAL_URL${NC}"
    else
        log "${RED}❌ 로컬 백엔드 연결 실패: $LOCAL_URL${NC}"
    fi
    
    # DNS 해상도 테스트
    log "🔍 DNS 해상도 테스트"
    if nslookup "$DOMAIN" >/dev/null 2>&1; then
        log "${GREEN}✅ DNS 해상도 성공: $DOMAIN${NC}"
        nslookup "$DOMAIN" >> "$LOG_FILE" 2>&1
    else
        log "${RED}❌ DNS 해상도 실패: $DOMAIN${NC}"
    fi
}

# 헬스체크 테스트
test_health_endpoints() {
    echo -e "\n${PURPLE}========================================${NC}"
    echo -e "${PURPLE} 2. 헬스체크 엔드포인트 테스트${NC}"
    echo -e "${PURPLE}========================================${NC}"
    
    log "=== 헬스체크 엔드포인트 테스트 ==="
    
    # 도메인 헬스체크
    analyze_response "$BASE_URL/api/health" "GET" "" "200"
    
    # 로컬 헬스체크 (가능한 경우)
    if curl -I -s --connect-timeout 5 "$LOCAL_URL" >/dev/null 2>&1; then
        analyze_response "$LOCAL_URL/api/health" "GET" "" "200"
    fi
    
    # 추가 헬스체크 엔드포인트들
    analyze_response "$BASE_URL/api/ready" "GET" "" "200"
}

# 인증 관련 테스트 (로그인 500 에러 집중 분석)
test_authentication() {
    echo -e "\n${PURPLE}========================================${NC}"
    echo -e "${PURPLE} 3. 인증 시스템 테스트 (로그인 500 에러 분석)${NC}"
    echo -e "${PURPLE}========================================${NC}"
    
    log "=== 인증 시스템 테스트 ==="
    
    # 1. 현재 사용자 정보 (인증 없이)
    log "\n🔍 Step 1: 인증되지 않은 사용자 정보 요청"
    analyze_response "$BASE_URL/api/auth/me" "GET" "" "401"
    
    # 2. 잘못된 로그인 시도 (이메일 형식 오류)
    log "\n🔍 Step 2: 잘못된 이메일 형식으로 로그인 시도"
    analyze_response "$BASE_URL/api/auth/login" "POST" '{"email":"invalid-email","password":"test123"}' "400"
    
    # 3. 존재하지 않는 사용자 로그인
    log "\n🔍 Step 3: 존재하지 않는 사용자 로그인 시도"
    analyze_response "$BASE_URL/api/auth/login" "POST" '{"email":"nonexistent@example.com","password":"test123"}' "401"
    
    # 4. 정상 계정으로 로그인 시도 (메인 테스트)
    log "\n🚨 Step 4: 정상 계정으로 로그인 시도 (메인 500 에러 테스트)"
    log "   테스트 계정: $TEST_EMAIL"
    
    # 상세 디버깅을 위한 verbose 모드
    log "   🔎 상세 디버깅 모드로 실행:"
    
    local login_response="/tmp/login_response.json"
    local login_headers="/tmp/login_headers.txt"
    
    local login_status=$(curl -v \
        -X POST \
        -H "Content-Type: application/json" \
        -H "User-Agent: DigitalBook-APITester/1.0" \
        -H "Accept: application/json" \
        -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}" \
        -c "$COOKIE_FILE" \
        -D "$login_headers" \
        -o "$login_response" \
        -w "%{http_code}" \
        -s \
        "$BASE_URL/api/auth/login" 2>>"$LOG_FILE")
    
    log "   로그인 응답 상태: $login_status"
    
    # 상세 분석
    if [ -f "$login_headers" ]; then
        log "   응답 헤더 분석:"
        cat "$login_headers" >> "$LOG_FILE" 2>&1
    fi
    
    if [ -f "$login_response" ]; then
        log "   응답 본문:"
        cat "$login_response" >> "$LOG_FILE" 2>&1
        
        # JSON 파싱 시도
        if command -v jq >/dev/null 2>&1 && jq . "$login_response" >/dev/null 2>&1; then
            log "   JSON 파싱 성공:"
            jq . "$login_response" >> "$LOG_FILE" 2>&1
        else
            log "   JSON 파싱 실패 또는 jq 미설치"
        fi
    fi
    
    # 로그인 결과 분석
    case "$login_status" in
        "200")
            log "${GREEN}   ✅ 로그인 성공!${NC}"
            
            # 로그인 후 사용자 정보 확인
            log "\n🔍 Step 4-1: 로그인 후 사용자 정보 확인"
            analyze_response "$BASE_URL/api/auth/me" "GET" "" "200"
            
            # 로그아웃 테스트
            log "\n🔍 Step 4-2: 로그아웃 테스트"
            analyze_response "$BASE_URL/api/auth/logout" "POST" "" "200"
            ;;
        "401")
            log "${YELLOW}   ⚠️ 로그인 실패: 인증 정보 오류 (401)${NC}"
            log "   💡 가능한 원인:"
            log "      - 테스트 계정이 존재하지 않음"
            log "      - 비밀번호가 잘못됨"
            log "      - 계정이 비활성화됨"
            ;;
        "500")
            log "${RED}   🚨 로그인 실패: 서버 내부 오류 (500) - 주요 문제 발견!${NC}"
            log "   💡 가능한 원인 분석:"
            log "      1. JWT_SECRET 환경변수 누락"
            log "      2. Redis 연결 실패"
            log "      3. PostgreSQL 연결 실패"
            log "      4. bcrypt 해싱 오류"
            log "      5. 세션 생성 오류"
            
            log "   🔧 권장 디버깅 단계:"
            log "      1. 환경변수 확인: echo \$JWT_SECRET"
            log "      2. Redis 확인: docker exec digitalbook-redis redis-cli ping"
            log "      3. PostgreSQL 확인: docker exec digitalbook-postgres pg_isready -U postgres"
            log "      4. 백엔드 로그 확인: docker logs digitalbook-backend --tail 50"
            
            # 로컬 백엔드로도 테스트 (Docker 내부 문제인지 확인)
            if curl -I -s --connect-timeout 5 "$LOCAL_URL" >/dev/null 2>&1; then
                log "   🏠 로컬 백엔드로 동일 테스트:"
                local local_status=$(curl -s -w "%{http_code}" \
                    -X POST \
                    -H "Content-Type: application/json" \
                    -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}" \
                    -o /dev/null \
                    "$LOCAL_URL/api/auth/login" 2>/dev/null)
                    
                log "      로컬 백엔드 응답: $local_status"
                
                if [ "$local_status" = "200" ]; then
                    log "${YELLOW}      ⚠️ 로컬은 성공, 프로덕션은 실패 - 환경 차이 문제${NC}"
                elif [ "$local_status" = "500" ]; then
                    log "${RED}      ❌ 로컬도 실패 - 코드 또는 환경설정 문제${NC}"
                fi
            fi
            ;;
        *)
            log "${RED}   ❌ 예상치 못한 응답: $login_status${NC}"
            ;;
    esac
    
    # 임시 파일 정리
    rm -f "$login_response" "$login_headers" 2>/dev/null
}

# API 엔드포인트 기능 테스트
test_api_endpoints() {
    echo -e "\n${PURPLE}========================================${NC}"
    echo -e "${PURPLE} 4. 주요 API 엔드포인트 테스트${NC}"
    echo -e "${PURPLE}========================================${NC}"
    
    log "=== 주요 API 엔드포인트 테스트 ==="
    
    # 공개 엔드포인트들
    log "\n📖 공개 엔드포인트 테스트:"
    analyze_response "$BASE_URL/api/textbooks/public" "GET" "" "200"
    
    # 게스트 액세스 테스트
    log "\n👤 게스트 액세스 테스트:"
    analyze_response "$BASE_URL/api/guest/access" "POST" '{"textbookId":"test","duration":1}' "201"
    
    # CORS 테스트
    log "\n🌐 CORS 테스트:"
    local cors_response=$(curl -s -I \
        -H "Origin: https://$DOMAIN" \
        -H "Access-Control-Request-Method: POST" \
        -H "Access-Control-Request-Headers: Content-Type" \
        -X OPTIONS \
        "$BASE_URL/api/auth/login" 2>/dev/null | grep -i "access-control")
    
    if [ -n "$cors_response" ]; then
        log "${GREEN}   ✅ CORS 헤더 존재${NC}"
        echo "$cors_response" >> "$LOG_FILE"
    else
        log "${RED}   ❌ CORS 헤더 없음${NC}"
    fi
}

# 성능 및 보안 테스트
test_performance_security() {
    echo -e "\n${PURPLE}========================================${NC}"
    echo -e "${PURPLE} 5. 성능 및 보안 테스트${NC}"
    echo -e "${PURPLE}========================================${NC}"
    
    log "=== 성능 및 보안 테스트 ==="
    
    # Rate Limiting 테스트
    log "\n⚡ Rate Limiting 테스트:"
    log "   5초 내에 10번의 로그인 시도"
    
    local rate_limit_success=0
    for i in {1..10}; do
        local status=$(curl -s -w "%{http_code}" \
            -X POST \
            -H "Content-Type: application/json" \
            -d '{"email":"test@test.com","password":"wrong"}' \
            -o /dev/null \
            "$BASE_URL/api/auth/login" 2>/dev/null)
        
        if [ "$status" = "429" ]; then
            log "${GREEN}   ✅ Rate limiting 작동 (시도 $i에서 429 응답)${NC}"
            rate_limit_success=1
            break
        fi
        sleep 0.5
    done
    
    if [ $rate_limit_success -eq 0 ]; then
        log "${YELLOW}   ⚠️ Rate limiting 미작동 또는 제한이 높음${NC}"
    fi
    
    # SSL/TLS 테스트
    log "\n🔒 SSL/TLS 테스트:"
    if command -v openssl >/dev/null 2>&1; then
        local ssl_info=$(echo | openssl s_client -connect "$DOMAIN:443" -servername "$DOMAIN" 2>/dev/null | openssl x509 -noout -subject -dates 2>/dev/null)
        if [ -n "$ssl_info" ]; then
            log "${GREEN}   ✅ SSL 인증서 유효${NC}"
            echo "$ssl_info" >> "$LOG_FILE"
        else
            log "${RED}   ❌ SSL 인증서 문제${NC}"
        fi
    else
        log "${YELLOW}   ⚠️ openssl 명령어 없음 - SSL 테스트 건너뜀${NC}"
    fi
    
    # 응답 시간 측정
    log "\n⏱️ 응답 시간 측정:"
    local response_time=$(curl -s -w "%{time_total}" -o /dev/null "$BASE_URL/api/health" 2>/dev/null)
    if [ -n "$response_time" ]; then
        log "   Health 엔드포인트 응답 시간: ${response_time}초"
        
        # 응답 시간 평가
        if (( $(echo "$response_time < 1.0" | bc -l 2>/dev/null || echo 0) )); then
            log "${GREEN}   ✅ 응답 시간 양호 (1초 미만)${NC}"
        else
            log "${YELLOW}   ⚠️ 응답 시간 느림 (1초 이상)${NC}"
        fi
    fi
}

# 결과 요약
summarize_results() {
    echo -e "\n${GREEN}=========================================="
    echo -e "🎯 API 테스트 결과 요약"
    echo -e "========================================${NC}"
    
    local total_tests=$(grep -c "🔍 테스트:" "$LOG_FILE" 2>/dev/null || echo "0")
    local success_tests=$(grep -c "✅ 성공" "$LOG_FILE" 2>/dev/null || echo "0")
    local failed_tests=$(grep -c "❌ 실패" "$LOG_FILE" 2>/dev/null || echo "0")
    local warning_tests=$(grep -c "⚠️" "$LOG_FILE" 2>/dev/null || echo "0")
    
    log "📊 테스트 통계:"
    log "   전체 테스트: $total_tests"
    log "   성공: $success_tests"
    log "   실패: $failed_tests"
    log "   경고: $warning_tests"
    
    # 500 에러 특별 분석
    if grep -q "500" "$LOG_FILE"; then
        log "\n${RED}🚨 500 에러 발견 - 긴급 조치 필요${NC}"
        log "500 에러 관련 로그:"
        grep -A 5 -B 5 "500" "$LOG_FILE" | tail -20
    fi
    
    # 주요 문제점 요약
    log "\n💡 권장 조치사항:"
    if grep -q "로그인.*500" "$LOG_FILE"; then
        log "1. 🔥 우선순위 HIGH: 로그인 500 에러 해결"
        log "   - 환경변수 확인: JWT_SECRET, DATABASE_URL, REDIS_URL"
        log "   - 서비스 재시작: docker-compose restart"
        log "   - 로그 확인: docker logs digitalbook-backend"
    fi
    
    if grep -q "연결 실패" "$LOG_FILE"; then
        log "2. 🌐 네트워크 연결 문제 해결"
        log "   - DNS 설정 확인"
        log "   - 방화벽 설정 확인"
        log "   - 서비스 상태 확인"
    fi
    
    if grep -q "Rate limiting 미작동" "$LOG_FILE"; then
        log "3. 🔒 보안 설정 강화"
        log "   - Rate limiting 설정 확인"
        log "   - CORS 설정 검토"
    fi
    
    log "\n📝 상세 로그: $LOG_FILE"
    log "🍪 쿠키 파일: $COOKIE_FILE"
    
    echo -e "\n${BLUE}다음 단계:${NC}"
    echo -e "1. 로그 파일 분석: cat $LOG_FILE"
    echo -e "2. 500 에러 원인 해결"
    echo -e "3. Docker 컨테이너 상태 확인"
    echo -e "4. 환경변수 설정 검토"
}

# 메인 실행 함수
main() {
    # 사전 확인
    if ! command -v curl >/dev/null 2>&1; then
        echo -e "${RED}❌ curl 명령어가 설치되지 않았습니다${NC}"
        exit 1
    fi
    
    # 테스트 실행
    test_connectivity
    test_health_endpoints
    test_authentication
    test_api_endpoints
    test_performance_security
    summarize_results
    
    echo -e "\n${GREEN}API 테스트 완료! 🚀${NC}"
    
    # 정리
    echo -e "\n${YELLOW}임시 파일 정리...${NC}"
    # 쿠키 파일은 유지하되, 24시간 후 자동 삭제되도록 설정
    find /tmp -name "api-cookies-*" -mtime +1 -delete 2>/dev/null || true
}

# 옵션 처리
case "${1:-}" in
    --help|-h)
        echo "사용법: $0 [옵션]"
        echo "옵션:"
        echo "  --help, -h     이 도움말 표시"
        echo "  --local-only   로컬 테스트만 실행"
        echo "  --auth-only    인증 테스트만 실행"
        exit 0
        ;;
    --local-only)
        BASE_URL="$LOCAL_URL"
        echo -e "${YELLOW}로컬 테스트 모드${NC}"
        ;;
    --auth-only)
        test_authentication
        exit 0
        ;;
esac

# 메인 실행
main