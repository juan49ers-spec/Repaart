import React, { useEffect } from 'react';
import { useThemeStore } from '../../store/useThemeStore';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const { isDarkMode, toggleTheme } = useThemeStore();

  // Aplicar clase dark al HTML element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <button
      onClick={toggleTheme}
      className={`
        relative inline-flex items-center justify-center
        w-12 h-6 rounded-full transition-colors duration-300
        ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}
        ${className}
      `}
      aria-label={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
    >
      <span
        className={`
          absolute left-1 top-1
          w-4 h-4 rounded-full bg-white shadow-md
          transition-transform duration-300
          flex items-center justify-center
          ${isDarkMode ? 'translate-x-6' : 'translate-x-0'}
        `}
      >
        {isDarkMode ? (
          <Moon className="w-2.5 h-2.5 text-slate-700" />
        ) : (
          <Sun className="w-2.5 h-2.5 text-amber-500" />
        )}
      </span>
      <span className="sr-only">
        {isDarkMode ? 'Modo oscuro activo' : 'Modo claro activo'}
      </span>
    </button>
  );
};

export default ThemeToggle;
