import { Server, Socket } from 'socket.io';
import { getDatabase } from '../config/database';
import { logger } from '../utils/logger';
import { socketAuthenticate } from '../middlewares/socketAuth';
import Redis from 'ioredis';

interface SocketWithAuth extends Socket {
  userId?: string;
  userEmail?: string;
  userRole?: string;
  guestId?: string;
  sessionId?: string;
  isGuest?: boolean;
}

interface OnlineUser {
  userId: string;
  email: string;
  role: string;
  socketId: string;
  connectedAt: Date;
  lastActivity: Date;
  currentTextbook?: string;
  currentPage?: number;
}

export class SocketService {
  private io: Server;
  private redis: Redis;
  private onlineUsers: Map<string, OnlineUser> = new Map();
  private userSockets: Map<string, Set<string>> = new Map(); // userId -> Set of socketIds

  constructor(io: Server) {
    this.io = io;
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    });
    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    this.io.use(socketAuthenticate);
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: SocketWithAuth) => {
      logger.info(`Socket connected: ${socket.id} - User: ${socket.userEmail || 'Guest'}`);
      
      // Handle connection
      this.handleConnection(socket);
      
      // User activity events
      socket.on('user:activity', (data) => this.handleUserActivity(socket, data));
      socket.on('user:typing', (data) => this.handleUserTyping(socket, data));
      
      // Notification events
      socket.on('notification:mark-read', (data) => this.handleMarkNotificationRead(socket, data));
      
      // Chat events
      socket.on('chat:join', (data) => this.handleJoinChat(socket, data));
      socket.on('chat:leave', (data) => this.handleLeaveChat(socket, data));
      socket.on('chat:message', (data) => this.handleChatMessage(socket, data));
      socket.on('chat:typing', (data) => this.handleChatTyping(socket, data));
      
      // Whiteboard events
      socket.on('whiteboard:join', (data) => this.handleJoinWhiteboard(socket, data));
      socket.on('whiteboard:leave', (data) => this.handleLeaveWhiteboard(socket, data));
      socket.on('whiteboard:draw', (data) => this.handleWhiteboardDraw(socket, data));
      socket.on('whiteboard:clear', (data) => this.handleWhiteboardClear(socket, data));
      socket.on('whiteboard:undo', (data) => this.handleWhiteboardUndo(socket, data));
      
      // Textbook collaboration events
      socket.on('textbook:join', (data) => this.handleJoinTextbook(socket, data));
      socket.on('textbook:leave', (data) => this.handleLeaveTextbook(socket, data));
      socket.on('textbook:page-change', (data) => this.handlePageChange(socket, data));
      socket.on('textbook:highlight', (data) => this.handleHighlight(socket, data));
      
      // Class events
      socket.on('class:join', (data) => this.handleJoinClass(socket, data));
      socket.on('class:leave', (data) => this.handleLeaveClass(socket, data));
      
      // Handle disconnection
      socket.on('disconnect', () => this.handleDisconnection(socket));
    });
  }

  private async handleConnection(socket: SocketWithAuth) {
    if (socket.userId) {
      // Add to online users
      const user: OnlineUser = {
        userId: socket.userId,
        email: socket.userEmail!,
        role: socket.userRole!,
        socketId: socket.id,
        connectedAt: new Date(),
        lastActivity: new Date(),
      };
      
      this.onlineUsers.set(socket.id, user);
      
      // Track multiple connections per user
      if (!this.userSockets.has(socket.userId)) {
        this.userSockets.set(socket.userId, new Set());
      }
      this.userSockets.get(socket.userId)!.add(socket.id);
      
      // Store in Redis for scalability
      await this.redis.setex(
        `online:${socket.userId}`,
        3600, // 1 hour TTL
        JSON.stringify(user)
      );
      
      // Join user-specific room
      socket.join(`user:${socket.userId}`);
      
      // If teacher, join all their class rooms
      if (socket.userRole === 'TEACHER') {
        const prisma = getDatabase();
        const classes = await prisma.classMember.findMany({
          where: { userId: socket.userId, role: 'TEACHER' },
          include: { class: true },
        });
        
        for (const classData of classes) {
          socket.join(`class:${classData.classId}`);
          
          // Notify students in the class that teacher is online
          socket.to(`class:${classData.classId}`).emit('teacher:online', {
            teacherId: socket.userId,
            teacherName: socket.userEmail,
            className: classData.class.name,
          });
        }
      }
      
      // Broadcast online status
      this.broadcastOnlineUsers();
    }
  }

  private async handleDisconnection(socket: SocketWithAuth) {
    logger.info(`Socket disconnected: ${socket.id}`);
    
    if (socket.userId) {
      // Remove from online users
      this.onlineUsers.delete(socket.id);
      
      // Remove socket from user's socket set
      const userSocketSet = this.userSockets.get(socket.userId);
      if (userSocketSet) {
        userSocketSet.delete(socket.id);
        
        // If user has no more connections, remove from Redis
        if (userSocketSet.size === 0) {
          this.userSockets.delete(socket.userId);
          await this.redis.del(`online:${socket.userId}`);
          
          // If teacher, notify students they're offline
          if (socket.userRole === 'TEACHER') {
            const prisma = getDatabase();
            const classes = await prisma.classMember.findMany({
              where: { userId: socket.userId, role: 'TEACHER' },
            });
            
            for (const classData of classes) {
              this.io.to(`class:${classData.classId}`).emit('teacher:offline', {
                teacherId: socket.userId,
                teacherName: socket.userEmail,
              });
            }
          }
        }
      }
      
      // Broadcast updated online users
      this.broadcastOnlineUsers();
    }
  }

  private async handleUserActivity(socket: SocketWithAuth, data: any) {
    const user = this.onlineUsers.get(socket.id);
    if (user) {
      user.lastActivity = new Date();
      user.currentTextbook = data.textbookId;
      user.currentPage = data.pageNumber;
      
      // Update Redis
      await this.redis.setex(
        `online:${socket.userId}`,
        3600,
        JSON.stringify(user)
      );
      
      // Broadcast to teachers in the same class
      if (socket.userRole === 'STUDENT') {
        const prisma = getDatabase();
        const studentClasses = await prisma.classMember.findMany({
          where: { userId: socket.userId },
          include: { class: true },
        });
        
        for (const classData of studentClasses) {
          socket.to(`class:${classData.classId}`).emit('student:activity', {
            studentId: socket.userId,
            studentName: socket.userEmail,
            activity: data,
            className: classData.class.name,
          });
        }
      }
    }
  }

  private handleUserTyping(socket: SocketWithAuth, data: any) {
    const { roomId, isTyping } = data;
    socket.to(roomId).emit('user:typing', {
      userId: socket.userId,
      userName: socket.userEmail,
      isTyping,
    });
  }

  private async handleJoinChat(socket: SocketWithAuth, data: any) {
    const { chatRoomId, textbookId } = data;
    socket.join(`chat:${chatRoomId}`);
    
    // Load recent messages
    const prisma = getDatabase();
    const recentMessages = await prisma.chatMessage.findMany({
      where: { sessionId: chatRoomId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        user: {
          select: { id: true, name: true, email: true, profileImage: true },
        },
      },
    });
    
    socket.emit('chat:history', recentMessages.reverse());
    
    // Notify others
    socket.to(`chat:${chatRoomId}`).emit('user:joined-chat', {
      userId: socket.userId,
      userName: socket.userEmail,
    });
  }

  private handleLeaveChat(socket: SocketWithAuth, data: any) {
    const { chatRoomId } = data;
    socket.leave(`chat:${chatRoomId}`);
    
    socket.to(`chat:${chatRoomId}`).emit('user:left-chat', {
      userId: socket.userId,
      userName: socket.userEmail,
    });
  }

  private async handleChatMessage(socket: SocketWithAuth, data: any) {
    const { chatRoomId, message, context } = data;
    
    if (!socket.userId) return;
    
    const prisma = getDatabase();
    
    // Save message to database
    const savedMessage = await prisma.chatMessage.create({
      data: {
        userId: socket.userId,
        sessionId: chatRoomId,
        role: 'USER',
        content: message,
        context: context || null,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, profileImage: true },
        },
      },
    });
    
    // Broadcast to all users in the chat room
    this.io.to(`chat:${chatRoomId}`).emit('chat:message', savedMessage);
  }

  private handleChatTyping(socket: SocketWithAuth, data: any) {
    const { chatRoomId, isTyping } = data;
    socket.to(`chat:${chatRoomId}`).emit('chat:typing', {
      userId: socket.userId,
      userName: socket.userEmail,
      isTyping,
    });
  }

  private handleJoinWhiteboard(socket: SocketWithAuth, data: any) {
    const { whiteboardId } = data;
    socket.join(`whiteboard:${whiteboardId}`);
    
    socket.to(`whiteboard:${whiteboardId}`).emit('user:joined-whiteboard', {
      userId: socket.userId,
      userName: socket.userEmail,
    });
  }

  private handleLeaveWhiteboard(socket: SocketWithAuth, data: any) {
    const { whiteboardId } = data;
    socket.leave(`whiteboard:${whiteboardId}`);
    
    socket.to(`whiteboard:${whiteboardId}`).emit('user:left-whiteboard', {
      userId: socket.userId,
      userName: socket.userEmail,
    });
  }

  private handleWhiteboardDraw(socket: SocketWithAuth, data: any) {
    const { whiteboardId, drawData } = data;
    
    // Broadcast drawing data to all users in the whiteboard room
    socket.to(`whiteboard:${whiteboardId}`).emit('whiteboard:draw', {
      userId: socket.userId,
      userName: socket.userEmail,
      drawData,
    });
  }

  private handleWhiteboardClear(socket: SocketWithAuth, data: any) {
    const { whiteboardId } = data;
    
    // Only teachers can clear the whiteboard
    if (socket.userRole === 'TEACHER') {
      this.io.to(`whiteboard:${whiteboardId}`).emit('whiteboard:cleared', {
        clearedBy: socket.userEmail,
      });
    }
  }

  private handleWhiteboardUndo(socket: SocketWithAuth, data: any) {
    const { whiteboardId, action } = data;
    
    socket.to(`whiteboard:${whiteboardId}`).emit('whiteboard:undo', {
      userId: socket.userId,
      action,
    });
  }

  private async handleJoinTextbook(socket: SocketWithAuth, data: any) {
    const { textbookId } = data;
    socket.join(`textbook:${textbookId}`);
    
    // Update user's current location
    const user = this.onlineUsers.get(socket.id);
    if (user) {
      user.currentTextbook = textbookId;
    }
    
    // Get list of users in this textbook
    const usersInTextbook = await this.getUsersInRoom(`textbook:${textbookId}`);
    socket.emit('textbook:users', usersInTextbook);
    
    // Notify others
    socket.to(`textbook:${textbookId}`).emit('user:joined-textbook', {
      userId: socket.userId,
      userName: socket.userEmail,
    });
  }

  private handleLeaveTextbook(socket: SocketWithAuth, data: any) {
    const { textbookId } = data;
    socket.leave(`textbook:${textbookId}`);
    
    // Update user's current location
    const user = this.onlineUsers.get(socket.id);
    if (user) {
      user.currentTextbook = undefined;
      user.currentPage = undefined;
    }
    
    socket.to(`textbook:${textbookId}`).emit('user:left-textbook', {
      userId: socket.userId,
      userName: socket.userEmail,
    });
  }

  private handlePageChange(socket: SocketWithAuth, data: any) {
    const { textbookId, pageNumber } = data;
    
    // Update user's current page
    const user = this.onlineUsers.get(socket.id);
    if (user) {
      user.currentPage = pageNumber;
    }
    
    // Broadcast to others in the same textbook
    socket.to(`textbook:${textbookId}`).emit('user:page-changed', {
      userId: socket.userId,
      userName: socket.userEmail,
      pageNumber,
    });
  }

  private async handleHighlight(socket: SocketWithAuth, data: any) {
    const { textbookId, highlight } = data;
    
    if (!socket.userId) return;
    
    const prisma = getDatabase();
    
    // Save highlight to database
    const savedHighlight = await prisma.highlight.create({
      data: {
        userId: socket.userId,
        textbookId,
        chapterId: highlight.chapterId,
        pageNumber: highlight.pageNumber,
        text: highlight.text,
        color: highlight.color,
        note: highlight.note,
      },
    });
    
    // Broadcast to others in the same textbook
    socket.to(`textbook:${textbookId}`).emit('user:highlighted', {
      userId: socket.userId,
      userName: socket.userEmail,
      highlight: savedHighlight,
    });
  }

  private async handleJoinClass(socket: SocketWithAuth, data: any) {
    const { classId } = data;
    socket.join(`class:${classId}`);
    
    // Get online users in this class
    const onlineClassUsers = await this.getUsersInRoom(`class:${classId}`);
    socket.emit('class:online-users', onlineClassUsers);
  }

  private handleLeaveClass(socket: SocketWithAuth, data: any) {
    const { classId } = data;
    socket.leave(`class:${classId}`);
  }

  private async handleMarkNotificationRead(socket: SocketWithAuth, data: any) {
    const { notificationId } = data;
    
    // Mark notification as read in database
    // This would require a Notification model which isn't in the current schema
    // For now, just broadcast the event
    socket.emit('notification:marked-read', { notificationId });
  }

  private async getUsersInRoom(roomId: string): Promise<any[]> {
    const socketsInRoom = await this.io.in(roomId).allSockets();
    const users = [];
    
    for (const socketId of socketsInRoom) {
      const user = this.onlineUsers.get(socketId);
      if (user) {
        users.push({
          userId: user.userId,
          email: user.email,
          role: user.role,
          currentPage: user.currentPage,
          lastActivity: user.lastActivity,
        });
      }
    }
    
    return users;
  }

  private broadcastOnlineUsers() {
    const onlineUsersList = Array.from(this.onlineUsers.values()).map(user => ({
      userId: user.userId,
      email: user.email,
      role: user.role,
      lastActivity: user.lastActivity,
      currentTextbook: user.currentTextbook,
      currentPage: user.currentPage,
    }));
    
    this.io.emit('users:online', onlineUsersList);
  }

  // Public methods for sending notifications
  public async sendNotificationToUser(userId: string, notification: any) {
    this.io.to(`user:${userId}`).emit('notification:new', notification);
  }

  public async sendAssignmentNotification(classId: string, assignment: any) {
    this.io.to(`class:${classId}`).emit('assignment:new', assignment);
  }

  public async sendClassAnnouncement(classId: string, announcement: any) {
    this.io.to(`class:${classId}`).emit('announcement:new', announcement);
  }

  public getOnlineUsers(): OnlineUser[] {
    return Array.from(this.onlineUsers.values());
  }

  public isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId);
  }
}