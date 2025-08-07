# Korean Digital Textbook Platform - Operations Guide

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Deployment Procedures](#deployment-procedures)
3. [Monitoring & Alerting](#monitoring--alerting)
4. [Backup & Recovery](#backup--recovery)
5. [Performance Tuning](#performance-tuning)
6. [Security Operations](#security-operations)
7. [Incident Response](#incident-response)
8. [Maintenance Tasks](#maintenance-tasks)
9. [Troubleshooting Guide](#troubleshooting-guide)
10. [Emergency Procedures](#emergency-procedures)

---

## 🏗️ System Overview

### Architecture Components

```
┌──────────────────────────────────────────────────────────────┐
│                         Load Balancer                         │
│                     (Nginx - SSL/TLS)                        │
└────────────────┬──────────────────────┬────────────────────┘
                 │                      │
        ┌────────▼────────┐    ┌───────▼────────┐
        │   Frontend      │    │    Backend     │
        │  (Next.js)      │    │  (Express.js)  │
        │   Port 3000     │    │   Port 4000    │
        └────────┬────────┘    └───────┬────────┘
                 │                      │
                 └──────────┬───────────┘
                           │
                ┌──────────▼──────────┐
                │     Database        │
                │   (PostgreSQL)      │
                │    Port 5432        │
                └─────────────────────┘
                           │
                ┌──────────▼──────────┐
                │       Cache         │
                │      (Redis)        │
                │    Port 6379        │
                └─────────────────────┘
```

### Server Information

| Component | Host | Port | Service |
|-----------|------|------|---------|
| Frontend | 3.37.168.225 | 3000 | Next.js Application |
| Backend | 3.37.168.225 | 4000 | Express API Server |
| Database | localhost | 5432 | PostgreSQL 15 |
| Cache | localhost | 6379 | Redis 7 |
| Web Server | 3.37.168.225 | 80/443 | Nginx |

### Domain Configuration

- **Production**: https://xn--220bu63c.com (내책.com)
- **API Endpoint**: https://xn--220bu63c.com/api
- **WebSocket**: wss://xn--220bu63c.com/socket.io

---

## 🚀 Deployment Procedures

### Production Deployment

#### 1. Pre-deployment Checklist

```bash
# Run validation script
./scripts/validate-production.sh

# Check all tests pass
npm test
npm run test:e2e

# Verify environment variables
cat .env.production | grep -E "JWT_SECRET|DATABASE_URL|REDIS_URL"
```

#### 2. Build Process

```bash
# Build locally (due to server memory constraints)
cd /Users/jihunkong/DigitalBook

# Clean previous builds
rm -rf .next backend/dist

# Build frontend
NODE_OPTIONS="--max-old-space-size=4096" npm run build

# Build backend
cd backend
npm run build
cd ..
```

#### 3. Deployment Steps

```bash
# Create deployment package
tar -czf digitalbook-deploy.tar.gz \
    .next public package*.json next.config.js \
    backend/dist backend/prisma backend/package*.json \
    --exclude='node_modules' --exclude='.git'

# Transfer to server
scp -i Korean-Text-Book.pem digitalbook-deploy.tar.gz ubuntu@3.37.168.225:/tmp/

# Connect to server
ssh -i Korean-Text-Book.pem ubuntu@3.37.168.225

# Extract and deploy
cd /home/ubuntu/digitalbook
tar -xzf /tmp/digitalbook-deploy.tar.gz

# Install production dependencies
npm install --production --legacy-peer-deps
cd backend && npm install --production && cd ..

# Run database migrations
cd backend
npx prisma migrate deploy
cd ..

# Restart services
sudo systemctl restart digitalbook
pm2 restart backend
sudo systemctl restart nginx
```

#### 4. Post-deployment Verification

```bash
# Check service status
sudo systemctl status digitalbook
pm2 status

# Verify endpoints
curl -I https://xn--220bu63c.com
curl https://xn--220bu63c.com/api/health

# Check logs
sudo journalctl -u digitalbook -n 100
pm2 logs backend --lines 100
```

### Rollback Procedure

```bash
# Quick rollback to previous version
cd /home/ubuntu/digitalbook

# Restore previous build
cp -r .next.backup .next
cp -r backend/dist.backup backend/dist

# Restart services
sudo systemctl restart digitalbook
pm2 restart backend
```

---

## 📊 Monitoring & Alerting

### Health Checks

#### API Health Endpoint
```bash
curl https://xn--220bu63c.com/api/health
```

Expected Response:
```json
{
  "status": "healthy",
  "checks": {
    "api": "healthy",
    "database": "healthy",
    "redis": "healthy",
    "system": "healthy"
  },
  "metrics": {
    "uptime": 86400,
    "memory": {...},
    "cpu": 25
  }
}
```

### Performance Metrics

#### Real-time Monitoring
```bash
# API metrics
curl https://xn--220bu63c.com/api/metrics?timeWindow=60000

# System resources
htop

# Database connections
sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity;"

# Redis monitoring
redis-cli monitor
```

### Alert Thresholds

| Metric | Warning | Critical | Action |
|--------|---------|----------|--------|
| CPU Usage | >70% | >90% | Scale up / Optimize |
| Memory Usage | >80% | >95% | Restart services / Add RAM |
| Response Time | >1s | >3s | Check DB queries / Cache |
| Error Rate | >1% | >5% | Check logs / Debug |
| Disk Usage | >80% | >90% | Clean logs / Expand storage |

### Log Management

#### Log Locations
```bash
# Application logs
/home/ubuntu/digitalbook/logs/
~/.pm2/logs/

# System logs
/var/log/nginx/
/var/log/postgresql/
/var/log/redis/

# Service logs
sudo journalctl -u digitalbook
sudo journalctl -u nginx
```

#### Log Rotation
```bash
# Configure logrotate
sudo nano /etc/logrotate.d/digitalbook

/home/ubuntu/digitalbook/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 ubuntu ubuntu
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

---

## 💾 Backup & Recovery

### Backup Strategy

#### Automated Daily Backups
```bash
# Add to crontab
crontab -e

# Daily backup at 2 AM
0 2 * * * /home/ubuntu/digitalbook/scripts/backup.sh --type full --compress --remote

# Weekly full backup on Sunday
0 3 * * 0 /home/ubuntu/digitalbook/scripts/backup.sh --type full --compress --encrypt --remote --retention 90
```

#### Manual Backup
```bash
# Full backup
./scripts/backup.sh --type full --compress

# Database only
./scripts/backup.sh --type db --compress --encrypt

# Files only
./scripts/backup.sh --type files --compress
```

### Recovery Procedures

#### Database Recovery
```bash
# Find backup
ls -la backups/

# Restore specific backup
./scripts/restore.sh --backup-id 20250107_120000 --type db

# Verify restoration
psql -U postgres -d digitalbook -c "SELECT COUNT(*) FROM \"User\";"
```

#### Full System Recovery
```bash
# Complete restoration
./scripts/restore.sh --backup-id 20250107_120000 --type full --force

# Verify all services
./scripts/validate-production.sh
```

### Disaster Recovery Plan

1. **Data Loss Scenario**
   ```bash
   # Restore from latest backup
   ./scripts/restore.sh --type full
   
   # Restore from remote backup
   aws s3 sync s3://digitalbook-backups/latest/ backups/latest/
   ./scripts/restore.sh --backup-dir backups/latest --type full
   ```

2. **Server Failure**
   ```bash
   # Launch new instance
   # Transfer backups
   # Run deployment script
   ./scripts/deploy-fresh.sh
   ```

---

## ⚡ Performance Tuning

### Database Optimization

#### Query Performance
```sql
-- Find slow queries
SELECT query, mean_exec_time, calls 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;

-- Analyze tables
ANALYZE;

-- Vacuum database
VACUUM ANALYZE;
```

#### Connection Pooling
```javascript
// backend/src/config/database.ts
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Connection pool settings
  connection_limit: 10,
  pool_timeout: 10,
  pool_size: 10,
});
```

### Redis Optimization

```bash
# Redis configuration
redis-cli CONFIG SET maxmemory 2gb
redis-cli CONFIG SET maxmemory-policy allkeys-lru

# Monitor memory usage
redis-cli INFO memory
```

### Nginx Optimization

```nginx
# /etc/nginx/nginx.conf
worker_processes auto;
worker_connections 1024;

# Gzip compression
gzip on;
gzip_types text/plain text/css application/json application/javascript;
gzip_min_length 1000;

# Cache static files
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 30d;
    add_header Cache-Control "public, immutable";
}
```

### Node.js Optimization

```bash
# PM2 cluster mode
pm2 start backend/dist/index.js -i max --name backend

# Memory management
NODE_OPTIONS="--max-old-space-size=2048" pm2 start backend
```

---

## 🔒 Security Operations

### Security Checklist

#### Daily Tasks
- [ ] Review authentication logs
- [ ] Check failed login attempts
- [ ] Monitor API rate limits
- [ ] Review error logs for security issues

#### Weekly Tasks
- [ ] Update dependencies
- [ ] Review user permissions
- [ ] Check SSL certificate expiry
- [ ] Audit database access logs

#### Monthly Tasks
- [ ] Security patches
- [ ] Penetration testing
- [ ] Review security policies
- [ ] Update firewall rules

### SSL Certificate Management

```bash
# Check certificate expiry
echo | openssl s_client -servername xn--220bu63c.com -connect xn--220bu63c.com:443 2>/dev/null | openssl x509 -noout -dates

# Renew certificate
sudo certbot renew --quiet

# Force renewal
sudo certbot renew --force-renewal
```

### Firewall Configuration

```bash
# UFW rules
sudo ufw status

# Add rules
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw allow 3000/tcp # Frontend (internal only)
sudo ufw allow 4000/tcp # Backend (internal only)
```

### Security Headers

```nginx
# Nginx security headers
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';" always;
```

---

## 🚨 Incident Response

### Incident Severity Levels

| Level | Description | Response Time | Examples |
|-------|-------------|---------------|----------|
| P1 | Critical | < 15 mins | Site down, data breach |
| P2 | High | < 1 hour | API errors, login issues |
| P3 | Medium | < 4 hours | Slow performance |
| P4 | Low | < 24 hours | Minor bugs |

### Response Procedures

#### 1. Detection & Alert
```bash
# Check service status
./scripts/health-check.sh

# View recent errors
tail -f logs/error.log
pm2 logs --err
```

#### 2. Initial Response
```bash
# Create incident ticket
echo "$(date): Incident detected - $DESCRIPTION" >> incidents.log

# Notify team
./scripts/send-alert.sh --priority high --message "Incident detected"
```

#### 3. Investigation
```bash
# Collect diagnostic data
./scripts/collect-diagnostics.sh

# Check recent changes
git log --oneline -10
pm2 list
docker ps
```

#### 4. Mitigation
```bash
# Quick fixes
pm2 restart all
sudo systemctl restart nginx

# Rollback if needed
./scripts/rollback.sh
```

#### 5. Resolution & Post-mortem
```markdown
## Incident Report Template
- **Date/Time**: 
- **Duration**: 
- **Impact**: 
- **Root Cause**: 
- **Resolution**: 
- **Prevention**: 
```

---

## 🔧 Maintenance Tasks

### Daily Maintenance

```bash
#!/bin/bash
# Daily maintenance script

# Check disk space
df -h

# Clean old logs
find /var/log -name "*.log" -mtime +7 -delete

# Check service status
systemctl status digitalbook
pm2 status

# Database maintenance
psql -U postgres -d digitalbook -c "VACUUM ANALYZE;"
```

### Weekly Maintenance

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Check for dependency updates
npm outdated
cd backend && npm outdated

# Database backup verification
./scripts/backup.sh --type db --dry-run
```

### Monthly Maintenance

```bash
# Full system backup
./scripts/backup.sh --type full --compress --encrypt --remote

# Security updates
sudo unattended-upgrade

# Performance review
./scripts/generate-performance-report.sh

# Clean Docker images
docker system prune -af
```

---

## 🔍 Troubleshooting Guide

### Common Issues

#### 1. 502 Bad Gateway

**Symptoms**: Nginx returns 502 error

**Diagnosis**:
```bash
# Check if app is running
sudo systemctl status digitalbook
pm2 list

# Check nginx logs
sudo tail -100 /var/log/nginx/error.log
```

**Solution**:
```bash
# Restart services
sudo systemctl restart digitalbook
pm2 restart backend
sudo systemctl restart nginx
```

#### 2. High Memory Usage

**Symptoms**: Server becomes slow, OOM errors

**Diagnosis**:
```bash
# Check memory usage
free -m
htop

# Find memory-hungry processes
ps aux --sort=-%mem | head
```

**Solution**:
```bash
# Restart Node.js apps
pm2 restart all

# Clear caches
redis-cli FLUSHALL

# Increase swap if needed
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

#### 3. Database Connection Errors

**Symptoms**: "Too many connections" errors

**Diagnosis**:
```bash
# Check connections
sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity;"

# View active queries
sudo -u postgres psql -c "SELECT pid, query, state FROM pg_stat_activity WHERE state != 'idle';"
```

**Solution**:
```bash
# Kill idle connections
sudo -u postgres psql -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle' AND state_change < current_timestamp - INTERVAL '10 minutes';"

# Restart database
sudo systemctl restart postgresql
```

#### 4. SSL Certificate Issues

**Symptoms**: Browser shows security warning

**Diagnosis**:
```bash
# Check certificate
openssl s_client -connect xn--220bu63c.com:443 -servername xn--220bu63c.com

# Check nginx config
sudo nginx -t
```

**Solution**:
```bash
# Renew certificate
sudo certbot renew --force-renewal

# Restart nginx
sudo systemctl restart nginx
```

---

## 🆘 Emergency Procedures

### Site Down - Complete Outage

```bash
#!/bin/bash
# Emergency recovery script

# 1. Check server accessibility
ping 3.37.168.225

# 2. SSH to server
ssh -i Korean-Text-Book.pem ubuntu@3.37.168.225

# 3. Check all services
sudo systemctl status digitalbook
pm2 list
docker ps
sudo systemctl status nginx

# 4. Restart everything
sudo systemctl restart digitalbook
pm2 restart all
sudo systemctl restart nginx
sudo systemctl restart postgresql
sudo systemctl restart redis

# 5. If still down, check logs
tail -100 /var/log/syslog
journalctl -xe

# 6. Last resort - reboot
sudo reboot
```

### Data Corruption

```bash
# 1. Stop all services
pm2 stop all
sudo systemctl stop digitalbook

# 2. Restore from backup
./scripts/restore.sh --type db --force

# 3. Verify data integrity
psql -U postgres -d digitalbook -c "SELECT COUNT(*) FROM \"User\";"

# 4. Restart services
pm2 start all
sudo systemctl start digitalbook
```

### Security Breach

```bash
# 1. Isolate system
sudo ufw default deny incoming
sudo ufw allow from YOUR_IP to any port 22

# 2. Change all passwords
# Update .env.production with new secrets

# 3. Audit logs
grep -r "auth" /var/log/
tail -1000 /var/log/auth.log

# 4. Rotate all keys
openssl rand -base64 32  # Generate new JWT secret
openssl rand -hex 32      # Generate new encryption key

# 5. Force logout all users
redis-cli FLUSHALL

# 6. Re-enable access
sudo ufw default allow incoming
```

---

## 📞 Contact Information

### Escalation Matrix

| Role | Name | Contact | Availability |
|------|------|---------|--------------|
| System Admin | Admin | admin@digitalbook.com | 24/7 |
| DevOps Lead | DevOps | devops@digitalbook.com | Business hours |
| Database Admin | DBA | dba@digitalbook.com | On-call |
| Security Team | Security | security@digitalbook.com | 24/7 |

### External Support

- **AWS Support**: Premium support plan
- **Database Consultant**: consultant@example.com
- **Security Firm**: security-firm@example.com

---

## 📚 Additional Resources

- [Architecture Documentation](./ARCHITECTURE.md)
- [API Documentation](./API.md)
- [Security Guidelines](./SECURITY.md)
- [Development Guide](./DEVELOPMENT.md)
- [Testing Guide](./docs/E2E_TESTING_GUIDE.md)

---

*Last Updated: 2025-08-07*
*Version: 2.0.0*