#!/bin/bash

# Complete HTTPS Setup Script for Korean Digital Textbook Platform
# This script will:
# 1. Stop current processes
# 2. Build Next.js app properly
# 3. Move app to port 3001
# 4. Configure nginx as reverse proxy
# 5. Set up SSL certificates
# 6. Restart all services

set -e

echo "=== Starting Complete HTTPS Setup ==="

# 1. Stop current processes
echo "1. Stopping current processes..."

# Kill the current next-server process
sudo pkill -f "next-server" || echo "No next-server process found"
sleep 2

# Stop PM2 if running
pm2 stop all || echo "No PM2 processes to stop"
pm2 delete all || echo "No PM2 processes to delete"

# Stop nginx if running
sudo systemctl stop nginx || echo "Nginx not running"

# 2. Navigate to the app directory
cd /home/ubuntu/digitalbook

# 3. Build the Next.js application
echo "2. Building Next.js application..."
npm run build

# 4. Create PM2 ecosystem file for port 3001
echo "3. Creating PM2 ecosystem configuration..."
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'digitalbook',
    script: 'npm',
    args: 'start',
    cwd: '/home/ubuntu/digitalbook',
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
      HOSTNAME: '0.0.0.0'
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    error_file: '/home/ubuntu/digitalbook/logs/pm2-error.log',
    out_file: '/home/ubuntu/digitalbook/logs/pm2-out.log',
    log_file: '/home/ubuntu/digitalbook/logs/pm2-combined.log',
    time: true
  }]
};
EOF

# 5. Start the app with PM2 on port 3001
echo "4. Starting application with PM2 on port 3001..."
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd -u ubuntu --hp /home/ubuntu

# Wait for the app to start
sleep 10

# Verify the app is running on port 3001
echo "5. Verifying app is running on port 3001..."
curl -I http://localhost:3001 || echo "Warning: App may not be responding yet"

# 6. Configure nginx
echo "6. Configuring nginx..."
sudo tee /etc/nginx/sites-available/digitalbook << 'EOF'
# HTTP server - redirect all traffic to HTTPS
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
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name xn--220bu63c.com www.xn--220bu63c.com 3.37.168.225;
    
    # SSL certificates (will be added by certbot)
    # ssl_certificate /etc/letsencrypt/live/xn--220bu63c.com/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/xn--220bu63c.com/privkey.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'TLS_AES_128_GCM_SHA256:TLS_AES_256_GCM_SHA384:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline' 'unsafe-eval'" always;
    
    # Proxy settings
    location / {
        proxy_pass http://localhost:3001;
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
    
    # WebSocket support
    location /socket.io/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Increase client body size for file uploads
    client_max_body_size 100M;
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/digitalbook /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
sudo nginx -t

# 7. Start nginx
echo "7. Starting nginx..."
sudo systemctl start nginx
sudo systemctl enable nginx

# 8. Install certbot if not already installed
echo "8. Installing certbot..."
if ! command -v certbot &> /dev/null; then
    sudo apt update
    sudo apt install -y certbot python3-certbot-nginx
fi

# 9. Obtain SSL certificate
echo "9. Obtaining SSL certificate..."
sudo certbot --nginx -d xn--220bu63c.com -d www.xn--220bu63c.com --non-interactive --agree-tos --email admin@xn--220bu63c.com || echo "Certbot may have failed - check manually"

# 10. Reload nginx with SSL
echo "10. Reloading nginx with SSL configuration..."
sudo systemctl reload nginx

# 11. Set up automatic certificate renewal
echo "11. Setting up automatic certificate renewal..."
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -

# 12. Verify everything is working
echo "12. Verifying setup..."
echo "Checking PM2 status:"
pm2 status

echo -e "\nChecking nginx status:"
sudo systemctl status nginx --no-pager

echo -e "\nChecking port bindings:"
sudo ss -tlnp | grep -E ':80|:443|:3001'

echo -e "\n=== Setup Complete! ==="
echo "Your application should now be accessible at:"
echo "- https://xn--220bu63c.com (내책.com)"
echo "- https://3.37.168.225"
echo ""
echo "To monitor the application:"
echo "- PM2 logs: pm2 logs"
echo "- Nginx logs: sudo tail -f /var/log/nginx/access.log /var/log/nginx/error.log"
echo ""
echo "If you encounter any issues, check:"
echo "1. PM2 status: pm2 status"
echo "2. Nginx status: sudo systemctl status nginx"
echo "3. Application logs: pm2 logs digitalbook"