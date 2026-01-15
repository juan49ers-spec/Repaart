import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useModuleLessons, useCreateLesson, useUpdateLesson, useDeleteLesson } from '../../../hooks/useAcademy';
import { Lesson } from '../../../services/academyService';
import { ArrowLeft, Plus, Save, Trash2, Video, FileText, Link as LinkIcon, PlayCircle } from 'lucide-react';


interface LessonEditorProps {
    moduleId?: string;
    onBack?: () => void;
}

export const LessonEditor = ({ moduleId: propModuleId, onBack }: LessonEditorProps) => {
    const { moduleId: paramModuleId } = useParams<{ moduleId: string }>();
    const navigate = useNavigate();
    const moduleId = propModuleId || paramModuleId;
    const { lessons, loading } = useModuleLessons(moduleId || '');
    const createLesson = useCreateLesson();
    const updateLesson = useUpdateLesson();
    const deleteLesson = useDeleteLesson();

    const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
    const [form, setForm] = useState<Partial<Lesson>>({});
    const [isSaving, setIsSaving] = useState(false);

    // Effect to select first lesson if available and none selected
    useEffect(() => {
        if (!selectedLessonId && lessons.length > 0) {
            // Optional: Auto-select first lesson? 
            // setSelectedLessonId(lessons[0].id!);
        }
    }, [lessons, selectedLessonId]);

    // When selection changes, update form
    useEffect(() => {
        if (selectedLessonId) {
            const lesson = lessons.find(l => l.id === selectedLessonId);
            if (lesson) {
                setForm({ ...lesson });
            }
        } else {
            setForm({});
        }
    }, [selectedLessonId, lessons]);

    const handleCreate = async () => {
        if (!moduleId) return;
        const newOrder = lessons.length > 0 ? Math.max(...lessons.map(l => l.order)) + 1 : 1;
        try {
            const id = await createLesson({
                moduleId,
                title: 'Nueva Lección',
                content: '',
                order: newOrder,
                videoUrl: '',
                resources: []
            });
            setSelectedLessonId(id);
        } catch (e) {
            console.error(e);
        }
    };

    const handleSave = async () => {
        if (!selectedLessonId || !form.title) return;
        setIsSaving(true);
        try {
            await updateLesson(selectedLessonId, {
                title: form.title,
                content: form.content,
                videoUrl: form.videoUrl,
                resources: form.resources,
                order: form.order,
                moduleId: moduleId! // Ensure moduleId is preserved
            });
            // Update local state implicitly handled by snapshot listener
        } catch (e) {
            console.error(e);
            alert('Error al guardar');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('¿Seguro que quieres eliminar esta lección?')) {
            await deleteLesson(id);
            if (selectedLessonId === id) setSelectedLessonId(null);
        }
    };

    const addResource = () => {
        const current = form.resources || [];
        setForm({
            ...form,
            resources: [...current, { title: '', url: '', type: 'link' }]
        });
    };

    const updateResource = (index: number, field: string, value: string) => {
        const current = [...(form.resources || [])];
        current[index] = { ...current[index], [field]: value };
        setForm({ ...form, resources: current });
    };

    const removeResource = (index: number) => {
        const current = [...(form.resources || [])];
        current.splice(index, 1);
        setForm({ ...form, resources: current });
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Cargando editor...</div>;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col md:flex-row">
            {/* Sidebar List */}
            <div className="w-full md:w-80 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 h-screen overflow-y-auto flex flex-col">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-800 z-10">
                    <button
                        onClick={() => onBack ? onBack() : navigate('/admin/academy')}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500"
                        title="Volver a módulos"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h2 className="font-bold text-slate-800 dark:text-white">Lecciones</h2>
                    <button
                        onClick={handleCreate}
                        className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                        title="Crear nueva lección"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
                <div className="flex-1 p-2 space-y-2">
                    {lessons.sort((a, b) => a.order - b.order).map(lesson => (
                        <div
                            key={lesson.id}
                            onClick={() => setSelectedLessonId(lesson.id || null)}
                            className={`p-3 rounded-xl cursor-pointer transition border ${selectedLessonId === lesson.id
                                ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800'
                                : 'bg-white dark:bg-slate-800 border-transparent hover:bg-slate-50 dark:hover:bg-slate-700'
                                }`}
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="text-[10px] uppercase font-bold text-slate-400">Lección {lesson.order}</span>
                                    <h3 className={`text-sm font-bold ${selectedLessonId === lesson.id ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-300'}`}>
                                        {lesson.title}
                                    </h3>
                                </div>
                                {selectedLessonId === lesson.id && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDelete(lesson.id!); }}
                                        className="text-red-400 hover:text-red-600 p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
                                        title="Eliminar lección"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                    {lessons.length === 0 && (
                        <p className="text-center text-slate-400 text-sm py-10">No hay lecciones. Crea una para empezar.</p>
                    )}
                </div>
            </div>

            {/* Editor Area */}
            <div className="flex-1 overflow-y-auto h-screen p-6 md:p-10">
                {selectedLessonId ? (
                    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
                        {/* Header Inputs */}
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                            <div className="flex justify-between items-center">
                                <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                                    <FileText className="w-6 h-6 text-indigo-500" />
                                    Editar Contenido
                                </h1>
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="flex items-center gap-2 px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/30 transition disabled:opacity-50"
                                >
                                    <Save className="w-4 h-4" />
                                    {isSaving ? 'Guardando...' : 'Guardar Lección'}
                                </button>
                            </div>

                            <div className="grid md:grid-cols-3 gap-4">
                                <div className="md:col-span-2">
                                    <label htmlFor="lesson-title" className="block text-xs font-bold text-slate-500 uppercase mb-1">Título de la Lección</label>
                                    <input
                                        id="lesson-title"
                                        type="text"
                                        value={form.title || ''}
                                        onChange={e => setForm({ ...form, title: e.target.value })}
                                        className="w-full text-lg font-bold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="lesson-order" className="block text-xs font-bold text-slate-500 uppercase mb-1">Orden</label>
                                    <input
                                        id="lesson-order"
                                        type="number"
                                        value={form.order || 0}
                                        onChange={e => setForm({ ...form, order: parseInt(e.target.value) })}
                                        className="w-full text-lg font-bold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Video Section */}
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                <Video className="w-4 h-4" /> Contenido Audiovisual
                            </h3>
                            <div>
                                <label htmlFor="video-url" className="block text-xs font-medium text-slate-400 mb-1">URL del Vídeo (YouTube / Vimeo / Directo)</label>
                                <input
                                    id="video-url"
                                    type="text"
                                    value={form.videoUrl || ''}
                                    onChange={e => setForm({ ...form, videoUrl: e.target.value })}
                                    placeholder="https://youtube.com/watch?v=..."
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            {form.videoUrl && (
                                <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-lg mt-4 flex items-center justify-center relative group">
                                    <div className="text-white text-center">
                                        <PlayCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                        <p className="text-sm font-medium opacity-75">Vista previa del vídeo detectado</p>
                                    </div>
                                    <iframe
                                        src={form.videoUrl.replace('watch?v=', 'embed/')}
                                        className="absolute inset-0 w-full h-full"
                                        title="Preview"
                                        allowFullScreen
                                    />
                                </div>
                            )}
                        </div>

                        {/* Content Editor */}
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4 h-[500px] flex flex-col">
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                <FileText className="w-4 h-4" /> Contenido de la Lección (Markdown)
                            </h3>
                            <textarea
                                value={form.content || ''}
                                onChange={e => setForm({ ...form, content: e.target.value })}
                                className="flex-1 w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 font-mono text-sm leading-relaxed focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                                placeholder="# Escribe aquí el contenido..."
                            />
                        </div>

                        {/* Resources Section */}
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                    <LinkIcon className="w-4 h-4" /> Recursos Descargables
                                </h3>
                                <button
                                    onClick={addResource}
                                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 px-3 py-1 bg-indigo-50 rounded-lg"
                                    title="Añadir nuevo recurso"
                                >
                                    + Añadir Recurso
                                </button>
                            </div>

                            <div className="space-y-3">
                                {(form.resources || []).map((res, idx) => (
                                    <div key={idx} className="flex gap-2 items-center bg-slate-50 dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                                        <select
                                            value={res.type}
                                            onChange={e => updateResource(idx, 'type', e.target.value)}
                                            className="bg-white dark:bg-slate-800 border border-slate-200 rounded-md text-xs px-2 py-1"
                                            title="Tipo de recurso"
                                        >
                                            <option value="link">Enlace</option>
                                            <option value="pdf">PDF</option>
                                        </select>
                                        <input
                                            type="text"
                                            value={res.title}
                                            onChange={e => updateResource(idx, 'title', e.target.value)}
                                            placeholder="Título del recurso"
                                            className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 rounded-md text-sm px-2 py-1"
                                            aria-label="Título del recurso"
                                        />
                                        <input
                                            type="text"
                                            value={res.url}
                                            onChange={e => updateResource(idx, 'url', e.target.value)}
                                            placeholder="URL (https://...)"
                                            className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 rounded-md text-sm px-2 py-1 font-mono"
                                            aria-label="URL del recurso"
                                        />
                                        <button
                                            onClick={() => removeResource(idx)}
                                            className="text-red-400 hover:text-red-500"
                                            title="Eliminar recurso"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                                {(form.resources?.length === 0) && (
                                    <p className="text-sm text-slate-400 italic text-center py-4">No hay recursos adjuntos.</p>
                                )}
                            </div>
                        </div>

                    </div>
                ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 flex-col gap-4">
                        <FileText className="w-16 h-16 opacity-20" />
                        <p className="font-medium">Selecciona una lección para editar o crea una nueva.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
