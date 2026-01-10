import React, { useState, useMemo } from 'react';
import { DndContext, DragEndEvent, DragOverlay, PointerSensor, useSensor, useSensors, closestCorners, DragOverEvent, KeyboardSensor } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Plus, Loader2 } from 'lucide-react';
import { useKanban, KanbanTask } from '../../../hooks/useKanban';
import KanbanColumn from './KanbanColumn';
import KanbanCard from './KanbanCard';
import KanbanFilters from './KanbanFilters';
import TaskDetailModal from './TaskDetailModal';
import confetti from 'canvas-confetti';
import { useEffect } from 'react';

const COLUMNS = [
    { id: 'todo', title: 'Por Hacer', color: 'from-sky-400/10 via-sky-400/5 to-transparent', accent: 'text-sky-500', tint: 'bg-sky-500/5', border: 'border-sky-500/20' },
    { id: 'in_progress', title: 'En Progreso', color: 'from-indigo-400/10 via-indigo-400/5 to-transparent', accent: 'text-indigo-500', tint: 'bg-indigo-500/5', border: 'border-indigo-500/20' },
    { id: 'done', title: 'Completado', color: 'from-emerald-400/10 via-emerald-400/5 to-transparent', accent: 'text-emerald-500', tint: 'bg-emerald-500/5', border: 'border-emerald-500/20' }
] as const;

const KanbanBoard: React.FC = () => {
    const { tasks: backendTasks, isLoading, addTask, updateTask, deleteTask } = useKanban();

    // UI State
    // Local state for smooooooth dragging
    const [tasks, setTasks] = useState<KanbanTask[]>([]);
    const [dragTask, setDragTask] = useState<KanbanTask | null>(null);
    const [editingTask, setEditingTask] = useState<KanbanTask | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [priorityFilter, setPriorityFilter] = useState<string | null>(null);

    // Sync backend tasks to local tasks when not dragging
    useEffect(() => {
        if (!dragTask) {
            setTasks(backendTasks);
        }
    }, [backendTasks, dragTask]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 5 }
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
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
    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        // Find the containers
        const activeTask = tasks.find(t => t.id === activeId);
        const overTask = tasks.find(t => t.id === overId);

        if (!activeTask) return;

        let newStatus: KanbanTask['status'] | undefined;

        // 1. Drop over a Column directly
        const isOverColumn = COLUMNS.some(col => col.id === overId);
        if (isOverColumn) {
            newStatus = overId as KanbanTask['status'];
        }
        // 2. Drop over another Task
        else if (overTask) {
            newStatus = overTask.status;
        }

        // If we found a valid new status and it's different, move it visually IMMEDIATELY
        if (newStatus && activeTask.status !== newStatus) {
            setTasks((prev) => prev.map(t =>
                t.id === activeId ? { ...t, status: newStatus! } : t
            ));
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setDragTask(null);

        if (!over) return;

        const taskId = active.id as string;
        const activeTask = tasks.find(t => t.id === taskId);

        // At this point, thanks to onDragOver, the activeTask in 'tasks' state 
        // likely already has the new status. But we need to verify against valid logic
        // or just persist whatever the final 'over' dictates to be safe.

        // Recalculate robustly for persistence
        let finalStatus: KanbanTask['status'] | undefined;

        if (COLUMNS.some(col => col.id === over.id)) {
            finalStatus = over.id as KanbanTask['status'];
        } else {
            const overTask = tasks.find(t => t.id === over.id);
            if (overTask) finalStatus = overTask.status;
        }

        // We persist the change to Backend
        if (finalStatus && activeTask) { // Even if status didn't change locally, ensure backend is in sync
            if (finalStatus === 'done' && activeTask.status !== 'done') {
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#6366f1', '#10b981', '#f43f5e']
                });
            }
            // Always call update to ensure DB consistency
            updateTask({ id: taskId, status: finalStatus });
        }
    };

    const handleDragStart = (event: any) => {
        const task = tasks.find(t => t.id === event.active.id);
        if (task) setDragTask(task);
    };

    const handleAddTask = () => {
        const title = prompt("Nueva tarea:");
        if (title) {
            addTask({
                title,
                status: 'todo',
                priority: 'medium'
            });
        }
    };

    if (isLoading && tasks.length === 0) {
        return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin text-indigo-500" /></div>;
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div className="p-6 h-full flex flex-col relative overflow-hidden">
                {/* Atmospheric Background Gradient */}
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-sky-500/5 rounded-full blur-[120px] pointer-events-none" />

                <div className="relative z-10 flex flex-col h-full">
                    {/* Header section with glassmorphism */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div className="space-y-0.5">
                            <h1 className="text-3xl font-medium text-slate-800 dark:text-white tracking-tight">Gestión Operativa</h1>
                            <p className="text-sm font-normal text-slate-500 dark:text-slate-400">Panel estratégico para el flujo de tareas y objetivos.</p>
                        </div>

                        <button
                            onClick={handleAddTask}
                            className="flex items-center justify-center gap-2.5 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-2xl font-medium text-sm transition-all shadow-lg shadow-indigo-500/25 active:scale-95 group"
                        >
                            <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                            Nueva Tarea
                        </button>
                    </div>

                    {/* Filters */}
                    <KanbanFilters
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        priorityFilter={priorityFilter}
                        onPriorityChange={setPriorityFilter}
                    />

                    {/* Columns Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 min-h-0">
                        {COLUMNS.map(col => (
                            <KanbanColumn
                                key={col.id}
                                title={col.title}
                                tasks={filteredTasks.filter(t => t.status === col.id)}
                                onCardClick={(task) => setEditingTask(task)}
                                colorConfig={col}
                            />
                        ))}
                    </div>

                    {/* Overlay for Dragging */}
                    <DragOverlay dropAnimation={{
                        sideEffects: ({ active }) => {
                            const activeNode = active.data.current?.sortable?.node;
                            if (activeNode) {
                                activeNode.style.opacity = '1';
                            }
                        },
                        duration: 250,
                        easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
                    }}>
                        {dragTask ? (
                            <div className="rotate-[4deg] scale-110 cursor-grabbing w-[280px] md:w-[350px] shadow-2xl shadow-indigo-500/30">
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
            </div>
        </DndContext>
    );
};

export default KanbanBoard;
