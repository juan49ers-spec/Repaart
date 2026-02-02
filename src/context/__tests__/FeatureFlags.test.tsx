import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { FeatureFlagProvider, useFeatureFlag } from '../FeatureFlags';

describe('Feature Flags', () => {
  it('should return true for enabled flag', () => {
    const initialFlags = { myCustomFeature: true };
    const { result } = renderHook(() => useFeatureFlag('myCustomFeature'), {
      wrapper: ({ children }) => (
        <FeatureFlagProvider initialFlags={initialFlags}>{children}</FeatureFlagProvider>
      )
    });
    
    expect(result.current).toBe(true);
  });

  it('should return false for disabled flag', () => {
    const initialFlags = { anotherFeature: false };
    const { result } = renderHook(() => useFeatureFlag('anotherFeature'), {
      wrapper: ({ children }) => (
        <FeatureFlagProvider initialFlags={initialFlags}>{children}</FeatureFlagProvider>
      )
    });
    
    expect(result.current).toBe(false);
  });

  it('should return default value for undefined flag', () => {
    const { result } = renderHook(() => useFeatureFlag('nonExistentFlag', false), {
      wrapper: ({ children }) => (
        <FeatureFlagProvider>{children}</FeatureFlagProvider>
      )
    });
    
    expect(result.current).toBe(false);
  });
});
