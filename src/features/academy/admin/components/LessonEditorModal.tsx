import React, { useState, useCallback, useEffect, useRef, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './editor-styles.css';
import { toast } from 'react-hot-toast';
import {
    Save as SaveIcon,
    X,
    Trash2,
    FileText,
    Loader2,
    Clock,
    Eye,
    Globe
} from 'lucide-react';
import { AcademyLesson } from '../../../../services/academyService';
import { useAutoSave } from '../../../../hooks/useAutoSave';

const ReactPlayer = lazy(() => import('react-player'));

interface LessonEditorModalProps {
    isOpen: boolean;
    lesson: AcademyLesson | null;
    hasUnsavedChanges: boolean;
    lastSaved: Date | null;
    onClose: () => void;
    onSave: (data: Partial<AcademyLesson>) => Promise<void>;
    onChange: (data: Partial<AcademyLesson>) => void;
    onDelete: (id: string) => Promise<void>;
    onToggleStatus?: () => void;
}

const RichTextEditor: React.FC<{
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}> = ({ value, onChange, placeholder }) => {
    const editorRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!editorRef.current) return;

        const currentValue = editorRef.current.innerHTML;
        const normalizedValue = value === '<br>' ? '' : value;

        // Only update innerHTML if it actually differs from what's there.
        // This prevents cursor jumping during rapid typing.
        if (currentValue !== normalizedValue) {
            editorRef.current.innerHTML = normalizedValue;
        }
    }, [value]);

    const handleInput = useCallback(() => {
        if (!editorRef.current) return;
        onChange(editorRef.current.innerHTML);
    }, [onChange]);

    const handlePaste = useCallback((e: React.ClipboardEvent) => {
        e.preventDefault();
        const text = e.clipboardData.getData('text/plain');
        document.execCommand('insertText', false, text);
    }, []);

    const execCommand = useCallback((command: string, arg: string | undefined = undefined) => {
        document.execCommand(command, false, arg);
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
        editorRef.current?.focus();
    }, [onChange]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key.toLowerCase()) {
                case 'b':
                    e.preventDefault();
                    execCommand('bold');
                    break;
                case 'i':
                    e.preventDefault();
                    execCommand('italic');
                    break;
                case 'u':
                    e.preventDefault();
                    execCommand('underline');
                    break;
            }
        }
    }, [execCommand]);

    return (
        <div className="flex flex-col border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-800 focus-within:ring-2 focus-within:ring-blue-500 transition-all relative">
            <div className="flex flex-wrap items-center gap-1 px-2 py-1.5 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                <div className="flex gap-1 pr-1">
                    <button
                        type="button"
                        onClick={() => execCommand('undo')}
                        className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-400 transition-colors"
                        title="Deshacer (Ctrl+Z)"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 0 1 8 8v2M3 10l6 6m-6-6 6-6" />
                        </svg>
                    </button>
                    <button
                        type="button"
                        onClick={() => execCommand('redo')}
                        className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-400 transition-colors"
                        title="Rehacer (Ctrl+Y)"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 10H11a8 8 0 0 0-8 8v2M21 10l-6 6m6-6-6-6" />
                        </svg>
                    </button>
                </div>

                <div className="flex gap-1 pr-1 border-l border-slate-200 dark:border-slate-700 pl-1">
                    <button
                        type="button"
                        onClick={() => execCommand('bold')}
                        className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-400 transition-colors"
                        title="Negrita (Ctrl+B)"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
                        </svg>
                    </button>
                    <button
                        type="button"
                        onClick={() => execCommand('italic')}
                        className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-400 transition-colors"
                        title="Cursiva (Ctrl+I)"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 4h-9M14 20H5M15 4l-5 16" />
                        </svg>
                    </button>
                    <button
                        type="button"
                        onClick={() => execCommand('underline')}
                        className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-400 transition-colors"
                        title="Subrayado (Ctrl+U)"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 21h16" />
                        </svg>
                    </button>
                    <button
                        type="button"
                        onClick={() => execCommand('justifyLeft')}
                        className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-400 transition-colors"
                        title="Izquierda"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h12M3 8h9M3 12h9M3 16h12" />
                        </svg>
                    </button>
                    <button
                        type="button"
                        onClick={() => execCommand('justifyCenter')}
                        className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-400 transition-colors"
                        title="Centrar"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M6 8h12M6 12h12M3 16h18" />
                        </svg>
                    </button>
                    <button
                        type="button"
                        onClick={() => execCommand('justifyRight')}
                        className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-400 transition-colors"
                        title="Derecha"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h12M6 8h9M6 12h9M3 16h12" />
                        </svg>
                    </button>
                </div>

                <div className="flex gap-1 pl-1">
                    <button
                        type="button"
                        onClick={() => execCommand('insertUnorderedList')}
                        className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-400 transition-colors"
                        title="Lista sin numerar"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 6h-2M8 12h-2M8 18h-2" />
                        </svg>
                    </button>
                    <button
                        type="button"
                        onClick={() => execCommand('insertOrderedList')}
                        className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-400 transition-colors"
                        title="Lista numerada"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6h-2v-4m-2 12h4v-2h-2v-2h2v-2h-4m0 8h4v-2h-4" />
                        </svg>
                    </button>
                </div>
            </div>

            <div
                ref={editorRef}
                contentEditable
                onInput={handleInput}
                onPaste={handlePaste}
                onKeyDown={handleKeyDown}
                className="lesson-rich-editor min-h-[300px] max-h-[450px] px-4 py-3 text-slate-900 dark:text-white outline-none prose prose-base prose-slate dark:prose-invert max-w-none focus:outline-none overflow-y-auto"
                suppressContentEditableWarning={true}
            />

            {placeholder && (!value || value === '<br>') && (
                <div className="absolute top-14 left-4 text-slate-400 pointer-events-none text-sm">
                    {placeholder}
                </div>
            )}
        </div>
    );
};

