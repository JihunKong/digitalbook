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

interface PDFPageView {
  pdfId: string;
  pageNumber: number;
  timeSpent: number;
  timestamp: string;
  userId: string;
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
      
      // PDF Tracking Events (NEW)
      socket.on('join-pdf-tracking', (data) => this.handleJoinPDFTracking(socket, data));
      socket.on('pdf-page-view', (data) => this.handlePDFPageView(socket, data));
      socket.on('pdf-heartbeat', (data) => this.handlePDFHeartbeat(socket, data));
      socket.on('pdf-sync-views', (data) => this.handlePDFSyncViews(socket, data));
      socket.on('pdf-activity-submit', (data) => this.handlePDFActivitySubmit(socket, data));
      
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

  // =============================================================================
  // PDF TRACKING METHODS (NEW)
  // =============================================================================

  private async handleJoinPDFTracking(socket: SocketWithAuth, data: any) {
    const { pdfId } = data;
    
    if (!pdfId || (!socket.userId && !socket.guestId)) return;
    
    // Join PDF-specific room
    socket.join(`pdf:${pdfId}`);
    
    logger.info(`User ${socket.userId || socket.guestId} joined PDF tracking for ${pdfId}`);
    
    // Notify teachers in the class about student joining PDF
    if (socket.userRole === 'STUDENT' || socket.isGuest) {
      await this.notifyTeachersOfPDFActivity(pdfId, {
        type: 'student_joined',
        userId: socket.userId || socket.guestId,
        userName: socket.userEmail || 'Guest',
        pdfId,
        timestamp: new Date().toISOString()
      });
    }
  }

  private async handlePDFPageView(socket: SocketWithAuth, data: PDFPageView) {
    const { pdfId, pageNumber, timeSpent, timestamp } = data;
    
    if (!pdfId || (!socket.userId && !socket.guestId)) return;
    
    const userId = socket.userId || socket.guestId!;
    const prisma = getDatabase();
    
    try {
      // Save page view to database
      await prisma.pdfPageView.create({
        data: {
          userId: socket.userId || null,
          guestId: socket.guestId || null,
          pdfId,
          pageNumber,
          timeSpent: Math.round(timeSpent),
          viewedAt: new Date(timestamp),
        },
      });

      // Cache recent activity in Redis
      const redisKey = `pdf:activity:${pdfId}:${userId}`;
      await this.redis.hset(redisKey, {
        currentPage: pageNumber,
        lastActivity: timestamp,
        totalTimeSpent: timeSpent,
      });
      await this.redis.expire(redisKey, 3600); // Expire after 1 hour

      // Broadcast to teachers monitoring this PDF
      await this.notifyTeachersOfPDFActivity(pdfId, {
        type: 'page_view',
        userId,
        userName: socket.userEmail || 'Guest',
        pdfId,
        pageNumber,
        timeSpent,
        timestamp,
      });

      logger.info(`PDF page view recorded: ${userId} viewed page ${pageNumber} of ${pdfId} for ${timeSpent}ms`);
      
    } catch (error) {
      logger.error('Failed to save PDF page view:', error);
    }
  }

  private async handlePDFHeartbeat(socket: SocketWithAuth, data: any) {
    const { pdfId, currentPage, timestamp } = data;
    const userId = socket.userId || socket.guestId;
    
    if (!userId) return;

    // Update activity in Redis
    const redisKey = `pdf:activity:${pdfId}:${userId}`;
    await this.redis.hset(redisKey, {
      currentPage,
      lastHeartbeat: timestamp,
      isActive: 'true',
    });
    await this.redis.expire(redisKey, 300); // 5 minute expiry for heartbeat
  }

  private async handlePDFSyncViews(socket: SocketWithAuth, data: any) {
    const { pdfId, views } = data;
    const userId = socket.userId || socket.guestId;
    
    if (!userId || !Array.isArray(views)) return;

    const prisma = getDatabase();
    
    try {
      // Bulk insert offline page views
      const pageViewData = views.map((view: any) => ({
        userId: socket.userId || null,
        guestId: socket.guestId || null,
        pdfId,
        pageNumber: view.page,
        timeSpent: Math.round(view.timeSpent),
        viewedAt: new Date(view.timestamp),
      }));

      await prisma.pdfPageView.createMany({
        data: pageViewData,
        skipDuplicates: true,
      });

      logger.info(`Synced ${views.length} offline PDF page views for user ${userId}`);
      
    } catch (error) {
      logger.error('Failed to sync offline PDF views:', error);
    }
  }

