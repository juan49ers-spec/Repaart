import React from 'react';

export type BadgeIntent = 'success' | 'warning' | 'danger' | 'neutral' | 'info' | 'accent';

interface BadgeProps {
    children: React.ReactNode;
    intent?: BadgeIntent;
    size?: 'sm' | 'md';
    className?: string;
    icon?: React.ReactNode;
    title?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, intent = 'neutral', size = 'md', className = '', icon, title }) => {
    const styles = {
        success: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400',
        warning: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400',
        danger: 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400',
        info: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400',
        neutral: 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400',
        accent: 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400',
    };

    const sizes = {
        sm: 'text-[10px] px-2 py-0.5',
        md: 'text-xs px-2.5 py-1'
    };

    return (
        <span className={`
            inline-flex items-center gap-1.5 
            border rounded-lg font-bold uppercase tracking-wider
            transition-colors duration-200
            ${styles[intent]}
            ${sizes[size]}
            ${className}
        `}
            title={title}
        >
            {icon && <span className="w-3 h-3">{icon}</span>}
            {children}
        </span>
    );
};
