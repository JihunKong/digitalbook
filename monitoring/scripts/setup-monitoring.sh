#!/bin/bash

# Monitoring Stack Setup Script
# Korean Digital Textbook Platform

set -e

echo "🚀 Setting up Monitoring Stack for Digital Textbook Platform"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check prerequisites
echo "Checking prerequisites..."

if ! command_exists docker; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command_exists docker-compose; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

print_status "Prerequisites check passed"

# Create necessary directories
echo "Creating monitoring directories..."
mkdir -p /Users/jihunkong/DigitalBook/monitoring/{data,logs,tmp}
mkdir -p /Users/jihunkong/DigitalBook/monitoring/data/{prometheus,grafana,loki,alertmanager}
print_status "Directories created"

# Set proper permissions
echo "Setting permissions..."
chmod -R 755 /Users/jihunkong/DigitalBook/monitoring
print_status "Permissions set"

# Create .env file for monitoring stack
echo "Creating environment configuration..."
cat > /Users/jihunkong/DigitalBook/monitoring/.env << EOF
# Monitoring Stack Environment Variables
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=digitalbook2024
PROMETHEUS_RETENTION_TIME=30d
LOKI_RETENTION_PERIOD=30d
ALERTMANAGER_SLACK_WEBHOOK=YOUR_SLACK_WEBHOOK_URL
ALERTMANAGER_EMAIL_FROM=alerts@digitalbook.com
ALERTMANAGER_EMAIL_TO=team@digitalbook.com
POSTGRES_MONITORING_USER=monitoring_user
POSTGRES_MONITORING_PASSWORD=monitoring_password
EOF
print_status "Environment configuration created"

# Create Loki configuration
echo "Creating Loki configuration..."
cat > /Users/jihunkong/DigitalBook/monitoring/loki/loki-config.yml << 'EOF'
auth_enabled: false

server:
  http_listen_port: 3100
  grpc_listen_port: 9096

common:
  path_prefix: /tmp/loki
  storage:
    filesystem:
      chunks_directory: /tmp/loki/chunks
      rules_directory: /tmp/loki/rules
  replication_factor: 1
  ring:
    instance_addr: 127.0.0.1
    kvstore:
      store: inmemory

schema_config:
  configs:
    - from: 2020-10-24
      store: boltdb-shipper
      object_store: filesystem
      schema: v11
      index:
        prefix: index_
        period: 24h

ruler:
  alertmanager_url: http://alertmanager:9093

analytics:
  reporting_enabled: false
EOF
print_status "Loki configuration created"

# Create Promtail configuration
echo "Creating Promtail configuration..."
cat > /Users/jihunkong/DigitalBook/monitoring/promtail/promtail-config.yml << 'EOF'
server:
  http_listen_port: 9080
  grpc_listen_port: 0

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  - job_name: system
    static_configs:
      - targets:
          - localhost
        labels:
          job: varlogs
          __path__: /var/log/*log
          
  - job_name: containers
    static_configs:
      - targets:
          - localhost
        labels:
          job: containerlogs
          __path__: /var/lib/docker/containers/*/*log
    pipeline_stages:
      - json:
          expressions:
            output: log
            stream: stream
            time: time
      - json:
          expressions:
            tag: attrs.tag
          source: stream
      - regex:
          expression: ^(?P<image_name>([^|]+))\|(?P<container_name>([^|]+))$
          source: tag
      - timestamp:
          format: RFC3339Nano
          source: time
      - labels:
          stream:
          image_name:
          container_name:
      - output:
          source: output
EOF
print_status "Promtail configuration created"

# Install Node.js dependencies for metrics middleware
echo "Installing Node.js dependencies for metrics..."
cd /Users/jihunkong/DigitalBook
npm install --save prom-client
print_status "Node.js dependencies installed"

# Create systemd service for monitoring stack (optional)
echo "Creating systemd service configuration..."
cat > /Users/jihunkong/DigitalBook/monitoring/monitoring.service << 'EOF'
[Unit]
Description=Digital Textbook Platform Monitoring Stack
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/Users/jihunkong/DigitalBook/monitoring
ExecStart=/usr/local/bin/docker-compose -f docker-compose.monitoring.yml up -d
ExecStop=/usr/local/bin/docker-compose -f docker-compose.monitoring.yml down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF
print_status "Systemd service configuration created"

# Start monitoring stack
echo "Starting monitoring stack..."
cd /Users/jihunkong/DigitalBook/monitoring
docker-compose -f docker-compose.monitoring.yml up -d

# Wait for services to be ready
echo "Waiting for services to be ready..."
sleep 10

# Check if services are running
echo "Checking service status..."

if curl -s -o /dev/null -w "%{http_code}" http://localhost:9090 | grep -q "200"; then
    print_status "Prometheus is running at http://localhost:9090"
else
    print_error "Prometheus is not accessible"
fi

if curl -s -o /dev/null -w "%{http_code}" http://localhost:3001 | grep -q "200"; then
    print_status "Grafana is running at http://localhost:3001"
    echo "  Username: admin"
    echo "  Password: digitalbook2024"
else
    print_error "Grafana is not accessible"
fi

if curl -s -o /dev/null -w "%{http_code}" http://localhost:9093 | grep -q "200"; then
    print_status "Alertmanager is running at http://localhost:9093"
else
    print_error "Alertmanager is not accessible"
fi

if curl -s -o /dev/null -w "%{http_code}" http://localhost:16686 | grep -q "200"; then
    print_status "Jaeger is running at http://localhost:16686"
else
    print_error "Jaeger is not accessible"
fi

# Import Grafana dashboards
echo "Importing Grafana dashboards..."
sleep 5

# Function to import dashboard
import_dashboard() {
    local dashboard_file=$1
    local dashboard_name=$2
    
    curl -X POST \
        -H "Content-Type: application/json" \
        -u admin:digitalbook2024 \
        -d @"$dashboard_file" \
        http://localhost:3001/api/dashboards/db \
        2>/dev/null | grep -q "success" && \
        print_status "Imported $dashboard_name dashboard" || \
        print_warning "Failed to import $dashboard_name dashboard"
}

# Import all dashboards
import_dashboard "grafana/main-dashboard.json" "Main"
import_dashboard "grafana/user-analytics-dashboard.json" "User Analytics"
import_dashboard "grafana/performance-dashboard.json" "Performance"
import_dashboard "grafana/security-dashboard.json" "Security"
import_dashboard "grafana/cost-optimization-dashboard.json" "Cost Optimization"

echo ""
echo "================================"
echo "Monitoring Stack Setup Complete!"
echo "================================"
echo ""
echo "Access Points:"
echo "  - Grafana: http://localhost:3001 (admin/digitalbook2024)"
echo "  - Prometheus: http://localhost:9090"
echo "  - Alertmanager: http://localhost:9093"
echo "  - Jaeger: http://localhost:16686"
echo "  - Loki: http://localhost:3100"
echo ""
echo "Next Steps:"
echo "  1. Update alert webhook URLs in alertmanager.yml"
echo "  2. Configure email settings for alerts"
echo "  3. Set up external monitoring (UptimeRobot, Pingdom, etc.)"
echo "  4. Integrate metrics middleware in your application"
echo "  5. Configure log shipping from production servers"
echo ""
echo "To stop the monitoring stack:"
echo "  cd /Users/jihunkong/DigitalBook/monitoring"
echo "  docker-compose -f docker-compose.monitoring.yml down"
echo ""
print_status "Setup complete!"