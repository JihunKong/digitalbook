import Joi from 'joi';

// Simplified password pattern - just minimum length for better UX
const passwordPattern = /^.{8,}$/;

// Common validation patterns
const patterns = {
  koreanName: /^[가-힣]{2,10}$/,
  phoneNumber: /^(\+82|0)?1[0-9]{1}[0-9]{3,4}[0-9]{4}$/,
  safeString: /^[^<>'"`;\/\\]*$/,
};

// Custom validators
const customValidators = {
  strongPassword: Joi.string()
    .min(8)
    .max(100)
    .pattern(passwordPattern)
    .required()
    .messages({
      'string.pattern.base': 'Password must be at least 8 characters long',
      'string.min': 'Password must be at least 8 characters long',
      'string.max': 'Password must not exceed 100 characters',
    }),
    
  safeString: (field: string) => Joi.string()
    .pattern(patterns.safeString)
    .messages({
      'string.pattern.base': `${field} contains invalid characters`,
    }),
};

export const authSchemas = {
  // Enhanced registration schema
  register: Joi.object({
    email: Joi.string()
      .email({ tlds: { allow: true } })
      .lowercase()
      .trim()
      .max(255)
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'string.max': 'Email address is too long',
      }),
      
    password: customValidators.strongPassword,
    
    name: Joi.string()
      .min(2)
      .max(50)
      .trim()
      .pattern(patterns.safeString)
      .required()
      .messages({
        'string.min': 'Name must be at least 2 characters long',
        'string.max': 'Name must not exceed 50 characters',
        'string.pattern.base': 'Name contains invalid characters',
      }),
      
    role: Joi.string()
      .valid('TEACHER', 'STUDENT')
      .required()
      .messages({
        'any.only': 'Role must be either TEACHER or STUDENT',
      }),
      
    termsAccepted: Joi.boolean()
      .valid(true)
      .default(true)
      .optional()
      .messages({
        'any.only': 'You must accept the terms and conditions',
      }),
      
    profileData: Joi.object({
      school: Joi.string().max(100).trim(),
      grade: Joi.when('...role', {
        is: 'STUDENT',
        then: Joi.number().integer().min(1).max(12),
        otherwise: Joi.forbidden(),
      }),
      subjects: Joi.when('...role', {
        is: 'TEACHER',
        then: Joi.array().items(Joi.string().max(50)).max(10),
        otherwise: Joi.forbidden(),
      }),
    }).optional(),
  }).custom((value, helpers) => {
    // Teachers should provide school information (optional for now)
    if (value.role === 'TEACHER' && value.profileData && !value.profileData.school) {
      return helpers.error('custom.teacherSchool');
    }
    return value;
  }).messages({
    'custom.teacherSchool': 'Teachers should provide school information',
  }),
  
  // Enhanced login schema
  login: Joi.object({
    email: Joi.string()
      .email()
      .lowercase()
      .trim()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
      }),
      
    password: Joi.string()
      .required()
      .messages({
        'string.empty': 'Password is required',
      }),
      
    rememberMe: Joi.boolean().optional(),
    
    captchaToken: Joi.string().optional(),
  }),
  
  // Password reset request
  passwordResetRequest: Joi.object({
    email: Joi.string()
      .email()
      .lowercase()
      .trim()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
      }),
  }),
  
  // Password reset
  passwordReset: Joi.object({
    token: Joi.string()
      .required()
      .messages({
        'string.empty': 'Reset token is required',
      }),
      
    newPassword: customValidators.strongPassword,
    
    confirmPassword: Joi.string()
      .valid(Joi.ref('newPassword'))
      .required()
      .messages({
        'any.only': 'Passwords do not match',
      }),
  }),
  
  // Update profile
  updateProfile: Joi.object({
    name: Joi.string()
      .min(2)
      .max(50)
      .trim()
      .pattern(patterns.safeString)
      .optional(),
      
    email: Joi.string()
      .email()
      .lowercase()
      .trim()
      .optional(),
      
    phoneNumber: Joi.string()
      .pattern(patterns.phoneNumber)
      .optional()
      .messages({
        'string.pattern.base': 'Please provide a valid Korean phone number',
      }),
      
    currentPassword: Joi.string().optional(),
    
    newPassword: Joi.when('currentPassword', {
      is: Joi.exist(),
      then: customValidators.strongPassword,
      otherwise: Joi.forbidden(),
    }),
    
    confirmNewPassword: Joi.when('newPassword', {
      is: Joi.exist(),
      then: Joi.string()
        .valid(Joi.ref('newPassword'))
        .required()
        .messages({
          'any.only': 'New passwords do not match',
        }),
      otherwise: Joi.forbidden(),
    }),
    
    profileImage: Joi.string().uri().optional(),
    
    bio: Joi.string()
      .max(500)
      .pattern(patterns.safeString)
      .optional(),
      
    preferences: Joi.object({
      language: Joi.string().valid('ko', 'en').optional(),
      notifications: Joi.object({
        email: Joi.boolean().optional(),
        push: Joi.boolean().optional(),
        sms: Joi.boolean().optional(),
      }).optional(),
      theme: Joi.string().valid('light', 'dark', 'system').optional(),
    }).optional(),
  }),
  
  // Change email
  changeEmail: Joi.object({
    newEmail: Joi.string()
      .email()
      .lowercase()
      .trim()
      .required(),
      
    password: Joi.string()
      .required()
      .messages({
        'string.empty': 'Password is required for verification',
      }),
  }),
  
  // Verify email
  verifyEmail: Joi.object({
    token: Joi.string()
      .required()
      .messages({
        'string.empty': 'Verification token is required',
      }),
  }),
  
  // Two-factor authentication
  enable2FA: Joi.object({
    password: Joi.string()
      .required()
      .messages({
        'string.empty': 'Password is required',
      }),
  }),
  
  verify2FA: Joi.object({
    code: Joi.string()
      .length(6)
      .pattern(/^\d+$/)
      .required()
      .messages({
        'string.length': 'Code must be 6 digits',
        'string.pattern.base': 'Code must be numeric',
      }),
  }),
  
  // Refresh token
  refreshToken: Joi.object({
    refreshToken: Joi.string()
      .required()
      .messages({
        'string.empty': 'Refresh token is required',
      }),
  }),
};