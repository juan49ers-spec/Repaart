import { type FC, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { type LucideIcon } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

const variants: Record<ButtonVariant, string> = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500",
    secondary: "bg-white text-slate-700 border-slate-300 hover:bg-slate-50 focus:ring-indigo-500",
    danger: "bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:ring-indigo-500",
    outline: "bg-transparent border border-slate-300 text-slate-700 hover:bg-slate-50"
};

const sizes: Record<ButtonSize, string> = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-3 text-base"
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children?: ReactNode;
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
    icon?: LucideIcon;
}

const Button: FC<ButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    className = '',
    loading = false,
    icon: Icon,
    disabled,
    type = 'button',
    ...props
}) => {
    return (
        <button
            type={type}
            disabled={disabled || loading}
            className={`
        inline-flex items-center justify-center font-medium rounded-lg 
        transition-colors duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 
        ${variants[variant] || variants.primary} 
        ${sizes[size] || sizes.md} 
        ${(disabled || loading) ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
            {...props}
        >
            {loading && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
            )}
            {!loading && Icon && <Icon className={`w-4 h-4 ${children ? 'mr-2' : ''}`} />}
            {children}
        </button>
    );
};

export default Button;
