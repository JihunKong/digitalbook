#!/bin/bash
# Complete server setup script for AWS Lightsail

set -e

echo "======================================"
echo "Digital Book Platform Server Setup"
echo "======================================"

# Update system
echo "Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install required packages
echo "Installing required packages..."
sudo apt-get install -y \
  curl \
  git \
  wget \
  vim \
  htop \
  ufw \
  fail2ban \
  certbot

# Install Docker
echo "Installing Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
rm get-docker.sh

# Install Docker Compose
echo "Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Configure firewall
echo "Configuring firewall..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# Configure fail2ban
echo "Configuring fail2ban..."
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Create project structure
echo "Creating project structure..."
mkdir -p ~/digitalbook/{uploads,logs,backups}

# Set up log rotation
cat > /etc/logrotate.d/digitalbook << 'EOF'
/home/ubuntu/digitalbook/logs/*.log {
  daily
  rotate 14
  compress
  delaycompress
  missingok
  notifempty
  create 0644 ubuntu ubuntu
}
EOF

# Set up automated backups
cat > ~/digitalbook/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/ubuntu/digitalbook/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Backup database
docker-compose -f /home/ubuntu/digitalbook/docker-compose.prod.yml exec -T db pg_dump -U postgres digitalbook > "$BACKUP_DIR/db_backup_$DATE.sql"

# Backup uploads
tar -czf "$BACKUP_DIR/uploads_backup_$DATE.tar.gz" -C /home/ubuntu/digitalbook uploads

# Keep only last 7 days of backups
find "$BACKUP_DIR" -name "*.sql" -mtime +7 -delete
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

chmod +x ~/digitalbook/backup.sh

# Add cron jobs
echo "Setting up cron jobs..."
(crontab -l 2>/dev/null || echo "") | cat - << EOF | crontab -
# Daily backup at 2 AM
0 2 * * * /home/ubuntu/digitalbook/backup.sh >> /home/ubuntu/digitalbook/logs/backup.log 2>&1

# JWT rotation every 30 days at 3 AM
0 3 1 * * /home/ubuntu/digitalbook/cron/jwt-rotation.sh >> /home/ubuntu/digitalbook/logs/rotation.log 2>&1

# SSL renewal check twice daily
0 0,12 * * * /home/ubuntu/digitalbook/renew-ssl.sh >> /home/ubuntu/digitalbook/logs/ssl-renewal.log 2>&1
EOF

# Create monitoring script
cat > ~/digitalbook/monitor.sh << 'EOF'
#!/bin/bash
if ! docker-compose -f /home/ubuntu/digitalbook/docker-compose.prod.yml ps | grep -q "Up"; then
  echo "[$(date)] Services are down, attempting restart..."
  docker-compose -f /home/ubuntu/digitalbook/docker-compose.prod.yml up -d
fi
EOF

chmod +x ~/digitalbook/monitor.sh

# Add monitoring to cron
(crontab -l 2>/dev/null; echo "*/5 * * * * /home/ubuntu/digitalbook/monitor.sh >> /home/ubuntu/digitalbook/logs/monitor.log 2>&1") | crontab -

# System optimization
echo "Optimizing system settings..."
cat >> /etc/sysctl.conf << 'EOF'
# Network optimizations
net.core.somaxconn = 65535
net.ipv4.tcp_max_syn_backlog = 65535
net.ipv4.tcp_congestion_control = bbr
net.core.default_qdisc = fq

# Memory optimizations
vm.swappiness = 10
vm.dirty_ratio = 15
vm.dirty_background_ratio = 5
EOF

sudo sysctl -p

echo "======================================"
echo "Server setup completed!"
echo "Next steps:"
echo "1. Deploy application using deploy.sh"
echo "2. Set up SSL using setup-ssl.sh"
echo "3. Configure domain DNS to point to this server"
echo "======================================"