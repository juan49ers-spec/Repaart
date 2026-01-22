import React, { useState } from 'react';
import { ArrowRight, Search, Activity } from 'lucide-react';
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
            <div className="workstation-card p-4 h-full flex flex-col">
                <div className="h-4 w-24 bg-slate-100 dark:bg-slate-800 rounded animate-pulse mb-6" />
                <div className="space-y-2 flex-1">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="h-8 bg-slate-50 dark:bg-slate-800/40 rounded animate-pulse" />
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
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-full overflow-hidden transition-all hover:shadow-md">
            {/* HEADER */}
            <div className="p-5 pb-3">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                            <Activity className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-800 dark:text-white leading-tight">
                                Estado de la Red
                            </h3>
                            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{data.total} unidades activas</div>
                        </div>
                    </div>

                    <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                        <button
                            onClick={(e) => { e.stopPropagation(); setViewMode('list'); }}
                            className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide transition-all ${viewMode === 'list'
                                ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-white'
                                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                                }`}
                        >
                            Lista
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); setViewMode('top3'); }}
                            className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide transition-all ${viewMode === 'top3'
                                ? 'bg-white dark:bg-slate-700 shadow-sm text-amber-500'
                                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                                }`}
                        >
                            Top 3
                        </button>
                    </div>
                </div>

                {/* Integrated Search & Filter */}
                <div className="flex gap-2">
                    <div className="relative flex-1 group/search">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within/search:text-indigo-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Filtrar unidades..."
                            value={searchTerm}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        />
                    </div>
                    <button
                        onClick={(e) => { e.stopPropagation(); setFilter(filter === 'critical' ? 'all' : 'critical'); }}
                        className={`px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wide border transition-all flex items-center gap-2 ${filter === 'critical'
                            ? 'bg-rose-50 text-rose-600 border-rose-200 shadow-sm'
                            : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                            }`}
                    >
                        <div className={`w-1.5 h-1.5 rounded-full ${filter === 'critical' ? 'bg-rose-500 animate-pulse' : 'bg-slate-300'}`} />
                        Riesgo
                    </button>
                </div>
            </div>

            {/* TABLE HEADER */}
            <div className="grid grid-cols-12 gap-2 px-5 py-2 bg-slate-50 dark:bg-slate-800/50 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-y border-slate-100 dark:border-slate-800">
                <div className="col-span-1 text-center">#</div>
                <div className="col-span-1 text-center">ID</div>
                <div className="col-span-4 pl-1">Unidad</div>
                <div className="col-span-3 text-right">Ingresos</div>
                <div className="col-span-3 text-right">Margen</div>
            </div>

            {/* LIST BODY */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-2 py-1">
                {displayList.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center py-8 text-slate-400">
                        <Activity className="w-10 h-10 mb-3 opacity-20" />
                        <p className="text-xs font-bold text-slate-500">Sin resultados</p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {displayList.map((f, index) => {
                            const margin = f.metrics?.margin || 0;
                            const revenue = f.metrics?.revenue || 0;
                            const status = margin > 20 ? 'excellent' : margin > 10 ? 'acceptable' : 'critical';

                            const colors = {
                                excellent: 'bg-emerald-500',
                                acceptable: 'bg-amber-500',
                                critical: 'bg-rose-500'
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
                                        ${isFirst ? 'bg-amber-50 border-amber-100' : 'hover:bg-slate-50 hover:border-slate-100 dark:hover:bg-slate-800'}
                                    `}
                                >
                                    <div className="col-span-1 flex justify-center">
                                        {viewMode === 'top3' ? (
                                            <span className="text-sm">{['🥇', '🥈', '🥉'][index]}</span>
                                        ) : (
                                            <div className={`w-2 h-2 rounded-full ${colors[status]} ${status === 'critical' ? 'animate-pulse' : ''}`} />
                                        )}
                                    </div>

                                    <div className="col-span-1 text-[10px] font-bold text-slate-400 text-center">
                                        {f.id.substring(0, 2)}
                                    </div>

                                    <div className="col-span-4 pl-1">
                                        <p className={`text-xs font-bold truncate ${isFirst ? 'text-amber-700' : 'text-slate-700 dark:text-slate-300'}`}>
                                            {f.name}
                                        </p>
                                    </div>

                                    <div className="col-span-3 text-right">
                                        <span className={`text-xs font-semibold tabular-nums ${isFirst ? 'text-amber-700' : 'text-slate-600 dark:text-slate-400'}`}>
                                            {formatMoney(revenue)}
                                        </span>
                                    </div>

                                    <div className="col-span-3 text-right">
                                        <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block min-w-[40px] text-center ${margin < 10 ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
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
            <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                <button
                    onClick={(e) => { e.stopPropagation(); navigate('/admin/network'); }}
                    className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 font-bold uppercase tracking-wide text-[10px] py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 group shadow-sm hover:shadow-md"
                >
                    Ver Red Global
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
