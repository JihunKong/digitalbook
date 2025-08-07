# 모니터링 및 운영 가이드

## 목차
- [개요](#개요)
- [모니터링 스택](#모니터링-스택)
- [메트릭 수집](#메트릭-수집)
- [로깅](#로깅)
- [알림 설정](#알림-설정)
- [대시보드](#대시보드)
- [성능 모니터링](#성능-모니터링)
- [보안 모니터링](#보안-모니터링)
- [운영 절차](#운영-절차)

## 개요

### 모니터링 목표
- **가용성**: 99.9% 이상 서비스 가동률
- **성능**: 평균 응답시간 200ms 이하
- **안정성**: 에러율 0.1% 이하
- **보안**: 실시간 위협 감지 및 대응

### 모니터링 원칙
1. **예방적 모니터링**: 문제 발생 전 감지
2. **종합적 가시성**: 전체 시스템 상태 파악
3. **자동화된 대응**: 일반적 문제 자동 해결
4. **데이터 기반 의사결정**: 메트릭 기반 개선

## 모니터링 스택

### 아키텍처
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Applications  │────▶│   Prometheus    │────▶│     Grafana     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                       │                         │
         │                       ▼                         │
         │              ┌─────────────────┐               │
         │              │  AlertManager   │               │
         │              └─────────────────┘               │
         │                       │                         │
         ▼                       ▼                         ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Fluent Bit    │────▶│ Elasticsearch   │────▶│     Kibana      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### 구성 요소
- **Prometheus**: 메트릭 수집 및 저장
- **Grafana**: 시각화 및 대시보드
- **AlertManager**: 알림 관리 및 라우팅
- **Elasticsearch**: 로그 저장 및 검색
- **Kibana**: 로그 분석 및 시각화
- **Fluent Bit**: 로그 수집 및 전달

## 메트릭 수집

### Prometheus 설정
```yaml
# k8s/monitoring/prometheus-values.yaml
prometheus:
  prometheusSpec:
    serviceMonitorSelectorNilUsesHelmValues: false
    podMonitorSelectorNilUsesHelmValues: false
    retention: 30d
    storageSpec:
      volumeClaimTemplate:
        spec:
          accessModes: ["ReadWriteOnce"]
          resources:
            requests:
              storage: 50Gi
    
    scrapeInterval: 15s
    evaluationInterval: 15s
    
    additionalScrapeConfigs:
    - job_name: 'kubernetes-pods'
      kubernetes_sd_configs:
      - role: pod
      relabel_configs:
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        action: keep
        regex: true
```

### 애플리케이션 메트릭

#### Node.js 메트릭
```typescript
// services/core/src/metrics/index.ts
import { register, collectDefaultMetrics } from 'prom-client';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';

// 기본 메트릭 수집 (CPU, 메모리, GC 등)
collectDefaultMetrics({ register });

// HTTP 요청 메트릭
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
});

// 비즈니스 메트릭
export const textbooksCreated = new Counter({
  name: 'textbooks_created_total',
  help: 'Total number of textbooks created',
  labelNames: ['grade_level', 'subject'],
});

export const activeLearningSessions = new Gauge({
  name: 'active_learning_sessions',
  help: 'Number of currently active learning sessions',
  labelNames: ['textbook_id'],
});

export const aiTokensUsed = new Counter({
  name: 'ai_tokens_used_total',
  help: 'Total number of AI tokens consumed',
  labelNames: ['service', 'model'],
});

// 메트릭 미들웨어
export class MetricsMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = (Date.now() - start) / 1000;
      httpRequestDuration
        .labels(req.method, req.route?.path || req.path, res.statusCode.toString())
        .observe(duration);
    });
    
    next();
  }
}
```

#### 커스텀 메트릭 예시
```typescript
// 교재 생성 시
textbooksCreated.labels(gradeLevel.toString(), subject).inc();

// 학습 세션 시작/종료
activeLearningSessions.labels(textbookId).inc();
// ...
activeLearningSessions.labels(textbookId).dec();

// AI 사용량 추적
aiTokensUsed.labels('tutor', 'claude-3').inc(tokensUsed);
```

### ServiceMonitor 설정
```yaml
# k8s/monitoring/service-monitor.yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: ai-textbook-services
  namespace: ai-textbook-prod
spec:
  selector:
    matchLabels:
      monitoring: enabled
  endpoints:
  - port: metrics
    interval: 30s
    path: /metrics
```

## 로깅

### Fluent Bit 설정
```yaml
# k8s/logging/fluent-bit-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: fluent-bit-config
  namespace: logging
data:
  fluent-bit.conf: |
    [SERVICE]
        Flush         1
        Log_Level     info
        Daemon        off

    [INPUT]
        Name              tail
        Path              /var/log/containers/*.log
        Parser            docker
        Tag               kube.*
        Refresh_Interval  5
        Skip_Long_Lines   On

    [FILTER]
        Name                kubernetes
        Match               kube.*
        Kube_URL            https://kubernetes.default.svc:443
        Kube_CA_File        /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
        Kube_Token_File     /var/run/secrets/kubernetes.io/serviceaccount/token
        Merge_Log           On
        K8S-Logging.Parser  On
        K8S-Logging.Exclude On

    [OUTPUT]
        Name            es
        Match           *
        Host            elasticsearch
        Port            9200
        Logstash_Format On
        Logstash_Prefix ai-textbook
        Retry_Limit     False
        Type            _doc
```

### 구조화된 로깅
```typescript
// services/shared/utils/logger.ts
import winston from 'winston';
import { ElasticsearchTransport } from 'winston-elasticsearch';

const esTransportOpts = {
  level: 'info',
  clientOpts: { node: process.env.ELASTICSEARCH_URL },
  index: 'ai-textbook-logs',
};

export const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: process.env.SERVICE_NAME,
    environment: process.env.NODE_ENV,
    version: process.env.APP_VERSION,
  },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    new ElasticsearchTransport(esTransportOpts),
  ],
});

// 로그 컨텍스트 추가
export function createLogger(context: string) {
  return logger.child({ context });
}

// 사용 예시
const log = createLogger('TextbookService');

log.info('Textbook created', {
  textbookId: textbook.id,
  userId: user.id,
  pageCount: pages.length,
  processingTime: endTime - startTime,
});

log.error('Failed to generate image', {
  error: error.message,
  stack: error.stack,
  pageId: page.id,
  attempt: retryCount,
});
```

### 로그 집계 쿼리
```json
// Kibana에서 사용할 쿼리 예시
{
  "query": {
    "bool": {
      "must": [
        { "term": { "level": "error" } },
        { "range": { "@timestamp": { "gte": "now-1h" } } }
      ]
    }
  },
  "aggs": {
    "errors_by_service": {
      "terms": {
        "field": "service.keyword",
        "size": 10
      }
    }
  }
}
```

## 알림 설정

### AlertManager 구성
```yaml
# k8s/monitoring/alertmanager-values.yaml
alertmanager:
  config:
    global:
      resolve_timeout: 5m
      slack_api_url: $SLACK_WEBHOOK_URL
    
    route:
      group_by: ['alertname', 'cluster', 'service']
      group_wait: 10s
      group_interval: 10s
      repeat_interval: 12h
      receiver: 'default'
      routes:
      - match:
          severity: critical
        receiver: 'critical'
        continue: true
      - match:
          severity: warning
        receiver: 'warning'
    
    receivers:
    - name: 'default'
      slack_configs:
      - channel: '#alerts'
        title: 'AI Textbook Alert'
        text: '{{ range .Alerts }}{{ .Annotations.summary }}{{ end }}'
    
    - name: 'critical'
      slack_configs:
      - channel: '#alerts-critical'
        title: '🚨 CRITICAL: {{ .GroupLabels.alertname }}'
      pagerduty_configs:
      - service_key: $PAGERDUTY_SERVICE_KEY
    
    - name: 'warning'
      slack_configs:
      - channel: '#alerts-warning'
        title: '⚠️ Warning: {{ .GroupLabels.alertname }}'
```

### 알림 규칙
```yaml
# k8s/monitoring/prometheus-rules.yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: ai-textbook-rules
  namespace: ai-textbook-prod
spec:
  groups:
  - name: availability
    interval: 30s
    rules:
    - alert: ServiceDown
      expr: up{job=~".*ai-textbook.*"} == 0
      for: 2m
      labels:
        severity: critical
      annotations:
        summary: "Service {{ $labels.job }} is down"
        description: "{{ $labels.instance }} of job {{ $labels.job }} has been down for more than 2 minutes."
    
    - alert: HighErrorRate
      expr: |
        (
          sum(rate(http_requests_total{status=~"5.."}[5m])) by (service)
          /
          sum(rate(http_requests_total[5m])) by (service)
        ) > 0.05
      for: 5m
      labels:
        severity: critical
      annotations:
        summary: "High error rate on {{ $labels.service }}"
        description: "Error rate is {{ $value | humanizePercentage }} for {{ $labels.service }}"
  
  - name: performance
    rules:
    - alert: HighResponseTime
      expr: |
        histogram_quantile(0.95,
          sum(rate(http_request_duration_seconds_bucket[5m])) by (service, le)
        ) > 1
      for: 10m
      labels:
        severity: warning
      annotations:
        summary: "High response time on {{ $labels.service }}"
        description: "95th percentile response time is {{ $value }}s"
    
    - alert: HighCPUUsage
      expr: |
        (
          100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)
        ) > 80
      for: 10m
      labels:
        severity: warning
      annotations:
        summary: "High CPU usage on {{ $labels.instance }}"
        description: "CPU usage is {{ $value }}%"
  
  - name: business
    rules:
    - alert: NoTextbooksCreated
      expr: |
        increase(textbooks_created_total[1h]) == 0
      for: 2h
      labels:
        severity: warning
      annotations:
        summary: "No textbooks created in the last hour"
        description: "Check if there are any issues with the textbook creation service"
    
    - alert: HighAITokenUsage
      expr: |
        increase(ai_tokens_used_total[1h]) > 1000000
      labels:
        severity: warning
      annotations:
        summary: "High AI token usage"
        description: "Used {{ $value }} tokens in the last hour"
```

## 대시보드

### Grafana 대시보드 구성

#### 시스템 개요 대시보드
```json
{
  "dashboard": {
    "title": "AI Textbook - System Overview",
    "panels": [
      {
        "title": "Service Health",
        "type": "stat",
        "targets": [{
          "expr": "sum(up{job=~\".*ai-textbook.*\"})"
        }]
      },
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": [{
          "expr": "sum(rate(http_requests_total[5m])) by (service)"
        }]
      },
      {
        "title": "Error Rate",
        "type": "graph",
        "targets": [{
          "expr": "sum(rate(http_requests_total{status=~\"5..\"}[5m])) by (service) / sum(rate(http_requests_total[5m])) by (service)"
        }]
      },
      {
        "title": "Response Time (P95)",
        "type": "graph",
        "targets": [{
          "expr": "histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (service, le))"
        }]
      }
    ]
  }
}
```

#### 비즈니스 메트릭 대시보드
```json
{
  "dashboard": {
    "title": "AI Textbook - Business Metrics",
    "panels": [
      {
        "title": "Active Users",
        "type": "stat",
        "targets": [{
          "expr": "sum(active_users_total)"
        }]
      },
      {
        "title": "Textbooks Created Today",
        "type": "stat",
        "targets": [{
          "expr": "increase(textbooks_created_total[1d])"
        }]
      },
      {
        "title": "Learning Sessions",
        "type": "graph",
        "targets": [{
          "expr": "sum(active_learning_sessions) by (textbook_id)"
        }]
      },
      {
        "title": "AI Token Usage",
        "type": "graph",
        "targets": [{
          "expr": "rate(ai_tokens_used_total[5m]) by (model)"
        }]
      }
    ]
  }
}
```

### 커스텀 대시보드 생성
```bash
# Grafana API를 통한 대시보드 생성
curl -X POST http://grafana:3000/api/dashboards/db \
  -H "Authorization: Bearer $GRAFANA_API_KEY" \
  -H "Content-Type: application/json" \
  -d @dashboard.json
```

## 성능 모니터링

### APM (Application Performance Monitoring)
```typescript
// services/core/src/tracing/index.ts
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';

const jaegerExporter = new JaegerExporter({
  endpoint: 'http://jaeger:14268/api/traces',
});

const sdk = new NodeSDK({
  traceExporter: jaegerExporter,
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-fs': {
        enabled: false,
      },
    }),
  ],
});

sdk.start();
```

### 성능 분석 쿼리
```sql
-- 느린 API 엔드포인트 찾기
SELECT 
  route,
  COUNT(*) as request_count,
  AVG(duration) as avg_duration,
  MAX(duration) as max_duration,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration) as p95_duration
FROM http_requests
WHERE timestamp > NOW() - INTERVAL '1 hour'
GROUP BY route
HAVING AVG(duration) > 1000
ORDER BY p95_duration DESC;
```

### 리소스 사용량 모니터링
```yaml
# k8s/monitoring/resource-quotas.yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: ai-textbook-quota
  namespace: ai-textbook-prod
spec:
  hard:
    requests.cpu: "100"
    requests.memory: 200Gi
    limits.cpu: "200"
    limits.memory: 400Gi
    persistentvolumeclaims: "10"
```

## 보안 모니터링

### 보안 이벤트 감지
```yaml
# k8s/monitoring/falco-rules.yaml
- rule: Unauthorized API Access
  desc: Detect unauthorized access attempts to API
  condition: >
    evt.type = open and 
    container.id != host and
    fd.name contains "/api/" and
    proc.name != "node"
  output: >
    Unauthorized API access attempt (user=%user.name command=%proc.cmdline file=%fd.name)
  priority: WARNING

- rule: Suspicious Database Query
  desc: Detect potential SQL injection attempts
  condition: >
    evt.type = write and
    fd.name contains "postgres" and
    evt.buffer contains "UNION" or evt.buffer contains "DROP"
  output: >
    Suspicious database query detected (user=%user.name query=%evt.buffer)
  priority: CRITICAL
```

### 보안 대시보드
```json
{
  "panels": [
    {
      "title": "Failed Login Attempts",
      "targets": [{
        "expr": "sum(rate(auth_login_failed_total[5m])) by (reason)"
      }]
    },
    {
      "title": "API Rate Limit Violations",
      "targets": [{
        "expr": "sum(rate(rate_limit_exceeded_total[5m])) by (client_ip)"
      }]
    },
    {
      "title": "Suspicious Activities",
      "targets": [{
        "expr": "sum(security_events_total) by (event_type)"
      }]
    }
  ]
}
```

## 운영 절차

### 일일 점검 체크리스트
```markdown
## 오전 점검 (09:00)
- [ ] 시스템 헬스 체크 (모든 서비스 정상 작동)
- [ ] 야간 알림 확인 및 처리
- [ ] 디스크 사용량 확인 (80% 미만)
- [ ] 백업 완료 여부 확인
- [ ] 에러 로그 검토

## 오후 점검 (18:00)
- [ ] 일일 메트릭 리뷰
- [ ] 성능 이슈 확인
- [ ] 보안 이벤트 검토
- [ ] 내일 예정된 작업 확인
```

### 주간 운영 작업
```bash
#!/bin/bash
# scripts/weekly-maintenance.sh

echo "🔧 Starting weekly maintenance..."

# 1. 로그 정리
echo "Cleaning old logs..."
kubectl exec -n logging elasticsearch-0 -- \
  curl -X DELETE "localhost:9200/ai-textbook-logs-$(date -d '30 days ago' +%Y.%m.*)"

# 2. 메트릭 압축
echo "Compacting metrics..."
kubectl exec -n monitoring prometheus-0 -- \
  promtool tsdb compact /prometheus

# 3. 이미지 정리
echo "Cleaning unused images..."
docker system prune -a -f

# 4. 백업 검증
echo "Verifying backups..."
./scripts/verify-backup.sh

echo "✅ Weekly maintenance completed!"
```

### 장애 대응 플레이북

#### 서비스 다운
```bash
# 1. 상태 확인
kubectl get pods -n ai-textbook-prod
kubectl describe pod <pod-name> -n ai-textbook-prod

# 2. 재시작
kubectl rollout restart deployment/<service> -n ai-textbook-prod

# 3. 로그 확인
kubectl logs -f deployment/<service> -n ai-textbook-prod --tail=100

# 4. 이전 버전으로 롤백 (필요시)
kubectl rollout undo deployment/<service> -n ai-textbook-prod
```

#### 성능 저하
```bash
# 1. 부하 확인
kubectl top nodes
kubectl top pods -n ai-textbook-prod

# 2. 스케일 아웃
kubectl scale deployment/<service> -n ai-textbook-prod --replicas=5

# 3. 캐시 초기화
kubectl exec -n ai-textbook-prod <redis-pod> -- redis-cli FLUSHALL

# 4. 데이터베이스 쿼리 분석
kubectl exec -n ai-textbook-prod <postgres-pod> -- psql -c "SELECT * FROM pg_stat_activity WHERE state = 'active';"
```

### 정기 보고서
```markdown
## 월간 운영 보고서 템플릿

### 1. 시스템 가용성
- 전체 가용성: 99.95%
- 다운타임: 21분 (계획된 유지보수 15분 포함)

### 2. 성능 지표
- 평균 응답시간: 187ms
- P95 응답시간: 520ms
- 일일 평균 요청 수: 2.5M

### 3. 리소스 사용량
- CPU 평균 사용률: 45%
- 메모리 평균 사용률: 62%
- 스토리지 사용량: 125GB / 500GB

### 4. 주요 인시던트
- [날짜] 이슈 설명 및 해결 방법

### 5. 개선 사항
- 구현된 최적화
- 예정된 업그레이드
```

---

이 모니터링 가이드는 시스템의 안정적인 운영을 위한 기본 프레임워크를 제공합니다. 운영 경험이 축적됨에 따라 지속적으로 개선해 나가시기 바랍니다.