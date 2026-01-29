import * as Sentry from '@sentry/react';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN || process.env.VITE_SENTRY_DSN;
const SENTRY_ENVIRONMENT = import.meta.env.VITE_SENTRY_ENVIRONMENT || process.env.VITE_SENTRY_ENVIRONMENT || 'development';

export const initSentry = () => {
  // Only initialize Sentry in production or when DSN is provided
  if (SENTRY_DSN && SENTRY_DSN !== 'your-sentry-dsn-here') {
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: SENTRY_ENVIRONMENT,
      
      // Set tracesSampleRate to 1.0 to capture 100%
      // of transactions for performance monitoring.
      // We recommend adjusting this value in production
      tracesSampleRate: SENTRY_ENVIRONMENT === 'production' ? 0.1 : 1.0,
      
      // Filter out errors from known safe sources
      beforeSend(event, hint) {
        // Filter out errors from browser extensions
        if (event.exception) {
          const error = hint.originalException;
          if (error && error instanceof Error) {
            // Filter out extension-related errors
            if (error.message.includes('extension') || 
                error.message.includes('chrome-extension') || 
                error.message.includes('safari-extension')) {
              return null;
            }
          }
        }
        return event;
      },
      
      // Add user context if available
      beforeBreadcrumb(breadcrumb) {
        // Filter out breadcrumbs that are too noisy
        if (breadcrumb.category === 'xhr' && breadcrumb.data?.url) {
          // Don't log health check or heartbeat requests
          if (breadcrumb.data.url.includes('/health') || breadcrumb.data.url.includes('/ping')) {
            return null;
          }
        }
        return breadcrumb;
      },
      
      // Set release
      release: process.env.VITE_APP_VERSION || 'latest',
    });
    
    console.log('Sentry initialized successfully');
  } else {
    console.log('Sentry DSN not configured, skipping initialization');
  }
};

export const setUser = (user: Sentry.User | null) => {
  Sentry.setUser(user);
};

export const captureException = (error: Error, context?: Sentry.CaptureContext) => {
  Sentry.captureException(error, context);
};

export const captureMessage = (message: string, level: Sentry.SeverityLevel = 'info') => {
  Sentry.captureMessage(message, { level });
};

export const addBreadcrumb = (breadcrumb: Sentry.Breadcrumb) => {
  Sentry.addBreadcrumb(breadcrumb);
};
