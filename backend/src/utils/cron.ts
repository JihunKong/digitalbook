import cron from 'node-cron';
import { logger } from './logger';
import { getDatabase } from '../config/database';

export function startCronJobs() {
  // Clean up old chat sessions every day at 2 AM
  cron.schedule('0 2 * * *', async () => {
    try {
      logger.info('Starting daily cleanup job');
      const prisma = getDatabase();
      
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      // TODO: Implement chatMessage model cleanup when available
      // await prisma.chatMessage.deleteMany({
      //   where: {
      //     createdAt: {
      //       lt: thirtyDaysAgo,
      //     },
      //   },
      // });
      
      logger.info('Daily cleanup job completed');
    } catch (error) {
      logger.error('Daily cleanup job failed:', error);
    }
  });
  
  // Generate analytics report every Monday at 6 AM
  cron.schedule('0 6 * * 1', async () => {
    try {
      logger.info('Starting weekly analytics job');
      // Analytics generation logic here
      logger.info('Weekly analytics job completed');
    } catch (error) {
      logger.error('Weekly analytics job failed:', error);
    }
  });
  
  logger.info('Cron jobs initialized');
}