import { motion, AnimatePresence } from 'framer-motion';
import { 
    ArrowLeft, 
    StickyNote, 
    Youtube, 
    FileText, 
    ChevronLeft, 
    ChevronRight,
    CheckCircle
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { AcademyLesson } from '../../../services/academyService';
import YouTubeHDPlayer from './YouTubeHDPlayer';
import ContentProtection from './ContentProtection';
import QuizPlayer from './QuizPlayer';
import LessonNotes from './LessonNotes';

interface LessonViewProps {
    currentLesson: AcademyLesson;
    lessonsInOrder: AcademyLesson[];
    onBack: () => void;
    onNavigate: (id: string) => void;
    onComplete: (id: string, completed: boolean) => void;
    isCompleted: boolean;
    markingComplete: boolean;
    unmarkingComplete: boolean;
    moduleId: string;
    userId: string;
    notesOpen: boolean;
    setNotesOpen: (open: boolean) => void;
    selectedView: 'video' | 'text';
    setSelectedView: (view: 'video' | 'text') => void;
}

const LessonView = ({
    currentLesson,
    lessonsInOrder,
    onBack,
    onNavigate,
    onComplete,
    isCompleted,
    markingComplete,
    unmarkingComplete,
    moduleId,
    userId,
    notesOpen,
    setNotesOpen,
    selectedView,
    setSelectedView
}: LessonViewProps) => {

    const extractYouTubeId = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const youtubeId = currentLesson?.video_url ? extractYouTubeId(currentLesson.video_url) : null;
    const hasVideo = !!currentLesson?.video_url;
    const hasText = !!currentLesson?.content && currentLesson.content.trim().length > 0;
    const isQuiz = currentLesson?.content_type === 'quiz';
    
    const currentIndex = lessonsInOrder.findIndex(l => l.id === currentLesson?.id);

    return (
        <div className="academy-lesson-detail h-full">
            <div className="max-w-6xl mx-auto px-4 pt-2">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="h-full flex flex-col"
                >
                    {/* Header */}
                    <div className="academy-lesson-header flex justify-between items-center mb-4">
                        <button
                            onClick={onBack}
                            className="academy-lesson-back-button"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Volver a lecciones
                        </button>

                        <button
                            onClick={() => setNotesOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 transition-all"
                        >
                            <StickyNote className="w-4 h-4" />
                            Mis Notas
                        </button>
                    </div>

                    {/* Title */}
                    <h1 className="academy-lesson-title-large">{currentLesson?.title}</h1>

                    {/* Tabs Toggle */}
                    {!isQuiz && (hasVideo || hasText) && (
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

                    {/* Navigation Bar */}
                    <div className="flex items-center justify-between mb-6 px-1">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => currentIndex > 0 && onNavigate(lessonsInOrder[currentIndex - 1].id!)}
                                disabled={currentIndex <= 0}
                                className={cn(
                                    'flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm',
                                    currentIndex <= 0 && 'opacity-50 cursor-not-allowed'
                                )}
                            >
                                <ChevronLeft className="w-4 h-4" />
                                <span className="hidden sm:inline">Anterior</span>
                            </button>
                            <button
                                onClick={() => currentIndex < lessonsInOrder.length - 1 && onNavigate(lessonsInOrder[currentIndex + 1].id!)}
                                disabled={currentIndex >= lessonsInOrder.length - 1}
                                className={cn(
                                    'flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm',
                                    currentIndex >= lessonsInOrder.length - 1 && 'opacity-50 cursor-not-allowed'
                                )}
                            >
                                <span className="hidden sm:inline">Siguiente</span>
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                {currentIndex + 1} / {lessonsInOrder.length}
                            </div>
                            <div className="h-2 w-24 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-blue-600 transition-all duration-300"
                                    style={{ width: `${((currentIndex + 1) / lessonsInOrder.length) * 100}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        {/* Video Content */}
                        {hasVideo && selectedView === 'video' && youtubeId && (
                            <motion.div
                                key="video"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="mb-6"
                            >
                                <div className="relative bg-black rounded-xl shadow-2xl overflow-hidden aspect-video">
                                    <YouTubeHDPlayer
                                        videoId={youtubeId}
                                        title={currentLesson.title}
                                    />
                                </div>
                                <div className="mt-4 flex items-center gap-3">
                                    <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                                        <Youtube className="w-5 h-5 text-red-600 dark:text-red-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-900 dark:text-white">Video Tutorial</h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            {currentLesson.duration} minutos
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Text Content */}
                        {hasText && selectedView === 'text' && currentLesson.content && (
                            <motion.div
                                key="text"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="mb-6"
                            >
                                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
                                    <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                                            <FileText className="w-5 h-5 text-white" />
                                        </div>
                                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Contenido de la Lección</h2>
                                    </div>
                                    <ContentProtection>
                                        <div className="p-6 prose prose-lg dark:prose-invert max-w-none">
                                            <div dangerouslySetInnerHTML={{ __html: currentLesson.content }} />
                                        </div>
                                    </ContentProtection>
                                </div>
                            </motion.div>
                        )}

                        {/* Quiz Content */}
                        {isQuiz && currentLesson.quiz && (
                            <motion.div
                                key="quiz"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-6"
                            >
                                <QuizPlayer
                                    questions={currentLesson.quiz}
                                    lessonId={currentLesson.id!}
                                    moduleId={moduleId}
                                    userId={userId}
                                    onComplete={(passed) => passed && onComplete(currentLesson.id!, true)}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Completion Button */}
                    {!isQuiz && (
                        <div className="mt-8 mb-4">
                            <button
                                onClick={() => onComplete(currentLesson.id!, !isCompleted)}
                                disabled={markingComplete || unmarkingComplete}
                                className={cn(
                                    'w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold text-sm uppercase tracking-wide transition-all shadow-lg hover:shadow-xl',
                                    isCompleted
                                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                                )}
                            >
                                <CheckCircle className={cn("w-5 h-5", isCompleted && "fill-current")} />
                                {isCompleted ? '✓ Completada (Click para desmarcar)' : 'Marcar como Completada'}
                            </button>
                        </div>
                    )}

                    {/* Lesson Notes */}
                    {currentLesson.id && (
                        <LessonNotes
                            lessonId={currentLesson.id}
                            isOpen={notesOpen}
                            onClose={() => setNotesOpen(false)}
                        />
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default LessonView;
