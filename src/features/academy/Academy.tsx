import { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './academy-minimal.css';
import './academy-lesson-detail.css';
import './academy-lessons-grid.css';
import ContentProtection from './components/ContentProtection';
import LearningPath from './components/LearningPath';
import FocusMode from './components/FocusMode';
import CelebrationModal from './components/CelebrationModal';
import { ModuleSkeleton, EmptyState, LoadingState } from './components/AcademyStates';
import { useAuth } from '../../context/AuthContext';
import {
    useAcademyModules,
    useAcademyModule,
    useAcademyLessons,
    useAcademyProgress,
    useMarkLessonComplete
} from '../../hooks/academy';
import { AcademyLesson } from '../../services/academyService';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import {
    BookOpen,
    Play,
    CheckCircle,
    Clock,
    ArrowLeft,
    ChevronRight,
    ChevronLeft,
    Youtube,
    FileText,
    Lock,
    Sparkles,
    Trophy,
    Target
} from 'lucide-react';

const Academy = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { moduleId } = useParams();
    const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
    const [selectedView, setSelectedView] = useState<'video' | 'text'>('video');
    const [showInitialModal, setShowInitialModal] = useState(false);
    const [isVideoExpanded, setIsVideoExpanded] = useState(false);
    const [focusMode, setFocusMode] = useState(false);
    const [celebration, setCelebration] = useState<{
        isOpen: boolean;
        moduleTitle: string;
        moduleNumber: number;
    }>({ isOpen: false, moduleTitle: '', moduleNumber: 0 });
    const videoRef = useRef<HTMLIFrameElement>(null);

    // Temporal: Cargar todos los módulos y filtrar client-side para debug
    const { modules: allModules, loading: modulesLoading } = useAcademyModules('all');
    
    // Filtrar módulos activos (o sin campo status definido para compatibilidad)
    const modules = useMemo(() => {
        console.log('[Academy] Todos los módulos:', allModules);
        const filtered = allModules.filter(m => m.status === 'active' || !m.status);
        console.log('[Academy] Módulos filtrados (active):', filtered);
        return filtered;
    }, [allModules]);
    const { module, loading: moduleLoading } = useAcademyModule(moduleId || null);
    // Temporal: Cargar todas las lecciones y filtrar client-side para debug
    const { lessons: allLessons, loading: lessonsLoading } = useAcademyLessons(moduleId || null, 'all');
    
    // Filtrar lecciones publicadas (o sin campo status definido para compatibilidad)
    const lessons = useMemo(() => {
        console.log('[Academy] Todas las lecciones del módulo:', allLessons);
        const filtered = allLessons.filter(l => l.status === 'published' || !l.status);
        console.log('[Academy] Lecciones filtradas (published):', filtered);
        return filtered;
    }, [allLessons]);
    const { progress } = useAcademyProgress(user?.uid || null, moduleId || null);
    const { markComplete, loading: markingComplete } = useMarkLessonComplete();
    
    // Verificar que el módulo esté activo para franquicias
    const activeModule = useMemo(() => {
        if (!module) return null;
        // Si el módulo no está activo, no mostrarlo
        if (module.status !== 'active') return null;
        return module;
    }, [module]);

    const completedLessons = useMemo(() => progress?.completed_lessons || [], [progress]);
    const lessonsInOrder = useMemo(() => {
        return [...lessons].sort((a, b) => a.order - b.order);
    }, [lessons]);

    const currentLesson = useMemo(() => {
        if (selectedLessonId) {
            const foundLesson = lessons.find(l => l.id === selectedLessonId);
            if (foundLesson) {
                return foundLesson;
            }
            return null;
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

    const handleBackToModules = () => {
        navigate('/academy');
    };

    const handleBackToLessons = () => {
        setSelectedLessonId(null);
        setSelectedView('video');
        setIsVideoExpanded(false);
    };

    const handleSelectModule = (modId: string) => {
        // Reset lesson selection when changing modules
        setSelectedLessonId(null);
        setSelectedView('video');
        setShowInitialModal(false);
        navigate(`/academy/${modId}`);
    };

    const handleSelectLesson = (lessonId: string) => {
        const lesson = lessons.find(l => l.id === lessonId);
        if (!lesson) {
            return;
        }

        const hasVideo = lesson.video_url && lesson.video_url.trim().length > 0;
        const hasText = lesson.content && lesson.content.trim().length > 0;

        setIsVideoExpanded(false);

        // Always show modal if lesson has both video and text
        if (hasVideo && hasText) {
            setSelectedLessonId(lessonId);
            setShowInitialModal(true);
        } else {
            // If only one type, go directly to it
            setSelectedLessonId(lessonId);
            setSelectedView(hasVideo ? 'video' : 'text');
            setShowInitialModal(false);
        }
    };

    const handlePreferredView = (view: 'video' | 'text') => {
        setSelectedView(view);
        setShowInitialModal(false);
    };

    const handleNavigatePrevious = () => {
        const currentIndex = lessonsInOrder.findIndex(l => l.id === currentLesson?.id);
        if (currentIndex > 0) {
            const prevLesson = lessonsInOrder[currentIndex - 1];
            if (prevLesson?.id) {
                handleSelectLesson(prevLesson.id);
            }
        }
    };

    const handleNavigateNext = () => {
        const currentIndex = lessonsInOrder.findIndex(l => l.id === currentLesson?.id);
        if (currentIndex < lessonsInOrder.length - 1) {
            const nextLesson = lessonsInOrder[currentIndex + 1];
            if (nextLesson?.id) {
                handleSelectLesson(nextLesson.id);
            }
        }
    };

    const extractYouTubeId = (url: string) => {
        const regex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/;
        const match = url.match(regex);
        return match ? match[1] : null;
    };

    // Prevent iframe interactions
    useEffect(() => {
        const iframe = videoRef.current;
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

    if (modulesLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-slate-950 dark:via-purple-950/20 dark:to-slate-900">
                <div className="max-w-6xl mx-auto px-4 py-8 sm:py-16">
                    <LoadingState />
                </div>
            </div>
        );
    }

    if (!moduleId) {
        const totalModules = modules.length;
        const completedModules = modules.filter(m => {
            const moduleLessons = allLessons.filter(l => l.module_id === m.id);
            const moduleCompletedLessons = moduleLessons.filter(l => completedLessons.includes(l.id || ''));
            return moduleLessons.length > 0 && moduleCompletedLessons.length === moduleLessons.length;
        }).length;
        const globalProgress = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-slate-950 dark:via-purple-950/20 dark:to-slate-900">
                {/* Background Decorations */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-300/30 dark:bg-purple-600/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-300/30 dark:bg-pink-600/10 rounded-full blur-3xl" />
                </div>

                <div className="relative max-w-6xl mx-auto px-4 py-8 sm:py-16">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="text-center mb-16"
                    >
                        {/* Badge de bienvenida */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 }}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-full shadow-lg mb-6"
                        >
                            <Sparkles className="w-4 h-4 text-amber-500" />
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                ¡Comienza tu viaje de aprendizaje!
                            </span>
                        </motion.div>

                        {/* Título principal */}
                        <motion.h1 
                            className="text-5xl sm:text-6xl font-black text-slate-900 dark:text-white mb-6 tracking-tight"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent">
                                Tu Ruta de
                            </span>
                            <br />
                            <span className="text-slate-900 dark:text-white">Aprendizaje</span>
                        </motion.h1>

                        {/* Subtítulo */}
                        <motion.p 
                            className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-8 leading-relaxed"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                        >
                            Completa cada módulo para desbloquear el siguiente.
                            <br className="hidden sm:block" />
                            Tu progreso se guarda automáticamente.
                        </motion.p>

                        {/* Stats globales */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="flex flex-wrap justify-center gap-6"
                        >
                            <div className="flex items-center gap-3 px-6 py-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-lg">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                    <BookOpen className="w-6 h-6 text-white" />
                                </div>
                                <div className="text-left">
                                    <p className="text-2xl font-black text-slate-900 dark:text-white">{totalModules}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Módulos</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 px-6 py-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-lg">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                                    <Trophy className="w-6 h-6 text-white" />
                                </div>
                                <div className="text-left">
                                    <p className="text-2xl font-black text-slate-900 dark:text-white">{completedModules}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Completados</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 px-6 py-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-lg">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                                    <Target className="w-6 h-6 text-white" />
                                </div>
                                <div className="text-left">
                                    <p className="text-2xl font-black text-slate-900 dark:text-white">{globalProgress}%</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Progreso</p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Barra de progreso global */}
                        <motion.div
                            initial={{ opacity: 0, scaleX: 0 }}
                            animate={{ opacity: 1, scaleX: 1 }}
                            transition={{ delay: 0.6, duration: 0.8 }}
                            className="max-w-md mx-auto mt-8"
                        >
                            <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${globalProgress}%` }}
                                    transition={{ delay: 0.8, duration: 1, ease: "easeOut" }}
                                    className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 rounded-full"
                                />
                            </div>
                        </motion.div>
                    </motion.div>

                    {/* Learning Path */}
                    {modules.length > 0 ? (
                        <LearningPath
                            modules={modules}
                            completedLessons={completedLessons}
                            allLessons={allLessons
                                .filter((l): l is AcademyLesson & { id: string; module_id: string } =>
                                    typeof l.id === 'string' && typeof l.module_id === 'string'
                                )
                                .map(l => ({ id: l.id, module_id: l.module_id }))
                            }
                            currentModuleId={activeModule?.id}
                            onSelectModule={handleSelectModule}
                        />
                    ) : (
                        <EmptyState />
                    )}
                    
                    {/* Celebration Modal */}
                    <CelebrationModal
                        isOpen={celebration.isOpen}
                        onClose={() => setCelebration({ ...celebration, isOpen: false })}
                        moduleTitle={celebration.moduleTitle}
                        moduleNumber={celebration.moduleNumber}
                    />
                </div>
            </div>
        );
    }

    if (moduleLoading || lessonsLoading) {
        return (
            <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Cargando módulo...</p>
                </div>
            </div>
        );
    }

    if (!activeModule) {
        return (
            <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
                <div className="text-center">
                    <BookOpen className="w-16 h-16 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
                    <p className="text-lg font-semibold text-slate-600 dark:text-slate-400">Módulo no encontrado o no disponible</p>
                    <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">Este módulo no está publicado o ha sido desactivado</p>
                    <button
                        onClick={handleBackToModules}
                        className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition-colors"
                    >
                        Volver a módulos
                    </button>
                </div>
            </div>
        );
    }

    const isCompleted = currentLesson?.id ? completedLessons.includes(currentLesson.id) : false;
    const youtubeId = currentLesson?.video_url ? extractYouTubeId(currentLesson.video_url || '') : null;
    const hasVideo = !!currentLesson?.video_url && currentLesson.video_url.trim().length > 0 && !!youtubeId;
    const hasText = !!currentLesson?.content && currentLesson.content.trim().length > 0;

    return (
        <div className="academy-container h-screen flex flex-col lg:flex-row">
            {/* Initial Selection Modal */}
            <AnimatePresence>
                {showInitialModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowInitialModal(false)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ duration: 0.2 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden"
                        >
                            <div className="p-6">
                                <div className="text-center mb-6">
                                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                                        <BookOpen className="w-8 h-8 text-white" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                                        ¿Cómo prefieres aprender?
                                    </h2>
                                    <p className="text-slate-600 dark:text-slate-400 text-sm">
                                        Esta lección tiene video y contenido escrito. Elige con qué quieres comenzar.
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    {hasVideo && (
                                        <button
                                            onClick={() => handlePreferredView('video')}
                                            className="w-full flex items-center gap-4 p-4 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                                        >
                                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                                                <Youtube className="w-6 h-6" />
                                            </div>
                                            <div className="text-left flex-1">
                                                <div className="font-bold">Ver Video</div>
                                                <div className="text-sm opacity-90">Aprende visualmente</div>
                                            </div>
                                        </button>
                                    )}
                                    {hasText && (
                                        <button
                                            onClick={() => handlePreferredView('text')}
                                            className="w-full flex items-center gap-4 p-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                                        >
                                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                                                <FileText className="w-6 h-6" />
                                            </div>
                                            <div className="text-left flex-1">
                                                <div className="font-bold">Leer Contenido</div>
                                                <div className="text-sm opacity-90">Aprende a tu ritmo</div>
                                            </div>
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
                                <p className="text-xs text-center text-slate-500 dark:text-slate-400">
                                    Podrás cambiar entre video y texto cuando quieras
                                </p>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

                    {/* Sidebar - Desktop only */}
                    <aside className="academy-sidebar">
                        <div className="academy-sidebar-header">
                            <button
                                onClick={handleBackToModules}
                                className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 text-sm font-semibold mb-3 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                <span>Volver a módulos</span>
                            </button>
                            <h2 className="academy-sidebar-title">{activeModule.title}</h2>
                            <p className="academy-sidebar-description line-clamp-2">{activeModule.description}</p>
                        </div>

                        <div className="academy-sidebar-progress">
                            <div className="academy-sidebar-progress-header">
                                <span className="academy-sidebar-progress-label">Tu progreso</span>
                                <span className="academy-sidebar-progress-percentage">{getProgressPercentage()}%</span>
                            </div>
                            <div className="academy-sidebar-progress-bar">
                                <motion.div
                                    className="academy-module-progress-fill"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${getProgressPercentage()}%` }}
                                    transition={{ duration: 0.5 }}
                                />
                            </div>
                        </div>

                        <div className="academy-lessons-list">
                            {lessonsInOrder.map((lesson, index) => {
                                const lessonCompleted = completedLessons.includes(lesson.id!);
                                const isSelected = currentLesson?.id === lesson.id;
                                const isLocked = !lessonCompleted && index > 0 && !completedLessons.includes(lessonsInOrder[index - 1].id!);
                                const hasVideo = lesson.video_url && lesson.video_url.trim().length > 0;
                                const hasText = lesson.content && lesson.content.trim().length > 0;

                                return (
                                    <motion.button
                                        key={lesson.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.02 }}
                                        onClick={() => !isLocked && handleSelectLesson(lesson.id!)}
                                        disabled={isLocked}
                                        className={cn(
                                            'academy-lesson-item w-full text-left',
                                            isSelected && 'active',
                                            lessonCompleted && 'completed',
                                            isLocked && 'disabled'
                                        )}
                                    >
                                        <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                            <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                                                {isLocked ? 'bg-slate-200 dark:bg-slate-700 text-slate-500' :
                                                 lessonCompleted ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' :
                                                 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'}">
                                                {isLocked ? <Lock className="w-4 h-4" /> :
                                                 lessonCompleted ? <CheckCircle className="w-5 h-5" /> :
                                                 index + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-semibold text-slate-900 dark:text-white text-sm mb-1 truncate">
                                                    {lesson.title}
                                                </h4>
                                                <div className="flex items-center gap-2 text-xs">
                                                    {hasVideo && (
                                                        <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                                                            <Youtube className="w-3 h-3" />
                                                            Video
                                                        </span>
                                                    )}
                                                    {hasText && (
                                                        <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                                                            <FileText className="w-3 h-3" />
                                                            Texto
                                                        </span>
                                                    )}
                                                    <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                                                        <Clock className="w-3 h-3" />
                                                        {lesson.duration}m
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.button>
                                );
                            })}
                        </div>
                    </aside>

                    <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950">
                        {!selectedLessonId ? (
                            <div className="max-w-6xl mx-auto py-6 px-4">
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4 }}
                                    className="academy-lesson-header"
                                >
                                    <h1 className="academy-title">{activeModule.title}</h1>
                                    <p className="academy-description">{activeModule.description}</p>

                                    <div className="flex flex-wrap items-center gap-3 mt-4">
                                        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-full border border-blue-200 dark:border-blue-800">
                                            <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                            <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">{lessons.length} lecciones</span>
                                        </div>
                                        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-full border border-emerald-200 dark:border-emerald-800">
                                            <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                            <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">{getProgressPercentage()} completado</span>
                                        </div>
                                    </div>
                                </motion.div>

                                <div className="academy-lessons-grid">
                                    {lessonsInOrder.map((lesson, index) => {
                                        const lessonCompleted = completedLessons.includes(lesson.id!);
                                        const lessonYtId = lesson.video_url ? extractYouTubeId(lesson.video_url) : null;
                                        const isLocked = !lessonCompleted && index > 0 && !completedLessons.includes(lessonsInOrder[index - 1].id!);

                                        return (
                                            <motion.div
                                                key={lesson.id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                className="h-full"
                                            >
                                                <div
                                                    onClick={() => !isLocked && handleSelectLesson(lesson.id!)}
                                                    className={cn(
                                                        'relative bg-white dark:bg-slate-900 rounded-2xl shadow-lg border-2 transition-all overflow-hidden cursor-pointer group',
                                                        isLocked
                                                            ? 'border-slate-200 dark:border-slate-700 opacity-60'
                                                            : 'border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-xl'
                                                    )}
                                                >
                                                    {/* Thumbnail Section */}
                                                    <div className="relative h-40 bg-slate-900 overflow-hidden">
                                                        {lessonYtId ? (
                                                            <img
                                                                src={`https://img.youtube.com/vi/${lessonYtId}/hqdefault.jpg`}
                                                                alt={lesson.title}
                                                                className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                                                                loading="lazy"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                                                                <FileText className="w-16 h-16 text-slate-600" />
                                                            </div>
                                                        )}

                                                        {/* Number Badge */}
                                                        <div className="absolute top-3 left-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-lg">
                                                            <span className="text-sm font-bold text-slate-900 dark:text-white">
                                                                {index + 1}
                                                            </span>
                                                        </div>

                                                        {/* Type Badge */}
                                                        <div className="absolute top-3 right-3 flex gap-2">
                                                            {lessonYtId && (
                                                                <div className="bg-red-500/90 backdrop-blur-sm px-2 py-1 rounded-lg shadow-lg">
                                                                    <Youtube className="w-4 h-4 text-white" />
                                                                </div>
                                                            )}
                                                            {lesson.content && lesson.content.trim().length > 0 && (
                                                                <div className="bg-blue-500/90 backdrop-blur-sm px-2 py-1 rounded-lg shadow-lg">
                                                                    <FileText className="w-4 h-4 text-white" />
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Completion Badge */}
                                                        {lessonCompleted && (
                                                            <div className="absolute bottom-3 right-3 bg-emerald-500 px-2 py-1 rounded-lg shadow-lg">
                                                                <CheckCircle className="w-4 h-4 text-white" />
                                                            </div>
                                                        )}

                                                        {/* Lock Overlay */}
                                                        {isLocked && (
                                                            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
                                                                <Lock className="w-10 h-10 text-slate-300" />
                                                            </div>
                                                        )}

                                                        {/* Duration Badge */}
                                                        <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-lg">
                                                            <div className="flex items-center gap-1.5 text-white text-xs font-semibold">
                                                                <Clock className="w-3.5 h-3.5" />
                                                                {lesson.duration}m
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Content Section */}
                                                    <div className="p-4">
                                                        <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                            {lesson.title}
                                                        </h3>
                                                        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                                                            <span className="flex items-center gap-1.5">
                                                                {lessonCompleted ? (
                                                                    <>
                                                                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                                                                        Completado
                                                                    </>
                                                                ) : isLocked ? (
                                                                    <>
                                                                        <Lock className="w-3.5 h-3.5" />
                                                                        Bloqueado
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Play className="w-3.5 h-3.5" />
                                                                        Disponible
                                                                    </>
                                                                )}
                                                            </span>
                                                            <span>
                                                                {lessonYtId && lesson.content ? 'Video + Texto' : lessonYtId ? 'Video' : 'Texto'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}

                                    {lessons.length === 0 && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="col-span-full"
                                        >
                                            <div className="academy-empty-state">
                                                <BookOpen className="academy-empty-icon" />
                                                <p className="academy-empty-title">No hay lecciones</p>
                                                <p className="academy-empty-description">El contenido se agregará pronto</p>
                                            </div>
                                        </motion.div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <FocusMode isActive={focusMode} onToggle={() => setFocusMode(!focusMode)}>
                            <div className="academy-lesson-detail">
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4 }}
                                    className="h-full flex flex-col"
                                >
                            {/* Header */}
                            <div className="academy-lesson-header">
                                <button
                                    onClick={handleBackToLessons}
                                    className="academy-lesson-back-button"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Volver a lecciones
                                </button>
                            </div>

                            {/* Title */}
                            <h1 className="academy-lesson-title-large">{currentLesson?.title}</h1>

                            {/* Tabs Toggle */}
                            {(hasVideo || hasText) && (
                                <div className="mb-4">
                                    <div className="academy-lesson-tabs">
                                        {hasVideo && (
                                            <button
                                                onClick={() => setSelectedView('video')}
                                                className={selectedView === 'video' ? 'active' : ''}
                                            >
                                                <Youtube className="w-4 h-4" />
                                                <span className="ml-2">Video</span>
                                            </button>
                                        )}
                                        {hasText && (
                                            <button
                                                onClick={() => setSelectedView('text')}
                                                className={selectedView === 'text' ? 'active' : ''}
                                            >
                                                <FileText className="w-4 h-4" />
                                                <span className="ml-2">Contenido</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Navigation Bar - Above Content */}
                            <div className="flex items-center justify-between mb-6 px-1">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleNavigatePrevious}
                                        disabled={lessonsInOrder.findIndex(l => l.id === currentLesson?.id) <= 0}
                                        className={cn(
                                            'flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm',
                                            lessonsInOrder.findIndex(l => l.id === currentLesson?.id) <= 0 && 'opacity-50 cursor-not-allowed'
                                        )}
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                        <span className="hidden sm:inline">Anterior</span>
                                    </button>
                                    <button
                                        onClick={handleNavigateNext}
                                        disabled={lessonsInOrder.findIndex(l => l.id === currentLesson?.id) >= lessonsInOrder.length - 1}
                                        className={cn(
                                            'flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm',
                                            lessonsInOrder.findIndex(l => l.id === currentLesson?.id) >= lessonsInOrder.length - 1 && 'opacity-50 cursor-not-allowed'
                                        )}
                                    >
                                        <span className="hidden sm:inline">Siguiente</span>
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                        {lessonsInOrder.findIndex(l => l.id === currentLesson?.id) + 1} / {lessonsInOrder.length}
                                    </div>
                                    <div className="h-2 w-24 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-blue-600 transition-all duration-300"
                                            style={{
                                                width: `${((lessonsInOrder.findIndex(l => l.id === currentLesson?.id) + 1) / lessonsInOrder.length) * 100}%`
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Video Section */}
                            {hasVideo && selectedView === 'video' && youtubeId && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="mb-6"
                                >
                                    <div className="relative bg-black rounded-2xl overflow-hidden shadow-2xl cursor-pointer" onClick={() => setIsVideoExpanded(true)}>
                                        <motion.div
                                            animate={{
                                                height: isVideoExpanded ? 'auto' : '300px'
                                            }}
                                            transition={{ duration: 0.4, ease: 'easeInOut' }}
                                            className="relative overflow-hidden"
                                        >
                                            {!isVideoExpanded && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10 transition-opacity hover:bg-black/30">
                                                    <div className="w-20 h-20 bg-white/90 dark:bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center shadow-2xl">
                                                        <Play className="w-10 h-10 text-red-600 ml-1" />
                                                    </div>
                                                    <p className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white font-bold text-sm">
                                                        Click para expandir
                                                    </p>
                                                </div>
                                            )}

                                            <div style={{ aspectRatio: '16/9' }}>
                                                <iframe
                                                    ref={videoRef}
                                                    src={`https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1&playsinline=1&showinfo=0&iv_load_policy=3&controls=1&disablekb=1&fs=0&widget_referrer=${encodeURIComponent(window.location.href)}`}
                                                    title={currentLesson?.title || ''}
                                                    allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                    allowFullScreen
                                                    className="absolute inset-0 w-full h-full"
                                                    loading="lazy"
                                                    sandbox="allow-scripts allow-same-origin allow-presentation allow-forms"
                                                />
                                            </div>
                                        </motion.div>
                                    </div>

                                    {/* Video Info */}
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.2 }}
                                        className="mt-4 flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                                                <Youtube className="w-5 h-5 text-red-600 dark:text-red-400" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-slate-900 dark:text-white">Video Tutorial</h3>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                                    {currentLesson?.duration} minutos
                                                </p>
                                            </div>
                                        </div>
                                        {isVideoExpanded && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setIsVideoExpanded(false);
                                                }}
                                                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-300 transition-colors"
                                            >
                                                Minimizar
                                            </button>
                                        )}
                                    </motion.div>
                                </motion.div>
                            )}

                            {/* Video Loading/Error State */}
                            {hasVideo && selectedView === 'video' && !youtubeId && (
                                <div className="mb-6 p-8 bg-slate-100 dark:bg-slate-800 rounded-2xl text-center">
                                    <Youtube className="w-16 h-16 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
                                    <p className="text-slate-600 dark:text-slate-400 font-medium">
                                        Video no disponible
                                    </p>
                                    <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">
                                        El URL del video no es válido o no está disponible
                                    </p>
                                </div>
                            )}

                            {/* Content Section */}
                            {hasText && selectedView === 'text' && currentLesson?.content && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="mb-6"
                                >
                                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
                                        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                                                    <FileText className="w-5 h-5 text-white" />
                                                </div>
                                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Contenido de la Lección</h2>
                                            </div>
                                        </div>
                                        <ContentProtection>
                                            <div className="p-6">
                                                <div
                                                    className="prose prose-lg dark:prose-invert max-w-none"
                                                    dangerouslySetInnerHTML={{ __html: currentLesson.content }}
                                                />
                                            </div>
                                        </ContentProtection>
                                    </div>
                                </motion.div>
                            )}

                            {/* Action Bar */}
                            <div className="sticky bottom-0 z-10 mt-6 pt-4 pb-2 bg-gradient-to-t from-slate-50 dark:from-slate-950 to-transparent">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => currentLesson?.id && handleLessonComplete(currentLesson?.id)}
                                        disabled={markingComplete || isCompleted}
                                        className={cn(
                                            'flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm uppercase tracking-wide transition-all shadow-lg hover:shadow-xl',
                                            isCompleted
                                                ? 'bg-emerald-600 text-white cursor-default'
                                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                                        )}
                                    >
                                        <CheckCircle className="w-5 h-5" />
                                        {isCompleted ? 'Lección Completada' : 'Marcar como Completada'}
                                    </button>
                                </div>
                            </div>
                            </motion.div>
                            </div>
                            </FocusMode>
                        )}

                {/* Mensaje cuando se intentó acceder a una lección no disponible */}
                {selectedLessonId && !currentLesson && lessons.length > 0 && (
                    <div className="h-full flex items-center justify-center px-4">
                        <div className="text-center max-w-md">
                            <Lock className="w-16 h-16 text-amber-500 dark:text-amber-600 mx-auto mb-4" />
                            <p className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">
                                Lección no disponible
                            </p>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                                Esta lección no está publicada o ha sido desactivada temporalmente.
                            </p>
                            <button
                                onClick={() => setSelectedLessonId(null)}
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition-colors"
                            >
                                Ver lecciones disponibles
                            </button>
                        </div>
                    </div>
                )}

                {!currentLesson && !selectedLessonId && lessons.length === 0 && (
                    <div className="h-full flex items-center justify-center px-4">
                        <div className="text-center">
                            <BookOpen className="w-16 h-16 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
                            <p className="text-lg font-semibold text-slate-600 dark:text-slate-400">No hay lecciones</p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Academy;
