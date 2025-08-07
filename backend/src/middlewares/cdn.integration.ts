import { Request, Response, NextFunction } from 'express';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import { cdnService } from '../config/cdn.config';
import { cacheService, CacheService } from '../services/cache.service';
import { logger } from '../utils/logger';

export interface ImageTransformOptions {
  width?: number;
  height?: number;
  format?: 'jpeg' | 'png' | 'webp' | 'avif';
  quality?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
}

/**
 * Image optimization and CDN integration middleware
 */
export class ImageOptimizationMiddleware {
  private readonly CACHE_DIR = path.join(process.cwd(), 'cache/images');
  private readonly SUPPORTED_FORMATS = ['jpeg', 'jpg', 'png', 'webp', 'avif'];

  constructor() {
    this.ensureCacheDir();
  }

  private async ensureCacheDir() {
    try {
      await fs.mkdir(this.CACHE_DIR, { recursive: true });
    } catch (error) {
      logger.error('Failed to create image cache directory:', error);
    }
  }

  /**
   * Image transformation middleware
   */
  transformImage() {
    return async (req: Request, res: Response, next: NextFunction) => {
      // Skip if not an image request
      if (!this.isImageRequest(req.path)) {
        return next();
      }

      try {
        const options = this.parseTransformOptions(req.query);
        if (!options || Object.keys(options).length === 0) {
          return next();
        }

        const originalPath = path.join(process.cwd(), 'uploads', req.path);
        const cacheKey = this.generateCacheKey(req.path, options);
        const cachePath = path.join(this.CACHE_DIR, cacheKey);

        // Check if cached version exists
        try {
          const cachedImage = await fs.readFile(cachePath);
          const contentType = this.getContentType(options.format || path.extname(req.path).slice(1));
          
          res.setHeader('Content-Type', contentType);
          res.setHeader('X-Image-Optimized', 'true');
          res.setHeader('X-Cache', 'HIT');
          this.setCDNHeaders(res);
          
          return res.send(cachedImage);
        } catch {
          // Cache miss - continue processing
        }

        // Check if original file exists
        try {
          await fs.access(originalPath);
        } catch {
          return res.status(404).json({ error: 'Image not found' });
        }

        // Transform image
        const transformedImage = await this.processImage(originalPath, options);
        
        // Save to cache
        await fs.writeFile(cachePath, transformedImage);
        
        // Send response
        const contentType = this.getContentType(options.format || path.extname(req.path).slice(1));
        res.setHeader('Content-Type', contentType);
        res.setHeader('X-Image-Optimized', 'true');
        res.setHeader('X-Cache', 'MISS');
        this.setCDNHeaders(res);
        
        res.send(transformedImage);
      } catch (error) {
        logger.error('Image transformation error:', error);
        next();
      }
    };
  }

  /**
   * Process image with Sharp
   */
  private async processImage(
    imagePath: string,
    options: ImageTransformOptions
  ): Promise<Buffer> {
    let pipeline = sharp(imagePath);

    // Resize if dimensions provided
    if (options.width || options.height) {
      pipeline = pipeline.resize(options.width, options.height, {
        fit: options.fit || 'cover',
        withoutEnlargement: true,
      });
    }

    // Convert format if specified
    if (options.format) {
      switch (options.format) {
        case 'jpeg':
          pipeline = pipeline.jpeg({ quality: options.quality || 85 });
          break;
        case 'png':
          pipeline = pipeline.png({ quality: options.quality || 90 });
          break;
        case 'webp':
          pipeline = pipeline.webp({ quality: options.quality || 85 });
          break;
        case 'avif':
          pipeline = pipeline.avif({ quality: options.quality || 80 });
          break;
      }
    }

    return pipeline.toBuffer();
  }

  /**
   * Parse transform options from query params
   */
  private parseTransformOptions(query: any): ImageTransformOptions | null {
    const options: ImageTransformOptions = {};
    
    if (query.w) options.width = parseInt(query.w);
    if (query.h) options.height = parseInt(query.h);
    if (query.f && this.SUPPORTED_FORMATS.includes(query.f)) {
      options.format = query.f as any;
    }
    if (query.q) options.quality = parseInt(query.q);
    if (query.fit) options.fit = query.fit;

    return Object.keys(options).length > 0 ? options : null;
  }

  /**
   * Generate cache key for transformed image
   */
  private generateCacheKey(imagePath: string, options: ImageTransformOptions): string {
    const optionsStr = JSON.stringify(options);
    const hash = crypto.createHash('md5').update(imagePath + optionsStr).digest('hex');
    const ext = options.format || path.extname(imagePath).slice(1);
    return `${hash}.${ext}`;
  }

  /**
   * Check if request is for an image
   */
  private isImageRequest(path: string): boolean {
    const ext = path.split('.').pop()?.toLowerCase();
    return this.SUPPORTED_FORMATS.includes(ext || '');
  }

  /**
   * Get content type for image format
   */
  private getContentType(format: string): string {
    const types: Record<string, string> = {
      jpeg: 'image/jpeg',
      jpg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      avif: 'image/avif',
    };
    return types[format] || 'application/octet-stream';
  }

  /**
   * Set CDN-appropriate headers
   */
  private setCDNHeaders(res: Response) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Vary', 'Accept');
    res.setHeader('X-Content-Type-Options', 'nosniff');
  }
}

/**
 * Asset version management
 */
export class AssetVersionManager {
  private versionMap: Map<string, string> = new Map();
  private readonly VERSION_FILE = path.join(process.cwd(), 'asset-versions.json');

  async loadVersions() {
    try {
      const data = await fs.readFile(this.VERSION_FILE, 'utf-8');
      const versions = JSON.parse(data);
      this.versionMap = new Map(Object.entries(versions));
    } catch {
      // Version file doesn't exist yet
    }
  }

  async saveVersions() {
    const versions = Object.fromEntries(this.versionMap);
    await fs.writeFile(this.VERSION_FILE, JSON.stringify(versions, null, 2));
  }

  async updateVersion(assetPath: string, content: Buffer): Promise<string> {
    const hash = crypto.createHash('md5').update(content).digest('hex').substring(0, 8);
    this.versionMap.set(assetPath, hash);
    await this.saveVersions();
    return hash;
  }

  getVersion(assetPath: string): string | undefined {
    return this.versionMap.get(assetPath);
  }

  /**
   * Middleware to inject version into asset URLs
   */
  versionMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const originalRender = res.render;
      
      res.render = (view: string, options?: any, callback?: any) => {
        const enhancedOptions = {
          ...options,
          assetVersion: (path: string) => {
            const version = this.getVersion(path);
            return version ? `${path}?v=${version}` : path;
          },
          cdnAsset: (path: string, transformOptions?: any) => {
            const version = this.getVersion(path);
            let url = cdnService.getCDNUrl(path, transformOptions);
            if (version) {
              url += `${url.includes('?') ? '&' : '?'}v=${version}`;
            }
            return url;
          },
        };
        
        return originalRender.call(res, view, enhancedOptions, callback);
      };
      
      next();
    };
  }
}

// Export instances
export const imageOptimization = new ImageOptimizationMiddleware();
export const assetVersionManager = new AssetVersionManager();

// Export middleware functions
export const imageTransformMiddleware = imageOptimization.transformImage();
export const assetVersionMiddleware = assetVersionManager.versionMiddleware();