import { create } from 'zustand';

interface AcademyStore {
    isPlayerFloating: boolean;
    setPlayerFloating: (floating: boolean) => void;

    // For syncing notes to video time
    currentTime: number;
    setCurrentTime: (time: number) => void;

    // For jumping to timestamp from note
    seekTarget: number | null;
    setSeekTarget: (time: number | null) => void;
}

export const useAcademyStore = create<AcademyStore>((set) => ({
    isPlayerFloating: false,
    setPlayerFloating: (floating) => set({ isPlayerFloating: floating }),

    currentTime: 0,
    setCurrentTime: (time) => set({ currentTime: time }),

    seekTarget: null,
    setSeekTarget: (time) => set({ seekTarget: time })
}));
