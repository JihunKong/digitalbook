import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as cron from 'node-cron';
import { PrismaClient } from '@prisma/client';

const execAsync = promisify(exec);
const prisma = new PrismaClient();

export interface BackupConfig {
  schedule: string;
  retention: number; // days
  location: string;
  compress: boolean;
  notifyOnFailure: boolean;
}

export interface BackupInfo {
  id: string;
  filename: string;
  size: number;
  createdAt: Date;
  type: 'manual' | 'scheduled';
  status: 'success' | 'failed' | 'in_progress';
  error?: string;
}

export class BackupService {
  private config: BackupConfig;
  private backupDir: string;

  constructor(config?: Partial<BackupConfig>) {
    this.config = {
      schedule: '0 2 * * *', // Daily at 2 AM
      retention: 30, // 30 days
      location: process.env.BACKUP_LOCATION || '/app/backups',
      compress: true,
      notifyOnFailure: true,
      ...config
    };
    
    this.backupDir = this.config.location;
    this.ensureBackupDirectory();
    this.scheduleBackups();
  }

  private async ensureBackupDirectory(): Promise<void> {
    try {
      await fs.access(this.backupDir);
    } catch {
      await fs.mkdir(this.backupDir, { recursive: true });
    }
  }

  private scheduleBackups(): void {
    cron.schedule(this.config.schedule, async () => {
      console.log('🔄 Starting scheduled backup...');
      try {
        await this.createBackup('scheduled');
        console.log('✅ Scheduled backup completed successfully');
      } catch (error) {
        console.error('❌ Scheduled backup failed:', error);
        if (this.config.notifyOnFailure) {
          // TODO: Implement notification service integration
          await this.notifyBackupFailure(error as Error);
        }
      }
    });

    // Cleanup old backups daily
    cron.schedule('0 3 * * *', async () => {
      await this.cleanupOldBackups();
    });
  }

