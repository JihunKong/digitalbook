#!/bin/bash
# SSL Certificate Setup Script using Let's Encrypt

set -e

DOMAIN="xn--220bu63c.com"
EMAIL="admin@xn--220bu63c.com"

echo "Setting up SSL certificates for $DOMAIN"

# Install Certbot
sudo apt-get update
sudo apt-get install -y certbot

# Stop services temporarily
sudo docker-compose -f docker-compose.prod.yml down

# Get certificate
sudo certbot certonly --standalone \
  --preferred-challenges http \
  --agree-tos \
  --no-eff-email \
  --email $EMAIL \
  -d $DOMAIN \
  -d www.$DOMAIN

# Create renewal script
cat > /home/ubuntu/digitalbook/renew-ssl.sh << 'EOF'
#!/bin/bash
sudo certbot renew --pre-hook "docker-compose -f /home/ubuntu/digitalbook/docker-compose.prod.yml down" --post-hook "docker-compose -f /home/ubuntu/digitalbook/docker-compose.prod.yml up -d"
EOF

chmod +x /home/ubuntu/digitalbook/renew-ssl.sh

# Add cron job for auto-renewal
(crontab -l 2>/dev/null; echo "0 0,12 * * * /home/ubuntu/digitalbook/renew-ssl.sh >> /home/ubuntu/digitalbook/logs/ssl-renewal.log 2>&1") | crontab -

# Restart services
sudo docker-compose -f docker-compose.prod.yml up -d

echo "SSL setup completed!"