const LessonEditorModal: React.FC<LessonEditorModalProps> = ({
    isOpen,
    lesson,
    hasUnsavedChanges: _hasUnsavedChanges,
    lastSaved: _lastSaved,
    onClose,
    onSave,
    onChange,
    onDelete,
    onToggleStatus
}) => {
    const [title, setTitle] = useState(lesson?.title || '');
    const [videoUrl, setVideoUrl] = useState(lesson?.video_url || '');
    const [content, setContent] = useState(lesson?.content || '');
    const [duration, setDuration] = useState(lesson?.duration || 10);
    const [contentType, setContentType] = useState<'video' | 'text'>(lesson?.content_type === 'video' ? 'video' : 'text');

    // Auto-save configuration
    const autoSaveData = async () => {
        if (title.trim() && content.trim()) {
            await onSave({
                title,
                video_url: videoUrl,
                content,
                duration,
                content_type: contentType
            });
        }
    };

    const { isSaving, lastSaved, hasUnsavedChanges } = useAutoSave({
        delay: 5000,
        onSave: autoSaveData,
        deps: [title, videoUrl, content, duration, contentType],
        enabled: isOpen && !!lesson?.id
    });

    useEffect(() => {
        if (lesson && lesson.id) {
            const timeoutId = setTimeout(() => {
                setTitle(lesson.title || '');
                setVideoUrl(lesson.video_url || '');
                setContent(lesson.content || '');
                setDuration(lesson.duration || 10);
                setContentType(lesson.content_type === 'video' ? 'video' : 'text');
            }, 0);
            return () => clearTimeout(timeoutId);
        }
    }, [lesson?.id]); // eslint-disable-line react-hooks/exhaustive-deps

    const extractYouTubeId = (url: string) => {
        const regex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/;
        const match = url.match(regex);
        return match ? match[1] : null;
    };

    const handleSave = async () => {
        if (!title.trim()) {
            toast.error('El título es obligatorio');
            return;
        }

        if (contentType === 'video' && !videoUrl.trim()) {
            toast.error('La URL del video es obligatoria');
            return;
        }

        if (!content.trim()) {
            toast.error('El contenido es obligatorio');
            return;
        }

        try {
            await onSave({
                title,
                video_url: videoUrl,
                content,
                duration,
                content_type: contentType
            });
            toast.success('Lección guardada correctamente');
        } catch (error) {
            console.error('Error saving lesson:', error);
            toast.error('Error al guardar la lección');
        }
    };

    const handleDelete = async () => {
        if (!lesson?.id) return;
        if (!confirm('¿Estás seguro de que quieres eliminar esta lección? Esta acción no se puede deshacer.')) {
            return;
        }
        try {
            await onDelete(lesson.id);
            toast.success('Lección eliminada correctamente');
            onClose();
        } catch (error) {
            console.error('Error deleting lesson:', error);
            toast.error('Error al eliminar la lección');
        }
    };

    if (!isOpen) return null;

    const youtubeId = contentType === 'video' ? extractYouTubeId(videoUrl) : null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    transition={{ duration: 0.3 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-black/80 backdrop-blur-md"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ duration: 0.3 }}
                        className="bg-white dark:bg-slate-950 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col relative transition-colors"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 backdrop-blur-sm z-10 shrink-0">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                        {lesson?.id ? 'Editar Lección' : 'Nueva Lección'}
                                    </h2>
                                    {isSaving && (
                                        <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-100 dark:bg-blue-500/20 rounded-full">
                                            <Loader2 className="w-3 h-3 text-blue-600 dark:text-blue-400 animate-spin" />
                                            <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                                                Guardando...
                                            </span>
                                        </div>
                                    )}
                                    {lastSaved && !isSaving && (
                                        <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-100 dark:bg-emerald-500/20 rounded-full">
                                            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                                Guardado {lastSaved.toLocaleTimeString()}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                {hasUnsavedChanges && !isSaving && (
                                    <p className="text-xs font-medium text-rose-600 dark:text-rose-400 mt-1">
                                        Cambios sin guardar
                                    </p>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                {/* Botón de Publicar/Despublicar */}
                                {lesson?.id && onToggleStatus && (
                                    <button
                                        onClick={() => {
                                            onToggleStatus();
                                            toast.success(lesson.status === 'published' ? 'Lección desactivada' : 'Lección publicada');
                                        }}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${lesson.status === 'published'
                                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50'
                                            : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50'
                                            }`}
                                    >
                                        {lesson.status === 'published' ? (
                                            <>
                                                <Globe className="w-3.5 h-3.5" />
                                                <span>Publicado</span>
                                            </>
                                        ) : (
                                            <>
                                                <Eye className="w-3.5 h-3.5" />
                                                <span>Publicar</span>
                                            </>
                                        )}
                                    </button>
                                )}
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 transition-colors"
                                    aria-label="Cerrar modal"
                                >
                                    <X className="w-5 h-5 text-slate-500" />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                                    Título *
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => {
                                        setTitle(e.target.value);
                                        onChange({ title: e.target.value });
                                    }}
                                    placeholder="Ej: Introducción a los conceptos básicos..."
                                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                                        Tipo de contenido *
                                    </label>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setContentType('video');
                                                onChange({ content_type: 'video' });
                                            }}
                                            className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all border ${contentType === 'video'
                                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-300 dark:hover:border-blue-400'
                                                }`}
                                        >
                                            <FileText className="w-4 h-4" />
                                            Video
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setContentType('text');
                                                onChange({ content_type: 'text' });
                                            }}
                                            className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all border ${contentType === 'text'
                                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-300 dark:hover:border-blue-400'
                                                }`}
                                        >
                                            <FileText className="w-4 h-4" />
                                            Artículo
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                                        Duración (minutos) *
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-slate-400" />
                                        <input
                                            type="number"
                                            value={duration}
                                            onChange={(e) => {
                                                const num = parseInt(e.target.value) || 10;
                                                setDuration(num);
                                                onChange({ duration: num });
                                            }}
                                            min="1"
                                            max="180"
                                            className="flex-1 px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                            aria-label="Duración"
                                        />
                                    </div>
                                </div>

                                {contentType === 'video' && (
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                                            URL del video (YouTube) *
                                        </label>
                                        <input
                                            type="url"
                                            value={videoUrl}
                                            onChange={(e) => {
                                                setVideoUrl(e.target.value);
                                                onChange({ video_url: e.target.value });
                                            }}
                                            placeholder="https://www.youtube.com/watch?v=..."
                                            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        />
                                        {youtubeId && (
                                            <div className="mt-3 rounded-lg overflow-hidden shadow-sm">
                                                <Suspense fallback={<div className="w-full h-[250px] bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg" />}>
                                                    <ReactPlayer
                                                        src={`https://www.youtube.com/watch?v=${youtubeId}`}
                                                        width="100%"
                                                        height="250px"
                                                        controls={false}
                                                        muted
                                                        playing={false}
                                                    />
                                                </Suspense>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                                        Contenido *
                                    </label>
                                    <RichTextEditor
                                        value={content}
                                        onChange={(val) => {
                                            setContent(val);
                                            onChange({ content: val });
                                        }}
                                        placeholder="Escribe el contenido de la lección aquí..."
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/80 backdrop-blur-xl">
                            <div className="flex items-center justify-end gap-3">
                                {lesson?.id && (
                                    <button
                                        type="button"
                                        onClick={handleDelete}
                                        className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-500/20 rounded-lg font-semibold text-sm uppercase tracking-wider transition-all hover:bg-rose-100 dark:hover:bg-rose-500/20 hover:shadow-md active:scale-95"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        <span>Eliminar</span>
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-semibold text-xs uppercase tracking-wider transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="flex items-center gap-1.5 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed border-slate-200 dark:border-slate-700 shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5 active:scale-95"
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            <span>...</span>
                                        </>
                                    ) : (
                                        <>
                                            <SaveIcon className="w-4 h-4" />
                                            <span>Guardar</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default LessonEditorModal;
