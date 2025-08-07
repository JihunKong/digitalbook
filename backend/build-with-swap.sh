#!/bin/bash

# Build with swap memory
set -e

echo "=== Building with swap memory ==="

# 1. Create swap file if needed
echo "1. Checking/creating swap..."
if ! swapon --show | grep -q swapfile; then
    echo "Creating 2GB swap file..."
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
else
    echo "Swap already exists"
fi

# 2. Clean up memory
echo "2. Cleaning memory..."
sync
echo 3 | sudo tee /proc/sys/vm/drop_caches

# 3. Stop unnecessary services
sudo systemctl stop snapd 2>/dev/null || true
sudo systemctl stop unattended-upgrades 2>/dev/null || true

# 4. Build with limited memory
echo "3. Building Next.js app..."
cd /home/ubuntu/digitalbook
rm -rf .next

# Set memory limits
export NODE_OPTIONS="--max-old-space-size=512"

# Try to build
npm run build || {
    echo "Build failed, trying with even less memory..."
    export NODE_OPTIONS="--max-old-space-size=384"
    npm run build
}

# 5. Start the app
echo "4. Starting app..."
nohup npm start > app.log 2>&1 &

sleep 10

# 6. Check if running
if ps aux | grep -v grep | grep -q "next-server"; then
    echo "App is running!"
    
    # Test HTTPS
    echo "Testing HTTPS..."
    curl -I https://xn--220bu63c.com
else
    echo "App failed to start"
    tail -20 app.log
fi