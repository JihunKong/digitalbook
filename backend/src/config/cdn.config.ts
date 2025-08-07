import { Request, Response, NextFunction } from 'express';
import path from 'path';
import crypto from 'crypto';

export interface CDNConfig {
  enabled: boolean;
  baseUrl: string;
  staticDomain?: string;
  imageOptimization?: {
    enabled: boolean;
    quality: number;
    formats: string[];
  };
  cacheControl: {
    maxAge: number;
    sMaxAge?: number;
    staleWhileRevalidate?: number;
  };
  assetTypes: {
    images: string[];
    videos: string[];
    documents: string[];
    fonts: string[];
  };
}

const defaultCDNConfig: CDNConfig = {
  enabled: process.env.CDN_ENABLED === 'true',
  baseUrl: process.env.CDN_BASE_URL || 'https://cdn.classapphub.com',
  staticDomain: process.env.STATIC_DOMAIN,
  imageOptimization: {
    enabled: true,
    quality: 85,
    formats: ['webp', 'avif'],
  },
  cacheControl: {
    maxAge: 31536000, // 1 year
    sMaxAge: 86400, // 1 day
    staleWhileRevalidate: 60,
  },
  assetTypes: {
    images: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.svg'],
    videos: ['.mp4', '.webm', '.ogg'],
    documents: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'],
    fonts: ['.woff', '.woff2', '.ttf', '.otf'],
  },
};

export class CDNService {
  private config: CDNConfig;

  constructor(config: CDNConfig = defaultCDNConfig) {
    this.config = config;
  }

  /**
   * Generate CDN URL for an asset
   */
  getCDNUrl(assetPath: string, options?: {
    width?: number;
    height?: number;
    format?: string;
    quality?: number;
  }): string {
    if (!this.config.enabled) {
      return assetPath;
    }

    // Handle absolute URLs
    if (assetPath.startsWith('http://') || assetPath.startsWith('https://')) {
      return assetPath;
    }

    // Build CDN URL
    let cdnUrl = `${this.config.baseUrl}${assetPath}`;

    // Add image transformation parameters if applicable
    if (options && this.isImage(assetPath)) {
      const params = new URLSearchParams();
      
      if (options.width) params.append('w', options.width.toString());
      if (options.height) params.append('h', options.height.toString());
      if (options.format) params.append('f', options.format);
      if (options.quality) params.append('q', options.quality.toString());

      if (params.toString()) {
        cdnUrl += `?${params.toString()}`;
      }
    }

    return cdnUrl;
  }

  /**
   * Generate versioned asset URL
   */
  getVersionedUrl(assetPath: string, version?: string): string {
    const v = version || this.generateVersion(assetPath);
    const url = this.getCDNUrl(assetPath);
    
    return `${url}${url.includes('?') ? '&' : '?'}v=${v}`;
  }

  /**
   * Generate asset version based on content or timestamp
   */
  private generateVersion(assetPath: string): string {
    // In production, this could be based on file hash or build version
    return crypto
      .createHash('md5')
      .update(assetPath + Date.now())
      .digest('hex')
      .substring(0, 8);
  }

  /**
   * Check if file is an image
   */
  private isImage(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    return this.config.assetTypes.images.includes(ext);
  }

  /**
   * Get appropriate cache headers for asset type
   */
  getCacheHeaders(filePath: string): Record<string, string> {
    const ext = path.extname(filePath).toLowerCase();
    const { cacheControl } = this.config;
    
    let cacheDirective = `public, max-age=${cacheControl.maxAge}`;
    
    if (cacheControl.sMaxAge) {
      cacheDirective += `, s-maxage=${cacheControl.sMaxAge}`;
    }
    
    if (cacheControl.staleWhileRevalidate) {
      cacheDirective += `, stale-while-revalidate=${cacheControl.staleWhileRevalidate}`;
    }

    // Shorter cache for dynamic content
    if (this.isDynamicAsset(ext)) {
      cacheDirective = 'public, max-age=3600, s-maxage=60';
    }

    return {
      'Cache-Control': cacheDirective,
      'X-Content-Type-Options': 'nosniff',
    };
  }

  /**
   * Check if asset should have shorter cache
   */
  private isDynamicAsset(ext: string): boolean {
    const dynamicExtensions = ['.json', '.xml', '.txt'];
    return dynamicExtensions.includes(ext);
  }

  /**
   * Middleware to add CDN headers
   */
  cdnMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      // Add CDN URL helper to response locals
      res.locals.cdnUrl = (path: string, options?: any) => this.getCDNUrl(path, options);
      res.locals.versionedUrl = (path: string, version?: string) => this.getVersionedUrl(path, version);

      // Set security headers
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'SAMEORIGIN');
      
      next();
    };
  }

  /**
   * Static file serving middleware with CDN headers
   */
  staticMiddleware(staticPath: string) {
    return (req: Request, res: Response, next: NextFunction) => {
      // Skip if not a static file request
      if (!this.isStaticFileRequest(req.path)) {
        return next();
      }

      // Set cache headers
      const headers = this.getCacheHeaders(req.path);
      Object.entries(headers).forEach(([key, value]) => {
        res.setHeader(key, value);
      });

      // Add CORS headers for CDN
      if (this.config.staticDomain) {
        res.setHeader('Access-Control-Allow-Origin', this.config.staticDomain);
        res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD');
        res.setHeader('Access-Control-Max-Age', '86400');
      }

      next();
    };
  }

  /**
   * Check if request is for static file
   */
  private isStaticFileRequest(path: string): boolean {
    const ext = path.includes('.') ? path.split('.').pop()?.toLowerCase() : '';
    if (!ext) return false;

    const allExtensions = [
      ...this.config.assetTypes.images,
      ...this.config.assetTypes.videos,
      ...this.config.assetTypes.documents,
      ...this.config.assetTypes.fonts,
      '.js', '.css', '.json', '.xml', '.txt',
    ];

    return allExtensions.some(e => e === `.${ext}`);
  }

  /**
   * Generate image srcset for responsive images
   */
  generateSrcSet(imagePath: string, sizes: number[] = [320, 640, 960, 1280, 1920]): string {
    if (!this.config.enabled || !this.isImage(imagePath)) {
      return '';
    }

    return sizes
      .map(size => `${this.getCDNUrl(imagePath, { width: size })} ${size}w`)
      .join(', ');
  }

  /**
   * Preload critical assets
   */
  getPreloadLinks(assets: Array<{ path: string; as: string }>): string[] {
    return assets.map(({ path, as }) => {
      const url = this.getCDNUrl(path);
      return `<link rel="preload" href="${url}" as="${as}">`;
    });
  }
}

// Export singleton instance
export const cdnService = new CDNService();

// Express middleware helper
export const cdnMiddleware = cdnService.cdnMiddleware();
export const staticCDNMiddleware = (staticPath: string) => cdnService.staticMiddleware(staticPath);