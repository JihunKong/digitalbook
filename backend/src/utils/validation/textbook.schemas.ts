import Joi from 'joi';

export const textbookSchemas = {
  create: Joi.object({
    title: Joi.string().min(1).max(200).required().messages({
      'string.empty': '교재 제목을 입력해주세요.',
      'string.max': '교재 제목은 200자 이하로 입력해주세요.',
      'any.required': '교재 제목은 필수 입력 항목입니다.'
    }),
    subject: Joi.string().min(1).max(50).required().messages({
      'string.empty': '과목을 선택해주세요.',
      'string.max': '과목명은 50자 이하로 입력해주세요.',
      'any.required': '과목은 필수 입력 항목입니다.'
    }),
    grade: Joi.alternatives().try(
      Joi.number().integer().min(1).max(12),
      Joi.string().pattern(/^[1-9]$|^1[0-2]$/).custom((value, helpers) => {
        return parseInt(value, 10);
      })
    ).required().messages({
      'number.min': '학년은 1~12 사이의 값을 입력해주세요.',
      'number.max': '학년은 1~12 사이의 값을 입력해주세요.',
      'any.required': '학년은 필수 입력 항목입니다.'
    }),
    description: Joi.string().allow('').max(1000).optional().messages({
      'string.max': '설명은 1000자 이하로 입력해주세요.'
    }),
    contentType: Joi.string().valid('TEXT', 'FILE', 'MIXED').required().messages({
      'any.only': '콘텐츠 타입은 TEXT, FILE, MIXED 중 하나여야 합니다.',
      'any.required': '콘텐츠 타입은 필수 입력 항목입니다.'
    }),
    content: Joi.string().allow('').max(50000).optional().messages({
      'string.max': '콘텐츠는 50000자 이하로 입력해주세요.'
    }),
    fileId: Joi.string().guid({ version: ['uuidv4'] }).optional().messages({
      'string.guid': '올바른 파일 ID 형식이 아닙니다.'
    }),
    aiSettings: Joi.object({
      difficulty: Joi.string().valid('easy', 'medium', 'hard').optional().messages({
        'any.only': '난이도는 easy, medium, hard 중 하나여야 합니다.'
      }),
      includeExercises: Joi.boolean().optional(),
      includeImages: Joi.boolean().optional(),
      generateImages: Joi.boolean().optional(),
      generateQuestions: Joi.boolean().optional(),
      targetPageLength: Joi.number().integer().min(100).max(2000).optional().messages({
        'number.min': '페이지 길이는 최소 100자 이상이어야 합니다.',
        'number.max': '페이지 길이는 최대 2000자 이하여야 합니다.'
      }),
      questionDifficulty: Joi.string().valid('easy', 'medium', 'hard').optional().messages({
        'any.only': '문제 난이도는 easy, medium, hard 중 하나여야 합니다.'
      }),
    }).optional(),
  }).custom((value, helpers) => {
    // Custom validation for content type and required fields
    const { contentType, content, fileId } = value;
    
    if (contentType === 'TEXT' && (!content || content.trim() === '')) {
      return helpers.message({
        custom: '텍스트 모드에서는 콘텐츠를 입력해야 합니다.'
      });
    }
    
    if (contentType === 'FILE' && !fileId) {
      return helpers.message({
        custom: '파일 모드에서는 파일을 업로드해야 합니다.'
      });
    }
    
    if (contentType === 'MIXED' && (!content || content.trim() === '') && !fileId) {
      return helpers.message({
        custom: '혼합 모드에서는 텍스트 콘텐츠 또는 파일 중 하나는 필수입니다.'
      });
    }
    
    return value;
  }),
  
  update: Joi.object({
    title: Joi.string().min(1).max(200),
    subject: Joi.string().min(1).max(50),
    grade: Joi.number().integer().min(1).max(12),
    content: Joi.object(),
    coverImage: Joi.string().uri(),
    aiSettings: Joi.object({
      difficulty: Joi.string().valid('easy', 'medium', 'hard'),
      includeExercises: Joi.boolean(),
      includeImages: Joi.boolean(),
    }),
  }),
};