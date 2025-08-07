import Joi from 'joi';

export const textbookSchemas = {
  create: Joi.object({
    title: Joi.string().min(1).max(200).required(),
    subject: Joi.string().min(1).max(50).required(),
    grade: Joi.number().integer().min(1).max(12).required(),
    aiSettings: Joi.object({
      difficulty: Joi.string().valid('easy', 'medium', 'hard').required(),
      includeExercises: Joi.boolean().required(),
      includeImages: Joi.boolean().required(),
    }).required(),
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