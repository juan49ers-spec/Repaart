import React from 'react';
import { useTheme } from '../../hooks/useTheme';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
    className?: string;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className={`p-2 rounded-full transition-colors duration-200 ${theme === 'dark'
                ? 'bg-slate-700 text-yellow-400 hover:bg-slate-600'
                : 'bg-indigo-50 text-indigo-500 hover:bg-indigo-100'
                } ${className}`}
            title={theme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
        >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
    );
};

export default ThemeToggle;
