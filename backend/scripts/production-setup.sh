#!/bin/bash

# Production server setup script for ClassAppHub
# This script prepares a fresh Ubuntu server for ClassAppHub deployment

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

log_info() {
    log "${BLUE}ℹ INFO:${NC} $1"
}

log_success() {
    log "${GREEN}✅ SUCCESS:${NC} $1"
}

log_warning() {
    log "${YELLOW}⚠ WARNING:${NC} $1"
}

log_error() {
    log "${RED}❌ ERROR:${NC} $1"
}

log_step() {
    log "${YELLOW}🚀 STEP:${NC} $1"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    log_error "Please do not run this script as root. Run it as a regular user with sudo privileges."
    exit 1
fi

# Check Ubuntu version
if ! grep -q "Ubuntu" /etc/os-release; then
    log_error "This script is designed for Ubuntu. Please check compatibility."
    exit 1
fi

log_info "Starting ClassAppHub production server setup"
log_info "Server: $(hostname)"
log_info "OS: $(lsb_release -d | cut -f2)"
log_info "User: $(whoami)"

# Update system
log_step "Updating system packages"
sudo apt update && sudo apt upgrade -y
log_success "System packages updated"

# Install essential packages
log_step "Installing essential packages"
sudo apt install -y \
    curl \
    wget \
    git \
    unzip \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    htop \
    vim \
    ufw \
    fail2ban \
    logrotate \
    cron \
    postgresql-client \
    redis-tools

log_success "Essential packages installed"

# Install Docker
log_step "Installing Docker"
if ! command -v docker &> /dev/null; then
    # Add Docker's official GPG key
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    # Add Docker repository
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Install Docker
    sudo apt update
    sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    
    # Add user to docker group
    sudo usermod -aG docker $USER
    
    log_success "Docker installed"
else
    log_info "Docker already installed"
fi

# Install Docker Compose
log_step "Installing Docker Compose"
if ! command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d'"' -f4)
    sudo curl -L "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    log_success "Docker Compose installed"
else
    log_info "Docker Compose already installed"
fi

# Install Node.js (for development/debugging)
log_step "Installing Node.js"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt install -y nodejs
    log_success "Node.js installed"
else
    log_info "Node.js already installed"
fi

# Configure firewall
log_step "Configuring firewall"
sudo ufw --force reset
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow monitoring ports (restrict to internal network if needed)
sudo ufw allow 3001/tcp  # Grafana
sudo ufw allow 9090/tcp  # Prometheus

# Enable firewall
sudo ufw --force enable
log_success "Firewall configured"

# Configure fail2ban
log_step "Configuring fail2ban"
sudo tee /etc/fail2ban/jail.local > /dev/null <<EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
maxretry = 3

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
logpath = /var/log/nginx/error.log
maxretry = 3

[nginx-noscript]
enabled = true
filter = nginx-noscript
logpath = /var/log/nginx/access.log
maxretry = 6

[nginx-badbots]
enabled = true
filter = nginx-badbots
logpath = /var/log/nginx/access.log
maxretry = 2
EOF

sudo systemctl enable fail2ban
sudo systemctl restart fail2ban
log_success "Fail2ban configured"

# Create application directories
log_step "Creating application directories"
sudo mkdir -p /var/log/classapphub
sudo mkdir -p /var/lib/classapphub/backups
sudo mkdir -p /var/lib/classapphub/uploads
sudo mkdir -p /etc/classapphub

# Set proper permissions
sudo chown -R $USER:$USER /var/log/classapphub
sudo chown -R $USER:$USER /var/lib/classapphub
sudo chown -R $USER:$USER /etc/classapphub

log_success "Application directories created"

# Configure log rotation
log_step "Configuring log rotation"
sudo tee /etc/logrotate.d/classapphub > /dev/null <<EOF
/var/log/classapphub/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
    postrotate
        docker-compose -f /home/$USER/classapphub/docker-compose.prod.yml restart nginx 2>/dev/null || true
    endscript
}
EOF

log_success "Log rotation configured"

# Configure system limits
log_step "Configuring system limits"
sudo tee -a /etc/security/limits.conf > /dev/null <<EOF
# ClassAppHub limits
$USER soft nofile 65536
$USER hard nofile 65536
$USER soft nproc 4096
$USER hard nproc 4096
EOF

# Configure sysctl
sudo tee /etc/sysctl.d/99-classapphub.conf > /dev/null <<EOF
# ClassAppHub optimizations
net.core.somaxconn = 1024
net.core.netdev_max_backlog = 5000
net.core.rmem_default = 262144
net.core.rmem_max = 16777216
net.core.wmem_default = 262144
net.core.wmem_max = 16777216
net.ipv4.tcp_wmem = 4096 87380 16777216
net.ipv4.tcp_rmem = 4096 87380 16777216
net.ipv4.tcp_max_syn_backlog = 8096
net.ipv4.tcp_slow_start_after_idle = 0
net.ipv4.tcp_tw_reuse = 1
net.ipv4.ip_local_port_range = 10240 65535
vm.max_map_count = 262144
EOF

sudo sysctl -p /etc/sysctl.d/99-classapphub.conf
log_success "System limits configured"

# Install and configure monitoring tools
log_step "Installing monitoring tools"

# Install htop, iotop, and other monitoring tools
sudo apt install -y htop iotop nethogs iftop ncdu

log_success "Monitoring tools installed"

