import Redis from 'ioredis';
import { logger } from '../utils/logger';

let redis: Redis;

export async function initializeRedis() {
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
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