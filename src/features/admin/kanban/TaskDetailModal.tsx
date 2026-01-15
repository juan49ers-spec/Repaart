import React, { useState } from 'react';
import { X, Calendar, CheckSquare, Tag, AlignLeft, Plus, Trash2, Clock, ArrowRight, Layers, CheckCircle2 } from 'lucide-react';
import { KanbanTask } from '../../../hooks/useKanban';
import { format, isToday, isYesterday } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '../../../context/AuthContext';

interface TaskDetailModalProps {
    task: KanbanTask;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: (id: string, updates: Partial<KanbanTask>) => void;
    onDelete: (id: string) => void;
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ task, isOpen, onClose, onUpdate, onDelete }) => {
    const { user } = useAuth();
    const [title, setTitle] = useState(task.title);
    const [description, setDescription] = useState(task.description || '');
    const [newChecklistItem, setNewChecklistItem] = useState('');
    const [checklist, setChecklist] = useState(task.checklist || []);
    const [newTag, setNewTag] = useState('');
    const [tags, setTags] = useState(task.tags || []);
    const [dueDate, setDueDate] = useState<string>(
        (task.dueDate as any)?.toDate ? format((task.dueDate as any).toDate(), 'yyyy-MM-dd') : ''
    );

    // Comments Logic
    const [newComment, setNewComment] = useState('');
    const [comments, setComments] = useState(task.comments || []);

    const [isSaving, setIsSaving] = useState(false);

    const [currentStatus, setCurrentStatus] = useState(task.status);
    const [currentPriority, setCurrentPriority] = useState(task.priority);

    if (!isOpen) return null;

    const wrapUpdate = (updates: Partial<KanbanTask>) => {
        setIsSaving(true);
        onUpdate(task.id, updates);
        setTimeout(() => setIsSaving(false), 800);
    };

    const handleTitleBlur = () => {
        if (title !== task.title) wrapUpdate({ title });
    };

    const handleDescriptionBlur = () => {
        if (description !== (task.description || '')) wrapUpdate({ description });
    };

    const addChecklistItem = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newChecklistItem.trim()) return;
        const newItem = { id: crypto.randomUUID(), text: newChecklistItem, completed: false };
        const updatedList = [...checklist, newItem];
        setChecklist(updatedList);
        wrapUpdate({ checklist: updatedList });
        setNewChecklistItem('');
    };

    const toggleChecklistItem = (itemId: string) => {
        const updatedList = checklist.map(item =>
            item.id === itemId ? { ...item, completed: !item.completed } : item
        );
        setChecklist(updatedList);
        wrapUpdate({ checklist: updatedList });
    };

    const deleteChecklistItem = (itemId: string) => {
        const updatedList = checklist.filter(item => item.id !== itemId);
        setChecklist(updatedList);
        wrapUpdate({ checklist: updatedList });
    };

    const addTag = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTag.trim() || tags.includes(newTag)) return;
        const updatedTags = [...tags, newTag.trim()];
        setTags(updatedTags);
        wrapUpdate({ tags: updatedTags });
        setNewTag('');
    };

    const removeTag = (tagToRemove: string) => {
        const updatedTags = tags.filter(t => t !== tagToRemove);
        setTags(updatedTags);
        wrapUpdate({ tags: updatedTags });
    };

    const handleAddComment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || !user) return;

        const comment = {
            id: crypto.randomUUID(),
            text: newComment.trim(),
            createdAt: new Date() as any, // Local optimistic date (handled by dual check in render)
            userId: user.uid,
            userName: user.displayName || 'Usuario'
        };

        const updatedComments = [comment, ...comments];
        setComments(updatedComments);
        wrapUpdate({ comments: updatedComments });
        setNewComment('');
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const updatedDate = e.target.value;
        setDueDate(updatedDate);
        if (updatedDate) {
            wrapUpdate({ dueDate: new Date(updatedDate) as unknown as KanbanTask['dueDate'] });
        } else {
            wrapUpdate({ dueDate: null as unknown as KanbanTask['dueDate'] });
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/20 dark:bg-slate-950/60 backdrop-blur-xl animate-in fade-in duration-500">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 w-full max-w-5xl max-h-[92vh] rounded-[3rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col scale-in-center">

                {/* 🌈 Priority Glow Bar */}
                <div className={`h-1.5 w-full ${currentPriority === 'high' ? 'bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.4)]' :
                    currentPriority === 'medium' ? 'bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.4)]' :
                        'bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                    } transition-all duration-700`} />

                <div className="flex flex-1 min-h-0">
                    {/* LEFT: MAIN WORKSPACE */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-8 md:p-14 space-y-12 bg-white dark:bg-transparent">

                        {/* Status/Save Indicator */}
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                                <span className="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full border border-indigo-100 dark:border-indigo-500/20">
                                    Módulo de Tarea
                                </span>
                                {isSaving ? (
                                    <span className="flex items-center gap-2 text-[10px] font-bold text-indigo-500 uppercase tracking-widest animate-pulse">
                                        <Clock size={12} className="animate-spin" /> Guardando...
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2 text-[10px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-widest">
                                        <CheckCircle2 size={12} /> Sincronizado
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Title Block */}
                        <div className="space-y-3">
                            <textarea
                                rows={1}
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                onBlur={handleTitleBlur}
                                className="w-full bg-transparent text-2xl font-bold text-slate-900 dark:text-white border-none focus:ring-0 p-0 placeholder:text-slate-200 dark:placeholder:text-slate-800 tracking-tight leading-tight resize-none"
                                placeholder="Nombre de la iniciativa..."
                            />
                        </div>

                        {/* Description Section */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-violet-500/5 text-violet-500 border border-violet-500/10">
                                    <AlignLeft size={16} />
                                </div>
                                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Documentación Técnica</h3>
                            </div>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                onBlur={handleDescriptionBlur}
                                placeholder="Escribe aquí los detalles, objetivos y contexto de la tarea..."
                                className="w-full bg-slate-50 dark:bg-slate-800/20 border border-slate-200/60 dark:border-white/5 rounded-2xl p-5 text-slate-600 dark:text-slate-300 text-sm focus:border-indigo-500/30 focus:ring-4 focus:ring-indigo-500/5 min-h-[120px] resize-none leading-relaxed transition-all outline-none shadow-inner"
                            />
                        </section>

                        {/* Action Plan Section */}
                        <section className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-emerald-500/5 text-emerald-500 border border-emerald-500/10">
                                        <CheckSquare size={16} />
                                    </div>
                                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Plan de Ejecución</h3>
                                </div>
                                {checklist.length > 0 && (
                                    <div className="px-3 py-1.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                                        <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">
                                            {Math.round((checklist.filter(i => i.completed).length / checklist.length) * 100)}% Completado
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                {checklist.map(item => (
                                    <div key={item.id} className="group flex items-center gap-4 p-3 bg-white dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-lg hover:shadow-indigo-500/5 transition-all outline outline-2 outline-transparent hover:outline-indigo-500/10 hover:-translate-y-0.5">
                                        <input
                                            type="checkbox"
                                            checked={item.completed}
                                            onChange={() => toggleChecklistItem(item.id)}
                                            className="w-5 h-5 rounded-md border-2 border-slate-200 dark:border-slate-700 bg-transparent text-indigo-600 focus:ring-indigo-500/20 cursor-pointer transition-all checked:bg-indigo-600"
                                            title={`Marcar "${item.text}"`}
                                        />
                                        <span className={`flex-1 text-[13px] font-medium tracking-tight transition-all ${item.completed ? 'text-slate-300 dark:text-slate-600 line-through' : 'text-slate-600 dark:text-slate-300'}`}>
                                            {item.text}
                                        </span>
                                        <button
                                            onClick={() => deleteChecklistItem(item.id)}
                                            className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 hover:text-rose-500 transition-all active:scale-90"
                                            title="Eliminar ítem"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}

                                <form onSubmit={addChecklistItem}>
                                    <div className="flex items-center gap-3 p-3 bg-slate-50/50 dark:bg-slate-900/40 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-xl focus-within:border-indigo-500/40 focus-within:bg-white dark:focus-within:bg-slate-800 transition-all group">
                                        <Plus size={16} className="text-indigo-500 group-focus-within:rotate-90 transition-transform" />
                                        <input
                                            type="text"
                                            value={newChecklistItem}
                                            onChange={(e) => setNewChecklistItem(e.target.value)}
                                            placeholder="¿Cuál es el siguiente paso?"
                                            className="w-full bg-transparent border-none focus:ring-0 p-0 text-[13px] font-bold text-slate-500 dark:text-slate-400 placeholder:text-slate-300 outline-none"
                                        />
                                    </div>
                                </form>
                            </div>
                        </section>

                        {/* Comments Section */}
                        <section className="space-y-4 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-slate-500/5 text-slate-500 border border-slate-500/10">
                                    <AlignLeft size={16} />
                                </div>
                                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Actividad & Comentarios</h3>
                            </div>

                            {/* Comment Input */}
                            <form onSubmit={handleAddComment} className="flex gap-3">
                                <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-[10px] ring-4 ring-indigo-500/10">
                                    {user?.displayName?.charAt(0) || 'U'}
                                </div>
                                <div className="flex-1">
                                    <input
                                        type="text"
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        placeholder="Escribe un comentario..."
                                        className="w-full bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-white/5 rounded-xl px-4 py-2.5 text-[13px] focus:outline-none focus:border-indigo-500/50 transition-all"
                                    />
                                </div>
                            </form>

                            {/* Comments List */}
                            <div className="space-y-5 relative pl-3.5 border-l border-slate-100 dark:border-slate-800 ml-3.5">
                                {comments.map((comment) => {
                                    const date = (comment.createdAt as any)?.toDate ? (comment.createdAt as any).toDate() : new Date(comment.createdAt as any);

                                    let dateLabel = format(date, "d MMM yyyy", { locale: es });
                                    if (isToday(date)) dateLabel = "Hoy";
                                    if (isYesterday(date)) dateLabel = "Ayer";

                                    return (
                                        <div key={comment.id} className="relative pl-5 space-y-1.5 group">
                                            {/* Timestamp Dot */}
                                            <div className="absolute -left-[18px] top-1.5 w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-slate-800 group-hover:bg-indigo-500 transition-colors border-2 border-white dark:border-slate-900" />

                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[11px] font-bold text-slate-900 dark:text-white">{comment.userName}</span>
                                                    <span className="text-[9px] text-slate-400 font-medium">{dateLabel}</span>
                                                </div>
                                                <p className="text-[13px] text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-r-xl rounded-bl-xl inline-block">
                                                    {comment.text}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    </div>

                    {/* RIGHT: PROPERTIES PANEL */}
                    <div className="w-[320px] bg-slate-50/80 dark:bg-slate-900/40 backdrop-blur-md border-l border-slate-200 dark:border-white/10 p-8 space-y-10 overflow-y-auto custom-scrollbar">

                        <div className="flex justify-end">
                            <button
                                onClick={onClose}
                                className="p-4 rounded-3xl bg-white dark:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-100 dark:border-white/5 shadow-xl shadow-slate-200/20 hover:rotate-90 transition-all active:scale-95"
                                title="Cerrar Mesa de Trabajo"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Management Stats */}
                        <div className="grid grid-cols-1 gap-6">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 ml-1">Estado del Flujo</label>
                                <div className="flex flex-col gap-2.5">
                                    {(['todo', 'in_progress', 'done'] as const).map(s => (
                                        <button
                                            key={s}
                                            onClick={() => {
                                                setCurrentStatus(s);
                                                wrapUpdate({ status: s });
                                            }}
                                            className={`flex items-center justify-between p-5 rounded-[1.5rem] border-2 font-black text-[10px] uppercase tracking-widest transition-all ${currentStatus === s
                                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl shadow-indigo-500/20 translate-x-2'
                                                : 'bg-white dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border-transparent hover:border-slate-200 shadow-sm'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Layers size={14} strokeWidth={2} />
                                                {s.replace('_', ' ')}
                                            </div>
                                            {currentStatus === s && <ArrowRight size={14} />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="h-px bg-slate-200 dark:bg-white/5" />

                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 ml-1">Prioridad Crítica</label>
                                <div className="flex gap-2">
                                    {(['low', 'medium', 'high'] as const).map(p => (
                                        <button
                                            key={p}
                                            onClick={() => {
                                                setCurrentPriority(p);
                                                wrapUpdate({ priority: p });
                                            }}
                                            className={`flex-1 py-4 rounded-[1.25rem] border-2 font-black text-[9px] uppercase tracking-widest transition-all ${currentPriority === p
                                                ? p === 'high' ? 'bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/20' :
                                                    p === 'medium' ? 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/20' :
                                                        'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20'
                                                : 'bg-white dark:bg-slate-800/80 text-slate-400 border-transparent'
                                                }`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 ml-1">Fecha de Entrega</label>
                                <div className="relative group">
                                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-indigo-500 pointer-events-none">
                                        <Calendar size={18} />
                                    </div>
                                    <input
                                        type="date"
                                        value={dueDate}
                                        onChange={handleDateChange}
                                        className="w-full bg-white dark:bg-slate-800/80 border-2 border-transparent focus:border-indigo-500/30 rounded-[1.25rem] p-5 pl-14 text-sm font-black text-slate-700 dark:text-slate-100 transition-all outline-none shadow-sm"
                                        title="Seleccionar fecha"
                                    />
                                </div>
                            </div>

                            {/* Tags Section */}
                            <div className="space-y-4 pt-4">
                                <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 ml-1 flex items-center gap-2">
                                    <Tag size={12} /> Etiquetas
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {tags.map(tag => (
                                        <span key={tag} className="group flex items-center gap-2 px-3 py-1.5 bg-indigo-500/5 text-indigo-600 dark:text-indigo-400 rounded-xl text-[9px] font-black uppercase tracking-wider border border-indigo-500/10">
                                            {tag}
                                            <button onClick={() => removeTag(tag)} className="hover:text-rose-500" title="Eliminar tag">
                                                <X size={10} />
                                            </button>
                                        </span>
                                    ))}
                                    <form onSubmit={addTag} className="flex-1 min-w-[100px]">
                                        <input
                                            type="text"
                                            value={newTag}
                                            onChange={(e) => setNewTag(e.target.value)}
                                            placeholder="+ Nueva..."
                                            className="w-full bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-indigo-400 placeholder:text-slate-300 focus:ring-0 p-1"
                                        />
                                    </form>
                                </div>
                            </div>
                        </div>

                        {/* Danger Zone */}
                        <div className="pt-10">
                            <button
                                onClick={() => {
                                    if (confirm('¿Eliminar permanentemente este registro del ecosistema?')) {
                                        onDelete(task.id);
                                        onClose();
                                    }
                                }}
                                className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-800 hover:bg-rose-500 hover:text-white text-slate-400 border-2 border-transparent hover:border-rose-500/20 p-5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all group"
                                title="Eliminar tarea"
                            >
                                <Trash2 size={16} className="group-hover:scale-110 transition-transform" />
                                Eliminar Tarea
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaskDetailModal;
