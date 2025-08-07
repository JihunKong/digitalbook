#!/bin/bash
# AWS Lightsail Deployment Script

set -e

echo "========================================"
echo "Digital Book Platform Deployment Script"
echo "========================================"

# Variables
SERVER_IP="43.203.208.204"
SSH_KEY="/Users/jihunkong/DigitalBook/Korean-Text-Book.pem"
REMOTE_USER="ubuntu"
PROJECT_NAME="digitalbook"
REMOTE_PATH="/home/$REMOTE_USER/$PROJECT_NAME"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Preparing deployment to $SERVER_IP${NC}"

# Create deployment package
echo -e "${YELLOW}Creating deployment package...${NC}"
tar -czf digitalbook-deploy.tar.gz \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='*.log' \
  --exclude='dist' \
  --exclude='.next' \
  --exclude='Korean-Text-Book.pem' \
  --exclude='digitalbook-deploy.tar.gz' \
  .

echo -e "${GREEN}Package created successfully${NC}"

# Upload to server
echo -e "${YELLOW}Uploading to server...${NC}"
scp -i "$SSH_KEY" digitalbook-deploy.tar.gz "$REMOTE_USER@$SERVER_IP:~/"

# Execute deployment on server
echo -e "${YELLOW}Executing deployment on server...${NC}"
ssh -i "$SSH_KEY" "$REMOTE_USER@$SERVER_IP" << 'ENDSSH'
# Server deployment script
set -e

# Create project directory
mkdir -p /home/ubuntu/digitalbook
cd /home/ubuntu/digitalbook

# Backup existing data if exists
if [ -d "uploads" ]; then
  echo "Backing up uploads..."
  cp -r uploads uploads_backup_$(date +%Y%m%d_%H%M%S)
fi

# Extract new code
echo "Extracting deployment package..."
tar -xzf ~/digitalbook-deploy.tar.gz -C .

# Install Docker if not exists
if ! command -v docker &> /dev/null; then
  echo "Installing Docker..."
  curl -fsSL https://get.docker.com -o get-docker.sh
  sudo sh get-docker.sh
  sudo usermod -aG docker $USER
  rm get-docker.sh
fi

# Install Docker Compose if not exists
if ! command -v docker-compose &> /dev/null; then
  echo "Installing Docker Compose..."
  sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
  sudo chmod +x /usr/local/bin/docker-compose
fi

# Create necessary directories
mkdir -p uploads logs

# Stop existing containers
echo "Stopping existing containers..."
sudo docker-compose -f docker-compose.prod.yml down || true

# Build and start new containers
echo "Building and starting containers..."
sudo docker-compose -f docker-compose.prod.yml build --no-cache
sudo docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be healthy
echo "Waiting for services to be healthy..."
sleep 30

# Run database migrations
echo "Running database migrations..."
sudo docker-compose -f docker-compose.prod.yml exec -T app npx prisma migrate deploy

# Check service status
echo "Checking service status..."
sudo docker-compose -f docker-compose.prod.yml ps

# Clean up
rm ~/digitalbook-deploy.tar.gz

echo "Deployment completed successfully!"
ENDSSH

# Clean up local package
rm digitalbook-deploy.tar.gz

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment completed successfully!${NC}"
echo -e "${GREEN}Site: https://xn--220bu63c.com${NC}"
echo -e "${GREEN}========================================${NC}"