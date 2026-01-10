import React, { useMemo } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Clock, AlignLeft, Flag } from 'lucide-react';
import { KanbanTask } from '../../../hooks/useKanban';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface KanbanCardProps {
    task: KanbanTask;
    onClick?: () => void;
}

const KanbanCard: React.FC<KanbanCardProps> = ({ task, onClick }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: task.id,
        data: { ...task }
    });

    // eslint-disable-next-line react-style-proptypes/style-prop-object
    const style = {
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.3 : 1,
        cursor: isDragging ? 'grabbing' : 'grab',
    };

    // Priority Styling (Left Border Strip)
    const priorityConfig = useMemo(() => {
        switch (task.priority) {
            case 'high': return { color: 'bg-rose-500', border: 'border-l-rose-500', text: 'text-rose-400', bg: 'bg-rose-500/10' };
            case 'medium': return { color: 'bg-amber-500', border: 'border-l-amber-500', text: 'text-amber-400', bg: 'bg-amber-500/10' };
            case 'low': return { color: 'bg-emerald-500', border: 'border-l-emerald-500', text: 'text-emerald-400', bg: 'bg-emerald-500/10' };
        }
    }, [task.priority]);

    // Date Logic
    const dateConfig = useMemo(() => {
        if (!task.dueDate) return null;
        const date = task.dueDate.toDate();
        const now = new Date();
        const isOverdue = date < now;
        const isSoon = (date.getTime() - now.getTime()) / (1000 * 3600 * 24) <= 2;

        return {
            text: format(date, 'd MMM', { locale: es }),
            color: isOverdue ? 'text-rose-400' : isSoon ? 'text-amber-400' : 'text-slate-400',
            bg: isOverdue ? 'bg-rose-500/10' : isSoon ? 'bg-amber-500/5' : 'bg-slate-800/50'
        };
    }, [task.dueDate]);

    // Checklist Progress
    const progress = useMemo(() => {
        if (!task.checklist || task.checklist.length === 0) return null;
        const completed = task.checklist.filter(i => i.completed).length;
        const total = task.checklist.length;
        return { completed, total, percentage: Math.round((completed / total) * 100) };
    }, [task.checklist]);

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={onClick}
            className={`
                group relative bg-slate-800/40 backdrop-blur-xl rounded-xl p-3.5 flex flex-col
                border border-white/5 border-l-4 ${priorityConfig.border}
                hover:border-white/10 hover:shadow-2xl hover:shadow-black/40 hover:-translate-y-1
                transition-all duration-300 w-full min-h-[140px]
            `}
        >
            {/* Top Shine (Aesthetic) */}
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            {/* Header: Badge & Tag */}
            <div className="flex justify-between items-start mb-2.5">
                {task.tags && task.tags.length > 0 ? (
                    <span className="text-[10px] font-bold text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20 max-w-[120px] truncate">
                        {task.tags[0]}
                    </span>
                ) : <div />} {/* Spacer */}

                {/* Priority Icon */}
                <Flag className={`w-3.5 h-3.5 ${priorityConfig.text}`} strokeWidth={2.5} />
            </div>

            {/* Title - Grow to fill space */}
            <h3 className="text-slate-200 font-medium text-sm leading-snug mb-3 line-clamp-3 group-hover:text-white transition-colors flex-grow">
                {task.title}
            </h3>

            {/* Footer Metadatos - Always at bottom */}
            <div className="flex items-center justify-between pt-3 border-t border-white/5 mt-auto">
                <div className="flex items-center gap-2.5">
                    {/* Date */}
                    {dateConfig && (
                        <div className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-md border ${dateConfig.bg} ${dateConfig.color} border-transparent bg-opacity-50`}>
                            <Clock size={11} />
                            <span>{dateConfig.text}</span>
                        </div>
                    )}

                    {/* Description Indicator */}
                    {task.description && (
                        <AlignLeft size={12} className="text-slate-500" />
                    )}
                </div>

                {/* Progress Bar (Mini) */}
                {progress && (
                    <div className="flex items-center gap-2" title={`${progress.completed}/${progress.total} completadas`}>
                        <span className="text-[10px] font-mono text-slate-400 font-medium">
                            {progress.completed}/{progress.total}
                        </span>
                        <div className="w-10 h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                                style={{ width: `${progress.percentage}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default KanbanCard;
