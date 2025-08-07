import { Request, Response, NextFunction } from 'express';
import { i18nService, SupportedLocale } from '../services/i18n.service';
import { LocalizedRequest } from '../middlewares/i18n.middleware';

export class I18nController {
  /**
   * Get all translations for current locale
   */
  async getTranslations(req: LocalizedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const locale = req.locale || req.query.locale as SupportedLocale;
      
      if (locale && !i18nService.isLocaleSupported(locale)) {
        res.status(400).json({
          success: false,
          message: 'Unsupported locale'
        });
        return;
      }

      const translations = i18nService.getTranslations(locale);
      
      res.json({
        success: true,
        data: {
          locale,
          translations,
          supportedLocales: i18nService.getSupportedLocales(),
          defaultLocale: i18nService.getDefaultLocale()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get specific translation by key
   */
  async getTranslation(req: LocalizedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { key } = req.params;
      const locale = req.locale;
      const params = req.query.params ? JSON.parse(req.query.params as string) : undefined;

      const translation = i18nService.t(key as any, locale, params);
      
      res.json({
        success: true,
        data: {
          key,
          translation,
          locale
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get supported locales
   */
  async getSupportedLocales(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const supportedLocales = i18nService.getSupportedLocales();
      const defaultLocale = i18nService.getDefaultLocale();

      res.json({
        success: true,
        data: {
          supportedLocales,
          defaultLocale,
          localeInfo: {
            ko: {
              name: '한국어',
              nativeName: '한국어',
              code: 'ko',
              flag: '🇰🇷'
            },
            en: {
              name: 'English',
              nativeName: 'English',
              code: 'en',
              flag: '🇺🇸'
            }
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Format number according to locale
   */
  async formatNumber(req: LocalizedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { number } = req.body;
      const locale = req.locale;

      if (typeof number !== 'number') {
        res.status(400).json({
          success: false,
          message: 'Invalid number provided'
        });
        return;
      }

      const formatted = i18nService.formatNumber(number, locale);
      
      res.json({
        success: true,
        data: {
          original: number,
          formatted,
          locale
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Format date according to locale
   */
  async formatDate(req: LocalizedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { date, options } = req.body;
      const locale = req.locale;

      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        res.status(400).json({
          success: false,
          message: 'Invalid date provided'
        });
        return;
      }

      const formatted = i18nService.formatDate(dateObj, locale, options);
      const relative = i18nService.getRelativeTime(dateObj, locale);
      
      res.json({
        success: true,
        data: {
          original: date,
          formatted,
          relative,
          locale
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Format currency according to locale
   */
  async formatCurrency(req: LocalizedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { amount, currency = 'KRW' } = req.body;
      const locale = req.locale;

      if (typeof amount !== 'number') {
        res.status(400).json({
          success: false,
          message: 'Invalid amount provided'
        });
        return;
      }

      const formatted = i18nService.formatCurrency(amount, currency, locale);
      
      res.json({
        success: true,
        data: {
          original: amount,
          currency,
          formatted,
          locale
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get localized validation messages
   */
  async getValidationMessages(req: LocalizedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const locale = req.locale;
      
      const validationMessages = {
        required: i18nService.t('validation.required', locale),
        email: i18nService.t('validation.email', locale),
        passwordMinLength: i18nService.t('validation.password.minLength', locale, { min: 8 }),
        passwordMatch: i18nService.t('validation.password.match', locale),
        fileSize: i18nService.t('validation.file.size', locale, { max: '10MB' }),
        fileType: i18nService.t('validation.file.type', locale),
        stringMinLength: i18nService.t('validation.string.minLength', locale, { min: 1 }),
        stringMaxLength: i18nService.t('validation.string.maxLength', locale, { max: 255 }),
        numberMin: i18nService.t('validation.number.min', locale, { min: 0 }),
        numberMax: i18nService.t('validation.number.max', locale, { max: 100 })
      };

      res.json({
        success: true,
        data: {
          locale,
          validationMessages
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user's preferred language
   */
  async updateUserLanguage(req: LocalizedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { language } = req.body;
      const user = req.user as any;

      if (!language || !i18nService.isLocaleSupported(language)) {
        res.localizedError('validation.required', 400);
        return;
      }

      // Update user's preferred language in database
      // This would typically update the user profile
      // For now, we'll just return success
      
      res.json({
        success: true,
        message: req.t('message.updated'),
        data: {
          userId: user.id,
          preferredLanguage: language,
          previousLanguage: req.locale
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get localized content for mobile app
   */
  async getMobileTranslations(req: LocalizedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const locale = req.locale;
      const { category } = req.query;

      let translations = i18nService.getTranslations(locale);

      // Filter by category if specified
      if (category) {
        const prefix = `${category}.`;
        translations = Object.entries(translations)
          .filter(([key]) => key.startsWith(prefix))
          .reduce((acc, [key, value]) => {
            acc[key] = value;
            return acc;
          }, {} as any);
      }

      res.json({
        success: true,
        data: {
          locale,
          category: category || 'all',
          translations,
          metadata: {
            version: '1.0.0',
            lastUpdated: new Date().toISOString(),
            totalKeys: Object.keys(translations).length
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

export const i18nController = new I18nController();