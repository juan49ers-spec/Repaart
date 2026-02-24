import React, { useState, useRef } from 'react';
import { cn } from '../../../lib/utils';

interface LazyImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  placeholder?: 'blur' | 'color' | 'none';
  placeholderColor?: string;
  fallbackSrc?: string;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * LazyImage - Imagen con lazy loading y placeholder
 * 
 * Features:
 * - Native lazy loading (loading="lazy")
 * - Placeholder mientras carga
 * - Fallback en caso de error
 * - Animación suave al cargar
 * - Soporte para aspect ratio
 * 
 * Usage:
 * ```tsx
 * <LazyImage
 *   src="/photo.jpg"
 *   alt="Descripción"
 *   width={800}
 *   height={600}
 *   placeholder="blur"
 *   fallbackSrc="/placeholder.jpg"
 * />
 * ```
 */
export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  width,
  height,
  className = '',
  placeholder = 'blur',
  placeholderColor = '#e2e8f0',
  fallbackSrc,
  onLoad,
  onError
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);
  const imgRef = useRef<HTMLImageElement>(null);
  // Reset state when src changes
  React.useEffect(() => {
    setCurrentSrc(src);
    setIsLoaded(false);
    setHasError(false);
  }, [src]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
    } else {
      setHasError(true);
      onError?.();
    }
  };

  const aspectRatio = width && height ? `${width} / ${height}` : undefined;

  return (
    <div
      className={cn(
        'relative overflow-hidden',
        className
      )}
      style={{ aspectRatio }}
    >
      {/* Placeholder */}
      {!isLoaded && placeholder !== 'none' && (
        <div
          data-testid="image-placeholder"
          className={cn(
            'absolute inset-0',
            'transition-opacity duration-500',
            isLoaded && 'opacity-0'
          )}
          style={{
            backgroundColor: placeholder === 'color' ? placeholderColor : undefined,
            backgroundImage: placeholder === 'blur'
              ? 'linear-gradient(90deg, #f1f5f9 0%, #e2e8f0 50%, #f1f5f9 100%)'
              : undefined,
            backgroundSize: '200% 100%',
            animation: placeholder === 'blur' ? 'shimmer 1.5s infinite' : undefined
          }}
        />
      )}

      {/* Error State */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-800">
          <span className="text-slate-400 text-sm">Error al cargar imagen</span>
        </div>
      )}

      {/* Image */}
      {!hasError && (
        <img
          ref={imgRef}
          src={currentSrc}
          alt={alt}
          width={width}
          height={height}
          loading="lazy"
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'w-full h-full object-cover',
            'transition-opacity duration-500',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
        />
      )}

      {/* CSS for shimmer animation */}
      <style>{
        `
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        `
      }</style>
    </div>
  );
};

export default LazyImage;
