import { useEffect, useCallback, useRef, useState } from 'react';

interface ShortcutHandlers {
    onSave?: () => void;
    onUndo?: () => void;
    onRedo?: () => void;
    onClose?: () => void;
    onCancel?: () => void;
}

/**
 * Global Keyboard Shortcuts Hook
 * 
 * Manages keyboard shortcuts for power users
 * - Ctrl+S: Save
 * - Ctrl+Z: Undo
 * - Ctrl+Y / Ctrl+Shift+Z: Redo
 * - Esc: Close/Cancel
 * 
 * @param {Object} handlers - Object with handler functions
 * @param {boolean} enabled - Whether shortcuts are active
 */
export const useKeyboardShortcuts = (handlers: ShortcutHandlers = {}, enabled: boolean = true) => {
    const handlersRef = useRef<ShortcutHandlers>(handlers);

    // Update ref when handlers change
    useEffect(() => {
        handlersRef.current = handlers;
    }, [handlers]);

    useEffect(() => {
        if (!enabled) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            const { onSave, onUndo, onRedo, onClose, onCancel } = handlersRef.current;

            // Ctrl+S - Save
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                if (onSave) onSave();
                return;
            }

            // Ctrl+Z - Undo
            if (e.ctrlKey && !e.shiftKey && e.key === 'z') {
                e.preventDefault();
                if (onUndo) onUndo();
                return;
            }

            // Ctrl+Y or Ctrl+Shift+Z - Redo
            if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
                e.preventDefault();
                if (onRedo) onRedo();
                return;
            }

            // Escape - Close/Cancel
            if (e.key === 'Escape') {
                e.preventDefault();
                if (onClose) onClose();
                if (onCancel) onCancel();
                return;
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [enabled]);
};

/**
 * Undo/Redo History Hook
 * 
 * Manages state history for undo/redo functionality
 * - Captures snapshots (debounced)
 * - Limits history size
 * - Provides undo/redo functions
 * 
 * @param {*} currentState - Current state to track
 * @param {number} maxHistory - Maximum history size (default: 20)
 * @param {number} debounceMs - Debounce time for capturing (default: 500ms)
 */
export function useHistory<T>(currentState: T, maxHistory: number = 20, debounceMs: number = 500) {
    const [history, setHistory] = useState<T[]>([currentState]);
    const [currentIndex, setCurrentIndex] = useState<number>(0);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isUndoingRef = useRef<boolean>(false);

    // Capture state changes (debounced)
    useEffect(() => {
        // Don't capture if we're in the middle of undo/redo
        if (isUndoingRef.current) {
            isUndoingRef.current = false;
            return;
        }

        // Debounce the history capture
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        timeoutRef.current = setTimeout(() => {
            setHistory(prev => {
                // Remove any "future" history if we're not at the end
                const newHistory = prev.slice(0, currentIndex + 1);

                // Add new state
                newHistory.push(currentState);

                // Limit history size
                if (newHistory.length > maxHistory) {
                    newHistory.shift();
                    setCurrentIndex(maxHistory - 1);
                } else {
                    setCurrentIndex(newHistory.length - 1);
                }

                return newHistory;
            });
        }, debounceMs);

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [currentState, debounceMs, maxHistory, currentIndex]);

    const undo = useCallback(() => {
        if (currentIndex > 0) {
            isUndoingRef.current = true;
            const newIndex = currentIndex - 1;
            setCurrentIndex(newIndex);
            return history[newIndex];
        }
        return null;
    }, [currentIndex, history]);

    const redo = useCallback(() => {
        if (currentIndex < history.length - 1) {
            isUndoingRef.current = true;
            const newIndex = currentIndex + 1;
            setCurrentIndex(newIndex);
            return history[newIndex];
        }
        return null;
    }, [currentIndex, history]);

    const canUndo = currentIndex > 0;
    const canRedo = currentIndex < history.length - 1;

    return {
        undo,
        redo,
        canUndo,
        canRedo,
        historyLength: history.length,
        currentIndex,
    };
}

/**
 * Auto-Save Hook
 * 
 * Automatically saves data after a period of inactivity
 * 
 * @param {Function} onSave - Function to call when auto-saving
 * @param {boolean} isDirty - Whether there are unsaved changes
 * @param {number} delayMs - Time to wait before auto-saving (default: 30000ms)
 */
export const useAutoSave = (onSave?: () => Promise<void> | void, isDirty: boolean = false, delayMs: number = 30000) => {
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!isDirty || !onSave) return;

        // Clear existing timeout
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        // Set new timeout
        timeoutRef.current = setTimeout(async () => {
            setIsSaving(true);
            try {
                await onSave();
                setLastSaved(new Date());
            } catch (error) {
                console.error('Auto-save failed:', error);
            } finally {
                setIsSaving(false);
            }
        }, delayMs);

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [isDirty, onSave, delayMs]);

    // Format relative time
    const getTimeAgo = useCallback((): string | null => {
        if (!lastSaved) return null;

        const seconds = Math.floor((new Date().getTime() - lastSaved.getTime()) / 1000);
        if (seconds < 60) return `hace ${seconds}s`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `hace ${minutes}m`;
        const hours = Math.floor(minutes / 60);
        return `hace ${hours}h`;
    }, [lastSaved]);

    return {
        lastSaved,
        isSaving,
        timeAgo: getTimeAgo(),
    };
};

export default {
    useKeyboardShortcuts,
    useHistory,
    useAutoSave,
};
