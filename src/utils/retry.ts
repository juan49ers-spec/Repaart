/**
 * Retry Logic - Reintentar operaciones fallidas con backoff exponencial
 * 
 * Usage:
 * ```typescript
 * const data = await withRetry(
 *   () => fetchUserData(userId),
 *   { maxAttempts: 3, baseDelay: 1000 }
 * );
 * ```
 */

export interface RetryConfig {
  /** Número máximo de intentos (default: 3) */
  maxAttempts?: number;
  /** Delay base en ms (default: 1000) */
  baseDelay?: number;
  /** Factor de multiplicación para backoff (default: 2) */
  backoffFactor?: number;
  /** Delay máximo en ms (default: 30000) */
  maxDelay?: number;
  /** Función para determinar si se debe reintentar (default: siempre true) */
  shouldRetry?: (error: Error) => boolean;
  /** Callback en cada intento fallido */
  onRetry?: (attempt: number, error: Error, nextDelay: number) => void;
}

/**
 * Esperar un tiempo determinado
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calcular delay con backoff exponencial y jitter
 */
function calculateDelay(
  attempt: number,
  baseDelay: number,
  backoffFactor: number,
  maxDelay: number
): number {
  // Backoff exponencial: baseDelay * (factor ^ attempt)
  const exponentialDelay = baseDelay * Math.pow(backoffFactor, attempt - 1);
  
  // Agregar jitter aleatorio (±25%) para evitar thundering herd
  const jitter = exponentialDelay * 0.25 * (Math.random() * 2 - 1);
  
  // Asegurar que no exceda el delay máximo
  return Math.min(exponentialDelay + jitter, maxDelay);
}

/**
 * Ejecutar función con retry automático
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    backoffFactor = 2,
    maxDelay = 30000,
    shouldRetry = () => true,
    onRetry
  } = config;

  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Si es el último intento o no deberíamos reintentar, lanzar el error
      if (attempt === maxAttempts || !shouldRetry(lastError)) {
        throw lastError;
      }
      
      // Calcular delay para el siguiente intento
      const delay = calculateDelay(attempt, baseDelay, backoffFactor, maxDelay);
      
      // Callback opcional
      onRetry?.(attempt, lastError, delay);
      
      // Esperar antes del siguiente intento
      await sleep(delay);
    }
  }

  // Esto no debería llegar aquí, pero por seguridad
  throw lastError || new Error('Retry failed');
}

/**
 * Retry específico para operaciones de Firebase
 * No reintenta errores de permisos o datos inválidos
 */
export async function withFirebaseRetry<T>(
  fn: () => Promise<T>,
  config: Omit<RetryConfig, 'shouldRetry'> = {}
): Promise<T> {
  return withRetry(fn, {
    ...config,
    shouldRetry: (error) => {
      // No reintentar errores de permisos
      if (error.message.includes('permission-denied')) return false;
      // No reintentar errores de datos inválidos
      if (error.message.includes('invalid-argument')) return false;
      // No reintentar errores de no encontrado
      if (error.message.includes('not-found')) return false;
      // Reintentar otros errores (network, unavailable, etc.)
      return true;
    }
  });
}

/**
 * Retry con Result type
 * Retorna Result en lugar de lanzar excepciones
 */
export async function withRetryResult<T, E = Error>(
  fn: () => Promise<T>,
  config: RetryConfig = {}
): Promise<{ success: true; data: T } | { success: false; error: E }> {
  try {
    const data = await withRetry(fn, config);
    return { success: true, data };
  } catch (error) {
    return { 
      success: false, 
      error: (error instanceof Error ? error : new Error(String(error))) as E 
    };
  }
}
