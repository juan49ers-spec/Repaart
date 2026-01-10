import React from 'react';
import { Search } from 'lucide-react';

interface KanbanFiltersProps {
    searchQuery: string;
    onSearchChange: (value: string) => void;
    priorityFilter: string | null;
    onPriorityChange: (priority: 'all' | 'high' | 'medium' | 'low') => void;
}

const KanbanFilters: React.FC<KanbanFiltersProps> = ({
    searchQuery,
    onSearchChange,
    priorityFilter,
    onPriorityChange,
}) => {
    return (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8 animate-in fade-in slide-in-from-top-4 duration-700 delay-150">
            {/* Search Glass Container */}
            <div className="relative w-full md:w-[400px] group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-500 transition-colors" />
                <input
                    type="text"
                    placeholder="Filtrar por título, ticket o tag..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/40 dark:border-slate-800/40 text-[13px] font-medium text-slate-700 dark:text-slate-200 pl-10 pr-4 py-2.5 rounded-[1.2rem] focus:ring-[10px] focus:ring-indigo-500/[0.03] focus:border-indigo-500/30 dark:focus:border-indigo-500/30 transition-all placeholder:text-slate-400/60 shadow-sm"
                />
            </div>

            {/* Priority Filters */}
            <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto no-scrollbar pb-1 md:pb-0">
                <div className="flex items-center gap-2 p-1.5 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md rounded-[1.5rem] border border-slate-200/40 dark:border-slate-800/40 shadow-sm">
                    {(['all', 'high', 'medium', 'low'] as const).map((priority) => (
                        <button
                            key={priority}
                            onClick={() => onPriorityChange(priority)}
                            className={`px-4 py-1.5 rounded-[1rem] text-[9px] uppercase tracking-[0.1em] font-medium transition-all duration-300 ${priorityFilter === priority
                                ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 shadow-lg shadow-indigo-500/[0.05]'
                                : 'text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-800 border-transparent'
                                } border`}
                        >
                            {priority === 'all' ? 'Ver Todo' :
                                priority === 'high' ? 'Alta' :
                                    priority === 'medium' ? 'Media' : 'Baja'}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default KanbanFilters;
