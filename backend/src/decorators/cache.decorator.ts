import { cacheService, CacheService } from '../services/cache.service';
import { logger } from '../utils/logger';

export interface CacheDecoratorOptions {
  prefix: string;
  ttl?: number;
  keyGenerator?: (...args: any[]) => string;
  condition?: (...args: any[]) => boolean;
  invalidatePatterns?: string[];
}

/**
 * Method decorator for caching
 */
export function Cacheable(options: CacheDecoratorOptions) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // Check if caching should be applied
      if (options.condition && !options.condition(...args)) {
        return originalMethod.apply(this, args);
      }

      // Generate cache key
      const cacheKey = options.keyGenerator
        ? options.keyGenerator(...args)
        : cacheService.createKey(options.prefix, propertyName, ...args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
          ));

      try {
        // Try to get from cache
        const cached = await cacheService.get(cacheKey);
        if (cached !== null) {
          logger.debug(`Cache hit: ${cacheKey}`);
          return cached;
        }

        // Execute original method
        const result = await originalMethod.apply(this, args);

        // Store in cache
        await cacheService.set(cacheKey, result, { ttl: options.ttl });

        return result;
      } catch (error) {
        logger.error(`Cache error in ${propertyName}:`, error);
        // Fallback to original method
        return originalMethod.apply(this, args);
      }
    };

    return descriptor;
  };
}

/**
 * Method decorator for cache invalidation
 */
export function CacheInvalidate(patterns: string[] | ((args: any[]) => string[])) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const result = await originalMethod.apply(this, args);

      try {
        const patternsToInvalidate = typeof patterns === 'function'
          ? patterns(args)
          : patterns;

        await cacheService.invalidate(patternsToInvalidate);
        logger.debug(`Cache invalidated: ${patternsToInvalidate.join(', ')}`);
      } catch (error) {
        logger.error(`Cache invalidation error in ${propertyName}:`, error);
      }

      return result;
    };

    return descriptor;
  };
}

/**
 * Class decorator for enabling caching on all methods
 */
export function CacheableClass(defaultOptions: Partial<CacheDecoratorOptions>) {
  return function (constructor: Function) {
    const prototype = constructor.prototype;
    const propertyNames = Object.getOwnPropertyNames(prototype);

    for (const propertyName of propertyNames) {
      const descriptor = Object.getOwnPropertyDescriptor(prototype, propertyName);
      
      if (descriptor && typeof descriptor.value === 'function' && propertyName !== 'constructor') {
        const originalMethod = descriptor.value;
        
        // Skip if already decorated
        if (originalMethod._isCacheDecorated) continue;

        descriptor.value = async function (...args: any[]) {
          const options = {
            ...defaultOptions,
            prefix: defaultOptions.prefix || constructor.name.toLowerCase(),
          };

          const cacheKey = cacheService.createKey(
            options.prefix!,
            propertyName,
            ...args.map(arg => 
              typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
            )
          );

          try {
            const cached = await cacheService.get(cacheKey);
            if (cached !== null) {
              return cached;
            }

            const result = await originalMethod.apply(this, args);
            await cacheService.set(cacheKey, result, { ttl: options.ttl });
            return result;
          } catch (error) {
            return originalMethod.apply(this, args);
          }
        };

        descriptor.value._isCacheDecorated = true;
        Object.defineProperty(prototype, propertyName, descriptor);
      }
    }
  };
}