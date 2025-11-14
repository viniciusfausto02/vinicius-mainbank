/**
 * Structured Logging System
 * Provides consistent logging across the application with severity levels
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  FATAL = 'FATAL',
}

export interface LogContext {
  userId?: string;
  requestId?: string;
  route?: string;
  [key: string]: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level}] ${message}${contextStr}`;
  }

  debug(message: string, context?: LogContext): void {
    if (!this.isDevelopment) return;
    console.log(this.formatMessage(LogLevel.DEBUG, message, context));
  }

  info(message: string, context?: LogContext): void {
    console.log(this.formatMessage(LogLevel.INFO, message, context));
  }

  warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage(LogLevel.WARN, message, context));
  }

  error(message: string, error?: Error, context?: LogContext): void {
    const errorContext = {
      ...context,
      error: error?.message,
      stack: this.isDevelopment ? error?.stack : undefined,
    };
    console.error(this.formatMessage(LogLevel.ERROR, message, errorContext));
  }

  fatal(message: string, error?: Error, context?: LogContext): void {
    const errorContext = {
      ...context,
      error: error?.message,
      stack: error?.stack,
    };
    console.error(this.formatMessage(LogLevel.FATAL, message, errorContext));
    // In production, you might want to send this to a monitoring service
  }

  /** Log API request */
  logApiRequest(method: string, route: string, status: number, duration: number, context?: LogContext): void {
    const message = `${method} ${route} - ${status} (${duration}ms)`;
    if (status >= 400) {
      this.warn(message, context);
    } else {
      this.info(message, context);
    }
  }

  /** Log sensitive operation with audit trail */
  logAudit(operation: string, userId: string, details: any): void {
    this.info(`[AUDIT] ${operation}`, {
      userId,
      operation,
      details,
      timestamp: new Date().toISOString(),
    });
  }
}

export const logger = new Logger();
