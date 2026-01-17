import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';

const ThemeToggle: React.FC = () => {
    const context = useTheme();
    if (!context) return null;
    const { theme, toggleTheme } = context;
    const isDark = theme === 'dark';

    return (
        <button
            onClick={toggleTheme}
            className={`
                group relative p-2.5 rounded-xl transition-all duration-500 overflow-hidden
                ${isDark
                    ? 'bg-slate-800/80 text-amber-400 hover:bg-slate-700 ring-1 ring-slate-700 shadow-[0_0_15px_rgba(251,191,36,0.1)]'
                    : 'bg-white text-indigo-600 hover:bg-indigo-50 ring-1 ring-slate-200 shadow-sm'
                }
                active:scale-95
            `}
            title={isDark ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
            aria-label="Toggle theme"
        >
            <div className={`
                relative z-10 transition-all duration-700 ease-spring
                ${isDark ? 'rotate-[360deg] scale-100' : 'rotate-0 scale-100'}
            `}>
                {isDark ? (
                    <Moon className="w-5 h-5 fill-amber-400/20" />
                ) : (
                    <Sun className="w-5 h-5 fill-indigo-600/10" />
                )}
            </div>

            {/* Subtle background flash effect on click */}
            <div className={`
                absolute inset-0 opacity-0 group-active:opacity-100 transition-opacity duration-300
                ${isDark ? 'bg-amber-400/10' : 'bg-indigo-600/5'}
            `} />
        </button>
    );
};

export default ThemeToggle;
