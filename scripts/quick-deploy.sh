#!/bin/bash
# Quick deployment script for AWS Lightsail

set -e

echo "Quick deployment to AWS Lightsail"

# Variables
SERVER_IP="43.203.208.204"
SSH_KEY="/Users/jihunkong/DigitalBook/Korean-Text-Book.pem"
REMOTE_USER="ubuntu"

# Copy necessary files
echo "Copying files to server..."
scp -i "$SSH_KEY" -r \
  Dockerfile \
  docker-compose.simple.yml \
  package.json \
  package-lock.json \
  next.config.js \
  tailwind.config.js \
  postcss.config.js \
  tsconfig.json \
  .env.production \
  "$REMOTE_USER@$SERVER_IP:~/digitalbook/"

# Copy source directories
echo "Copying source code..."
scp -i "$SSH_KEY" -r src public "$REMOTE_USER@$SERVER_IP:~/digitalbook/"

# Deploy on server
echo "Deploying on server..."
ssh -i "$SSH_KEY" "$REMOTE_USER@$SERVER_IP" << 'EOF'
cd ~/digitalbook

# Create directories
mkdir -p uploads logs

# Stop any existing containers
sudo docker-compose -f docker-compose.simple.yml down || true

# Build and start
echo "Building Docker image..."
sudo docker-compose -f docker-compose.simple.yml build

echo "Starting services..."
sudo docker-compose -f docker-compose.simple.yml up -d

echo "Waiting for services to start..."
sleep 10

# Check status
sudo docker-compose -f docker-compose.simple.yml ps

echo "Deployment completed!"
EOF

echo "Site should be available at: http://xn--220bu63c.com"