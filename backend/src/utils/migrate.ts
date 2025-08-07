import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

async function migrate() {
  const prisma = new PrismaClient();
  
  try {
    logger.info('Starting database migration...');
    
    // Run Prisma migrations
    await prisma.$executeRawUnsafe(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    `);
    
    logger.info('Database migration completed successfully');
  } catch (error) {
    logger.error('Database migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  migrate();
}