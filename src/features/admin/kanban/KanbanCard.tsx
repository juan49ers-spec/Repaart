import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, CheckCircle2 } from 'lucide-react';
import { KanbanTask } from '../../../hooks/useKanban';

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



    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={() => onCardClick?.(task)}
            className={`
                group relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2rem] border transition-all duration-500 cursor-grab active:cursor-grabbing touch-none
                ${task.priority === 'high' ? 'border-rose-500/20 bg-rose-500/[0.02] hover:shadow-rose-500/5' :
                    task.priority === 'medium' ? 'border-amber-500/20 bg-amber-500/[0.02] hover:shadow-amber-500/5' :
                        'border-emerald-500/20 bg-emerald-500/[0.02] hover:shadow-emerald-500/5'}
                shadow-sm hover:shadow-2xl ${isDragging ? 'opacity-30 grayscale-[0.5]' : 'opacity-100'}
            `}
        >
            <div className="p-4 space-y-3">
                {/* Priority & Tags */}
                <div className="flex items-center justify-between mb-1">
                    <div className="flex gap-1.5 flex-wrap">
                        {task.tags?.slice(0, 2).map(tag => (
                            <span key={tag} className="px-2.5 py-1 bg-slate-100/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-[10px] font-medium uppercase tracking-wider rounded-lg border border-slate-200/30 dark:border-slate-700/30">
                                {tag}
                            </span>
                        ))}
                    </div>
                    <div className={`w-1.5 h-1.5 rounded-full ${task.priority === 'high' ? 'bg-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.6)]' :
                        task.priority === 'medium' ? 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.6)]' :
                            'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.6)]'
                        } transition-all duration-500 group-hover:scale-125`} />
                </div>

                {/* Title */}
                <h4 className="text-[14px] font-medium text-slate-800 dark:text-slate-100 leading-snug tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {task.title}
                </h4>
            </div>

            {/* Bottom Meta */}
            <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100 dark:border-slate-800/50">
                <div className="flex items-center gap-3">
                    {task.dueDate && (
                        <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
                            <Calendar size={12} />
                            <span className="text-[10px] font-medium italic opacity-70">
                                {task.dueDate.toDate ? task.dueDate.toDate().toLocaleDateString() : new Date(task.dueDate).toLocaleDateString()}
                            </span>
                        </div>
                    )}
                </div>

                {/* Progress Bar */}
                {task.checklist && task.checklist.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                        <div className="flex justify-between items-center text-[9px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                            <div className="flex items-center gap-1">
                                <CheckCircle2 size={10} className="text-emerald-500" />
                                <span>{task.checklist.filter(i => i.completed).length}/{task.checklist.length}</span>
                            </div>
                            <span>{Math.round((task.checklist.filter(i => i.completed).length / task.checklist.length) * 100)}%</span>
                        </div>
                        <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200/20 dark:border-slate-700/20">
                            <div
                                className={`h-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(0,0,0,0.1)] ${task.priority === 'high' ? 'bg-rose-500' :
                                    task.priority === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                                    }`}
                                style={{ width: `${(task.checklist.filter(i => i.completed).length / task.checklist.length) * 100}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default KanbanCard;
