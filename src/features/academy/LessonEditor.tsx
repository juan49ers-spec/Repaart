import React, { useState } from 'react';
import { ArrowLeft, Plus, Edit2, Trash2, Save, X, Eye, Code, GripVertical } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useModuleLessons, useCreateLesson, useUpdateLesson, useDeleteLesson, Lesson, AcademyModule } from '../../hooks/useAcademy';

interface LessonEditorProps {
    module: AcademyModule;
    onBack: () => void;
}

interface LessonFormData {
    title: string;
    content: string;
    order: number;
    resources: any[];
}

/**
 * Lesson Editor - CRUD completo de lecciones para un módulo
 * Design: Executive Glass
 */
const LessonEditor: React.FC<LessonEditorProps> = ({ module, onBack }) => {
    const { lessons, loading } = useModuleLessons(module.id);
    const createLesson = useCreateLesson();
    const updateLesson = useUpdateLesson();
    const deleteLesson = useDeleteLesson();

    const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [formData, setFormData] = useState<LessonFormData>({
        title: '',
        content: '',
        order: lessons.length + 1,
        resources: []
    });

    const handleCreate = async () => {
        if (!formData.title.trim() || !formData.content.trim()) {
            alert('El título y el contenido son obligatorios');
            return;
        }

        try {
            await createLesson({
                moduleId: module.id,
                ...formData,
                order: lessons.length + 1
            });

            setFormData({ title: '', content: '', order: lessons.length + 2, resources: [] });
            setIsCreating(false);
        } catch (error) {
            console.error('Error creating lesson:', error);
            alert('Error al crear la lección');
        }
    };

    const handleUpdate = async (lessonId: string) => {
        if (!editingLesson) return;
        try {
            await updateLesson(lessonId, editingLesson);
            setEditingLesson(null);
        } catch (error) {
            console.error('Error updating lesson:', error);
            alert('Error al actualizar la lección');
        }
    };

    const handleDelete = async (lessonId: string, lessonTitle: string) => {
        if (!confirm(`¿Seguro que quieres eliminar "${lessonTitle}" ? `)) {
            return;
        }

        try {
            await deleteLesson(lessonId);
        } catch (error) {
            console.error('Error deleting lesson:', error);
            alert('Error al eliminar la lección');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4" />
                    <p className="text-slate-500 font-medium">Cargando lecciones...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 relative overflow-hidden p-8 max-w-7xl mx-auto space-y-8">
            {/* Atmospheric Backgrounds */}
            <div className="absolute top-[-5%] right-[-5%] w-[35%] h-[35%] bg-indigo-500/5 rounded-full blur-[100px] animate-pulse" />

            <div className="relative z-10 space-y-8 animate-in fade-in duration-1000">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <button
                            onClick={onBack}
                            className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium mb-4 transition-all group"
                        >
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            <span className="text-[13px]">Volver a la arquitectura</span>
                        </button>
                        <h1 className="text-3xl font-medium text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                            Gestión de Lecciones
                        </h1>
                        <div className="mt-2 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                            Módulo: <span className="font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-500/5 px-3 py-1 rounded-full border border-indigo-500/10">{module.title}</span>
                        </div>
                    </div>
                    {!isCreating && !editingLesson && (
                        <button
                            onClick={() => setIsCreating(true)}
                            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-[1.2rem] hover:bg-indigo-700 font-medium shadow-xl shadow-indigo-600/20 transition-all active:scale-[0.98] text-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Nueva Lección
                        </button>
                    )}
                </div>

                {/* Create/Edit Lesson Form - Deep Glass */}
                {(isCreating || editingLesson) && (
                    <div className="bg-white/70 dark:bg-slate-900/40 backdrop-blur-2xl rounded-[2.5rem] border border-slate-200/40 dark:border-slate-800/40 p-8 shadow-2xl shadow-indigo-500/[0.05] animate-in fade-in slide-in-from-top-8 duration-700 overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/[0.03] rounded-full blur-3xl -mr-32 -mt-32" />

                        <div className="relative z-10 flex items-center justify-between mb-8 pb-6 border-b border-slate-200/40 dark:border-slate-800/40">
                            <div className="flex items-center gap-6">
                                <h3 className="text-xl font-medium text-slate-900 dark:text-white flex items-center gap-3">
                                    <div className="p-2 bg-indigo-500/10 rounded-xl">
                                        {editingLesson ? <Edit2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> : <Plus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
                                    </div>
                                    {editingLesson ? 'Editar Lección' : 'Crear Nueva Lección'}
                                </h3>
                                <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />
                                <div className="flex bg-slate-100/50 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200/40 dark:border-slate-700/40">
                                    <button
                                        onClick={() => setShowPreview(false)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-medium uppercase tracking-wider transition-all ${!showPreview
                                            ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                            }`}
                                    >
                                        <Code className="w-3.5 h-3.5" />
                                        Diseño
                                    </button>
                                    <button
                                        onClick={() => setShowPreview(true)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-medium uppercase tracking-wider transition-all ${showPreview
                                            ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                            }`}
                                    >
                                        <Eye className="w-3.5 h-3.5" />
                                        Vista Previa
                                    </button>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setIsCreating(false);
                                    setEditingLesson(null);
                                    setShowPreview(false);
                                }}
                                className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                title="Cerrar editor"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {!showPreview ? (
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Título de la Lección *
                                    </label>
                                    <input
                                        type="text"
                                        value={editingLesson ? editingLesson.title : formData.title}
                                        onChange={(e) => editingLesson
                                            ? setEditingLesson({ ...editingLesson, title: e.target.value })
                                            : setFormData({ ...formData, title: e.target.value })
                                        }
                                        placeholder="Ej: Introducción al Modelo de Negocio"
                                        className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 transition-colors"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Contenido (Markdown) *
                                    </label>

                                    {/* Toolbar */}
                                    <div className="flex flex-wrap gap-2 mb-2 p-2 bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-lg">
                                        <button
                                            onClick={() => {
                                                const content = editingLesson ? editingLesson.content : formData.content;
                                                const update = (val: string) => editingLesson ? setEditingLesson({ ...editingLesson, content: val }) : setFormData({ ...formData, content: val });
                                                update(content + '\n\n**Negrita**');
                                            }}
                                            className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 shadow-sm"
                                            title="Negrita"
                                        >
                                            B
                                        </button>
                                        <button
                                            onClick={() => {
                                                const content = editingLesson ? editingLesson.content : formData.content;
                                                const update = (val: string) => editingLesson ? setEditingLesson({ ...editingLesson, content: val }) : setFormData({ ...formData, content: val });
                                                update(content + '\n\n*Cursiva*');
                                            }}
                                            className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-50 dark:hover:bg-slate-700 text-xs italic font-bold text-slate-700 dark:text-slate-300 shadow-sm"
                                            title="Cursiva"
                                        >
                                            I
                                        </button>
                                        <div className="w-px bg-slate-300 dark:bg-slate-700 mx-2" />
                                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 self-center uppercase tracking-wider">Widgets:</span>

                                        <button
                                            onClick={() => {
                                                const content = editingLesson ? editingLesson.content : formData.content;
                                                const update = (val: string) => editingLesson ? setEditingLesson({ ...editingLesson, content: val }) : setFormData({ ...formData, content: val });
                                                update(content + '\n\n{{WIDGET:CALCULATOR_PROFITABILITY}}\n\n');
                                            }}
                                            className="px-2 py-1 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 rounded hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-xs font-bold shadow-sm"
                                        >
                                            + Rentab.
                                        </button>
                                        <button
                                            onClick={() => {
                                                const content = editingLesson ? editingLesson.content : formData.content;
                                                const update = (val: string) => editingLesson ? setEditingLesson({ ...editingLesson, content: val }) : setFormData({ ...formData, content: val });
                                                update(content + '\n\n{{WIDGET:CALCULATOR_ROI}}\n\n');
                                            }}
                                            className="px-2 py-1 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400 rounded hover:bg-purple-100 dark:hover:bg-purple-900/40 text-xs font-bold shadow-sm"
                                        >
                                            + ROI
                                        </button>
                                        <button
                                            onClick={() => {
                                                const content = editingLesson ? editingLesson.content : formData.content;
                                                const update = (val: string) => editingLesson ? setEditingLesson({ ...editingLesson, content: val }) : setFormData({ ...formData, content: val });
                                                update(content + '\n\n{{WIDGET:CALCULATOR_TAXES}}\n\n');
                                            }}
                                            className="px-2 py-1 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400 rounded hover:bg-orange-100 dark:hover:bg-orange-900/40 text-xs font-bold shadow-sm"
                                        >
                                            + Impuestos
                                        </button>
                                        <div className="w-px bg-slate-300 dark:bg-slate-700 mx-2" />
                                        <button
                                            onClick={() => {
                                                const url = prompt("URL del video (Embed):");
                                                if (!url) return;
                                                const content = editingLesson ? editingLesson.content : formData.content;
                                                const update = (val: string) => editingLesson ? setEditingLesson({ ...editingLesson, content: val }) : setFormData({ ...formData, content: val });
                                                update(content + `\n\n{{VIDEO:${url}}}\n\n`);
                                            }}
                                            className="px-2 py-1 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 rounded hover:bg-rose-100 dark:hover:bg-rose-900/40 text-xs font-bold shadow-sm"
                                        >
                                            + Video
                                        </button>
                                    </div>

                                    <textarea
                                        value={editingLesson ? editingLesson.content : formData.content}
                                        onChange={(e) => editingLesson
                                            ? setEditingLesson({ ...editingLesson, content: e.target.value })
                                            : setFormData({ ...formData, content: e.target.value })
                                        }
                                        placeholder="# Título Principal&#10;&#10;## Subtítulo&#10;&#10;Escribe tu contenido aquí usando Markdown..."
                                        rows={15}
                                        className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm resize-none bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 transition-colors"
                                    />
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1">
                                        <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300 font-semibold">MD</span>
                                        Soporta Markdown: **negrita**, *cursiva*, listas, tablas, código, etc.
                                    </p>
                                </div>

                                <div className="flex gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                                    <button
                                        onClick={() => editingLesson ? handleUpdate(editingLesson.id) : handleCreate()}
                                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-medium shadow-lg shadow-emerald-600/20 transition active:scale-[0.98]"
                                    >
                                        <Save className="w-5 h-5" />
                                        {editingLesson ? 'Guardar Cambios' : 'Crear Lección'}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsCreating(false);
                                            setEditingLesson(null);
                                        }}
                                        className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 font-medium transition"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-slate-50 dark:bg-slate-900/30 rounded-xl p-6 border border-slate-200 dark:border-slate-800 max-h-[600px] overflow-y-auto">
                                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-4 uppercase tracking-wider flex items-center gap-2">
                                    <Eye className="w-4 h-4" />
                                    Vista Previa del Contenido
                                </h4>
                                <div className="prose prose-slate dark:prose-invert prose-lg max-w-none bg-white dark:bg-slate-900 p-8 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
                                    <ReactMarkdown>
                                        {editingLesson ? editingLesson.content : formData.content}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Lessons List */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                        <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-2 py-0.5 rounded text-sm">
                            {lessons.length}
                        </span>
                        Lecciones del Módulo
                    </h3>

                    {lessons.map((lesson, index) => (
                        <div
                            key={lesson.id}
                            className="bg-white dark:bg-slate-900/30 backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-slate-800 p-6 hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-indigo-500/5 transition-all hover:border-indigo-200 dark:hover:border-indigo-500/30 group"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <GripVertical className="w-5 h-5 text-slate-400 cursor-grab active:cursor-grabbing" />
                                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                                            Lección {lesson.order || index + 1}
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2 group-hover:text-indigo-900 dark:group-hover:text-indigo-100 transition-colors">
                                        {lesson.title}
                                    </h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                                        {lesson.content ? lesson.content.substring(0, 150) + '...' : 'Sin contenido'}
                                    </p>
                                    <div className="mt-3 text-xs text-slate-400 font-medium">
                                        {lesson.content ? lesson.content.length : 0} caracteres
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setEditingLesson(lesson)}
                                        className="p-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg transition border border-transparent hover:border-indigo-100 dark:hover:border-indigo-500/30"
                                        title="Editar lección"
                                        aria-label={`Editar lección ${lesson.title}`}
                                    >
                                        <Edit2 className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(lesson.id, lesson.title)}
                                        className="p-2 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-lg transition border border-transparent hover:border-rose-100 dark:hover:border-rose-500/30"
                                        title="Eliminar lección"
                                        aria-label={`Eliminar lección ${lesson.title}`}
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Empty State */}
                {lessons.length === 0 && !isCreating && (
                    <div className="text-center py-20 bg-white dark:bg-slate-900/30 rounded-3xl border border-slate-200 dark:border-slate-800 border-dashed">
                        <div className="text-6xl mb-4 opacity-50">📝</div>
                        <h3 className="text-xl font-medium text-slate-800 dark:text-white mb-2">
                            No hay lecciones en este módulo
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 mb-6">
                            Crea tu primera lección para empezar a construir el contenido
                        </p>
                        <button
                            onClick={() => setIsCreating(true)}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium shadow-lg shadow-indigo-600/20 transition active:scale-[0.98]"
                        >
                            <Plus className="w-5 h-5" />
                            Crear Primera Lección
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LessonEditor;
