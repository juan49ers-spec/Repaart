import { useContext } from 'react';
import { ThemeContext } from '../context/contexts';

interface ThemeContextType {
    theme: 'light' | 'dark';
    toggleTheme: () => void;
}

export const useTheme = (): ThemeContextType => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
