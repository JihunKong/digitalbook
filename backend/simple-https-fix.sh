#!/bin/bash

# Simple HTTPS Fix - Direct approach
set -e

echo "=== Simple HTTPS Fix ==="

# 1. Kill existing processes
echo "1. Stopping existing processes..."
sudo pkill -f "next" 2>/dev/null || true
sudo pkill -f "node" 2>/dev/null || true
pm2 kill 2>/dev/null || true

sleep 2

# 2. Start app directly with nohup
echo "2. Starting app directly..."
cd /home/ubuntu/digitalbook

# Start the app in background
export NODE_ENV=production
export PORT=3000
nohup npm start > app.log 2>&1 &

echo "Waiting for app to start..."
sleep 15

# Check if app is running
if ps aux | grep -v grep | grep -q "next-server"; then
    echo "App is running!"
else
    echo "App failed to start. Checking log..."
    tail -20 app.log
    exit 1
fi

# 3. Test app locally
echo "3. Testing app..."
curl -I http://localhost:3000 || echo "App may not be ready yet"

# 4. Check nginx configuration
echo "4. Checking nginx..."
sudo systemctl status nginx --no-pager

# 5. Test HTTPS
echo "5. Testing HTTPS access..."
curl -I https://xn--220bu63c.com

echo -e "\n=== Status Check ==="
echo "Processes:"
ps aux | grep -E "next|nginx" | grep -v grep

echo -e "\nPorts:"
sudo ss -tlnp | grep -E ':80|:443|:3000'

echo -e "\n=== Done! ==="
echo "Your site should be accessible at:"
echo "  - https://xn--220bu63c.com"
echo "  - https://3.37.168.225"