# Create systemd service for ClassAppHub
log_step "Creating systemd service"
sudo tee /etc/systemd/system/classapphub.service > /dev/null <<EOF
[Unit]
Description=ClassAppHub Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/$USER/classapphub
ExecStart=/usr/local/bin/docker-compose -f docker-compose.prod.yml up -d
ExecStop=/usr/local/bin/docker-compose -f docker-compose.prod.yml down
TimeoutStartSec=0
User=$USER
Group=docker

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable classapphub.service
log_success "Systemd service created"

# Create backup script
log_step "Creating backup script"
tee /home/$USER/backup-classapphub.sh > /dev/null <<EOF
#!/bin/bash
# ClassAppHub backup script

BACKUP_DIR="/var/lib/classapphub/backups"
DATE=\$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p "\$BACKUP_DIR"

# Backup database
docker-compose -f /home/$USER/classapphub/docker-compose.prod.yml exec -T postgres pg_dump -U postgres classapphub | gzip > "\$BACKUP_DIR/db_backup_\$DATE.sql.gz"

# Backup uploads
tar -czf "\$BACKUP_DIR/uploads_backup_\$DATE.tar.gz" -C /var/lib/classapphub uploads/

# Remove old backups (keep last 30 days)
find "\$BACKUP_DIR" -name "*.gz" -mtime +30 -delete

echo "Backup completed: \$DATE"
EOF

chmod +x /home/$USER/backup-classapphub.sh

# Add to crontab
(crontab -l 2>/dev/null || true; echo "0 2 * * * /home/$USER/backup-classapphub.sh") | crontab -

log_success "Backup script created and scheduled"

# Create health check script
log_step "Creating health check script"
tee /home/$USER/health-check.sh > /dev/null <<EOF
#!/bin/bash
# ClassAppHub health check script

HEALTH_URL="http://localhost/api/health"
EXPECTED_STATUS="healthy"

# Check if service is responding
if curl -f -s "\$HEALTH_URL" | grep -q "\$EXPECTED_STATUS"; then
    echo "✅ ClassAppHub is healthy"
    exit 0
else
    echo "❌ ClassAppHub is not responding correctly"
    # Restart service if unhealthy
    systemctl restart classapphub.service
    exit 1
fi
EOF

chmod +x /home/$USER/health-check.sh

# Add health check to crontab (every 5 minutes)
(crontab -l 2>/dev/null || true; echo "*/5 * * * * /home/$USER/health-check.sh >> /var/log/classapphub/health-check.log 2>&1") | crontab -

log_success "Health check script created and scheduled"

# Configure automatic security updates
log_step "Configuring automatic security updates"
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades

# Configure unattended-upgrades
sudo tee /etc/apt/apt.conf.d/50unattended-upgrades > /dev/null <<EOF
Unattended-Upgrade::Allowed-Origins {
    "\${distro_id}:\${distro_codename}-security";
    "\${distro_id}ESMApps:\${distro_codename}-apps-security";
    "\${distro_id}ESM:\${distro_codename}-infra-security";
};

Unattended-Upgrade::AutoFixInterruptedDpkg "true";
Unattended-Upgrade::MinimalSteps "true";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
Unattended-Upgrade::Automatic-Reboot "false";
EOF

log_success "Automatic security updates configured"

# Create environment template
log_step "Creating environment template"
tee /etc/classapphub/environment.template > /dev/null <<EOF
# Copy this file to /home/$USER/classapphub/.env and customize the values

# Database
POSTGRES_DB=classapphub
POSTGRES_USER=postgres
POSTGRES_PASSWORD=CHANGE_THIS_PASSWORD

# Security
SECRET_KEY=CHANGE_THIS_SECRET_KEY_TO_SOMETHING_SECURE

# Domain
DOMAIN=your-domain.com
SSL_EMAIL=your-email@example.com

# API Keys
OPENAI_API_KEY=your-openai-api-key

# Monitoring
GRAFANA_PASSWORD=CHANGE_THIS_PASSWORD

# Redis
REDIS_PASSWORD=CHANGE_THIS_PASSWORD
EOF

log_success "Environment template created"

# Final steps
log_step "Final setup steps"

# Enable and start Docker
sudo systemctl enable docker
sudo systemctl start docker

# Verify Docker installation
docker --version
docker-compose --version

log_success "Setup completed successfully!"

cat <<EOF

${GREEN}🎉 ClassAppHub production server setup is complete!${NC}

${YELLOW}Next steps:${NC}
1. Copy your application code to /home/$USER/classapphub/
2. Copy /etc/classapphub/environment.template to /home/$USER/classapphub/.env
3. Customize the environment variables in .env file
4. Run the deployment script from your local machine
5. Configure SSL certificates using Let's Encrypt

${YELLOW}Important security notes:${NC}
- Change all default passwords in the .env file
- Configure your domain and SSL certificates
- Review firewall rules for your specific needs
- Set up proper backup procedures
- Monitor logs regularly

${YELLOW}Useful commands:${NC}
- Check service status: sudo systemctl status classapphub
- View logs: docker-compose -f /home/$USER/classapphub/docker-compose.prod.yml logs
- Restart application: sudo systemctl restart classaphhub
- Run backup: /home/$USER/backup-classapphub.sh
- Health check: /home/$USER/health-check.sh

${YELLOW}Monitoring URLs (after deployment):${NC}
- Application: https://your-domain.com
- Grafana: https://your-domain.com:3001
- Prometheus: https://your-domain.com:9090

${RED}IMPORTANT: Please reboot the server to ensure all changes take effect${NC}
${YELLOW}Run: sudo reboot${NC}

EOF