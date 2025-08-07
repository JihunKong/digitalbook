#!/bin/bash

# Final HTTPS Fix Script
set -e

echo "=== Final HTTPS Fix ==="

# 1. Stop everything
echo "1. Stopping all services..."
sudo pkill -f "next" 2>/dev/null || true
sudo pkill -f "node" 2>/dev/null || true
pm2 kill 2>/dev/null || true
sudo systemctl stop nginx

sleep 3

# 2. Clean up nginx configuration
echo "2. Cleaning nginx configuration..."
sudo rm -f /etc/nginx/sites-enabled/*
sudo rm -f /etc/nginx/sites-available/digitalbook

# 3. Start app properly with PM2
echo "3. Starting app with PM2..."
cd /home/ubuntu/digitalbook

# Create ecosystem config
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
      HOST: '127.0.0.1'  // Listen on localhost only
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_file: './logs/pm2-combined.log',
    time: true
  }]
};
EOF

# Create logs directory
mkdir -p logs

# Start with PM2
pm2 start ecosystem.config.js

# Wait for app to start
echo "Waiting for app to start..."
for i in {1..30}; do
    if curl -s http://127.0.0.1:3000 > /dev/null; then
        echo "App is running!"
        break
    fi
    echo "Waiting... ($i/30)"
    sleep 2
done

# 4. Configure nginx properly
echo "4. Configuring nginx..."
sudo tee /etc/nginx/sites-available/digitalbook << 'EOF'
# HTTP server - redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name xn--220bu63c.com www.xn--220bu63c.com;
    
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name xn--220bu63c.com www.xn--220bu63c.com;
    
    # SSL certificates (managed by Certbot)
    ssl_certificate /etc/letsencrypt/live/xn--220bu63c.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/xn--220bu63c.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    
    # Proxy configuration
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_buffering off;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # WebSocket support
    location /socket.io/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
    
    # Increase client body size for uploads
    client_max_body_size 100M;
}

# IP-based access
server {
    listen 80;
    listen [::]:80;
    server_name 3.37.168.225;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name 3.37.168.225;
    
    # Use the same SSL certificate
    ssl_certificate /etc/letsencrypt/live/xn--220bu63c.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/xn--220bu63c.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
    
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/digitalbook /etc/nginx/sites-enabled/

# Test nginx
sudo nginx -t

# 5. Restart nginx
echo "5. Restarting nginx..."
sudo systemctl restart nginx

# 6. Save PM2 configuration
pm2 save
pm2 startup systemd -u ubuntu --hp /home/ubuntu

# 7. Final verification
echo -e "\n=== Final Verification ==="
echo "PM2 Status:"
pm2 list

echo -e "\nPort Status:"
sudo ss -tlnp | grep -E ':80|:443|:3000'

echo -e "\nTesting HTTPS:"
curl -I https://xn--220bu63c.com

echo -e "\n=== Setup Complete! ==="
echo "Access your site at:"
echo "  - https://xn--220bu63c.com (내책.com)"
echo "  - https://3.37.168.225"
echo ""
echo "Monitor with:"
echo "  - pm2 monit"
echo "  - pm2 logs"
echo "  - sudo tail -f /var/log/nginx/error.log"