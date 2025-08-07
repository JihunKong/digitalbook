# 배포 가이드

## 목차
- [개요](#개요)
- [사전 준비](#사전-준비)
- [Docker 이미지 빌드](#docker-이미지-빌드)
- [Kubernetes 배포](#kubernetes-배포)
- [CI/CD 파이프라인](#cicd-파이프라인)
- [환경별 설정](#환경별-설정)
- [모니터링 설정](#모니터링-설정)
- [롤백 절차](#롤백-절차)
- [보안 체크리스트](#보안-체크리스트)

## 개요

### 배포 환경
- **Development**: 개발 환경 (dev.ai-textbook.com)
- **Staging**: 스테이징 환경 (staging.ai-textbook.com)
- **Production**: 프로덕션 환경 (ai-textbook.com)

### 인프라 구성
- **클라우드**: AWS Lightsail
- **컨테이너 오케스트레이션**: Kubernetes (K3s)
- **컨테이너 레지스트리**: AWS ECR
- **CI/CD**: GitHub Actions + ArgoCD

## 사전 준비

### 필수 도구 설치
```bash
# AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Helm
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# ArgoCD CLI
curl -sSL -o argocd-linux-amd64 https://github.com/argoproj/argo-cd/releases/latest/download/argocd-linux-amd64
sudo install -m 555 argocd-linux-amd64 /usr/local/bin/argocd
```

### AWS 설정
```bash
# AWS 자격 증명 설정
aws configure
AWS Access Key ID [None]: your-access-key
AWS Secret Access Key [None]: your-secret-key
Default region name [None]: ap-northeast-2
Default output format [None]: json

# ECR 로그인
aws ecr get-login-password --region ap-northeast-2 | docker login --username AWS --password-stdin your-account-id.dkr.ecr.ap-northeast-2.amazonaws.com
```

### Kubernetes 클러스터 연결
```bash
# kubeconfig 설정
aws eks update-kubeconfig --region ap-northeast-2 --name ai-textbook-cluster

# 연결 확인
kubectl cluster-info
kubectl get nodes
```

## Docker 이미지 빌드

### 멀티스테이지 Dockerfile

#### Backend 서비스
```dockerfile
# services/core/Dockerfile
# 빌드 스테이지
FROM node:18-alpine AS builder

# pnpm 설치
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# 의존성 캐싱
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# 소스 복사 및 빌드
COPY . .
RUN pnpm build

# 프로덕션 의존성만 설치
RUN pnpm prune --prod

# 런타임 스테이지
FROM node:18-alpine AS runner

# 보안을 위한 non-root 사용자
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

WORKDIR /app

# 필요한 파일만 복사
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./

USER nodejs

EXPOSE 3000

# 헬스체크
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node healthcheck.js || exit 1

CMD ["node", "dist/main.js"]
```

#### Frontend 애플리케이션
```dockerfile
# apps/teacher-web/Dockerfile
# 빌드 스테이지
FROM node:18-alpine AS deps
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# 빌더 스테이지
FROM node:18-alpine AS builder
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 빌드 시 환경 변수
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN pnpm build

# 런너 스테이지
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Next.js 정적 파일
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

### 이미지 빌드 스크립트
```bash
#!/bin/bash
# scripts/build-images.sh

set -e

REGISTRY="your-account-id.dkr.ecr.ap-northeast-2.amazonaws.com"
VERSION=${1:-latest}

echo "🏗️ Building Docker images..."

# Backend 서비스 빌드
for service in auth core ai; do
  echo "Building $service service..."
  docker build \
    -t $REGISTRY/ai-textbook-$service:$VERSION \
    -t $REGISTRY/ai-textbook-$service:latest \
    -f services/$service/Dockerfile \
    services/$service
done

# Frontend 앱 빌드
for app in teacher student; do
  echo "Building $app web app..."
  docker build \
    -t $REGISTRY/ai-textbook-$app-web:$VERSION \
    -t $REGISTRY/ai-textbook-$app-web:latest \
    --build-arg NEXT_PUBLIC_API_URL=https://api.ai-textbook.com \
    -f apps/$app-web/Dockerfile \
    apps/$app-web
done

echo "✅ Build completed!"
```

### 이미지 푸시
```bash
#!/bin/bash
# scripts/push-images.sh

set -e

REGISTRY="your-account-id.dkr.ecr.ap-northeast-2.amazonaws.com"
VERSION=${1:-latest}

echo "📤 Pushing images to ECR..."

# ECR 로그인
aws ecr get-login-password --region ap-northeast-2 | docker login --username AWS --password-stdin $REGISTRY

# 이미지 푸시
for image in auth core ai teacher-web student-web; do
  echo "Pushing ai-textbook-$image:$VERSION..."
  docker push $REGISTRY/ai-textbook-$image:$VERSION
  docker push $REGISTRY/ai-textbook-$image:latest
done

echo "✅ Push completed!"
```

## Kubernetes 배포

### 네임스페이스 생성
```yaml
# k8s/namespaces/production.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: ai-textbook-prod
  labels:
    name: ai-textbook-prod
    environment: production
```

### ConfigMap
```yaml
# k8s/configmaps/app-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: ai-textbook-prod
data:
  NODE_ENV: "production"
  API_PORT: "3000"
  DATABASE_POOL_SIZE: "20"
  REDIS_MAX_RETRIES: "3"
  LOG_LEVEL: "info"
  CORS_ORIGIN: "https://teacher.ai-textbook.com,https://student.ai-textbook.com"
```

### Secret 관리
```yaml
# k8s/secrets/app-secrets.yaml (예시 - 실제로는 Sealed Secrets 사용)
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
  namespace: ai-textbook-prod
type: Opaque
stringData:
  DATABASE_URL: "postgresql://user:pass@postgres:5432/ai_textbook"
  REDIS_URL: "redis://redis:6379"
  JWT_SECRET: "your-production-jwt-secret"
  CLAUDE_API_KEY: "sk-ant-..."
  DALLE_API_KEY: "sk-..."
```

### Deployment 예시
```yaml
# k8s/deployments/core-service.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: core-service
  namespace: ai-textbook-prod
  labels:
    app: core-service
    version: v1
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: core-service
  template:
    metadata:
      labels:
        app: core-service
        version: v1
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "3000"
        prometheus.io/path: "/metrics"
    spec:
      serviceAccountName: core-service
      securityContext:
        runAsNonRoot: true
        runAsUser: 1001
        fsGroup: 1001
      containers:
      - name: core-service
        image: your-account-id.dkr.ecr.ap-northeast-2.amazonaws.com/ai-textbook-core:latest
        imagePullPolicy: Always
        ports:
        - name: http
          containerPort: 3000
          protocol: TCP
        envFrom:
        - configMapRef:
            name: app-config
        - secretRef:
            name: app-secrets
        resources:
          requests:
            memory: "256Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: http
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /ready
            port: http
          initialDelaySeconds: 5
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
        volumeMounts:
        - name: app-logs
          mountPath: /app/logs
      volumes:
      - name: app-logs
        emptyDir: {}
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchExpressions:
                - key: app
                  operator: In
                  values:
                  - core-service
              topologyKey: kubernetes.io/hostname
```

### Service
```yaml
# k8s/services/core-service.yaml
apiVersion: v1
kind: Service
metadata:
  name: core-service
  namespace: ai-textbook-prod
  labels:
    app: core-service
spec:
  type: ClusterIP
  ports:
  - port: 80
    targetPort: http
    protocol: TCP
    name: http
  selector:
    app: core-service
```

### Ingress
```yaml
# k8s/ingress/main-ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ai-textbook-ingress
  namespace: ai-textbook-prod
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
spec:
  tls:
  - hosts:
    - api.ai-textbook.com
    - teacher.ai-textbook.com
    - student.ai-textbook.com
    secretName: ai-textbook-tls
  rules:
  - host: api.ai-textbook.com
    http:
      paths:
      - path: /auth
        pathType: Prefix
        backend:
          service:
            name: auth-service
            port:
              number: 80
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: core-service
            port:
              number: 80
      - path: /ai
        pathType: Prefix
        backend:
          service:
            name: ai-service
            port:
              number: 80
  - host: teacher.ai-textbook.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: teacher-web
            port:
              number: 80
  - host: student.ai-textbook.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: student-web
            port:
              number: 80
```

### HorizontalPodAutoscaler
```yaml
# k8s/hpa/core-service-hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: core-service-hpa
  namespace: ai-textbook-prod
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: core-service
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 10
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
```

## CI/CD 파이프라인

### GitHub Actions 워크플로우
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  workflow_dispatch:

env:
  AWS_REGION: ap-northeast-2
  ECR_REGISTRY: your-account-id.dkr.ecr.ap-northeast-2.amazonaws.com

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install pnpm
      uses: pnpm/action-setup@v2
      with:
        version: 8
        
    - name: Install dependencies
      run: pnpm install --frozen-lockfile
      
    - name: Run tests
      run: pnpm test
      
    - name: Run linting
      run: pnpm lint

  build-and-push:
    needs: test
    runs-on: ubuntu-latest
    strategy:
      matrix:
        service: [auth, core, ai, teacher-web, student-web]
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v2
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: ${{ env.AWS_REGION }}
    
    - name: Login to Amazon ECR
      id: login-ecr
      uses: aws-actions/amazon-ecr-login@v1
    
    - name: Build and push Docker image
      env:
        ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        IMAGE_TAG: ${{ github.sha }}
      run: |
        docker build -t $ECR_REGISTRY/ai-textbook-${{ matrix.service }}:$IMAGE_TAG \
                     -t $ECR_REGISTRY/ai-textbook-${{ matrix.service }}:latest \
                     -f services/${{ matrix.service }}/Dockerfile \
                     services/${{ matrix.service }}
        docker push $ECR_REGISTRY/ai-textbook-${{ matrix.service }}:$IMAGE_TAG
        docker push $ECR_REGISTRY/ai-textbook-${{ matrix.service }}:latest

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Update Kubernetes manifests
      run: |
        sed -i "s|image:.*|image: ${{ env.ECR_REGISTRY }}/ai-textbook-.*:${{ github.sha }}|g" k8s/deployments/*.yaml
    
    - name: Commit and push changes
      run: |
        git config --local user.email "action@github.com"
        git config --local user.name "GitHub Action"
        git add k8s/deployments/*.yaml
        git commit -m "Update images to ${{ github.sha }}"
        git push

  notify:
    needs: deploy
    runs-on: ubuntu-latest
    if: always()
    
    steps:
    - name: Send Slack notification
      uses: 8398a7/action-slack@v3
      with:
        status: ${{ job.status }}
        text: |
          Deployment ${{ job.status }}
          Commit: ${{ github.sha }}
          Author: ${{ github.actor }}
      env:
        SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

### ArgoCD 설정
```yaml
# argocd/application.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: ai-textbook
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/your-org/ai-textbook
    targetRevision: HEAD
    path: k8s
  destination:
    server: https://kubernetes.default.svc
    namespace: ai-textbook-prod
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
      allowEmpty: false
    syncOptions:
    - Validate=true
    - CreateNamespace=false
    - PrunePropagationPolicy=foreground
    retry:
      limit: 5
      backoff:
        duration: 5s
        factor: 2
        maxDuration: 3m
```

## 환경별 설정

### 환경 변수 관리
```bash
# scripts/generate-env.sh
#!/bin/bash

ENVIRONMENT=$1

case $ENVIRONMENT in
  dev)
    API_URL="https://api-dev.ai-textbook.com"
    DB_HOST="dev-db.ai-textbook.com"
    ;;
  staging)
    API_URL="https://api-staging.ai-textbook.com"
    DB_HOST="staging-db.ai-textbook.com"
    ;;
  prod)
    API_URL="https://api.ai-textbook.com"
    DB_HOST="prod-db.ai-textbook.com"
    ;;
  *)
    echo "Unknown environment: $ENVIRONMENT"
    exit 1
    ;;
esac

cat > .env.$ENVIRONMENT <<EOF
API_URL=$API_URL
DATABASE_HOST=$DB_HOST
NODE_ENV=$ENVIRONMENT
EOF
```

### Helm Charts
```yaml
# helm/ai-textbook/values.yaml
global:
  environment: production
  imageRegistry: your-account-id.dkr.ecr.ap-northeast-2.amazonaws.com

auth:
  replicaCount: 2
  image:
    repository: ai-textbook-auth
    tag: latest
  resources:
    requests:
      memory: "128Mi"
      cpu: "50m"
    limits:
      memory: "256Mi"
      cpu: "200m"

core:
  replicaCount: 3
  image:
    repository: ai-textbook-core
    tag: latest
  resources:
    requests:
      memory: "256Mi"
      cpu: "100m"
    limits:
      memory: "512Mi"
      cpu: "500m"

postgresql:
  enabled: true
  auth:
    postgresPassword: "change-me"
    database: "ai_textbook"
  persistence:
    enabled: true
    size: 10Gi

redis:
  enabled: true
  auth:
    enabled: true
    password: "change-me"
  master:
    persistence:
      enabled: true
      size: 5Gi
```

## 모니터링 설정

### Prometheus 설정
```yaml
# k8s/monitoring/prometheus-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
  namespace: monitoring
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s
      evaluation_interval: 15s

    scrape_configs:
    - job_name: 'kubernetes-pods'
      kubernetes_sd_configs:
      - role: pod
        namespaces:
          names:
          - ai-textbook-prod
      relabel_configs:
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        action: keep
        regex: true
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
        action: replace
        target_label: __metrics_path__
        regex: (.+)
      - source_labels: [__address__, __meta_kubernetes_pod_annotation_prometheus_io_port]
        action: replace
        regex: ([^:]+)(?::\d+)?;(\d+)
        replacement: $1:$2
        target_label: __address__
```

### 애플리케이션 메트릭
```typescript
// services/core/src/metrics/index.ts
import { register } from 'prom-client';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';

export const metricsModule = PrometheusModule.register({
  defaultMetrics: {
    enabled: true,
  },
  defaultLabels: {
    app: 'ai-textbook',
    service: 'core',
  },
});

// 커스텀 메트릭
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5],
});

export const activeUsers = new Gauge({
  name: 'active_users_total',
  help: 'Number of currently active users',
  labelNames: ['user_type'],
});
```

## 롤백 절차

### 자동 롤백
```yaml
# k8s/deployments/core-service.yaml (일부)
spec:
  progressDeadlineSeconds: 600
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
```

### 수동 롤백
```bash
#!/bin/bash
# scripts/rollback.sh

SERVICE=$1
REVISION=${2:-1}

if [ -z "$SERVICE" ]; then
  echo "Usage: ./rollback.sh <service> [revision]"
  exit 1
fi

echo "🔄 Rolling back $SERVICE..."

# 이전 버전으로 롤백
kubectl rollout undo deployment/$SERVICE -n ai-textbook-prod --to-revision=$REVISION

# 롤백 상태 확인
kubectl rollout status deployment/$SERVICE -n ai-textbook-prod

# 롤백 후 pod 상태 확인
kubectl get pods -n ai-textbook-prod -l app=$SERVICE

echo "✅ Rollback completed!"