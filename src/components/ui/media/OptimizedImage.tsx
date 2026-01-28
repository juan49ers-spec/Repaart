import React, { useState, useRef, useEffect } from 'react';

interface OptimizedImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'srcSet' | 'sizes'> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  sizes?: string;
  quality?: number;
  format?: 'webp' | 'avif' | 'jpeg' | 'png';
  lazy?: boolean;
  placeholder?: 'blur' | 'empty';
  blurData?: string;
  onLoad?: () => void;
  onError?: () => void;
}

const generateSrcSet = (baseUrl: string, widths: number[], format: string = 'webp'): string => {
  return widths
    .map(width => {
      const size = `${width}w`;
      const url = baseUrl.replace(/\.(jpg|jpeg|png|gif)$/i, `.${format}?w=${width}`);
      return `${url} ${size}`;
    })
    .join(', ');
};

const defaultSizes = `
  (max-width: 640px) 100vw,
  (max-width: 1024px) 50vw,
  (max-width: 1536px) 33vw,
  25vw
`;

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  sizes = defaultSizes,
  quality = 85,
  format = 'webp',
  lazy = true,
  placeholder = 'empty',
  blurData,
  onLoad,
  onError,
  className = '',
  style,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const widths = [320, 640, 768, 1024, 1280, 1536, 1920];

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setIsError(true);
    onError?.();
  };

  useEffect(() => {
    if (!lazy && imgRef.current) {
      imgRef.current.src = imgRef.current.src;
    }
  }, [lazy]);

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        width: width ? `${width}px` : '100%',
        height: height ? `${height}px` : 'auto',
        backgroundColor: placeholder === 'blur' && blurData ? 'transparent' : '#f3f4f6',
        ...style
      }}
    >
      {/* Blur placeholder */}
      {placeholder === 'blur' && blurData && !isLoaded && (
        <div
          className="absolute inset-0 transition-opacity duration-300"
          style={{
            backgroundImage: `url(${blurData})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(20px)',
            opacity: 1
          }}
        />
      )}

      {/* Main image */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        width={width}
        height={height}
        srcSet={generateSrcSet(src, widths, format)}
        sizes={sizes}
        loading={lazy ? 'lazy' : 'eager'}
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        className={`
          relative z-10 w-full h-full object-cover
          transition-opacity duration-300
          ${isLoaded ? 'opacity-100' : 'opacity-0'}
          ${isError ? 'hidden' : ''}
        `}
        {...props}
      />

      {/* Fallback for errors */}
      {isError && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 text-slate-400">
          <svg
            className="w-12 h-12"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      )}

      {/* Loading skeleton */}
      {!isLoaded && !isError && placeholder === 'empty' && (
        <div className="absolute inset-0 bg-slate-200 animate-pulse" />
      )}
    </div>
  );
};

export default OptimizedImage;
