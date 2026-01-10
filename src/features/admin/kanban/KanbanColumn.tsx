import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { KanbanTask } from '../../../hooks/useKanban';
import KanbanCard from './KanbanCard';

interface KanbanColumnProps {
    title: string;
    tasks: KanbanTask[];
    onCardClick: (task: KanbanTask) => void;
    colorConfig: {
        id: string;
        title: string;
        color: string;
        accent: string;
        tint: string;
        border: string;
    };
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ title, tasks, onCardClick, colorConfig }) => {
    const { setNodeRef, isOver } = useDroppable({
        id: colorConfig.id,
    });

    return (
        <div className={`flex flex-col h-full ${colorConfig.tint} rounded-[2.5rem] border ${colorConfig.border} backdrop-blur-sm overflow-hidden transition-all duration-500`}>
            {/* Column Header with Subtle Gradient */}
            <div className={`p-4 flex items-center justify-between border-b ${colorConfig.border} bg-gradient-to-r ${colorConfig.color}`}>
                <div className="flex items-center gap-3">
                    <h3 className={`text-[12px] font-medium ${colorConfig.accent} uppercase tracking-[0.2em] opacity-80`}>
                        {title}
                    </h3>
                    <div className={`px-2 py-0.5 ${colorConfig.tint} text-[10px] font-medium ${colorConfig.accent} rounded-full border ${colorConfig.border} shadow-sm backdrop-blur-md`}>
                        {tasks.length}
                    </div>
                </div>
            </div>

            {/* Tasks Area */}
            <div
                ref={setNodeRef}
                className={`flex-1 p-2 space-y-3 overflow-y-auto custom-scrollbar transition-all duration-300 ${isOver
                    ? `bg-${colorConfig.color.split('-')[1]}-500/10 ring-2 ring-${colorConfig.color.split('-')[1]}-500/30 shadow-inner`
                    : ''
                    }`}
            >
                <div className="flex flex-col gap-3">
                    <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                        {tasks.map((task) => (
                            <KanbanCard key={task.id} task={task} onCardClick={onCardClick} />
                        ))}
                    </SortableContext>
                </div>

                {tasks.length === 0 && !isOver && (
                    <div className={`h-40 flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 border-2 border-dashed ${colorConfig.border} rounded-2xl p-8 mt-4`}>
                        <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-center opacity-40">Arrastra aquí</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default KanbanColumn;
