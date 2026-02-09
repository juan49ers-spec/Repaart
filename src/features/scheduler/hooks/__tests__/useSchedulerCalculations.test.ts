import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSchedulerCalculations } from '../useSchedulerCalculations';
import { Shift, WeekData } from '../../../../schemas/scheduler';
import { Rider } from '../../../../store/useFleetStore';

describe('useSchedulerCalculations', () => {
    const baseDate = new Date('2024-01-15'); // Monday

    const mockRiders: Rider[] = [
        { id: 'r1', fullName: 'Juan García', status: 'active', email: 'juan@test.com', phone: '', metrics: { totalDeliveries: 0, rating: 0, efficiency: 0, joinedAt: '' }, skills: [] },
        { id: 'r2', fullName: 'Ana López', status: 'active', email: 'ana@test.com', phone: '', metrics: { totalDeliveries: 0, rating: 0, efficiency: 0, joinedAt: '' }, skills: [] }
    ];

    const mockShift: Shift = {
        id: 'shift-1',
        franchiseId: 'f1',
        riderId: 'r1',
        startAt: '2024-01-15T10:00:00',
        endAt: '2024-01-15T14:00:00'
    };

    const mockWeekData: WeekData = {
        startDate: '2024-01-15',
        status: 'active',
        metrics: { totalHours: 0, activeRiders: 0, motosInUse: 0 },
        shifts: [mockShift]
    };

    const defaultFilters = {
        showLunch: false,
        showDinner: false,
        showPrime: false
    };

    describe('Days Array', () => {
        it('should generate 7 days starting from Monday', () => {
            const { result } = renderHook(() =>
                useSchedulerCalculations(mockWeekData, [], new Set(), mockRiders, baseDate, defaultFilters)
            );

            expect(result.current.days).toHaveLength(7);
            expect(result.current.days[0].dayName.toLowerCase()).toContain('lunes'); // Monday in Spanish
        });

        it('should mark today correctly', () => {
            const today = new Date();
            const { result } = renderHook(() =>
                useSchedulerCalculations(mockWeekData, [], new Set(), mockRiders, today, defaultFilters)
            );

            const todayDays = result.current.days.filter(d => d.isToday);
            expect(todayDays.length).toBeLessThanOrEqual(1);
        });
    });

    describe('Merged Shifts', () => {
        it('should include remote shifts from weekData', () => {
            const { result } = renderHook(() =>
                useSchedulerCalculations(mockWeekData, [], new Set(), mockRiders, baseDate, defaultFilters)
            );

            expect(result.current.mergedShifts).toHaveLength(1);
            expect(result.current.mergedShifts[0].id).toBe('shift-1');
        });

        it('should merge local shifts with remote shifts', () => {
            const localShift: Shift = {
                id: 'shift-2',
                franchiseId: 'f1',
                riderId: 'r2',
                startAt: '2024-01-16T12:00:00',
                endAt: '2024-01-16T16:00:00'
            };

            const { result } = renderHook(() =>
                useSchedulerCalculations(mockWeekData, [localShift], new Set(), mockRiders, baseDate, defaultFilters)
            );

            expect(result.current.mergedShifts).toHaveLength(2);
        });

        it('should update existing shift when local version exists', () => {
            const updatedShift: Shift = {
                ...mockShift,
                riderId: 'r2' // Updated rider
            };

            const { result } = renderHook(() =>
                useSchedulerCalculations(mockWeekData, [updatedShift], new Set(), mockRiders, baseDate, defaultFilters)
            );

            expect(result.current.mergedShifts).toHaveLength(1);
            expect(result.current.mergedShifts[0].riderId).toBe('r2');
        });

        it('should exclude deleted shifts', () => {
            const deletedIds = new Set(['shift-1']);

            const { result } = renderHook(() =>
                useSchedulerCalculations(mockWeekData, [], deletedIds, mockRiders, baseDate, defaultFilters)
            );

            expect(result.current.mergedShifts).toHaveLength(0);
        });
    });

    describe('Riders Grid', () => {
        it('should include only active riders', () => {
            const ridersWithInactive: Rider[] = [
                ...mockRiders,
                { id: 'r3', fullName: 'Carlos Ruiz', status: 'inactive', email: '', phone: '', metrics: { totalDeliveries: 0, rating: 0, efficiency: 0, joinedAt: '' } }
            ];

            const { result } = renderHook(() =>
                useSchedulerCalculations(mockWeekData, [], new Set(), ridersWithInactive, baseDate, defaultFilters)
            );

            expect(result.current.ridersGrid).toHaveLength(2);
        });

        it('should calculate weekly hours per rider', () => {
            const { result } = renderHook(() =>
                useSchedulerCalculations(mockWeekData, [], new Set(), mockRiders, baseDate, defaultFilters)
            );

            const riderWithShift = result.current.ridersGrid.find(r => r.id === 'r1');
            expect(riderWithShift?.totalWeeklyHours).toBe(4); // 10:00-14:00 = 4 hours
        });

        it('should sort riders alphabetically by name', () => {
            const { result } = renderHook(() =>
                useSchedulerCalculations(mockWeekData, [], new Set(), mockRiders, baseDate, defaultFilters)
            );

            expect(result.current.ridersGrid[0].fullName).toBe('Ana López');
            expect(result.current.ridersGrid[1].fullName).toBe('Juan García');
        });
    });

    describe('Totals', () => {
        it('should calculate total weekly cost', () => {
            const { result } = renderHook(() =>
                useSchedulerCalculations(mockWeekData, [], new Set(), mockRiders, baseDate, defaultFilters)
            );

            // 4 hours * 12€/hour * 1.30 overhead = 62.4€
            expect(result.current.totalWeeklyCost).toBeCloseTo(62.4, 1);
        });

        it('should calculate total hours across all riders', () => {
            const { result } = renderHook(() =>
                useSchedulerCalculations(mockWeekData, [], new Set(), mockRiders, baseDate, defaultFilters)
            );

            expect(result.current.totalHours).toBe(4);
        });
    });

    describe('Filter Logic', () => {
        it('should show all shifts when no filters active', () => {
            const { result } = renderHook(() =>
                useSchedulerCalculations(mockWeekData, [], new Set(), mockRiders, baseDate, defaultFilters)
            );

            expect(result.current.isFiltered('2024-01-15T10:00:00', '2024-01-15T14:00:00')).toBe(true);
        });

        it('should filter lunch shifts (12:00-16:30)', () => {
            const filters = { showLunch: true, showDinner: false, showPrime: false };
            const { result } = renderHook(() =>
                useSchedulerCalculations(mockWeekData, [], new Set(), mockRiders, baseDate, filters)
            );

            // 13:00-15:00 overlaps lunch (12:00-16:30)
            expect(result.current.isFiltered('2024-01-15T13:00:00', '2024-01-15T15:00:00')).toBe(true);
            // 08:00-11:00 does not overlap lunch
            expect(result.current.isFiltered('2024-01-15T08:00:00', '2024-01-15T11:00:00')).toBe(false);
        });

        it('should filter dinner shifts (20:00-24:00)', () => {
            const filters = { showLunch: false, showDinner: true, showPrime: false };
            const { result } = renderHook(() =>
                useSchedulerCalculations(mockWeekData, [], new Set(), mockRiders, baseDate, filters)
            );

            // 21:00-23:00 overlaps dinner
            expect(result.current.isFiltered('2024-01-15T21:00:00', '2024-01-15T23:00:00')).toBe(true);
            // 08:00-11:00 does not overlap dinner
            expect(result.current.isFiltered('2024-01-15T08:00:00', '2024-01-15T11:00:00')).toBe(false);
        });
    });

    describe('Coverage', () => {
        it('should track hourly coverage per day', () => {
            const { result } = renderHook(() =>
                useSchedulerCalculations(mockWeekData, [], new Set(), mockRiders, baseDate, defaultFilters)
            );

            const mondayISO = '2024-01-15';
            expect(result.current.coverage[mondayISO]).toBeDefined();
            // Shift from 10:00-14:00 should have coverage at hours 10, 11, 12, 13
            expect(result.current.coverage[mondayISO][10]).toBe(1);
            expect(result.current.coverage[mondayISO][11]).toBe(1);
            expect(result.current.coverage[mondayISO][12]).toBe(1);
            expect(result.current.coverage[mondayISO][13]).toBe(1);
            expect(result.current.coverage[mondayISO][14]).toBe(0); // End hour not counted
        });
    });
});
