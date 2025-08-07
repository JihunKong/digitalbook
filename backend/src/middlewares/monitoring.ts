import { Request, Response, NextFunction } from 'express';
import { getRedis } from '../config/redis';
import { logger } from '../utils/logger';
import { performance } from 'perf_hooks';
import os from 'os';
import { EventEmitter } from 'events';

// Performance metrics types
interface PerformanceMetric {
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  timestamp: Date;
  userId?: string;
  userAgent?: string;
  ip?: string;
  error?: string;
}

interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: {
    total: number;
    used: number;
    percentage: number;
  };
  uptime: number;
  loadAverage: number[];
}

interface DatabaseMetrics {
  queryCount: number;
  slowQueries: number;
  averageQueryTime: number;
  connectionPoolSize: number;
  activeConnections: number;
}

// Metrics collector class
class MetricsCollector extends EventEmitter {
  private metrics: PerformanceMetric[] = [];
  private dbMetrics: Map<string, number[]> = new Map();
  private alertThresholds = {
    responseTime: 1000, // ms
    errorRate: 0.05, // 5%
    cpuUsage: 80, // %
    memoryUsage: 85, // %
    slowQueryTime: 100, // ms
  };

  constructor() {
    super();
    this.startPeriodicFlush();
    this.startSystemMonitoring();
  }

  // Collect API metrics
  collectApiMetric(metric: PerformanceMetric) {
    this.metrics.push(metric);

    // Check for alerts
    if (metric.responseTime > this.alertThresholds.responseTime) {
      this.emit('alert', {
        type: 'SLOW_RESPONSE',
        metric,
        threshold: this.alertThresholds.responseTime,
      });
    }

    if (metric.statusCode >= 500) {
      this.emit('alert', {
        type: 'SERVER_ERROR',
        metric,
      });
    }
  }

  // Collect database query metrics
  collectDatabaseMetric(queryType: string, duration: number) {
    if (!this.dbMetrics.has(queryType)) {
      this.dbMetrics.set(queryType, []);
    }
    
    const metrics = this.dbMetrics.get(queryType)!;
    metrics.push(duration);

    // Keep only last 1000 queries per type
    if (metrics.length > 1000) {
      metrics.shift();
    }

    // Check for slow queries
    if (duration > this.alertThresholds.slowQueryTime) {
      this.emit('alert', {
        type: 'SLOW_QUERY',
        queryType,
        duration,
        threshold: this.alertThresholds.slowQueryTime,
      });
    }
  }

