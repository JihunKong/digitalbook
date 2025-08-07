# HTTPS 접속 가이드

## 접속 가능한 URL

### 1. Punycode 도메인 (권장)
- https://xn--220bu63c.com
- https://xn--220bu63c.com/textbook/demo

### 2. 한글 도메인
- https://내책.com
- https://내책.com/textbook/demo

### 3. IP 주소
- https://3.37.168.225
- https://3.37.168.225/textbook/demo

## 접속 문제 해결

### HTTP로만 연결되는 경우:
1. **브라우저 캐시 삭제**
   - Chrome: Ctrl+Shift+Delete (Windows) / Cmd+Shift+Delete (Mac)
   - 기간: "전체 기간" 선택
   - "캐시된 이미지 및 파일" 체크

2. **강제 HTTPS 접속**
   - URL 앞에 `https://`를 명시적으로 입력
   - 예: https://xn--220bu63c.com

3. **시크릿/프라이빗 모드 사용**
   - Chrome: Ctrl+Shift+N (Windows) / Cmd+Shift+N (Mac)
   - Safari: Cmd+Shift+N

### SSL 인증서 정보
- 인증서 발급: Let's Encrypt
- 유효기간: 2025년 9월 26일까지
- 자동 갱신 설정됨

### 서버 상태 확인
```bash
# HTTPS 응답 확인
curl -I https://xn--220bu63c.com

# SSL 인증서 확인
openssl s_client -connect xn--220bu63c.com:443 -servername xn--220bu63c.com < /dev/null
```

## 주요 페이지

1. **메인 페이지**: https://xn--220bu63c.com
2. **디지털 교과서 데모**: https://xn--220bu63c.com/textbook/demo
3. **학생 수업 참여**: https://xn--220bu63c.com/student/join-class
4. **교사 수업 생성**: https://xn--220bu63c.com/teacher/class/create

## 기술 지원
문제가 지속되면 다음을 확인하세요:
- 브라우저가 최신 버전인지 확인
- 회사/학교 네트워크의 방화벽 설정
- DNS 설정 (8.8.8.8 또는 1.1.1.1 사용 권장)