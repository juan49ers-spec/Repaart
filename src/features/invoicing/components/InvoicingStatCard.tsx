
import React from 'react';
import { LucideIcon } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters';

interface Props {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: string;
    color?: string; // e.g., 'blue', 'emerald', 'amber'
}

export const InvoicingStatCard: React.FC<Props> = ({ title, value, icon: Icon, trend, color = 'blue' }) => {

    // Simple color mapping
    const colorClasses = {
        blue: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20',
        emerald: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/20',
        amber: 'text-amber-600 bg-amber-100 dark:bg-amber-900/20',
        rose: 'text-rose-600 bg-rose-100 dark:bg-rose-900/20',
        slate: 'text-slate-600 bg-slate-100 dark:bg-slate-800'
    }[color] || 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';

    const displayValue = typeof value === 'number' ? formatCurrency(value) : value;

    return (
        <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
            <div className="flex justify-between items-start mb-3 md:mb-4 gap-2">
                <div className={`p-2 md:p-3 rounded-xl ${colorClasses} flex-shrink-0`}>
                    <Icon className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                {trend && (
                    <span className={`text-xs font-bold px-2 py-1 rounded-full flex-shrink-0 ${trend.startsWith('+') ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'}`}>
                        {trend}
                    </span>
                )}
            </div>
            <div className="space-y-1 min-w-0">
                <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm font-medium uppercase tracking-wide truncate">{title}</p>
                <h3 className="text-lg md:text-2xl font-bold text-slate-900 dark:text-white truncate break-words">{displayValue}</h3>
            </div>
        </div>
    );
};
