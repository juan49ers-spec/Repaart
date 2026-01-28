import { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './academy.css';
import ContentProtection from './components/ContentProtection';
import { useAuth } from '../../context/AuthContext';
import {
    useAcademyModules,
    useAcademyModule,
    useAcademyLessons,
    useAcademyProgress,
    useMarkLessonComplete
} from '../../hooks/academy';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import {
    BookOpen,
    Play,
    CheckCircle,
    Clock,
    ChevronRight,
    ArrowLeft,
    Youtube,
    FileText
} from 'lucide-react';

const Academy = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { moduleId } = useParams();
    const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    const { modules, loading: modulesLoading } = useAcademyModules();
    const { module, loading: moduleLoading } = useAcademyModule(moduleId || null);
    const { lessons, loading: lessonsLoading } = useAcademyLessons(moduleId || null, 'published');
    const { progress } = useAcademyProgress(user?.uid || null, moduleId || null);
    const { markComplete, loading: markingComplete } = useMarkLessonComplete();

    const completedLessons = useMemo(() => progress?.completed_lessons || [], [progress]);
    const lessonsInOrder = useMemo(() => {
        return [...lessons].sort((a, b) => a.order - b.order);
    }, [lessons]);

    const currentLesson = useMemo(() => {
        if (selectedLessonId && lessons.some(l => l.id === selectedLessonId)) {
            return lessons.find(l => l.id === selectedLessonId) || null;
        }
        if (lessons.length > 0) {
            const firstUncompleted = lessons.find(l => !completedLessons.includes(l.id!));
            return firstUncompleted || lessons[0];
        }
        return null;
    }, [lessons, selectedLessonId, completedLessons]);

    const handleLessonComplete = async (lessonId: string) => {
        if (!user?.uid || !moduleId) return;
        try {
            await markComplete(user.uid, moduleId, lessonId);
        } catch (error) {
            console.error('Error marking lesson complete:', error);
        }
    };

    const getProgressPercentage = () => {
        if (lessons.length === 0) return 0;
        const completedCount = lessons.filter(l => completedLessons.includes(l.id!)).length;
        return Math.round((completedCount / lessons.length) * 100);
    };

    const extractYouTubeId = (url: string) => {
        const regex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/;
        const match = url.match(regex);
        return match ? match[1] : null;
    };

    // Prevent iframe interactions
    useEffect(() => {
        const iframe = iframeRef.current;
        if (!iframe) return;

        const preventIframeInteraction = (e: Event) => {
            e.preventDefault();
            e.stopPropagation();
        };

        iframe.addEventListener('contextmenu', preventIframeInteraction);
        iframe.addEventListener('click', preventIframeInteraction as EventListener);
        iframe.addEventListener('dblclick', preventIframeInteraction as EventListener);

        return () => {
            iframe.removeEventListener('contextmenu', preventIframeInteraction);
            iframe.removeEventListener('click', preventIframeInteraction as EventListener);
            iframe.removeEventListener('dblclick', preventIframeInteraction as EventListener);
        };
    }, [currentLesson?.video_url]);

    // Loading State
    if (modulesLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Cargando...</p>
                </div>
            </div>
        );
    }

    // Modules List View
    if (!moduleId) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
                <div className="max-w-5xl mx-auto px-3 sm:px-4 py-6 md:py-10">
                    <header className="mb-6 md:mb-8">
                        <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
                                Academy
                            </h1>
                            <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed">
                                Plataforma de formación profesional para franquiciados
                            </p>
                        </motion.div>
                    </header>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                        {modules.map((mod, index) => {
                            const moduleProgress = progress && progress.module_id === mod.id;
                            const percentage = moduleProgress ? getProgressPercentage() : 0;

                            return (
                                <motion.div
                                    key={mod.id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.03 }}
                                    onClick={() => navigate(`/academy/${mod.id}`)}
                                    className="group bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 cursor-pointer transition-all duration-200 hover:border-blue-300 dark:hover:border-blue-700"
                                >
                                    <div className="aspect-[16/9] bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
                                        <BookOpen className="w-8 h-8 text-white/90" />
                                    </div>
                                    <div className="p-3 md:p-4">
                                        <div className="flex items-center gap-1.5 mb-2">
                                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                                                Módulo {mod.order}
                                            </span>
                                            {moduleProgress && (
                                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                                                    {percentage}%
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="text-sm md:text-base font-bold text-slate-900 dark:text-white mb-1.5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight">
                                            {mod.title}
                                        </h3>
                                        <p className="text-xs text-slate-600 dark:text-slate-400 mb-3 line-clamp-2 leading-relaxed">
                                            {mod.description}
                                        </p>

                                        {moduleProgress && (
                                            <div className="mb-3">
                                                <div className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                                    <motion.div
                                                        className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-300"
                                                        style={{ width: `${percentage}%` }}
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${percentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        <button className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium text-xs transition-colors">
                                            <Play className="w-3.5 h-3.5" />
                                            {moduleProgress ? 'Continuar' : 'Comenzar'}
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}

                        {modules.length === 0 && (
                            <div className="col-span-full text-center py-12 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                                <BookOpen className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    No hay módulos disponibles
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Module Loading State
    if (moduleLoading || lessonsLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Cargando módulo...</p>
                </div>
            </div>
        );
    }

    // Module Not Found
    if (!module) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <BookOpen className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-600 dark:text-slate-400">Módulo no encontrado</p>
                </div>
            </div>
        );
    }

    const isCompleted = currentLesson?.id ? completedLessons.includes(currentLesson.id) : false;
    const youtubeId = currentLesson?.video_url ? extractYouTubeId(currentLesson.video_url) : null;

    // Lesson View with Sidebar
    return (
        <div className="h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex flex-col lg:flex-row overflow-hidden">
            {/* Mobile Header */}
            <div className="lg:hidden flex items-center justify-between px-3 py-2 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                <button
                    onClick={() => navigate('/academy')}
                    className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 text-xs font-medium"
                >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Volver
                </button>
                <span className="text-xs font-semibold text-slate-900 dark:text-white truncate flex-1 mx-2">
                    {module.title}
                </span>
                <div className="w-5 h-5 rounded-full bg-blue-600 text-white text-[9px] flex items-center justify-center font-bold">
                    {getProgressPercentage()}%
                </div>
            </div>

            {/* Sidebar - Desktop only */}
            <aside className="hidden lg:flex flex-col w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
                <div className="p-3 border-b border-slate-200 dark:border-slate-800">
                    <button
                        onClick={() => navigate('/academy')}
                        className="flex items-center gap-1.5 text-[10px] text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 mb-2 transition-colors font-medium"
                    >
                        <ArrowLeft className="w-3 h-3" />
                        <span>Volver a módulos</span>
                    </button>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                        {module.title}
                    </h2>
                    <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {module.description}
                    </p>
                </div>

                {/* Progress Bar */}
                <div className="px-3 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                    <div className="flex items-center justify-between text-[10px] mb-1.5">
                        <span className="text-slate-700 dark:text-slate-300 font-medium">Tu progreso</span>
                        <span className="text-blue-600 dark:text-blue-400 font-bold">{getProgressPercentage()}%</span>
                    </div>
                    <div className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-300"
                            style={{ width: `${getProgressPercentage()}%` }}
                        />
                    </div>
                </div>

                {/* Lessons List */}
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {lessonsInOrder.map((lesson, index) => {
                        const lessonCompleted = completedLessons.includes(lesson.id!);
                        const isSelected = currentLesson?.id === lesson.id;

                        return (
                            <motion.button
                                key={lesson.id}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.01 }}
                                onClick={() => setSelectedLessonId(lesson.id!)}
                                className={cn(
                                    "w-full text-left p-2.5 rounded-md transition-all text-left group",
                                    isSelected
                                        ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-600 dark:border-blue-400'
                                        : 'bg-white dark:bg-slate-900 border-2 border-transparent hover:border-slate-200 dark:hover:border-slate-700'
                                )}
                            >
                                <div className="flex items-start gap-2">
                                    <div className={cn(
                                        "flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 font-semibold text-[10px]",
                                        lessonCompleted
                                            ? 'bg-emerald-500 text-white'
                                            : isSelected
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                                    )}>
                                        {lessonCompleted ? (
                                            <CheckCircle className="w-3 h-3" />
                                        ) : (
                                            index + 1
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className={cn(
                                            "text-xs font-semibold mb-0.5 leading-snug",
                                            isSelected
                                                ? 'text-blue-700 dark:text-blue-300'
                                                : 'text-slate-900 dark:text-white'
                                        )}>
                                            {lesson.title}
                                        </h4>
                                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                                            {lesson.content_type === 'video' ? (
                                                <>
                                                    <Youtube className="w-2.5 h-2.5" />
                                                    <span>Video</span>
                                                </>
                                            ) : (
                                                <>
                                                    <FileText className="w-2.5 h-2.5" />
                                                    <span>Artículo</span>
                                                </>
                                            )}
                                            <span>•</span>
                                            <Clock className="w-2.5 h-2.5" />
                                            <span>{lesson.duration}m</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.button>
                        );
                    })}

                    {lessons.length === 0 && (
                        <div className="text-center py-4">
                            <p className="text-[10px] text-slate-500 dark:text-slate-400">
                                No hay lecciones
                            </p>
                        </div>
                    )}
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                {currentLesson ? (
                    <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 md:py-6 lg:py-8">
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            {/* Header */}
                            <div className="mb-4 md:mb-6">
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-600 dark:text-slate-400 mb-2">
                                    {currentLesson.content_type === 'video' ? (
                                        <>
                                            <Youtube className="w-3 h-3" />
                                            <span>Video tutorial</span>
                                        </>
                                    ) : (
                                        <>
                                            <FileText className="w-3 h-3" />
                                            <span>Artículo educativo</span>
                                        </>
                                    )}
                                    <span>•</span>
                                    <Clock className="w-3 h-3" />
                                    <span>{currentLesson.duration} minutos</span>
                                </div>
                                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white leading-tight mb-3 tracking-tight">
                                    {currentLesson.title}
                                </h1>
                            </div>

                            {/* Video Player - Protected */}
                            {currentLesson.video_url && youtubeId && (
                                <div className="mb-4 md:mb-6">
                                    <div className="video-container video-aspect-16-9 mb-3 rounded-lg overflow-hidden shadow-md">
                                        <iframe
                                            ref={iframeRef}
                                            src={`https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1&playsinline=1&showinfo=0&iv_load_policy=3&controls=1&disablekb=1&fs=0&widget_referrer=${encodeURIComponent(window.location.href)}`}
                                            title={currentLesson.title}
                                            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                            className="absolute inset-0 w-full h-full"
                                            loading="lazy"
                                            sandbox="allow-scripts allow-same-origin allow-presentation allow-forms"
                                        />
                                    </div>

                                    {/* Video Metadata */}
                                    <div className="bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800 p-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-red-600 rounded-md flex items-center justify-center flex-shrink-0">
                                                <Youtube className="w-4 h-4 text-white" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                                                    <Clock className="w-3 h-3" />
                                                    <span>{currentLesson.duration} minutos</span>
                                                    <span className="text-slate-300 dark:text-slate-600">•</span>
                                                    <span className="inline-flex items-center gap-1">
                                                        <Play className="w-3 h-3" />
                                                        Video tutorial
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Content - Protected */}
                            {currentLesson.content && (
                                <div className="mb-4 md:mb-6">
                                    <div className="bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800 p-4 md:p-5">
                                        <ContentProtection>
                                            <div className="lesson-content">
                                                <div
                                                    className="prose prose-base dark:prose-invert max-w-none"
                                                    dangerouslySetInnerHTML={{ __html: currentLesson.content }}
                                                    style={{
                                                        fontSize: '15px',
                                                        lineHeight: '1.7',
                                                        maxWidth: '60ch',
                                                        color: 'inherit'
                                                    }}
                                                />
                                            </div>
                                        </ContentProtection>
                                    </div>
                                </div>
                            )}

                            {/* Action Bar */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800 p-3">
                                <button
                                    onClick={() => currentLesson.id && handleLessonComplete(currentLesson.id)}
                                    disabled={markingComplete || isCompleted}
                                    className={cn(
                                        "flex items-center gap-1.5 px-4 py-2 rounded-md font-medium transition-all text-xs",
                                        isCompleted
                                            ? 'bg-emerald-600 text-white cursor-default'
                                            : 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-blue-400'
                                    )}
                                >
                                    {isCompleted ? (
                                        <>
                                            <CheckCircle className="w-3.5 h-3.5" />
                                            Completada
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-3.5 h-3.5" />
                                            Marcar como completada
                                        </>
                                    )}
                                </button>

                                {lessonsInOrder.indexOf(currentLesson) < lessonsInOrder.length - 1 && !isCompleted && (
                                    <button
                                        onClick={() => {
                                            const nextLesson = lessonsInOrder[lessonsInOrder.indexOf(currentLesson) + 1];
                                            if (nextLesson?.id) setSelectedLessonId(nextLesson.id);
                                        }}
                                        className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium text-xs transition-colors"
                                    >
                                        Siguiente lección
                                        <ChevronRight className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </div>
                ) : (
                    <div className="h-full flex items-center justify-center px-3">
                        <div className="text-center">
                            <BookOpen className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                No hay lecciones en este módulo
                            </p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Academy;