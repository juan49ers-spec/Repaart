import { create } from 'zustand';

interface AppState {
    // UI State
    isSidebarOpen: boolean;
    isChatOpen: boolean;

    // Data View State
    selectedMonth: string;
    viewPeriod: 'month' | 'year';

    // Actions
    toggleSidebar: (isOpen?: boolean) => void;
    toggleChat: (isOpen?: boolean) => void;
    setSelectedMonth: (month: string) => void;
    setViewPeriod: (period: 'month' | 'year') => void;
}

export const useAppStore = create<AppState>((set) => ({
    // Initial State
    isSidebarOpen: false,
    isChatOpen: false,
    selectedMonth: new Date().toISOString().slice(0, 7),
    viewPeriod: 'month',

    // Actions
    toggleSidebar: (isOpen) => set((state) => ({
        isSidebarOpen: isOpen !== undefined ? isOpen : !state.isSidebarOpen
    })),
    toggleChat: (isOpen) => set((state) => ({
        isChatOpen: isOpen !== undefined ? isOpen : !state.isChatOpen
    })),
    setSelectedMonth: (month) => set({ selectedMonth: month }),
    setViewPeriod: (period) => set({ viewPeriod: period }),
}));
