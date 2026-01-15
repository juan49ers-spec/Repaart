import React from 'react';
import { TrendingUp, Award, Briefcase, ArrowUpRight } from 'lucide-react';

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
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 h-full animate-pulse">
                <div className="h-5 w-32 bg-slate-800 rounded mb-6" />
                <div className="space-y-6">
                    <div className="h-16 bg-slate-800 rounded-xl" />
                    <div className="h-16 bg-slate-800 rounded-xl" />
                </div>
            </div>
        );
    }

    const totalAdminCredit = data.royalties + data.services;
    const mockPrevMonth = totalAdminCredit * 0.88;
    const trend = ((totalAdminCredit - mockPrevMonth) / mockPrevMonth) * 100;

    return (
        <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-800/50 p-6 flex flex-col h-full shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 relative overflow-hidden group transition-all duration-300">

            {/* Subtle Gradient Back - Refined */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />

            {/* Header */}
            <div className="flex justify-between items-center mb-8 relative z-10">
                <div>
                    <h3 className="text-base font-medium tracking-tight text-white flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-emerald-400" />
                        Control de Ingresos
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm text-slate-400 font-normal">
                            Mes en curso
                        </p>
                        <span className="text-xs font-medium tracking-tight text-emerald-400 flex items-center gap-0.5 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">
                            <ArrowUpRight className="w-3 h-3" />
                            {trend.toFixed(1)}% vs anterior
                        </span>
                    </div>
                </div>
            </div>

            {/* Main Stats */}
            <div className="flex-1 space-y-6 relative z-10">
                {/* Royalties */}
                <div className="group/royalties">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-medium tracking-tight text-slate-400 flex items-center gap-2">
                            <Award className="w-4 h-4 text-indigo-400" />
                            Royalties (5%)
                        </span>
                        <span className="text-xs text-slate-500 font-medium tracking-tight">Meta: 8.5k€</span>
                    </div>
                    <div className="relative">
                        <span className="text-3xl font-medium text-white tracking-tight tabular-nums block mb-2">
                            {data.royalties.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            <span className="text-xl text-slate-600 font-normal">.{(data.royalties % 1).toFixed(2).split('.')[1]}€</span>
                        </span>
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-indigo-500 rounded-full transition-all duration-1000 w-[70%]"
                            // style={{ width: '70%' }}
                            />
                        </div>
                    </div>
                </div>

                {/* Separator */}
                <div className="border-t border-slate-800" />

                {/* Services */}
                <div className="group/services">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-medium tracking-tight text-slate-400 flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-amber-400" />
                            Servicios & Consultoría
                        </span>
                        <span className="text-xs text-slate-500 font-medium tracking-tight">Meta: 5k€</span>
                    </div>
                    <div className="relative">
                        <span className="text-3xl font-medium text-white tracking-tight tabular-nums block mb-2">
                            {data.services.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            <span className="text-xl text-slate-600 font-normal">.{(data.services % 1).toFixed(2).split('.')[1]}€</span>
                        </span>
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-amber-500 rounded-full transition-all duration-1000 w-[45%]"
                            // style={{ width: '45%' }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Total Footer */}
            <div className="mt-8 pt-4 border-t border-slate-800 relative z-10">
                <div
                    onClick={onNavigate ? () => onNavigate('finance') : undefined}
                    className="flex justify-between items-center cursor-pointer group/link"
                >
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-widest">Total Credit</span>
                    <div className="flex items-center gap-3">
                        <span className="text-2xl font-medium text-emerald-400 tracking-tight tabular-nums">
                            {totalAdminCredit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€
                        </span>
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center group-hover/link:bg-emerald-500/20 group-hover/link:text-emerald-400 transition-colors">
                            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover/link:text-emerald-400" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ControlEarningsWidget;
