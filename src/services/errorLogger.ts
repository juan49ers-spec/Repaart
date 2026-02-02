/**
 * ErrorLogger Service - Centralized error logging with sanitization
 * 
 * Captures errors with context, sanitizes sensitive data,
 * and sends to Sentry while providing console logging in development.
 */

export interface ErrorContext {
  [key: string]: unknown;
}

export interface ErrorLogOptions {
  context?: ErrorContext;
  level?: 'fatal' | 'error' | 'warning' | 'info';
  tags?: Record<string, string>;
  fingerprint?: string[];
}

interface SensitiveData {
  password: string;
  token: string;
  apiKey: string;
  secret: string;
  creditCard: string;
  ssn: string;
  email: string;
}

const SENSITIVE_PATTERNS: (keyof SensitiveData)[] = [
  'password',
  'token',
  'apiKey',
  'secret',
  'creditCard',
  'ssn',
  'email',
];

/**
 * Sanitize sensitive data from error context
 */
function sanitizeContext(context: ErrorContext): ErrorContext {
  const sanitized: ErrorContext = { ...context };

  for (const key in sanitized) {
    const lowerKey = key.toLowerCase();
    
    // Check if key matches sensitive patterns
    const isSensitive = SENSITIVE_PATTERNS.some(pattern => 
      lowerKey.includes(pattern.toLowerCase())
    );

    if (isSensitive) {
      sanitized[key] = '[REDACTED]';
      continue;
    }

    // Recursively sanitize nested objects
    if (typeof sanitized[key] === 'object' && sanitized[key] !== null && !Array.isArray(sanitized[key])) {
      sanitized[key] = sanitizeContext(sanitized[key] as ErrorContext);
    }
  }

  return sanitized;
}

/**
 * Sanitize error message to remove potential sensitive data
 */
function sanitizeErrorMessage(message: string): string {
  // Remove potential tokens, API keys, emails
  return message
    .replace(/Bearer\s+[A-Za-z0-9\-._~+/]+/gi, 'Bearer [REDACTED]')
    .replace(/api[_\s]?key["\s=:]+[A-Za-z0-9\-._~+/=]+/gi, 'apiKey=[REDACTED]')
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]')
    .replace(/\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}/g, '[CREDIT_CARD]')
    .replace(/\d{3}-\d{2}-\d{4}/g, '[SSN]');
}

/**
 * Get Sentry instance if available
 */
function getSentry() {
  if (typeof window !== 'undefined' && (window as any).Sentry) {
    return (window as any).Sentry;
  }
  return null;
}

/**
 * Log error to console (development only)
 */
function logToConsole(error: Error, options: ErrorLogOptions, sanitized: boolean) {
  if (import.meta.env.DEV) {
    const { level = 'error', context } = options;
    const prefix = sanitized ? '[SANITIZED]' : '';
    
    console.group(`%c${level.toUpperCase()} ${prefix}`, `color: ${level === 'error' || level === 'fatal' ? 'red' : 'orange'}`);
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    
    if (context && Object.keys(context).length > 0) {
      console.error('Context:', context);
    }
    
    if (options.tags) {
      console.error('Tags:', options.tags);
    }
    
    console.groupEnd();
  }
}

/**
 * Log error to Sentry
 */
function logToSentry(error: Error, options: ErrorLogOptions) {
  const Sentry = getSentry();
  
  if (!Sentry) {
    console.warn('Sentry not initialized');
    return null;
  }

  const { context, level = 'error', tags, fingerprint } = options;

  const captureOptions: {
    level?: 'fatal' | 'error' | 'warning' | 'info';
    tags?: Record<string, string>;
    fingerprint?: string[];
    extra?: Record<string, unknown>;
  } = {
    level,
    tags,
    fingerprint,
  };

  if (context && Object.keys(context).length > 0) {
    const sanitizedContext = sanitizeContext(context);
    captureOptions.extra = sanitizedContext;
  }

  return Sentry.captureException(error, captureOptions);
}

/**
 * Log an error with context
 */
export function logError(error: Error | unknown, options: ErrorLogOptions = {}): string | null {
  // Convert unknown errors to Error objects
  let errorObj: Error;
  if (error instanceof Error) {
    errorObj = error;
  } else {
    errorObj = new Error(String(error));
  }

  // Sanitize error message
  const originalMessage = errorObj.message;
  const sanitizedMessage = sanitizeErrorMessage(errorObj.message);
  
  if (sanitizedMessage !== originalMessage) {
    errorObj = new Error(sanitizedMessage);
    errorObj.stack = (error as Error).stack;
  }

  // Log to console in development
  logToConsole(errorObj, options, true);

  // Log to Sentry in production
  if (import.meta.env.PROD) {
    return logToSentry(errorObj, options);
  }

  return null;
}

/**
 * Log a message with optional error
 */
export function logMessage(
  message: string,
  level: 'info' | 'warning' = 'info',
  error?: Error
): void {
  if (import.meta.env.DEV) {
    const prefix = level === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`${prefix} ${message}`, error || '');
  }

  if (error) {
    logError(error, { level: level === 'warning' ? 'warning' : 'info', context: { message } });
  }
}

/**
 * Create a breadcrumb for Sentry
 */
export function addBreadcrumb(
  message: string,
  category: string = 'custom',
  level: 'info' | 'warning' = 'info',
  data?: Record<string, unknown>
): void {
  const Sentry = getSentry();
  
  if (Sentry) {
    const sanitizedData = data ? sanitizeContext(data) : undefined;
    
    Sentry.addBreadcrumb({
      message,
      category,
      data: sanitizedData,
      level,
    });
  }
}

/**
 * Set user context for errors
 */
export function setUserContext(
  userId: string,
  email?: string,
  additionalData?: Record<string, unknown>
): void {
  const Sentry = getSentry();
  
  if (Sentry) {
    const sanitizedData = additionalData ? sanitizeContext(additionalData) : undefined;
    
    Sentry.setUser({
      id: userId,
      email: email ? '[REDACTED]' : undefined,
      ...sanitizedData,
    });
  }
}

/**
 * Clear user context
 */
export function clearUserContext(): void {
  const Sentry = getSentry();
  
  if (Sentry) {
    Sentry.setUser(null);
  }
}

// Export singleton instance
export const ErrorLogger = {
  logError,
  logMessage,
  addBreadcrumb,
  setUserContext,
  clearUserContext,
};

export default ErrorLogger;
