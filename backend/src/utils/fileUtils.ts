import path from 'path';
import fs from 'fs/promises';
import { logger } from './logger';

export const FileUtils = {
  // File type mappings
  MIME_TYPES: {
    // Images
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    // Videos
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.ogg': 'video/ogg',
    '.mov': 'video/quicktime',
    // Documents
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    // Text
    '.txt': 'text/plain',
    '.csv': 'text/csv',
    '.md': 'text/markdown',
  },

  // Get MIME type from file extension
  getMimeType(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    return this.MIME_TYPES[ext] || 'application/octet-stream';
  },

  // Validate file extension
  isValidFileType(filename: string, allowedTypes: string[]): boolean {
    const mimeType = this.getMimeType(filename);
    return allowedTypes.includes(mimeType);
  },

  // Get human-readable file size
  formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  },

  // Sanitize filename
  sanitizeFilename(filename: string): string {
    // Remove special characters and spaces
    return filename
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_{2,}/g, '_')
      .toLowerCase();
  },

  // Ensure directory exists
  async ensureDirectory(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      logger.error(`Failed to create directory ${dirPath}:`, error);
      throw error;
    }
  },

  // Delete file if exists
  async deleteFile(filePath: string): Promise<boolean> {
    try {
      await fs.unlink(filePath);
      return true;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        // File doesn't exist
        return false;
      }
      logger.error(`Failed to delete file ${filePath}:`, error);
      throw error;
    }
  },

  // Check if file exists
  async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  },

  // Get file stats
  async getFileStats(filePath: string) {
    try {
      const stats = await fs.stat(filePath);
      return {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory(),
      };
    } catch (error) {
      logger.error(`Failed to get file stats for ${filePath}:`, error);
      throw error;
    }
  },

  // Generate unique filename
  generateUniqueFilename(originalName: string, prefix?: string): string {
    const ext = path.extname(originalName);
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const sanitized = this.sanitizeFilename(path.basename(originalName, ext));
    
    return `${prefix ? prefix + '_' : ''}${sanitized}_${timestamp}_${random}${ext}`;
  },
};