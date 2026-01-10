import React from 'react';

interface SectionHeaderProps {
    title: string;
    subtitle?: string;
    icon?: React.ReactNode;
    action?: React.ReactNode;
    color?: string; // Tailwind text color class, e.g. 'text-blue-500'
    className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, subtitle, icon, action, color = 'text-slate-600', className = '' }) => {
    return (
        <div className={`flex items-start justify-between w-full mb-4 ${className}`}>
            <div className="flex items-center gap-3">
                {icon && (
                    <div className={`
                        w-10 h-10 rounded-xl flex items-center justify-center 
                        bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 
                        shadow-sm text-slate-500
                    `}>
                        <div className={color}>{icon}</div>
                    </div>
                )}
                <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white tracking-tight leading-tight">
                        {title}
                    </h3>
                    {subtitle && (
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                            {subtitle}
                        </p>
                    )}
                </div>
            </div>
            {action && (
                <div className="ml-auto">
                    {action}
                </div>
            )}
        </div>
    );
};
