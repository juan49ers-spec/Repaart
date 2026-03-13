import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    icon,
    className = '',
    disabled,
    ...props
}) => {
    const baseStyles = "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95";

    const variants = {
        primary: "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 border border-transparent focus:ring-blue-500",
        secondary: "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm focus:ring-slate-400",
        danger: "bg-red-500 hover:bg-red-600 text-white shadow-md shadow-red-500/20 border border-transparent focus:ring-red-500",
        ghost: "bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 focus:ring-slate-400"
    };

    const sizes = {
        sm: "px-2.5 py-1 text-xs gap-1",
        md: "px-3 py-1.5 text-sm gap-1.5",
        lg: "px-4 py-2 text-sm gap-2"
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : icon ? (
                <span className="flex items-center justify-center shrink-0">{icon}</span>
            ) : null}

            {children && <span>{children}</span>}
        </button>
    );
};
