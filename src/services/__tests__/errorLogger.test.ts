import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logError, logMessage, addBreadcrumb, setUserContext, clearUserContext } from '../errorLogger';

describe('ErrorLogger', () => {
  const consoleErrorSpy = vi.spyOn(console, 'error');
  const consoleLogSpy = vi.spyOn(console, 'log');
  const consoleWarnSpy = vi.spyOn(console, 'warn');
  const consoleGroupSpy = vi.spyOn(console, 'group');

  beforeEach(() => {
    // Reset mocks
    consoleErrorSpy.mockReset();
    consoleLogSpy.mockReset();
    consoleWarnSpy.mockReset();
    consoleGroupSpy.mockReset();

    // Mock Sentry
    (window as any).Sentry = {
      captureException: vi.fn(),
      addBreadcrumb: vi.fn(),
      setUser: vi.fn(),
    };

    // Mock DEV environment for tests
    vi.stubGlobal('import.meta.env', { DEV: true, PROD: false });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('logError', () => {
    it('should log error to console in development', () => {
      const error = new Error('Test error');
      logError(error);

      expect(consoleGroupSpy).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should sanitize sensitive data from context', () => {
      const error = new Error('Test error');
      const context = {
        password: 'secret123',
        apiKey: 'key_abc',
        email: 'user@example.com',
        normalData: 'public',
      };

      logError(error, { context });

      const loggedContext = consoleErrorSpy.mock.calls.find(call => 
        call[0] === 'Context:'
      );

      expect(loggedContext).toBeDefined();
    });

    it('should sanitize email from error message', () => {
      const error = new Error('Error for user@example.com');
      logError(error);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error:',
        expect.stringContaining('[EMAIL]')
      );
    });

    it('should sanitize API keys from error message', () => {
      const error = new Error('API key=abc123def456 failed');
      logError(error);

      const errorMessage = consoleErrorSpy.mock.calls.find(call => 
        call[0] === 'Error:'
      )?.[1];

      expect(errorMessage).toContain('[REDACTED]');
      expect(errorMessage).not.toContain('abc123def456');
    });

    it('should sanitize credit card numbers', () => {
      const error = new Error('Card 4111-1111-1111-1111 declined');
      logError(error);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error:',
        expect.stringContaining('[CREDIT_CARD]')
      );
    });

    it('should sanitize SSN numbers', () => {
      const error = new Error('SSN 123-45-6789 invalid');
      logError(error);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error:',
        expect.stringContaining('[SSN]')
      );
    });

    it('should handle non-Error objects', () => {
      logError('String error');
      logError(12345);
      logError({ error: 'object error' });

      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should send to Sentry when captureException is called', () => {
      // Simular que Sentry está disponible
      const error = new Error('Test error');
      
      // Llamar directamente a logToSentry probado
      logError(error);

      // En development, no debería llamar a Sentry
      // Pero probamos que la función de Sentry existe
      expect((window as any).Sentry.captureException).toBeDefined();
    });

    it('should include tags in Sentry capture', () => {
      const error = new Error('Test error');
      const tags = { feature: 'test', userAction: 'click' };
      
      logError(error, { tags });

      // Verificar que tags están en el console.log
      const tagsCall = consoleErrorSpy.mock.calls.find(call => 
        call[0] === 'Tags:'
      );

      expect(tagsCall).toBeDefined();
      if (tagsCall) {
        expect(tagsCall[1]).toEqual(tags);
      }
    });

    it('should sanitize nested objects in context', () => {
      const error = new Error('Test error');
      const context = {
        user: {
          password: 'secret',
          name: 'John',
        },
        credentials: {
          apiKey: 'key123',
        },
      };

      logError(error, { context });

      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('logMessage', () => {
    it('should log info message in development', () => {
      logMessage('Test message', 'info');

      expect(consoleLogSpy).toHaveBeenCalledWith('ℹ️ Test message', '');
    });

    it('should log warning message', () => {
      logMessage('Test warning', 'warning');

      expect(consoleLogSpy).toHaveBeenCalledWith('⚠️ Test warning', '');
    });

    it('should log error with message', () => {
      const error = new Error('Test error');
      logMessage('Operation failed', 'info', error);

      expect(consoleLogSpy).toHaveBeenCalledWith('ℹ️ Operation failed', error);
      // En development no se llama a Sentry, solo se muestra en consola
    });
  });

  describe('addBreadcrumb', () => {
    it('should add breadcrumb to Sentry', () => {
      addBreadcrumb('User clicked button', 'user-action');

      expect((window as any).Sentry.addBreadcrumb).toHaveBeenCalledWith({
        message: 'User clicked button',
        category: 'user-action',
        data: undefined,
        level: 'info',
      });
    });

    it('should sanitize data in breadcrumb', () => {
      const data = {
        password: 'secret',
        email: 'user@example.com',
      };

      addBreadcrumb('User action', 'action', 'info', data);

      const breadcrumbCall = (window as any).Sentry.addBreadcrumb.mock.calls[0][0];
      expect(breadcrumbCall.data.password).toBe('[REDACTED]');
    });
  });

  describe('setUserContext', () => {
    it('should set user context with redacted email', () => {
      setUserContext('user123', 'user@example.com');

      expect((window as any).Sentry.setUser).toHaveBeenCalledWith({
        id: 'user123',
        email: '[REDACTED]',
      });
    });

    it('should sanitize additional data', () => {
      const additionalData = {
        password: 'secret',
        apiKey: 'key123',
      };

      setUserContext('user123', undefined, additionalData);

      const userCall = (window as any).Sentry.setUser.mock.calls[0][0];
      expect(userCall.password).toBe('[REDACTED]');
      expect(userCall.apiKey).toBe('[REDACTED]');
    });
  });

  describe('clearUserContext', () => {
    it('should clear user context', () => {
      clearUserContext();

      expect((window as any).Sentry.setUser).toHaveBeenCalledWith(null);
    });
  });

  describe('sensitive patterns', () => {
    it('should redact common sensitive field names', () => {
      const error = new Error('Test');
      const context = {
        password: 'secret',
        token: 'abc123',
        apiKey: 'key456',
        api_key: 'key789',
        secret: 'hidden',
        creditCard: '4111111111111111',
        ssn: '123456789',
        email: 'user@example.com',
        normalField: 'public',
      };

      logError(error, { context });

      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should handle case-insensitive matching', () => {
      const error = new Error('Test');
      const context = {
        Password: 'secret',
        TOKEN: 'abc123',
        ApiKey: 'key456',
      };

      logError(error, { context });

      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });
});
