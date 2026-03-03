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
    Globe,
    CheckCircle2,
    PenTool,
    ListChecks,
    Plus,
    Check,
    Trophy
} from 'lucide-react';
import { AcademyLesson, QuizQuestion } from '../../../../services/academyService';
import { useAutoSave } from '../../../../hooks/useAutoSave';
import { getXpForLesson } from '../../../../lib/academyGamification';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ReactPlayer = lazy(() => import('react-player')) as any;

interface LessonEditorModalProps {
    isOpen: boolean;
    lesson: AcademyLesson | null;
    hasUnsavedChanges: boolean;
    lastSaved: Date | null;
    onClose: () => void;
    onSave: (data: Partial<AcademyLesson>) => Promise<void>;
    onAutoSave?: (data: Partial<AcademyLesson>) => Promise<void>;
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

const QuizBuilder: React.FC<{
    quiz: QuizQuestion[];
    onChange: (quiz: QuizQuestion[]) => void;
}> = ({ quiz, onChange }) => {
    const addQuestion = () => {
        onChange([
            ...quiz,
            {
                id: crypto.randomUUID(),
                question: '',
                options: ['', ''],
                correctOptionIndex: 0
            }
        ]);
    };

    const updateQuestion = (id: string, updates: Partial<QuizQuestion>) => {
        onChange(quiz.map(q => q.id === id ? { ...q, ...updates } : q));
    };

    const removeQuestion = (id: string) => {
        onChange(quiz.filter(q => q.id !== id));
    };

    const addOption = (questionId: string) => {
        onChange(quiz.map(q => {
            if (q.id === questionId) {
                return { ...q, options: [...q.options, ''] };
            }
            return q;
        }));
    };

    const updateOption = (questionId: string, optionIndex: number, value: string) => {
        onChange(quiz.map(q => {
            if (q.id === questionId) {
                const newOptions = [...q.options];
                newOptions[optionIndex] = value;
                return { ...q, options: newOptions };
            }
            return q;
        }));
    };

    const removeOption = (questionId: string, optionIndex: number) => {
        onChange(quiz.map(q => {
            if (q.id === questionId) {
                const newOptions = q.options.filter((_, idx) => idx !== optionIndex);
                let newCorrectIndex = q.correctOptionIndex;
                if (newCorrectIndex === optionIndex) {
                    newCorrectIndex = 0;
                } else if (newCorrectIndex > optionIndex) {
                    newCorrectIndex -= 1;
                }
                return { ...q, options: newOptions, correctOptionIndex: newCorrectIndex };
            }
            return q;
        }));
    };

    return (
        <div className="space-y-6">
            {quiz.map((q, qIndex) => (
                <div key={q.id} className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-6 relative group">
                    <button
                        type="button"
                        title="Eliminar pregunta"
                        onClick={() => removeQuestion(q.id)}
                        className="absolute top-4 right-4 p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="mb-6">
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                            Pregunta {qIndex + 1}
                        </label>
                        <input
                            type="text"
                            value={q.question}
                            onChange={(e) => updateQuestion(q.id, { question: e.target.value })}
                            placeholder="Ej: ¿Cuál es el proceso correcto para...?"
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none font-semibold"
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
                            Respuestas (selecciona la correcta)
                        </label>
                        {q.options.map((opt, optIndex) => (
                            <div key={optIndex} className="flex items-center gap-3 relative group/opt">
                                <button
                                    className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${q.correctOptionIndex === optIndex
                                        ? 'border-emerald-500 bg-emerald-500 shadow-lg shadow-emerald-500/20 text-white'
                                        : 'border-slate-300 dark:border-slate-600 hover:border-emerald-500'
                                        }`}
                                    onClick={() => updateQuestion(q.id, { correctOptionIndex: optIndex })}
                                    title="Marcar como correcta"
                                >
                                    {q.correctOptionIndex === optIndex && <Check className="w-3.5 h-3.5" />}
                                </button>

                                <input
                                    type="text"
                                    value={opt}
                                    onChange={(e) => updateOption(q.id, optIndex, e.target.value)}
                                    placeholder={`Opción ${optIndex + 1}`}
                                    className={`flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-white outline-none transition-colors ${q.correctOptionIndex === optIndex
                                        ? 'border-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-500/10'
                                        : 'border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500'
                                        }`}
                                />

                                {q.options.length > 2 && (
                                    <button
                                        type="button"
                                        title="Eliminar opción"
                                        onClick={() => removeOption(q.id, optIndex)}
                                        className="shrink-0 p-2 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 opacity-0 group-hover/opt:opacity-100 transition-all"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <button
                            onClick={() => addOption(q.id)}
                            className="text-sm font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1 transition-colors"
                        >
                            <Plus className="w-4 h-4" /> Añadir Opción
                        </button>
                    </div>
                </div>
            ))}

            <button
                onClick={addQuestion}
                className="w-full py-4 border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 rounded-xl text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 font-bold transition-all flex items-center justify-center gap-2"
            >
                <Plus className="w-5 h-5" /> Nueva Pregunta
            </button>
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
    onAutoSave,
    onChange,
    onDelete,
    onToggleStatus
}) => {
    const [title, setTitle] = useState(lesson?.title || '');
    const [videoUrl, setVideoUrl] = useState(lesson?.video_url || '');
    const [content, setContent] = useState(lesson?.content || '');
    const [duration, setDuration] = useState(lesson?.duration || 10);
    const [contentType, setContentType] = useState<'video' | 'text' | 'quiz'>(
        lesson?.content_type === 'quiz' ? 'quiz' : (lesson?.content_type === 'video' ? 'video' : 'text')
    );
    const [quizData, setQuizData] = useState<QuizQuestion[]>(lesson?.quiz || []);

    const isQuizValid = quizData.length > 0 && quizData.every(q => q.question.trim() && q.options.length >= 2 && q.options.every(o => o.trim()));

    // Auto-save: usa onAutoSave (no cierra modal) o fallback a onSave
    const autoSaveHandler = onAutoSave || onSave;
    const autoSaveData = async () => {
        if (title.trim()) {
            if ((contentType === 'quiz' && quizData.length > 0) || (contentType !== 'quiz' && content.trim())) {
                await autoSaveHandler({
                    title,
                    video_url: videoUrl,
                    content,
                    duration,
                    content_type: contentType,
                    quiz: quizData
                });
            }
        }
    };

    const { isSaving, lastSaved, hasUnsavedChanges } = useAutoSave({
        delay: 5000,
        onSave: autoSaveData,
        deps: [title, videoUrl, content, duration, contentType, quizData],
        enabled: isOpen && !!lesson?.id
    });

    useEffect(() => {
        if (lesson && lesson.id) {
            const timeoutId = setTimeout(() => {
                setTitle(lesson.title || '');
                setVideoUrl(lesson.video_url || '');
                setContent(lesson.content || '');
                setDuration(lesson.duration || 10);
                setContentType(lesson.content_type === 'quiz' ? 'quiz' : (lesson.content_type === 'video' ? 'video' : 'text'));
                setQuizData(lesson.quiz || []);
            }, 0);
            return () => clearTimeout(timeoutId);
        }
    }, [lesson?.id, lesson]);


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

        if (contentType !== 'quiz' && !content.trim()) {
            toast.error('El contenido es obligatorio');
            return;
        }

        if (contentType === 'quiz' && !isQuizValid) {
            toast.error('El quiz debe tener al menos una pregunta, y todas las preguntas deben estar completas');
            return;
        }

        try {
            await onSave({
                title,
                video_url: videoUrl,
                content,
                duration,
                content_type: contentType,
                quiz: quizData
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
                    initial={{ opacity: 0, scale: 0.98, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98, y: 10 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-2xl shadow-2xl w-full max-w-[1400px] h-[90vh] overflow-hidden flex flex-col relative border border-white/20 dark:border-slate-700/50"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* HEADER - DOCUSIGN STYLE */}
                        <header className="flex-none h-16 border-b border-slate-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-950/50 backdrop-blur-md flex items-center justify-between px-6 z-20">
                            <div className="flex items-center gap-4">
                                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                                    <FileText className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                                        {lesson?.id ? 'Editor de Lección' : 'Nueva Lección'}
                                    </h2>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                        {title || 'Sin título'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                {isSaving && (
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-500/10 rounded-lg border border-blue-100 dark:border-blue-500/20">
                                        <Loader2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 animate-spin" />
                                        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                                            Guardando...
                                        </span>
                                    </div>
                                )}
                                {lastSaved && !isSaving && (
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg border border-emerald-100 dark:border-emerald-500/20">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                            Guardado {lastSaved.toLocaleTimeString()}
                                        </span>
                                    </div>
                                )}
                                {hasUnsavedChanges && !isSaving && (
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-500/10 rounded-lg border border-amber-100 dark:border-amber-500/20">
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                        <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                                            Cambios pendientes
                                        </span>
                                    </div>
                                )}

                                <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-2" />

                                {lesson?.id && onToggleStatus && (
                                    <button
                                        onClick={() => {
                                            onToggleStatus();
                                            toast.success(lesson.status === 'published' ? 'Lección ocultada' : 'Lección publicada');
                                        }}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${lesson.status === 'published'
                                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                            : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                                            }`}
                                    >
                                        {lesson.status === 'published' ? (
                                            <>
                                                <Eye className="w-3.5 h-3.5" />
                                                Ocultar
                                            </>
                                        ) : (
                                            <>
                                                <Globe className="w-3.5 h-3.5" />
                                                Publicar
                                            </>
                                        )}
                                    </button>
                                )}

                                <button
                                    onClick={onClose}
                                    title="Cerrar"
                                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </header>

                        {/* MAIN SPLIT LAYOUT */}
                        <div className="flex flex-1 overflow-hidden relative bg-transparent">

                            {/* LEFT SIDEBAR - CONFIGURATION */}
                            <div className="w-80 border-r border-slate-200/50 dark:border-slate-800/50 bg-white/40 dark:bg-slate-950/40 backdrop-blur-sm overflow-y-auto flex flex-col shrink-0">
                                {/* Completeness Donut */}
                                <div className="p-6 border-b border-slate-100 dark:border-slate-800/60">
                                    <h3 className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase mb-5">Estado de la Lección</h3>

                                    <div className="flex items-center gap-5">
                                        <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                                            {/* SVG Donut Chart */}
                                            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                                {/* Background Circle */}
                                                <path
                                                    className="text-slate-100 dark:text-slate-800"
                                                    strokeWidth="3"
                                                    stroke="currentColor"
                                                    fill="none"
                                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                />
                                                {/* Progress Circle */}
                                                <path
                                                    className={`${[title, contentType === 'quiz' ? isQuizValid : content, contentType === 'video' ? videoUrl : true, duration].every(Boolean) ? 'text-emerald-500' : 'text-blue-500'} transition-all duration-1000 ease-out`}
                                                    strokeDasharray={`${[
                                                        title ? 25 : 0,
                                                        (contentType === 'quiz' ? isQuizValid : content) ? 25 : 0,
                                                        (contentType === 'video' ? videoUrl : true) ? 25 : 0,
                                                        duration ? 25 : 0
                                                    ].reduce((a, b) => a + Number(b), 0)}, 100`}
                                                    strokeWidth="3"
                                                    strokeDashoffset="0"
                                                    strokeLinecap="round"
                                                    stroke="currentColor"
                                                    fill="none"
                                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                />
                                            </svg>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <span className="text-sm font-black text-slate-900 dark:text-white">
                                                    {[
                                                        title ? 25 : 0,
                                                        (contentType === 'quiz' ? isQuizValid : content) ? 25 : 0,
                                                        (contentType === 'video' ? videoUrl : true) ? 25 : 0,
                                                        duration ? 25 : 0
                                                    ].reduce((a, b) => a + Number(b), 0)}%
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex-1 space-y-1.5">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className={`font-semibold ${title ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>Tít.</span>
                                                <CheckCircle2 className={`w-3.5 h-3.5 ${title ? 'text-emerald-500' : 'text-slate-200 dark:text-slate-700'}`} />
                                            </div>
                                            <div className="flex items-center justify-between text-xs">
                                                <span className={`font-semibold ${(contentType === 'quiz' ? isQuizValid : content) ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                                                    {contentType === 'quiz' ? 'Quiz' : 'Contenido'}
                                                </span>
                                                <CheckCircle2 className={`w-3.5 h-3.5 ${(contentType === 'quiz' ? isQuizValid : content) ? 'text-emerald-500' : 'text-slate-200 dark:text-slate-700'}`} />
                                            </div>
                                            {contentType === 'video' && (
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className={`font-semibold ${videoUrl ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>Video</span>
                                                    <CheckCircle2 className={`w-3.5 h-3.5 ${videoUrl ? 'text-emerald-500' : 'text-slate-200 dark:text-slate-700'}`} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Settings Form */}
                                <div className="p-6 space-y-6">
                                    {/* Duration */}
                                    <div>
                                        <label htmlFor="durationInput" className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">
                                            <Clock className="w-4 h-4 text-blue-500" />
                                            Duración estimada
                                        </label>
                                        <div className="flex items-center gap-3">
                                            <input
                                                id="durationInput"
                                                type="number"
                                                title="Duración estimada (minutos)"
                                                min="1"
                                                value={duration}
                                                onChange={(e) => {
                                                    const val = parseInt(e.target.value) || 0;
                                                    setDuration(val);
                                                    onChange({ duration: val });
                                                }}
                                                className="w-24 px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all font-semibold"
                                            />
                                            <span className="text-sm font-medium text-slate-500">minutos</span>
                                        </div>
                                    </div>

                                    {/* Video URL */}
                                    {contentType === 'video' && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="space-y-2"
                                        >
                                            <label htmlFor="videoUrlInput" className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">
                                                <div className="flex items-center gap-2">
                                                    <Globe className="w-4 h-4 text-rose-500" />
                                                    URL del Video
                                                </div>
                                                {youtubeId && <span className="text-[10px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">YouTube Validado</span>}
                                            </label>
                                            <input
                                                id="videoUrlInput"
                                                title="URL del Video"
                                                type="text"
                                                value={videoUrl}
                                                onChange={(e) => {
                                                    setVideoUrl(e.target.value);
                                                    onChange({ video_url: e.target.value });
                                                }}
                                                placeholder="https://youtube.com/..."
                                                className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 transition-all"
                                            />
                                            {youtubeId && (
                                                <div className="mt-3 aspect-video rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-black shadow-inner">
                                                    <Suspense fallback={<div className="w-full h-full flex items-center justify-center bg-slate-900"><Loader2 className="w-8 h-8 text-slate-500 animate-spin" /></div>}>
                                                        <ReactPlayer
                                                            url={videoUrl}
                                                            width="100%"
                                                            height="100%"
                                                            controls
                                                            light // Load thumbnail first for better performance
                                                        />
                                                    </Suspense>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}

                                    {/* Actions */}
                                    <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                                        <button
                                            onClick={handleSave}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/25 transition-all active:scale-[0.98]"
                                        >
                                            <SaveIcon className="w-4 h-4" />
                                            Guardar Lección
                                        </button>

                                        {lesson?.id && (
                                            <button
                                                onClick={handleDelete}
                                                className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl font-bold text-xs transition-all"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                Eliminar
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT CONTENT AREA - EDITOR */}
                            <div className="flex-1 flex flex-col bg-slate-50/50 dark:bg-slate-900/30 overflow-y-auto">
                                <div className="p-8 max-w-4xl mx-auto w-full space-y-8 pb-32">
                                    {/* Title Editor */}
                                    <div>
                                        <input
                                            type="text"
                                            value={title}
                                            onChange={(e) => {
                                                setTitle(e.target.value);
                                                onChange({ title: e.target.value });
                                            }}
                                            placeholder="Título de la lección..."
                                            className="w-full text-4xl sm:text-5xl font-black text-slate-900 dark:text-white bg-transparent outline-none placeholder:text-slate-300 dark:placeholder:text-slate-700 mb-4"
                                        />
                                        <div className="flex items-center gap-2 mt-2">
                                            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-amber-400/20 to-orange-500/20 dark:from-amber-400/10 dark:to-orange-500/10 border border-amber-200 dark:border-amber-900/50 text-amber-700 dark:text-amber-400 rounded-full font-bold text-sm shadow-sm">
                                                <Trophy className="w-4 h-4" />
                                                Recompensa: {getXpForLesson(contentType)} XP
                                            </div>
                                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                                Los Riders ganarán esta experiencia al completar la lección.
                                            </span>
                                        </div>
                                    </div>

                                    {/* Content Types Selector */}
                                    <div className="flex gap-2 p-1.5 bg-slate-200/50 dark:bg-slate-800/50 rounded-xl w-fit">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setContentType('text');
                                                onChange({ content_type: 'text' });
                                            }}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${contentType === 'text'
                                                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                                }`}
                                        >
                                            <FileText className="w-4 h-4" />
                                            Solo Texto
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setContentType('video');
                                                onChange({ content_type: 'video' });
                                            }}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${contentType === 'video'
                                                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                                }`}
                                        >
                                            <Globe className="w-4 h-4" />
                                            Video + Texto
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setContentType('quiz');
                                                onChange({ content_type: 'quiz' });
                                            }}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${contentType === 'quiz'
                                                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                                }`}
                                        >
                                            <ListChecks className="w-4 h-4" />
                                            Evaluación
                                        </button>
                                    </div>

                                    {/* Content Area */}
                                    {contentType === 'quiz' ? (
                                        <div className="bg-slate-50 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 md:p-6 dark:bg-slate-900/50 shadow-sm">
                                            <QuizBuilder
                                                quiz={quizData}
                                                onChange={(newQuiz) => {
                                                    setQuizData(newQuiz);
                                                    onChange({ quiz: newQuiz });
                                                }}
                                            />
                                        </div>
                                    ) : (
                                        <div className="bg-white dark:bg-slate-950 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                                            <div className="bg-slate-50 dark:bg-slate-900 px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                                                    <PenTool className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                </div>
                                                <span className="font-bold text-slate-700 dark:text-slate-300 text-sm">Contenido</span>
                                            </div>
                                            <div className="p-1">
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
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default LessonEditorModal;
