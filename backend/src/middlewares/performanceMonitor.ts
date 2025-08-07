import { Request, Response, NextFunction } from 'express';
import { logRequest, logPerformance } from '../utils/logger';

interface PerformanceMetrics {
  requestsPerMinute: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  errorRate: number;
}

class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();
  private errorCounts: Map<string, number> = new Map();
  private totalRequests: Map<string, number> = new Map();
  private metricsWindow: number = 60000; // 1 minute window

  constructor() {
    // Clean up old metrics every minute
    setInterval(() => this.cleanupOldMetrics(), this.metricsWindow);
  }

  private getEndpointKey(method: string, path: string): string {
    // Normalize path by replacing IDs with placeholders
    const normalizedPath = path
      .replace(/\/\d+/g, '/:id')
      .replace(/\/[a-f0-9]{24}/g, '/:id'); // MongoDB ObjectId
    return `${method}:${normalizedPath}`;
  }

  private cleanupOldMetrics() {
    const cutoffTime = Date.now() - this.metricsWindow;
    
    this.metrics.forEach((times, endpoint) => {
      const filteredTimes = times.filter(time => time > cutoffTime);
      if (filteredTimes.length === 0) {
        this.metrics.delete(endpoint);
        this.errorCounts.delete(endpoint);
        this.totalRequests.delete(endpoint);
      } else {
        this.metrics.set(endpoint, filteredTimes);
      }
    });
  }

  recordRequest(method: string, path: string, responseTime: number, statusCode: number) {
    const endpoint = this.getEndpointKey(method, path);
    const timestamp = Date.now();

    // Record response time
    if (!this.metrics.has(endpoint)) {
      this.metrics.set(endpoint, []);
    }
    this.metrics.get(endpoint)!.push(responseTime);

    // Record total requests
    this.totalRequests.set(endpoint, (this.totalRequests.get(endpoint) || 0) + 1);

    // Record errors
    if (statusCode >= 400) {
      this.errorCounts.set(endpoint, (this.errorCounts.get(endpoint) || 0) + 1);
    }

    // Log slow requests
    if (responseTime > 1000) { // 1 second
      logPerformance('Slow Request', responseTime, {
        method,
        path,
        statusCode,
        threshold: 1000,
      });
    }
  }

  getMetrics(endpoint?: string): PerformanceMetrics | Map<string, PerformanceMetrics> {
    if (endpoint) {
      return this.calculateMetrics(endpoint);
    }

    const allMetrics = new Map<string, PerformanceMetrics>();
    this.metrics.forEach((_, ep) => {
      allMetrics.set(ep, this.calculateMetrics(ep));
    });
    return allMetrics;
  }

  private calculateMetrics(endpoint: string): PerformanceMetrics {
    const times = this.metrics.get(endpoint) || [];
    const errors = this.errorCounts.get(endpoint) || 0;
    const total = this.totalRequests.get(endpoint) || 0;

    if (times.length === 0) {
      return {
        requestsPerMinute: 0,
        averageResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        errorRate: 0,
      };
    }

    // Sort times for percentile calculation
    const sortedTimes = [...times].sort((a, b) => a - b);
    
    const average = times.reduce((sum, time) => sum + time, 0) / times.length;
    const p95Index = Math.floor(sortedTimes.length * 0.95);
    const p99Index = Math.floor(sortedTimes.length * 0.99);

    return {
      requestsPerMinute: times.length,
      averageResponseTime: Math.round(average),
      p95ResponseTime: sortedTimes[p95Index] || 0,
      p99ResponseTime: sortedTimes[p99Index] || 0,
      errorRate: total > 0 ? (errors / total) * 100 : 0,
    };
  }

  middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();

      // Override res.end to capture response time
      const originalEnd = res.end;
      res.end = (...args: any[]) => {
        const responseTime = Date.now() - startTime;
        
        // Record metrics
        this.recordRequest(req.method, req.path, responseTime, res.statusCode);
        
        // Log request
        logRequest(req, responseTime, res.statusCode);

        // Call original end
        return originalEnd.apply(res, args);
      };

      next();
    };
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Export middleware
export const performanceMiddleware = performanceMonitor.middleware();

// Health check endpoint that includes performance metrics
export const getHealthWithMetrics = () => {
  const metrics = performanceMonitor.getMetrics();
  const overallMetrics = {
    totalEndpoints: metrics.size,
    overallRequestsPerMinute: 0,
    overallAverageResponseTime: 0,
    slowEndpoints: [] as string[],
    errorProneEndpoints: [] as string[],
  };

  let totalRequests = 0;
  let totalResponseTime = 0;

  metrics.forEach((metric, endpoint) => {
    overallMetrics.overallRequestsPerMinute += metric.requestsPerMinute;
    totalRequests += metric.requestsPerMinute;
    totalResponseTime += metric.averageResponseTime * metric.requestsPerMinute;

    // Identify slow endpoints (average > 500ms)
    if (metric.averageResponseTime > 500) {
      overallMetrics.slowEndpoints.push(endpoint);
    }

    // Identify error-prone endpoints (error rate > 5%)
    if (metric.errorRate > 5) {
      overallMetrics.errorProneEndpoints.push(endpoint);
    }
  });

  if (totalRequests > 0) {
    overallMetrics.overallAverageResponseTime = Math.round(totalResponseTime / totalRequests);
  }

  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    performance: overallMetrics,
    endpointMetrics: Object.fromEntries(metrics),
  };
};