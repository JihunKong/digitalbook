import { Router } from 'express';
import { asyncHandler } from '../middlewares/errorHandler';
import { getHealthWithMetrics } from '../middlewares/performanceMonitor';
import { logger } from '../utils/logger';
import { authMiddleware } from '../middlewares/auth';
import { z } from 'zod';
import { validate } from '../middlewares/validator';

const router = Router();

// Client error logging schema
const clientErrorSchema = z.object({
  errorId: z.string(),
  message: z.string(),
  stack: z.string().optional(),
  componentStack: z.string().optional(),
  url: z.string(),
  userAgent: z.string(),
  timestamp: z.string(),
});

// Client logs schema
const clientLogsSchema = z.object({
  logs: z.array(z.object({
    level: z.enum(['debug', 'info', 'warn', 'error']),
    message: z.string(),
    data: z.any().optional(),
    timestamp: z.string(),
    url: z.string(),
    userAgent: z.string(),
  })),
});

// Health check endpoint (public)
router.get('/health', asyncHandler(async (req, res) => {
  const basicHealth = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  };
  
  res.json(basicHealth);
}));

// Detailed health check with metrics (requires authentication)
router.get('/health/detailed', authMiddleware, asyncHandler(async (req, res) => {
  const detailedHealth = getHealthWithMetrics();
  res.json(detailedHealth);
}));

// Client error reporting endpoint
router.post('/errors', validate(clientErrorSchema), asyncHandler(async (req, res) => {
  const errorData = req.body;
  
  // Log client error
  logger.error('Client Error', {
    type: 'client_error',
    ...errorData,
    ip: req.ip,
    userId: (req as any).user?.id,
  });
  
  res.json({ success: true, errorId: errorData.errorId });
}));

// Client logs endpoint
router.post('/logs', validate(clientLogsSchema), asyncHandler(async (req, res) => {
  const { logs } = req.body;
  
  // Process each log entry
  logs.forEach((log: any) => {
    const logData = {
      type: 'client_log',
      ...log,
      ip: req.ip,
      userId: (req as any).user?.id,
    };
    
    // Use appropriate log level
    switch (log.level) {
      case 'error':
        logger.error(`Client: ${log.message}`, logData);
        break;
      case 'warn':
        logger.warn(`Client: ${log.message}`, logData);
        break;
      case 'info':
        logger.info(`Client: ${log.message}`, logData);
        break;
      case 'debug':
        logger.debug(`Client: ${log.message}`, logData);
        break;
    }
  });
  
  res.json({ success: true, processed: logs.length });
}));

// Metrics endpoint (requires authentication)
router.get('/metrics', authMiddleware, asyncHandler(async (req, res) => {
  const metrics = getHealthWithMetrics();
  
  // Format metrics for monitoring systems (Prometheus format)
  const prometheusMetrics = formatMetricsForPrometheus(metrics);
  
  res.set('Content-Type', 'text/plain');
  res.send(prometheusMetrics);
}));

// Function to format metrics for Prometheus
function formatMetricsForPrometheus(metrics: any): string {
  const lines: string[] = [];
  
  // System metrics
  lines.push('# HELP app_uptime_seconds Application uptime in seconds');
  lines.push('# TYPE app_uptime_seconds gauge');
  lines.push(`app_uptime_seconds ${metrics.uptime}`);
  
  // Memory metrics
  lines.push('# HELP app_memory_usage_bytes Memory usage in bytes');
  lines.push('# TYPE app_memory_usage_bytes gauge');
  lines.push(`app_memory_usage_bytes{type="rss"} ${metrics.memory.rss}`);
  lines.push(`app_memory_usage_bytes{type="heapTotal"} ${metrics.memory.heapTotal}`);
  lines.push(`app_memory_usage_bytes{type="heapUsed"} ${metrics.memory.heapUsed}`);
  
  // Performance metrics
  lines.push('# HELP app_requests_per_minute Total requests per minute');
  lines.push('# TYPE app_requests_per_minute gauge');
  lines.push(`app_requests_per_minute ${metrics.performance.overallRequestsPerMinute}`);
  
  lines.push('# HELP app_response_time_milliseconds Response time in milliseconds');
  lines.push('# TYPE app_response_time_milliseconds gauge');
  lines.push(`app_response_time_milliseconds{type="average"} ${metrics.performance.overallAverageResponseTime}`);
  
  // Endpoint metrics
  Object.entries(metrics.endpointMetrics).forEach(([endpoint, metric]: [string, any]) => {
    const [method, path] = endpoint.split(':');
    const labels = `method="${method}",path="${path}"`;
    
    lines.push(`app_endpoint_requests_per_minute{${labels}} ${metric.requestsPerMinute}`);
    lines.push(`app_endpoint_response_time_milliseconds{${labels},percentile="avg"} ${metric.averageResponseTime}`);
    lines.push(`app_endpoint_response_time_milliseconds{${labels},percentile="p95"} ${metric.p95ResponseTime}`);
    lines.push(`app_endpoint_response_time_milliseconds{${labels},percentile="p99"} ${metric.p99ResponseTime}`);
    lines.push(`app_endpoint_error_rate{${labels}} ${metric.errorRate}`);
  });
  
  return lines.join('\n');
}

export default router;