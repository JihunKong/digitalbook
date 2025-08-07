#!/bin/bash

# AI Textbook Platform Deployment Script
# Usage: ./deploy.sh [staging|production]

set -e

ENVIRONMENT=${1:-staging}
REGISTRY=${DOCKER_REGISTRY:-"your-registry"}
NAMESPACE="ai-textbook-${ENVIRONMENT}"

echo "🚀 Deploying AI Textbook Platform to ${ENVIRONMENT}"

# Build and push Docker images
echo "📦 Building Docker images..."
docker build -t ${REGISTRY}/ai-textbook-frontend:latest -f Dockerfile .
docker build -t ${REGISTRY}/ai-textbook-backend:latest -f backend/Dockerfile ./backend

echo "📤 Pushing images to registry..."
docker push ${REGISTRY}/ai-textbook-frontend:latest
docker push ${REGISTRY}/ai-textbook-backend:latest

# Apply Kubernetes configurations
echo "☸️  Applying Kubernetes configurations..."
if [ "$ENVIRONMENT" = "production" ]; then
    kubectl apply -k k8s/overlays/production/
else
    kubectl apply -k k8s/base/
fi

# Wait for deployments
echo "⏳ Waiting for deployments to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/frontend -n ${NAMESPACE}
kubectl wait --for=condition=available --timeout=300s deployment/backend -n ${NAMESPACE}
kubectl wait --for=condition=ready --timeout=300s pod -l app=postgres -n ${NAMESPACE}

# Run database migrations
echo "🗄️  Running database migrations..."
kubectl exec -it deployment/backend -n ${NAMESPACE} -- npm run migrate

# Display deployment status
echo "✅ Deployment complete!"
kubectl get all -n ${NAMESPACE}

# Get LoadBalancer IP
echo "🌐 Getting external IP..."
kubectl get service nginx-service -n ${NAMESPACE}

echo "📊 Deployment Summary:"
echo "- Environment: ${ENVIRONMENT}"
echo "- Namespace: ${NAMESPACE}"
echo "- Frontend URL: http://$(kubectl get service nginx-service -n ${NAMESPACE} -o jsonpath='{.status.loadBalancer.ingress[0].ip}')"
echo "- API URL: http://$(kubectl get service nginx-service -n ${NAMESPACE} -o jsonpath='{.status.loadBalancer.ingress[0].ip}')/api"