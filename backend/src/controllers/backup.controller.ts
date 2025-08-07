import { Request, Response } from 'express';
import { backupService, BackupInfo } from '../services/backup.service';

export class BackupController {
  /**
   * Create a manual backup
   */
  async createBackup(req: Request, res: Response): Promise<void> {
    try {
      const backup = await backupService.createBackup('manual');
      
      res.status(201).json({
        success: true,
        message: 'Backup created successfully',
        data: backup
      });
    } catch (error) {
      console.error('Backup creation failed:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create backup',
        error: (error as Error).message
      });
    }
  }

  /**
   * List all available backups
   */
  async listBackups(req: Request, res: Response): Promise<void> {
    try {
      const backups = await backupService.listBackups();
      
      res.status(200).json({
        success: true,
        data: backups,
        count: backups.length
      });
    } catch (error) {
      console.error('Failed to list backups:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to list backups',
        error: (error as Error).message
      });
    }
  }

  /**
   * Restore from a backup
   */
  async restoreBackup(req: Request, res: Response): Promise<void> {
    try {
      const { filename } = req.params;
      
      if (!filename) {
        res.status(400).json({
          success: false,
          message: 'Backup filename is required'
        });
        return;
      }

      await backupService.restoreBackup(filename);
      
      res.status(200).json({
        success: true,
        message: 'Database restored successfully'
      });
    } catch (error) {
      console.error('Backup restoration failed:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to restore backup',
        error: (error as Error).message
      });
    }
  }

  /**
   * Delete a backup
   */
  async deleteBackup(req: Request, res: Response): Promise<void> {
    try {
      const { filename } = req.params;
      
      if (!filename) {
        res.status(400).json({
          success: false,
          message: 'Backup filename is required'
        });
        return;
      }

      await backupService.deleteBackup(filename);
      
      res.status(200).json({
        success: true,
        message: 'Backup deleted successfully'
      });
    } catch (error) {
      console.error('Backup deletion failed:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete backup',
        error: (error as Error).message
      });
    }
  }

  /**
   * Get backup statistics
   */
  async getBackupStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await backupService.getBackupStats();
      
      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Failed to get backup stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get backup statistics',
        error: (error as Error).message
      });
    }
  }

  /**
   * Cleanup old backups manually
   */
  async cleanupBackups(req: Request, res: Response): Promise<void> {
    try {
      await backupService.cleanupOldBackups();
      
      res.status(200).json({
        success: true,
        message: 'Old backups cleaned up successfully'
      });
    } catch (error) {
      console.error('Backup cleanup failed:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cleanup old backups',
        error: (error as Error).message
      });
    }
  }

  /**
   * Download a backup file
   */
  async downloadBackup(req: Request, res: Response): Promise<void> {
    try {
      const { filename } = req.params;
      
      if (!filename) {
        res.status(400).json({
          success: false,
          message: 'Backup filename is required'
        });
        return;
      }

      const backupPath = `${process.env.BACKUP_LOCATION || '/app/backups'}/${filename}`;
      
      res.download(backupPath, filename, (error) => {
        if (error) {
          console.error('Backup download failed:', error);
          res.status(500).json({
            success: false,
            message: 'Failed to download backup',
            error: error.message
          });
        }
      });
    } catch (error) {
      console.error('Backup download failed:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to download backup',
        error: (error as Error).message
      });
    }
  }
}

export const backupController = new BackupController();