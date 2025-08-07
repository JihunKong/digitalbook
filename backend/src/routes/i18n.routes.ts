import { Router } from 'express';
import { i18nController } from '../controllers/i18n.controller';
import { i18nMiddleware, addLocalizedResponse } from '../middlewares/i18n.middleware';
import { authenticateToken } from '../middlewares/auth';

const router = Router();

// Apply i18n middleware to all routes
router.use(i18nMiddleware);
router.use(addLocalizedResponse);

/**
 * @route GET /api/i18n/translations
 * @desc Get all translations for current locale
 * @access Public
 */
router.get('/translations', i18nController.getTranslations);

/**
 * @route GET /api/i18n/translations/:key
 * @desc Get specific translation by key
 * @access Public
 */
router.get('/translations/:key', i18nController.getTranslation);

/**
 * @route GET /api/i18n/locales
 * @desc Get supported locales
 * @access Public
 */
router.get('/locales', i18nController.getSupportedLocales);

/**
 * @route POST /api/i18n/format/number
 * @desc Format number according to locale
 * @access Public
 */
router.post('/format/number', i18nController.formatNumber);

/**
 * @route POST /api/i18n/format/date
 * @desc Format date according to locale
 * @access Public
 */
router.post('/format/date', i18nController.formatDate);

/**
 * @route POST /api/i18n/format/currency
 * @desc Format currency according to locale
 * @access Public
 */
router.post('/format/currency', i18nController.formatCurrency);

/**
 * @route GET /api/i18n/validation
 * @desc Get localized validation messages
 * @access Public
 */
router.get('/validation', i18nController.getValidationMessages);

/**
 * @route PUT /api/i18n/user/language
 * @desc Update user's preferred language
 * @access Private
 */
router.put('/user/language', authenticateToken, i18nController.updateUserLanguage);

/**
 * @route GET /api/i18n/mobile
 * @desc Get localized content for mobile app
 * @access Public
 */
router.get('/mobile', i18nController.getMobileTranslations);

export default router;