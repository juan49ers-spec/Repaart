import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { KanbanTask } from '../../../hooks/useKanban';
import KanbanCard from './KanbanCard';
import { Circle, Activity, CheckCircle2, Plus, X, Layers } from 'lucide-react';

interface KanbanColumnProps {
    title: string;
    tasks: KanbanTask[];
    onCardClick: (task: KanbanTask) => void;
    onQuickAdd: (title: string) => void;
    colorConfig: {
        id: string;
        title: string;
        color: string;
        accent: string;
        tint: string;
        border: string;
    };
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ title, tasks, onCardClick, onQuickAdd, colorConfig }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [newTitle, setNewTitle] = useState('');

    const { setNodeRef, isOver } = useDroppable({
        id: colorConfig.id,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newTitle.trim()) {
            onQuickAdd(newTitle.trim());
            setNewTitle('');
            setIsAdding(false);
        }
    };

    const getIcon = () => {
        const iconProps = { size: 16, className: colorConfig.accent };
        switch (colorConfig.id) {
            case 'todo': return <Circle {...iconProps} />;
            case 'in_progress': return <Activity {...iconProps} />;
            case 'done': return <CheckCircle2 {...iconProps} />;
            default: return <Circle {...iconProps} />;
        }
    };

    return (
        <div className={`flex flex-col bg-slate-100/30 dark:bg-slate-900/40 rounded-2xl border border-slate-200/50 dark:border-white/5 backdrop-blur-xl shadow-lg shadow-slate-200/20 dark:shadow-none transition-all duration-500 h-full overflow-hidden`}>
            {/* Column Header - Compact */}
            <div className={`shrink-0 px-3 py-2 flex items-center justify-between border-b border-slate-200/50 dark:border-white/5 bg-white/60 dark:bg-slate-800/20`}>
                <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${colorConfig.tint} border ${colorConfig.border}`}>
                        {getIcon()}
                    </div>
                    <div className="flex items-center gap-2">
                        <h3 className={`text-[10px] font-black text-slate-800 dark:text-white uppercase tracking-widest truncate max-w-[120px]`}>
                            {title}
                        </h3>
                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500">{tasks.length}</span>
                    </div>
                </div>
            </div>

            {/* Tasks Area - No Scroll */}
            <div
                ref={setNodeRef}
                className={`flex-1 overflow-hidden p-2 transition-all duration-300 ${isOver ? 'bg-indigo-500/5' : ''}`}
            >
                <div className="flex flex-col gap-2">
                    <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                        {tasks.map((task) => (
                            <KanbanCard key={task.id} task={task} onCardClick={onCardClick} />
                        ))}
                    </SortableContext>
                </div>

                {tasks.length === 0 && !isOver && (
                    <div className="h-20 flex flex-col items-center justify-center text-slate-400 dark:text-slate-700 space-y-2 opacity-40">
                        <Layers size={20} strokeWidth={1.5} />
                        <p className="text-[8px] font-black uppercase tracking-widest">Vacío</p>
                    </div>
                )}
            </div>

            {/* Bottom Section - Compact */}
            <div className="shrink-0 px-2 py-1.5 bg-white/20 dark:bg-slate-800/10 border-t border-slate-200/50 dark:border-white/5">
                {isAdding ? (
                    <form onSubmit={handleSubmit} className="animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex gap-2 p-2 bg-white dark:bg-slate-800 rounded-xl border border-indigo-500/30 shadow-lg">
                            <input
                                autoFocus
                                type="text"
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                placeholder="Nueva tarea..."
                                className="flex-1 bg-transparent border-none text-xs font-medium text-slate-700 dark:text-white placeholder:text-slate-400 focus:ring-0 p-1"
                            />
                            <button
                                type="button"
                                onClick={() => setIsAdding(false)}
                                className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                                title="Cancelar"
                            >
                                <X size={14} />
                            </button>
                            <button
                                type="submit"
                                className="px-2 py-1 bg-indigo-600 text-white text-[9px] font-bold rounded-lg hover:bg-indigo-700 transition-all"
                                title="Añadir tarea"
                            >
                                +
                            </button>
                        </div>
                    </form>
                ) : (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="w-full py-1.5 flex items-center justify-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white/80 dark:hover:bg-indigo-500/10 rounded-lg transition-all border border-dashed border-slate-200/50 dark:border-white/10"
                    >
                        <Plus size={12} />
                        Nueva
                    </button>
                )}
            </div>
        </div>
    );
};

export default KanbanColumn;
