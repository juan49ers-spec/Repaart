import React from 'react';
import { X } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface ResponsiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

/**
 * ResponsiveModal - Modal con Container Queries
 * 
 * Features:
 * - @container: Se adapta al tamaño del contenedor padre
 * - Responsive sizing: Cambia tamaño según el breakpoint
 * - Safe areas: Respeta notch en iPhone X+
 * - Fluid typography: Texto que se adapta
 * - Touch targets: Botones accesibles (44px mínimo)
 * 
 * Breakpoints:
 * - @xs (320px): Pantalla completa en móvil
 * - @sm (480px): Modal pequeño
 * - @md (768px): Modal mediano
 * - @lg (1024px): Modal grande
 * - @xl (1280px): Modal extra grande
 */
export const ResponsiveModal: React.FC<ResponsiveModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className = '',
  size = 'md'
}) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: '@xs:max-w-sm @sm:max-w-sm @md:max-w-md',
    md: '@xs:max-w-sm @sm:max-w-md @md:max-w-lg @lg:max-w-xl',
    lg: '@xs:max-w-md @sm:max-w-lg @md:max-w-xl @lg:max-w-2xl @xl:max-w-3xl',
    xl: '@xs:max-w-lg @sm:max-w-xl @md:max-w-2xl @lg:max-w-3xl @xl:max-w-4xl',
    full: '@xs:w-full @sm:w-full @md:w-full @lg:w-11/12'
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-safe responsive-modal-wrapper @container"
      onClick={onClose}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm responsive-modal-overlay animate-in fade-in duration-200" />
      
      {/* Modal Content */}
      <div
        className={cn(
          'relative bg-white dark:bg-slate-900',
          'rounded-2xl @xs:rounded-none @sm:rounded-xl @md:rounded-2xl',
          'shadow-2xl',
          'w-full max-h-[90vh] @xs:max-h-screen @sm:max-h-[85vh]',
          'overflow-hidden',
          'flex flex-col',
          'animate-in zoom-in-95 duration-200',
          'p-4 @xs:p-5 @sm:p-6 @md:p-8',
          sizeClasses[size],
          'responsive-modal-content',
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 @xs:pb-5 @sm:pb-6 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-fluid-xl font-semibold text-slate-900 dark:text-slate-100 pr-4">
            {title}
          </h2>
          
          <button
            onClick={onClose}
            title="Cerrar"
            className={cn(
              'min-h-touch min-w-touch',
              'flex items-center justify-center',
              'rounded-full',
              'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300',
              'hover:bg-slate-100 dark:hover:bg-slate-800',
              'transition-colors'
            )}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Body */}
        <div className="flex-1 overflow-y-auto py-4 @xs:py-5 @sm:py-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default ResponsiveModal;
