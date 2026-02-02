import { useEffect, useRef, RefObject } from 'react';

/**
 * useFocusTrap - Atrapar focus dentro de un elemento (para modales, drawers)
 * 
 * Mantiene el focus dentro del elemento cuando está activo.
 * Útil para modales, drawers, y otros componentes overlay.
 * 
 * Usage:
 * ```tsx
 * const { ref } = useFocusTrap(isOpen);
 * 
 * return (
 *   <div ref={ref}>
 *     <button>Focusable 1</button>
 *     <button>Focusable 2</button>
 *   </div>
 * );
 * ```
 */
export function useFocusTrap(isActive: boolean): { ref: RefObject<HTMLDivElement | null> } {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isActive || !ref.current) return;

    const element = ref.current;
    
    // Encontrar todos los elementos focusables
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    // Focus en el primer elemento
    firstElement?.focus();

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // El componente padre debe manejar el cierre
        element.dispatchEvent(new CustomEvent('focusTrapEscape', { bubbles: true }));
      }
    };

    element.addEventListener('keydown', handleTabKey);
    element.addEventListener('keydown', handleEscape);

    return () => {
      element.removeEventListener('keydown', handleTabKey);
      element.removeEventListener('keydown', handleEscape);
    };
  }, [isActive]);

  return { ref };
}

export default useFocusTrap;
