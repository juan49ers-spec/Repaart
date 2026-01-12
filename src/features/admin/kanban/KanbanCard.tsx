import React, { useMemo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { KanbanTask } from '../../../hooks/useKanban';
import { format, isPast, isToday, addDays } from 'date-fns';
import { es } from 'date-fns/locale';

interface KanbanCardProps {
    task: KanbanTask;
    onCardClick?: (task: KanbanTask) => void;
}

const KanbanCard: React.FC<KanbanCardProps> = ({ task, onCardClick }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: task.id });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
    };

    const dateStatus = useMemo(() => {
        if (!task.dueDate) return null;
        const date = task.dueDate.toDate ? task.dueDate.toDate() : new Date(task.dueDate);
        if (isPast(date) && !isToday(date)) return 'overdue';
        if (isToday(date)) return 'today';
        if (date <= addDays(new Date(), 3)) return 'upcoming';
        return 'normal';
    }, [task.dueDate]);

    const formattedDate = useMemo(() => {
        if (!task.dueDate) return null;
        const date = task.dueDate.toDate ? task.dueDate.toDate() : new Date(task.dueDate);
        return format(date, 'd MMM', { locale: es });
    }, [task.dueDate]);

    const progress = useMemo(() => {
        if (!task.checklist || task.checklist.length === 0) return 0;
        const completed = task.checklist.filter(i => i.completed).length;
        return Math.round((completed / task.checklist.length) * 100);
    }, [task.checklist]);

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={() => onCardClick?.(task)}
            className={`
                group relative bg-white/80 dark:bg-slate-900/40 rounded-[1.5rem] border border-slate-200/50 dark:border-white/5 backdrop-blur-md transition-all duration-300 cursor-grab active:cursor-grabbing touch-none
                ${task.priority === 'high' ? 'hover:border-rose-500/20' :
                    task.priority === 'medium' ? 'hover:border-amber-500/20' :
                        'hover:border-emerald-500/20'}
                shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_15px_45px_rgba(99,102,241,0.07)] hover:-translate-y-1.5 
                ${isDragging ? 'opacity-20 scale-95' : 'opacity-100'}
            `}
        >
            {/* Priority Side Bar (Clean Edge) */}
            <div className={`absolute top-4 left-0 bottom-4 w-1 rounded-r-full ${task.priority === 'high' ? 'bg-rose-500' :
                task.priority === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                }`} />

            <div className="p-5 space-y-4">
                {/* Header: Tags & Date Status */}
                <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-1.5 flex-wrap">
                        {task.tags?.slice(0, 2).map(tag => (
                            <span key={tag} className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 text-[8px] font-black uppercase tracking-widest rounded-lg border border-slate-100 dark:border-white/5">
                                {tag}
                            </span>
                        ))}
                    </div>
                    {dateStatus === 'overdue' && (
                        <div className="flex items-center gap-1 text-rose-500 animate-pulse">
                            <AlertCircle size={10} />
                            <span className="text-[8px] font-black uppercase tracking-widest">Fuera plazo</span>
                        </div>
                    )}
                </div>

                {/* Title */}
                <div className="space-y-1.5">
                    <h4 className="text-[14px] font-bold text-slate-800 dark:text-slate-100 leading-tight tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {task.title}
                    </h4>
                    {task.description && (
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-snug line-clamp-2 overflow-hidden">
                            {task.description}
                        </p>
                    )}
                </div>

                {/* Footer Metadata */}
                <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-3">
                        {formattedDate && (
                            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border ${dateStatus === 'overdue' ? 'text-rose-600 bg-rose-500/5 border-rose-500/10' :
                                dateStatus === 'today' ? 'text-amber-600 bg-amber-500/5 border-amber-500/10' :
                                    'text-slate-400 bg-slate-50 dark:bg-slate-800/20 border-slate-100 dark:border-white/5'
                                }`}>
                                <Clock size={10} strokeWidth={2.5} />
                                <span className="text-[9px] font-black uppercase tracking-widest leading-none">
                                    {formattedDate}
                                </span>
                            </div>
                        )}

                        {task.checklist && task.checklist.length > 0 && (
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-50/50 dark:bg-slate-800/20 text-slate-400 dark:text-slate-500 border border-slate-100 dark:border-white/5">
                                <CheckCircle2 size={10} strokeWidth={2.5} className={progress === 100 ? 'text-emerald-500' : ''} />
                                <span className="text-[9px] font-black tracking-widest">
                                    {task.checklist.filter(i => i.completed).length}/{task.checklist.length}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sub-item Progress Bar */}
                {task.checklist && task.checklist.length > 0 && progress < 100 && (
                    <div className="h-1 w-full bg-slate-100 dark:bg-slate-800/40 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(99,102,241,0.2)] ${task.priority === 'high' ? 'bg-rose-500' :
                                task.priority === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                                }`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default KanbanCard;
