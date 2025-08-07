import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

// 환경변수 검증 (가장 먼저 실행)
import { config, envValidator } from './config/env.validation';

// 데이터베이스 및 Redis 연결
import { getDatabase } from './config/database';
import { getRedis } from './config/redis';

// 미들웨어
import { errorHandler } from './middlewares/errorHandler';
import { loggerMiddleware } from './middlewares/logger';
import { rateLimiter } from './middlewares/rateLimiter';
import { performanceMonitor } from './middlewares/performanceMonitor';

// 라우트
import routes from './routes';

// 유틸리티
import { logger } from './utils/logger';
import { initializeCronJobs } from './utils/cron';

class UnifiedServer {
  private app: Express;
  private server: any;
  private io: SocketIOServer;
  private port: number;

  constructor() {
    this.app = express();
    this.port = config.PORT;
    this.server = createServer(this.app);
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: config.CORS_ORIGIN.split(','),
        credentials: true
      }
    });
  }

  /**
   * 미들웨어 설정
   */
  private setupMiddlewares() {
    // 보안 헤더
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    }));

    // CORS 설정
    this.app.use(cors({
      origin: (origin, callback) => {
        // 허용된 origin 목록
        const allowedOrigins = config.CORS_ORIGIN.split(',').map(o => o.trim());
        
        // origin이 없는 경우 (같은 도메인) 허용
        if (!origin) return callback(null, true);
        
        // 개발 환경에서는 모든 localhost 허용
        if (config.NODE_ENV === 'development' && origin.includes('localhost')) {
          return callback(null, true);
        }
        
        // 허용된 origin인지 확인
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        
        // 허용되지 않은 origin
        callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Requested-With'],
      exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
      maxAge: 86400 // 24시간
    }));

    // Body 파싱
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // 쿠키 파싱
    this.app.use(cookieParser(config.COOKIE_SECRET));

    // 압축
    this.app.use(compression());

    // 로깅
    this.app.use(loggerMiddleware);

    // 성능 모니터링 (개발 환경)
    if (config.NODE_ENV === 'development') {
      this.app.use(performanceMonitor);
    }

    // Rate Limiting
    this.app.use('/api/', rateLimiter);

    // 신뢰할 수 있는 프록시 설정 (프로덕션)
    if (config.NODE_ENV === 'production') {
      this.app.set('trust proxy', 1);
    }
  }

  /**
   * 라우트 설정
   */
  private setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: config.NODE_ENV,
        version: process.env.npm_package_version || '1.0.0'
      });
    });

    // API 라우트
    this.app.use('/api', routes);

    // 정적 파일 서빙 (업로드된 파일)
    this.app.use('/uploads', express.static(config.UPLOAD_DIR));

    // 404 핸들러
    this.app.use((req, res) => {
      res.status(404).json({
        success: false,
        message: 'Resource not found',
        path: req.path
      });
    });

    // 에러 핸들러 (마지막에 위치)
    this.app.use(errorHandler);
  }

  /**
   * WebSocket 설정
   */
  private setupWebSocket() {
    // WebSocket 인증 미들웨어
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || 
                     socket.handshake.headers.authorization?.replace('Bearer ', '');

        if (!token) {
          return next(new Error('Authentication required'));
        }

        // JWT 검증 로직
        // TODO: JWT 검증 미들웨어 재사용
        
        next();
      } catch (error) {
        next(new Error('Authentication failed'));
      }
    });

    // WebSocket 이벤트 핸들러
    this.io.on('connection', (socket) => {
      logger.info(`WebSocket client connected: ${socket.id}`);

      // 룸 참여
      socket.on('join:class', async (classCode) => {
        socket.join(`class:${classCode}`);
        logger.info(`Socket ${socket.id} joined class:${classCode}`);
      });

      // 메시지 브로드캐스트
      socket.on('message:send', async (data) => {
        const { classCode, message } = data;
        socket.to(`class:${classCode}`).emit('message:receive', {
          ...message,
          timestamp: new Date().toISOString()
        });
      });

      // 연결 종료
      socket.on('disconnect', () => {
        logger.info(`WebSocket client disconnected: ${socket.id}`);
      });
    });
  }

  /**
   * 데이터베이스 연결
   */
  private async connectDatabase() {
    try {
      const prisma = getDatabase();
      await prisma.$connect();
      logger.info('✅ Database connected successfully');

      // 연결 테스트
      await prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      logger.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  /**
   * Redis 연결
   */
  private async connectRedis() {
    try {
      const redis = getRedis();
      await redis.ping();
      logger.info('✅ Redis connected successfully');
    } catch (error) {
      logger.error('❌ Redis connection failed:', error);
      throw error;
    }
  }

  /**
   * 서버 시작
   */
  async start() {
    try {
      // 환경변수 정보 출력
      envValidator.printInfo();

      // 데이터베이스 연결
      await this.connectDatabase();

      // Redis 연결
      await this.connectRedis();

      // 미들웨어 설정
      this.setupMiddlewares();

      // 라우트 설정
      this.setupRoutes();

      // WebSocket 설정
      this.setupWebSocket();

      // Cron Jobs 초기화 (프로덕션만)
      if (config.NODE_ENV === 'production') {
        initializeCronJobs();
      }

      // 서버 시작
      this.server.listen(this.port, () => {
        logger.info('=================================');
        logger.info('🚀 Server Started Successfully');
        logger.info('=================================');
        logger.info(`Environment: ${config.NODE_ENV}`);
        logger.info(`API Server: http://localhost:${this.port}`);
        logger.info(`WebSocket: ws://localhost:${this.port}`);
        logger.info(`API Docs: http://localhost:${this.port}/api-docs`);
        logger.info('=================================');
      });

      // Graceful shutdown
      this.setupGracefulShutdown();

    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  /**
   * Graceful shutdown 설정
   */
  private setupGracefulShutdown() {
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received. Starting graceful shutdown...`);

      // 새로운 요청 거부
      this.server.close(() => {
        logger.info('HTTP server closed');
      });

      // WebSocket 연결 종료
      this.io.close(() => {
        logger.info('WebSocket server closed');
      });

      // 데이터베이스 연결 종료
      const prisma = getDatabase();
      await prisma.$disconnect();
      logger.info('Database disconnected');

      // Redis 연결 종료
      const redis = getRedis();
      redis.disconnect();
      logger.info('Redis disconnected');

      logger.info('Graceful shutdown completed');
      process.exit(0);
    };

    // 시그널 핸들러 등록
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // 에러 핸들러
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      shutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      shutdown('unhandledRejection');
    });
  }
}

// 서버 인스턴스 생성 및 시작
const server = new UnifiedServer();
server.start().catch((error) => {
  logger.error('Server startup failed:', error);
  process.exit(1);
});

export default server;