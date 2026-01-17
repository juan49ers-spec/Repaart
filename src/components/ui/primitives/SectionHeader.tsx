import React from 'react';
import { CardTitle, Micro } from './Typography';

interface SectionHeaderProps {
    title: string;
    subtitle?: string | React.ReactNode;
    icon?: React.ReactNode;
    action?: React.ReactNode;
    color?: string; // Tailwind text color class, e.g. 'text-blue-500'
    className?: string;
    align?: 'left' | 'center';
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, subtitle, icon, action, color = 'text-slate-600', className = '', align = 'left' }) => {
    return (
        <div className={`flex items-start ${align === 'center' ? 'justify-center text-center' : 'justify-between'} w-full mb-4 ${className}`}>
            <div className={`flex items-center gap-3 ${align === 'center' ? 'flex-col gap-2' : ''}`}>
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
                    <CardTitle as="h3">
                        {title}
                    </CardTitle>
                    {subtitle && (
                        <Micro as="p" className="mt-0.5">
                            {subtitle}
                        </Micro>
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
