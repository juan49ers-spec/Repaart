import React from 'react';
import { X, Info, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface AlertProps {
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  title?: string;
  onClose?: () => void;
  className?: string;
}

/**
 * Alert - Mensaje de feedback al usuario
 * 
 * Features:
 * - 4 tipos: info, success, warning, error
 * - Iconos intuitivos
 * - Botón de cerrar opcional
 * - Accesible (role="alert")
 * - Animaciones suaves
 */
export const Alert: React.FC<AlertProps> = ({
  type,
  message,
  title,
  onClose,
  className = ''
}) => {
  const styles = {
    info: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      text: 'text-blue-800 dark:text-blue-200',
      icon: Info,
      iconColor: 'text-blue-500'
    },
    success: {
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      border: 'border-emerald-200 dark:border-emerald-800',
      text: 'text-emerald-800 dark:text-emerald-200',
      icon: CheckCircle,
      iconColor: 'text-emerald-500'
    },
    warning: {
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      border: 'border-amber-200 dark:border-amber-800',
      text: 'text-amber-800 dark:text-amber-200',
      icon: AlertTriangle,
      iconColor: 'text-amber-500'
    },
    error: {
      bg: 'bg-rose-50 dark:bg-rose-900/20',
      border: 'border-rose-200 dark:border-rose-800',
      text: 'text-rose-800 dark:text-rose-200',
      icon: AlertCircle,
      iconColor: 'text-rose-500'
    }
  };

  const style = styles[type];
  const Icon = style.icon;

  return (
    <div
      role="alert"
      className={cn(
        'relative p-4 rounded-xl border',
        'animate-in fade-in slide-in-from-top-2',
        style.bg,
        style.border,
        className
      )}
    >
      <div className="flex gap-3">
        <Icon className={cn('w-5 h-5 flex-shrink-0 mt-0.5', style.iconColor)} />
        
        <div className="flex-1">
          {title && (
            <h3 className={cn('font-semibold mb-1', style.text)}>
              {title}
            </h3>
          )}
          <p className={cn('text-fluid-sm', style.text)}>
            {message}
          </p>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className={cn(
              'flex-shrink-0 -mr-1 -mt-1 p-1 rounded-lg',
              'hover:bg-black/5 dark:hover:bg-white/5',
              'transition-colors',
              style.text
            )}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Alert;
