import { useState, useCallback } from 'react';
import { Shift } from '../../../schemas/scheduler';

export const useSchedulerState = () => {
    // View State
    const [viewMode, setViewMode] = useState<'day' | 'week'>('week');
    const [isPublishing, setIsPublishing] = useState(false);

    // Filter State
    const [showLunch, setShowLunch] = useState(false);
    const [showDinner, setShowDinner] = useState(false);
    const [showPrime, setShowPrime] = useState(false);

    // Draft & Edit State
    const [localShifts, setLocalShifts] = useState<Shift[]>([]);
    const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
    const [editingShift, setEditingShift] = useState<Shift | null>(null);
    const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);

    // Modals State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isQuickFillOpen, setIsQuickFillOpen] = useState(false);
    const [isGuideOpen, setIsGuideOpen] = useState(false);
    const [isSheriffOpen, setIsSheriffOpen] = useState(false);
    const [isOvertimeConfirmOpen, setIsOvertimeConfirmOpen] = useState(false);

    const hasUnsavedChanges = localShifts.length > 0 || deletedIds.size > 0;

    const addLocalShift = useCallback((shift: Shift) => {
        setLocalShifts(prev => {
            // Remove existing if any (simplistic upsert logic based on ID)
            const filtered = prev.filter(s => String(s.id) !== String(shift.id));
            return [...filtered, shift];
        });
    }, []);

    const removeLocalShift = useCallback((shiftId: string) => {
        setLocalShifts(prev => prev.filter(s => String(s.id) !== shiftId));
    }, []);

    const markAsDeleted = useCallback((shiftId: string) => {
        setDeletedIds(prev => {
            const newSet = new Set(prev);
            newSet.add(shiftId);
            return newSet;
        });
    }, []);

    const clearDrafts = useCallback(() => {
        setLocalShifts([]);
        setDeletedIds(new Set());
    }, []);

    return {
        viewMode, setViewMode,
        isPublishing, setIsPublishing,
        showLunch, setShowLunch,
        showDinner, setShowDinner,
        showPrime, setShowPrime,
        localShifts, setLocalShifts, // Exposed setter for complex logic if needed
        deletedIds, setDeletedIds,
        editingShift, setEditingShift,
        selectedShiftId, setSelectedShiftId,
        isModalOpen, setIsModalOpen,
        isQuickFillOpen, setIsQuickFillOpen,
        isGuideOpen, setIsGuideOpen,
        isSheriffOpen, setIsSheriffOpen,
        isOvertimeConfirmOpen, setIsOvertimeConfirmOpen,
        hasUnsavedChanges,
        addLocalShift,
        removeLocalShift,
        markAsDeleted,
        clearDrafts
    };
};
