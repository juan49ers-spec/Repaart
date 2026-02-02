import React from 'react';
import { cn } from '../../../lib/utils';

/**
 * SkipLink - Enlace para saltar al contenido principal
 * 
 * Mejora la accesibilidad permitiendo a usuarios de teclado
 * saltar directamente al contenido principal, evitando navegación repetitiva.
 * 
 * Usage:
 * ```tsx
 * <SkipLink targetId="main-content" />
 * <nav>...navegación...</nav>
 * <main id="main-content">...contenido...</main>
 * ```
 */
interface SkipLinkProps {
  targetId: string;
  label?: string;
  className?: string;
}

export const SkipLink: React.FC<SkipLinkProps> = ({
  targetId,
  label = 'Saltar al contenido principal',
  className = ''
}) => {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <a
      href={`#${targetId}`}
      onClick={handleClick}
      className={cn(
        'sr-only focus:not-sr-only',
        'fixed top-4 left-4 z-[100]',
        'px-4 py-2',
        'bg-indigo-600 text-white',
        'rounded-lg font-medium',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500',
        'transition-all',
        className
      )}
    >
      {label}
    </a>
  );
};

export default SkipLink;
