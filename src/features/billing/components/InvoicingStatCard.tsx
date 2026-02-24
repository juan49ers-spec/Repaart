
import React from 'react';
import { LucideIcon } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters';

interface Props {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: string;
    color?: string;
}

export const InvoicingStatCard: React.FC<Props> = ({ title, value, icon: Icon, trend, color = 'blue' }) => {
    const colorClasses = {
        blue: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20',
        emerald: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/20',
        amber: 'text-amber-600 bg-amber-100 dark:bg-amber-900/20',
        rose: 'text-rose-600 bg-rose-100 dark:bg-rose-900/20',
        slate: 'text-slate-600 bg-slate-100 dark:bg-slate-800'
    }[color] || 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';

    const displayValue = typeof value === 'number' ? formatCurrency(value) : value;

    return (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
            <div className="flex justify-between items-start mb-2 gap-2">
                <div className={`p-2 rounded-xl ${colorClasses} flex-shrink-0`}>
                    <Icon className="w-5 h-5" />
                </div>
                {trend && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${trend.startsWith('+') ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'}`}>
                        {trend}
                    </span>
                )}
            </div>
            <div className="space-y-0.5 min-w-0">
                <p className="text-slate-500 dark:text-slate-400 text-[10px] font-medium uppercase tracking-wider truncate">{title}</p>
                <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">{displayValue}</h3>
            </div>
        </div>
    );
};
