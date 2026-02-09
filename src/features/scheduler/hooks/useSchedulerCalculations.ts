import { useMemo, useCallback } from 'react';
import { startOfWeek, addDays, differenceInMinutes, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Shift, WeekData } from '../../../schemas/scheduler';
import { Rider } from '../../../store/useFleetStore';
import { toLocalDateString } from '../../../utils/dateUtils';

export const useSchedulerCalculations = (
    weekData: WeekData | null,
    localShifts: Shift[],
    deletedIds: Set<string>,
    rosterRiders: Rider[],
    selectedDate: Date,
    filters: {
        showLunch: boolean;
        showDinner: boolean;
        showPrime: boolean;
    }
) => {
    const { showLunch, showDinner, showPrime } = filters;

    // --- DAYS ARRAY ---
    const days = useMemo(() => {
        const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
        return Array.from({ length: 7 }).map((_, i) => {
            const date = addDays(new Date(start), i);
            const iso = toLocalDateString(date);
            return {
                date,
                dateObj: date,
                isoDate: iso,
                dayName: format(date, 'EEEE', { locale: es }),
                dayNum: format(date, 'd'),
                label: format(date, 'EEEE d', { locale: es }),
                shortLabel: format(date, 'EEE', { locale: es }),
                isToday: toLocalDateString(new Date()) === iso
            };
        });
    }, [selectedDate]);

    // --- MERGED SHIFTS ---
    const mergedShifts = useMemo(() => {
        const remote = weekData?.shifts || [];
        const filtered = remote.filter(s => !deletedIds.has(String(s.id || s.shiftId)));
        const final = [...filtered];

        localShifts.forEach(ls => {
            const idx = final.findIndex(s => String(s.id || s.shiftId) === String(ls.id || ls.shiftId));
            if (idx >= 0) {
                final[idx] = ls;
            } else {
                final.push(ls);
            }
        });
        return final;
    }, [weekData, localShifts, deletedIds]);

    // --- FILTER LOGIC ---
    const isFiltered = useCallback((startStr: string, endStr: string) => {
        if (!showLunch && !showDinner && !showPrime) return true;

        const start = new Date(startStr);
        const end = new Date(endStr);
        const startMin = start.getHours() * 60 + start.getMinutes();
        const endMin = end.getHours() * 60 + end.getMinutes();
        const crossesMidnight = end.getTime() > start.getTime() && end.getDate() !== start.getDate();
        const adjustedEndMin = crossesMidnight ? 1440 : (endMin === 0 ? 1440 : endMin);

        if (showPrime) {
            const p1Start = 720, p1End = 990;
            const p2Start = 1200, p2End = 1440;
            const overlapP1 = startMin < p1End && adjustedEndMin > p1Start;
            const overlapP2 = startMin < p2End && adjustedEndMin > p2Start;
            if (overlapP1 || overlapP2) return true;
        }

        let visible = false;
        if (showLunch) {
            const lStart = 720;
            const lEnd = 990;
            if (startMin < lEnd && adjustedEndMin > lStart) visible = true;
        }
        if (showDinner && !visible) {
            const dStart = 1200;
            const dEnd = 1440;
            if (startMin < dEnd && adjustedEndMin > dStart) visible = true;
        }
        return visible;
    }, [showLunch, showDinner, showPrime]);

    // --- VISUAL BLOCKS ---
    const processRiderShifts = useCallback((shifts: Shift[]) => {
        if (!shifts.length) return [];
        const sorted = [...shifts].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

        const visualBlocks: {
            startAt: string;
            endAt: string;
            ids: string[];
            shifts: Shift[];
            type: 'confirmed' | 'request' | 'draft';
            isNew?: boolean;
        }[] = [];
        let currentBlock: any = null;

        sorted.forEach((s) => {
            const sStart = new Date(s.startAt);
            if (currentBlock &&
                Math.abs(differenceInMinutes(sStart, new Date(currentBlock.endAt))) < 15) {
                currentBlock.endAt = s.endAt;
                currentBlock.ids.push(String(s.id));
                currentBlock.shifts.push(s);
            } else {
                if (currentBlock) visualBlocks.push(currentBlock);
                currentBlock = {
                    startAt: s.startAt,
                    endAt: s.endAt,
                    ids: [String(s.id)],
                    shifts: [s],
                    type: s.isConfirmed ? 'confirmed' : s.changeRequested ? 'request' : 'draft',
                    isNew: s.isNew
                };
            }
        });
        if (currentBlock) visualBlocks.push(currentBlock);
        return visualBlocks;
    }, []);

    // --- RIDERS GRID ---
    const ridersGrid = useMemo(() => {
        const activeRiders = rosterRiders.filter(r => r.status === 'active' || r.status === 'on_route');
        const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
        const weekEnd = addDays(new Date(weekStart), 7);
        const weekStartTs = weekStart.getTime();
        const weekEndTs = weekEnd.getTime();

        return activeRiders.map(rider => {
            const riderIdStr = String(rider.id);
            const allRiderShifts = mergedShifts.filter(s => String(s.riderId) === riderIdStr);
            const displayedShifts = allRiderShifts.filter(s => isFiltered(s.startAt, s.endAt));
            const visualBlocks = processRiderShifts(displayedShifts);

            const totalHoursCount = allRiderShifts.reduce((acc, s) => {
                const start = new Date(s.startAt);
                if (start.getTime() < weekStartTs || start.getTime() >= weekEndTs) return acc;
                const end = new Date(s.endAt);
                return acc + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
            }, 0);

            return {
                ...rider,
                totalWeeklyHours: totalHoursCount,
                visualBlocks,
                shifts: displayedShifts
            };
        }).sort((a, b) => a.fullName.localeCompare(b.fullName));
    }, [rosterRiders, mergedShifts, isFiltered, selectedDate, processRiderShifts]);

    // --- TOTALS ---
    const totalWeeklyCost = useMemo(() => {
        return ridersGrid.reduce((total, rider) => {
            return total + (rider.totalWeeklyHours * 12 * 1.30);
        }, 0);
    }, [ridersGrid]);

    const totalHours = ridersGrid.reduce((acc, r) => acc + r.totalWeeklyHours, 0);

    // --- COVERAGE ---
    const coverage = useMemo(() => {
        const res: Record<string, number[]> = {};
        days.forEach(d => res[d.isoDate] = Array(24).fill(0));

        mergedShifts.forEach(s => {
            const sStart = new Date(s.startAt);
            const sEnd = new Date(s.endAt);
            const temp = new Date(sStart);
            temp.setMinutes(0, 0, 0);

            while (temp.getTime() < sEnd.getTime()) {
                const dateIso = toLocalDateString(temp);
                const hour = temp.getHours();
                if (res[dateIso]) {
                    res[dateIso][hour]++;
                }
                temp.setHours(temp.getHours() + 1);
            }
        });
        return res;
    }, [days, mergedShifts]);

    return {
        days,
        mergedShifts,
        ridersGrid,
        totalWeeklyCost,
        totalHours,
        coverage,
        isFiltered
    };
};
