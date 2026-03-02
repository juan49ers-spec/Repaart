import { useState, useEffect, useRef } from 'react';

interface AutoSaveOptions {
  delay?: number; // milliseconds
  onSave: () => Promise<void>;
  deps?: React.DependencyList;
  enabled?: boolean;
}

export function useAutoSave({
  delay = 3000,
  onSave,
  deps = [],
  enabled = true
}: AutoSaveOptions) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const previousDepsRef = useRef<React.DependencyList | undefined>(undefined);

  const onSaveRef = useRef(onSave);
  // Keep the latest onSave callback
  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  const depsString = JSON.stringify(deps);

  useEffect(() => {
    if (!enabled) return;

    // Check if dependencies actually changed
    const hasChanged = !previousDepsRef.current || deps.some((dep, index) => {
      const prevDep = previousDepsRef.current?.[index];
      return dep !== prevDep;
    });

    if (hasChanged) {
      setHasUnsavedChanges(true);

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(async () => {
        setIsSaving(true);
        try {
          await onSaveRef.current();
          setHasUnsavedChanges(false);
          setLastSaved(new Date());
        } catch (error) {
          console.error('[useAutoSave] Error auto-saving:', error);
        } finally {
          setIsSaving(false);
        }
      }, delay);

      previousDepsRef.current = deps;
    }

    // Cleanup when component unmounts or when enabled/delay/depsString changes
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [depsString, delay, enabled]);

  const forceSave = async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    setIsSaving(true);
    try {
      await onSave();
      setHasUnsavedChanges(false);
      setLastSaved(new Date());
    } catch (error) {
      console.error('[useAutoSave] Error force-saving:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    isSaving,
    lastSaved,
    hasUnsavedChanges,
    forceSave
  };
}
