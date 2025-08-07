import { z } from 'zod';
import dotenv from 'dotenv';
import { logger } from '../utils/logger';

// 환경변수 파일 로드
dotenv.config();

/**
 * 환경변수 스키마 정의
 */
const envSchema = z.object({
  // 기본 설정
  NODE_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
  PORT: z.string().transform(Number).default('4000'),
  FRONTEND_PORT: z.string().transform(Number).default('3000'),

  // 데이터베이스
  DATABASE_URL: z.string().url().or(z.string().startsWith('postgresql://')),
  
  // Redis
  REDIS_URL: z.string().url().or(z.string().startsWith('redis://')).default('redis://localhost:6379'),
  REDIS_PASSWORD: z.string().optional(),

  // JWT 인증 (필수)
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  ACCESS_TOKEN_EXPIRES: z.string().default('15m'),
  REFRESH_TOKEN_EXPIRES: z.string().default('7d'),

  // 세션 설정
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 characters').optional(),
  SESSION_MAX_AGE: z.string().transform(Number).default('86400000'),

  // 암호화
  ENCRYPTION_KEY: z.string().length(64, 'ENCRYPTION_KEY must be 32 bytes hex (64 characters)').optional(),
  ENCRYPTION_IV: z.string().length(32, 'ENCRYPTION_IV must be 16 bytes hex (32 characters)').optional(),

  // API URL
  NEXT_PUBLIC_API_URL: z.string().url().or(z.string().startsWith('http')).default('http://localhost:4000/api'),
  NEXT_PUBLIC_WS_URL: z.string().url().or(z.string().startsWith('ws')).default('ws://localhost:4000'),
  NEXT_PUBLIC_SITE_URL: z.string().url().or(z.string().startsWith('http')).default('http://localhost:3000'),

  // AI 서비스
  OPENAI_API_KEY: z.string().startsWith('sk-').optional(),
  OPENAI_ORGANIZATION: z.string().startsWith('org-').optional(),

  // 이메일
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform(Number).optional(),
  SMTP_USER: z.string().email().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),

  // AWS/Storage
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().default('ap-northeast-2'),
  AWS_S3_BUCKET: z.string().optional(),

  // 모니터링
  SENTRY_DSN: z.string().url().optional(),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug', 'trace']).default('info'),
  ENABLE_TELEMETRY: z.string().transform(val => val === 'true').default('false'),

  // 보안
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),
  BCRYPT_ROUNDS: z.string().transform((val) => Number(val)).pipe(z.number().min(10).max(15)).default('12'),
  VALIDATE_SESSION_IP: z.string().transform(val => val === 'true').default('false'),
  COOKIE_SECRET: z.string().min(32).optional(),

  // 파일 업로드
  MAX_FILE_SIZE: z.string().transform(Number).default('10485760'),
  ALLOWED_FILE_TYPES: z.string().default('image/jpeg,image/png,image/gif,application/pdf,video/mp4'),
  UPLOAD_DIR: z.string().default('./uploads'),

  // 게스트 액세스
  GUEST_ACCESS_DURATION: z.string().transform(Number).default('3600000'),
  GUEST_ACCESS_MAX_QUESTIONS: z.string().transform(Number).default('50'),

  // 개발 설정
  DEBUG: z.string().transform(val => val === 'true').default('false'),
  MOCK_AUTH: z.string().transform(val => val === 'true').default('false'),
  SEED_DATABASE: z.string().transform(val => val === 'true').default('false'),

  // API 키 (선택적)
  VALID_API_KEYS: z.string().optional(),
});

/**
 * 환경변수 타입
 */
export type EnvConfig = z.infer<typeof envSchema>;

/**
 * 환경별 필수 변수 체크
 */
const requiredByEnvironment: Record<string, string[]> = {
  production: [
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'SESSION_SECRET',
    'DATABASE_URL',
    'REDIS_URL',
    'COOKIE_SECRET',
    'ENCRYPTION_KEY',
    'ENCRYPTION_IV',
    'SENTRY_DSN',
    'OPENAI_API_KEY',
  ],
  staging: [
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'DATABASE_URL',
    'REDIS_URL',
  ],
  development: [
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'DATABASE_URL',
  ],
  test: [
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'DATABASE_URL',
  ],
};

/**
 * 환경변수 검증 및 로드
 */
class EnvironmentValidator {
  private config: EnvConfig | null = null;
  private errors: string[] = [];
  private warnings: string[] = [];

