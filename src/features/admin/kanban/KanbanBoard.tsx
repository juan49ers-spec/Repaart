import React, { useState, useMemo, useEffect } from 'react';
import { DndContext, DragEndEvent, DragOverlay, PointerSensor, useSensor, useSensors, closestCorners, DragOverEvent, KeyboardSensor, DragStartEvent } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Plus, Loader2 } from 'lucide-react';
import { useKanban, KanbanTask } from '../../../hooks/useKanban';
import KanbanColumn from './KanbanColumn';
import KanbanCard from './KanbanCard';
import KanbanFilters, { SortOption } from './KanbanFilters';
import TaskDetailModal from './TaskDetailModal';
import confetti from 'canvas-confetti';

const COLUMNS = [
    { id: 'todo', title: 'Por Hacer', color: 'from-sky-400/10 via-sky-400/5 to-transparent', accent: 'text-sky-500', tint: 'bg-sky-500/5', border: 'border-sky-500/20' },
    { id: 'in_progress', title: 'En Progreso', color: 'from-indigo-400/10 via-indigo-400/5 to-transparent', accent: 'text-indigo-500', tint: 'bg-indigo-500/5', border: 'border-indigo-500/20' },
    { id: 'done', title: 'Completado', color: 'from-emerald-400/10 via-emerald-400/5 to-transparent', accent: 'text-emerald-500', tint: 'bg-emerald-500/5', border: 'border-emerald-500/20' }
] as const;

