import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PremiumCardProps {
    children: React.ReactNode;
    className?: string;
    hover?: boolean;
    onClick?: () => void;
    variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
    delay?: number;
}

export const PremiumCard: React.FC<PremiumCardProps> = ({
    children,
    className,
    hover = true,
    onClick,
    variant = 'default',
    delay = 0
}) => {
    const variantStyles = {
        default: 'bg-white border border-slate-200 text-slate-700 shadow-sm',
        primary: 'bg-gradient-to-br from-indigo-500 to-indigo-600 border-transparent text-white shadow-lg',
        success: 'bg-gradient-to-br from-emerald-500 to-emerald-600 border-transparent text-white shadow-lg',
        warning: 'bg-gradient-to-br from-amber-500 to-amber-600 border-transparent text-white shadow-lg',
        danger: 'bg-gradient-to-br from-rose-500 to-rose-600 border-transparent text-white shadow-lg'
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                duration: 0.5,
                delay: delay * 0.1,
                ease: [0.25, 0.1, 0.25, 1]
            }}
            className={`
                relative overflow-hidden rounded-xl
                ${variantStyles[variant]}
                ${hover ? 'cursor-pointer' : ''}
                shadow-lg hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]
                transition-all duration-300 ease-out
                ${className || ''}
            `}
            onClick={onClick}
            whileHover={hover ? { scale: 1.02, transition: { duration: 0.2 } } : undefined}
            whileTap={hover ? { scale: 0.98 } : undefined}
        >
            {children}
        </motion.div>
    );
};

interface StaggeredGridProps {
    items: React.ReactNode[];
    columns?: number;
    staggerDelay?: number;
}

export const StaggeredGrid: React.FC<StaggeredGridProps> = ({
    items,
    columns = 1,
    staggerDelay = 0.1
}) => {
    return (
        <div className={`grid gap-6 grid-cols-${columns}`}>
            <AnimatePresence>
                {items.map((item, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{
                            duration: 0.5,
                            delay: index * staggerDelay,
                            ease: [0.25, 0.1, 0.25, 1]
                        }}
                    >
                        {item}
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

interface PremiumButtonProps {
    children: React.ReactNode;
    variant?: 'default' | 'primary' | 'outline';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    icon?: React.ReactNode;
    onClick?: () => void;
    className?: string;
}

export const PremiumButton: React.FC<PremiumButtonProps> = ({
    children,
    variant = 'default',
    size = 'md',
    loading = false,
    icon,
    onClick,
    className
}) => {
    const sizeStyles = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-base',
        lg: 'px-6 py-3 text-lg'
    };

    const variantStyles = {
        default: 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900',
        primary: 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white border-transparent hover:shadow-lg hover:from-indigo-600 hover:to-indigo-700)',
        outline: 'bg-transparent border border-slate-300 text-slate-700 hover:border-slate-400 hover:text-slate-900'
    };

    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className={`
                relative inline-flex items-center gap-2
                rounded-lg font-semibold
                ${sizeStyles[size]}
                ${variantStyles[variant]}
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-300 ease-out
                ${className || ''}
            `}
            onClick={onClick}
            disabled={loading}
        >
            {loading ? (
                <motion.div
                    className="w-4 h-4 border-2 border-white/30 border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.6, repeat: Infinity, ease: "linear" }}
                />
            ) : icon}
            {children}
        </motion.button>
    );
};

interface PremiumInputProps {
    label?: string;
    placeholder?: string;
    value?: string;
    onChange?: (value: string) => void;
    type?: string;
    className?: string;
}

export const PremiumInput: React.FC<PremiumInputProps> = ({
    label,
    placeholder,
    value,
    onChange,
    type = 'text',
    className
}) => {
    return (
        <div className="space-y-1.5">
            {label && (
                <label className="block text-sm font-medium text-slate-700 mb-1">
                    {label}
                </label>
            )}
            <input
                type={type}
                value={value}
                onChange={(e) => onChange?.(e.currentTarget.value)}
                placeholder={placeholder}
                className={`
                    w-full px-4 py-2.5
                    bg-white border border-slate-200 rounded-lg
                    text-slate-900 placeholder:text-slate-400
                    focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                    transition-all duration-200
                    font-display
                    ${className || ''}
                `}
            />
        </div>
    );
};

export const Shimmer: React.FC<{ className?: string }> = ({ className }) => (
    <div className={`relative overflow-hidden ${className || ''}`}>
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200">
            <div className="absolute inset-0 bg-white opacity-0" />
        </div>
    </div>
);