import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useFocusTrap } from '../useFocusTrap';

describe('useFocusTrap', () => {
  it('should return ref', () => {
    const { result } = renderHook(() => useFocusTrap(true));
    expect(result.current.ref).toBeDefined();
  });

  it('should not trap when disabled', () => {
    const { result } = renderHook(() => useFocusTrap(false));
    expect(result.current.ref).toBeDefined();
  });
});
