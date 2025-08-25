import Redis from 'ioredis';
import { logger } from '../utils/logger';

let redis: Redis;

// Export redis client for modules that need it at initialization
export { redis };

export async function initializeRedis() {
  if (!redis) {
    const redisUrl = process.env.REDIS_URL || 'redis://redis:6379';
    logger.info(`Connecting to Redis at: ${redisUrl}`);
    
    redis = new Redis(redisUrl, {
      retryStrategy: (times) => {
        logger.warn(`Redis retry attempt ${times}`);
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
      lazyConnect: true, // Connect only when needed
    });
    
    redis.on('connect', () => {
      logger.info('Redis connected successfully');
    });
    
    redis.on('error', (error) => {
      logger.error('Redis connection error:', error);
    });
  }
  
  return redis;
}

export function getRedis() {
  if (!redis) {
    throw new Error('Redis not initialized');
  }
  return redis;
}

export async function disconnectRedis() {
  if (redis) {
    await redis.quit();
  }
}