import { Request, Response, NextFunction } from 'express';

export const validate = (validationSchema: any) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('Validation schema:', validationSchema);
      console.log('Request body:', req.body);
      
      if (validationSchema.body) {
        const { error } = validationSchema.body.validate(req.body);
        if (error) {
          console.error('Validation error details:', error.details);
          return res.status(400).json({
            error: error.details[0].message,
          });
        }
      }
      next();
    } catch (error) {
      console.error('Validation error:', error);
      return res.status(400).json({
        error: 'Invalid request data',
      });
    }
  };
};