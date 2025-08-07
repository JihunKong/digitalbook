#!/bin/bash

# Memory-efficient HTTPS Setup Script
# Optimized for low-memory servers

set -e

echo "=== Starting Memory-Efficient HTTPS Setup ==="

# Function to kill processes on specific ports
kill_port() {
    local port=$1
    echo "Cleaning up port $port..."
    sudo fuser -k ${port}/tcp 2>/dev/null || echo "Port $port is already free"
    sleep 1
}

# 1. Free up memory first
echo "1. Freeing up memory..."
sync
echo 3 | sudo tee /proc/sys/vm/drop_caches > /dev/null

# Stop all unnecessary services
sudo systemctl stop snapd.service 2>/dev/null || true
sudo systemctl stop snapd.socket 2>/dev/null || true

# Stop PM2 and clean up
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
pm2 kill 2>/dev/null || true

# Stop nginx
sudo systemctl stop nginx 2>/dev/null || true

# Kill processes on ports
for port in 80 443 3000 3001; do
    kill_port $port
done

# Kill any node/next processes
sudo pkill -f "next" 2>/dev/null || true
sudo pkill -f "node" 2>/dev/null || true

sleep 3

# 2. Navigate to app directory
cd /home/ubuntu/digitalbook

# 3. Build with memory limits
echo "2. Building Next.js with memory limits..."
export NODE_OPTIONS="--max-old-space-size=512"

# Clean previous build
rm -rf .next

# Try to build
echo "Starting build process..."
npm run build || {
    echo "Build failed, trying with even lower memory limit..."
    export NODE_OPTIONS="--max-old-space-size=384"
    npm run build
}

# 4. Create a simple startup script
echo "3. Creating startup script..."
cat > start-app.sh << 'EOF'
#!/bin/bash
export NODE_ENV=production
export PORT=3000
export HOSTNAME=0.0.0.0
export NODE_OPTIONS="--max-old-space-size=384"
cd /home/ubuntu/digitalbook
exec npm start
EOF
chmod +x start-app.sh

# 5. Create systemd service instead of PM2 (uses less memory)
echo "4. Creating systemd service..."
sudo tee /etc/systemd/system/digitalbook.service << 'EOF'
[Unit]
Description=Digital Book Application
After=network.target

[Service]
Type=exec
User=ubuntu
WorkingDirectory=/home/ubuntu/digitalbook
ExecStart=/home/ubuntu/digitalbook/start-app.sh
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=HOSTNAME=0.0.0.0

# Memory limits
MemoryMax=600M
MemoryHigh=500M

[Install]
WantedBy=multi-user.target
EOF

# Enable and start the service
sudo systemctl daemon-reload
sudo systemctl enable digitalbook
sudo systemctl start digitalbook

# Wait for app to start
echo "5. Waiting for application to start..."
for i in {1..30}; do
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200\|302"; then
        echo "Application is running on port 3000"
        break
    fi
    echo "Waiting... ($i/30)"
    sleep 2
done

# 6. Configure nginx
echo "6. Configuring nginx..."
sudo tee /etc/nginx/sites-available/digitalbook << 'EOF'
# Minimal nginx config for low memory
worker_processes 1;
worker_rlimit_nofile 1024;

events {
    worker_connections 512;
    use epoll;
    multi_accept on;
}

http {
    # Basic settings
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 30;
    types_hash_max_size 2048;
    client_max_body_size 100M;
    
    # Gzip
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # HTTP redirect
    server {
        listen 80;
        listen [::]:80;
        server_name xn--220bu63c.com www.xn--220bu63c.com 3.37.168.225;
        
        location /.well-known/acme-challenge/ {
            root /var/www/html;
        }
        
        location / {
            return 301 https://$host$request_uri;
        }
    }
    
    # HTTPS server
    server {
        listen 443 ssl http2;
        listen [::]:443 ssl http2;
        server_name xn--220bu63c.com www.xn--220bu63c.com 3.37.168.225;
        
        # SSL (to be configured by certbot)
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers off;
        
        # Proxy to app
        location / {
            proxy_pass http://localhost:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
EOF

# Use the standard nginx config location
sudo rm -f /etc/nginx/nginx.conf
sudo mv /etc/nginx/sites-available/digitalbook /etc/nginx/nginx.conf

# Create www directory
sudo mkdir -p /var/www/html

# Test config
sudo nginx -t

# 7. Start nginx
echo "7. Starting nginx..."
sudo systemctl start nginx
sudo systemctl enable nginx

# 8. Install certbot
echo "8. Installing certbot..."
if ! command -v certbot &> /dev/null; then
    sudo apt update
    sudo apt install -y certbot python3-certbot-nginx
fi

# 9. Get SSL certificate
echo "9. Obtaining SSL certificate..."
sudo certbot --nginx \
    -d xn--220bu63c.com \
    -d www.xn--220bu63c.com \
    --non-interactive \
    --agree-tos \
    --email admin@xn--220bu63c.com \
    --redirect

# 10. Reload nginx
sudo systemctl reload nginx

# 11. Set up auto-renewal
(crontab -l 2>/dev/null | grep -v certbot; echo "0 3 * * * /usr/bin/certbot renew --quiet --post-hook 'systemctl reload nginx'") | crontab -

# 12. Final check
echo "10. Final system check..."
echo "Port usage:"
sudo ss -tlnp | grep -E ':80|:443|:3000'
echo -e "\nService status:"
sudo systemctl status digitalbook --no-pager
echo -e "\nNginx status:"
sudo systemctl status nginx --no-pager

echo -e "\n=== Setup Complete! ==="
echo "Your application is accessible at:"
echo "  - https://xn--220bu63c.com (내책.com)"
echo "  - https://3.37.168.225"
echo ""
echo "Commands:"
echo "  - Check app: sudo systemctl status digitalbook"
echo "  - App logs: sudo journalctl -u digitalbook -f"
echo "  - Restart app: sudo systemctl restart digitalbook"
echo "  - Nginx logs: sudo journalctl -u nginx -f"