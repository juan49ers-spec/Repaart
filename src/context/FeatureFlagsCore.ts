import { createContext, useContext } from 'react';

// Tipos de feature flags
export type FeatureFlagValue = boolean | string | number;

export interface FeatureFlags {
    [key: string]: FeatureFlagValue;
}

// Contexto
export interface FeatureFlagContextType {
    flags: FeatureFlags;
    isEnabled: (key: string) => boolean;
    getValue: (key: string, defaultValue?: FeatureFlagValue) => FeatureFlagValue;
    updateFlag: (key: string, value: FeatureFlagValue) => void;
}

export const FeatureFlagContext = createContext<FeatureFlagContextType | undefined>(undefined);

// Flags por defecto (pueden ser sobrescritos por Firebase Remote Config)
export const DEFAULT_FLAGS: FeatureFlags = {
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

/**
 * useFeatureFlag - Hook para usar feature flags
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
 */
export function useFeatureFlags() {
    const context = useContext(FeatureFlagContext);

    if (context === undefined) {
        throw new Error('useFeatureFlags must be used within a FeatureFlagProvider');
    }

    return context;
}

