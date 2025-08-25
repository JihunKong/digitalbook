import { logger } from '../utils/logger';

interface RequiredEnvVars {
  production: string[];
  development: string[];
  common: string[];
}

const requiredEnvVars: RequiredEnvVars = {
  production: [
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'DATABASE_URL',
    'REDIS_URL',
    'COOKIE_DOMAIN',
    'SESSION_SECRET'
  ],
  development: [
    'JWT_SECRET',
    'DATABASE_URL'
  ],
  common: []
};

/**
 * Validate environment variables with production-safe fallbacks
 */
export const validateEnvironment = (): void => {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const isProduction = nodeEnv === 'production';
  
  logger.info(`Environment validation starting for ${nodeEnv} mode`);
  
  // Critical variables that MUST be present (will cause startup failure)
  const critical = isProduction 
    ? ['JWT_SECRET', 'DATABASE_URL'] 
    : ['JWT_SECRET', 'DATABASE_URL'];
  
  // Important variables that should be present (will log warnings)
  const important = isProduction
    ? ['JWT_REFRESH_SECRET', 'REDIS_URL', 'CORS_ORIGIN']
    : ['JWT_REFRESH_SECRET'];
  
  const missing: string[] = [];
  const missingImportant: string[] = [];
  const weak: string[] = [];
  
  // Check for missing critical variables
  for (const varName of critical) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }
  
  // Check for missing important variables
  for (const varName of important) {
    if (!process.env[varName]) {
      missingImportant.push(varName);
    }
  }
  
  // Check for weak values in production
  if (isProduction) {
    // JWT Secret strength check
    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
      weak.push('JWT_SECRET must be at least 32 characters in production');
    }
    
    if (process.env.JWT_REFRESH_SECRET && process.env.JWT_REFRESH_SECRET.length < 32) {
      weak.push('JWT_REFRESH_SECRET must be at least 32 characters in production');
    }
    
    // HTTPS enforcement
    if (process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.startsWith('https://')) {
      weak.push('API URL must use HTTPS in production');
    }
    
    // Session secret strength
    if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length < 32) {
      weak.push('SESSION_SECRET must be at least 32 characters in production');
    }
  }
  
  // Check for exposed secrets (should never have these patterns)
  const exposedPatterns = [
    { pattern: /sk-proj-/i, name: 'OpenAI API Key' },
    { pattern: /up_[A-Za-z0-9]+/i, name: 'Upstage API Key' },
    { pattern: /AIza[A-Za-z0-9]+/i, name: 'Google API Key' },
    { pattern: /ghp_[A-Za-z0-9]+/i, name: 'GitHub Personal Access Token' }
  ];
  
  for (const [key, value] of Object.entries(process.env)) {
    if (typeof value !== 'string') continue;
    
    for (const { pattern, name } of exposedPatterns) {
      if (pattern.test(value)) {
        logger.error(`CRITICAL: Exposed ${name} detected in environment variable ${key}`);
        logger.error('Please rotate this key immediately and remove from source control');
      }
    }
  }
  
  // Report findings with graceful handling
  if (missing.length > 0) {
    logger.error('Missing CRITICAL environment variables:', missing);
    throw new Error(`Missing critical environment variables: ${missing.join(', ')}`);
  }
  
  if (missingImportant.length > 0) {
    logger.warn('Missing IMPORTANT environment variables (using defaults):', missingImportant);
    missingImportant.forEach(varName => {
      switch (varName) {
        case 'REDIS_URL':
          process.env.REDIS_URL = 'redis://redis:6379';
          logger.info('Using default REDIS_URL: redis://redis:6379');
          break;
        case 'CORS_ORIGIN':
          process.env.CORS_ORIGIN = isProduction ? 'https://xn--220bu63c.com' : 'http://localhost:3000';
          logger.info(`Using default CORS_ORIGIN: ${process.env.CORS_ORIGIN}`);
          break;
      }
    });
  }
  
  if (weak.length > 0) {
    if (isProduction) {
      logger.error('SECURITY WARNING - Weak configuration detected:', weak);
      logger.error('Please update these configurations for better security');
    } else {
      logger.warn('Weak configuration detected (development):', weak);
    }
  }
  
  // Log successful validation
  logger.info(`Environment validation completed for ${nodeEnv} mode`);
  
  // Additional security checks
  if (!process.env.NODE_ENV) {
    logger.warn('NODE_ENV not set, defaulting to development');
  }
  
  if (process.env.NODE_ENV === 'development' && process.env.JWT_SECRET === 'dev-secret') {
    logger.warn('Using development JWT secret - DO NOT use in production');
  }
};

/**
 * Get secure default values for non-critical variables
 */
export const getSecureDefaults = () => {
  return {
    CORS_MAX_AGE: process.env.CORS_MAX_AGE || '86400',
    RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS || '900000', // 15 minutes
    RATE_LIMIT_MAX_REQUESTS: process.env.RATE_LIMIT_MAX_REQUESTS || '100',
    SESSION_TIMEOUT_MS: process.env.SESSION_TIMEOUT_MS || '3600000', // 1 hour
    MAX_LOGIN_ATTEMPTS: process.env.MAX_LOGIN_ATTEMPTS || '5',
    BCRYPT_ROUNDS: process.env.BCRYPT_ROUNDS || '12',
    PASSWORD_MIN_LENGTH: process.env.PASSWORD_MIN_LENGTH || '8',
    FILE_UPLOAD_MAX_SIZE: process.env.FILE_UPLOAD_MAX_SIZE || '10485760', // 10MB
    ALLOWED_FILE_TYPES: process.env.ALLOWED_FILE_TYPES || 'jpg,jpeg,png,gif,pdf,doc,docx,txt',
    LOG_LEVEL: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'warn' : 'debug')
  };
};

/**
 * Initialize environment with validation
 */
export const initializeEnvironment = (): void => {
  try {
    validateEnvironment();
    const defaults = getSecureDefaults();
    
    // Apply secure defaults
    for (const [key, value] of Object.entries(defaults)) {
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
    
    logger.info('Environment initialized with secure defaults');
  } catch (error) {
    logger.error('Environment initialization failed:', error);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};
// Aliases for backward compatibility
export const config = validateEnvironment;
export const envValidator = validateEnvironment;
