import React, { useState, useEffect, ReactNode } from 'react';
import {
  FeatureFlags,
  FeatureFlagValue,
  FeatureFlagContext,
  DEFAULT_FLAGS,
  useFeatureFlags,
  useFeatureFlag
} from './FeatureFlagsCore';

export {
  FeatureFlagContext,
  useFeatureFlags,
  useFeatureFlag,
  DEFAULT_FLAGS as defaultFlags
};
export type { FeatureFlags, FeatureFlagValue };

interface FeatureFlagProviderProps {
  children: ReactNode;
  initialFlags?: FeatureFlags;
}

/**
 * FeatureFlagProvider - Provee el contexto de feature flags
 * 
 * Usage:
 * ```tsx
 * <FeatureFlagProvider>
 *   <App />
 * </FeatureFlagProvider>
 * ```
 */
export const FeatureFlagProvider: React.FC<FeatureFlagProviderProps> = ({
  children,
  initialFlags = {}
}) => {
  const [flags, setFlags] = useState<FeatureFlags>(() => {
    // Priority: initialFlags > localStorage > DEFAULT_FLAGS
    const baseFlags = { ...DEFAULT_FLAGS, ...initialFlags };

    // Intentar cargar desde localStorage (para desarrollo)
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('featureFlags');
      if (saved) {
        try {
          return { ...baseFlags, ...JSON.parse(saved) };
        } catch {
          return baseFlags;
        }
      }
    }
    return baseFlags;
  });

  // Guardar en localStorage cuando cambien
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('featureFlags', JSON.stringify(flags));
    }
  }, [flags]);

  const isEnabled = (key: string): boolean => {
    const value = flags[key];
    return value === true || value === 'true' || value === 1;
  };

  const getValue = (key: string, defaultValue?: FeatureFlagValue): FeatureFlagValue => {
    return flags[key] ?? defaultValue ?? false;
  };

  const updateFlag = (key: string, value: FeatureFlagValue) => {
    setFlags(prev => ({ ...prev, [key]: value }));
  };

  return (
    <FeatureFlagContext.Provider value={{ flags, isEnabled, getValue, updateFlag }}>
      {children}
    </FeatureFlagContext.Provider>
  );
};

export default FeatureFlagProvider;
