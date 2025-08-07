import Joi from 'joi';

export const classSchemas = {
  create: Joi.object({
    name: Joi.string().min(1).max(100).required(),
    description: Joi.string().max(500).optional(),
  }),
  
  update: Joi.object({
    name: Joi.string().min(1).max(100),
    description: Joi.string().max(500).allow(null, ''),
  }),
  
  join: Joi.object({
    code: Joi.string().length(6).uppercase().required(),
  }),
  
  assignTextbook: Joi.object({
    textbookId: Joi.string().uuid().required(),
  }),
};