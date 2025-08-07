import Joi from 'joi';

export const chatSchemas = {
  sendMessage: Joi.object({
    message: Joi.string().min(1).max(1000).required(),
    sessionId: Joi.string().uuid().required(),
    pageContent: Joi.string().required(),
    pageNumber: Joi.number().integer().min(1).required(),
    textbookTitle: Joi.string().required(),
  }),
  
  getSuggestions: Joi.object({
    pageContent: Joi.string().required(),
    currentTopic: Joi.string().required(),
  }),
};