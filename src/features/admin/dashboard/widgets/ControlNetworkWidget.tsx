import React, { useState } from 'react';
import { ArrowRight, Search, Activity, Cpu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../context/AuthContext';

interface Franchise {
    id: string;
    name: string;
    metrics?: {
        margin: number;
        revenue?: number;
    };
}

interface ControlNetworkWidgetProps {
    data: {
        total: number;
        excellent: number;
        acceptable: number;
        critical: number;
        franchises: Franchise[];
    };
    loading?: boolean;
}

const ControlNetworkWidget: React.FC<ControlNetworkWidgetProps> = ({ data, loading }) => {
    const navigate = useNavigate();
    const { startImpersonation } = useAuth();
    const [viewMode, setViewMode] = useState<'list' | 'top3'>('list');
    const [filter, setFilter] = useState<'all' | 'critical' | 'acceptable' | 'excellent'>('all');
    const [searchTerm, setSearchTerm] = useState('');

    if (loading) {
        return (
            <div className="bg-[#12141A] rounded-xl border border-white/5 shadow-2xl p-4 h-full flex flex-col">
                <div className="h-4 w-24 bg-white/5 rounded animate-pulse mb-6" />
                <div className="space-y-2 flex-1">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="h-8 bg-white/5 rounded animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    // Logic for Top 3 (Revenue Based)
    const topPerformers = [...data.franchises]
        .sort((a, b) => (b.metrics?.revenue || 0) - (a.metrics?.revenue || 0))
        .slice(0, 3);

    // Logic for Standard List (Risk Based)
    const riskSortedFranchises = [...data.franchises].sort((a, b) => {
        const marginA = a.metrics?.margin || 0;
        const marginB = b.metrics?.margin || 0;
        return marginA - marginB; // Lowest margin first
    });

    const filteredFranchises = riskSortedFranchises.filter(f => {
        const margin = f.metrics?.margin || 0;
        const status = margin > 20 ? 'excellent' : margin > 10 ? 'acceptable' : 'critical';

        const matchesFilter = filter === 'all' || status === filter;
        const matchesSearch = f.name.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesFilter && matchesSearch;
    });

    const displayList = viewMode === 'top3' ? topPerformers : filteredFranchises.slice(0, 8);

    return (
        <div className="bg-[#12141A] relative rounded-xl border border-white/5 shadow-2xl flex flex-col h-full overflow-hidden transition-all group/widget">
            {/* Ambient Background Glow for Dark Mode */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

            {/* HEADER */}
            <div className="p-5 pb-3 relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/5 rounded-lg border border-white/10 group-hover/widget:border-indigo-500/30 transition-colors">
                            <Cpu className="w-4 h-4 text-indigo-400" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2 uppercase">
                                Estado de la Red
                            </h3>
                            <div className="text-xs font-medium text-slate-400">{data.total} nodos activos</div>
                        </div>
                    </div>

                    <div className="flex bg-white/5 p-0.5 rounded-lg border border-white/5">
                        <button
                            onClick={(e) => { e.stopPropagation(); setViewMode('list'); }}
                            className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide transition-all ${viewMode === 'list'
                                ? 'bg-white/10 shadow-sm text-white border border-white/10'
                                : 'text-slate-400 hover:text-slate-200'
                                }`}
                        >
                            Lista
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); setViewMode('top3'); }}
                            className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide transition-all ${viewMode === 'top3'
                                ? 'bg-white/10 shadow-sm text-amber-500 border border-white/10'
                                : 'text-slate-400 hover:text-slate-200'
                                }`}
                        >
                            Top 3
                        </button>
                    </div>
                </div>

                {/* Integrated Search & Filter */}
                <div className="flex gap-2 relative z-10">
                    <div className="relative flex-1 group/search">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 group-focus-within/search:text-indigo-400 transition-colors" />
                        <input
                            type="text"
                            placeholder="Buscar nodo..."
                            value={searchTerm}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-[#1E222D] border border-white/5 rounded-lg pl-9 pr-3 py-2 text-xs font-medium text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                        />
                    </div>
                    <button
                        onClick={(e) => { e.stopPropagation(); setFilter(filter === 'critical' ? 'all' : 'critical'); }}
                        className={`px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wide border transition-all flex items-center gap-2 ${filter === 'critical'
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            : 'bg-[#1E222D] text-slate-400 border-white/5 hover:bg-white/5'
                            }`}
                    >
                        <div className={`w-1.5 h-1.5 rounded-full ${filter === 'critical' ? 'bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)]' : 'bg-slate-600'}`} />
                        Riesgo
                    </button>
                </div>
            </div>

            {/* TABLE HEADER */}
            <div className="grid grid-cols-12 gap-2 px-5 py-2 bg-white/5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-y border-white/5 relative z-10">
                <div className="col-span-1 text-center">#</div>
                <div className="col-span-1 text-center">ID</div>
                <div className="col-span-4 pl-1">Nodo</div>
                <div className="col-span-3 text-right">Volumen</div>
                <div className="col-span-3 text-right">Spread</div>
            </div>

            {/* LIST BODY */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-2 py-1 relative z-10">
                {displayList.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center py-8 text-slate-600">
                        <Activity className="w-10 h-10 mb-3 opacity-20" />
                        <p className="text-xs font-bold text-slate-500">Sin señales detectadas</p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {displayList.map((f, index) => {
                            const margin = f.metrics?.margin || 0;
                            const revenue = f.metrics?.revenue || 0;
                            const status = margin > 20 ? 'excellent' : margin > 10 ? 'acceptable' : 'critical';

                            const colors = {
                                excellent: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]',
                                acceptable: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]',
                                critical: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]'
                            };

                            const isFirst = index === 0 && viewMode === 'top3';

                            return (
                                <div
                                    key={f.id}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        startImpersonation(f.id);
                                        navigate('/dashboard');
                                    }}
                                    className={`
                                        grid grid-cols-12 gap-2 px-3 py-2.5 items-center cursor-pointer group transition-all rounded-lg border border-transparent
                                        ${isFirst ? 'bg-amber-500/10 border-amber-500/20' : 'hover:bg-white/5 hover:border-white/10'}
                                    `}
                                >
                                    <div className="col-span-1 flex justify-center">
                                        {viewMode === 'top3' ? (
                                            <span className="text-sm">{['🥇', '🥈', '🥉'][index]}</span>
                                        ) : (
                                            <div className={`w-1.5 h-1.5 rounded-full ${colors[status]} ${status === 'critical' ? 'animate-pulse' : ''}`} />
                                        )}
                                    </div>

                                    <div className="col-span-1 text-[10px] font-mono font-bold text-slate-500 text-center uppercase">
                                        {f.id.substring(0, 2)}
                                    </div>

                                    <div className="col-span-4 pl-1">
                                        <p className={`text-xs font-bold truncate ${isFirst ? 'text-amber-400' : 'text-slate-300 group-hover:text-white transition-colors'}`}>
                                            {f.name}
                                        </p>
                                    </div>

                                    <div className="col-span-3 text-right">
                                        <span className={`text-[11px] font-mono font-semibold tabular-nums tracking-tight ${isFirst ? 'text-amber-400' : 'text-slate-400'}`}>
                                            {formatMoney(revenue)}
                                        </span>
                                    </div>

                                    <div className="col-span-3 text-right">
                                        <div className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md inline-block min-w-[40px] text-center border transition-colors ${margin < 10 ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-[#1E222D] text-slate-300 border-white/5 group-hover:border-white/10'}`}>
                                            {margin.toFixed(1)}%
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* FOOTER ACTION BUTTON */}
            <div className="p-3 bg-transparent border-t border-white/5 relative z-10">
                <button
                    onClick={(e) => { e.stopPropagation(); navigate('/admin/network'); }}
                    className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold uppercase tracking-wide text-[10px] py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 group shadow-sm"
                >
                    Inspeccionar Red Global
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
        </div>
    );
};

const formatMoney = (val: number) => {
    return val.toLocaleString('es-ES', { maximumFractionDigits: 0 }) + '€';
};

export default ControlNetworkWidget;
