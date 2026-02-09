import React from 'react';

export const ProfessionalCard = ({
    title,
    children,
    className,
    icon: Icon,
    action
}: {
    title?: string,
    children: React.ReactNode,
    className?: string,
    icon?: any,
    action?: React.ReactNode
}) => (
    <div className={`
        bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-xl
        shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] transition-all duration-300 backdrop-blur-sm h-full flex flex-col overflow-hidden group/card
        ${className}
    `}>
        {title && (
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700/30 bg-gradient-to-b from-white to-slate-50/50 dark:from-slate-800 dark:to-slate-800/50 shrink-0">
                <div className="flex items-center gap-3">
                    {Icon && (
                        <div className="p-1.5 rounded-lg bg-indigo-50/50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-100 dark:ring-indigo-500/20 shadow-sm group-hover/card:scale-110 transition-transform duration-300">
                            <Icon className="w-4 h-4" strokeWidth={2} />
                        </div>
                    )}
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 tracking-tight">{title}</h3>
                </div>
                {action && <div>{action}</div>}
            </div>
        )}
        <div className="flex-1 min-h-0 overflow-y-auto p-6">{children}</div>
    </div>
);
