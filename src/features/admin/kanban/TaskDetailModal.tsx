import React, { useState, useEffect } from 'react';
import { X, Calendar, CheckSquare, Tag, AlignLeft, Plus, Trash2 } from 'lucide-react';
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

    // Sync state when task changes (if modal is kept open or reopened)
    useEffect(() => {
        setTitle(task.title);
        setDescription(task.description || '');
        setChecklist(task.checklist || []);
        setTags(task.tags || []);
        setDueDate(task.dueDate?.toDate ? format(task.dueDate.toDate(), 'yyyy-MM-dd') : '');
    }, [task]);

    if (!isOpen) return null;

    // Handlers
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
        // Convert to Firestore Timestamp or proper date object would happen in useKanban or here
        // For simplicity we pass the Date object and useKanban/Firebase handles it
        if (updatedDate) {
            onUpdate(task.id, { dueDate: new Date(updatedDate) as any });
        } else {
            onUpdate(task.id, { dueDate: null as any });
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                {/* Header Image / Cover (Optional, pure aesthetic) */}
                <div className="h-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

                <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-1">
                    {/* Header Controls */}
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex-1 mr-4">
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                onBlur={handleTitleBlur}
                                className="w-full bg-transparent text-2xl md:text-3xl font-bold text-white border-none focus:ring-0 p-0 placeholder-slate-600"
                                placeholder="Título de la tarea"
                            />
                            <div className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                                en la lista <span className="text-indigo-400 font-medium px-2 py-0.5 bg-indigo-500/10 rounded uppercase text-xs">{task.status}</span>
                            </div>
                        </div>
                        <button onClick={onClose} aria-label="Cerrar modal" className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        {/* Main Content (Left Col) */}
                        <div className="md:col-span-3 space-y-8">

                            {/* Tags Section */}
                            <div className="flex flex-wrap gap-2 mb-4">
                                {tags.map(tag => (
                                    <span key={tag} className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full text-xs font-medium border border-blue-500/20 flex items-center gap-1 group">
                                        {tag}
                                        <button onClick={() => removeTag(tag)} aria-label={`Eliminar etiqueta ${tag}`} className="hover:text-white">×</button>
                                    </span>
                                ))}
                                <form onSubmit={addTag} className="relative">
                                    <Tag className="absolute left-2 top-1.5 w-3 h-3 text-slate-500" />
                                    <input
                                        type="text"
                                        value={newTag}
                                        onChange={(e) => setNewTag(e.target.value)}
                                        placeholder="Add tag..."
                                        aria-label="Añadir nueva etiqueta"
                                        className="bg-slate-800/50 border border-slate-700 rounded-full py-1 pl-7 pr-3 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 w-24 focus:w-32 transition-all"
                                    />
                                </form>
                            </div>

                            {/* Description */}
                            <div>
                                <div className="flex items-center gap-3 mb-3 text-slate-300 font-medium">
                                    <AlignLeft size={20} />
                                    <h3>Descripción</h3>
                                </div>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    onBlur={handleDescriptionBlur}
                                    placeholder="Añade una descripción más detallada..."
                                    className="w-full bg-slate-950/30 border border-slate-800 rounded-xl p-4 text-slate-300 text-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 min-h-[120px] resize-y leading-relaxed"
                                />
                            </div>

                            {/* Checklist */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3 text-slate-300 font-medium">
                                        <CheckSquare size={20} />
                                        <h3>Checklist</h3>
                                    </div>
                                    {checklist.length > 0 && (
                                        <span className="text-xs text-slate-500">
                                            {Math.round((checklist.filter(i => i.completed).length / checklist.length) * 100)}% completado
                                        </span>
                                    )}
                                </div>

                                {/* Progress Bar */}
                                {checklist.length > 0 && (
                                    <div className="h-1.5 w-full bg-slate-800 rounded-full mb-4 overflow-hidden">
                                        <div
                                            className="h-full bg-indigo-500 transition-all duration-500"
                                            style={{ width: `${(checklist.filter(i => i.completed).length / checklist.length) * 100}%` }}
                                        />
                                    </div>
                                )}

                                <div className="space-y-2 mb-3">
                                    {checklist.map(item => (
                                        <div key={item.id} className="flex items-start gap-3 group">
                                            <input
                                                type="checkbox"
                                                checked={item.completed}
                                                onChange={() => toggleChecklistItem(item.id)}
                                                aria-label={`Marcar ${item.text} como completado`}
                                                className="mt-1 rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500/20"
                                            />
                                            <span className={`text-sm flex-1 ${item.completed ? 'text-slate-500 line-through' : 'text-slate-300'}`}>
                                                {item.text}
                                            </span>
                                            <button onClick={() => deleteChecklistItem(item.id)} aria-label="Eliminar elemento" className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-rose-500 transition-all">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <form onSubmit={addChecklistItem}>
                                    <div className="flex items-center gap-3">
                                        <Plus className="w-4 h-4 text-slate-500" />
                                        <input
                                            type="text"
                                            value={newChecklistItem}
                                            onChange={(e) => setNewChecklistItem(e.target.value)}
                                            placeholder="Añadir un elemento..."
                                            aria-label="Nuevo elemento de checklist"
                                            className="bg-transparent border-none focus:ring-0 p-0 text-sm text-slate-300 placeholder-slate-600 w-full"
                                        />
                                    </div>
                                </form>
                            </div>
                        </div>

                        {/* Sidebar (Right Col) */}
                        <div className="space-y-6">
                            {/* Date Picker */}
                            <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700/50">
                                <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 text-left">Fecha de Entrega</h4>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                    <input
                                        type="date"
                                        value={dueDate}
                                        onChange={handleDateChange}
                                        aria-label="Fecha de entrega"
                                        className="bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg block w-full pl-10 p-2.5 focus:ring-indigo-500 focus:border-indigo-500 color-scheme-dark"
                                    />
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700/50">
                                <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 text-left">Acciones</h4>
                                <button
                                    onClick={() => {
                                        if (confirm('¿Seguro que deseas eliminar esta tarea?')) {
                                            onDelete(task.id);
                                            onClose();
                                        }
                                    }}
                                    className="w-full flex items-center justify-center gap-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                                >
                                    <Trash2 size={16} />
                                    Eliminar Tarea
                                </button>
                            </div>

                            {/* Metadata */}
                            <div className="text-xs text-slate-600 space-y-2 pt-4 border-t border-slate-800">
                                <p>Creado: {task.createdAt?.toDate ? format(task.createdAt.toDate(), 'dd MMM yyyy, HH:mm', { locale: es }) : 'Reciente'}</p>
                                <p>ID: {task.id.slice(0, 8)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaskDetailModal;
