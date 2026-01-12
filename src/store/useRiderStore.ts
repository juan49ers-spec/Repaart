import { create } from 'zustand';
import { Shift, shiftService } from '../services/shiftService';
import { Unsubscribe } from 'firebase/firestore';

interface RiderState {
    myShifts: Shift[];
    isLoading: boolean;
    currentDate: Date;
    selectedDate: Date;

    // Actions
    fetchMyShifts: (riderId: string) => void;
    setCurrentDate: (date: Date) => void;
    setSelectedDate: (date: Date) => void;
    // Optimistic Update
    updateLocalShift: (shiftId: string, updates: Partial<Shift>) => void;
}

export const useRiderStore = create<RiderState>((set) => {
    let unsubscribe: Unsubscribe | null = null;

    return {
        myShifts: [],
        isLoading: false,
        currentDate: new Date(),
        selectedDate: new Date(),

        setCurrentDate: (date: Date) => set({ currentDate: date }),
        setSelectedDate: (date: Date) => set({ selectedDate: date }),

        updateLocalShift: (shiftId: string, updates: Partial<Shift>) => set(state => ({
            myShifts: state.myShifts.map(s => s.shiftId === shiftId ? { ...s, ...updates } : s)
        })),

        fetchMyShifts: (riderId: string) => {
            set({ isLoading: true });

            // Unsubscribe previous listener if exists
            if (unsubscribe) {
                unsubscribe();
            }

            // Calculate range: Today - 7 days to Today + 30 days
            const start = new Date();
            start.setDate(start.getDate() - 7);
            start.setHours(0, 0, 0, 0);

            const end = new Date();
            end.setDate(end.getDate() + 30); // Next 30 days

            unsubscribe = shiftService.getMyShifts(riderId, start, end, (shifts) => {
                set({ myShifts: shifts, isLoading: false });
            });
        }
    };
});
