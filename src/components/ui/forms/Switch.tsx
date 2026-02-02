import React from 'react';
import { cn } from '../../../lib/utils';

interface SwitchProps {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Switch - Toggle switch component
 * 
 * Usage:
 * ```tsx
 * <Switch
 *   checked={isEnabled}
 *   onChange={() => setIsEnabled(!isEnabled)}
 * />
 * ```
 */
export const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  disabled = false,
  className = ''
}) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onChange}
      className={cn(
        'relative inline-flex h-6 w-11 items-center rounded-full',
        'transition-colors duration-200 ease-in-out',
        'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
        checked 
          ? 'bg-indigo-600 dark:bg-indigo-500' 
          : 'bg-slate-200 dark:bg-slate-700',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 transform rounded-full bg-white',
          'transition duration-200 ease-in-out',
          checked ? 'translate-x-6' : 'translate-x-1'
        )}
      />
    </button>
  );
};

export default Switch;
