# Monitoring Stack for Korean Digital Textbook Platform

## Overview

Comprehensive monitoring solution for the Korean Digital Textbook Platform featuring real-time metrics, log aggregation, distributed tracing, and intelligent alerting.

## 🎯 Key Features

### Metrics Collection & Visualization
- **Prometheus**: Time-series metrics database
- **Grafana**: Advanced visualization with 5 custom dashboards
- **Node Exporter**: System-level metrics
- **Custom Exporters**: PostgreSQL, Redis, Nginx metrics

### Log Management
- **Fluent Bit**: High-performance log processor
- **Loki**: Log aggregation system
- **Promtail**: Log shipping agent
- **Elasticsearch**: Long-term log storage and analysis

### Distributed Tracing
- **Jaeger**: End-to-end request tracing
- **OpenTelemetry**: Vendor-neutral observability framework

### Alerting & Incident Management
- **Alertmanager**: Intelligent alert routing
- **Multi-channel notifications**: Email, Slack, PagerDuty
- **Escalation policies**: Tiered response system

## 📊 Dashboards

1. **Main Dashboard**: System overview, uptime, request rates
2. **User Analytics**: User behavior, conversion rates, retention
3. **Performance Monitoring**: Response times, web vitals, database performance
4. **Security Dashboard**: Threat detection, failed logins, SSL status
5. **Cost Optimization**: Resource usage, AI API costs, budget tracking

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for metrics middleware)
- 4GB+ RAM available for monitoring stack

### Installation

```bash
# 1. Run the automated setup script
cd /Users/jihunkong/DigitalBook/monitoring/scripts
./setup-monitoring.sh

# 2. Verify services are running
docker-compose -f ../docker-compose.monitoring.yml ps

# 3. Access Grafana
open http://localhost:3001
# Login: admin / digitalbook2024
```

### Manual Setup

```bash
# 1. Start the monitoring stack
cd /Users/jihunkong/DigitalBook/monitoring
docker-compose -f docker-compose.monitoring.yml up -d

# 2. Import Grafana dashboards manually
# Navigate to Grafana > Dashboards > Import
# Upload JSON files from monitoring/grafana/

# 3. Configure alerting
# Update webhook URLs in alertmanager/alertmanager.yml
docker-compose -f docker-compose.monitoring.yml restart alertmanager
```

## 📈 Metrics Integration

### Backend Integration

```typescript
// Add to your Express app
import { metricsMiddleware, metricsEndpoint } from './monitoring/scripts/metrics-middleware';

// Apply middleware
app.use(metricsMiddleware);

// Expose metrics endpoint
app.get('/metrics', metricsEndpoint);
```

### Frontend Integration

```javascript
// Track Web Vitals
import { getCLS, getFID, getLCP } from 'web-vitals';

getCLS(metric => trackWebVital('CLS', metric.value));
getFID(metric => trackWebVital('FID', metric.value));
getLCP(metric => trackWebVital('LCP', metric.value));
```

## 🔔 Alert Configuration

### Critical Alerts (Immediate Response)
- Service down
- Database connection lost
- High error rate (>5%)
- Security breaches
- SSL certificate expiry

### Warning Alerts (Review Required)
- High memory usage (>85%)
- Slow response times (>2s p95)
- Low disk space (<20%)
- Elevated AI API costs

### Business Alerts (Daily Review)
- Low user activity
- Conversion rate drops
- Content engagement metrics

## 📝 Log Aggregation

### Log Sources
- Frontend application logs
- Backend API logs
- Nginx access/error logs
- PostgreSQL query logs
- System logs (systemd)
- Docker container logs

### Log Pipeline
1. **Collection**: Fluent Bit tails log files
2. **Processing**: Parse, enrich, filter logs
3. **Storage**: Send to Loki/Elasticsearch
4. **Analysis**: Query via Grafana/Kibana

## 🔍 Distributed Tracing

### Trace Collection
```typescript
// Instrument your code
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('digitalbook');
const span = tracer.startSpan('operation-name');
// ... your code
span.end();
```

