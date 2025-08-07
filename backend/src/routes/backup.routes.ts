import { Router } from 'express';
import { backupController } from '../controllers/backup.controller';
import { authenticateToken } from '../middlewares/auth';
import { adminOnly } from '../middlewares/adminOnly';

const router = Router();

// All backup routes require admin authentication
router.use(authenticateToken);
router.use(adminOnly);

/**
 * @route POST /api/backup
 * @desc Create a manual backup
 * @access Admin only
 */
router.post('/', backupController.createBackup);

/**
 * @route GET /api/backup
 * @desc List all available backups
 * @access Admin only
 */
router.get('/', backupController.listBackups);

/**
 * @route GET /api/backup/stats
 * @desc Get backup statistics
 * @access Admin only
 */
router.get('/stats', backupController.getBackupStats);

/**
 * @route POST /api/backup/cleanup
 * @desc Cleanup old backups manually
 * @access Admin only
 */
router.post('/cleanup', backupController.cleanupBackups);

/**
 * @route GET /api/backup/download/:filename
 * @desc Download a backup file
 * @access Admin only
 */
router.get('/download/:filename', backupController.downloadBackup);

/**
 * @route POST /api/backup/restore/:filename
 * @desc Restore from a backup
 * @access Admin only
 */
router.post('/restore/:filename', backupController.restoreBackup);

/**
 * @route DELETE /api/backup/:filename
 * @desc Delete a backup
 * @access Admin only
 */
router.delete('/:filename', backupController.deleteBackup);

export default router;