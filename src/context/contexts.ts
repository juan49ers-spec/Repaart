import { createContext } from 'react';

interface ToastContextType {
    addToast: (message: string, type?: 'info' | 'success' | 'error' | 'warning', duration?: number) => void;
    removeToast: (id: string) => void;
}

interface ThemeContextType {
    theme: 'light' | 'dark';
    toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
export const ToastContext = createContext<ToastContextType | undefined>(undefined);
