import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';

// Log levels
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  CRITICAL = 'critical',
}

// Log entry interface
export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: LogContext;
  error?: Error;
  metadata?: Record<string, any>;
}

export interface LogContext {
  userId?: string;
  functionId?: string;
  executionId?: string;
  requestId?: string;
  path?: string;
  method?: string;
  userAgent?: string;
  ip?: string;
}

// Logger class
export class CloudLogger {
  private context: LogContext;
  private metadata: Record<string, any> = {};
  private executionId: string;

  constructor(context: Partial<LogContext> = {}) {
    this.executionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.context = {
      executionId: this.executionId,
      ...context,
    };
  }

  // Set context
  setContext(context: Partial<LogContext>): this {
    this.context = { ...this.context, ...context };
    return this;
  }

  // Set metadata
  setMetadata(metadata: Record<string, any>): this {
    this.metadata = { ...this.metadata, ...metadata };
    return this;
  }

  // Log methods
  debug(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, metadata);
  }

  info(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, metadata);
  }

  warn(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, metadata);
  }

  error(message: string, error?: Error | unknown, metadata?: Record<string, any>): void {
    const err = error instanceof Error ? error : new Error(String(error));
    this.log(LogLevel.ERROR, message, metadata, err);
  }

  critical(message: string, error?: Error | unknown, metadata?: Record<string, any>): void {
    const err = error instanceof Error ? error : new Error(String(error));
    this.log(LogLevel.CRITICAL, message, metadata, err);
  }

  // Core log method
  private log(
    level: LogLevel,
    message: string,
    metadata?: Record<string, any>,
    error?: Error
  ): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context: this.context,
      metadata: { ...this.metadata, ...metadata },
      error,
    };

    // Format log for console
    const formattedMessage = this.formatLog(entry);
    console.log(formattedMessage);

    // Write to Firestore logs collection (for async logs)
    this.writeToFirestore(entry);

    // Send to Sentry for errors
    if (error && (level === LogLevel.ERROR || level === LogLevel.CRITICAL)) {
      this.sendToSentry(entry);
    }
  }

  // Format log for console
  private formatLog(entry: LogEntry): string {
    const { level, message, timestamp, context, error } = entry;
    const time = timestamp.toISOString();
    const ctx = context ? JSON.stringify(context) : '{}';
    const meta = entry.metadata ? JSON.stringify(entry.metadata) : '{}';
    const err = error ? ` | Error: ${error.message}` : '';

    return `[${time}] [${level.toUpperCase()}] ${ctx} | ${message} ${meta}${err}`;
  }

  // Write to Firestore
  private async writeToFirestore(entry: LogEntry): Promise<void> {
    try {
      const logsRef = admin.firestore().collection('cloud_logs');
      await logsRef.add({
        level: entry.level,
        message: entry.message,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        context: entry.context,
        metadata: entry.metadata,
        error: entry.error ? {
          message: entry.error.message,
          stack: entry.error.stack,
          name: entry.error.name,
        } : null,
      });
    } catch (error) {
      // Don't throw to avoid infinite loops
      console.error('Failed to write log to Firestore:', error);
    }
  }

  // Send to Sentry (if configured)
  private sendToSentry(entry: LogEntry): void {
    try {
      if (!entry.error) return;

      // You would need to configure Sentry in Cloud Functions
      // This is a placeholder for Sentry integration
      console.log('Would send to Sentry:', {
        message: entry.message,
        error: entry.error,
        context: entry.context,
        metadata: entry.metadata,
      });
    } catch (error) {
      console.error('Failed to send to Sentry:', error);
    }
  }
}

// Create logger for Cloud Functions
export function createLogger(functionId: string, context?: functions.https.CallableContext): CloudLogger {
  const userId = context?.auth?.uid;
  const requestId = context?.rawRequest?.headers?.['x-request-id'] as string;
  const userAgent = context?.rawRequest?.headers?.['user-agent'] as string;
  const ip = context?.rawRequest?.headers?.['x-forwarded-for'] as string;

  return new CloudLogger({
    functionId,
    userId,
    requestId,
    userAgent,
    ip,
  });
}

// Middleware for automatic logging
export function withLogging<T extends any[], R>(
  functionId: string,
  handler: (logger: CloudLogger, ...args: T) => Promise<R>
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    const logger = new CloudLogger({ functionId });
    const startTime = Date.now();

    logger.info(`${functionId} started`);

    try {
      const result = await handler(logger, ...args);
      const duration = Date.now() - startTime;
      logger.info(`${functionId} completed`, { duration });
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(`${functionId} failed`, error, { duration });
      throw error;
    }
  };
}

// Log cleanup function (run periodically)
export async function cleanupOldLogs(daysToKeep = 30): Promise<void> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  try {
    const logsRef = admin.firestore().collection('cloud_logs');
    const snapshot = await logsRef
      .where('timestamp', '<', cutoffDate)
      .limit(500)
      .get();

    const batch = admin.firestore().batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`Cleaned up ${snapshot.docs.length} old log entries`);
  } catch (error) {
    console.error('Failed to clean up old logs:', error);
  }
}

// Usage example:
/*
// In a Cloud Function:
export const myFunction = functions.https.onCall(async (data, context) => {
  const logger = createLogger('myFunction', context);
  
  logger.info('Processing request', { data });
  
  try {
    const result = await doSomething(data);
    logger.info('Request completed successfully', { result });
    return { success: true, data: result };
  } catch (error) {
    logger.error('Request failed', error);
    throw new functions.https.HttpsError('internal', 'An error occurred');
  }
});

// Or with the middleware:
export const myFunction = functions.https.onCall(
  withLogging('myFunction', async (logger, data, context) => {
    logger.info('Processing request', { data });
    const result = await doSomething(data);
    return { success: true, data: result };
  })
);
*/