const KanbanBoard: React.FC = () => {
    const { tasks: backendTasks, isLoading, addTask, updateTask, deleteTask } = useKanban();

    // UI state for smooth drag transitions
    const [localTasks, setLocalTasks] = useState<KanbanTask[]>([]);
    const [dragTask, setDragTask] = useState<KanbanTask | null>(null);
    const [editingTask, setEditingTask] = useState<KanbanTask | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [priorityFilter, setPriorityFilter] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<SortOption>('newest');

    // Synchronize local tasks with backend, but only when not dragging
    // Synchronize local tasks with backend, but only when not dragging
    useEffect(() => {
        if (!dragTask) {
            setLocalTasks(prev => {
                if (JSON.stringify(prev) === JSON.stringify(backendTasks)) return prev;
                return backendTasks;
            });
        }
    }, [backendTasks, dragTask]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // Board Statistics
    const stats = useMemo(() => {
        const total = localTasks.length;
        const done = localTasks.filter(t => t.status === 'done').length;
        const inProgress = localTasks.filter(t => t.status === 'in_progress').length;
        const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;
        return { total, done, inProgress, completionRate };
    }, [localTasks]);

    // Filtering & Sorting
    const filteredTasks = useMemo(() => {
        const result = localTasks.filter(task => {
            const searchLower = searchQuery.toLowerCase();
            const matchesSearch = task.title.toLowerCase().includes(searchLower) ||
                task.tags?.some(tag => tag.toLowerCase().includes(searchLower));
            const matchesPriority = priorityFilter && priorityFilter !== 'all' ? task.priority === priorityFilter : true;
            return matchesSearch && matchesPriority;
        });

        result.sort((a, b) => {
            if (sortBy === 'newest') {
                const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : (a.createdAt ? new Date(a.createdAt) : new Date(0));
                const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : (b.createdAt ? new Date(b.createdAt) : new Date(0));
                return dateB.getTime() - dateA.getTime();
            }
            if (sortBy === 'priority') {
                const priorityOrder = { high: 0, medium: 1, low: 2 };
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            }
            if (sortBy === 'due_date') {
                if (!a.dueDate) return 1;
                if (!b.dueDate) return -1;
                const dateA = a.dueDate.toDate ? a.dueDate.toDate() : new Date(a.dueDate);
                const dateB = b.dueDate.toDate ? b.dueDate.toDate() : new Date(b.dueDate);
                return dateA.getTime() - dateB.getTime();
            }
            return 0;
        });

        return result;
    }, [localTasks, searchQuery, priorityFilter, sortBy]);

    // Handlers
    const handleDragStart = (event: DragStartEvent) => {
        const task = localTasks.find(t => t.id === event.active.id);
        if (task) setDragTask(task);
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        const activeTask = localTasks.find(t => t.id === activeId);
        if (!activeTask) return;

        let newStatus: KanbanTask['status'] | undefined;
        const isOverColumn = COLUMNS.some(col => col.id === overId);

        if (isOverColumn) {
            newStatus = overId as KanbanTask['status'];
        } else {
            const overTask = localTasks.find(t => t.id === overId);
            if (overTask) newStatus = overTask.status;
        }

        if (newStatus && activeTask.status !== newStatus) {
            setLocalTasks(prev => prev.map(t => t.id === activeId ? { ...t, status: newStatus! } : t));
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setDragTask(null);
        if (!over) return;

        const taskId = active.id as string;
        const taskBeforeDrop = localTasks.find(t => t.id === taskId);

        let finalStatus: KanbanTask['status'] | undefined;
        if (COLUMNS.some(col => col.id === over.id)) {
            finalStatus = over.id as KanbanTask['status'];
        } else {
            const overTask = localTasks.find(t => t.id === over.id);
            if (overTask) finalStatus = overTask.status;
        }

        if (finalStatus && taskBeforeDrop) {
            if (finalStatus === 'done' && taskBeforeDrop.status !== 'done') {
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#6366f1', '#10b981', '#f43f5e']
                });
            }
            // Real update (optimistic update is inside useKanban mutation)
            updateTask({ id: taskId, status: finalStatus });
        }
    };

    const handleAddTask = (status: KanbanTask['status'] = 'todo') => {
        const title = prompt("Nueva tarea:");
        if (title) {
            addTask({ title, status, priority: 'medium' });
        }
    };

    if (isLoading && localTasks.length === 0) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="animate-spin text-indigo-500" />
            </div>
        );
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div className="p-4 md:p-8 h-full flex flex-col relative overflow-hidden bg-slate-50/50 dark:bg-transparent min-h-[calc(100vh-100px)]">
                {/* 🌌 Atmospheric Glows */}
                <div className="absolute top-[-5%] left-[-5%] w-[30%] h-[30%] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute bottom-[-5%] right-[-5%] w-[30%] h-[30%] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />

                <div className="relative z-10 flex flex-col h-full">
                    {/* Header section */}
                    <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 mb-10">
                        <div className="space-y-4">
                            <div className="flex flex-col space-y-2">
                                <span className="inline-flex w-fit px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] border border-indigo-500/20">
                                    Productivity Suite
                                </span>
                                <h1 className="text-4xl md:text-5xl font-black text-slate-800 dark:text-white tracking-tighter">
                                    Project <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-indigo-400">Flow</span>
                                </h1>
                            </div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed">
                                Orquestación de objetivos estratégicos y tareas operativas con trazabilidad en tiempo real.
                            </p>
                        </div>

                        {/* Stats Dashboard */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md p-6 rounded-[2.5rem] border border-slate-200/50 dark:border-white/5 shadow-xl shadow-slate-200/20 dark:shadow-none">
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total</p>
                                <p className="text-2xl font-black text-slate-800 dark:text-white">{stats.total}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Activas</p>
                                <p className="text-2xl font-black text-slate-800 dark:text-white">{stats.inProgress}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Éxito</p>
                                <p className="text-2xl font-black text-slate-800 dark:text-white">{stats.completionRate}%</p>
                            </div>
                            <div className="flex items-center justify-end">
                                <button
                                    onClick={() => handleAddTask('todo')}
                                    className="p-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95 group"
                                    title="Añadir nueva tarea general"
                                >
                                    <Plus size={24} className="group-hover:rotate-90 transition-transform duration-300" />
                                </button>
                            </div>
                        </div>
                    </div>

                    <KanbanFilters
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        priorityFilter={priorityFilter}
                        onPriorityChange={setPriorityFilter}
                        sortBy={sortBy}
                        onSortChange={setSortBy}
                    />

                    {/* Columns Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0 mt-8">
                        {COLUMNS.map(col => (
                            <KanbanColumn
                                key={col.id}
                                title={col.title}
                                tasks={filteredTasks.filter(t => t.status === col.id)}
                                onCardClick={(task) => setEditingTask(task)}
                                onQuickAdd={(title) => addTask({ title, status: col.id, priority: 'medium' })}
                                colorConfig={col}
                            />
                        ))}
                    </div>

                    <DragOverlay dropAnimation={{
                        sideEffects: ({ active }) => {
                            const activeNode = active.data.current?.sortable?.node;
                            if (activeNode) activeNode.style.opacity = '1';
                        },
                        duration: 250,
                        easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
                    }}>
                        {dragTask ? (
                            <div className="rotate-[4deg] scale-110 cursor-grabbing w-[300px] shadow-2xl shadow-indigo-500/30">
                                <KanbanCard task={dragTask} />
                            </div>
                        ) : null}
                    </DragOverlay>

                    {editingTask && (
                        <TaskDetailModal
                            key={editingTask.id}
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
