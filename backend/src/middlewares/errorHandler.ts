import { Request, Response, NextFunction } from 'express';
// import { logger } from '../utils/logger';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

// Simple console logger for now
const logger = {
  error: (message: string, meta?: any) => console.error(message, meta),
  warn: (message: string, meta?: any) => console.warn(message, meta),
  info: (message: string, meta?: any) => console.info(message, meta),
};

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  code?: string;
  details?: any;

  constructor(message: string, statusCode: number, code?: string, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Specific error classes
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT_ERROR');
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_ERROR');
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, originalError?: any) {
    super(`External service error: ${service}`, 502, 'EXTERNAL_SERVICE_ERROR', originalError);
  }
}

interface ErrorResponse {
  error: {
    message: string;
    code?: string;
    statusCode: number;
    details?: any;
    timestamp: string;
    path: string;
    requestId?: string;
  };
}

export function errorHandler(
  err: Error | AppError | ZodError | Prisma.PrismaClientKnownRequestError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const timestamp = new Date().toISOString();
  const requestId = req.headers['x-request-id'] as string || `req_${Date.now()}`;

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map(error => ({
      field: error.path.join('.'),
      message: error.message,
      code: error.code,
    }));

    logger.error({
      type: 'ValidationError',
      message: 'Request validation failed',
      errors: formattedErrors,
      path: req.path,
      method: req.method,
      requestId,
      body: req.body,
      query: req.query,
    });

    const response: ErrorResponse = {
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        statusCode: 400,
        details: formattedErrors,
        timestamp,
        path: req.path,
        requestId,
      },
    };

    return res.status(400).json(response);
  }

  // Handle Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    let message = 'Database operation failed';
    let statusCode = 400;
    let code = err.code;

    switch (err.code) {
      case 'P2002':
        const target = err.meta?.target as string[];
        message = `Duplicate value for ${target?.join(', ') || 'field'}`;
        statusCode = 409;
        break;
      case 'P2025':
        message = 'Record not found';
        statusCode = 404;
        break;
      case 'P2003':
        message = 'Foreign key constraint failed';
        break;
      case 'P2014':
        message = 'Invalid relation';
        break;
      default:
        message = `Database error: ${err.code}`;
    }

    logger.error({
      type: 'PrismaError',
      message,
      code: err.code,
      meta: err.meta,
      path: req.path,
      method: req.method,
      requestId,
    });

    const response: ErrorResponse = {
      error: {
        message,
        code,
        statusCode,
        timestamp,
        path: req.path,
        requestId,
      },
    };

    return res.status(statusCode).json(response);
  }

  // Handle custom AppError
  if (err instanceof AppError) {
    logger.error({
      type: 'AppError',
      message: err.message,
      code: err.code,
      statusCode: err.statusCode,
      details: err.details,
      path: req.path,
      method: req.method,
      requestId,
      userId: (req as any).user?.id,
    });

    const response: ErrorResponse = {
      error: {
        message: err.message,
        code: err.code,
        statusCode: err.statusCode,
        details: err.isOperational ? err.details : undefined,
        timestamp,
        path: req.path,
        requestId,
      },
    };

    return res.status(err.statusCode).json(response);
  }

  // Handle unknown errors
  logger.error({
    type: 'UnhandledError',
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    requestId,
    body: req.body,
    query: req.query,
    headers: req.headers,
    userId: (req as any).user?.id,
  });

  // In production, don't expose internal error details
  const response: ErrorResponse = {
    error: {
      message: process.env.NODE_ENV === 'production' 
        ? 'An unexpected error occurred' 
        : err.message,
      code: 'INTERNAL_SERVER_ERROR',
      statusCode: 500,
      timestamp,
      path: req.path,
      requestId,
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    },
  };

  return res.status(500).json(response);
}

// Async error wrapper
export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Not found handler
export const notFoundHandler = (req: Request, res: Response) => {
  const response: ErrorResponse = {
    error: {
      message: 'Resource not found',
      code: 'NOT_FOUND',
      statusCode: 404,
      timestamp: new Date().toISOString(),
      path: req.path,
    },
  };
  res.status(404).json(response);
};