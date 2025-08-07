#!/bin/bash

# Git-based deployment script for Korean Digital Textbook Platform
# This script deploys code via Git push/pull instead of direct file transfer

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

SERVER_IP="3.37.168.225"
SERVER_USER="ubuntu"
SSH_KEY="/Users/jihunkong/DigitalBook/disitalbook.pem"
DOMAIN="xn--220bu63c.com"

echo -e "${GREEN}=== Git-based Deployment ===${NC}"
echo -e "Server: ${SERVER_IP} (${DOMAIN})"
echo -e "Time: $(date)"

# 1. Ensure local changes are committed
echo -e "${YELLOW}Checking Git status...${NC}"
if [[ -n $(git status -s) ]]; then
    echo -e "${RED}Uncommitted changes detected. Please commit before deploying.${NC}"
    git status -s
    exit 1
fi

# 2. Push to remote repository
echo -e "${YELLOW}Pushing to remote repository...${NC}"
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
git push origin ${CURRENT_BRANCH}

# 3. Deploy on server via SSH
echo -e "${YELLOW}Deploying on server...${NC}"
ssh -i "${SSH_KEY}" ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
    set -e
    
    echo "=== Server Deployment Started ==="
    cd /home/ubuntu/digitalbook
    
    # Pull latest changes
    echo "Pulling latest changes..."
    git pull origin main
    
    # Install dependencies
    echo "Installing dependencies..."
    npm ci --production
    
    cd backend
    npm ci --production
    cd ..
    
    # Build application
    echo "Building application..."
    npm run build
    
    # Restart services
    echo "Restarting services..."
    sudo systemctl restart digitalbook
    pm2 restart backend
    
    # Health check
    sleep 5
    curl -f http://localhost:3000/api/health || exit 1
    
    echo "=== Deployment Complete ==="
ENDSSH

echo -e "${GREEN}✅ Deployment successful!${NC}"
echo -e "View at: https://${DOMAIN}"