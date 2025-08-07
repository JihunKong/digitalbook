import * as fs from 'fs/promises';
import * as path from 'path';

export type SupportedLocale = 'ko' | 'en';

export interface TranslationKeys {
  // Common
  'common.loading': string;
  'common.error': string;
  'common.success': string;
  'common.cancel': string;
  'common.confirm': string;
  'common.save': string;
  'common.delete': string;
  'common.edit': string;
  'common.view': string;
  'common.search': string;
  'common.filter': string;
  'common.reset': string;
  'common.submit': string;
  'common.back': string;
  'common.next': string;
  'common.previous': string;
  'common.close': string;
  'common.open': string;
  'common.yes': string;
  'common.no': string;
  
  // Authentication
  'auth.login': string;
  'auth.logout': string;
  'auth.register': string;
  'auth.email': string;
  'auth.password': string;
  'auth.confirmPassword': string;
  'auth.forgotPassword': string;
  'auth.resetPassword': string;
  'auth.invalidCredentials': string;
  'auth.accountCreated': string;
  'auth.passwordReset': string;
  'auth.sessionExpired': string;
  'auth.unauthorized': string;
  
  // Navigation
  'nav.dashboard': string;
  'nav.textbooks': string;
  'nav.classes': string;
  'nav.assignments': string;
  'nav.analytics': string;
  'nav.settings': string;
  'nav.profile': string;
  'nav.help': string;
  
  // Dashboard
  'dashboard.welcome': string;
  'dashboard.overview': string;
  'dashboard.recentActivity': string;
  'dashboard.quickStats': string;
  'dashboard.totalStudents': string;
  'dashboard.totalClasses': string;
  'dashboard.totalTextbooks': string;
  'dashboard.activeAssignments': string;
  
  // Textbooks
  'textbook.title': string;
  'textbook.create': string;
  'textbook.edit': string;
  'textbook.delete': string;
  'textbook.publish': string;
  'textbook.unpublish': string;
  'textbook.chapter': string;
  'textbook.page': string;
  'textbook.content': string;
  'textbook.description': string;
  'textbook.subject': string;
  'textbook.grade': string;
  'textbook.language': string;
  'textbook.difficulty': string;
  'textbook.tags': string;
  'textbook.coverImage': string;
  'textbook.published': string;
  'textbook.draft': string;
  'textbook.createdAt': string;
  'textbook.updatedAt': string;
  
  // Classes
  'class.name': string;
  'class.create': string;
  'class.join': string;
  'class.leave': string;
  'class.invite': string;
  'class.members': string;
  'class.teacher': string;
  'class.student': string;
  'class.code': string;
  'class.schedule': string;
  'class.room': string;
  'class.startDate': string;
  'class.endDate': string;
  
  // Assignments
  'assignment.title': string;
  'assignment.create': string;
  'assignment.edit': string;
  'assignment.submit': string;
  'assignment.grade': string;
  'assignment.feedback': string;
  'assignment.dueDate': string;
  'assignment.instructions': string;
  'assignment.attachments': string;
  'assignment.submissions': string;
  'assignment.status': string;
  'assignment.draft': string;
  'assignment.published': string;
  'assignment.submitted': string;
  'assignment.graded': string;
  'assignment.overdue': string;
  
  // Analytics
  'analytics.overview': string;
  'analytics.engagement': string;
  'analytics.performance': string;
  'analytics.progress': string;
  'analytics.insights': string;
  'analytics.reports': string;
  'analytics.export': string;
  'analytics.timeSpent': string;
  'analytics.completionRate': string;
  'analytics.averageScore': string;
  'analytics.activeUsers': string;
  'analytics.dailyActivity': string;
  'analytics.weeklyTrend': string;
  'analytics.monthlyTrend': string;
  
  // Messages
  'message.saved': string;
  'message.deleted': string;
  'message.updated': string;
  'message.created': string;
  'message.published': string;
  'message.submitted': string;
  'message.error.general': string;
  'message.error.network': string;
  'message.error.validation': string;
  'message.error.permission': string;
  'message.error.notFound': string;
  'message.error.serverError': string;
  
