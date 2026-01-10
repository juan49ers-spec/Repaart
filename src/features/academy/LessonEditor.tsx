import React, { useState } from 'react';
import { ArrowLeft, Plus, Edit2, Trash2, Save, X, Eye, Code, GripVertical, Check } from 'lucide-react';
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
            // alert('✅ Lección creada con éxito'); // Replace with better feedback if possible, but keep simple for now
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
            // alert('✅ Lección actualizada');
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
            // alert('✅ Lección eliminada');
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
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-bold mb-4 transition"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Volver a módulos
                    </button>
                    <h1 className="text-3xl font-black text-slate-900">
                        Gestión de Lecciones
                    </h1>
                    <p className="text-slate-500 mt-1 flex items-center gap-2">
                        Módulo: <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">{module.title}</span>
                    </p>
                </div>
                {!isCreating && !editingLesson && (
                    <button
                        onClick={() => setIsCreating(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-600/20 transition active:scale-[0.98]"
                    >
                        <Plus className="w-5 h-5" />
                        Nueva Lección
                    </button>
                )}
            </div>

            {/* Create/Edit Lesson Form */}
            {(isCreating || editingLesson) && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xl shadow-slate-200/50 animate-fade-in-down">
                    <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
                        <div className="flex items-center gap-3">
                            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                {editingLesson ? <Edit2 className="w-5 h-5 text-indigo-500" /> : <Plus className="w-5 h-5 text-indigo-500" />}
                                {editingLesson ? 'Editar Lección' : 'Crear Nueva Lección'}
                            </h3>
                            <div className="h-6 w-px bg-slate-300 mx-2" />
                            <div className="flex bg-slate-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setShowPreview(false)}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition ${!showPreview
                                        ? 'bg-white text-indigo-600 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    <Code className="w-3 h-3" />
                                    Editor
                                </button>
                                <button
                                    onClick={() => setShowPreview(true)}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition ${showPreview
                                        ? 'bg-white text-indigo-600 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    <Eye className="w-3 h-3" />
                                    Preview
                                </button>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                setIsCreating(false);
                                setEditingLesson(null);
                                setShowPreview(false);
                            }}
                            aria-label="Cerrar formulario"
                            className="p-2 hover:bg-slate-100 rounded-lg transition text-slate-400 hover:text-slate-600"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {!showPreview ? (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
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
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium bg-slate-50 focus:bg-white transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    Contenido (Markdown) *
                                </label>

                                {/* Toolbar */}
                                <div className="flex flex-wrap gap-2 mb-2 p-2 bg-slate-50 border border-slate-200 rounded-lg">
                                    <button
                                        onClick={() => {
                                            const content = editingLesson ? editingLesson.content : formData.content;
                                            const update = (val: string) => editingLesson ? setEditingLesson({ ...editingLesson, content: val }) : setFormData({ ...formData, content: val });
                                            update(content + '\n\n**Negrita**');
                                        }}
                                        className="px-2 py-1 bg-white border border-slate-200 rounded hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-sm"
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
                                        className="px-2 py-1 bg-white border border-slate-200 rounded hover:bg-slate-50 text-xs italic font-bold text-slate-700 shadow-sm"
                                        title="Cursiva"
                                    >
                                        I
                                    </button>
                                    <div className="w-px bg-slate-300 mx-2" />
                                    <span className="text-xs font-bold text-slate-500 self-center uppercase tracking-wider">Widgets:</span>

                                    <button
                                        onClick={() => {
                                            const content = editingLesson ? editingLesson.content : formData.content;
                                            const update = (val: string) => editingLesson ? setEditingLesson({ ...editingLesson, content: val }) : setFormData({ ...formData, content: val });
                                            update(content + '\n\n{{WIDGET:CALCULATOR_PROFITABILITY}}\n\n');
                                        }}
                                        className="px-2 py-1 bg-indigo-50 border border-indigo-200 text-indigo-600 rounded hover:bg-indigo-100 text-xs font-bold shadow-sm"
                                    >
                                        + Rentab.
                                    </button>
                                    <button
                                        onClick={() => {
                                            const content = editingLesson ? editingLesson.content : formData.content;
                                            const update = (val: string) => editingLesson ? setEditingLesson({ ...editingLesson, content: val }) : setFormData({ ...formData, content: val });
                                            update(content + '\n\n{{WIDGET:CALCULATOR_ROI}}\n\n');
                                        }}
                                        className="px-2 py-1 bg-purple-50 border border-purple-200 text-purple-600 rounded hover:bg-purple-100 text-xs font-bold shadow-sm"
                                    >
                                        + ROI
                                    </button>
                                    <button
                                        onClick={() => {
                                            const content = editingLesson ? editingLesson.content : formData.content;
                                            const update = (val: string) => editingLesson ? setEditingLesson({ ...editingLesson, content: val }) : setFormData({ ...formData, content: val });
                                            update(content + '\n\n{{WIDGET:CALCULATOR_TAXES}}\n\n');
                                        }}
                                        className="px-2 py-1 bg-orange-50 border border-orange-200 text-orange-600 rounded hover:bg-orange-100 text-xs font-bold shadow-sm"
                                    >
                                        + Impuestos
                                    </button>
                                    <div className="w-px bg-slate-300 mx-2" />
                                    <button
                                        onClick={() => {
                                            const url = prompt("URL del video (Embed):");
                                            if (!url) return;
                                            const content = editingLesson ? editingLesson.content : formData.content;
                                            const update = (val: string) => editingLesson ? setEditingLesson({ ...editingLesson, content: val }) : setFormData({ ...formData, content: val });
                                            update(content + `\n\n{{VIDEO:${url}}}\n\n`);
                                        }}
                                        className="px-2 py-1 bg-rose-50 border border-rose-200 text-rose-600 rounded hover:bg-rose-100 text-xs font-bold shadow-sm"
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
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm resize-none bg-slate-50 focus:bg-white transition-colors"
                                />
                                <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                                    <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-bold">MD</span>
                                    Soporta Markdown: **negrita**, *cursiva*, listas, tablas, código, etc.
                                </p>
                            </div>

                            <div className="flex gap-3 pt-2 border-t border-slate-100">
                                <button
                                    onClick={() => editingLesson ? handleUpdate(editingLesson.id) : handleCreate()}
                                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-bold shadow-lg shadow-emerald-600/20 transition active:scale-[0.98]"
                                >
                                    <Save className="w-5 h-5" />
                                    {editingLesson ? 'Guardar Cambios' : 'Crear Lección'}
                                </button>
                                <button
                                    onClick={() => {
                                        setIsCreating(false);
                                        setEditingLesson(null);
                                    }}
                                    className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 font-bold transition"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 max-h-[600px] overflow-y-auto">
                            <h4 className="text-xs font-bold text-slate-500 mb-4 uppercase tracking-wider flex items-center gap-2">
                                <Eye className="w-4 h-4" />
                                Vista Previa del Contenido
                            </h4>
                            <div className="prose prose-slate prose-lg max-w-none bg-white p-8 rounded-xl shadow-sm border border-slate-100">
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
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-sm">
                        {lessons.length}
                    </span>
                    Lecciones del Módulo
                </h3>

                {lessons.map((lesson, index) => (
                    <div
                        key={lesson.id}
                        className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-xl hover:shadow-slate-200/50 transition-all hover:border-indigo-200 group"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <GripVertical className="w-5 h-5 text-slate-400 cursor-grab active:cursor-grabbing" />
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded">
                                        Lección {lesson.order || index + 1}
                                    </span>
                                </div>
                                <h3 className="text-xl font-black text-slate-900 mb-2 group-hover:text-indigo-900 transition-colors">
                                    {lesson.title}
                                </h3>
                                <p className="text-sm text-slate-600 line-clamp-2">
                                    {lesson.content ? lesson.content.substring(0, 150) + '...' : 'Sin contenido'}
                                </p>
                                <div className="mt-3 text-xs text-slate-400 font-medium">
                                    {lesson.content ? lesson.content.length : 0} caracteres
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => setEditingLesson(lesson)}
                                    className="p-2 hover:bg-indigo-50 text-indigo-600 rounded-lg transition border border-transparent hover:border-indigo-100"
                                    title="Editar lección"
                                    aria-label={`Editar lección ${lesson.title}`}
                                >
                                    <Edit2 className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => handleDelete(lesson.id, lesson.title)}
                                    className="p-2 hover:bg-rose-50 text-rose-600 rounded-lg transition border border-transparent hover:border-rose-100"
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
                <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 border-dashed">
                    <div className="text-6xl mb-4 opacity-50">📝</div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">
                        No hay lecciones en este módulo
                    </h3>
                    <p className="text-slate-500 mb-6">
                        Crea tu primera lección para empezar a construir el contenido
                    </p>
                    <button
                        onClick={() => setIsCreating(true)}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-600/20 transition active:scale-[0.98]"
                    >
                        <Plus className="w-5 h-5" />
                        Crear Primera Lección
                    </button>
                </div>
            )}
        </div>
    );
};

export default LessonEditor;
