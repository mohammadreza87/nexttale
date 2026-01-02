import type { LogEntry, ErrorInfo } from './types';

/**
 * Centralized error logging with monitoring integration
 */
class ErrorLogger {
  private isDev = import.meta.env.DEV;
  private isEnabled = import.meta.env.VITE_ERROR_REPORTING_ENABLED !== 'false';
  private buffer: LogEntry[] = [];
  private flushInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // Flush buffer every 10 seconds in production
    if (!this.isDev && typeof window !== 'undefined') {
      this.flushInterval = setInterval(() => this.flush(), 10000);
    }
  }

  /**
   * Log an entry
   */
  log(entry: Omit<LogEntry, 'timestamp' | 'url'>): void {
    const fullEntry: LogEntry = {
      ...entry,
      timestamp: new Date(),
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    };

    // Always log to console in dev
    if (this.isDev) {
      this.logToConsole(fullEntry);
    }

    // Buffer for production monitoring
    if (this.isEnabled && !this.isDev) {
      this.buffer.push(fullEntry);

      // Immediate flush for fatal/error
      if (entry.level === 'fatal' || entry.level === 'error') {
        this.flush();
      }
    }
  }

  private logToConsole(entry: LogEntry): void {
    const prefix = `[${entry.level.toUpperCase()}]`;
    const args: unknown[] = [prefix, entry.message];

    if (entry.error) args.push(entry.error);
    if (entry.context && Object.keys(entry.context).length > 0) {
      args.push(entry.context);
    }

    switch (entry.level) {
      case 'fatal':
      case 'error':
        console.error(...args);
        break;
      case 'warning':
        console.warn(...args);
        break;
      default:
        // Use console.log for info level (allowed by eslint config)
        // eslint-disable-next-line no-console
        console.log(...args);
    }
  }

  /**
   * Flush buffered logs to monitoring service
   */
  private flush(): void {
    if (this.buffer.length === 0) return;

    const entries = this.buffer.splice(0, this.buffer.length);

    // Send to Datadog RUM if available
    if (typeof window !== 'undefined' && (window as unknown as { DD_RUM?: unknown }).DD_RUM) {
      const ddRum = (window as unknown as { DD_RUM: { addError: (e: Error, ctx: object) => void; addAction: (msg: string, ctx: object) => void } }).DD_RUM;
      entries.forEach((entry) => {
        if (entry.error) {
          ddRum.addError(entry.error, {
            level: entry.level,
            message: entry.message,
            ...entry.context,
          });
        } else {
          ddRum.addAction(entry.message, {
            level: entry.level,
            ...entry.context,
          });
        }
      });
    } else {
      // Fallback: send via beacon API
      this.sendViaBeacon(entries);
    }
  }

  private sendViaBeacon(entries: LogEntry[]): void {
    if (typeof navigator === 'undefined' || !('sendBeacon' in navigator)) return;

    const payload = entries.map((e) => ({
      level: e.level,
      message: e.message,
      stack: e.error?.stack,
      context: e.context,
      timestamp: e.timestamp.toISOString(),
      url: e.url,
    }));

    try {
      // Note: Replace with actual logging endpoint when available
      const endpoint = import.meta.env.VITE_ERROR_LOGGING_ENDPOINT;
      if (endpoint) {
        navigator.sendBeacon(endpoint, JSON.stringify(payload));
      }
    } catch {
      // Silently fail - logging should never break the app
    }
  }

  // Convenience methods
  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    this.log({ level: 'error', message, error, context });
  }

  fatal(message: string, error?: Error, context?: Record<string, unknown>): void {
    this.log({ level: 'fatal', message, error, context });
  }

  warning(message: string, context?: Record<string, unknown>): void {
    this.log({ level: 'warning', message, context });
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log({ level: 'info', message, context });
  }

  /**
   * Log React component error with boundary info
   */
  componentError(error: Error, errorInfo: ErrorInfo): void {
    this.error('React component error', error, {
      componentStack: errorInfo.componentStack,
      boundaryName: errorInfo.errorBoundaryName,
      timestamp: errorInfo.timestamp.toISOString(),
    });
  }

  /**
   * Cleanup on unmount
   */
  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flush();
  }
}

// Singleton
export const logger = new ErrorLogger();

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => logger.destroy());
}
