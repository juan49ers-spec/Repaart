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

  useEffect(() => {
    if (!enabled) return;

    // Check if dependencies actually changed
    const hasChanged = !previousDepsRef.current || deps.some((dep, index) => {
      const prevDep = previousDepsRef.current?.[index];
      return dep !== prevDep;
    });

    if (hasChanged) {
      setHasUnsavedChanges(true);

      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Set new timeout
      saveTimeoutRef.current = setTimeout(async () => {
        setIsSaving(true);
        try {
          await onSave();
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

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [deps, delay, onSave, enabled]);

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
