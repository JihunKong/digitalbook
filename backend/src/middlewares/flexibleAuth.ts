import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';
import { getDatabase } from '../config/database';

interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

interface GuestJwtPayload {
  guestId: string;
  sessionId: string;
  textbookId: string;
  isGuest: boolean;
}

export async function authenticateFlexible(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      throw new AppError('No token provided', 401);
    }
    
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'secret'
    ) as JwtPayload | GuestJwtPayload;
    
    const prisma = getDatabase();
    
    // Check if it's a guest token
    if ('isGuest' in decoded && decoded.isGuest) {
      const guest = await prisma.guestAccess.findUnique({
        where: { id: decoded.guestId },
        select: { id: true, sessionId: true, textbookId: true },
      });
      
      if (!guest || guest.sessionId !== decoded.sessionId) {
        throw new AppError('Invalid guest session', 401);
      }
      
      // For guest access, we don't set req.user since it's not a regular user
      // The guest information is available through the decoded token
      (req as any).guestToken = decoded;
    } else {
      // Regular user authentication
      const user = await prisma.user.findUnique({
        where: { id: (decoded as JwtPayload).userId },
        select: { id: true, email: true, name: true, role: true },
      });
      
      if (!user) {
        throw new AppError('User not found', 401);
      }
      
      // Only allow ADMIN and TEACHER roles for regular user auth
      if (user.role !== 'ADMIN' && user.role !== 'TEACHER') {
        throw new AppError('Unauthorized role for this endpoint', 403);
      }
      
      req.user = {
        userId: user.id,
        email: user.email,
        name: user.name || user.email,
        role: user.role as 'ADMIN' | 'TEACHER',
      };
    }
    
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Invalid token', 401));
    } else {
      next(error);
    }
  }
}