### Viewing Traces
1. Access Jaeger UI: http://localhost:16686
2. Select service and operation
3. View trace timeline and spans

## 🛡️ Security Monitoring

### Tracked Security Events
- Failed login attempts
- SQL injection attempts
- XSS attempts
- Rate limit violations
- JWT validation failures
- Suspicious IP addresses

### Security Metrics
- Security score (overall health)
- 2FA adoption rate
- Password strength distribution
- Attack origin geographic data

## 💰 Cost Optimization

### Tracked Costs
- Infrastructure (AWS Lightsail)
- AI API usage (OpenAI)
- Storage (S3, local)
- Bandwidth
- Database operations

### Optimization Metrics
- Cost per user
- Resource utilization
- Budget usage percentage
- Projected monthly costs
- Cost savings opportunities

## 🔧 Troubleshooting

### Common Issues

#### High Memory Usage on Monitoring Stack
```bash
# Reduce retention periods
docker exec -it digitalbook-prometheus sh
# Edit prometheus.yml, reduce retention
```

#### Grafana Dashboards Not Loading
```bash
# Restart Grafana
docker-compose -f docker-compose.monitoring.yml restart grafana

# Check datasources
curl -u admin:digitalbook2024 http://localhost:3001/api/datasources
```

#### Alerts Not Firing
```bash
# Check Alertmanager logs
docker logs digitalbook-alertmanager

# Verify webhook URLs
cat alertmanager/alertmanager.yml
```

## 📚 Key Files

```
monitoring/
├── prometheus/
│   └── prometheus.yml          # Prometheus configuration
├── grafana/
│   ├── *.json                  # Dashboard definitions
│   └── datasources.yml         # Data source config
├── alerts/
│   └── alert-rules.yml         # Alert rules
├── alertmanager/
│   └── alertmanager.yml        # Alert routing
├── logs/
│   ├── fluent-bit.conf        # Log processing
│   └── parsers.conf           # Log parsers
├── scripts/
│   ├── setup-monitoring.sh    # Setup script
│   └── metrics-middleware.ts  # Application metrics
├── docker-compose.monitoring.yml
└── uptime-monitoring.yml      # Uptime monitoring config
```

## 🌐 External Monitoring

For production, also configure:
1. **UptimeRobot/Pingdom**: External uptime monitoring
2. **CloudWatch**: AWS infrastructure metrics
3. **New Relic/DataDog**: APM (optional)
4. **Sentry**: Error tracking (optional)

## 📞 Support Contacts

- **On-call**: oncall@digitalbook.com
- **Security**: security@digitalbook.com
- **DevOps**: devops@digitalbook.com
- **Slack**: #monitoring-alerts

## 🔄 Maintenance

### Daily Tasks
- Review critical alerts
- Check dashboard anomalies
- Monitor cost trends

### Weekly Tasks
- Review performance trends
- Analyze user behavior patterns
- Update alert thresholds

### Monthly Tasks
- Generate performance reports
- Review and optimize costs
- Update monitoring configurations
- Test disaster recovery procedures

## 📈 KPIs and SLAs

### Target Metrics
- **Uptime**: 99.9% (43.2 minutes downtime/month)
- **Response Time**: <1s p95
- **Error Rate**: <0.1%
- **Apdex Score**: >0.9

### Measurement Period
- Real-time: Every 15 seconds
- Aggregation: 5-minute windows
- Reporting: Monthly

## 🚀 Next Steps

1. **Configure Production Alerts**
   - Update Slack webhook URL
   - Set up PagerDuty integration
   - Configure email SMTP

2. **Customize Dashboards**
   - Add business-specific metrics
   - Create team-specific views
   - Set up TV displays

3. **Implement SLOs**
   - Define service level objectives
   - Create error budgets
   - Set up SLO dashboards

4. **Security Hardening**
   - Enable Grafana LDAP/OAuth
   - Set up HTTPS for all services
   - Implement RBAC

---

For detailed documentation, visit the [monitoring wiki](https://wiki.digitalbook.com/monitoring) or contact the DevOps team.