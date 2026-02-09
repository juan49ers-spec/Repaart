import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSchedulerState } from '../useSchedulerState';
import { Shift } from '../../../../schemas/scheduler';

describe('useSchedulerState', () => {
    const mockShift: Shift = {
        id: 'shift-1',
        franchiseId: 'franchise-1',
        riderId: 'rider-1',
        startAt: '2024-01-15T10:00:00',
        endAt: '2024-01-15T14:00:00'
    };

    describe('Initial State', () => {
        it('should initialize with default values', () => {
            const { result } = renderHook(() => useSchedulerState());

            expect(result.current.viewMode).toBe('week');
            expect(result.current.isPublishing).toBe(false);
            expect(result.current.showLunch).toBe(false);
            expect(result.current.showDinner).toBe(false);
            expect(result.current.showPrime).toBe(false);
            expect(result.current.localShifts).toEqual([]);
            expect(result.current.deletedIds.size).toBe(0);
            expect(result.current.editingShift).toBeNull();
            expect(result.current.isModalOpen).toBe(false);
            expect(result.current.hasUnsavedChanges).toBe(false);
        });
    });

    describe('View Mode', () => {
        it('should toggle view mode between day and week', () => {
            const { result } = renderHook(() => useSchedulerState());

            act(() => {
                result.current.setViewMode('day');
            });
            expect(result.current.viewMode).toBe('day');

            act(() => {
                result.current.setViewMode('week');
            });
            expect(result.current.viewMode).toBe('week');
        });
    });

    describe('Filter State', () => {
        it('should toggle lunch filter', () => {
            const { result } = renderHook(() => useSchedulerState());

            act(() => {
                result.current.setShowLunch(true);
            });
            expect(result.current.showLunch).toBe(true);
        });

        it('should toggle dinner filter', () => {
            const { result } = renderHook(() => useSchedulerState());

            act(() => {
                result.current.setShowDinner(true);
            });
            expect(result.current.showDinner).toBe(true);
        });

        it('should toggle prime time filter', () => {
            const { result } = renderHook(() => useSchedulerState());

            act(() => {
                result.current.setShowPrime(true);
            });
            expect(result.current.showPrime).toBe(true);
        });
    });

    describe('Local Shifts Management', () => {
        it('should add a local shift', () => {
            const { result } = renderHook(() => useSchedulerState());

            act(() => {
                result.current.addLocalShift(mockShift);
            });

            expect(result.current.localShifts).toHaveLength(1);
            expect(result.current.localShifts[0]).toEqual(mockShift);
            expect(result.current.hasUnsavedChanges).toBe(true);
        });

        it('should update existing shift via upsert logic', () => {
            const { result } = renderHook(() => useSchedulerState());

            act(() => {
                result.current.addLocalShift(mockShift);
            });

            const updatedShift = { ...mockShift, riderId: 'rider-2' };
            act(() => {
                result.current.addLocalShift(updatedShift);
            });

            expect(result.current.localShifts).toHaveLength(1);
            expect(result.current.localShifts[0].riderId).toBe('rider-2');
        });

        it('should remove a local shift', () => {
            const { result } = renderHook(() => useSchedulerState());

            act(() => {
                result.current.addLocalShift(mockShift);
            });

            act(() => {
                result.current.removeLocalShift('shift-1');
            });

            expect(result.current.localShifts).toHaveLength(0);
        });
    });

    describe('Deleted IDs Management', () => {
        it('should mark shift as deleted', () => {
            const { result } = renderHook(() => useSchedulerState());

            act(() => {
                result.current.markAsDeleted('shift-1');
            });

            expect(result.current.deletedIds.has('shift-1')).toBe(true);
            expect(result.current.hasUnsavedChanges).toBe(true);
        });

        it('should accumulate multiple deleted IDs', () => {
            const { result } = renderHook(() => useSchedulerState());

            act(() => {
                result.current.markAsDeleted('shift-1');
                result.current.markAsDeleted('shift-2');
            });

            expect(result.current.deletedIds.size).toBe(2);
        });
    });

    describe('Clear Drafts', () => {
        it('should clear all local shifts and deleted IDs', () => {
            const { result } = renderHook(() => useSchedulerState());

            act(() => {
                result.current.addLocalShift(mockShift);
                result.current.markAsDeleted('shift-2');
            });

            expect(result.current.hasUnsavedChanges).toBe(true);

            act(() => {
                result.current.clearDrafts();
            });

            expect(result.current.localShifts).toHaveLength(0);
            expect(result.current.deletedIds.size).toBe(0);
            expect(result.current.hasUnsavedChanges).toBe(false);
        });
    });

    describe('Modal State', () => {
        it('should toggle modal open state', () => {
            const { result } = renderHook(() => useSchedulerState());

            act(() => {
                result.current.setIsModalOpen(true);
            });
            expect(result.current.isModalOpen).toBe(true);

            act(() => {
                result.current.setIsModalOpen(false);
            });
            expect(result.current.isModalOpen).toBe(false);
        });

        it('should set editing shift', () => {
            const { result } = renderHook(() => useSchedulerState());

            act(() => {
                result.current.setEditingShift(mockShift);
            });
            expect(result.current.editingShift).toEqual(mockShift);
        });
    });
});
