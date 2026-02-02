import React from 'react';
import { cn } from '../../../lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  className?: string;
  fullScreen?: boolean;
}

/**
 * LoadingSpinner - Indicador de carga accesible
 * 
 * Features:
 * - Múltiples tamaños
 * - Texto opcional
 * - Accesible (role="status", aria-label)
 * - Soporte para pantalla completa
 * - Animación suave
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  text,
  className = '',
  fullScreen = false
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
    xl: 'w-16 h-16 border-4'
  };

  const spinner = (
    <div
      role="status"
      aria-label="Cargando"
      className={cn(
        'inline-block rounded-full',
        'border-slate-200 dark:border-slate-700',
        'border-t-indigo-600 dark:border-t-indigo-400',
        'animate-spin',
        sizeClasses[size],
        className
      )}
    >
      <span className="sr-only">Cargando...</span>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4">
          {spinner}
          {text && (
            <p className="text-fluid-base text-slate-600 dark:text-slate-400 font-medium">
              {text}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {spinner}
      {text && (
        <span className="text-fluid-sm text-slate-600 dark:text-slate-400">
          {text}
        </span>
      )}
    </div>
  );
};

export default LoadingSpinner;
