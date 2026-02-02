import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Tipos de feature flags
export type FeatureFlagValue = boolean | string | number;

export interface FeatureFlags {
  [key: string]: FeatureFlagValue;
}

// Contexto
interface FeatureFlagContextType {
  flags: FeatureFlags;
  isEnabled: (key: string) => boolean;
  getValue: (key: string, defaultValue?: FeatureFlagValue) => FeatureFlagValue;
  updateFlag: (key: string, value: FeatureFlagValue) => void;
}

const FeatureFlagContext = createContext<FeatureFlagContextType | undefined>(undefined);

// Flags por defecto (pueden ser sobrescritos por Firebase Remote Config)
const DEFAULT_FLAGS: FeatureFlags = {
  // Features en desarrollo
  newDashboard: false,
  advancedAnalytics: false,
  betaFeatures: false,
  
  // Features de UI
  darkMode: true,
  compactView: false,
  experimentalCharts: false,
  
  // Features de funcionalidad
  bulkOperations: true,
  exportData: true,
  importData: false,
  
  // Límites y configuraciones
  maxItemsPerPage: 50,
  enableNotifications: true,
  autoSave: true,
};

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

/**
 * useFeatureFlag - Hook para usar feature flags
 * 
 * Usage:
 * ```tsx
 * const isNewDashboard = useFeatureFlag('newDashboard');
 * const maxItems = useFeatureFlag('maxItemsPerPage', 25);
 * 
 * if (isNewDashboard) {
 *   return <NewDashboard />;
 * }
 * return <OldDashboard />;
 * ```
 */
export function useFeatureFlag(key: string, defaultValue?: boolean): boolean;
export function useFeatureFlag(key: string, defaultValue: FeatureFlagValue): FeatureFlagValue;
export function useFeatureFlag(key: string, defaultValue?: FeatureFlagValue): FeatureFlagValue {
  const context = useContext(FeatureFlagContext);
  
  if (context === undefined) {
    throw new Error('useFeatureFlag must be used within a FeatureFlagProvider');
  }

  if (defaultValue !== undefined) {
    return context.getValue(key, defaultValue);
  }

  return context.isEnabled(key);
}

/**
 * useFeatureFlags - Hook para acceder a todas las flags
 * 
 * Usage:
 * ```tsx
 * const { flags, updateFlag } = useFeatureFlags();
 * ```
 */
export function useFeatureFlags() {
  const context = useContext(FeatureFlagContext);
  
  if (context === undefined) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagProvider');
  }

  return context;
}

export default FeatureFlagProvider;
