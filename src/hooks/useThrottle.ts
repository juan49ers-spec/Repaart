import { useRef, useEffect, useCallback } from 'react';

/**
 * useThrottle - Ejecuta una función como máximo una vez por intervalo
 * 
 * Útil para:
 * - Scroll events (mejor performance que debounce)
 * - Resize events
 * - Mouse move events
 * - API calls durante scrolling
 * 
 * Diferencia con debounce:
 * - Debounce: Ejecuta después de que DEJEN de ocurrir eventos
 * - Throttle: Ejecuta regularmente DURANTE los eventos
 * 
 * Usage:
 * ```typescript
 * const throttledScroll = useThrottle(() => {
 *   console.log('Scroll position', window.scrollY);
 * }, 100);
 * 
 * <div onScroll={throttledScroll}>
 *   Se ejecutará como máximo cada 100ms
 * </div>
 * ```
 */
export function useThrottle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): T {
  const lastRun = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fnRef = useRef(fn);

  useEffect(() => {
    fnRef.current = fn;
  }, [fn]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastRun = now - lastRun.current;

      if (lastRun.current === 0 || timeSinceLastRun >= delay) {
        lastRun.current = now;
        fnRef.current(...args);
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        const timeUntilNextRun = delay - timeSinceLastRun;
        timeoutRef.current = setTimeout(() => {
          lastRun.current = Date.now();
          fnRef.current(...args);
        }, timeUntilNextRun);
      }
    },
    [delay]
  ) as T;
}

export default useThrottle;
