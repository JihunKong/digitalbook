import { z } from 'zod';

// Common validation patterns
export const patterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  strongPassword: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  phoneNumber: /^(\+\d{1,3}[- ]?)?\d{10}$/,
  url: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  mongoId: /^[0-9a-fA-F]{24}$/,
  username: /^[a-zA-Z0-9_]{3,20}$/,
  koreanName: /^[가-힣]{2,10}$/,
  alphanumeric: /^[a-zA-Z0-9]+$/,
};

// Common field schemas
export const commonSchemas = {
  id: z.string().regex(patterns.mongoId, 'Invalid ID format'),
  
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Invalid email format')
    .max(255, 'Email too long'),
  
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password too long')
    .regex(
      patterns.strongPassword,
      'Password must contain uppercase, lowercase, number, and special character'
    ),
  
  username: z
    .string()
    .trim()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(patterns.username, 'Username can only contain letters, numbers, and underscores'),
  
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(100, 'Name too long'),
  
  koreanName: z
    .string()
    .trim()
    .regex(patterns.koreanName, 'Please enter a valid Korean name (2-10 characters)'),
  
  phoneNumber: z
    .string()
    .trim()
    .regex(patterns.phoneNumber, 'Invalid phone number format')
    .optional(),
  
  url: z
    .string()
    .trim()
    .url('Invalid URL format')
    .regex(patterns.url, 'URL must be http or https'),
  
  date: z.string().datetime('Invalid date format'),
  
  pagination: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),
  
  searchQuery: z
    .string()
    .trim()
    .min(1, 'Search query cannot be empty')
    .max(100, 'Search query too long'),
  
  tags: z
    .array(z.string().trim().min(1).max(50))
    .max(10, 'Too many tags'),
  
  metadata: z.record(z.string(), z.any()).optional(),
  
  file: z.object({
    filename: z.string().min(1).max(255),
    mimetype: z.string().min(1).max(100),
    size: z.number().positive().max(100 * 1024 * 1024), // 100MB max
  }),
  
  coordinates: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }),
};

// Sanitization helpers
export const sanitizers = {
  html: (input: string): string => {
    // Basic HTML sanitization - in production, use a library like DOMPurify
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  },
  
  filename: (input: string): string => {
    // Remove potentially dangerous characters from filenames
    return input.replace(/[^a-zA-Z0-9._-]/g, '_');
  },
  
  sql: (input: string): string => {
    // Basic SQL injection prevention - Prisma handles this, but good for raw queries
    return input.replace(/['";\\]/g, '');
  },
};

// Custom validation functions
export const validators = {
  isStrongPassword: (password: string): boolean => {
    return patterns.strongPassword.test(password);
  },
  
  isValidEmail: (email: string): boolean => {
    return patterns.email.test(email);
  },
  
  isValidKoreanName: (name: string): boolean => {
    return patterns.koreanName.test(name);
  },
  
  isValidMongoId: (id: string): boolean => {
    return patterns.mongoId.test(id);
  },
  
  isSafeString: (input: string): boolean => {
    // Check for common injection patterns
    const dangerousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /eval\(/i,
      /expression\(/i,
      /<iframe/i,
      /<object/i,
      /<embed/i,
      /document\./i,
      /window\./i,
      /\.innerHTML/i,
    ];
    
    return !dangerousPatterns.some(pattern => pattern.test(input));
  },
};

// Validation error formatter
export function formatValidationErrors(errors: z.ZodError) {
  return errors.errors.map(error => ({
    field: error.path.join('.'),
    message: error.message,
    code: error.code,
  }));
}

// Request validation schemas
export const requestSchemas = {
  params: z.object({
    id: commonSchemas.id,
  }),
  
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
    search: z.string().trim().max(100).optional(),
    sort: z.string().trim().max(50).optional(),
    order: z.enum(['asc', 'desc']).optional(),
    filter: z.record(z.string(), z.any()).optional(),
  }),
};

// File upload validation
export const fileValidation = {
  image: z.object({
    fieldname: z.string(),
    originalname: z.string(),
    encoding: z.string(),
    mimetype: z.enum(['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
    size: z.number().max(10 * 1024 * 1024), // 10MB
  }),
  
  document: z.object({
    fieldname: z.string(),
    originalname: z.string(),
    encoding: z.string(),
    mimetype: z.enum([
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ]),
    size: z.number().max(50 * 1024 * 1024), // 50MB
  }),
  
  video: z.object({
    fieldname: z.string(),
    originalname: z.string(),
    encoding: z.string(),
    mimetype: z.enum(['video/mp4', 'video/mpeg', 'video/quicktime', 'video/webm']),
    size: z.number().max(500 * 1024 * 1024), // 500MB
  }),
};