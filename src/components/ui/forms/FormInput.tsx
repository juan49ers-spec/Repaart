import React from 'react';
import { cn } from '../../../lib/utils';

interface FormInputProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

/**
 * FormInput - Input de formulario accesible y responsive
 * 
 * Features:
 * - Label asociado al input (accesibilidad)
 * - Estados de error visuales
 * - Soporte para required
 * - Responsive con container queries
 * - Mensajes de error accesibles
 */
export const FormInput: React.FC<FormInputProps> = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  disabled = false,
  required = false,
  className = ''
}) => {
  const inputId = `input-${name}`;
  const errorId = `error-${name}`;

  return (
    <div className={cn('@container w-full', className)}>
      <label 
        htmlFor={inputId}
        className="block text-fluid-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
      >
        {label}
        {required && <span className="text-rose-500 ml-1">*</span>}
      </label>
      
      <input
        id={inputId}
        name={name}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          'w-full px-4 py-3 @xs:px-3 @xs:py-2 @md:px-4 @md:py-3',
          'text-fluid-base text-slate-900 dark:text-slate-100',
          'bg-white dark:bg-slate-900',
          'border-2 rounded-xl',
          'transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-indigo-500/20',
          error 
            ? 'border-rose-500 focus:border-rose-500' 
            : 'border-slate-200 dark:border-slate-700 focus:border-indigo-500',
          disabled && 'opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-800'
        )}
      />
      
      {error && (
        <p 
          id={errorId}
          className="mt-2 text-fluid-sm text-rose-600 dark:text-rose-400"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
};

export default FormInput;
