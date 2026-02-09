import { useState, useCallback, useRef } from 'react';

export interface Version<T> {
  id: string;
  data: T;
  timestamp: Date;
  description?: string;
}

interface UseVersioningOptions {
  maxVersions?: number;
  enabled?: boolean;
}

export function useVersioning<T extends Record<string, any>>(
  initialData: T,
  options: UseVersioningOptions = {}
) {
  const { maxVersions = 20, enabled = true } = options;

  const [currentData, setCurrentData] = useState<T>(initialData);
  const [versions, setVersions] = useState<Version<T>[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);

  const previousDataRef = useRef<T>(initialData);

  const createVersion = useCallback((data: T, description?: string) => {
    if (!enabled) return;

    const newVersion: Version<T> = {
      id: `v${Date.now()}`,
      data: { ...data },
      timestamp: new Date(),
      description
    };

    setVersions(prev => {
      const updated = [newVersion, ...prev];
      // Keep only the last maxVersions
      return updated.slice(0, maxVersions);
    });

    previousDataRef.current = { ...data };
  }, [enabled, maxVersions]);

  const saveVersion = useCallback((description?: string) => {
    createVersion(currentData, description);
  }, [currentData, createVersion]);

  const restoreVersion = useCallback((versionId: string) => {
    const version = versions.find(v => v.id === versionId);
    if (version) {
      setCurrentData(version.data);
      setSelectedVersionId(versionId);
      previousDataRef.current = { ...version.data };
    }
  }, [versions]);

  const updateData = useCallback((updates: Partial<T> | ((prev: T) => T)) => {
    setCurrentData(prev => {
      const newData = typeof updates === 'function'
        ? (updates as (prev: T) => T)(prev)
        : { ...prev, ...updates };

      // Check if data actually changed before creating version
      const hasChanged = Object.keys(newData).some(key => {
        return newData[key] !== previousDataRef.current[key];
      });

      if (hasChanged) {
        createVersion(newData, 'Auto-saved version');
      }

      return newData;
    });
  }, [createVersion]);

  const clearVersions = useCallback(() => {
    setVersions([]);
    setSelectedVersionId(null);
  }, []);

  const getVersionDiff = useCallback((versionId: string) => {
    const version = versions.find(v => v.id === versionId);
    if (!version) return null;

    const changes: string[] = [];
    Object.keys(version.data).forEach(key => {
      if (version.data[key] !== currentData[key]) {
        changes.push(`${key}: ${JSON.stringify(currentData[key])} → ${JSON.stringify(version.data[key])}`);
      }
    });

    return changes;
  }, [versions, currentData]);

  return {
    currentData,
    versions,
    selectedVersionId,
    updateData,
    saveVersion,
    restoreVersion,
    clearVersions,
    getVersionDiff,
    setData: setCurrentData
  };
}
