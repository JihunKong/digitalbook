import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redis } from '../config/redis';
import { Request, Response } from 'express';
import { logSecurity } from '../utils/logger';
import { RateLimitError } from '../middlewares/errorHandler';

// Rate limiter configuration type
interface RateLimiterConfig {
  windowMs: number;
  max: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
  keyGenerator?: (req: Request) => string;
}

// Create rate limiter with Redis store
function createRateLimiter(name: string, config: RateLimiterConfig): RateLimitRequestHandler {
  return rateLimit({
    windowMs: config.windowMs,
    max: config.max,
    message: config.message || 'Too many requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: config.skipSuccessfulRequests || false,
    keyGenerator: config.keyGenerator || ((req: Request) => {
      // Use user ID if authenticated, otherwise use IP
      const userId = (req as any).user?.id;
      return userId ? `user:${userId}` : `ip:${req.ip}`;
    }),
    store: new RedisStore({
      client: redis,
      prefix: `rate_limit:${name}:`,
    }),
    handler: (req: Request, res: Response) => {
      logSecurity('Rate limit exceeded', {
        limiter: name,
        ip: req.ip,
        userId: (req as any).user?.id,
        path: req.path,
        method: req.method,
      }, req);
      
      throw new RateLimitError(config.message || 'Too many requests');
    },
  });
}

// General API rate limiter
export const generalRateLimiter = createRateLimiter('general', {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_GENERAL || '100'),
});

// Strict rate limiter for sensitive endpoints
export const strictRateLimiter = createRateLimiter('strict', {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_STRICT || '20'),
});

// Auth endpoints rate limiter
export const authRateLimiter = createRateLimiter('auth', {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_AUTH || '5'),
  message: 'Too many authentication attempts, please try again later.',
  skipSuccessfulRequests: true,
  keyGenerator: (req: Request) => {
    // Rate limit by IP for auth endpoints
    return `ip:${req.ip}`;
  },
});

// Password reset rate limiter
export const passwordResetRateLimiter = createRateLimiter('password_reset', {
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: 'Too many password reset attempts, please try again later.',
  keyGenerator: (req: Request) => {
    // Rate limit by email or IP
    const email = req.body.email;
    return email ? `email:${email}` : `ip:${req.ip}`;
  },
});

// File upload rate limiter
export const uploadRateLimiter = createRateLimiter('upload', {
  windowMs: 60 * 60 * 1000, // 1 hour
  max: parseInt(process.env.RATE_LIMIT_UPLOAD || '50'),
  message: 'Too many file uploads, please try again later.',
});

// AI service rate limiter (more restrictive)
export const aiServiceRateLimiter = createRateLimiter('ai_service', {
  windowMs: 60 * 60 * 1000, // 1 hour
  max: parseInt(process.env.RATE_LIMIT_AI || '20'),
  message: 'AI service rate limit exceeded, please try again later.',
});

// Email sending rate limiter
export const emailRateLimiter = createRateLimiter('email', {
  windowMs: 60 * 60 * 1000, // 1 hour
  max: parseInt(process.env.RATE_LIMIT_EMAIL || '10'),
  message: 'Too many email requests, please try again later.',
});

// Export/download rate limiter
export const exportRateLimiter = createRateLimiter('export', {
  windowMs: 60 * 60 * 1000, // 1 hour
  max: parseInt(process.env.RATE_LIMIT_EXPORT || '10'),
  message: 'Too many export requests, please try again later.',
});

// Dynamic rate limiter based on user tier
export function createDynamicRateLimiter(name: string, getTierLimits: (req: Request) => RateLimiterConfig) {
  return (req: Request, res: Response, next: Function) => {
    const config = getTierLimits(req);
    const limiter = createRateLimiter(`${name}_dynamic`, config);
    limiter(req, res, next);
  };
}

// Example dynamic rate limiter for different user tiers
export const tierBasedRateLimiter = createDynamicRateLimiter('tier', (req: Request) => {
  const user = (req as any).user;
  const tier = user?.tier || 'free';
  
  const limits = {
    free: { windowMs: 15 * 60 * 1000, max: 50 },
    basic: { windowMs: 15 * 60 * 1000, max: 200 },
    premium: { windowMs: 15 * 60 * 1000, max: 1000 },
    admin: { windowMs: 15 * 60 * 1000, max: 10000 },
  };
  
  return limits[tier as keyof typeof limits] || limits.free;
});

// Rate limiter for specific paths
export const pathSpecificRateLimiters = {
  '/api/auth/login': authRateLimiter,
  '/api/auth/signup': authRateLimiter,
  '/api/auth/reset-password': passwordResetRateLimiter,
  '/api/upload': uploadRateLimiter,
  '/api/ai': aiServiceRateLimiter,
  '/api/export': exportRateLimiter,
  '/api/email': emailRateLimiter,
};

// Middleware to apply path-specific rate limiters
export function applyPathRateLimiter(req: Request, res: Response, next: Function) {
  const limiter = pathSpecificRateLimiters[req.path as keyof typeof pathSpecificRateLimiters];
  if (limiter) {
    return limiter(req, res, next);
  }
  // Apply general rate limiter if no specific one is found
  return generalRateLimiter(req, res, next);
}

// For backward compatibility
export const rateLimiter = generalRateLimiter;