  private async handlePDFActivitySubmit(socket: SocketWithAuth, data: any) {
    const { pdfId, activityId, answers, pageNumber } = data;
    const userId = socket.userId || socket.guestId;
    
    if (!userId) return;

    // Broadcast to teachers monitoring this PDF/class
    await this.notifyTeachersOfPDFActivity(pdfId, {
      type: 'activity_submit',
      userId,
      userName: socket.userEmail || 'Guest',
      pdfId,
      activityId,
      pageNumber,
      answers,
      timestamp: new Date().toISOString(),
    });

    logger.info(`PDF activity submitted: ${userId} completed activity ${activityId} on page ${pageNumber}`);
  }

  private async notifyTeachersOfPDFActivity(pdfId: string, activity: any) {
    try {
      const prisma = getDatabase();
      
      // Find the PDF and associated classes
      const pdf = await prisma.pDFTextbook.findUnique({
        where: { id: pdfId },
        include: {
          // Note: PDFTextbook doesn't have direct class relation, need to find through textbook
          textbook: {
            include: {
              classes: {
                include: {
                  class: {
                    select: { id: true, teacherProfile: { select: { userId: true } } }
                  }
                }
              }
            }
          }
        }
      });

      if (!pdf?.textbook?.classes) return;

      // Notify teachers of classes that use this textbook
      pdf.textbook.classes.forEach(classTextbook => {
        if (classTextbook.class.teacherProfile) {
          const teacherSocketRoom = `user:${classTextbook.class.teacherProfile.userId}`;
          this.io.to(teacherSocketRoom).emit('pdf:student-activity', activity);
          
          // Also broadcast to class room for other monitoring
          this.io.to(`class:${classTextbook.class.id}`).emit('pdf:student-activity', activity);
        }
      });
      
    } catch (error) {
      logger.error('Failed to notify teachers of PDF activity:', error);
    }
  }

  // =============================================================================
  // EXISTING METHODS (from original socket.service.ts.bak)
  // =============================================================================

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
        const classes = await prisma.class.findMany({
          where: { teacherId: socket.userId },
        });
        
        for (const classData of classes) {
          socket.join(`class:${classData.id}`);
          
          // Notify students in the class that teacher is online
          socket.to(`class:${classData.id}`).emit('teacher:online', {
            teacherId: socket.userId,
            teacherName: socket.userEmail,
            className: classData.name,
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
            const classes = await prisma.class.findMany({
              where: { teacherId: socket.userId },
            });
            
            for (const classData of classes) {
              this.io.to(`class:${classData.id}`).emit('teacher:offline', {
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
        const studentClasses = await prisma.classEnrollment.findMany({
          where: { studentId: socket.userId },
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
    
    // TODO: Implement chat message history when ChatMessage model is added
    socket.emit('chat:history', []);
    
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
    
    // TODO: Save message to database when ChatMessage model is added
    const savedMessage = {
      id: Date.now().toString(),
      userId: socket.userId,
      role: 'USER',
      content: message,
      context: context || null,
      createdAt: new Date(),
      user: {
        id: socket.userId,
        name: socket.userEmail,
        email: socket.userEmail
      }
    };
    
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
    
    // TODO: Save highlight to database when Highlight model is added
    const savedHighlight = {
      id: Date.now().toString(),
      userId: socket.userId,
      textbookId,
      chapterId: highlight.chapterId,
      pageNumber: highlight.pageNumber,
      text: highlight.text,
      color: highlight.color,
      note: highlight.note,
      createdAt: new Date()
    };
    
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

  // =============================================================================
  // PUBLIC METHODS
  // =============================================================================

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

  public async sendPDFActivityUpdate(pdfId: string, activityData: any) {
    this.io.to(`pdf:${pdfId}`).emit('pdf:activity-update', activityData);
  }

  public getOnlineUsers(): OnlineUser[] {
    return Array.from(this.onlineUsers.values());
  }

  public isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId);
  }

  public async getPDFActivity(pdfId: string): Promise<any[]> {
    const pattern = `pdf:activity:${pdfId}:*`;
    const keys = await this.redis.keys(pattern);
    const activities = [];
    
    for (const key of keys) {
      const activity = await this.redis.hgetall(key);
      const userId = key.split(':').pop();
      activities.push({
        userId,
        ...activity,
        isActive: activity.isActive === 'true'
      });
    }
    
    return activities;
  }
}