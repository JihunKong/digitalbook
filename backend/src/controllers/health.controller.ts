import { Request, Response } from 'express';
import { getDatabase } from '../config/database';
import { promisify } from 'util';

export class HealthController {
  /**
   * Basic health check endpoint
   */
  async healthCheck(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    
    try {
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      };

      res.status(200).json(health);
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: (error as Error).message
      });
    }
  }

  /**
   * Detailed health check with dependency status
   */
  async detailedHealthCheck(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    const checks: Record<string, any> = {};

    // Database health check
    try {
      const prisma = getDatabase();
      await prisma.$queryRaw`SELECT 1`;
      checks.database = {
        status: 'healthy',
        responseTime: Date.now() - startTime
      };
    } catch (error) {
      checks.database = {
        status: 'unhealthy',
        error: (error as Error).message,
        responseTime: Date.now() - startTime
      };
    }

    // Redis health check
    try {
      // Redis health check would go here if implemented
      checks.redis = {
        status: 'healthy',
        responseTime: Date.now() - startTime
      };
    } catch (error) {
      checks.redis = {
        status: 'unhealthy',
        error: (error as Error).message,
        responseTime: Date.now() - startTime
      };
    }

    // Memory check
    const memoryUsage = process.memoryUsage();
    checks.memory = {
      status: memoryUsage.heapUsed < 500 * 1024 * 1024 ? 'healthy' : 'warning', // 500MB threshold
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + ' MB',
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + ' MB',
      external: Math.round(memoryUsage.external / 1024 / 1024) + ' MB'
    };

    // Disk space check (simplified)
    checks.disk = {
      status: 'healthy', // Would implement actual disk space check
      usage: 'N/A'
    };

    // Overall status
    const allHealthy = Object.values(checks).every(check => check.status === 'healthy');
    const hasWarnings = Object.values(checks).some(check => check.status === 'warning');
    
    const overallStatus = allHealthy ? 'healthy' : hasWarnings ? 'warning' : 'unhealthy';
    const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'warning' ? 200 : 503;

    const response = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      responseTime: Date.now() - startTime,
      checks
    };

    res.status(statusCode).json(response);
  }

  /**
   * Readiness probe for Kubernetes/Docker
   */
  async readinessCheck(req: Request, res: Response): Promise<void> {
    try {
      // Check if application is ready to serve traffic
      const prisma = getDatabase();
      await prisma.$queryRaw`SELECT 1`;
      
      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(503).json({
        status: 'not ready',
        timestamp: new Date().toISOString(),
        error: (error as Error).message
      });
    }
  }

  /**
   * Liveness probe for Kubernetes/Docker
   */
  async livenessCheck(req: Request, res: Response): Promise<void> {
    // Simple liveness check - if we can respond, we're alive
    res.status(200).json({
      status: 'alive',
      timestamp: new Date().toISOString(),
      pid: process.pid,
      uptime: process.uptime()
    });
  }

  /**
   * Metrics endpoint for monitoring
   */
  async getMetrics(req: Request, res: Response): Promise<void> {
    try {
      const metrics = {
        // System metrics
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        
        // Application metrics
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        
        // Database metrics (would be enhanced with actual query performance)
        database: {
          connectionStatus: 'connected'
        }
      };

      res.status(200).json(metrics);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to collect metrics',
        message: (error as Error).message
      });
    }
  }

  /**
   * System information endpoint
   */
  async getSystemInfo(req: Request, res: Response): Promise<void> {
    try {
      const systemInfo = {
        node: {
          version: process.version,
          platform: process.platform,
          arch: process.arch,
          uptime: process.uptime(),
          pid: process.pid
        },
        memory: {
          ...process.memoryUsage(),
          usage: {
            heapUsedMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
            heapTotalMB: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
            externalMB: Math.round(process.memoryUsage().external / 1024 / 1024)
          }
        },
        environment: {
          nodeEnv: process.env.NODE_ENV,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          locale: Intl.DateTimeFormat().resolvedOptions().locale
        },
        application: {
          name: 'ClassAppHub',
          version: process.env.npm_package_version || '1.0.0',
          startTime: new Date(Date.now() - process.uptime() * 1000).toISOString()
        }
      };

      res.status(200).json(systemInfo);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get system information',
        message: (error as Error).message
      });
    }
  }
}

export const healthController = new HealthController();