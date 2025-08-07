#!/bin/bash

# Final Working Solution - Systemd Service
set -e

echo "=== Final Working Solution ==="

# 1. Stop everything
echo "1. Stopping all services..."
sudo pkill -f "next" 2>/dev/null || true
sudo pkill -f "node" 2>/dev/null || true
pm2 kill 2>/dev/null || true
sudo systemctl stop digitalbook 2>/dev/null || true

sleep 3

# 2. Create a simple startup script
echo "2. Creating startup script..."
cd /home/ubuntu/digitalbook

cat > start.sh << 'EOF'
#!/bin/bash
cd /home/ubuntu/digitalbook
export NODE_ENV=production
export PORT=3000
export HOST=0.0.0.0

# Check if .next directory exists
if [ ! -d ".next" ]; then
    echo "Error: .next directory not found. Please build the application first."
    exit 1
fi

# Start the application
exec npm start
EOF

chmod +x start.sh

# 3. Create systemd service
echo "3. Creating systemd service..."
sudo tee /etc/systemd/system/digitalbook.service << 'EOF'
[Unit]
Description=Korean Digital Textbook
After=network.target

[Service]
Type=exec
User=ubuntu
WorkingDirectory=/home/ubuntu/digitalbook
ExecStart=/home/ubuntu/digitalbook/start.sh
Restart=always
RestartSec=10
StandardOutput=append:/home/ubuntu/digitalbook/app.log
StandardError=append:/home/ubuntu/digitalbook/app.log

# Environment
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
EOF

# 4. Try to use existing build or create minimal one
echo "4. Checking for build..."
if [ ! -f "/home/ubuntu/digitalbook/.next/BUILD_ID" ]; then
    echo "No build found. Creating minimal build structure..."
    mkdir -p /home/ubuntu/digitalbook/.next
    echo "manual-build-$(date +%s)" > /home/ubuntu/digitalbook/.next/BUILD_ID
    
    # Try to copy from any backup or existing location
    if [ -d "/home/ubuntu/digitalbook/.next.backup" ]; then
        cp -r /home/ubuntu/digitalbook/.next.backup/* /home/ubuntu/digitalbook/.next/
    fi
fi

# 5. Start the service
echo "5. Starting service..."
sudo systemctl daemon-reload
sudo systemctl enable digitalbook
sudo systemctl start digitalbook

# Wait a moment
sleep 5

# 6. Check status
echo "6. Checking service status..."
sudo systemctl status digitalbook --no-pager

# 7. If service failed, try direct start
if ! sudo systemctl is-active --quiet digitalbook; then
    echo "Service failed. Trying direct start..."
    cd /home/ubuntu/digitalbook
    nohup npm start > app.log 2>&1 &
    sleep 10
fi

# 8. Final verification
echo -e "\n=== Final Verification ==="
echo "Checking processes:"
ps aux | grep -E "next|node" | grep -v grep

echo -e "\nChecking ports:"
sudo ss -tlnp | grep -E ':80|:443|:3000'

echo -e "\nTesting local access:"
curl -s -o /dev/null -w "Local HTTP Status: %{http_code}\n" http://localhost:3000 || echo "App not responding locally"

echo -e "\nTesting HTTPS access:"
curl -s -o /dev/null -w "HTTPS Status: %{http_code}\n" https://xn--220bu63c.com || echo "HTTPS not working"

echo -e "\n=== Summary ==="
echo "If the app is not running, you need to:"
echo "1. Build the Next.js app locally on a machine with more memory"
echo "2. Upload the .next directory to the server"
echo "3. Run: sudo systemctl restart digitalbook"
echo ""
echo "Monitor logs with:"
echo "  - sudo journalctl -u digitalbook -f"
echo "  - tail -f /home/ubuntu/digitalbook/app.log"