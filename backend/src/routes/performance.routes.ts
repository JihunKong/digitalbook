import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth';
import { cacheService } from '../services/cache.service';
import { queryOptimizer } from '../services/query-optimizer.service';
import { logger } from '../utils/logger';
import { getDatabase } from '../config/database';

const router = Router();

/**
 * Get cache statistics
 */
router.get('/cache/stats', authenticateToken, async (req, res) => {
  try {
    const { role } = req.user!;
    
    if (role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const stats = await cacheService.getStats();
    res.json(stats);
  } catch (error) {
    logger.error('Failed to get cache stats:', error);
    res.status(500).json({ error: 'Failed to retrieve cache statistics' });
  }
});

/**
 * Clear cache (admin only)
 */
router.post('/cache/clear', authenticateToken, async (req, res) => {
  try {
    const { role } = req.user!;
    const { pattern, all } = req.body;
    
    if (role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    if (all === true) {
      await cacheService.clearAll();
      logger.info('Cache cleared by admin');
      return res.json({ message: 'All cache cleared successfully' });
    }

    if (pattern) {
      const deletedCount = await cacheService.deletePattern(pattern);
      logger.info(`Cache pattern ${pattern} cleared by admin, ${deletedCount} keys deleted`);
      return res.json({ 
        message: `Cleared ${deletedCount} keys matching pattern: ${pattern}` 
      });
    }

    return res.status(400).json({ 
      error: 'Specify either pattern or all=true' 
    });
  } catch (error) {
    logger.error('Failed to clear cache:', error);
    res.status(500).json({ error: 'Failed to clear cache' });
  }
});

/**
 * Get query performance statistics
 */
router.get('/query/stats', authenticateToken, async (req, res) => {
  try {
    const { role } = req.user!;
    
    if (role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const stats = queryOptimizer.getQueryPerformanceStats();
    res.json(stats);
  } catch (error) {
    logger.error('Failed to get query stats:', error);
    res.status(500).json({ error: 'Failed to retrieve query statistics' });
  }
});

/**
 * Get database statistics
 */
router.get('/database/stats', authenticateToken, async (req, res) => {
  try {
    const { role } = req.user!;
    
    if (role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const prisma = getDatabase();
    
    // Get table sizes
    const tableSizes = await prisma.$queryRaw`
      SELECT 
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
        pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
    `;

    // Get index usage
    const indexUsage = await prisma.$queryRaw`
      SELECT 
        schemaname,
        tablename,
        indexname,
        idx_scan as index_scans,
        idx_tup_read as tuples_read,
        idx_tup_fetch as tuples_fetched
      FROM pg_stat_user_indexes
      WHERE schemaname = 'public'
      ORDER BY idx_scan DESC
      LIMIT 20
    `;

    // Get slow queries
    const slowQueries = await prisma.$queryRaw`
      SELECT 
        query,
        calls,
        total_time,
        mean_time,
        max_time
      FROM pg_stat_statements
      WHERE query NOT LIKE '%pg_stat%'
      ORDER BY mean_time DESC
      LIMIT 10
    ` as any[];

    res.json({
      tableSizes,
      indexUsage,
      slowQueries: slowQueries.length > 0 ? slowQueries : [],
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Failed to get database stats:', error);
    res.status(500).json({ error: 'Failed to retrieve database statistics' });
  }
});

/**
 * Health check endpoint with detailed metrics
 */
router.get('/health', async (req, res) => {
  try {
    const prisma = getDatabase();
    
    // Check database connection
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbLatency = Date.now() - dbStart;

    // Check Redis connection
    const redisStart = Date.now();
    const redisConnected = await cacheService.exists('health_check_test');
    const redisLatency = Date.now() - redisStart;

    // Memory usage
    const memoryUsage = process.memoryUsage();
    
    res.json({
      status: 'healthy',
      timestamp: new Date(),
      uptime: process.uptime(),
      database: {
        connected: true,
        latency: `${dbLatency}ms`,
      },
      redis: {
        connected: redisConnected !== null,
        latency: `${redisLatency}ms`,
      },
      memory: {
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
        external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`,
      },
      nodejs: {
        version: process.version,
        platform: process.platform,
        arch: process.arch,
      },
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date(),
    });
  }
});

/**
 * Performance test endpoint (admin only)
 */
router.post('/test/performance', authenticateToken, async (req, res) => {
  try {
    const { role, userId } = req.user!;
    
    if (role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { testType } = req.body;
    const results: any = {};

    if (testType === 'cache' || testType === 'all') {
      // Test cache performance
      const cacheTestStart = Date.now();
      const testData = { test: true, timestamp: new Date(), data: 'x'.repeat(1000) };
      
      // Write test
      await cacheService.set('perf_test', testData);
      
      // Read test
      const iterations = 1000;
      const readStart = Date.now();
      for (let i = 0; i < iterations; i++) {
        await cacheService.get('perf_test');
      }
      const readTime = Date.now() - readStart;
      
      // Cleanup
      await cacheService.delete('perf_test');
      
      results.cache = {
        writeTime: `${Date.now() - cacheTestStart - readTime}ms`,
        readTime: `${readTime}ms`,
        readsPerSecond: Math.round((iterations / readTime) * 1000),
      };
    }

    if (testType === 'database' || testType === 'all') {
      // Test database performance
      const prisma = getDatabase();
      
      // Simple query test
      const simpleStart = Date.now();
      await prisma.user.findUnique({ where: { id: userId } });
      const simpleTime = Date.now() - simpleStart;
      
      // Complex query test
      const complexStart = Date.now();
      await queryOptimizer.getOptimizedUserTextbooks(userId, role);
      const complexTime = Date.now() - complexStart;
      
      results.database = {
        simpleQueryTime: `${simpleTime}ms`,
        complexQueryTime: `${complexTime}ms`,
      };
    }

    if (testType === 'optimization' || testType === 'all') {
      // Test query optimization impact
      const prisma = getDatabase();
      
      // Without optimization (direct query)
      const unoptimizedStart = Date.now();
      await prisma.textbook.findMany({
        where: { teacherId: userId },
        include: {
          classes: true,
          studyRecords: true,
          pages: true,
        },
      });
      const unoptimizedTime = Date.now() - unoptimizedStart;
      
      // With optimization (cached + optimized query)
      const optimizedStart = Date.now();
      await queryOptimizer.getOptimizedUserTextbooks(userId, role);
      const optimizedTime = Date.now() - optimizedStart;
      
      results.optimization = {
        unoptimizedTime: `${unoptimizedTime}ms`,
        optimizedTime: `${optimizedTime}ms`,
        improvement: `${Math.round(((unoptimizedTime - optimizedTime) / unoptimizedTime) * 100)}%`,
      };
    }

    res.json({
      testType,
      results,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Performance test failed:', error);
    res.status(500).json({ error: 'Performance test failed' });
  }
});

export default router;