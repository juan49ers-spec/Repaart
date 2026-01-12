import { create } from 'zustand';
import { Shift } from '../hooks/useWeeklySchedule';

interface SchedulerState {
    shifts: Shift[];
    viewMode: 'compact' | 'expanded';
    setShifts: (shifts: Shift[]) => void;
    setViewMode: (mode: 'compact' | 'expanded') => void;

    // Selectors logic can be derived or helper functions
    getActiveRidersCount: (date: Date) => number;
}

export const useSchedulerStore = create<SchedulerState>((set, get) => ({
    shifts: [],
    viewMode: 'compact', // Default to V13-ish compact

    setShifts: (shifts) => set({ shifts }),
    setViewMode: (viewMode) => set({ viewMode }),

    getActiveRidersCount: (targetDate: Date) => {
        const { shifts } = get();
        const targetTime = targetDate.getTime();

        return shifts.filter(shift => {
            const start = new Date(shift.startAt).getTime();
            const end = new Date(shift.endAt).getTime();
            return targetTime >= start && targetTime < end;
        }).length;
    }
}));
