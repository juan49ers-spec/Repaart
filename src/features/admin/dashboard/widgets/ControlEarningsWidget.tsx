import React from 'react';
import { TrendingUp, Award, Zap, Briefcase, Plus, ArrowUpRight } from 'lucide-react';

interface ControlEarningsWidgetProps {
    data: {
        royalties: number;
        services: number;
        totalNetworkRevenue: number;
    };
    loading?: boolean;
}

const ControlEarningsWidget: React.FC<ControlEarningsWidgetProps> = ({ data, loading }) => {
    if (loading) {
        return (
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 h-full animate-pulse shadow-2xl">
                <div className="h-4 w-32 bg-slate-800 rounded mb-6" />
                <div className="space-y-6">
                    <div className="h-16 bg-slate-800 rounded-xl" />
                    <div className="h-16 bg-slate-800 rounded-xl" />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-900 rounded-2xl border border-indigo-500/20 p-6 flex flex-col h-full shadow-2xl relative overflow-hidden group">

            {/* Background Aesthetic */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 blur-[80px] rounded-full pointer-events-none group-hover:bg-indigo-600/20 transition-colors duration-700" />
            <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-emerald-600/5 blur-[60px] rounded-full pointer-events-none" />

            {/* Header */}
            <div className="flex justify-between items-start mb-6 relative z-10">
                <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                        Control de Ingresos
                    </h3>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-tight mt-1 opacity-70">
                        Mes en curso (Admin Share)
                    </p>
                </div>
                <div className="bg-white/5 p-1.5 rounded-lg border border-white/10">
                    <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                </div>
            </div>

            {/* Main Stats */}
            <div className="flex-1 space-y-5 relative z-10">

                {/* Royalties */}
                <div className="flex flex-col">
                    <div className="flex justify-between items-end mb-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                            <Award className="w-3 h-3 text-indigo-400" />
                            Royalties (5%)
                        </span>
                        <span className="text-[9px] font-semibold text-emerald-400/80 bg-emerald-400/10 px-1.5 py-0.5 rounded uppercase tracking-tighter shadow-sm">
                            + {data.totalNetworkRevenue.toLocaleString()}€ Red
                        </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-white tracking-tighter drop-shadow-md">
                            {data.royalties.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€
                        </span>
                        <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.6)]" />
                    </div>
                </div>

                {/* Separator Decor */}
                <div className="h-px bg-gradient-to-r from-white/10 via-white/5 to-transparent flex items-center">
                    <Plus className="w-2.5 h-2.5 text-white/10 -ml-1.5" />
                </div>

                {/* Consulting/Services */}
                <div className="flex flex-col">
                    <div className="flex justify-between items-end mb-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                            <Briefcase className="w-3 h-3 text-amber-400" />
                            Servicios & Consultoría
                        </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-white tracking-tighter drop-shadow-md">
                            {data.services.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€
                        </span>
                        <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.6)]" />
                    </div>
                </div>
            </div>

            {/* Footer Action */}
            <div className="mt-8 relative z-10">
                <div className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-4 transition-all group/footer cursor-pointer">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Total Admin Credit</span>
                        <ArrowUpRight className="w-4 h-4 text-emerald-400 group-hover/footer:translate-x-1 group-hover/footer:-translate-y-1 transition-transform" />
                    </div>
                    <div className="text-2xl font-bold text-emerald-400 tracking-tighter">
                        {(data.royalties + data.services).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ControlEarningsWidget;
