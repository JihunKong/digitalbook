import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    name: string;
    role: 'ADMIN' | 'TEACHER';
  };
}

export const adminOnly = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    // Check if user is admin
    if (req.user.role !== 'ADMIN') {
      res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Admin authorization error:', error);
    res.status(500).json({
      success: false,
      message: 'Authorization error'
    });
  }
};