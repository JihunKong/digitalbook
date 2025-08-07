#!/bin/bash

# Quick HTTPS setup without building on server
set -e

echo "=== Quick HTTPS Setup ==="

# 1. Kill all processes on required ports
echo "1. Cleaning up ports..."
sudo fuser -k 80/tcp 2>/dev/null || true
sudo fuser -k 443/tcp 2>/dev/null || true
sudo fuser -k 3000/tcp 2>/dev/null || true
sudo pkill -f "next" 2>/dev/null || true
sudo pkill -f "node" 2>/dev/null || true
pm2 kill 2>/dev/null || true
sudo systemctl stop nginx 2>/dev/null || true

sleep 2

# 2. Start the existing app on port 3000
echo "2. Starting app on port 3000..."
cd /home/ubuntu/digitalbook

# Create start script
cat > start-production.sh << 'EOF'
#!/bin/bash
export NODE_ENV=production
export PORT=3000
export HOSTNAME=0.0.0.0
cd /home/ubuntu/digitalbook
npm start
EOF
chmod +x start-production.sh

# Start with PM2
pm2 start ./start-production.sh --name digitalbook
pm2 save
pm2 startup systemd -u ubuntu --hp /home/ubuntu

# Wait for app
echo "Waiting for app to start..."
sleep 10

# 3. Configure nginx
echo "3. Configuring nginx..."
sudo tee /etc/nginx/sites-available/digitalbook << 'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name xn--220bu63c.com www.xn--220bu63c.com 3.37.168.225;
    
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
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
    }
}
EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/digitalbook /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Create www directory
sudo mkdir -p /var/www/html

# Test and start nginx
sudo nginx -t
sudo systemctl start nginx
sudo systemctl enable nginx

# 4. Get SSL certificate
echo "4. Getting SSL certificate..."
sudo apt update
sudo apt install -y certbot python3-certbot-nginx

sudo certbot --nginx \
    -d xn--220bu63c.com \
    -d www.xn--220bu63c.com \
    --non-interactive \
    --agree-tos \
    --email admin@xn--220bu63c.com \
    --redirect

# 5. Setup auto-renewal
(crontab -l 2>/dev/null | grep -v certbot; echo "0 3 * * * /usr/bin/certbot renew --quiet") | crontab -

echo "=== Setup Complete! ==="
echo "Access your site at:"
echo "  - https://xn--220bu63c.com"
echo "  - https://3.37.168.225"
echo ""
echo "Check status with:"
echo "  - pm2 status"
echo "  - sudo systemctl status nginx"