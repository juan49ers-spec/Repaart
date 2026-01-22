import React from 'react';
import { ArrowUpRight, Wallet } from 'lucide-react';

interface ControlEarningsWidgetProps {
    data: {
        royalties: number;
        services: number;
        totalNetworkRevenue: number;
    };
    loading?: boolean;
    onNavigate?: (tab: string) => void;
}

const ControlEarningsWidget: React.FC<ControlEarningsWidgetProps> = ({ data, loading, onNavigate }) => {
    if (loading) {
        return (
            <div className="workstation-card p-4 h-full flex flex-col items-center justify-center space-y-3">
                <div className="h-3 w-16 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                <div className="h-8 w-32 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                <div className="w-full grid grid-cols-2 gap-2 mt-2">
                    <div className="h-12 bg-slate-50 dark:bg-slate-800/40 rounded animate-pulse" />
                    <div className="h-12 bg-slate-50 dark:bg-slate-800/40 rounded animate-pulse" />
                </div>
            </div>
        );
    }

    const totalAdminCredit = data.royalties + data.services;
    const mockPrevMonth = totalAdminCredit * 1.12;
    const trend = ((totalAdminCredit - mockPrevMonth) / mockPrevMonth) * 100;
    const isNegative = trend < 0;

    return (
        <div
            onClick={onNavigate ? () => onNavigate('finance') : undefined}
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between group/card cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all h-full relative overflow-hidden"
        >
            {/* HEADER */}
            <div className="p-5 pb-0">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                            <Wallet className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-800 dark:text-white leading-tight">
                            Terminal Financiera
                        </h3>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100">
                        <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                        </span>
                        <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-wide">En vivo</span>
                    </div>
                </div>

                {/* MAIN STAT AREA */}
                <div className="flex flex-col">
                    <div className="flex items-baseline gap-1 relative">
                        <span className="text-4xl font-black tracking-tight tabular-nums text-slate-900 dark:text-white">
                            {totalAdminCredit.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </span>
                        <span className="text-xl font-bold text-slate-400">€</span>

                        <div className={`ml-auto flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold ${isNegative ? 'text-rose-600 bg-rose-50 dark:bg-rose-900/20' : 'text-emerald-600 bg-emerald-50 dark:bg-emerald-400/20'}`}>
                            {isNegative ? '↓' : '↑'}{Math.abs(trend).toFixed(1)}%
                        </div>
                    </div>

                    {/* Sparkline Histogram */}
                    <div className="mt-6 flex items-end gap-1 h-8 w-full">
                        {[65, 75, 60, 80, 70, 85, 95, 80, 100].map((h, i) => (
                            <div
                                key={i}
                                className={`flex-1 rounded-t-sm transition-all duration-700 ${i === 8
                                    ? (isNegative ? 'bg-rose-500' : 'bg-indigo-500')
                                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200'
                                    }`}
                                style={{ height: `${h}%` }}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* DATA GRID */}
            <div className="p-5 pt-0 mt-auto">
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Royalties</span>
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                            +{data.royalties.toLocaleString('es-ES')}€
                        </span>
                    </div>
                    <div className="flex flex-col gap-1 border-l border-slate-100 dark:border-slate-800 pl-4">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Servicios</span>
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                            +{data.services.toLocaleString('es-ES')}€
                        </span>
                    </div>
                </div>

                {/* MICRO KPI FOOTER */}
                <div className="mt-4 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                    <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Volumen 24h</span>
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">12.4k€</span>
                    </div>
                    <div className="flex flex-col text-right gap-0.5">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">SLA Delta</span>
                        <span className="text-[11px] font-bold text-emerald-600">+2.4%</span>
                    </div>
                </div>
            </div>
            
            <div className="absolute top-5 right-5 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0 text-slate-300 hover:text-indigo-500">
                <ArrowUpRight className="w-4 h-4" />
            </div>
        </div>
    );
};

export default ControlEarningsWidget;
