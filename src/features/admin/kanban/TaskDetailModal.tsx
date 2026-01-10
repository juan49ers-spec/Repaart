import React, { useState, useEffect } from 'react';
import { X, Calendar, CheckSquare, Tag, AlignLeft, Plus, Trash2, Briefcase, Clock, ArrowRight, Layers } from 'lucide-react';
import { KanbanTask } from '../../../hooks/useKanban';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface TaskDetailModalProps {
    task: KanbanTask;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: (id: string, updates: Partial<KanbanTask>) => void;
    onDelete: (id: string) => void;
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ task, isOpen, onClose, onUpdate, onDelete }) => {
    const [title, setTitle] = useState(task.title);
    const [description, setDescription] = useState(task.description || '');
    const [newChecklistItem, setNewChecklistItem] = useState('');
    const [checklist, setChecklist] = useState(task.checklist || []);
    const [newTag, setNewTag] = useState('');
    const [tags, setTags] = useState(task.tags || []);
    const [dueDate, setDueDate] = useState<string>(
        task.dueDate?.toDate ? format(task.dueDate.toDate(), 'yyyy-MM-dd') : ''
    );

    const [currentStatus, setCurrentStatus] = useState(task.status);
    const [currentPriority, setCurrentPriority] = useState(task.priority);

    useEffect(() => {
        setTitle(task.title);
        setDescription(task.description || '');
        setChecklist(task.checklist || []);
        setTags(task.tags || []);
        if (task.dueDate) {
            const date = task.dueDate.toDate ? task.dueDate.toDate() : new Date(task.dueDate);
            setDueDate(format(date, 'yyyy-MM-dd'));
        } else {
            setDueDate('');
        }
        setCurrentStatus(task.status);
        setCurrentPriority(task.priority);
    }, [task]);

    if (!isOpen) return null;

    const handleTitleBlur = () => {
        if (title !== task.title) onUpdate(task.id, { title });
    };

    const handleDescriptionBlur = () => {
        if (description !== (task.description || '')) onUpdate(task.id, { description });
    };

    const addChecklistItem = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newChecklistItem.trim()) return;
        const newItem = { id: crypto.randomUUID(), text: newChecklistItem, completed: false };
        const updatedList = [...checklist, newItem];
        setChecklist(updatedList);
        onUpdate(task.id, { checklist: updatedList });
        setNewChecklistItem('');
    };

    const toggleChecklistItem = (itemId: string) => {
        const updatedList = checklist.map(item =>
            item.id === itemId ? { ...item, completed: !item.completed } : item
        );
        setChecklist(updatedList);
        onUpdate(task.id, { checklist: updatedList });
    };

    const deleteChecklistItem = (itemId: string) => {
        const updatedList = checklist.filter(item => item.id !== itemId);
        setChecklist(updatedList);
        onUpdate(task.id, { checklist: updatedList });
    };

    const addTag = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTag.trim() || tags.includes(newTag)) return;
        const updatedTags = [...tags, newTag.trim()];
        setTags(updatedTags);
        onUpdate(task.id, { tags: updatedTags });
        setNewTag('');
    };

    const removeTag = (tagToRemove: string) => {
        const updatedTags = tags.filter(t => t !== tagToRemove);
        setTags(updatedTags);
        onUpdate(task.id, { tags: updatedTags });
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const updatedDate = e.target.value;
        setDueDate(updatedDate);
        if (updatedDate) {
            onUpdate(task.id, { dueDate: new Date(updatedDate) as any });
        } else {
            onUpdate(task.id, { dueDate: null as any });
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xl animate-in fade-in duration-500">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] overflow-hidden flex flex-col scale-in-center overflow-y-auto custom-scrollbar">

                {/* Visual Accent */}
                <div className={`h-1.5 w-full ${currentPriority === 'high' ? 'bg-rose-500' :
                    currentPriority === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                    } transition-colors duration-500`} />

                <div className="p-8 md:p-12 flex-1">
                    {/* TOP HEADER */}
                    <div className="flex justify-between items-start gap-8 mb-10">
                        <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-semibold uppercase tracking-[0.15em] px-3 py-1 rounded-xl border border-indigo-100 dark:border-indigo-500/20">
                                    TASK-ID #{task.id.slice(0, 8).toUpperCase()}
                                </span>
                                {task.createdAt && (
                                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                        <Clock size={12} />
                                        {format(task.createdAt.toDate(), 'dd MMM', { locale: es })}
                                    </span>
                                )}
                            </div>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                onBlur={handleTitleBlur}
                                className="w-full bg-transparent text-2xl font-medium text-slate-800 dark:text-white border-none focus:ring-0 p-0 placeholder-slate-200 dark:placeholder-slate-800 tracking-tight"
                                placeholder="Título de la tarea"
                            />
                        </div>
                        <button
                            onClick={onClose}
                            className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all hover:rotate-90 active:scale-90 border border-slate-100 dark:border-white/5"
                            title="Cerrar detalles"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                        {/* MAIN WORKSPACE (Left Side) */}
                        <div className="lg:col-span-8 space-y-12">

                            {/* Tags Bar */}
                            <div className="flex flex-wrap items-center gap-2 pb-6 border-b border-slate-100 dark:border-white/5">
                                <Tag size={14} className="text-slate-400 mr-2" />
                                {tags.map(tag => (
                                    <span key={tag} className="group relative bg-slate-50/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-xl text-[10px] font-semibold uppercase tracking-wider border border-slate-200/50 dark:border-white/5 flex items-center gap-2 shadow-sm transition-all hover:bg-slate-100">
                                        {tag}
                                        <button
                                            onClick={() => removeTag(tag)}
                                            className="opacity-0 group-hover:opacity-100 hover:text-rose-500 transition-all ml-1 bg-white dark:bg-slate-700 rounded-full p-0.5"
                                            title={`Eliminar etiqueta ${tag}`}
                                        >
                                            <X size={10} />
                                        </button>
                                    </span>
                                ))}
                                <form onSubmit={addTag} className="relative">
                                    <input
                                        type="text"
                                        value={newTag}
                                        onChange={(e) => setNewTag(e.target.value)}
                                        placeholder="+ Etiqueta"
                                        className="bg-transparent border-none text-[10px] font-semibold uppercase tracking-wider text-indigo-500 placeholder-indigo-300 focus:ring-0 p-1 w-24"
                                    />
                                </form>
                            </div>

                            {/* Description Block */}
                            <section className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-violet-500/10 flex items-center justify-center border border-violet-500/20">
                                        <AlignLeft size={16} className="text-violet-600 dark:text-violet-400" />
                                    </div>
                                    <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Descripción Detallada</h3>
                                </div>
                                <div className="group relative">
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        onBlur={handleDescriptionBlur}
                                        placeholder="Define los objetivos y alcances de esta tarea..."
                                        className="w-full bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-white/5 rounded-2xl p-6 text-slate-700 dark:text-slate-200 text-sm focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 min-h-[160px] resize-none leading-relaxed transition-all outline-none"
                                    />
                                </div>
                            </section>

                            {/* Checklist Block */}
                            <section className="space-y-5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                            <CheckSquare size={16} className="text-emerald-600 dark:text-emerald-400" />
                                        </div>
                                        <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Plan de Acción</h3>
                                    </div>
                                    {checklist.length > 0 && (
                                        <div className="flex items-center gap-3 text-right">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Progreso</span>
                                                <span className="text-lg font-semibold text-emerald-600 dark:text-emerald-400 leading-none">
                                                    {Math.round((checklist.filter(i => i.completed).length / checklist.length) * 100)}%
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="bg-slate-50/50 dark:bg-slate-950/20 rounded-[2.5rem] p-6 border border-slate-200/50 dark:border-white/5 space-y-3">
                                    {checklist.map(item => (
                                        <div key={item.id} className="flex items-center gap-4 group bg-white/80 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/50 dark:border-white/5 shadow-sm transition-all hover:translate-x-1 hover:shadow-md">
                                            <div className="relative flex items-center justify-center">
                                                <input
                                                    type="checkbox"
                                                    checked={item.completed}
                                                    onChange={() => toggleChecklistItem(item.id)}
                                                    className="w-5 h-5 rounded-lg border-2 border-slate-300 dark:border-slate-600 bg-transparent text-emerald-500 focus:ring-emerald-500/20 cursor-pointer transition-all checked:scale-110"
                                                    aria-label={`Marcar "${item.text}" como completado`}
                                                />
                                            </div>
                                            <span className={`text-sm font-medium flex-1 transition-all ${item.completed ? 'text-slate-400 line-through opacity-60' : 'text-slate-700 dark:text-slate-200'}`}>
                                                {item.text}
                                            </span>
                                            <button
                                                onClick={() => deleteChecklistItem(item.id)}
                                                className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-rose-500 transition-all"
                                                title="Eliminar paso"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}

                                    <form onSubmit={addChecklistItem} className="pt-2">
                                        <div className="flex items-center gap-4 p-4 bg-white/40 dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl transition-all focus-within:border-indigo-500/50">
                                            <Plus size={16} className="text-indigo-500" />
                                            <input
                                                type="text"
                                                value={newChecklistItem}
                                                onChange={(e) => setNewChecklistItem(e.target.value)}
                                                placeholder="Añadir paso al plan..."
                                                className="bg-transparent border-none focus:ring-0 p-0 text-sm font-medium text-slate-600 dark:text-slate-300 placeholder:text-slate-400 w-full outline-none"
                                            />
                                        </div>
                                    </form>
                                </div>
                            </section>

                            <section className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                                        <Layers size={16} className="text-amber-600 dark:text-amber-400" />
                                    </div>
                                    <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Historial & Comentarios</h3>
                                </div>
                                <div className="p-10 bg-slate-50/50 dark:bg-slate-900/40 rounded-[2.5rem] border border-dashed border-slate-200 dark:border-white/5 text-center space-y-2">
                                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Sin actividad reciente</p>
                                    <p className="text-[10px] text-slate-500 italic opacity-60">Las actualizaciones de estado y comentarios profesionales aparecerán aquí.</p>
                                </div>
                            </section>
                        </div>

                        {/* CONTROL PANEL (Right Side) */}
                        <div className="lg:col-span-4 space-y-8">
                            <div className="bg-slate-50/50 dark:bg-slate-800/40 p-6 rounded-[2.5rem] border border-slate-200/50 dark:border-white/5 space-y-6">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] block ml-1">Estado</label>
                                    <div className="flex flex-col gap-2">
                                        {(['todo', 'in_progress', 'done'] as const).map(s => (
                                            <button
                                                key={s}
                                                onClick={() => {
                                                    setCurrentStatus(s);
                                                    onUpdate(task.id, { status: s });
                                                }}
                                                className={`flex items-center justify-between p-4 rounded-2xl border font-medium text-xs uppercase tracking-wider transition-all ${currentStatus === s
                                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-500/10 translate-x-1'
                                                    : 'bg-white/80 dark:bg-slate-900 text-slate-500 border-slate-200/50 dark:border-white/5 hover:border-indigo-300'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Briefcase size={14} />
                                                    {s.replace('_', ' ')}
                                                </div>
                                                {currentStatus === s && <ArrowRight size={14} />}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="h-px bg-slate-200/50 dark:bg-white/5 mx-2" />

                                <div className="space-y-4">
                                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] block ml-1">Prioridad</label>
                                    <div className="flex gap-2">
                                        {(['low', 'medium', 'high'] as const).map(p => (
                                            <button
                                                key={p}
                                                onClick={() => {
                                                    setCurrentPriority(p);
                                                    onUpdate(task.id, { priority: p });
                                                }}
                                                className={`flex-1 py-3.5 rounded-2xl border font-medium text-[10px] uppercase tracking-wider transition-all ${currentPriority === p
                                                    ? p === 'high' ? 'bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/10' :
                                                        p === 'medium' ? 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/10' :
                                                            'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/10'
                                                    : 'bg-white/80 dark:bg-slate-900 text-slate-400 border-slate-200/50 dark:border-white/5'
                                                    }`}
                                            >
                                                {p}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-50/50 dark:bg-slate-800/40 p-6 rounded-[2.5rem] border border-slate-200/50 dark:border-white/5 space-y-4">
                                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] block ml-1">Vencimiento</label>
                                <div className="relative group">
                                    <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500 opacity-60" />
                                    <input
                                        type="date"
                                        value={dueDate}
                                        onChange={handleDateChange}
                                        className="w-full bg-white/80 dark:bg-slate-900 border border-slate-200/50 dark:border-white/5 rounded-2xl p-4 pl-12 text-sm font-semibold text-slate-700 dark:text-slate-200 focus:border-indigo-500/50 transition-all outline-none"
                                        aria-label="Fecha de vencimiento"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100 dark:border-white/5">
                                <button
                                    onClick={() => {
                                        if (confirm('¿Confirmas la eliminación permanente de este registro?')) {
                                            onDelete(task.id);
                                            onClose();
                                        }
                                    }}
                                    className="w-full flex items-center justify-center gap-3 bg-white/80 dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-400 hover:text-rose-600 border border-slate-200/50 dark:border-white/5 p-4 rounded-2xl text-[10px] font-semibold uppercase tracking-widest transition-all"
                                >
                                    <Trash2 size={16} />
                                    Eliminar Registro
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaskDetailModal;
