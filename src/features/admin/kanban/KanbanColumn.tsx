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
        <div className={`flex flex-col bg-slate-100/30 dark:bg-slate-900/40 rounded-[2.5rem] border border-slate-200/50 dark:border-white/5 backdrop-blur-xl shadow-2xl shadow-slate-200/20 dark:shadow-none transition-all duration-500`}>
            {/* Column Header */}
            <div className={`p-6 flex items-center justify-between border-b border-slate-200/50 dark:border-white/5 bg-white/60 dark:bg-slate-800/20`}>
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${colorConfig.tint} border ${colorConfig.border}`}>
                        {getIcon()}
                    </div>
                    <div className="flex flex-col">
                        <h3 className={`text-[11px] font-black text-slate-800 dark:text-white uppercase tracking-[0.2em]`}>
                            {title}
                        </h3>
                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{tasks.length} {tasks.length === 1 ? 'Tarea' : 'Tareas'}</span>
                    </div>
                </div>
            </div>

            {/* Tasks Area */}
            <div
                ref={setNodeRef}
                className={`p-4 space-y-3 transition-all duration-300 ${isOver ? 'bg-indigo-500/5' : ''}`}
            >
                <div className="flex flex-col gap-4">
                    <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                        {tasks.map((task) => (
                            <KanbanCard key={task.id} task={task} onCardClick={onCardClick} />
                        ))}
                    </SortableContext>
                </div>

                {tasks.length === 0 && !isOver && (
                    <div className="h-48 flex flex-col items-center justify-center text-slate-400 dark:text-slate-700 space-y-4 opacity-40">
                        <div className="p-4 rounded-3xl bg-slate-200/50 dark:bg-slate-800/50">
                            <Layers size={32} strokeWidth={1.5} />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-center">Buzón Vacío</p>
                    </div>
                )}
            </div>

            {/* Bottom Section */}
            <div className="p-4 bg-white/20 dark:bg-slate-800/10 border-t border-slate-200/50 dark:border-white/5">
                {isAdding ? (
                    <form onSubmit={handleSubmit} className="animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex flex-col gap-2 p-3 bg-white dark:bg-slate-800 rounded-2xl border-2 border-indigo-500/30 shadow-xl">
                            <input
                                autoFocus
                                type="text"
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                placeholder="¿Qué hay que hacer?"
                                className="w-full bg-transparent border-none text-sm font-medium text-slate-700 dark:text-white placeholder:text-slate-400 focus:ring-0 p-1"
                            />
                            <div className="flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsAdding(false)}
                                    className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                                    title="Cancelar"
                                >
                                    <X size={16} />
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-1.5 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20"
                                    title="Añadir tarea"
                                >
                                    Añadir
                                </button>
                            </div>
                        </div>
                    </form>
                ) : (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="w-full py-3 flex items-center justify-center gap-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white/80 dark:hover:bg-indigo-500/10 rounded-2xl transition-all border-2 border-dashed border-slate-200/50 dark:border-white/5 mb-2"
                    >
                        <Plus size={16} />
                        Crear Tarea
                    </button>
                )}
            </div>
        </div>
    );
};

export default KanbanColumn;
