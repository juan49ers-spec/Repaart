import React from 'react';
import { Maximize2, Minimize2, Type, Moon, Sun, BookOpen } from 'lucide-react';

interface FocusModeProps {
    isActive: boolean;
    onToggle: () => void;
    children: React.ReactNode;
    theme?: 'light' | 'dark' | 'paper';
    onThemeChange?: (theme: 'light' | 'dark' | 'paper') => void;
    wordCount?: number;
    charCount?: number;
}

export const FocusMode: React.FC<FocusModeProps> = ({
    isActive,
    onToggle,
    children,
    theme = 'light',
    onThemeChange,
    wordCount = 0,
    charCount = 0
}) => {
    if (!isActive) {
        return <>{children}</>;
    }

    const themeClasses = {
        light: 'bg-white text-slate-900',
        dark: 'bg-slate-950 text-slate-100',
        paper: 'bg-[#f5f5dc] text-slate-900'
    };

    return (
        <div className={`fixed inset-0 z-[180] ${themeClasses[theme]} transition-colors duration-300`}>
            {/* Top Bar */}
            <div className="absolute top-0 left-0 right-0 h-16 flex items-center justify-between px-6 border-b border-slate-200/20">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onToggle}
                        className="p-2 hover:bg-slate-200/50 rounded-xl transition-colors flex items-center gap-2 text-sm font-medium"
                    >
                        <Minimize2 className="w-4 h-4" />
                        Salir del modo Focus
                    </button>
                </div>

                <div className="flex items-center gap-4">
                    {/* Theme Selector */}
                    {onThemeChange && (
                        <div className="flex items-center gap-1 bg-slate-200/30 rounded-xl p-1">
                            <button
                                onClick={() => onThemeChange('light')}
                                className={`p-2 rounded-lg transition-all ${
                                    theme === 'light' ? 'bg-white shadow-sm' : 'hover:bg-slate-300/50'
                                }`}
                                title="Claro"
                            >
                                <Sun className="w-4 h-4" />
                            </button>
                            
                            <button
                                onClick={() => onThemeChange('dark')}
                                className={`p-2 rounded-lg transition-all ${
                                    theme === 'dark' ? 'bg-slate-700 shadow-sm' : 'hover:bg-slate-300/50'
                                }`}
                                title="Oscuro"
                            >
                                <Moon className="w-4 h-4" />
                            </button>
                            
                            <button
                                onClick={() => onThemeChange('paper')}
                                className={`p-2 rounded-lg transition-all ${
                                    theme === 'paper' ? 'bg-[#e8e8d0] shadow-sm' : 'hover:bg-slate-300/50'
                                }`}
                                title="Papel"
                            >
                                <BookOpen className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                            <Type className="w-3 h-3" />
                            {wordCount.toLocaleString()} palabras
                        </span>
                        <span>{charCount.toLocaleString()} caracteres</span>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="absolute top-16 bottom-0 left-0 right-0 overflow-auto">
                <div className="max-w-4xl mx-auto p-8">
                    {children}
                </div>
            </div>
        </div>
    );
};

// Botón para activar modo Focus
export const FocusModeToggle: React.FC<{
    isActive: boolean;
    onToggle: () => void;
}> = ({ isActive, onToggle }) => {
    return (
        <button
            onClick={onToggle}
            className={`p-2 rounded-xl transition-all flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${
                isActive 
                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' 
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500'
            }`}
            title={isActive ? 'Salir de modo Focus' : 'Modo Focus (Ctrl+F)'}
        >
            {isActive ? (
                <>
                    <Minimize2 className="w-3.5 h-3.5" />
                    <span>Focus</span>
                </>
            ) : (
                <>
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Focus</span>
                </>
            )}
        </button>
    );
};

export default FocusMode;
