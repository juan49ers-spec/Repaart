import React, { useMemo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CheckCircle2, Clock } from 'lucide-react';
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
        const date = (task.dueDate as any)?.toDate ? (task.dueDate as any).toDate() : new Date(task.dueDate as any);
        if (isPast(date) && !isToday(date)) return 'overdue';
        if (isToday(date)) return 'today';
        if (date <= addDays(new Date(), 3)) return 'upcoming';
        return 'normal';
    }, [task.dueDate]);

    const formattedDate = useMemo(() => {
        if (!task.dueDate) return null;
        const date = (task.dueDate as any)?.toDate ? (task.dueDate as any).toDate() : new Date(task.dueDate as any);
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
                group relative bg-white dark:bg-slate-900/60 rounded-xl border border-slate-200/60 dark:border-white/5 
                transition-all duration-300 cursor-grab active:cursor-grabbing touch-none
                hover:border-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/5 hover:-translate-y-1
                ${isDragging ? 'opacity-20 scale-95' : 'opacity-100'}
            `}
        >
            {/* Priority Line (Left Edge - Thinner) */}
            <div className={`absolute top-3 bottom-3 left-0 w-1 rounded-r-md ${task.priority === 'high' ? 'bg-rose-500' :
                task.priority === 'medium' ? 'bg-amber-400' : 'bg-emerald-400'
                }`} />

            <div className="pl-3 pr-2 py-2 space-y-1">
                {/* Header: Title & Tags */}
                <div className="space-y-1.5">
                    {/* Tags Row */}
                    {task.tags && task.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-1.5">
                            {task.tags.slice(0, 3).map(tag => (
                                <span key={tag} className="px-1.5 py-0.5 bg-slate-50 dark:bg-slate-800 text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight rounded border border-slate-100 dark:border-white/5">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}

                    <h4 className="text-[12px] font-semibold text-slate-700 dark:text-slate-200 leading-tight tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                        {task.title}
                    </h4>
                </div>

                {/* Footer Metadata (Compact Row) */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-50 dark:border-white/5">
                    <div className="flex items-center gap-3">
                        {/* Date */}
                        {formattedDate && (
                            <div className={`flex items-center gap-1 ${dateStatus === 'overdue' ? 'text-rose-500' :
                                dateStatus === 'today' ? 'text-amber-500' :
                                    'text-slate-400'
                                }`}>
                                <Clock size={10} strokeWidth={2.5} />
                                <span className="text-[10px] font-medium tracking-tight">
                                    {formattedDate}
                                </span>
                            </div>
                        )}

                        {/* Checklist */}
                        {task.checklist && task.checklist.length > 0 && (
                            <div className="flex items-center gap-1 text-slate-400">
                                <CheckCircle2 size={10} strokeWidth={2.5} className={progress === 100 ? 'text-emerald-500' : ''} />
                                <span className="text-[10px] font-medium tracking-tight">
                                    {task.checklist.filter(i => i.completed).length}/{task.checklist.length}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Avatar/User or Priority Indicator if needed */}
                </div>
            </div>
        </div>
    );
};

export default KanbanCard;
