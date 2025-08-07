import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { getDatabase } from '../config/database';
import { logger } from '../utils/logger';

interface SocketWithAuth extends Socket {
  userId?: string;
  userEmail?: string;
  userRole?: string;
  guestId?: string;
  sessionId?: string;
  isGuest?: boolean;
}

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

export async function socketAuthenticate(socket: SocketWithAuth, next: (err?: Error) => void) {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return next(new Error('No token provided'));
    }
    
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'secret'
    ) as JwtPayload | GuestJwtPayload;
    
    const prisma = getDatabase();
    
    if ('isGuest' in decoded && decoded.isGuest) {
      // Handle guest authentication
      const guest = await prisma.guestAccess.findUnique({
        where: { id: decoded.guestId },
        select: { id: true, sessionId: true, textbookId: true, studentName: true },
      });
      
      if (!guest || guest.sessionId !== decoded.sessionId) {
        return next(new Error('Invalid guest session'));
      }
      
      socket.guestId = guest.id;
      socket.sessionId = guest.sessionId;
      socket.isGuest = true;
      
      logger.info(`Guest socket authenticated: ${socket.id} - Guest: ${guest.studentName}`);
    } else {
      // Handle regular user authentication
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true, role: true },
      });
      
      if (!user) {
        return next(new Error('User not found'));
      }
      
      socket.userId = user.id;
      socket.userEmail = user.email;
      socket.userRole = user.role;
      
      logger.info(`Socket authenticated: ${socket.id} - User: ${user.email}`);
    }
    
    next();
  } catch (error) {
    logger.error('Socket authentication error:', error);
    if (error instanceof jwt.JsonWebTokenError) {
      next(new Error('Invalid token'));
    } else {
      next(new Error('Authentication failed'));
    }
  }
}

export function requireSocketAuth(socket: SocketWithAuth): boolean {
  return !!(socket.userId || socket.guestId);
}

export function requireTeacherSocket(socket: SocketWithAuth): boolean {
  return socket.userRole === 'TEACHER';
}

export function requireStudentSocket(socket: SocketWithAuth): boolean {
  return socket.userRole === 'STUDENT' || socket.isGuest === true;
}