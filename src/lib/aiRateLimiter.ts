/**
 * AI Rate Limiter & Cache
 * Previene bombardeo de llamadas a Gemini API al cargar el dashboard.
 * - Cola secuencial: las peticiones se ejecutan de 1 en 1 con delay configurable.
 * - Caché en memoria: respuestas se cachean N minutos para evitar recompeticiones.
 * - Deduplicación: si la misma key se encola 2 veces, la segunda espera a la primera.
 */

interface CacheEntry<T> {
  data: T;
  expiry: number;
}

interface QueueItem {
  key: string;
  ttlMs: number;
  execute: () => Promise<unknown>;
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
}

const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos
const DEFAULT_DELAY_BETWEEN_CALLS_MS = 1500; // 1.5s entre llamadas

class AIRateLimiter {
  private cache = new Map<string, CacheEntry<unknown>>();
  private queue: QueueItem[] = [];
  private processing = false;
  private inflightMap = new Map<string, Promise<unknown>>();
  private delayMs: number;

  constructor(delayMs = DEFAULT_DELAY_BETWEEN_CALLS_MS) {
    this.delayMs = delayMs;
  }

  /**
   * Ejecuta una llamada AI con rate limiting y caché.
   * @param key - Clave única para cachear (ej: "dashboard-alert-fran1-2026-03")
   * @param fn - La función que hace la llamada a Gemini
   * @param ttlMs - TTL del caché en ms (default 5 min)
   */
  async execute<T>(key: string, fn: () => Promise<T>, ttlMs = DEFAULT_CACHE_TTL_MS): Promise<T> {
    // 1. Verificar caché
    const cached = this.cache.get(key);
    if (cached && Date.now() < cached.expiry) {
      return cached.data as T;
    }

    // 2. Deduplicar: si ya hay una petición en vuelo para esta key, esperar su resultado
    const inflight = this.inflightMap.get(key);
    if (inflight) {
      return inflight as Promise<T>;
    }

    // 3. Encolar la petición
    const promise = new Promise<T>((resolve, reject) => {
      this.queue.push({
        key,
        ttlMs,
        execute: fn,
        resolve: resolve as (value: unknown) => void,
        reject,
      });
    });

    this.inflightMap.set(key, promise);

    // Limpiar inflight cuando termine
    promise.finally(() => {
      this.inflightMap.delete(key);
    });

    // Iniciar procesamiento si no está activo
    if (!this.processing) {
      this.processQueue();
    }

    return promise;
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;
    this.processing = true;

    while (this.queue.length > 0) {
      const item = this.queue.shift()!;

      try {
        const result = await item.execute();

        // Guardar en caché
        this.cache.set(item.key, {
          data: result,
          expiry: Date.now() + (item.ttlMs ?? DEFAULT_CACHE_TTL_MS),
        });

        item.resolve(result);
      } catch (error) {
        item.reject(error);
      }

      // Delay entre llamadas para no saturar la cuota
      if (this.queue.length > 0) {
        await this.sleep(this.delayMs);
      }
    }

    this.processing = false;
  }

  /** Invalida el caché de una key específica o todo el caché */
  invalidate(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  /** Estadísticas de caché para debugging */
  getStats(): { cacheSize: number; queueLength: number; processing: boolean } {
    return {
      cacheSize: this.cache.size,
      queueLength: this.queue.length,
      processing: this.processing,
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }
}

// Singleton para toda la app
export const aiLimiter = new AIRateLimiter();