  // Get current system metrics
  getSystemMetrics(): SystemMetrics {
    const cpus = os.cpus();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;

    // Calculate CPU usage
    let totalIdle = 0;
    let totalTick = 0;
    
    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type as keyof typeof cpu.times];
      }
      totalIdle += cpu.times.idle;
    });

    const cpuUsage = 100 - ~~(100 * totalIdle / totalTick);

    return {
      cpuUsage,
      memoryUsage: {
        total: totalMemory,
        used: usedMemory,
        percentage: (usedMemory / totalMemory) * 100,
      },
      uptime: os.uptime(),
      loadAverage: os.loadavg(),
    };
  }

  // Get aggregated API metrics
  getApiMetrics(timeWindow: number = 60000) {
    const now = Date.now();
    const recentMetrics = this.metrics.filter(
      m => now - m.timestamp.getTime() < timeWindow
    );

    if (recentMetrics.length === 0) {
      return {
        totalRequests: 0,
        averageResponseTime: 0,
        errorRate: 0,
        statusCodeDistribution: {},
        slowestEndpoints: [],
      };
    }

    // Calculate aggregates
    const totalRequests = recentMetrics.length;
    const totalResponseTime = recentMetrics.reduce((sum, m) => sum + m.responseTime, 0);
    const averageResponseTime = totalResponseTime / totalRequests;
    const errors = recentMetrics.filter(m => m.statusCode >= 400).length;
    const errorRate = errors / totalRequests;

    // Status code distribution
    const statusCodeDistribution = recentMetrics.reduce((acc, m) => {
      const code = Math.floor(m.statusCode / 100) * 100;
      acc[`${code}xx`] = (acc[`${code}xx`] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Slowest endpoints
    const endpointTimes = new Map<string, number[]>();
    recentMetrics.forEach(m => {
      const key = `${m.method} ${m.endpoint}`;
      if (!endpointTimes.has(key)) {
        endpointTimes.set(key, []);
      }
      endpointTimes.get(key)!.push(m.responseTime);
    });

    const slowestEndpoints = Array.from(endpointTimes.entries())
      .map(([endpoint, times]) => ({
        endpoint,
        averageTime: times.reduce((a, b) => a + b, 0) / times.length,
        count: times.length,
      }))
      .sort((a, b) => b.averageTime - a.averageTime)
      .slice(0, 10);

    return {
      totalRequests,
      averageResponseTime,
      errorRate,
      statusCodeDistribution,
      slowestEndpoints,
    };
  }

  // Get database metrics
  getDatabaseMetrics(): DatabaseMetrics {
    let totalQueries = 0;
    let totalTime = 0;
    let slowQueries = 0;

    this.dbMetrics.forEach((times, queryType) => {
      totalQueries += times.length;
      totalTime += times.reduce((a, b) => a + b, 0);
      slowQueries += times.filter(t => t > this.alertThresholds.slowQueryTime).length;
    });

    return {
      queryCount: totalQueries,
      slowQueries,
      averageQueryTime: totalQueries > 0 ? totalTime / totalQueries : 0,
      connectionPoolSize: 10, // TODO: Get from Prisma
      activeConnections: 0, // TODO: Get from Prisma
    };
  }

  // Periodic flush to Redis
  private startPeriodicFlush() {
    setInterval(async () => {
      if (this.metrics.length === 0) return;

      try {
        const redis = getRedis();
        const key = `metrics:api:${Date.now()}`;
        
        // Store metrics in Redis with 1 hour TTL
        await redis.setex(key, 3600, JSON.stringify(this.metrics));
        
        // Clear old metrics
        const oneHourAgo = Date.now() - 3600000;
        this.metrics = this.metrics.filter(
          m => m.timestamp.getTime() > oneHourAgo
        );
      } catch (error) {
        logger.error('Failed to flush metrics to Redis:', error);
      }
    }, 60000); // Flush every minute
  }

  // System monitoring
  private startSystemMonitoring() {
    setInterval(() => {
      const metrics = this.getSystemMetrics();

      // Check CPU usage
      if (metrics.cpuUsage > this.alertThresholds.cpuUsage) {
        this.emit('alert', {
          type: 'HIGH_CPU',
          value: metrics.cpuUsage,
          threshold: this.alertThresholds.cpuUsage,
        });
      }

      // Check memory usage
      if (metrics.memoryUsage.percentage > this.alertThresholds.memoryUsage) {
        this.emit('alert', {
          type: 'HIGH_MEMORY',
          value: metrics.memoryUsage.percentage,
          threshold: this.alertThresholds.memoryUsage,
        });
      }
    }, 30000); // Check every 30 seconds
  }

  // Update alert thresholds
  updateThresholds(thresholds: Partial<typeof this.alertThresholds>) {
    this.alertThresholds = { ...this.alertThresholds, ...thresholds };
  }
}

// Create singleton instance
const metricsCollector = new MetricsCollector();

// Alert handler
metricsCollector.on('alert', (alert) => {
  logger.warn('Performance Alert:', alert);
  
  // TODO: Send alert to monitoring service (Sentry, DataDog, etc.)
  // TODO: Send notification to administrators
});

// Performance monitoring middleware
export const performanceMonitor = (req: Request, res: Response, next: NextFunction) => {
  const startTime = performance.now();
  const originalSend = res.send;
  const originalJson = res.json;

  // Capture response
  const captureResponse = (body: any) => {
    const endTime = performance.now();
    const responseTime = endTime - startTime;

    // Collect metric
    metricsCollector.collectApiMetric({
      endpoint: req.route?.path || req.path,
      method: req.method,
      statusCode: res.statusCode,
      responseTime,
      timestamp: new Date(),
      userId: (req as any).user?.id,
      userAgent: req.get('user-agent'),
      ip: req.ip,
      error: res.statusCode >= 400 ? body?.error?.message : undefined,
    });

    // Log slow requests
    if (responseTime > 1000) {
      logger.warn(`Slow request: ${req.method} ${req.path} - ${responseTime}ms`);
    }

    return body;
  };

  // Override response methods
  res.send = function(body: any) {
    captureResponse(body);
    return originalSend.call(this, body);
  };

  res.json = function(body: any) {
    captureResponse(body);
    return originalJson.call(this, body);
  };

  next();
};

// Database query monitor (to be integrated with Prisma)
export const monitorDatabaseQuery = (queryType: string, duration: number) => {
  metricsCollector.collectDatabaseMetric(queryType, duration);
};

// Metrics API endpoints
export const getMetricsHandler = (req: Request, res: Response) => {
  const timeWindow = parseInt(req.query.timeWindow as string) || 60000;
  
  const apiMetrics = metricsCollector.getApiMetrics(timeWindow);
  const systemMetrics = metricsCollector.getSystemMetrics();
  const dbMetrics = metricsCollector.getDatabaseMetrics();

  res.json({
    api: apiMetrics,
    system: systemMetrics,
    database: dbMetrics,
    timestamp: new Date(),
  });
};

// Health check endpoint
export const healthCheckHandler = async (req: Request, res: Response) => {
  const checks = {
    api: 'healthy',
    database: 'unknown',
    redis: 'unknown',
    system: 'healthy',
  };

  // Check database
  try {
    const { getDatabase } = await import('../config/database');
    const prisma = getDatabase();
    await prisma.$queryRaw`SELECT 1`;
    checks.database = 'healthy';
  } catch (error) {
    checks.database = 'unhealthy';
    logger.error('Database health check failed:', error);
  }

  // Check Redis
  try {
    const redis = getRedis();
    await redis.ping();
    checks.redis = 'healthy';
  } catch (error) {
    checks.redis = 'unhealthy';
    logger.error('Redis health check failed:', error);
  }

  // Check system resources
  const systemMetrics = metricsCollector.getSystemMetrics();
  if (systemMetrics.cpuUsage > 90 || systemMetrics.memoryUsage.percentage > 90) {
    checks.system = 'degraded';
  }

  // Determine overall health
  const overallHealth = Object.values(checks).every(status => status === 'healthy')
    ? 'healthy'
    : Object.values(checks).some(status => status === 'unhealthy')
    ? 'unhealthy'
    : 'degraded';

  const statusCode = overallHealth === 'healthy' ? 200 : overallHealth === 'degraded' ? 200 : 503;

  res.status(statusCode).json({
    status: overallHealth,
    checks,
    metrics: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: systemMetrics.cpuUsage,
    },
    timestamp: new Date(),
  });
};

// Export metrics collector for external use
export { metricsCollector };

// Graceful shutdown
process.on('SIGTERM', () => {
  // Flush remaining metrics
  const redis = getRedis();
  const remainingMetrics = metricsCollector.getApiMetrics(Infinity);
  
  redis.setex(
    `metrics:final:${Date.now()}`,
    86400,
    JSON.stringify(remainingMetrics)
  ).finally(() => {
    logger.info('Metrics flushed on shutdown');
  });
});