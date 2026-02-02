import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useThrottle } from '../useThrottle';

describe('useThrottle', () => {
  it('should throttle function calls', () => {
    vi.useFakeTimers();
    
    const fn = vi.fn();
    const { result } = renderHook(() => useThrottle(fn, 500));

    // Primera llamada: ejecuta inmediatamente
    act(() => {
      result.current('call1');
    });
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('call1');

    // Segunda llamada dentro del throttle: se programa
    act(() => {
      result.current('call2');
    });
    expect(fn).toHaveBeenCalledTimes(1); // Aún no se ejecuta

    // Avanzar tiempo menos del delay
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(fn).toHaveBeenCalledTimes(1); // Todavía no

    // Avanzar tiempo restante
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(fn).toHaveBeenCalledTimes(2); // Ahora sí
    expect(fn).toHaveBeenCalledWith('call2');

    vi.useRealTimers();
  });

  it('should execute immediately after throttle period', () => {
    vi.useFakeTimers();
    
    const fn = vi.fn();
    const { result } = renderHook(() => useThrottle(fn, 500));

    act(() => {
      result.current('call1');
    });
    expect(fn).toHaveBeenCalledTimes(1);

    // Esperar que pase el throttle period
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Nueva llamada debe ejecutarse inmediatamente
    act(() => {
      result.current('call2');
    });
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenCalledWith('call2');

    vi.useRealTimers();
  });

  it('should cancel pending calls on new rapid calls', () => {
    vi.useFakeTimers();
    
    const fn = vi.fn();
    const { result } = renderHook(() => useThrottle(fn, 500));

    // Primera llamada
    act(() => {
      result.current('call1');
    });
    expect(fn).toHaveBeenCalledTimes(1);

    // Varias llamadas rápidas
    act(() => {
      result.current('call2');
      result.current('call3');
      result.current('call4');
    });

    // Solo call4 se ejecutará después del delay (la última)
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenLastCalledWith('call4'); // La última programada

    vi.useRealTimers();
  });

  it('should handle rapid calls correctly', () => {
    vi.useFakeTimers();
    
    const fn = vi.fn();
    const { result } = renderHook(() => useThrottle(fn, 100));

    // Llamada inicial
    act(() => {
      result.current('call1');
    });
    expect(fn).toHaveBeenCalledTimes(1);

    // Llamadas durante throttle period
    act(() => {
      result.current('call2');
    });

    // Avanzar un poco
    act(() => {
      vi.advanceTimersByTime(50);
    });

    // Otra llamada
    act(() => {
      result.current('call3');
    });

    // Avanzar el tiempo restante
    act(() => {
      vi.advanceTimersByTime(50);
    });

    // Solo debe haber 2 llamadas (inicial + una throttled)
    expect(fn).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
  });

  it('should cleanup timeout on unmount', () => {
    vi.useFakeTimers();
    
    const fn = vi.fn();
    const { result, unmount } = renderHook(() => useThrottle(fn, 500));

    act(() => {
      result.current('call1');
    });

    act(() => {
      result.current('call2');
    });

    // Unmount antes de que se ejecute la segunda llamada
    unmount();

    // Avanzar tiempo
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // La segunda llamada no debe ejecutarse
    expect(fn).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });
});