  // Validation
  'validation.required': string;
  'validation.email': string;
  'validation.password.minLength': string;
  'validation.password.match': string;
  'validation.file.size': string;
  'validation.file.type': string;
  'validation.string.minLength': string;
  'validation.string.maxLength': string;
  'validation.number.min': string;
  'validation.number.max': string;
  
  // Time
  'time.now': string;
  'time.today': string;
  'time.yesterday': string;
  'time.tomorrow': string;
  'time.thisWeek': string;
  'time.lastWeek': string;
  'time.thisMonth': string;
  'time.lastMonth': string;
  'time.minute': string;
  'time.minutes': string;
  'time.hour': string;
  'time.hours': string;
  'time.day': string;
  'time.days': string;
  'time.week': string;
  'time.weeks': string;
  'time.month': string;
  'time.months': string;
  'time.year': string;
  'time.years': string;
  'time.ago': string;
}

export class I18nService {
  private translations: Map<SupportedLocale, Partial<TranslationKeys>> = new Map();
  private defaultLocale: SupportedLocale = 'ko';
  private fallbackLocale: SupportedLocale = 'en';

  constructor() {
    this.loadTranslations();
  }

  private async loadTranslations(): Promise<void> {
    try {
      // Load Korean translations
      const koTranslations = await this.loadTranslationFile('ko');
      this.translations.set('ko', koTranslations);

      // Load English translations
      const enTranslations = await this.loadTranslationFile('en');
      this.translations.set('en', enTranslations);

      console.log('✅ Translations loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load translations:', error);
      // Set default translations to prevent runtime errors
      this.setDefaultTranslations();
    }
  }

