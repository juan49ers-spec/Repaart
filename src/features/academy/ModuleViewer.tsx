import { useState, useEffect, type FC } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle, BookOpen } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useModuleLessons, useMarkLessonComplete, useModuleQuiz, AcademyModule, Lesson } from '../../hooks/useAcademy';
import { useAuth } from '../../context/AuthContext';
import QuizEngine from './QuizEngine';
import CalculatorWidget from './CalculatorWidget';
// import VideoPlayer from './VideoPlayer'; // Deprecated for CinemaPro
import { CinemaPlayer } from './player/CinemaPlayer';
import { NoteTaker } from './player/NoteTaker';
import CaseStudyWidget from './CaseStudyWidget';
import { LessonSidebar } from './LessonSidebar';

interface ModuleViewerProps {
    module: AcademyModule;
    onBack: () => void;
}

/**
 * Module Viewer - Vista de consumo premium
 * Diseño "Focus Mode" con sidebar de navegación y contenido inmersivo
 */
const ModuleViewer: FC<ModuleViewerProps> = ({ module, onBack }) => {
    const { user } = useAuth();
    const { lessons, loading } = useModuleLessons(module?.id || '');
    const { quiz } = useModuleQuiz(module?.id || '');
    const markComplete = useMarkLessonComplete();

    const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
    const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
    const [showQuiz, setShowQuiz] = useState(false);

    const currentLesson = lessons[currentLessonIndex] as Lesson;
    const isFirstLesson = currentLessonIndex === 0;
    const isLastLesson = currentLessonIndex === lessons.length - 1;
    const allLessonsCompleted = completedLessons.size === lessons.length && lessons.length > 0;

    const [isSidebarOpen, setSidebarOpen] = useState(true);

    // Auto-scroll to top when lesson changes
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [currentLessonIndex]);

    // Mostrar quiz cuando se completan todas las lecciones
    useEffect(() => {
        if (allLessonsCompleted && quiz && !showQuiz) {
            const timer = setTimeout(() => setShowQuiz(true), 1500);
            return () => clearTimeout(timer);
        }
    }, [allLessonsCompleted, quiz, showQuiz]);

    const handleLessonSelect = (lessonId: string) => {
        const index = lessons.findIndex(l => l.id === lessonId);
        if (index !== -1) setCurrentLessonIndex(index);
    };

    const handleMarkComplete = async () => {
        if (!currentLesson || !user) return;
        try {
            await markComplete(user.uid, module?.id || '', currentLesson.id || '');
            if (module?.id) {
                setCompletedLessons(prev => {
                    const newSet = new Set(prev);
                    newSet.add(currentLesson.id || '');
                    return newSet;
                });
                if (!isLastLesson) setCurrentLessonIndex(prev => prev + 1);
            }
        } catch (error) {
            console.error('Error marking lesson complete:', error);
        }
    };

    const handleNext = () => {
        if (!isLastLesson) setCurrentLessonIndex(prev => prev + 1);
    };

    const handlePrevious = () => {
        if (!isFirstLesson) setCurrentLessonIndex(prev => prev - 1);
    };

    // Helper to render content with widgets
    const renderContentWithWidgets = (content: string) => {
        if (!content) return null;
        const parts = content.split(/({{WIDGET:[^}]+}}|{{VIDEO:[^}]+}}|{{CASE:[^}]+}})/g);

        return parts.map((part, index) => {
            if (part.startsWith('{{WIDGET:')) {
                const widgetType = part.replace('{{WIDGET:', '').replace('}}', '').toLowerCase();
                if (widgetType.startsWith('calculator_')) {
                    const calcType = widgetType.replace('calculator_', '') as 'profitability' | 'roi' | 'taxes' | 'breakeven' | 'pricing' | 'fleet';
                    return (
                        <div key={index} className="my-16 -mx-6 md:-mx-12 lg:-mx-20 shadow-2xl shadow-indigo-200/50 rounded-3xl overflow-hidden border border-indigo-50">
                            <CalculatorWidget type={calcType} />
                        </div>
                    );
                }
                return null;
            }

            if (part.startsWith('{{VIDEO:')) {
                const videoUrl = part.replace('{{VIDEO:', '').replace('}}', '');
                return (
                    <div key={index} className="my-12">
                        <CinemaPlayer url={videoUrl} title={`Video - ${currentLesson?.title || 'Lección'}`} />
                    </div>
                );
            }

            if (part.startsWith('{{CASE:')) {
                const caseId = part.replace('{{CASE:', '').replace('}}', '').toLowerCase();
                return (
                    <div key={index} className="my-16">
                        <CaseStudyWidget caseId={caseId} />
                    </div>
                );
            }

            // Enhanced Typography for Markdown - "The Atlantic" / "Medium" style
            return (
                <div key={index} className="prose prose-lg prose-slate max-w-none text-slate-700 leading-8 font-serif">
                    <ReactMarkdown
                        components={{
                            h1: ({ ...props }) => <h1 className="text-4xl md:text-5xl font-sans font-black text-slate-900 mb-8 mt-16 tracking-tight leading-tight" {...props} />,
                            h2: ({ ...props }) => <h2 className="text-2xl md:text-3xl font-sans font-bold text-slate-900 mb-6 mt-12 tracking-tight border-b border-indigo-100 pb-2" {...props} />,
                            h3: ({ ...props }) => <h3 className="text-xl font-sans font-bold text-slate-900 mb-4 mt-8 text-indigo-900" {...props} />,
                            p: ({ ...props }) => <p className="mb-6 text-xl text-slate-600 leading-relaxed font-serif" {...props} />,
                            ul: ({ ...props }) => <ul className="list-disc pl-6 mb-8 space-y-3 marker:text-indigo-500 text-lg" {...props} />,
                            ol: ({ ...props }) => <ol className="list-decimal pl-6 mb-8 space-y-3 marker:text-indigo-500 font-bold text-lg" {...props} />,
                            li: ({ ...props }) => <li className="pl-2" {...props} />,
                            blockquote: ({ ...props }) => (
                                <blockquote className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50 to-white pl-8 py-6 my-10 rounded-r-2xl italic text-slate-700 font-serif text-2xl shadow-sm" {...props} />
                            ),
                            code: ({ inline, ...props }: { inline?: boolean; className?: string; children?: React.ReactNode;[key: string]: any }) =>
                                inline
                                    ? <code className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-mono text-base font-bold border border-indigo-100/50" {...props} />
                                    : <code className="block bg-slate-900 text-slate-50 p-6 rounded-2xl font-mono text-sm overflow-x-auto my-10 shadow-2xl shadow-indigo-900/10 border border-slate-700 leading-relaxed" {...props} />,
                            strong: ({ ...props }) => <strong className="font-bold text-slate-900" {...props} />,
                            a: ({ ...props }) => <a className="text-indigo-600 hover:text-indigo-800 font-bold underline decoration-2 decoration-indigo-200 hover:decoration-indigo-600 transition-all" {...props} />,
                            img: ({ ...props }) => <img className="rounded-2xl shadow-lg my-10 w-full object-cover ring-1 ring-slate-900/5" {...props} alt={props.alt || 'Lesson Image'} />,
                            hr: ({ ...props }) => <hr className="my-16 border-slate-200" {...props} />
                        }}
                    >
                        {part}
                    </ReactMarkdown>
                </div>
            );
        });
    };

    // States Handling
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <div className="text-center">
                    <BookOpen className="w-16 h-16 mx-auto mb-6 text-indigo-500 animate-pulse" />
                    <p className="text-slate-400 font-medium text-lg">Cargando experiencia de aprendizaje...</p>
                </div>
            </div>
        );
    }

    if (lessons.length === 0) {
        return (
            <div className="p-12 max-w-4xl mx-auto text-center">
                <button onClick={onBack} className="text-slate-400 hover:text-slate-600 mb-8 flex items-center gap-2 mx-auto transition" aria-label="Volver" title="Volver">
                    <ArrowLeft className="w-5 h-5" /> Volver
                </button>
                <div className="bg-white border border-slate-200 rounded-3xl p-12 shadow-xl">
                    <BookOpen className="w-20 h-20 mx-auto mb-6 text-slate-200" />
                    <h3 className="text-2xl font-black text-slate-900 mb-2">Próximamente</h3>
                    <p className="text-slate-500 text-lg">Estamos preparando el contenido de este módulo.</p>
                </div>
            </div>
        );
    }

    if (showQuiz && quiz) {
        return <QuizEngine quiz={quiz} module={module} onComplete={onBack} />;
    }

    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-white font-sans selection:bg-indigo-100 selection:text-indigo-900">
            {/* LEFT SIDEBAR: Linear Navigation - Glassmorphism Style */}
            <div className={`hidden md:block transition-all duration-300 ease-in-out border-r border-slate-100 bg-white/80 backdrop-blur-xl sticky top-0 h-screen z-30 ${isSidebarOpen ? 'w-80' : 'w-0 overflow-hidden'}`}>
                <LessonSidebar
                    lessons={lessons}
                    currentLessonId={currentLesson?.id || ''}
                    completedLessons={completedLessons}
                    onSelectLesson={handleLessonSelect}
                    title={module.title}
                    description={module.description}
                    onBack={onBack}
                />
            </div>

            {/* Toggle Sidebar Button (Floating) */}
            <button
                onClick={() => setSidebarOpen(!isSidebarOpen)}
                className="hidden md:flex fixed bottom-6 left-6 z-40 p-3 bg-white/80 backdrop-blur-md border border-slate-200 text-slate-400 hover:text-indigo-600 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105"
                title={isSidebarOpen ? "Ocultar menú" : "Mostrar menú"}
            >
                {isSidebarOpen ? <ArrowLeft className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
            </button>


            {/* MAIN CONTENT AREA */}
            <div className="flex-1 min-h-screen relative w-full">

                {/* Aurora Header Background */}
                <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-indigo-50/80 via-white/50 to-white -z-10 pointer-events-none" />
                <div className="absolute top-0 left-0 right-0 h-[600px] overflow-hidden -z-20 pointer-events-none opacity-30">
                    <div className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.1),transparent_50%)] animate-pulse" />
                    <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[radial-gradient(circle_at_50%_50%,rgba(236,72,153,0.05),transparent_50%)] blur-3xl" />
                </div>


                {/* Mobile Header */}
                <div className="md:hidden sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 px-4 py-3 flex items-center justify-between shadow-sm">
                    <button onClick={onBack} className="p-2 -ml-2 text-slate-500 hover:text-slate-900 transition" aria-label="Volver" title="Volver">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <span className="font-bold text-slate-900 truncate max-w-[200px] text-sm">{module.title}</span>
                    <div className="w-8" />
                </div>

                <div className={`mx-auto transition-all duration-300 ${isSidebarOpen ? 'max-w-4xl px-8 md:px-16' : 'max-w-5xl px-8 md:px-24'} py-12 md:py-20 animate-fade-in pb-40`}>
                    {/* Lesson Header */}
                    <header className="mb-16 relative">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="flex items-center gap-2">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-900 text-white text-xs font-bold shadow-md shadow-slate-900/20">
                                    {currentLessonIndex + 1}
                                </span>
                                <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">
                                    de {lessons.length} Lecciones
                                </span>
                            </div>

                            {completedLessons.has(currentLesson?.id || '') && (
                                <span className="bg-emerald-100/50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border border-emerald-100 backdrop-blur-sm">
                                    <CheckCircle className="w-3 h-3" /> Completada
                                </span>
                            )}
                        </div>

                        <h1 className="text-4xl md:text-6xl font-black text-slate-900 leading-[1.1] mb-8 tracking-tight font-sans">
                            {currentLesson?.title}
                        </h1>

                        {/* Hero Video (Integrated) */}
                        {currentLesson?.videoUrl && (
                            <CinemaPlayer
                                url={currentLesson.videoUrl}
                                title={currentLesson.title}
                                thumbnail={currentLesson.customThumbnail}
                                chapters={currentLesson.chapters}
                            />
                        )}

                        <div className="absolute -left-20 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500/0 via-indigo-500/20 to-indigo-500/0 hidden xl:block" />
                    </header>

                    {/* Content Body */}
                    <div className="mb-24 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-12">
                        <div className="min-w-0">
                            {renderContentWithWidgets(currentLesson?.content || '')}
                        </div>

                        {/* Side Column for Notes (Desktop) */}
                        <div className="hidden lg:block relative">
                            <div className="sticky top-32">
                                <NoteTaker />
                            </div>
                        </div>
                    </div>

                    {/* Mobile Notes */}
                    <div className="lg:hidden mb-12">
                        <NoteTaker />
                    </div>

                    {/* Footer Navigation */}
                    <div className="border-t border-slate-100 pt-16 mt-16">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                            <button
                                onClick={handlePrevious}
                                disabled={isFirstLesson}
                                className="w-full sm:w-auto flex items-center gap-3 px-8 py-5 rounded-2xl text-slate-500 font-bold hover:bg-slate-50 hover:text-slate-900 transition disabled:opacity-30 disabled:hover:bg-transparent"
                            >
                                <ArrowLeft className="w-5 h-5" />
                                <span className="text-lg">Anterior</span>
                            </button>

                            {!completedLessons.has(currentLesson?.id || '') ? (
                                <button
                                    onClick={handleMarkComplete}
                                    className="group w-full sm:w-auto flex items-center justify-center gap-4 px-10 py-5 bg-slate-900 text-white rounded-2xl font-bold text-lg hover:bg-slate-800 shadow-2xl shadow-slate-900/30 hover:scale-[1.02] active:scale-[0.98] transition-all relative overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl" />
                                    <span className="relative flex items-center gap-3">
                                        <CheckCircle className="w-6 h-6" />
                                        Completar Lección
                                    </span>
                                </button>
                            ) : (
                                <button
                                    onClick={handleNext}
                                    disabled={isLastLesson}
                                    className="group w-full sm:w-auto flex items-center justify-center gap-4 px-10 py-5 bg-white border-2 border-slate-100 text-slate-900 rounded-2xl font-bold text-lg hover:border-slate-900 hover:bg-slate-50 shadow-xl shadow-slate-200/50 hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <span className="group-hover:translate-x-1 transition-transform">Siguiente</span>
                                    <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModuleViewer;
