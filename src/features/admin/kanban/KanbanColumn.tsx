import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { KanbanTask } from '../../../hooks/useKanban';
import KanbanCard from './KanbanCard';

interface KanbanColumnProps {
    id: string;
    title: string;
    tasks: KanbanTask[];
    color: string;
    onCardClick: (task: KanbanTask) => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ id, title, tasks, color, onCardClick }) => {
    const { setNodeRef, isOver } = useDroppable({
        id: id
    });

    return (
        <div className="flex flex-col h-full bg-slate-900/30 rounded-2xl border border-slate-800/50 backdrop-blur-sm overflow-hidden">
            {/* Header */}
            <div className={`p-4 border-b border-slate-800/50 bg-gradient-to-r ${color} bg-opacity-10`}>
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-slate-200 text-sm tracking-wide">{title}</h3>
                    <span className="bg-slate-950/50 text-slate-400 px-2 py-0.5 rounded text-xs font-mono border border-slate-800">
                        {tasks.length}
                    </span>
                </div>
            </div>

            {/* Droppable Area */}
            <div
                ref={setNodeRef}
                className={`
                    flex-1 p-3 space-y-3 overflow-y-auto custom-scrollbar transition-colors
                    ${isOver ? 'bg-indigo-500/5 ring-2 ring-indigo-500/20 ring-inset' : ''}
                `}
                style={{ minHeight: '300px' }}
            >
                {tasks.map(task => (
                    <KanbanCard
                        key={task.id}
                        task={task}
                        onClick={() => onCardClick(task)}
                    />
                ))}

                {tasks.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-slate-600 border-2 border-dashed border-slate-800/50 rounded-xl p-4">
                        <p className="text-xs text-center opacity-50">Sin tareas</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default KanbanColumn;
