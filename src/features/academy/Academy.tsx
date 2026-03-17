import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './academy-minimal.css';
import './academy-lesson-detail.css';
import './academy-lessons-grid.css';
import LearningPath from './components/LearningPath';
import CelebrationModal from './components/CelebrationModal';
import AcademySidebar from './components/AcademySidebar';
import ModuleOverview from './components/ModuleOverview';
import LessonView from './components/LessonView';
import { EmptyState, LoadingState } from './components/AcademyStates';
import { useAuth } from '../../context/AuthContext';
import {
    useAcademyModules,
    useAcademyModule,
    useAcademyLessons,
    useAcademyAllLessons,
    useMarkLessonComplete,
    useUnmarkLessonComplete,
    useAcademyProfile,
    useAwardXp
} from '../../hooks/academy';
import { academyService } from '../../services/academyService';
import { calculateLevel, getXpForLesson, ACADEMY_LEVELS } from '../../lib/academyGamification';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
    BookOpen,
    Lock,
    Youtube,
    FileText
} from 'lucide-react';

interface UserModuleProgress {
    completed_lessons: string[];
    last_accessed?: string | number | Date;
}

const Academy = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { moduleId } = useParams();
    const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
    const [selectedView, setSelectedView] = useState<'video' | 'text'>('video');
    const [showInitialModal, setShowInitialModal] = useState(false);
    const [celebration, setCelebration] = useState<{
        isOpen: boolean;
        type: 'module_complete' | 'level_up';
        title: string;
        subtitle?: string;
        xpGained?: number;
    }>({
        isOpen: false,
        type: 'module_complete',
        title: '',
        subtitle: ''
    });
    const [notesOpen, setNotesOpen] = useState(false);

    // Gamification Hooks
    const { refetch: refreshProfile } = useAcademyProfile(user?.uid || null);
    const { awardXp } = useAwardXp();

    // Cargar todos los módulos
    const { modules: allModules, loading: modulesLoading } = useAcademyModules('all');

    // Filtrar módulos visibles según rol
    const visibleModules = useMemo(() => {
        const isAdmin = user?.role === 'admin' || user?.email?.includes('admin');
        if (isAdmin) return allModules;
        return allModules.filter(m => m.status === 'active');
    }, [allModules, user]);

    const { module, loading: moduleLoading } = useAcademyModule(moduleId || null);
    const { lessons: allLessons, loading: lessonsLoading } = useAcademyLessons(moduleId || null, 'all');
    const { lessons: allModulesLessons } = useAcademyAllLessons(visibleModules, 'published');

    // Lecciones del módulo actual
    const lessons = useMemo(() => {
        return allLessons.filter(l => l.status === 'published' || l.status === 'draft' || !l.status);
    }, [allLessons]);

    const [progress, setProgress] = useState<UserModuleProgress | null>(null);
    const [allProgress, setAllProgress] = useState<Record<string, UserModuleProgress | null>>({});
    const { markComplete, loading: markingComplete } = useMarkLessonComplete();
    const { unmarkComplete, loading: unmarkingComplete } = useUnmarkLessonComplete();

    const completedLessons = useMemo(() => progress?.completed_lessons || [], [progress]);
    const lessonsInOrder = useMemo(() => {
        return [...lessons].sort((a, b) => a.order - b.order);
    }, [lessons]);

    const currentLesson = useMemo(() => {
        if (selectedLessonId) {
            return lessons.find(l => l.id === selectedLessonId) || null;
        }
        if (lessons.length > 0) {
            const firstUncompleted = lessons.find(l => !completedLessons.includes(l.id!));
            return firstUncompleted || lessons[0];
        }
        return null;
    }, [lessons, selectedLessonId, completedLessons]);

    // Cargar progreso
    useEffect(() => {
        const fetchProgress = async () => {
            if (user?.uid && moduleId) {
                try {
                    const data = await academyService.getUserProgress(user.uid, moduleId);
                    setProgress(data);
                } catch (error) {
                    console.error('Error fetching progress:', error);
                }
            } else if (user?.uid && !moduleId && visibleModules.length > 0) {
                try {
                    const progressPromises = visibleModules.map(async (m) => {
                        if (!m.id) return { [`temp-${Math.random()}`]: null };
                        const data = await academyService.getUserProgress(user.uid, m.id);
                        return { [m.id]: data };
                    });
                    const results = await Promise.all(progressPromises);
                    setAllProgress(results.reduce((acc, curr) => ({ ...acc, ...curr }), {}));
                } catch (error) {
                    console.error('Error fetching all progress:', error);
                }
            }
        };
        fetchProgress();
    }, [user?.uid, moduleId, visibleModules]);

    const handleLessonComplete = async (lessonId: string) => {
        if (!user?.uid || !moduleId) return;
        try {
            await markComplete(user.uid, moduleId, lessonId);
            const lesson = lessons.find(l => l.id === lessonId);
            if (lesson && lesson.content_type) {
                const xpAmount = getXpForLesson(lesson.content_type === 'quiz' ? 'quiz' : (lesson.content_type === 'video' ? 'video' : 'text'));
                const xpResult = await awardXp(user.uid, lessonId, xpAmount);
                if (xpResult && xpResult.awarded) {
                    refreshProfile();
                    toast.success(`¡Has ganado ${xpResult.xpGained} XP!`, { icon: '⚡' });
                    if (xpResult.levelUp) {
                        const newLevelInfo = calculateLevel(xpResult.newTotal);
                        const levelIndex = ACADEMY_LEVELS.findIndex(l => l.name === newLevelInfo.name) + 1;
                        setCelebration({
                            isOpen: true,
                            type: 'level_up',
                            title: newLevelInfo.name,
                            subtitle: `¡Has alcanzado el Nivel ${levelIndex}!`,
                            xpGained: xpResult.xpGained
                        });
                    } else {
                        const completedCount = lessons.filter(l => completedLessons.includes(l.id!) || l.id === lessonId).length;
                        if (completedCount === lessons.length && module) {
                            setCelebration({
                                isOpen: true,
                                type: 'module_complete',
                                title: module.title,
                                subtitle: '¡Módulo Completado!',
                                xpGained: xpResult.xpGained
                            });
                        }
                    }
                }
            }
            const newProgress = await academyService.getUserProgress(user.uid, moduleId);
            setProgress(newProgress);
        } catch (error) {
            console.error('Error marking complete:', error);
        }
    };

    const handleLessonUncomplete = async (lessonId: string) => {
        if (!user?.uid || !moduleId) return;
        try {
            await unmarkComplete(user.uid, moduleId, lessonId);
            const newProgress = await academyService.getUserProgress(user.uid, moduleId);
            setProgress(newProgress);
        } catch (error) {
            console.error('Error unmarking complete:', error);
        }
    };

    const handleBackToModules = () => navigate('/academy');
    const handleBackToLessons = () => {
        setSelectedLessonId(null);
        setSelectedView('video');
    };

    const handleSelectModule = (modId: string) => {
        setSelectedLessonId(null);
        navigate(`/academy/${modId}`);
    };

    const handleSelectLesson = (lessonId: string) => {
        const lesson = lessons.find(l => l.id === lessonId);
        if (!lesson) return;
        if (lesson.content_type === 'quiz') {
            setSelectedLessonId(lessonId);
            return;
        }
        const hasVideo = !!lesson.video_url;
        setSelectedLessonId(lessonId);
        setSelectedView(hasVideo ? 'video' : 'text');
    };



    if (modulesLoading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8">
                <LoadingState />
            </div>
        );
    }

    if (!moduleId) {
        const totalModules = visibleModules.length;
        const completedModules = visibleModules.filter(m => {
            const moduleLessons = allModulesLessons.filter(l => l.module_id === m.id);
            const moduleProgress = allProgress[m.id || ''];
            const moduleCompleted = moduleProgress?.completed_lessons || [];
            return moduleLessons.length > 0 && moduleLessons.every(l => l.id && moduleCompleted.includes(l.id));
        }).length;
        const globalProgress = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-slate-950 dark:via-purple-950/20 dark:to-slate-900 px-4 py-8 sm:py-16">
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                        <div>
                            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                                Academia <span className="text-blue-600">Repaart</span>
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Tu centro de formación profesional</p>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {[
                                { label: 'Módulos', val: totalModules, color: 'text-slate-900 dark:text-white' },
                                { label: 'Completados', val: completedModules, color: 'text-emerald-500' },
                                { label: 'Progreso', val: `${globalProgress}%`, color: 'text-blue-500' }
                            ].map((s, i) => (
                                <div key={i} className="bg-white dark:bg-slate-900/40 p-3 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm min-w-[120px]">
                                    <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{s.label}</p>
                                    <span className={cn("text-xl font-black", s.color)}>{s.val}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    {visibleModules.length > 0 ? (
                        <LearningPath
                            modules={visibleModules}
                            completedLessons={completedLessons}
                            allLessons={allModulesLessons.filter((l): l is any => !!l.id && !!l.module_id)}
                            currentModuleId={module?.id}
                            onSelectModule={handleSelectModule}
                            allProgress={allProgress}
                        />
                    ) : <EmptyState />}
                </div>
            </div>
        );
    }

    if (moduleLoading || lessonsLoading) {
        return (
            <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
                <LoadingState />
            </div>
        );
    }

    if (!module || (user?.role !== 'admin' && module.status !== 'active')) {
        return (
            <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
                <BookOpen className="w-16 h-16 text-slate-300 mb-4" />
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Módulo no disponible</h2>
                <button onClick={handleBackToModules} className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-xl">Volver</button>
            </div>
        );
    }

    const isCompleted = currentLesson?.id ? completedLessons.includes(currentLesson.id) : false;
    const hasVideo = !!currentLesson?.video_url;
    const hasText = !!currentLesson?.content;

    function cn(...classes: any[]) {
        return classes.filter(Boolean).join(' ');
    }

    return (
        <div className="academy-container h-screen flex flex-col">
            <AnimatePresence>
                {showInitialModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowInitialModal(false)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full p-8"
                        >
                            <div className="text-center mb-8">
                                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <BookOpen className="w-8 h-8 text-white" />
                                </div>
                                <h2 className="text-2xl font-bold dark:text-white">¿Cómo quieres empezar?</h2>
                            </div>
                            <div className="space-y-4">
                                {hasVideo && (
                                    <button onClick={() => { setSelectedView('video'); setShowInitialModal(false); }}
                                        className="w-full flex items-center gap-4 p-4 bg-red-600 text-white rounded-2xl font-bold">
                                        <Youtube className="w-6 h-6" /> Ver Video
                                    </button>
                                )}
                                {hasText && (
                                    <button onClick={() => { setSelectedView('text'); setShowInitialModal(false); }}
                                        className="w-full flex items-center gap-4 p-4 bg-blue-600 text-white rounded-2xl font-bold">
                                        <FileText className="w-6 h-6" /> Leer Texto
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <div className="flex flex-1 overflow-hidden h-[calc(100vh-64px)]">
                <AcademySidebar
                    lessons={lessonsInOrder}
                    selectedLessonId={currentLesson?.id || null}
                    completedLessons={completedLessons}
                    onSelectLesson={handleSelectLesson}
                />
                
                <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 relative">
                    {!selectedLessonId ? (
                        <ModuleOverview
                            module={module}
                            lessons={lessonsInOrder}
                            completedLessons={completedLessons}
                            onSelectLesson={handleSelectLesson}
                            lessonsLoading={lessonsLoading}
                            moduleId={moduleId}
                        />
                    ) : (
                        currentLesson ? (
                            <LessonView
                                currentLesson={currentLesson}
                                lessonsInOrder={lessonsInOrder}
                                onBack={handleBackToLessons}
                                onNavigate={handleSelectLesson}
                                onComplete={(id, completed) => completed ? handleLessonComplete(id) : handleLessonUncomplete(id)}
                                isCompleted={isCompleted}
                                markingComplete={markingComplete}
                                unmarkingComplete={unmarkingComplete}
                                moduleId={moduleId}
                                userId={user?.uid || ''}
                                notesOpen={notesOpen}
                                setNotesOpen={setNotesOpen}
                                selectedView={selectedView}
                                setSelectedView={setSelectedView}
                            />
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center">
                                <Lock className="w-16 h-16 text-amber-500 mb-4" />
                                <p className="text-lg font-bold">Lección no disponible</p>
                                <button onClick={handleBackToLessons} className="mt-4 text-blue-600 font-bold">Ver catálogo</button>
                            </div>
                        )
                    )}
                </main>
            </div>

            <CelebrationModal
                isOpen={celebration.isOpen}
                onClose={() => setCelebration({ ...celebration, isOpen: false })}
                type={celebration.type}
                title={celebration.title}
                subtitle={celebration.subtitle}
                xpGained={celebration.xpGained}
            />
        </div>
    );
};

export default Academy;
