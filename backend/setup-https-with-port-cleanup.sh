#!/bin/bash

# Complete HTTPS Setup Script with Port Cleanup
# This script will:
# 1. Clean up all existing port usage
# 2. Use only standard ports: 80 (nginx), 443 (nginx SSL), 3000 (app)
# 3. Ensure no orphaned ports remain

set -e

echo "=== Starting Complete HTTPS Setup with Port Cleanup ==="

# Function to kill processes on specific ports
kill_port() {
    local port=$1
    echo "Cleaning up port $port..."
    sudo fuser -k ${port}/tcp 2>/dev/null || echo "Port $port is already free"
    sleep 1
}

# 1. Stop and clean up ALL existing processes
echo "1. Stopping all existing processes and cleaning ports..."

# Stop PM2 processes
pm2 stop all 2>/dev/null || echo "No PM2 processes running"
pm2 delete all 2>/dev/null || echo "No PM2 processes to delete"
pm2 kill 2>/dev/null || echo "PM2 daemon not running"

# Stop nginx
sudo systemctl stop nginx 2>/dev/null || echo "Nginx not running"

# Kill any process using our target ports
for port in 80 443 3000 3001; do
    kill_port $port
done

# Kill any next or node processes
sudo pkill -f "next" 2>/dev/null || echo "No next processes found"
sudo pkill -f "node" 2>/dev/null || echo "No node processes found"

sleep 3

# Verify all ports are free
echo "2. Verifying all ports are free..."
sudo ss -tlnp | grep -E ':80|:443|:3000|:3001' || echo "All ports are free"

# 2. Navigate to the app directory
cd /home/ubuntu/digitalbook

# 3. Clean and rebuild the Next.js application
echo "3. Cleaning and building Next.js application..."
rm -rf .next
npm run build

# 4. Create PM2 ecosystem file for port 3000 (standard Next.js port)
echo "4. Creating PM2 ecosystem configuration for port 3000..."
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'digitalbook',
    script: 'npm',
    args: 'start',
    cwd: '/home/ubuntu/digitalbook',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      HOSTNAME: '0.0.0.0'
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    error_file: '/home/ubuntu/digitalbook/logs/pm2-error.log',
    out_file: '/home/ubuntu/digitalbook/logs/pm2-out.log',
    log_file: '/home/ubuntu/digitalbook/logs/pm2-combined.log',
    time: true,
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000
  }]
};
EOF

# Create logs directory if it doesn't exist
mkdir -p /home/ubuntu/digitalbook/logs

# 5. Start the app with PM2 on port 3000
echo "5. Starting application with PM2 on port 3000..."
pm2 start ecosystem.config.js
pm2 save
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu

# Wait for the app to start
echo "Waiting for application to start..."
for i in {1..30}; do
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200\|302"; then
        echo "Application is running on port 3000"
        break
    fi
    echo "Waiting... ($i/30)"
    sleep 2
done

# 6. Configure nginx with standard ports only
echo "6. Configuring nginx for ports 80 and 443..."
sudo tee /etc/nginx/sites-available/digitalbook << 'EOF'
# HTTP server on port 80 - redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name xn--220bu63c.com www.xn--220bu63c.com 3.37.168.225;
    
    # Allow Let's Encrypt verification
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    # Redirect all other traffic to HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS server on port 443
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name xn--220bu63c.com www.xn--220bu63c.com 3.37.168.225;
    
    # SSL certificates (will be configured by certbot)
    # ssl_certificate /etc/letsencrypt/live/xn--220bu63c.com/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/xn--220bu63c.com/privkey.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_stapling on;
    ssl_stapling_verify on;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Proxy to Next.js app on port 3000
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # WebSocket support for Socket.io
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # API routes
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Static files and uploads
    location /_next/static/ {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Increase client body size for file uploads
    client_max_body_size 100M;
    
    # Gzip compression
    gzip on;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
}
EOF

# Create necessary directories
sudo mkdir -p /var/www/html

# Enable the site and remove default
sudo ln -sf /etc/nginx/sites-available/digitalbook /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
echo "7. Testing nginx configuration..."
sudo nginx -t

# 7. Start nginx
echo "8. Starting nginx..."
sudo systemctl start nginx
sudo systemctl enable nginx

# 8. Install certbot if not already installed
echo "9. Installing certbot..."
if ! command -v certbot &> /dev/null; then
    sudo apt update
    sudo apt install -y certbot python3-certbot-nginx
fi

# 9. Obtain SSL certificate
echo "10. Obtaining SSL certificate..."
sudo certbot --nginx \
    -d xn--220bu63c.com \
    -d www.xn--220bu63c.com \
    --non-interactive \
    --agree-tos \
    --email admin@xn--220bu63c.com \
    --redirect \
    --expand

# 10. Reload nginx with SSL
echo "11. Reloading nginx with SSL configuration..."
sudo systemctl reload nginx

# 11. Set up automatic certificate renewal
echo "12. Setting up automatic certificate renewal..."
(crontab -l 2>/dev/null | grep -v certbot; echo "0 3 * * * /usr/bin/certbot renew --quiet --post-hook 'systemctl reload nginx'") | crontab -

# 12. Final port verification
echo "13. Final port verification..."
echo -e "\nPort usage:"
sudo ss -tlnp | grep -E ':80|:443|:3000' | while read line; do
    echo "  $line"
done

# 13. Create monitoring script
echo "14. Creating monitoring script..."
cat > /home/ubuntu/digitalbook/monitor-ports.sh << 'EOF'
#!/bin/bash
echo "=== Port Monitoring ==="
echo "Standard ports in use:"
sudo ss -tlnp | grep -E ':80|:443|:3000'
echo -e "\nPM2 processes:"
pm2 list
echo -e "\nNginx status:"
sudo systemctl is-active nginx
echo -e "\nApplication health check:"
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://localhost:3000
EOF
chmod +x /home/ubuntu/digitalbook/monitor-ports.sh

# 14. Final system check
echo -e "\n=== Final System Check ==="
/home/ubuntu/digitalbook/monitor-ports.sh

echo -e "\n=== Setup Complete! ==="
echo "Port configuration:"
echo "  - Port 80: Nginx (HTTP → HTTPS redirect)"
echo "  - Port 443: Nginx (HTTPS with SSL)"
echo "  - Port 3000: Next.js application (internal only)"
echo ""
echo "Your application is now accessible at:"
echo "  - https://xn--220bu63c.com (내책.com)"
echo "  - https://www.xn--220bu63c.com"
echo "  - https://3.37.168.225"
echo ""
echo "Monitoring commands:"
echo "  - Check ports: /home/ubuntu/digitalbook/monitor-ports.sh"
echo "  - PM2 logs: pm2 logs digitalbook"
echo "  - PM2 monitoring: pm2 monit"
echo "  - Nginx logs: sudo journalctl -u nginx -f"
echo "  - Nginx access log: sudo tail -f /var/log/nginx/access.log"
echo "  - Nginx error log: sudo tail -f /var/log/nginx/error.log"