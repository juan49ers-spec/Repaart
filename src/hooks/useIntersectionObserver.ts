import { useState, useEffect, useRef, RefObject } from 'react';

export interface UseIntersectionObserverOptions {
  /** Umbral de intersección (0-1). Puede ser un número o un array de números */
  threshold?: number | number[];
  /** Root element para la intersección. Default es el viewport */
  root?: Element | null;
  /** Margen alrededor del root */
  rootMargin?: string;
  /** Solo ejecutar una vez cuando se vuelve visible */
  triggerOnce?: boolean;
}

export interface IntersectionObserverResult {
  isIntersecting: boolean;
  entry?: IntersectionObserverEntry;
}

/**
 * useIntersectionObserver - Detecta cuando un elemento es visible en el viewport
 * 
 * Útil para:
 * - Lazy loading de imágenes y componentes
 * - Animaciones cuando elementos entran en vista
 * - Infinite scroll
 * - Analytics de visibilidad
 * 
 * Usage:
 * ```typescript
 * const { isIntersecting, entry } = useIntersectionObserver({
 *   threshold: 0.5,
 *   triggerOnce: true
 * });
 * 
 * <div ref={ref}>
 *   {isIntersecting && <HeavyComponent />}
 * </div>
 * ```
 */
export function useIntersectionObserver(
  options: UseIntersectionObserverOptions = {}
): [RefObject<Element | null>, IntersectionObserverResult] {
  const { threshold = 0, root = null, rootMargin = '0px', triggerOnce = false } = options;

  const ref = useRef<Element | null>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [entry, setEntry] = useState<IntersectionObserverEntry>();
  const wasIntersecting = useRef(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isElementIntersecting = entry.isIntersecting;

        setIsIntersecting(isElementIntersecting);
        setEntry(entry);

        if (triggerOnce && isElementIntersecting) {
          observer.disconnect();
          wasIntersecting.current = true;
        }
      },
      { threshold, root, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, root, rootMargin, triggerOnce]);

  return [ref, { isIntersecting, entry }];
}

/**
 * Hook simplificado que solo retorna el ref y un boolean
 */
export function useInView(
  options: UseIntersectionObserverOptions = {}
): [RefObject<Element | null>, boolean] {
  const [ref, { isIntersecting }] = useIntersectionObserver(options);
  return [ref, isIntersecting];
}

export default useIntersectionObserver;