  async createBackup(type: 'manual' | 'scheduled' = 'manual'): Promise<BackupInfo> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${timestamp}.sql${this.config.compress ? '.gz' : ''}`;
    const filepath = path.join(this.backupDir, filename);

    const backupInfo: BackupInfo = {
      id: `backup_${Date.now()}`,
      filename,
      size: 0,
      createdAt: new Date(),
      type,
      status: 'in_progress'
    };

    try {
      // Create database dump
      const dbUrl = process.env.DATABASE_URL;
      if (!dbUrl) {
        throw new Error('DATABASE_URL not configured');
      }

      const url = new URL(dbUrl);
      const dbHost = url.hostname;
      const dbPort = url.port || '5432';
      const dbName = url.pathname.slice(1);
      const dbUser = url.username;
      const dbPassword = url.password;

      // Set environment variable for pg_dump
      const env = {
        ...process.env,
        PGPASSWORD: dbPassword
      };

      let command = `pg_dump -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} --no-password --verbose`;
      
      if (this.config.compress) {
        command += ` | gzip > ${filepath}`;
      } else {
        command += ` > ${filepath}`;
      }

      await execAsync(command, { env });

      // Get file size
      const stats = await fs.stat(filepath);
      backupInfo.size = stats.size;
      backupInfo.status = 'success';

      // Store backup metadata in database
      await this.storeBackupMetadata(backupInfo);

      console.log(`✅ Backup created: ${filename} (${this.formatFileSize(stats.size)})`);
      
      return backupInfo;
    } catch (error) {
      backupInfo.status = 'failed';
      backupInfo.error = (error as Error).message;
      
      // Clean up failed backup file
      try {
        await fs.unlink(filepath);
      } catch {}

      await this.storeBackupMetadata(backupInfo);
      throw error;
    }
  }

  async restoreBackup(filename: string): Promise<void> {
    const filepath = path.join(this.backupDir, filename);
    
    try {
      // Check if backup file exists
      await fs.access(filepath);

      const dbUrl = process.env.DATABASE_URL;
      if (!dbUrl) {
        throw new Error('DATABASE_URL not configured');
      }

      const url = new URL(dbUrl);
      const dbHost = url.hostname;
      const dbPort = url.port || '5432';
      const dbName = url.pathname.slice(1);
      const dbUser = url.username;
      const dbPassword = url.password;

      const env = {
        ...process.env,
        PGPASSWORD: dbPassword
      };

      // Disconnect all active connections first
      await prisma.$disconnect();

      let command: string;
      if (filename.endsWith('.gz')) {
        command = `gunzip -c ${filepath} | psql -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName}`;
      } else {
        command = `psql -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} < ${filepath}`;
      }

      await execAsync(command, { env });

      console.log(`✅ Database restored from backup: ${filename}`);
    } catch (error) {
      console.error(`❌ Restore failed:`, error);
      throw error;
    }
  }

  async listBackups(): Promise<BackupInfo[]> {
    try {
      const files = await fs.readdir(this.backupDir);
      const backups: BackupInfo[] = [];

      for (const file of files) {
        if (file.startsWith('backup-') && (file.endsWith('.sql') || file.endsWith('.sql.gz'))) {
          const filepath = path.join(this.backupDir, file);
          const stats = await fs.stat(filepath);
          
          // Try to get metadata from database
          const metadata = await this.getBackupMetadata(file);
          
          backups.push({
            id: metadata?.id || `backup_${stats.mtimeMs}`,
            filename: file,
            size: stats.size,
            createdAt: metadata?.createdAt || stats.mtime,
            type: metadata?.type || 'manual',
            status: metadata?.status || 'success'
          });
        }
      }

      return backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      console.error('Error listing backups:', error);
      return [];
    }
  }

  async deleteBackup(filename: string): Promise<void> {
    const filepath = path.join(this.backupDir, filename);
    
    try {
      await fs.unlink(filepath);
      await this.deleteBackupMetadata(filename);
      console.log(`🗑️ Backup deleted: ${filename}`);
    } catch (error) {
      console.error(`Error deleting backup ${filename}:`, error);
      throw error;
    }
  }

  async cleanupOldBackups(): Promise<void> {
    const backups = await this.listBackups();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.retention);

    let deletedCount = 0;
    for (const backup of backups) {
      if (backup.createdAt < cutoffDate) {
        try {
          await this.deleteBackup(backup.filename);
          deletedCount++;
        } catch (error) {
          console.error(`Failed to delete old backup ${backup.filename}:`, error);
        }
      }
    }

    if (deletedCount > 0) {
      console.log(`🧹 Cleaned up ${deletedCount} old backups`);
    }
  }

  async getBackupStats(): Promise<{
    totalBackups: number;
    totalSize: number;
    oldestBackup: Date | null;
    newestBackup: Date | null;
    successRate: number;
  }> {
    const backups = await this.listBackups();
    
    if (backups.length === 0) {
      return {
        totalBackups: 0,
        totalSize: 0,
        oldestBackup: null,
        newestBackup: null,
        successRate: 0
      };
    }

    const totalSize = backups.reduce((sum, backup) => sum + backup.size, 0);
    const successfulBackups = backups.filter(b => b.status === 'success').length;
    const successRate = (successfulBackups / backups.length) * 100;

    return {
      totalBackups: backups.length,
      totalSize,
      oldestBackup: backups[backups.length - 1].createdAt,
      newestBackup: backups[0].createdAt,
      successRate
    };
  }

  private async storeBackupMetadata(backup: BackupInfo): Promise<void> {
    try {
      // Store in a simple JSON file for now
      const metadataPath = path.join(this.backupDir, 'metadata.json');
      let metadata: BackupInfo[] = [];
      
      try {
        const data = await fs.readFile(metadataPath, 'utf-8');
        metadata = JSON.parse(data);
      } catch {}

      metadata = metadata.filter(m => m.filename !== backup.filename);
      metadata.push(backup);

      await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    } catch (error) {
      console.error('Failed to store backup metadata:', error);
    }
  }

  private async getBackupMetadata(filename: string): Promise<BackupInfo | null> {
    try {
      const metadataPath = path.join(this.backupDir, 'metadata.json');
      const data = await fs.readFile(metadataPath, 'utf-8');
      const metadata: BackupInfo[] = JSON.parse(data);
      
      return metadata.find(m => m.filename === filename) || null;
    } catch {
      return null;
    }
  }

  private async deleteBackupMetadata(filename: string): Promise<void> {
    try {
      const metadataPath = path.join(this.backupDir, 'metadata.json');
      const data = await fs.readFile(metadataPath, 'utf-8');
      let metadata: BackupInfo[] = JSON.parse(data);
      
      metadata = metadata.filter(m => m.filename !== filename);
      await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    } catch (error) {
      console.error('Failed to delete backup metadata:', error);
    }
  }

  private async notifyBackupFailure(error: Error): Promise<void> {
    // TODO: Implement notification service integration
    console.error('🚨 Backup failure notification:', error.message);
  }

  private formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }
}

export const backupService = new BackupService();