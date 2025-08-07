import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

let prisma: PrismaClient;

export async function initializeDatabase() {
  if (!prisma) {
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    });
  }
  
  try {
    await prisma.$connect();
    logger.info('Database connected successfully');
  } catch (error) {
    logger.error('Database connection failed:', error);
    logger.warn('Continuing without database connection for development...');
    // 개발 중에는 DB 연결 실패 시에도 서버 시작
    return;
  }
}

export function getDatabase() {
  if (!prisma) {
    throw new Error('Database not initialized');
  }
  return prisma;
}

export async function disconnectDatabase() {
  if (prisma) {
    await prisma.$disconnect();
  }
}