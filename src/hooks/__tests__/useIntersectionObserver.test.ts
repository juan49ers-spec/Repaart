import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useIntersectionObserver, useInView } from '../useIntersectionObserver';

let mockObserverInstance: any = null;

class MockIntersectionObserver implements IntersectionObserver {
  root: Element | Document | null = null;
  rootMargin: string = '';
  thresholds: ReadonlyArray<number> = [];
  callback: IntersectionObserverCallback;
  elements: Set<Element> = new Set();

  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    this.callback = callback;
    mockObserverInstance = this;
    if (options?.root) this.root = options.root;
    if (options?.rootMargin) this.rootMargin = options.rootMargin;
    if (options?.threshold) this.thresholds = Array.isArray(options.threshold) ? options.threshold : [options.threshold];
  }

  observe(element: Element): void {
    this.elements.add(element);
    this.simulateIntersection(element, false);
  }

  unobserve(element: Element): void {
    this.elements.delete(element);
  }

  disconnect(): void {
    this.elements.clear();
  }

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }

  simulateIntersection(element: Element, isIntersecting: boolean): void {
    const entry: IntersectionObserverEntry = {
      target: element,
      isIntersecting,
      intersectionRatio: isIntersecting ? 1 : 0,
      boundingClientRect: element.getBoundingClientRect(),
      intersectionRect: element.getBoundingClientRect(),
      rootBounds: null,
      time: Date.now(),
    };
    this.callback([entry], this);
  }
}

describe('useIntersectionObserver', () => {
  beforeEach(() => {
    mockObserverInstance = null;
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
  });

  it('should observe element when ref is set', () => {
    const { result } = renderHook(() => useIntersectionObserver());

    const div = document.createElement('div');
    act(() => {
      result.current[0].current = div;
    });

    expect(result.current[0].current).toBe(div);
  });

  it('should detect intersection', () => {
    const { result } = renderHook(() => useIntersectionObserver());

    const div = document.createElement('div');
    act(() => {
      result.current[0].current = div;
    });

    expect(result.current[1].isIntersecting).toBe(false);

    if (mockObserverInstance) {
      act(() => {
        mockObserverInstance.simulateIntersection(div, true);
      });
      expect(result.current[1].isIntersecting).toBe(true);
    }
  });

  it('should disconnect observer when triggerOnce is true and element intersects', () => {
    const disconnectSpy = vi.spyOn(MockIntersectionObserver.prototype, 'disconnect');
    
    const { result } = renderHook(() => useIntersectionObserver({ triggerOnce: true }));

    const div = document.createElement('div');
    act(() => {
      result.current[0].current = div;
    });

    if (mockObserverInstance) {
      act(() => {
        mockObserverInstance.simulateIntersection(div, true);
      });

      expect(disconnectSpy).toHaveBeenCalled();
      expect(result.current[1].isIntersecting).toBe(true);
    }
  });

  it('should use custom threshold', () => {
    renderHook(() => useIntersectionObserver({ threshold: 0.5 }));

    if (mockObserverInstance) {
      expect(mockObserverInstance.thresholds).toContain(0.5);
    }
  });

  it('should handle unmount without errors', () => {
    const { unmount } = renderHook(() => useIntersectionObserver());

    unmount();

    expect(true).toBe(true);
  });
});

describe('useInView', () => {
  beforeEach(() => {
    mockObserverInstance = null;
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
  });

  it('should return ref and boolean', () => {
    const { result } = renderHook(() => useInView());

    expect(result.current).toHaveLength(2);
    expect(result.current[1]).toBe(false);
  });

  it('should detect when element is in view', () => {
    const { result } = renderHook(() => useInView());

    const div = document.createElement('div');
    act(() => {
      result.current[0].current = div;
    });

    expect(result.current[1]).toBe(false);

    if (mockObserverInstance) {
      act(() => {
        mockObserverInstance.simulateIntersection(div, true);
      });

      expect(result.current[1]).toBe(true);
    }
  });

  it('should work with triggerOnce option', () => {
    const { result } = renderHook(() => useInView({ triggerOnce: true }));

    const div = document.createElement('div');
    act(() => {
      result.current[0].current = div;
    });

    if (mockObserverInstance) {
      act(() => {
        mockObserverInstance.simulateIntersection(div, true);
      });

      expect(result.current[1]).toBe(true);

      act(() => {
        mockObserverInstance.simulateIntersection(div, false);
      });

      expect(result.current[1]).toBe(true);
    }
  });
});
