import { getRedis } from '../config/redis';
import { logger } from '../utils/logger';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string;
  invalidatePattern?: string;
}

export class CacheService {
  private static instance: CacheService;
  private defaultTTL = 3600; // 1 hour
  
  // Cache key prefixes
  static readonly PREFIXES = {
    USER: 'user:',
    TEXTBOOK: 'textbook:',
    CLASS: 'class:',
    ASSIGNMENT: 'assignment:',
    SUBMISSION: 'submission:',
    ANALYTICS: 'analytics:',
    SEARCH: 'search:',
    MEDIA: 'media:',
    NOTIFICATION: 'notification:',
  } as const;

  // Cache TTL settings (in seconds)
  static readonly TTL = {
    SHORT: 300,      // 5 minutes
    MEDIUM: 1800,    // 30 minutes
    LONG: 3600,      // 1 hour
    EXTRA_LONG: 86400, // 24 hours
  } as const;

  private constructor() {}

  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const redis = getRedis();
      const value = await redis.get(key);
      
      if (!value) {
        return null;
      }

      return JSON.parse(value) as T;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set<T>(
    key: string,
    value: T,
    options: CacheOptions = {}
  ): Promise<boolean> {
    try {
      const redis = getRedis();
      const ttl = options.ttl || this.defaultTTL;
      const serializedValue = JSON.stringify(value);

      if (ttl > 0) {
        await redis.setex(key, ttl, serializedValue);
      } else {
        await redis.set(key, serializedValue);
      }

      return true;
    } catch (error) {
      logger.error('Cache set error:', error);
      return false;
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string | string[]): Promise<number> {
    try {
      const redis = getRedis();
      const keys = Array.isArray(key) ? key : [key];
      
      if (keys.length === 0) {
        return 0;
      }

      return await redis.del(...keys);
    } catch (error) {
      logger.error('Cache delete error:', error);
      return 0;
    }
  }

  /**
   * Delete all keys matching a pattern
   */
  async deletePattern(pattern: string): Promise<number> {
    try {
      const redis = getRedis();
      const keys = await redis.keys(pattern);
      
      if (keys.length === 0) {
        return 0;
      }

      return await redis.del(...keys);
    } catch (error) {
      logger.error('Cache delete pattern error:', error);
      return 0;
    }
  }

  /**
   * Invalidate cache by patterns
   */
  async invalidate(patterns: string[]): Promise<void> {
    try {
      for (const pattern of patterns) {
        await this.deletePattern(pattern);
      }
    } catch (error) {
      logger.error('Cache invalidate error:', error);
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const redis = getRedis();
      const result = await redis.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Cache exists error:', error);
      return false;
    }
  }

  /**
   * Get remaining TTL for a key
   */
  async ttl(key: string): Promise<number> {
    try {
      const redis = getRedis();
      return await redis.ttl(key);
    } catch (error) {
      logger.error('Cache ttl error:', error);
      return -1;
    }
  }

  /**
   * Implement cache-aside pattern
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    // Try to get from cache
    const cached = await this.get<T>(key);
    if (cached !== null) {
      logger.debug(`Cache hit: ${key}`);
      return cached;
    }

    // Cache miss - get from source
    logger.debug(`Cache miss: ${key}`);
    const value = await factory();
    
    // Store in cache
    await this.set(key, value, options);
    
    return value;
  }

  /**
   * Batch get multiple keys
   */
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      if (keys.length === 0) {
        return [];
      }

      const redis = getRedis();
      const values = await redis.mget(...keys);
      
      return values.map(value => {
        if (!value) return null;
        try {
          return JSON.parse(value) as T;
        } catch {
          return null;
        }
      });
    } catch (error) {
      logger.error('Cache mget error:', error);
      return keys.map(() => null);
    }
  }

  /**
   * Batch set multiple key-value pairs
   */
  async mset<T>(
    items: Array<{ key: string; value: T }>,
    ttl?: number
  ): Promise<boolean> {
    try {
      if (items.length === 0) {
        return true;
      }

      const redis = getRedis();
      const pipeline = redis.pipeline();

      for (const { key, value } of items) {
        const serializedValue = JSON.stringify(value);
        if (ttl && ttl > 0) {
          pipeline.setex(key, ttl, serializedValue);
        } else {
          pipeline.set(key, serializedValue);
        }
      }

      await pipeline.exec();
      return true;
    } catch (error) {
      logger.error('Cache mset error:', error);
      return false;
    }
  }

  /**
   * Increment counter
   */
  async increment(key: string, amount = 1): Promise<number> {
    try {
      const redis = getRedis();
      return await redis.incrby(key, amount);
    } catch (error) {
      logger.error('Cache increment error:', error);
      return 0;
    }
  }

  /**
   * Set value with expiration at specific timestamp
   */
  async setAt<T>(key: string, value: T, expireAt: Date): Promise<boolean> {
    try {
      const redis = getRedis();
      const serializedValue = JSON.stringify(value);
      await redis.set(key, serializedValue);
      await redis.expireat(key, Math.floor(expireAt.getTime() / 1000));
      return true;
    } catch (error) {
      logger.error('Cache setAt error:', error);
      return false;
    }
  }

  /**
   * Create cache key with prefix
   */
  createKey(prefix: string, ...parts: (string | number)[]): string {
    return `${prefix}${parts.join(':')}`;
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    keyCount: number;
    memoryUsage: string;
    hitRate?: number;
  }> {
    try {
      const redis = getRedis();
      const info = await redis.info('memory');
      const dbSize = await redis.dbsize();
      
      // Extract memory usage
      const memoryMatch = info.match(/used_memory_human:(.+)/);
      const memoryUsage = memoryMatch ? memoryMatch[1].trim() : 'Unknown';

      return {
        keyCount: dbSize,
        memoryUsage,
      };
    } catch (error) {
      logger.error('Cache stats error:', error);
      return {
        keyCount: 0,
        memoryUsage: 'Unknown',
      };
    }
  }

  /**
   * Clear all cache (use with caution!)
   */
  async clearAll(): Promise<void> {
    try {
      const redis = getRedis();
      await redis.flushdb();
      logger.info('Cache cleared');
    } catch (error) {
      logger.error('Cache clear error:', error);
    }
  }
}

// Export singleton instance
export const cacheService = CacheService.getInstance();