import React from 'react';
import { Search, SortAsc, Filter } from 'lucide-react';

export type SortOption = 'newest' | 'priority' | 'due_date';

interface KanbanFiltersProps {
    searchQuery: string;
    onSearchChange: (value: string) => void;
    priorityFilter: string | null;
    onPriorityChange: (priority: 'all' | 'high' | 'medium' | 'low') => void;
    sortBy: SortOption;
    onSortChange: (sort: SortOption) => void;
}

const KanbanFilters: React.FC<KanbanFiltersProps> = ({
    searchQuery,
    onSearchChange,
    priorityFilter,
    onPriorityChange,
    sortBy,
    onSortChange
}) => {
    return (
        <div className="flex flex-col space-y-2 mb-3 shrink-0 animate-in fade-in slide-in-from-top-4 duration-700 delay-150">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                {/* 1. Search Glass Container */}
                <div className="relative w-full md:flex-1 md:max-w-[400px] group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Busca por título, responsable o etiquetas..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/50 dark:border-white/5 text-sm font-medium text-slate-700 dark:text-slate-200 pl-11 pr-4 py-3 rounded-2xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/30 transition-all placeholder:text-slate-400 shadow-sm"
                    />
                </div>

                {/* 2. Controls Group - Allow wrap on smaller screens */}
                <div className="flex flex-wrap items-center gap-2 lg:gap-4 w-full lg:w-auto">
                    {/* Sort Selector */}
                    <div className="flex items-center gap-1.5 p-1 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md rounded-xl border border-slate-200/50 dark:border-white/5 shadow-sm">
                        <div className="flex items-center gap-1 px-2 py-1 text-[9px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-200/50 dark:border-white/10 mr-0.5">
                            <SortAsc size={12} />
                            <span className="hidden sm:inline">Orden</span>
                        </div>
                        {(['newest', 'priority', 'due_date'] as const).map((option) => (
                            <button
                                key={option}
                                onClick={() => onSortChange(option)}
                                className={`px-2 lg:px-3 py-1 rounded-lg text-[9px] uppercase tracking-wider font-bold transition-all ${sortBy === option
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                                    : 'text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400'
                                    }`}
                            >
                                {option === 'newest' ? 'Recientes' :
                                    option === 'priority' ? 'Prioridad' : 'Entrega'}
                            </button>
                        ))}
                    </div>

                    {/* Priority Filters */}
                    <div className="flex items-center gap-1.5 p-1 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md rounded-xl border border-slate-200/50 dark:border-white/5 shadow-sm">
                        <div className="flex items-center gap-1 px-2 py-1 text-[9px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-200/50 dark:border-white/10 mr-0.5">
                            <Filter size={12} />
                            <span className="hidden sm:inline">Filtro</span>
                        </div>
                        {(['all', 'high', 'medium', 'low'] as const).map((priority) => (
                            <button
                                key={priority}
                                onClick={() => onPriorityChange(priority)}
                                className={`px-2 lg:px-3 py-1 rounded-lg text-[9px] uppercase tracking-wider font-bold transition-all ${priorityFilter === (priority === 'all' ? null : priority)
                                    ? 'bg-slate-800 dark:bg-white text-white dark:text-slate-900 shadow-lg'
                                    : 'text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400'
                                    }`}
                            >
                                {priority === 'all' ? 'Todos' :
                                    priority === 'high' ? 'Alta' :
                                        priority === 'medium' ? 'Media' : 'Baja'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default KanbanFilters;
