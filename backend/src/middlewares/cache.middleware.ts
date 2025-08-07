import { Request, Response, NextFunction } from 'express';
import { cacheService, CacheService } from '../services/cache.service';
import { logger } from '../utils/logger';

export interface CacheMiddlewareOptions {
  prefix: string;
  ttl?: number;
  keyGenerator?: (req: Request) => string;
  condition?: (req: Request) => boolean;
  excludePaths?: string[];
}

/**
 * Cache middleware for routes
 */
export function cacheMiddleware(options: CacheMiddlewareOptions) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Check if path is excluded
    if (options.excludePaths?.some(path => req.path.includes(path))) {
      return next();
    }

    // Check condition
    if (options.condition && !options.condition(req)) {
      return next();
    }

    // Generate cache key
    const cacheKey = options.keyGenerator
      ? options.keyGenerator(req)
      : generateCacheKey(options.prefix, req);

    try {
      // Try to get from cache
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        logger.debug(`Cache hit: ${cacheKey}`);
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('X-Cache-Key', cacheKey);
        
        // Get TTL for cache info
        const ttl = await cacheService.ttl(cacheKey);
        if (ttl > 0) {
          res.setHeader('X-Cache-TTL', ttl.toString());
        }
        
        return res.json(cached);
      }

      // Cache miss - continue to route handler
      logger.debug(`Cache miss: ${cacheKey}`);
      res.setHeader('X-Cache', 'MISS');
      res.setHeader('X-Cache-Key', cacheKey);

      // Override res.json to cache the response
      const originalJson = res.json.bind(res);
      res.json = function (data: any) {
        // Store in cache if response is successful
        if (res.statusCode >= 200 && res.statusCode < 300) {
          cacheService.set(cacheKey, data, { ttl: options.ttl }).catch(err => {
            logger.error('Failed to cache response:', err);
          });
        }
        return originalJson(data);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error:', error);
      next();
    }
  };
}

/**
 * Cache invalidation middleware
 */
export function cacheInvalidationMiddleware(patterns: string[] | ((req: Request) => string[])) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Store original methods
    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);

    // Override response methods to invalidate cache after successful operations
    const invalidateCache = async () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          const patternsToInvalidate = typeof patterns === 'function'
            ? patterns(req)
            : patterns;
          
          await cacheService.invalidate(patternsToInvalidate);
          logger.debug(`Cache invalidated: ${patternsToInvalidate.join(', ')}`);
        } catch (error) {
          logger.error('Cache invalidation error:', error);
        }
      }
    };

    res.json = function (data: any) {
      invalidateCache();
      return originalJson(data);
    };

    res.send = function (data: any) {
      invalidateCache();
      return originalSend(data);
    };

    next();
  };
}

/**
 * User-specific cache middleware
 */
export function userCacheMiddleware(options: Omit<CacheMiddlewareOptions, 'keyGenerator'>) {
  return cacheMiddleware({
    ...options,
    keyGenerator: (req: Request) => {
      const userId = (req as any).user?.userId || 'anonymous';
      return generateCacheKey(options.prefix, req, userId);
    },
  });
}

/**
 * Generate cache key from request
 */
function generateCacheKey(prefix: string, req: Request, suffix?: string): string {
  const parts = [
    prefix,
    req.path.replace(/\//g, ':'),
    req.query ? JSON.stringify(req.query) : '',
  ];

  if (suffix) {
    parts.push(suffix);
  }

  return parts.filter(Boolean).join(':');
}

/**
 * Cache warming middleware - preload frequently accessed data
 */
export async function warmCache(patterns: Array<{
  key: string;
  factory: () => Promise<any>;
  ttl?: number;
}>) {
  logger.info('Warming cache...');
  
  const promises = patterns.map(async ({ key, factory, ttl }) => {
    try {
      const data = await factory();
      await cacheService.set(key, data, { ttl });
      logger.debug(`Cache warmed: ${key}`);
    } catch (error) {
      logger.error(`Failed to warm cache for ${key}:`, error);
    }
  });

  await Promise.all(promises);
  logger.info('Cache warming completed');
}

/**
 * Clear cache endpoint middleware
 */
export function cacheClearMiddleware(allowedRoles: string[] = ['ADMIN']) {
  return async (req: Request, res: Response) => {
    const userRole = (req as any).user?.role;
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    try {
      const { pattern, all } = req.body;

      if (all === true) {
        await cacheService.clearAll();
        return res.json({ message: 'All cache cleared' });
      }

      if (pattern) {
        const deleted = await cacheService.deletePattern(pattern);
        return res.json({ message: `Deleted ${deleted} keys matching pattern: ${pattern}` });
      }

      return res.status(400).json({ error: 'Specify pattern or all=true' });
    } catch (error) {
      logger.error('Cache clear error:', error);
      return res.status(500).json({ error: 'Failed to clear cache' });
    }
  };
}

/**
 * Cache stats endpoint middleware
 */
export async function cacheStatsMiddleware(req: Request, res: Response) {
  try {
    const stats = await cacheService.getStats();
    res.json(stats);
  } catch (error) {
    logger.error('Cache stats error:', error);
    res.status(500).json({ error: 'Failed to get cache stats' });
  }
}