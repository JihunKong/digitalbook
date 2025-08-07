import { Request, Response, NextFunction } from 'express';
import { i18nService, SupportedLocale } from '../services/i18n.service';

export interface LocalizedRequest extends Request {
  locale: SupportedLocale;
  t: (key: string, params?: Record<string, string | number>) => string;
}

/**
 * Middleware to detect and set locale for each request
 */
export const i18nMiddleware = (req: LocalizedRequest, res: Response, next: NextFunction): void => {
  try {
    // Try to get locale from various sources in order of priority:
    // 1. Query parameter (?lang=ko)
    // 2. Request header (Accept-Language)
    // 3. User preference (if authenticated)
    // 4. Default locale

    let locale: SupportedLocale = i18nService.getDefaultLocale();

    // 1. Check query parameter
    const queryLang = req.query.lang as string;
    if (queryLang && i18nService.isLocaleSupported(queryLang)) {
      locale = queryLang;
    }
    // 2. Check Accept-Language header
    else if (req.headers['accept-language']) {
      const acceptLanguage = req.headers['accept-language'];
      const preferredLanguages = acceptLanguage
        .split(',')
        .map(lang => lang.split(';')[0].trim().toLowerCase());

      for (const lang of preferredLanguages) {
        if (lang.startsWith('ko')) {
          locale = 'ko';
          break;
        } else if (lang.startsWith('en')) {
          locale = 'en';
          break;
        }
      }
    }
    // 3. Check user preference (if authenticated)
    else if (req.user && (req.user as any).preferredLanguage) {
      const userLang = (req.user as any).preferredLanguage;
      if (i18nService.isLocaleSupported(userLang)) {
        locale = userLang;
      }
    }

    // Set locale on request object
    req.locale = locale;

    // Add translation function to request object
    req.t = (key: string, params?: Record<string, string | number>) => {
      return i18nService.t(key as any, locale, params);
    };

    // Set locale header in response
    res.setHeader('Content-Language', locale);

    next();
  } catch (error) {
    console.error('I18n middleware error:', error);
    // Set defaults and continue
    req.locale = i18nService.getDefaultLocale();
    req.t = (key: string, params?: Record<string, string | number>) => {
      return i18nService.t(key as any, req.locale, params);
    };
    next();
  }
};

/**
 * Middleware to add localized error messages
 */
export const localizedErrorHandler = (
  error: any,
  req: LocalizedRequest,
  res: Response,
  next: NextFunction
): void => {
  const locale = req.locale || i18nService.getDefaultLocale();

  // Map error types to localized messages
  let message: string;
  let statusCode = error.statusCode || 500;

  switch (error.name || error.type) {
    case 'ValidationError':
      message = i18nService.t('message.error.validation', locale);
      statusCode = 400;
      break;
    case 'UnauthorizedError':
    case 'AuthenticationError':
      message = i18nService.t('auth.unauthorized', locale);
      statusCode = 401;
      break;
    case 'ForbiddenError':
      message = i18nService.t('message.error.permission', locale);
      statusCode = 403;
      break;
    case 'NotFoundError':
      message = i18nService.t('message.error.notFound', locale);
      statusCode = 404;
      break;
    case 'NetworkError':
      message = i18nService.t('message.error.network', locale);
      statusCode = 503;
      break;
    default:
      message = error.message || i18nService.t('message.error.general', locale);
  }

  res.status(statusCode).json({
    success: false,
    message,
    code: error.code,
    ...(process.env.NODE_ENV === 'development' && { 
      stack: error.stack,
      originalMessage: error.message 
    })
  });
};

/**
 * Express response extension for localized responses
 */
export const addLocalizedResponse = (req: LocalizedRequest, res: Response, next: NextFunction): void => {
  // Add localized success response method
  res.localizedSuccess = (data?: any, messageKey?: string) => {
    const message = messageKey ? req.t(messageKey) : req.t('common.success');
    res.json({
      success: true,
      message,
      data
    });
  };

  // Add localized error response method
  res.localizedError = (messageKey: string, statusCode: number = 400, details?: any) => {
    const message = req.t(messageKey);
    res.status(statusCode).json({
      success: false,
      message,
      details
    });
  };

  next();
};

// Extend Express Response interface
declare global {
  namespace Express {
    interface Response {
      localizedSuccess(data?: any, messageKey?: string): void;
      localizedError(messageKey: string, statusCode?: number, details?: any): void;
    }
  }
}