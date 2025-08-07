type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: string;
  url: string;
  userAgent: string;
}

class Logger {
  private logBuffer: LogEntry[] = [];
  private flushInterval: number = 5000; // 5 seconds
  private maxBufferSize: number = 50;
  private flushTimer: NodeJS.Timeout | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.startFlushTimer();
      
      // Flush logs before page unload
      window.addEventListener('beforeunload', () => {
        this.flush();
      });
    }
  }

  private startFlushTimer() {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  private createLogEntry(level: LogLevel, message: string, data?: any): LogEntry {
    return {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    };
  }

  private log(level: LogLevel, message: string, data?: any) {
    const entry = this.createLogEntry(level, message, data);
    
    // Console log in development
    if (process.env.NODE_ENV === 'development') {
      const consoleMethod = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';
      console[consoleMethod](`[${level.toUpperCase()}]`, message, data || '');
    }

    // Add to buffer
    this.logBuffer.push(entry);

    // Flush if buffer is full
    if (this.logBuffer.length >= this.maxBufferSize) {
      this.flush();
    }

    // Immediately send error logs
    if (level === 'error') {
      this.flush();
    }
  }

  debug(message: string, data?: any) {
    this.log('debug', message, data);
  }

  info(message: string, data?: any) {
    this.log('info', message, data);
  }

  warn(message: string, data?: any) {
    this.log('warn', message, data);
  }

  error(message: string, data?: any) {
    this.log('error', message, data);
  }

  async flush() {
    if (this.logBuffer.length === 0) return;

    const logsToSend = [...this.logBuffer];
    this.logBuffer = [];

    try {
      await fetch('/api/monitoring/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          logs: logsToSend,
        }),
      });
    } catch (error) {
      // If sending fails, add back to buffer (but prevent infinite loop)
      if (logsToSend[0]?.message !== 'Failed to send logs') {
        console.error('Failed to send logs:', error);
        // Only re-add non-error logs to prevent infinite loop
        this.logBuffer = [...logsToSend.filter(log => log.level !== 'error'), ...this.logBuffer];
      }
    }
  }

  // Performance monitoring
  measurePerformance(name: string, fn: () => any): any {
    const start = performance.now();
    try {
      const result = fn();
      const duration = performance.now() - start;
      this.info('Performance measurement', {
        name,
        duration: Math.round(duration * 100) / 100,
        unit: 'ms',
      });
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.error('Performance measurement failed', {
        name,
        duration: Math.round(duration * 100) / 100,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  async measureAsyncPerformance<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      this.info('Async performance measurement', {
        name,
        duration: Math.round(duration * 100) / 100,
        unit: 'ms',
      });
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.error('Async performance measurement failed', {
        name,
        duration: Math.round(duration * 100) / 100,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  // User action tracking
  trackUserAction(action: string, details?: any) {
    this.info('User action', {
      action,
      details,
      timestamp: new Date().toISOString(),
    });
  }

  // API call logging
  logApiCall(method: string, url: string, status?: number, duration?: number) {
    const level = status && status >= 400 ? 'error' : 'info';
    this.log(level, 'API call', {
      method,
      url,
      status,
      duration,
    });
  }
}

export const logger = new Logger();