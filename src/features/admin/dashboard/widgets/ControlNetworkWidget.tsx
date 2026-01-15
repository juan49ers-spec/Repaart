import React, { useState } from 'react';
import { ArrowRight, Search, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
    const [viewMode, setViewMode] = useState<'list' | 'top3'>('list');
    const [filter, setFilter] = useState<'all' | 'critical' | 'acceptable' | 'excellent'>('all');
    const [searchTerm, setSearchTerm] = useState('');

    if (loading) {
        return (
            <div className="bg-white/50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 h-full">
                <div className="h-5 w-32 bg-slate-200 dark:bg-slate-800 rounded mb-6" />
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-14 bg-slate-100 dark:bg-slate-800/50 rounded-xl" />
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

    const displayList = viewMode === 'top3' ? topPerformers : filteredFranchises.slice(0, 6);

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col h-full shadow-sm overflow-hidden transition-all duration-300">

            {/* Header */}
            <div className="p-6 pb-2">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h3 className="text-base font-semibold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                            <Activity className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            Monitoreo de Red
                        </h3>
                        <p className="text-sm text-slate-500 mt-1 font-medium">
                            {data.total} centros activos &bull; <span className="text-slate-600 dark:text-slate-400">
                                {viewMode === 'top3' ? 'Top Performers' : 'Análisis de Riesgo'}
                            </span>
                        </p>
                    </div>

                    {/* View Switcher */}
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`px-3 py-1 rounded-md text-xs font-semibold tracking-tight transition-all ${viewMode === 'list'
                                ? 'bg-white dark:bg-slate-700 data-[state=active]:shadow-sm text-slate-900 dark:text-white'
                                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                        >
                            Lista
                        </button>
                        <button
                            onClick={() => setViewMode('top3')}
                            className={`px-3 py-1 rounded-md text-xs font-semibold tracking-tight transition-all flex items-center gap-1 ${viewMode === 'top3'
                                ? 'bg-white dark:bg-slate-700 shadow-sm text-amber-600 dark:text-amber-400'
                                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                        >
                            <span className="text-[10px]">🏆</span> Top 3
                        </button>
                    </div>
                </div>

                {/* Controls (Only for List Mode) */}
                {viewMode === 'list' && (
                    <div className="flex gap-2 mb-3 animate-in fade-in slide-in-from-top-1 duration-200">
                        <div className="relative flex-1">
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                            <input
                                type="text"
                                placeholder="Buscar..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium tracking-tight focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
                            />
                        </div>
                        <button
                            onClick={() => setFilter(filter === 'critical' ? 'all' : 'critical')}
                            title="Filtrar Críticos"
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold tracking-tight border transition-all flex items-center gap-1.5 ${filter === 'critical'
                                ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-400'
                                : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400'
                                }`}
                        >
                            <div className={`w-1.5 h-1.5 rounded-full ${filter === 'critical' ? 'bg-rose-600' : 'bg-rose-400/50'}`} />
                            {data.critical > 0 ? `${data.critical} Críticos` : 'Filtros'}
                        </button>
                    </div>
                )}
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">
                <div className="col-span-1 flex items-center justify-center">#</div>
                <div className="col-span-5 text-left pl-2">Franquicia</div>
                <div className="col-span-3 text-right">Revenue</div>
                <div className="col-span-3 text-right">Margen</div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                {displayList.length === 0 ? (
                    <div className="h-32 flex flex-col items-center justify-center text-slate-400">
                        <p className="text-xs font-medium tracking-tight">No hay datos disponibles</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {displayList.map((f, index) => {
                            const margin = f.metrics?.margin || 0;
                            const revenue = f.metrics?.revenue || 0;
                            const status = margin > 20 ? 'excellent' : margin > 10 ? 'acceptable' : 'critical';

                            // Colors map
                            const colors = {
                                excellent: 'text-emerald-500 bg-emerald-500',
                                acceptable: 'text-amber-500 bg-amber-500',
                                critical: 'text-rose-500 bg-rose-500'
                            };

                            // Rank Indicators
                            const isTop3 = viewMode === 'top3';
                            const rankIcons = ['👑', '🥈', '🥉'];


                            return (
                                <div
                                    key={f.id}
                                    onClick={() => navigate(`/admin/franchise/${f.id}`)}
                                    className={`grid grid-cols-12 gap-4 px-6 py-3 items-center cursor-pointer group transition-all ${isTop3 && index === 0
                                        ? 'bg-gradient-to-r from-amber-50/50 to-transparent dark:from-amber-900/10'
                                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                        }`}
                                >
                                    {/* Rank / Status */}
                                    <div className="col-span-1 flex justify-center items-center h-full">
                                        {isTop3 ? (
                                            <span className="text-sm scale-110 drop-shadow-sm filter">{rankIcons[index]}</span>
                                        ) : (
                                            <div className={`w-2 h-2 rounded-full ${colors[status].split(' ')[1]} ${status === 'critical' ? 'animate-pulse' : ''}`} />
                                        )}
                                    </div>

                                    {/* Name & ID */}
                                    <div className="col-span-5 pl-2">
                                        <p className={`text-sm font-bold tracking-tight truncate ${isTop3 && index === 0 ? 'text-amber-900 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
                                            {f.name}
                                        </p>
                                        <p className="text-[10px] text-slate-400 font-mono hidden group-hover:block transition-all pt-0.5">
                                            {f.id.substring(0, 8)}...
                                        </p>
                                    </div>

                                    {/* Revenue */}
                                    <div className="col-span-3 text-right">
                                        <span className={`text-xs font-mono font-bold tracking-tight ${isTop3 ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                                            {revenue.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                                        </span>
                                        {isTop3 && (
                                            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full mt-1 overflow-hidden">
                                                <div className="h-full bg-indigo-500" style={{ width: `${(revenue / (topPerformers[0].metrics?.revenue || 1)) * 100}%` }} />
                                            </div>
                                        )}
                                    </div>

                                    {/* Margin */}
                                    <div className="col-span-3 text-right">
                                        <span className={`text-xs font-mono font-bold tracking-tight ${colors[status].split(' ')[0]}`}>
                                            {margin.toFixed(1)}%
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Footer Action */}
            <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                <button
                    onClick={() => navigate('/admin/network')}
                    className="w-full flex items-center justify-center gap-2 py-2 text-xs font-medium tracking-tight text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors group"
                >
                    Expandir Red Completa <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
        </div>
    );
};

export default ControlNetworkWidget;
