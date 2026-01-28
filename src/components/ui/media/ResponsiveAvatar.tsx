import React from 'react';
import { User } from 'lucide-react';

interface AvatarProps {
  src?: string;
  alt: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  initials?: string;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  className?: string;
  onClick?: () => void;
  status?: 'online' | 'offline' | 'busy' | 'away';
  rounded?: boolean;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
  '2xl': 'w-20 h-20 text-xl'
};

const colorClasses = {
  primary: 'bg-indigo-500 text-white',
  secondary: 'bg-slate-500 text-white',
  success: 'bg-emerald-500 text-white',
  warning: 'bg-amber-500 text-white',
  error: 'bg-rose-500 text-white'
};

const statusColors = {
  online: 'bg-emerald-500',
  offline: 'bg-slate-300',
  busy: 'bg-rose-500',
  away: 'bg-amber-500'
};

const ResponsiveAvatar: React.FC<AvatarProps> = ({
  src,
  alt,
  size = 'md',
  initials,
  color = 'primary',
  className = '',
  onClick,
  status,
  rounded = true
}) => {
  const roundedClass = rounded ? 'rounded-full' : 'rounded-xl';
  const clickableClass = onClick ? 'cursor-pointer hover:scale-105 transition-transform' : '';

  if (src) {
    return (
      <div className={`relative inline-block ${sizeClasses[size]} ${clickableClass}`}>
        <img
          src={src}
          alt={alt}
          className={`
            ${sizeClasses[size]} ${roundedClass} object-cover
            ${className}
          `}
          onClick={onClick}
          loading="lazy"
        />
        {status && (
          <span
            className={`
              absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white
              ${statusColors[status]}
              ${size === 'xs' ? 'w-1.5 h-1.5' : size === '2xl' ? 'w-3 h-3' : ''}
            `}
          />
        )}
      </div>
    );
  }

  return (
    <div
      className={`
        ${sizeClasses[size]} ${roundedClass} ${colorClasses[color]}
        flex items-center justify-center font-bold
        ${clickableClass} ${className}
      `}
      onClick={onClick}
    >
      {initials ? (
        initials.substring(0, 2).toUpperCase()
      ) : (
        <User className="w-1/2 h-1/2" />
      )}
      {status && (
        <span
          className={`
            absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white
            ${statusColors[status]}
            ${size === 'xs' ? 'w-1.5 h-1.5' : size === '2xl' ? 'w-3 h-3' : ''}
          `}
        />
      )}
    </div>
  );
};

export default ResponsiveAvatar;
