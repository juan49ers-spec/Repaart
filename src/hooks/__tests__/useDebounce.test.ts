import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '../useDebounce';

describe('useDebounce', () => {
  it('should debounce value changes', () => {
    vi.useFakeTimers();
    
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 'initial' } }
    );
    
    expect(result.current).toBe('initial');
    
    // Cambiar valor
    rerender({ value: 'changed' });
    expect(result.current).toBe('initial'); // Aún no cambia
    
    // Avanzar tiempo
    act(() => {
      vi.advanceTimersByTime(500);
    });
    
    expect(result.current).toBe('changed'); // Ahora sí cambia
    
    vi.useRealTimers();
  });

  it('should cancel previous timeout on rapid changes', () => {
    vi.useFakeTimers();
    
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 'initial' } }
    );
    
    // Múltiples cambios rápidos
    rerender({ value: 'change1' });
    rerender({ value: 'change2' });
    rerender({ value: 'change3' });
    
    act(() => {
      vi.advanceTimersByTime(500);
    });
    
    // Solo el último valor debe persistir
    expect(result.current).toBe('change3');
    
    vi.useRealTimers();
  });
});
