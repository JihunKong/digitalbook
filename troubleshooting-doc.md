# 문제 해결 가이드

## 목차
- [일반적인 문제](#일반적인-문제)
- [서비스별 문제](#서비스별-문제)
- [데이터베이스 문제](#데이터베이스-문제)
- [네트워크 문제](#네트워크-문제)
- [성능 문제](#성능-문제)
- [보안 문제](#보안-문제)
- [디버깅 도구](#디버깅-도구)
- [긴급 대응](#긴급-대응)

## 일반적인 문제

### Pod가 시작되지 않음

#### 증상
```bash
$ kubectl get pods -n ai-textbook-prod
NAME                          READY   STATUS             RESTARTS   AGE
core-service-7f8b9c-x2k4j    0/1     CrashLoopBackOff   5          10m
```

#### 진단
```bash
# Pod 상세 정보 확인
kubectl describe pod core-service-7f8b9c-x2k4j -n ai-textbook-prod

# 이벤트 확인
kubectl get events -n ai-textbook-prod --sort-by='.lastTimestamp'

# 로그 확인
kubectl logs core-service-7f8b9c-x2k4j -n ai-textbook-prod --previous
```

#### 해결 방법

**1. 이미지 Pull 실패**
```bash
# 이미지가 존재하는지 확인
aws ecr describe-images --repository-name ai-textbook-core --image-ids imageTag=latest

# ECR 로그인 갱신
aws ecr get-login-password | docker login --username AWS --password-stdin $ECR_REGISTRY

# Secret 업데이트
kubectl delete secret regcred -n ai-textbook-prod
kubectl create secret docker-registry regcred \
  --docker-server=$ECR_REGISTRY \
  --docker-username=AWS \
  --docker-password=$(aws ecr get-login-password) \
  -n ai-textbook-prod
```

**2. 환경 변수 누락**
```bash
# ConfigMap 확인
kubectl get configmap app-config -n ai-textbook-prod -o yaml

# Secret 확인 (값은 보이지 않음)
kubectl get secret app-secrets -n ai-textbook-prod -o yaml

# 누락된 환경 변수 추가
kubectl edit configmap app-config -n ai-textbook-prod
```

**3. 리소스 부족**
```bash
# 노드 리소스 확인
kubectl top nodes
kubectl describe nodes

# Pod 리소스 요구사항 조정
kubectl edit deployment core-service -n ai-textbook-prod
# resources.requests.memory: "128Mi"
# resources.requests.cpu: "50m"
```

### 서비스 간 통신 실패

#### 증상
```
Error: connect ECONNREFUSED auth-service:3000
```

#### 진단
```bash
# 서비스 확인
kubectl get svc -n ai-textbook-prod

# 엔드포인트 확인
kubectl get endpoints -n ai-textbook-prod

# DNS 확인
kubectl run -it --rm debug --image=busybox --restart=Never -n ai-textbook-prod -- nslookup auth-service
```

#### 해결 방법
```bash
# 서비스 재생성
kubectl delete svc auth-service -n ai-textbook-prod
kubectl apply -f k8s/services/auth-service.yaml

# 네트워크 정책 확인
kubectl get networkpolicies -n ai-textbook-prod
kubectl describe networkpolicy allow-auth-service -n ai-textbook-prod
```

## 서비스별 문제

### Auth Service

#### JWT 토큰 검증 실패
```typescript
// 에러 메시지
JsonWebTokenError: invalid signature
```

**원인**: JWT_SECRET 불일치

**해결**:
```bash
# 모든 서비스가 동일한 JWT_SECRET을 사용하는지 확인
kubectl get secret app-secrets -n ai-textbook-prod -o jsonpath='{.data.JWT_SECRET}' | base64 -d

# 필요시 Secret 업데이트
kubectl create secret generic app-secrets \
  --from-literal=JWT_SECRET=your-new-secret \
  --dry-run=client -o yaml | kubectl apply -f -
```

#### 로그인 실패
```bash
# 데이터베이스 연결 확인
kubectl exec -it deployment/auth-service -n ai-textbook-prod -- \
  psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"

# 비밀번호 해싱 확인
kubectl logs deployment/auth-service -n ai-textbook-prod | grep bcrypt
```

### Core Service

#### 텍스트 분할 실패
```typescript
// 에러 메시지
Error: Text segmentation failed: Invalid text encoding
```

**진단**:
```bash
# 로그에서 상세 정보 확인
kubectl logs deployment/core-service -n ai-textbook-prod | grep -A 10 "segmentation failed"

# 메모리 사용량 확인
kubectl top pod -n ai-textbook-prod -l app=core-service
```

**해결**:
```typescript
// 텍스트 인코딩 문제 해결
function sanitizeText(text: string): string {
  // BOM 제거
  if (text.charCodeAt(0) === 0xFEFF) {
    text = text.slice(1);
  }
  
  // 유효하지 않은 문자 제거
  return text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}
```

### AI Service

#### Claude API 호출 실패
```
Error: 429 Too Many Requests
```

**해결**:
```typescript
// Rate limiting 구현
import { RateLimiter } from 'limiter';

const claudeLimiter = new RateLimiter({
  tokensPerInterval: 50,
  interval: 'minute',
});

async function callClaudeAPI(prompt: string) {
  await claudeLimiter.removeTokens(1);
  
  try {
    return await claude.complete(prompt);
  } catch (error) {
    if (error.status === 429) {
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, 60000));
      return callClaudeAPI(prompt);
    }
    throw error;
  }
}
```

#### 이미지 생성 실패
```bash
# DALL-E API 키 확인
kubectl exec -it deployment/ai-service -n ai-textbook-prod -- env | grep DALLE

# 이미지 저장소 권한 확인
kubectl exec -it deployment/ai-service -n ai-textbook-prod -- \
  aws s3 ls s3://ai-textbook-images/
```

## 데이터베이스 문제

### 연결 풀 고갈

#### 증상
```
Error: timeout exceeded when trying to connect
```

#### 진단
```sql
-- 현재 연결 확인
SELECT count(*) FROM pg_stat_activity;

-- 연결 상세 정보
SELECT pid, usename, application_name, client_addr, state, state_change
FROM pg_stat_activity
WHERE datname = 'ai_textbook'
ORDER BY state_change;

-- 오래된 연결 찾기
SELECT pid, now() - pg_stat_activity.query_start AS duration, query
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';
```

#### 해결
```sql
-- 특정 연결 종료
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE pid = 12345;

-- 모든 유휴 연결 종료
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle'
AND (now() - state_change) > interval '10 minutes';
```

**애플리케이션 수정**:
```typescript
// 연결 풀 설정 최적화
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // 최대 연결 수
  idleTimeoutMillis: 30000, // 30초
  connectionTimeoutMillis: 2000, // 2초
  maxUses: 7500, // 연결당 최대 쿼리 수
});

// 연결 모니터링
pool.on('connect', () => {
  logger.debug('Database connection established');
});

pool.on('error', (err) => {
  logger.error('Unexpected database error', err);
});
```

### 느린 쿼리

#### 진단
```sql
-- 느린 쿼리 찾기
SELECT 
  query,
  mean_exec_time,
  calls,
  total_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 1000
ORDER BY mean_exec_time DESC
LIMIT 10;

-- 실행 계획 분석
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM textbook_pages 
WHERE textbook_id = 'uuid' 
ORDER BY page_number;
```

#### 해결
```sql
-- 누락된 인덱스 추가
CREATE INDEX CONCURRENTLY idx_textbook_pages_textbook_id_page_number 
ON textbook_pages(textbook_id, page_number);

-- 통계 업데이트
ANALYZE textbook_pages;

-- 쿼리 최적화 예시
-- 나쁜 예
SELECT * FROM users u
JOIN student_textbooks st ON u.id = st.student_id
WHERE u.school_name = '한국고등학교';

-- 좋은 예
SELECT u.id, u.name, st.textbook_id
FROM users u
JOIN student_textbooks st ON u.id = st.student_id
WHERE u.school_name = '한국고등학교'
AND u.user_type = 'student';
```

### 데이터베이스 잠금

#### 진단
```sql
-- 현재 잠금 확인
SELECT 
  locktype,
  relation::regclass,
  mode,
  transactionid,
  pid,
  granted
FROM pg_locks
WHERE NOT granted;

-- 블로킹 쿼리 찾기
SELECT 
  blocking.pid AS blocking_pid,
  blocking.query AS blocking_query,
  blocked.pid AS blocked_pid,
  blocked.query AS blocked_query
FROM pg_stat_activity AS blocked
JOIN pg_stat_activity AS blocking 
  ON blocking.pid = ANY(pg_blocking_pids(blocked.pid))
WHERE blocked.pid != blocked.pid;
```

## 네트워크 문제

### DNS 해결 실패

#### 증상
```
Error: getaddrinfo ENOTFOUND postgres-service
```

#### 진단
```bash
# CoreDNS 상태 확인
kubectl get pods -n kube-system -l k8s-app=kube-dns

# DNS 로그 확인
kubectl logs -n kube-system -l k8s-app=kube-dns

# Pod에서 DNS 테스트
kubectl run -it --rm debug --image=busybox --restart=Never -- \
  sh -c "nslookup postgres-service.ai-textbook-prod.svc.cluster.local"
```

#### 해결
```bash
# CoreDNS 재시작
kubectl rollout restart deployment/coredns -n kube-system

# DNS 정책 확인
kubectl get pod <pod-name> -o yaml | grep -A 5 dnsPolicy

# 필요시 DNS 정책 수정
spec:
  dnsPolicy: ClusterFirst
  dnsConfig:
    options:
    - name: ndots
      value: "2"
    - name: edns0
```

### 인그레스 문제

#### 502 Bad Gateway
```bash
# 인그레스 컨트롤러 로그
kubectl logs -n ingress-nginx deployment/ingress-nginx-controller

# 업스트림 서비스 확인
kubectl get endpoints -n ai-textbook-prod

# 인그레스 설정 확인
kubectl describe ingress ai-textbook-ingress -n ai-textbook-prod
```

#### 해결
```yaml
# 인그레스 어노테이션 추가
metadata:
  annotations:
    nginx.ingress.kubernetes.io/proxy-connect-timeout: "600"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "600"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "600"
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
```

## 성능 문제

### 높은 메모리 사용

#### 진단
```bash
# 메모리 사용량 상위 Pod
kubectl top pods -n ai-textbook-prod --sort-by=memory

# 메모리 누수 확인
kubectl exec -it <pod-name> -n ai-textbook-prod -- \
  node --inspect=0.0.0.0:9229 dist/main.js

# 힙 덤프 생성
kubectl exec -it <pod-name> -n ai-textbook-prod -- \
  kill -USR2 1
```

#### 해결
```typescript
// 메모리 누수 방지
class TextbookService {
  private cache = new Map();
  
  async processTextbook(id: string) {
    // 캐시 크기 제한
    if (this.cache.size > 100) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    // 대용량 데이터 스트리밍 처리
    const stream = await this.getTextbookStream(id);
    return new Promise((resolve, reject) => {
      const chunks = [];
      stream.on('data', chunk => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });
  }
}
```

### 높은 CPU 사용

#### 진단
```bash
# CPU 프로파일링
kubectl exec -it <pod-name> -n ai-textbook-prod -- \
  node --prof dist/main.js

# 프로파일 분석
kubectl cp <pod-name>:/app/isolate-*.log ./profile.log
node --prof-process profile.log > profile.txt
```

#### 해결
```typescript
// CPU 집약적 작업 최적화
import { Worker } from 'worker_threads';

class TextSegmenter {
  async segmentLargeText(text: string): Promise<string[]> {
    // Worker 스레드 사용
    return new Promise((resolve, reject) => {
      const worker = new Worker('./workers/segmenter.js', {
        workerData: { text }
      });
      
      worker.on('message', resolve);
      worker.on('error', reject);
      worker.on('exit', (code) => {
        if (code !== 0) {
          reject(new Error(`Worker stopped with exit code ${code}`));
        }
      });
    });
  }
}
```

## 보안 문제

### 권한 부족

#### 증상
```
Error: forbidden: User "system:serviceaccount:ai-textbook-prod:core-service" cannot get resource "secrets"
```

#### 해결
```yaml
# RBAC 권한 추가
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: secret-reader
  namespace: ai-textbook-prod
rules:
- apiGroups: [""]
  resources: ["secrets"]
  verbs: ["get", "list"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: read-secrets
  namespace: ai-textbook-prod
subjects:
- kind: ServiceAccount
  name: core-service
  namespace: ai-textbook-prod
roleRef:
  kind: Role
  name: secret-reader
  apiGroup: rbac.authorization.k8s.io
```

### 보안 스캔 실패

#### 이미지 취약점
```bash
# 이미지 스캔
trivy image your-registry/ai-textbook-core:latest

# 취약점 수정
FROM node:18-alpine AS base
# 보안 업데이트
RUN apk update && apk upgrade

# Non-root 사용자
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs
```

## 디버깅 도구

### 원격 디버깅 설정

#### Node.js 애플리케이션
```bash
# 디버깅 모드로 Pod 실행
kubectl exec -it <pod-name> -n ai-textbook-prod -- \
  node --inspect=0.0.0.0:9229 dist/main.js

# 포트 포워딩
kubectl port-forward <pod-name> 9229:9229 -n ai-textbook-prod

# Chrome DevTools에서 접속
chrome://inspect
```

#### 실시간 로그 모니터링
```bash
# 여러 Pod 로그 동시 확인
kubectl logs -f -l app=core-service -n ai-textbook-prod --max-log-requests=10

# 로그 필터링
kubectl logs -f deployment/core-service -n ai-textbook-prod | grep ERROR

# 구조화된 로그 파싱
kubectl logs deployment/core-service -n ai-textbook-prod | jq '.level == "error"'
```

### 트러블슈팅 Pod

```yaml
# k8s/debug/troubleshoot-pod.yaml
apiVersion: v1
kind: Pod
metadata:
  name: troubleshoot
  namespace: ai-textbook-prod
spec:
  containers:
  - name: debug
    image: nicolaka/netshoot
    command: ["/bin/bash"]
    args: ["-c", "while true; do sleep 30; done"]
    securityContext:
      capabilities:
        add: ["NET_ADMIN", "SYS_TIME"]
```

사용 예:
```bash
# Pod 생성
kubectl apply -f k8s/debug/troubleshoot-pod.yaml

# 네트워크 디버깅
kubectl exec -it troubleshoot -n ai-textbook-prod -- bash
$ curl -v http://core-service:3000/health
$ dig postgres-service.ai-textbook-prod.svc.cluster.local
$ traceroute api.ai-textbook.com
```

## 긴급 대응

### 서비스 완전 장애

#### 1. 즉시 조치
```bash
#!/bin/bash
# scripts/emergency-response.sh

# 1. 상태 파악
echo "🚨 Checking system status..."
kubectl get pods -n ai-textbook-prod
kubectl get nodes

# 2. 기본 서비스 복구
echo "🔧 Attempting basic recovery..."
kubectl rollout restart deployment --all -n ai-textbook-prod

# 3. 트래픽 전환 (필요시)
echo "🔄 Switching to maintenance mode..."
kubectl patch ingress ai-textbook-ingress -n ai-textbook-prod \
  --type='json' -p='[{"op": "replace", "path": "/spec/rules/0/http/paths/0/backend/service/name", "value": "maintenance-page"}]'
```

#### 2. 데이터 보호
```bash
# 긴급 백업
kubectl exec -n ai-textbook-prod postgres-0 -- \
  pg_dump -U postgres ai_textbook | gzip > emergency-backup-$(date +%Y%m%d-%H%M%S).sql.gz

# S3 업로드
aws s3 cp emergency-backup-*.sql.gz s3://ai-textbook-backups/emergency/
```

#### 3. 스케일 조정
```bash
# 리소스 확보를 위한 스케일 다운
kubectl scale deployment teacher-web student-web --replicas=1 -n ai-textbook-prod

# 핵심 서비스 스케일 업
kubectl scale deployment core-service auth-service --replicas=5 -n ai-textbook-prod
```

### 복구 확인 체크리스트

```bash
#!/bin/bash
# scripts/recovery-check.sh

echo "✅ Recovery Checklist"

# 1. 서비스 상태
echo -n "1. All pods running: "
kubectl get pods -n ai-textbook-prod --no-headers | grep -v Running | wc -l

# 2. 엔드포인트 응답
echo -n "2. Health checks passing: "
for service in auth core ai; do
  kubectl exec -n ai-textbook-prod deployment/$service-service -- wget -q -O- http://localhost:3000/health
done

# 3. 데이터베이스 연결
echo -n "3. Database accessible: "
kubectl exec -n ai-textbook-prod deployment/core-service -- \
  psql $DATABASE_URL -c "SELECT 1" > /dev/null && echo "OK" || echo "FAIL"

# 4. 외부 접근
echo -n "4. External access: "
curl -s -o /dev/null -w "%{http_code}" https://api.ai-textbook.com/health
```

### 사후 분석 템플릿

```markdown
## 인시던트 보고서

**날짜**: 2024-XX-XX
**영향 시간**: XX:XX - XX:XX (X시간 X분)
**심각도**: Critical / High / Medium / Low

### 요약
[인시던트 간단 설명]

### 타임라인
- XX:XX - 최초 알림 수신
- XX:XX - 문제 확인 시작
- XX:XX - 근본 원인 파악
- XX:XX - 복구 조치 시작
- XX:XX - 서비스 정상화

### 근본 원인
[상세 원인 분석]

### 해결 과정
1. [수행한 조치 1]
2. [수행한 조치 2]
3. [수행한 조치 3]

### 향후 조치
- [ ] [예방 조치 1]
- [ ] [예방 조치 2]
- [ ] [모니터링 개선]

### 교훈
[이번 인시던트에서 배운 점]
```

---

이 문제 해결 가이드는 실제 운영 경험을 바탕으로 지속적으로 업데이트되어야 합니다. 새로운 문제와 해결 방법을 발견하면 문서에 추가해 주세요.