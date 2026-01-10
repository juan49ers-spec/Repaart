import React, { useState, useEffect, ReactNode, useContext } from 'react';
import { ThemeContext } from './contexts';

type Theme = 'light' | 'dark';

export const useTheme = () => useContext(ThemeContext);

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
}

interface ThemeProviderProps {
    children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
    const [theme, setTheme] = useState<Theme>(
        () => (localStorage.getItem('theme') as Theme) || 'light'
    );

    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    const value: ThemeContextType = { theme, toggleTheme };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};
