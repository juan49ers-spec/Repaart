import React from 'react';
import { AlertCircle } from 'lucide-react';

interface StatsCardsProps {
    totalBilled: number;
    totalPending: number;
    totalOverdue: number;
    draftCount: number;
    draftInProgress: number;
    draftEmpty: number;
}

export const AdminBillingStatsCards: React.FC<StatsCardsProps> = ({
    totalBilled, totalPending, totalOverdue, draftCount, draftInProgress, draftEmpty
}) => {
    const fmt = (v: number) => v.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });

    const cardBaseClasses = "bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800";
    const labelClasses = "text-sm font-medium text-slate-500 dark:text-slate-400 mb-3";
    const valueClasses = "text-3xl font-display font-bold text-slate-900 dark:text-white tracking-tight";

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Facturado */}
            <div className={cardBaseClasses}>
                <p className={labelClasses}>Total Facturado</p>
                <div className="flex items-baseline gap-3">
                    <p className={valueClasses}>
                        {fmt(totalBilled)}
                    </p>
                </div>
            </div>

            {/* Pendiente */}
            <div className={cardBaseClasses}>
                <p className={labelClasses}>Pendiente</p>
                <div className="flex items-baseline gap-3">
                    <p className={valueClasses}>
                        {fmt(totalPending)}
                    </p>
                </div>
            </div>

            {/* Vencido */}
            <div className={cardBaseClasses}>
                <div className="flex items-center justify-between mb-3">
                    <p className={labelClasses.replace('mb-3', '')}>Vencido</p>
                    <AlertCircle className="w-4 h-4 text-rose-500 animate-pulse" />
                </div>
                <div className="flex items-baseline gap-3">
                    <p className="text-3xl font-display font-bold text-rose-600 dark:text-rose-400 tracking-tight">
                        {fmt(totalOverdue)}
                    </p>
                </div>
            </div>

            {/* Borradores */}
            <div className={cardBaseClasses}>
                <p className={labelClasses}>Borradores</p>
                <div className="flex items-baseline gap-3 mb-1">
                    <p className={valueClasses}>
                        {draftCount}
                    </p>
                </div>
                <div className="flex gap-2 text-xs font-medium">
                    <span className="text-slate-600 dark:text-slate-400">{draftInProgress} en progreso</span>
                    <span className="text-slate-300 dark:text-slate-700">|</span>
                    <span className="text-slate-600 dark:text-slate-400">{draftEmpty} vacíos</span>
                </div>
            </div>
        </div>
    );
};
