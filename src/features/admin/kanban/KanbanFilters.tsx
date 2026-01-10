import React from 'react';
import { Search, Filter, X } from 'lucide-react';

interface KanbanFiltersProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    priorityFilter: string | null;
    setPriorityFilter: (priority: string | null) => void;
}

const KanbanFilters: React.FC<KanbanFiltersProps> = ({
    searchQuery,
    setSearchQuery,
    priorityFilter,
    setPriorityFilter
}) => {
    return (
        <div className="flex flex-col md:flex-row gap-4 mb-6 pt-4 border-t border-slate-800/50">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar por título, tag..."
                    className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl py-2 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 placeholder-slate-600 transition-all"
                />
                {searchQuery && (
                    <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-2.5 text-slate-600 hover:text-slate-400"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>

            {/* Priority Filters */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                <Filter className="w-4 h-4 text-slate-600 mr-2 shrink-0" />

                {(['high', 'medium', 'low'] as const).map(p => (
                    <button
                        key={p}
                        onClick={() => setPriorityFilter(priorityFilter === p ? null : p)}
                        className={`
                            px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide border transition-all whitespace-nowrap
                            ${priorityFilter === p
                                ? p === 'high' ? 'bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/20'
                                    : p === 'medium' ? 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/20'
                                        : 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20'
                                : 'bg-slate-900 border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300'
                            }
                        `}
                    >
                        {p === 'high' ? 'Alta' : p === 'medium' ? 'Media' : 'Baja'}
                    </button>
                ))}

                {priorityFilter && (
                    <button
                        onClick={() => setPriorityFilter(null)}
                        className="text-xs text-indigo-400 hover:text-indigo-300 underline ml-2 whitespace-nowrap"
                    >
                        Limpiar
                    </button>
                )}
            </div>
        </div>
    );
};

export default KanbanFilters;
