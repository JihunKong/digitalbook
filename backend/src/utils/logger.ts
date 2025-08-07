import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { Request } from 'express';
import path from 'path';
import fs from 'fs';

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom log format for better readability
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp', 'label'] })
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (metadata && Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata, null, 2)}`;
    }
    return msg;
  })
);

// JSON format for production
const jsonFormat = winston.format.combine(
  winston.format.json(),
  winston.format.printf((info) => {
    return JSON.stringify({
      timestamp: info.timestamp,
      level: info.level,
      message: info.message,
      ...info.metadata,
    });
  })
);

// Create transports
const transports: winston.transport[] = [];

// Console transport
if (process.env.NODE_ENV !== 'test') {
  transports.push(
    new winston.transports.Console({
      format: winston.format.combine(
        customFormat,
        process.env.NODE_ENV === 'production' ? jsonFormat : consoleFormat
      ),
    })
  );
}

// File transports for production
if (process.env.NODE_ENV === 'production') {
  // Error log file with rotation
  transports.push(
    new DailyRotateFile({
      filename: path.join(logsDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '14d',
      format: winston.format.combine(customFormat, jsonFormat),
    })
  );

  // Combined log file with rotation
  transports.push(
    new DailyRotateFile({
      filename: path.join(logsDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '50m',
      maxFiles: '7d',
      format: winston.format.combine(customFormat, jsonFormat),
    })
  );

  // Security log file
  transports.push(
    new DailyRotateFile({
      filename: path.join(logsDir, 'security-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'warn',
      maxSize: '20m',
      maxFiles: '30d',
      format: winston.format.combine(
        winston.format((info) => {
          // Only log security-related messages
          if (info.metadata?.type === 'security') {
            return info;
          }
          return false;
        })(),
        customFormat,
        jsonFormat
      ),
    })
  );

  // Performance log file
  transports.push(
    new DailyRotateFile({
      filename: path.join(logsDir, 'performance-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '30m',
      maxFiles: '7d',
      format: winston.format.combine(
        winston.format((info) => {
          // Only log performance-related messages
          if (info.metadata?.type === 'performance') {
            return info;
          }
          return false;
        })(),
        customFormat,
        jsonFormat
      ),
    })
  );
}

// Create logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  transports,
});

// Logger utility functions
export const logRequest = (req: Request, responseTime?: number, statusCode?: number) => {
  const logData = {
    type: 'http',
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent'),
    userId: (req as any).user?.id,
    responseTime,
    statusCode,
  };

  if (statusCode && statusCode >= 400) {
    logger.error('HTTP Error', logData);
  } else {
    logger.info('HTTP Request', logData);
  }
};

export const logSecurity = (event: string, details: any, req?: Request) => {
  logger.warn(event, {
    type: 'security',
    event,
    details,
    ip: req?.ip || req?.connection?.remoteAddress,
    userAgent: req?.get('user-agent'),
    userId: req && (req as any).user?.id,
    timestamp: new Date().toISOString(),
  });
};

export const logPerformance = (operation: string, duration: number, details?: any) => {
  logger.info(`Performance: ${operation}`, {
    type: 'performance',
    operation,
    duration,
    durationUnit: 'ms',
    details,
    timestamp: new Date().toISOString(),
  });
};

export const logDatabaseQuery = (query: string, duration: number, success: boolean) => {
  const level = success ? 'info' : 'error';
  logger[level]('Database Query', {
    type: 'database',
    query: query.substring(0, 200), // Truncate long queries
    duration,
    success,
    timestamp: new Date().toISOString(),
  });
};

export const logExternalService = (service: string, operation: string, duration: number, success: boolean, details?: any) => {
  const level = success ? 'info' : 'error';
  logger[level](`External Service: ${service}`, {
    type: 'external_service',
    service,
    operation,
    duration,
    success,
    details,
    timestamp: new Date().toISOString(),
  });
};

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, closing log transports...');
  logger.close();
});