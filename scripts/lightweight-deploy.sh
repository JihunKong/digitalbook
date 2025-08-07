#!/bin/bash
# Lightweight deployment for 1GB RAM server

set -e

echo "Lightweight deployment for low-memory server"

# Build locally
echo "Building locally..."
npm run build

# Create deployment package
echo "Creating package..."
tar -czf deploy.tar.gz \
  .next \
  public \
  package.json \
  package-lock.json \
  ecosystem.config.js \
  .env.production

# Upload to server
echo "Uploading to server..."
scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
  -i /Users/jihunkong/DigitalBook/Korean-Text-Book.pem \
  deploy.tar.gz \
  ubuntu@43.203.208.204:~/

# Deploy on server
ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
  -i /Users/jihunkong/DigitalBook/Korean-Text-Book.pem ubuntu@43.203.208.204 << 'EOF'
# Extract files
cd ~
mkdir -p digitalbook-lite
tar -xzf deploy.tar.gz -C digitalbook-lite
cd digitalbook-lite

# Install only production dependencies
npm ci --production

# Install PM2
sudo npm install -g pm2

# Stop any existing processes
sudo pm2 delete all || true
sudo killall node || true

# Set up environment
export NODE_ENV=production
export PORT=80

# Start with PM2
sudo pm2 start ecosystem.config.js
sudo pm2 save
sudo pm2 startup

# Enable swap for memory
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Check status
sudo pm2 status
free -m

echo "Deployment completed!"
EOF

rm deploy.tar.gz
echo "Site available at: http://xn--220bu63c.com"