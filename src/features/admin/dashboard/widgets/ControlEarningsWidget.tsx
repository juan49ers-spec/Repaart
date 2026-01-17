import React from 'react';
import { TrendingUp, Award, Briefcase, ArrowUpRight, Wallet } from 'lucide-react';

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
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 h-full animate-pulse flex flex-col items-center justify-center">
                <div className="h-4 w-32 bg-slate-800 rounded mb-8" />
                <div className="h-12 w-48 bg-slate-800 rounded-xl mb-8" />
                <div className="w-full grid grid-cols-2 gap-4">
                    <div className="h-16 bg-slate-800 rounded-lg" />
                    <div className="h-16 bg-slate-800 rounded-lg" />
                </div>
            </div>
        );
    }

    const totalAdminCredit = data.royalties + data.services;
    const mockPrevMonth = totalAdminCredit * 0.88; // Simulado para demo
    const trend = ((totalAdminCredit - mockPrevMonth) / mockPrevMonth) * 100;

    return (
        <div
            onClick={onNavigate ? () => onNavigate('finance') : undefined}
            className="group relative h-full bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] rounded-3xl border border-slate-800/60 p-6 flex flex-col justify-between overflow-hidden cursor-pointer transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-indigo-500/30"
        >
            {/* Background Effects (Centralized & Systematic) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none group-hover:bg-indigo-500/10 transition-colors duration-700" />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 pointer-events-none mix-blend-soft-light" />

            {/* HEADER - Centered & Clean */}
            <div className="relative z-10 flex flex-col items-center text-center space-y-1">
                <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20 group-hover:scale-110 transition-transform duration-300">
                        <Wallet className="w-4 h-4 text-indigo-400" />
                    </div>
                </div>
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">
                    Control de Ingresos
                </h3>
            </div>


            {/* MAIN STAT - HERO CENTER */}
            <div className="relative z-10 flex flex-col items-center justify-center py-4">
                <div className="flex items-baseline gap-1">
                    <span className="text-5xl lg:text-6xl font-black text-white tracking-tighter tabular-nums drop-shadow-2xl bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400">
                        {totalAdminCredit.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </span>
                    <span className="text-2xl font-light text-slate-500">.{(data.royalties % 1).toFixed(2).split('.')[1]}€</span>
                </div>

                {/* Trend Visual & Badge */}
                <div className="mt-4 flex flex-col items-center gap-2 w-full px-8">
                    {/* Mini SVG Trend Line */}
                    <div className="w-full h-8 opacity-50 relative">
                        <svg className="w-full h-full overflow-visible" preserveAspectRatio="none">
                            <path d="M0,32 C20,30 40,10 60,15 S 100,0 120,5 S 140,25 160,10 S 200,5 240,2" fill="none" stroke="url(#gradient)" strokeWidth="2" />
                            <defs>
                                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2" />
                                    <stop offset="100%" stopColor="#10b981" stopOpacity="1" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>

                    <div className="flex items-center justify-between w-full text-[10px] font-medium text-slate-500 uppercase tracking-widest mt-1">
                        <span>Previsto: {(totalAdminCredit * 1.05).toLocaleString(undefined, { maximumFractionDigits: 0 })}€</span>
                        <span className="text-emerald-400 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" /> +{trend.toFixed(1)}%
                        </span>
                    </div>
                </div>
            </div>


            {/* FOOTER - SYMMETRICAL GRID */}
            <div className="relative z-10 grid grid-cols-2 gap-4 border-t border-slate-800/50 pt-6">
                {/* Royalties */}
                <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-900/30 border border-slate-800/50 group-hover:bg-indigo-900/10 transition-colors">
                    <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-indigo-400 mb-1">
                        <Award className="w-3 h-3" />
                        Royalties
                    </span>
                    <span className="text-lg font-bold text-slate-200 tabular-nums">
                        {data.royalties.toLocaleString(undefined, { maximumFractionDigits: 0 })}€
                    </span>
                </div>

                {/* Services */}
                <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-900/30 border border-slate-800/50 group-hover:bg-amber-900/10 transition-colors">
                    <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-400 mb-1">
                        <Briefcase className="w-3 h-3" />
                        Servicios
                    </span>
                    <span className="text-lg font-bold text-slate-200 tabular-nums">
                        {data.services.toLocaleString(undefined, { maximumFractionDigits: 0 })}€
                    </span>
                </div>
            </div>

            {/* Hover Action Hint */}
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-x-2 group-hover:translate-x-0">
                <ArrowUpRight className="w-5 h-5 text-slate-500" />
            </div>
        </div>
    );
};

export default ControlEarningsWidget;
