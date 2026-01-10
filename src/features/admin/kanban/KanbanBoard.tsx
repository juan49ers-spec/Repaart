import React, { useState, useMemo } from 'react';
import { DndContext, DragEndEvent, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { KanbanSquare, Plus, Loader2 } from 'lucide-react';
import { useKanban, KanbanTask } from '../../../hooks/useKanban';
import KanbanColumn from './KanbanColumn';
import KanbanCard from './KanbanCard';
import KanbanFilters from './KanbanFilters';
import TaskDetailModal from './TaskDetailModal';
import confetti from 'canvas-confetti';

const COLUMNS = [
    { id: 'todo', title: 'Por Hacer', color: 'from-slate-500/20 to-slate-600/20' },
    { id: 'in_progress', title: 'En Progreso', color: 'from-blue-500/20 to-indigo-500/20' },
    { id: 'done', title: 'Completado', color: 'from-emerald-500/20 to-green-500/20' }
] as const;

const KanbanBoard: React.FC = () => {
    const { tasks, isLoading, addTask, updateTask, deleteTask } = useKanban();

    // UI State
    const [dragTask, setDragTask] = useState<KanbanTask | null>(null);
    const [editingTask, setEditingTask] = useState<KanbanTask | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [priorityFilter, setPriorityFilter] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 }
        })
    );

    // Filtering Logic
    const filteredTasks = useMemo(() => {
        return tasks.filter(task => {
            const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                task.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
            const matchesPriority = priorityFilter ? task.priority === priorityFilter : true;
            return matchesSearch && matchesPriority;
        });
    }, [tasks, searchQuery, priorityFilter]);

    // Handlers
    const handleDragStart = (event: any) => {
        const { active } = event;
        const task = tasks.find(t => t.id === active.id);
        if (task) setDragTask(task);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setDragTask(null);

        if (!over) return;

        const taskId = active.id as string;
        const newStatus = over.id as KanbanTask['status'];
        const currentTask = tasks.find(t => t.id === taskId);

        if (currentTask && currentTask.status !== newStatus) {
            updateTask({ id: taskId, status: newStatus });

            // Confetti Effect when moving to DONE
            if (newStatus === 'done') {
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#6366f1', '#10b981', '#f43f5e']
                });
            }
        }
    };

    const handleQuickAdd = () => {
        const title = prompt("Nueva tarea:");
        if (title) {
            addTask({
                title,
                status: 'todo',
                priority: 'medium'
            });
        }
    };

    if (isLoading) {
        return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin text-indigo-500" /></div>;
    }

    return (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="p-6 h-full flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-black text-white flex items-center gap-2">
                            <KanbanSquare className="text-indigo-400" />
                            Tablero de Proyecto
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">Gestión ágil de tareas v2.1</p>
                    </div>
                    <button
                        onClick={handleQuickAdd}
                        className="
                            relative overflow-hidden group bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-bold 
                            shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] 
                            transition-all active:scale-95 border border-indigo-400/20
                        "
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                        <Plus size={18} className="relative z-10" />
                        <span className="relative z-10">Nueva Tarea</span>
                    </button>
                </div>

                {/* Filters */}
                <KanbanFilters
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    priorityFilter={priorityFilter}
                    setPriorityFilter={setPriorityFilter}
                />

                {/* Columns Grid */}
                {/* Columns Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 h-[calc(100vh-200px)] min-h-[500px]">
                    {COLUMNS.map(col => (
                        <KanbanColumn
                            key={col.id}
                            id={col.id}
                            title={col.title}
                            color={col.color}
                            tasks={filteredTasks.filter(t => t.status === col.id)}
                            onCardClick={(task) => setEditingTask(task)}
                        />
                    ))}
                </div>

                {/* Overlay for Dragging */}
                <DragOverlay>
                    {dragTask ? (
                        <div className="opacity-90 rotate-2 scale-105 cursor-grabbing w-[280px] md:w-[350px]">
                            <KanbanCard task={dragTask} />
                        </div>
                    ) : null}
                </DragOverlay>

                {/* Edit Modal */}
                {editingTask && (
                    <TaskDetailModal
                        isOpen={!!editingTask}
                        task={editingTask}
                        onClose={() => setEditingTask(null)}
                        onUpdate={(id, updates) => updateTask({ id, ...updates })}
                        onDelete={deleteTask}
                    />
                )}
            </div>
        </DndContext>
    );
};

export default KanbanBoard;