  /**
   * 환경변수 검증
   */
  validate(): EnvConfig {
    try {
      // 기본 스키마 검증
      const parsed = envSchema.parse(process.env);
      
      // 환경별 필수 변수 체크
      const nodeEnv = parsed.NODE_ENV;
      const required = requiredByEnvironment[nodeEnv as keyof typeof requiredByEnvironment] || [];
      
      for (const key of required) {
        if (!process.env[key]) {
          this.errors.push(`Missing required environment variable: ${key} (required for ${nodeEnv})`);
        }
      }

      // 보안 검증
      this.validateSecurity(parsed);
      
      // 경고 체크
      this.checkWarnings(parsed);

      // 오류가 있으면 예외 발생
      if (this.errors.length > 0) {
        throw new Error(`Environment validation failed:\n${this.errors.join('\n')}`);
      }

      // 경고 출력
      if (this.warnings.length > 0) {
        logger.warn('Environment warnings:');
        this.warnings.forEach(warning => logger.warn(`  - ${warning}`));
      }

      this.config = parsed;
      return parsed;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedErrors = error.errors.map(err => 
          `  - ${err.path.join('.')}: ${err.message}`
        ).join('\n');
        throw new Error(`Environment validation failed:\n${formattedErrors}`);
      }
      throw error;
    }
  }

  /**
   * 보안 관련 검증
   */
  private validateSecurity(config: EnvConfig) {
    // Production에서 기본값 사용 금지
    if (config.NODE_ENV === 'production') {
      if (config.JWT_SECRET && (config.JWT_SECRET.includes('CHANGE_THIS') || config.JWT_SECRET === 'secret')) {
        this.errors.push('JWT_SECRET must be changed from default value in production');
      }
      
      if (config.JWT_REFRESH_SECRET && config.JWT_REFRESH_SECRET.includes('CHANGE_THIS')) {
        this.errors.push('JWT_REFRESH_SECRET must be changed from default value in production');
      }

      // HTTPS 강제
      if (config.NEXT_PUBLIC_API_URL && !config.NEXT_PUBLIC_API_URL.startsWith('https://')) {
        this.warnings.push('API URL should use HTTPS in production');
      }

      // CORS 설정 확인
      if (config.CORS_ORIGIN === '*') {
        this.errors.push('CORS_ORIGIN cannot be "*" in production');
      }
    }

    // JWT Secret 강도 체크
    if (config.JWT_SECRET === config.JWT_REFRESH_SECRET) {
      this.errors.push('JWT_SECRET and JWT_REFRESH_SECRET must be different');
    }

    // 비밀번호 라운드 체크
    if (typeof config.BCRYPT_ROUNDS === 'number' && config.BCRYPT_ROUNDS < 10) {
      this.warnings.push('BCRYPT_ROUNDS should be at least 10 for security');
    }
  }

  /**
   * 경고 사항 체크
   */
  private checkWarnings(config: EnvConfig) {
    // Development 환경 경고
    if (config.NODE_ENV === 'development') {
      if (config.DEBUG) {
        this.warnings.push('DEBUG mode is enabled');
      }
      if (config.MOCK_AUTH) {
        this.warnings.push('MOCK_AUTH is enabled - authentication is bypassed');
      }
    }

    // 선택적 서비스 체크
    if (!config.OPENAI_API_KEY) {
      this.warnings.push('OPENAI_API_KEY not set - AI features will be disabled');
    }

    if (!config.SMTP_HOST) {
      this.warnings.push('Email service not configured - email features will be disabled');
    }

    if (!config.AWS_ACCESS_KEY_ID) {
      this.warnings.push('AWS not configured - using local file storage');
    }

    if (!config.SENTRY_DSN && config.NODE_ENV === 'production') {
      this.warnings.push('Sentry not configured - error tracking disabled');
    }

    // 파일 크기 체크
    if (typeof config.MAX_FILE_SIZE === 'number' && config.MAX_FILE_SIZE > 52428800) { // 50MB
      this.warnings.push('MAX_FILE_SIZE is very large (>50MB)');
    }
  }

  /**
   * 환경변수 정보 출력
   */
  printInfo() {
    if (!this.config) {
      throw new Error('Environment not validated yet');
    }

    logger.info('=================================');
    logger.info('Environment Configuration');
    logger.info('=================================');
    logger.info(`Environment: ${this.config.NODE_ENV}`);
    logger.info(`API Port: ${this.config.PORT}`);
    logger.info(`Frontend Port: ${this.config.FRONTEND_PORT}`);
    logger.info(`Database: ${this.config.DATABASE_URL ? (this.config.DATABASE_URL.split('@')[1] || 'configured') : 'not configured'}`);
    logger.info(`Redis: ${this.config.REDIS_URL ? (this.config.REDIS_URL.split('@')[1] || 'configured') : 'not configured'}`);
    logger.info(`CORS Origin: ${this.config.CORS_ORIGIN}`);
    logger.info(`Log Level: ${this.config.LOG_LEVEL}`);
    logger.info('=================================');
    
    // 기능 상태
    logger.info('Features:');
    logger.info(`  - AI Service: ${this.config.OPENAI_API_KEY ? 'Enabled' : 'Disabled'}`);
    logger.info(`  - Email Service: ${this.config.SMTP_HOST ? 'Enabled' : 'Disabled'}`);
    logger.info(`  - AWS Storage: ${this.config.AWS_ACCESS_KEY_ID ? 'Enabled' : 'Local'}`);
    logger.info(`  - Error Tracking: ${this.config.SENTRY_DSN ? 'Enabled' : 'Disabled'}`);
    logger.info(`  - Telemetry: ${this.config.ENABLE_TELEMETRY ? 'Enabled' : 'Disabled'}`);
    logger.info('=================================');
  }

  /**
   * 환경변수 설정 가져오기
   */
  getConfig(): EnvConfig {
    if (!this.config) {
      throw new Error('Environment not validated yet. Call validate() first.');
    }
    return this.config;
  }

  /**
   * 특정 환경인지 확인
   */
  isProduction(): boolean {
    return this.config?.NODE_ENV === 'production';
  }

  isDevelopment(): boolean {
    return this.config?.NODE_ENV === 'development';
  }

  isTest(): boolean {
    return this.config?.NODE_ENV === 'test';
  }

  isStaging(): boolean {
    return this.config?.NODE_ENV === 'staging';
  }
}

// 싱글톤 인스턴스
export const envValidator = new EnvironmentValidator();

// 환경변수 검증 및 export
export let config: EnvConfig;

try {
  config = envValidator.validate();
  
  // 개발 환경에서만 정보 출력
  if (config.NODE_ENV === 'development') {
    envValidator.printInfo();
  }
} catch (error) {
  logger.error('Failed to validate environment variables:');
  logger.error(error);
  process.exit(1);
}

// 유틸리티 함수들
export const isDevelopment = () => envValidator.isDevelopment();
export const isProduction = () => envValidator.isProduction();
export const isTest = () => envValidator.isTest();
export const isStaging = () => envValidator.isStaging();