  private async loadTranslationFile(locale: SupportedLocale): Promise<Partial<TranslationKeys>> {
    const translationsPath = path.join(__dirname, '..', '..', 'locales', `${locale}.json`);
    
    try {
      const data = await fs.readFile(translationsPath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.warn(`Translation file not found for locale: ${locale}`);
      return this.getDefaultTranslations(locale);
    }
  }

  private setDefaultTranslations(): void {
    this.translations.set('ko', this.getDefaultTranslations('ko'));
    this.translations.set('en', this.getDefaultTranslations('en'));
  }

  private getDefaultTranslations(locale: SupportedLocale): Partial<TranslationKeys> {
    if (locale === 'ko') {
      return {
        'common.loading': '로딩 중...',
        'common.error': '오류',
        'common.success': '성공',
        'common.cancel': '취소',
        'common.confirm': '확인',
        'common.save': '저장',
        'common.delete': '삭제',
        'common.edit': '편집',
        'common.view': '보기',
        'common.search': '검색',
        'common.filter': '필터',
        'common.reset': '재설정',
        'common.submit': '제출',
        'common.back': '뒤로',
        'common.next': '다음',
        'common.previous': '이전',
        'common.close': '닫기',
        'common.open': '열기',
        'common.yes': '예',
        'common.no': '아니요',
        
        'auth.login': '로그인',
        'auth.logout': '로그아웃',
        'auth.register': '회원가입',
        'auth.email': '이메일',
        'auth.password': '비밀번호',
        'auth.confirmPassword': '비밀번호 확인',
        'auth.forgotPassword': '비밀번호 찾기',
        'auth.resetPassword': '비밀번호 재설정',
        'auth.invalidCredentials': '잘못된 로그인 정보입니다',
        'auth.accountCreated': '계정이 생성되었습니다',
        'auth.passwordReset': '비밀번호가 재설정되었습니다',
        'auth.sessionExpired': '세션이 만료되었습니다',
        'auth.unauthorized': '권한이 없습니다',
        
        'nav.dashboard': '대시보드',
        'nav.textbooks': '교과서',
        'nav.classes': '학급',
        'nav.assignments': '과제',
        'nav.analytics': '분석',
        'nav.settings': '설정',
        'nav.profile': '프로필',
        'nav.help': '도움말',
        
        'dashboard.welcome': '환영합니다',
        'dashboard.overview': '개요',
        'dashboard.recentActivity': '최근 활동',
        'dashboard.quickStats': '빠른 통계',
        'dashboard.totalStudents': '총 학생 수',
        'dashboard.totalClasses': '총 학급 수',
        'dashboard.totalTextbooks': '총 교과서 수',
        'dashboard.activeAssignments': '활성 과제 수',
        
        'textbook.title': '제목',
        'textbook.create': '교과서 만들기',
        'textbook.edit': '교과서 편집',
        'textbook.delete': '교과서 삭제',
        'textbook.publish': '발행',
        'textbook.unpublish': '발행 취소',
        'textbook.chapter': '챕터',
        'textbook.page': '페이지',
        'textbook.content': '내용',
        'textbook.description': '설명',
        'textbook.subject': '과목',
        'textbook.grade': '학년',
        'textbook.language': '언어',
        'textbook.difficulty': '난이도',
        'textbook.tags': '태그',
        'textbook.coverImage': '표지 이미지',
        'textbook.published': '발행됨',
        'textbook.draft': '초안',
        'textbook.createdAt': '생성일',
        'textbook.updatedAt': '수정일'
      };
    } else {
      return {
        'common.loading': 'Loading...',
        'common.error': 'Error',
        'common.success': 'Success',
        'common.cancel': 'Cancel',
        'common.confirm': 'Confirm',
        'common.save': 'Save',
        'common.delete': 'Delete',
        'common.edit': 'Edit',
        'common.view': 'View',
        'common.search': 'Search',
        'common.filter': 'Filter',
        'common.reset': 'Reset',
        'common.submit': 'Submit',
        'common.back': 'Back',
        'common.next': 'Next',
        'common.previous': 'Previous',
        'common.close': 'Close',
        'common.open': 'Open',
        'common.yes': 'Yes',
        'common.no': 'No',
        
        'auth.login': 'Login',
        'auth.logout': 'Logout',
        'auth.register': 'Register',
        'auth.email': 'Email',
        'auth.password': 'Password',
        'auth.confirmPassword': 'Confirm Password',
        'auth.forgotPassword': 'Forgot Password',
        'auth.resetPassword': 'Reset Password',
        'auth.invalidCredentials': 'Invalid credentials',
        'auth.accountCreated': 'Account created successfully',
        'auth.passwordReset': 'Password has been reset',
        'auth.sessionExpired': 'Session has expired',
        'auth.unauthorized': 'Unauthorized',
        
        'nav.dashboard': 'Dashboard',
        'nav.textbooks': 'Textbooks',
        'nav.classes': 'Classes',
        'nav.assignments': 'Assignments',
        'nav.analytics': 'Analytics',
        'nav.settings': 'Settings',
        'nav.profile': 'Profile',
        'nav.help': 'Help',
        
        'dashboard.welcome': 'Welcome',
        'dashboard.overview': 'Overview',
        'dashboard.recentActivity': 'Recent Activity',
        'dashboard.quickStats': 'Quick Stats',
        'dashboard.totalStudents': 'Total Students',
        'dashboard.totalClasses': 'Total Classes',
        'dashboard.totalTextbooks': 'Total Textbooks',
        'dashboard.activeAssignments': 'Active Assignments',
        
        'textbook.title': 'Title',
        'textbook.create': 'Create Textbook',
        'textbook.edit': 'Edit Textbook',
        'textbook.delete': 'Delete Textbook',
        'textbook.publish': 'Publish',
        'textbook.unpublish': 'Unpublish',
        'textbook.chapter': 'Chapter',
        'textbook.page': 'Page',
        'textbook.content': 'Content',
        'textbook.description': 'Description',
        'textbook.subject': 'Subject',
        'textbook.grade': 'Grade',
        'textbook.language': 'Language',
        'textbook.difficulty': 'Difficulty',
        'textbook.tags': 'Tags',
        'textbook.coverImage': 'Cover Image',
        'textbook.published': 'Published',
        'textbook.draft': 'Draft',
        'textbook.createdAt': 'Created At',
        'textbook.updatedAt': 'Updated At'
      };
    }
  }

  /**
   * Get translation for a specific key and locale
   */
  public t(key: keyof TranslationKeys, locale: SupportedLocale = this.defaultLocale, params?: Record<string, string | number>): string {
    const translations = this.translations.get(locale);
    let translation = translations?.[key];

    // Fallback to fallback locale if translation not found
    if (!translation && locale !== this.fallbackLocale) {
      const fallbackTranslations = this.translations.get(this.fallbackLocale);
      translation = fallbackTranslations?.[key];
    }

    // Final fallback to key itself
    if (!translation) {
      translation = key;
    }

    // Replace parameters if provided
    if (params) {
      Object.entries(params).forEach(([paramKey, value]) => {
        translation = translation.replace(new RegExp(`{{${paramKey}}}`, 'g'), String(value));
      });
    }

    return translation;
  }

  /**
   * Get all translations for a specific locale
   */
  public getTranslations(locale: SupportedLocale): Partial<TranslationKeys> {
    return this.translations.get(locale) || {};
  }

  /**
   * Set translation for a specific key and locale
   */
  public setTranslation(key: keyof TranslationKeys, value: string, locale: SupportedLocale): void {
    const translations = this.translations.get(locale) || {};
    translations[key] = value;
    this.translations.set(locale, translations);
  }

  /**
   * Add translations in bulk for a locale
   */
  public addTranslations(translations: Partial<TranslationKeys>, locale: SupportedLocale): void {
    const existingTranslations = this.translations.get(locale) || {};
    this.translations.set(locale, { ...existingTranslations, ...translations });
  }

  /**
   * Check if a locale is supported
   */
  public isLocaleSupported(locale: string): locale is SupportedLocale {
    return ['ko', 'en'].includes(locale);
  }

  /**
   * Get default locale
   */
  public getDefaultLocale(): SupportedLocale {
    return this.defaultLocale;
  }

  /**
   * Set default locale
   */
  public setDefaultLocale(locale: SupportedLocale): void {
    this.defaultLocale = locale;
  }

  /**
   * Get supported locales
   */
  public getSupportedLocales(): SupportedLocale[] {
    return ['ko', 'en'];
  }

  /**
   * Format number according to locale
   */
  public formatNumber(number: number, locale: SupportedLocale = this.defaultLocale): string {
    return new Intl.NumberFormat(locale === 'ko' ? 'ko-KR' : 'en-US').format(number);
  }

  /**
   * Format date according to locale
   */
  public formatDate(date: Date, locale: SupportedLocale = this.defaultLocale, options?: Intl.DateTimeFormatOptions): string {
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    
    return new Intl.DateTimeFormat(
      locale === 'ko' ? 'ko-KR' : 'en-US',
      { ...defaultOptions, ...options }
    ).format(date);
  }

  /**
   * Format currency according to locale
   */
  public formatCurrency(amount: number, currency: string = 'KRW', locale: SupportedLocale = this.defaultLocale): string {
    return new Intl.NumberFormat(
      locale === 'ko' ? 'ko-KR' : 'en-US',
      { style: 'currency', currency }
    ).format(amount);
  }

  /**
   * Get relative time string
   */
  public getRelativeTime(date: Date, locale: SupportedLocale = this.defaultLocale): string {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) {
      return this.t('time.now', locale);
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}${this.t('time.minutes', locale)} ${this.t('time.ago', locale)}`;
    } else if (diffInHours < 24) {
      return `${diffInHours}${this.t('time.hours', locale)} ${this.t('time.ago', locale)}`;
    } else if (diffInDays < 7) {
      return `${diffInDays}${this.t('time.days', locale)} ${this.t('time.ago', locale)}`;
    } else {
      return this.formatDate(date, locale);
    }
  }
}

export const i18nService = new I18nService();