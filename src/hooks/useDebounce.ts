import { useState, useEffect } from 'react';

/**
 * useDebounce - Retrasa la actualización de un valor
 * 
 * Útil para:
 * - Búsquedas en tiempo real
 * - Resize handlers
 * - Scroll handlers
 * - Inputs que disparan requests
 * 
 * Usage:
 * ```typescript
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearch = useDebounce(searchTerm, 500);
 * 
 * // Solo se actualiza después de 500ms sin cambios
 * useEffect(() => {
 *   searchAPI(debouncedSearch);
 * }, [debouncedSearch]);
 * ```
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Configurar timeout
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Limpiar timeout si el valor cambia antes
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;
