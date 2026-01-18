import { useState, useEffect } from 'react';
import { Plus, Trash2, Save, GripVertical, FileText, Layout, Eye, ArrowLeft } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useCreateLesson, useUpdateLesson, useDeleteLesson, useModuleLessons, Lesson } from '../../../hooks/useAcademy';
import { EditorToolbar } from './EditorToolbar';
import { VideoManager, ChapterMarker } from './VideoManager';
import toast from 'react-hot-toast';

interface LessonEditorProps {
    moduleId: string;
    onBack: () => void;
}

export default function LessonEditor({ moduleId, onBack }: LessonEditorProps) {
    const { lessons, loading } = useModuleLessons(moduleId);
    const createLesson = useCreateLesson();
    const updateLesson = useUpdateLesson();
    const deleteLesson = useDeleteLesson();

    const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'editor' | 'preview' | 'split'>('split');

    // Form States
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [videoUrl, setVideoUrl] = useState('');
    const [customThumbnail, setCustomThumbnail] = useState('');
    const [duration, setDuration] = useState(0);
    const [chapters, setChapters] = useState<ChapterMarker[]>([]);
    const [order, setOrder] = useState(0);
    const [resources, setResources] = useState<{ title: string; url: string; type: 'pdf' | 'link' }[]>([]);

    const [isSidebarOpen, setSidebarOpen] = useState(true);

    const handleSelectLesson = (lesson: Lesson) => {
        setSelectedLessonId(lesson.id || null);
        setTitle(lesson.title);
        setContent(lesson.content || '');
        setVideoUrl(lesson.videoUrl || '');
        setCustomThumbnail(lesson.customThumbnail || '');
        setDuration(lesson.duration || 0);
        setChapters(lesson.chapters || []);
        setOrder(lesson.order || 0);
        setResources(lesson.resources || []);
    };

    useEffect(() => {
        if (lessons.length > 0 && !selectedLessonId) {
            // eslint-disable-next-line
            handleSelectLesson(lessons[0]);
        }
    }, [lessons, selectedLessonId]);

    const handleCreateNew = () => {
        setSelectedLessonId(null);
        setTitle('Nueva Lección');
        setContent('');
        setVideoUrl('');
        setCustomThumbnail('');
        setDuration(0);
        setChapters([]);
        setOrder(lessons.length + 1);
        setResources([]);
    };

    const handleSave = async () => {
        const lessonData = {
            title,
            content,
            videoUrl,
            customThumbnail,
            duration,
            chapters,
            order: Number(order),
            moduleId,
            resources,
            isPublished: true
        };

        try {
            if (selectedLessonId) {
                await updateLesson(selectedLessonId, lessonData);
                toast.success('Lección guardada', { icon: '💾', style: { borderRadius: '10px', background: '#333', color: '#fff' } });
            } else {
                await createLesson(lessonData);
                toast.success('Lección creada');
                handleCreateNew();
            }
        } catch (error) {
            console.error('Error saving lesson:', error);
            toast.error('Error al guardar');
        }
    };

    const handleDelete = async (lessonId: string) => {
        if (confirm('¿Estás seguro de eliminar esta lección?')) {
            await deleteLesson(lessonId);
            toast.success('Lección eliminada');
            handleCreateNew();
        }
    };

    const insertText = (text: string) => {
        setContent(prev => prev + text);
    };

    // Helper to render content preview (Matching ModuleViewer styles)
    const renderPreview = (markdown: string) => {
        // Simple shim to show widgets in preview
        const processed = markdown
            .replace(/{{ WIDGET: ([^}]+)}}/g, '___[ WIDGET: $1 ]___')
            .replace(/{{ VIDEO: ([^}]+)}}/g, '___[ VIDEO: $1 ]___')
            .replace(/{{ CASE: ([^}]+)}}/g, '___[ CASE STUDY: $1 ]___');

        return (
            <div className="prose prose-lg prose-slate max-w-none font-serif leading-8 selection:bg-indigo-100 selection:text-indigo-900">
                <ReactMarkdown
                    components={{
                        h1: ({ ...props }) => <h1 className="text-4xl font-sans font-black text-slate-900 mb-8 mt-4 tracking-tight" {...props} />,
                        h2: ({ ...props }) => <h2 className="text-2xl font-sans font-bold text-slate-900 mb-4 mt-8 tracking-tight border-b border-indigo-100 pb-2" {...props} />,
                        h3: ({ ...props }) => <h3 className="text-xl font-sans font-bold text-slate-900 mb-4 mt-6 text-indigo-900" {...props} />,
                        p: ({ ...props }) => <p className="mb-6 text-xl text-slate-600 leading-relaxed font-serif" {...props} />,
                        ul: ({ ...props }) => <ul className="list-disc pl-6 mb-8 space-y-3 marker:text-indigo-500 text-lg" {...props} />,
                        ol: ({ ...props }) => <ol className="list-decimal pl-6 mb-8 space-y-3 marker:text-indigo-500 font-bold text-lg" {...props} />,
                        blockquote: ({ ...props }) => (
                            <blockquote className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50 to-white pl-8 py-6 my-10 rounded-r-2xl italic text-slate-700 font-serif text-2xl shadow-sm" {...props} />
                        ),
                        code: ({ inline, ...props }: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & { inline?: boolean }) =>
                            inline
                                ? <code className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-mono text-base font-bold border border-indigo-100/50" {...props} />
                                : <code className="block bg-slate-900 text-slate-50 p-6 rounded-2xl font-mono text-sm overflow-x-auto my-10 shadow-2xl shadow-indigo-900/10 border border-slate-700 leading-relaxed" {...props} />,
                    }}
                >
                    {processed}
                </ReactMarkdown>
            </div>
        );
    };

    return (
        <div className="flex h-[calc(100vh-100px)] bg-slate-50 -m-6 rounded-b-xl overflow-hidden font-sans">
            {/* Sidebar List - Colapsable */}
            <div className={`bg-white border-r border-slate-200 flex flex-col transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-80' : 'w-0 overflow-hidden'}`}>
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 backdrop-blur-sm">
                    <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Lecciones</h3>
                    <div className="flex gap-2">
                        <button
                            onClick={handleCreateNew}
                            className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-sm"
                            title="Nueva Lección"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {loading ? (
                        <div className="p-4 text-center text-slate-400 text-sm animate-pulse">Cargando...</div>
                    ) : lessons.map((lesson) => (
                        <div
                            key={lesson.id}
                            onClick={() => handleSelectLesson(lesson)}
                            className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border relative overflow-hidden
                                ${selectedLessonId === lesson.id
                                    ? 'bg-indigo-50 border-indigo-200 shadow-sm ring-1 ring-indigo-200'
                                    : 'bg-white hover:bg-slate-50 border-transparent hover:border-slate-200'
                                }
                            `}
                        >
                            {selectedLessonId === lesson.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500" />}
                            <div className="flex items-center gap-3 overflow-hidden">
                                <span className={`flex items-center justify-center w-6 h-6 rounded-lg text-xs font-bold transition-colors
                                    ${selectedLessonId === lesson.id ? 'bg-indigo-200 text-indigo-700' : 'bg-slate-100 text-slate-500'}
                                `}>
                                    {lesson.order}
                                </span>
                                <span className={`text-sm truncate font-medium transition-colors
                                    ${selectedLessonId === lesson.id ? 'text-indigo-900' : 'text-slate-600'}
                                `}>
                                    {lesson.title}
                                </span>
                            </div>
                            <GripVertical className="opacity-0 group-hover:opacity-100 w-4 h-4 text-slate-400 cursor-grab transform active:scale-110" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Toggle Sidebar Button (Vertical Strip when closed) */}
            {!isSidebarOpen && (
                <button
                    onClick={() => setSidebarOpen(true)}
                    className="w-12 border-r border-slate-200 bg-white flex flex-col items-center py-4 hover:bg-slate-50 transition text-slate-400 hover:text-indigo-600"
                    title="Mostrar menú"
                >
                    <Layout className="w-5 h-5" />
                </button>
            )}


            {/* Main Editor Area */}
            <div className="flex-1 flex flex-col bg-slate-50 relative">

                {/* Editor Header */}
                <div className="h-16 bg-white/90 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-6 shadow-sm z-20 sticky top-0">
                    <div className="flex items-center gap-4 flex-1">
                        <button
                            onClick={onBack}
                            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-all"
                            title="Volver"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>

                        {isSidebarOpen && (
                            <button onClick={() => setSidebarOpen(false)} className="p-2 text-slate-400 hover:text-indigo-600 transition -ml-2" title="Ocultar menú">
                                <Layout className="w-5 h-5 rotate-180" />
                            </button>
                        )}
                        <div className="w-16">
                            <label className="text-[10px] uppercase font-bold text-slate-400 mb-0.5 block">Orden</label>
                            <input
                                type="number"
                                value={order}
                                onChange={(e) => setOrder(Number(e.target.value))}
                                className="w-full bg-slate-100 border-none rounded px-2 py-1 text-sm font-bold text-center focus:ring-2 focus:ring-indigo-500 outline-none hover:bg-indigo-50 transition"
                            />
                        </div>
                        <div className="flex-1 max-w-lg">
                            <label className="text-[10px] uppercase font-bold text-slate-400 mb-0.5 block">Título</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Escribe un título..."
                                className="w-full bg-slate-100 border-none rounded px-3 py-1 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none hover:bg-indigo-50 transition"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex bg-slate-100 p-1 rounded-lg mr-4 ring-1 ring-slate-200">
                            <button
                                onClick={() => setViewMode('editor')}
                                className={`p-1.5 rounded-md transition ${viewMode === 'editor' ? 'bg-white shadow text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-700'}`}
                                title="Solo Editor"
                            >
                                <FileText className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('split')}
                                className={`p-1.5 rounded-md transition ${viewMode === 'split' ? 'bg-white shadow text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-700'}`}
                                title="Vista Dividida"
                            >
                                <Layout className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('preview')}
                                className={`p-1.5 rounded-md transition ${viewMode === 'preview' ? 'bg-white shadow text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-700'}`}
                                title="Solo Vista Previa"
                            >
                                <Eye className="w-4 h-4" />
                            </button>
                        </div>

                        {selectedLessonId && (
                            <button
                                onClick={() => handleDelete(selectedLessonId)}
                                className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                title="Eliminar Lección"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        )}
                        <button
                            onClick={handleSave}
                            className="flex items-center gap-2 px-6 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 font-bold shadow-lg shadow-slate-900/20 active:scale-95 transition-all"
                        >
                            <Save className="w-4 h-4" />
                            Guardar
                        </button>
                    </div>
                </div>

                {/* Editor Content split view */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Markdown Input */}
                    {(viewMode === 'editor' || viewMode === 'split') && (
                        <div className={`flex flex-col border-r border-slate-200 bg-white transition-all ${viewMode === 'split' ? 'w-1/2' : 'w-full'}`}>
                            <div className="sticky top-0 z-10 bg-white/80 backdrop-blur shadow-sm">
                                <EditorToolbar onInsert={insertText} />
                            </div>
                            <div className="flex-1 relative">
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="Escribe el contenido de la lección aquí... Usa Markdown."
                                    className="w-full h-full p-8 resize-none focus:outline-none font-mono text-sm leading-7 text-slate-700 selection:bg-indigo-100"
                                    spellCheck={false}
                                />
                            </div>
                            <div className="p-4 border-t border-slate-200 bg-slate-50">
                                <VideoManager
                                    videoUrl={videoUrl}
                                    onChangeUrl={setVideoUrl}
                                    duration={duration}
                                    onChangeDuration={setDuration}
                                    customThumbnail={customThumbnail}
                                    onChangeThumbnail={setCustomThumbnail}
                                    chapters={chapters}
                                    onChangeChapters={setChapters}
                                />
                            </div>
                        </div>
                    )}

                    {/* Live Preview */}
                    {(viewMode === 'preview' || viewMode === 'split') && (
                        <div className={`flex flex-col bg-slate-50 overflow-y-auto transition-all ${viewMode === 'split' ? 'w-1/2' : 'w-full'}`}>
                            {viewMode === 'split' && (
                                <div className="p-2 bg-slate-100/50 border-b border-slate-200 text-xs font-bold text-slate-400 text-center uppercase tracking-widest sticky top-0 z-10 backdrop-blur">
                                    Vista Previa
                                </div>
                            )}
                            <div className="p-10 max-w-2xl mx-auto w-full">
                                {videoUrl && (
                                    <div className="aspect-video bg-slate-200 rounded-2xl mb-8 flex items-center justify-center text-slate-400 shadow-inner">
                                        [Video Player Preview]
                                    </div>
                                )}
                                <h1 className="text-4xl font-black text-slate-900 mb-8 font-sans leading-tight">{title || 'Título de la Lección'}</h1>
                                {renderPreview(content)}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
