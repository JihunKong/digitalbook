import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { errorHandler, notFoundHandler, asyncHandler } from './middlewares/errorHandler';
import { requestLogger } from './middlewares/logger';
import { applyPathRateLimiter } from './middlewares/rateLimiter';
import { performanceMiddleware, getHealthWithMetrics } from './middlewares/performanceMonitor';
import { csrfProtection, verifyOrigin } from './middlewares/csrf';
import routes from './routes';
// import monitoringRoutes from './routes/monitoring.routes';
import { initializeDatabase } from './config/database';
import { initializeRedis } from './config/redis';
import { logger, logSecurity } from './utils/logger';
import { startCronJobs } from './utils/cron';
import { SocketService } from './services/socket.service';
import { notificationService } from './services/notification.service';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  },
  // Add ping timeout and interval for better connection management
  pingTimeout: 60000,
  pingInterval: 25000,
  // Enable connection state recovery
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
    skipMiddlewares: false,
  },
});

// Initialize Socket service
let socketService: SocketService;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      'img-src': ["'self'", 'data:', 'blob:', '*'],
      'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      'connect-src': ["'self'", 'ws:', 'wss:', '*'],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));

// CORS configuration with cookie support
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',');
    // Allow requests with no origin (e.g., mobile apps, Postman)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logSecurity('CORS blocked request', { origin });
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Set-Cookie'],
  maxAge: 86400, // 24 hours
};
app.use(cors(corsOptions));

// Cookie parser middleware - MUST come before body parsers
app.use(cookieParser(process.env.COOKIE_SECRET || 'cookie-secret-key'));

// Body parsing middleware with size limits
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    // Store raw body for webhook signature verification
    (req as any).rawBody = buf.toString('utf8');
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session configuration for production
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1); // Trust first proxy
}

// CSRF Protection - Apply after cookie parser and before routes
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',');
app.use(csrfProtection({
  skipRoutes: [
    '/api/auth/login',
    '/api/auth/signup',
    '/api/auth/refresh',
    '/api/auth/logout',
    '/api/health',
    '/api/guest/access',
    '/api/csrf/token', // CSRF 토큰 엔드포인트는 제외
    '/api/webhook',
    '/uploads', // 정적 파일
  ],
}));

// Origin verification for additional security
if (process.env.NODE_ENV === 'production') {
  app.use(verifyOrigin(allowedOrigins));
}

// Request logging and monitoring
app.use(requestLogger);
app.use(performanceMiddleware);

// Apply path-specific rate limiting
app.use(applyPathRateLimiter);

// Trust proxy for accurate IP addresses
app.set('trust proxy', true);

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads'), {
  maxAge: '7d',
  etag: true,
  lastModified: true,
}));

// Make socket service available to routes
app.use((req, res, next) => {
  req.socketService = socketService;
  next();
});

// API routes
app.use('/api', routes);
// app.use('/api/monitoring', monitoringRoutes);

// Health check endpoints
app.get('/health', asyncHandler(async (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION || '1.0.0',
  });
}));

app.get('/health/detailed', asyncHandler(async (req, res) => {
  const metrics = getHealthWithMetrics();
  res.status(200).json(metrics);
}));

app.get('/ready', asyncHandler(async (req, res) => {
  try {
    await initializeDatabase();
    await initializeRedis();
    res.status(200).json({ 
      status: 'ready',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        redis: 'connected',
        socket: socketService ? 'initialized' : 'pending',
      }
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'not ready',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
}));

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 4000;

async function startServer() {
  try {
    logger.info('Starting server initialization...');
    
    // Initialize database
    logger.info('Connecting to database...');
    await initializeDatabase();
    logger.info('Database connected successfully');
    
    // Initialize Redis
    logger.info('Connecting to Redis...');
    await initializeRedis();
    logger.info('Redis connected successfully');
    
    // Initialize Socket service after database and Redis are ready
    logger.info('Initializing WebSocket service...');
    socketService = new SocketService(io);
    logger.info('WebSocket service initialized');
    
    // Connect notification service to socket service
    notificationService.setSocketService(socketService);
    
    // Start cron jobs
    logger.info('Starting cron jobs...');
    startCronJobs();
    
    httpServer.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📡 WebSocket server initialized with authentication`);
      logger.info(`🔒 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`📊 Monitoring available at /api/monitoring/metrics`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown handling
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

async function gracefulShutdown(signal: string) {
  logger.info(`${signal} received, starting graceful shutdown...`);
  
  // Stop accepting new connections
  httpServer.close(async () => {
    logger.info('HTTP server closed');
    
    try {
      // Close socket connections
      if (io) {
        io.close();
        logger.info('WebSocket server closed');
      }
      
      // Close database connections
      const { disconnectDatabase } = require('./config/database');
      await disconnectDatabase();
      logger.info('Database connections closed');
      
      // Close Redis connection
      const { disconnectRedis } = require('./config/redis');
      await disconnectRedis();
      logger.info('Redis connection closed');
      
      logger.info('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      logger.error('Error during graceful shutdown:', error);
      process.exit(1);
    }
  });
  
  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection:', reason);
  logger.error('Promise:', promise);
  // Don't immediately shutdown, give time to see the error
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

startServer();

// Export for use in other modules
export { app, io, socketService };

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      socketService?: SocketService;
    }
  }
}