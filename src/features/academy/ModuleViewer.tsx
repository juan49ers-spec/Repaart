import { useState, useEffect, type FC } from 'react';
import { ArrowLeft, BookOpen, Clock, CheckCircle, ArrowRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useModuleLessons, useMarkLessonComplete, useModuleQuiz, AcademyModule, Lesson } from '../../hooks/useAcademy';
import { useAuth } from '../../context/AuthContext';
import QuizEngine from './QuizEngine';
import CalculatorWidget from './CalculatorWidget';

interface ModuleViewerProps {
    module: AcademyModule;
    onBack: () => void;
}

/**
 * Module Viewer - Vista de consumo de módulos para franquiciados
 * Muestra lecciones en formato markdown con navegación
 */
const ModuleViewer: FC<ModuleViewerProps> = ({ module, onBack }) => {
    const { user } = useAuth();
    const { lessons, loading } = useModuleLessons(module.id);
    const { quiz } = useModuleQuiz(module.id);
    const markComplete = useMarkLessonComplete();

    const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
    const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
    const [showQuiz, setShowQuiz] = useState(false);

    // [NEW] Helper to render content with widgets
    const renderContentWithWidgets = (content: string) => {
        if (!content) return null;

        // Split by widget tags using regex capture group
        const parts = content.split(/({{WIDGET:[^}]+}}|{{VIDEO:[^}]+}})/g);

        return parts.map((part, index) => {
            if (part.startsWith('{{WIDGET:')) {
                const widgetType = part.replace('{{WIDGET:', '').replace('}}', '').toLowerCase();

                if (widgetType.startsWith('calculator_')) {
                    const calcType = widgetType.replace('calculator_', '');
                    return <CalculatorWidget key={index} type={calcType as any} />;
                }
                return null;
            }

            if (part.startsWith('{{VIDEO:')) {
                const videoUrl = part.replace('{{VIDEO:', '').replace('}}', '');
                return (
                    <div key={index} className="my-8 rounded-2xl overflow-hidden shadow-lg border-4 border-slate-900 aspect-video bg-black">
                        <iframe
                            src={videoUrl}
                            title="Video Lesson"
                            className="w-full h-full"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    </div>
                );
            }

            // Normal markdown content
            return <div key={index} className="prose prose-slate max-w-none mb-6">
                <ReactMarkdown
                    components={{
                        h1: ({ ...props }) => <h1 className="text-3xl font-black text-slate-800 mb-4" {...props} />,
                        h2: ({ ...props }) => <h2 className="text-2xl font-black text-slate-800 mb-3 mt-8" {...props} />,
                        h3: ({ ...props }) => <h3 className="text-xl font-bold text-slate-800 mb-2 mt-6" {...props} />,
                        p: ({ ...props }) => <p className="text-slate-700 leading-relaxed mb-4" {...props} />,
                        ul: ({ ...props }) => <ul className="list-disc pl-6 mb-4 space-y-2" {...props} />,
                        ol: ({ ...props }) => <ol className="list-decimal pl-6 mb-4 space-y-2" {...props} />,
                        li: ({ ...props }) => <li className="text-slate-700" {...props} />,
                        blockquote: ({ ...props }) => (
                            <blockquote className="border-l-4 border-blue-500 bg-blue-50 pl-4 py-2 my-4 italic text-slate-700" {...props} />
                        ),
                        code: ({ inline, ...props }: any) =>
                            inline
                                ? <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded font-mono text-sm" {...props} />
                                : <code className="block bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-sm overflow-x-auto" {...props} />,
                        strong: ({ ...props }) => <strong className="font-bold text-slate-900" {...props} />,
                        a: ({ ...props }) => <a className="text-blue-600 hover:text-blue-700 underline font-medium" {...props} />
                    }}
                >
                    {part}
                </ReactMarkdown>
            </div>;
        });
    };

    const currentLesson = lessons[currentLessonIndex] as Lesson;
    const isFirstLesson = currentLessonIndex === 0;
    const isLastLesson = currentLessonIndex === lessons.length - 1;
    const allLessonsCompleted = completedLessons.size === lessons.length && lessons.length > 0;

    // Mostrar quiz cuando se completan todas las lecciones
    useEffect(() => {
        if (allLessonsCompleted && quiz && !showQuiz) {
            // Avoid synchronous state update
            const timer = setTimeout(() => setShowQuiz(true), 0);
            return () => clearTimeout(timer);
        }
    }, [allLessonsCompleted, quiz, showQuiz]);

    const handleMarkComplete = async () => {
        if (!currentLesson || !user) return;

        try {
            await markComplete(user.uid, module.id, currentLesson.id);
            setCompletedLessons(prev => new Set([...prev, currentLesson.id]));

            // Auto-avanzar a la siguiente lección
            if (!isLastLesson) {
                setCurrentLessonIndex(prev => prev + 1);
            }
        } catch (error) {
            console.error('Error marking lesson complete:', error);
        }
    };

    const handlePrevious = () => {
        if (!isFirstLesson) {
            setCurrentLessonIndex(prev => prev - 1);
        }
    };

    const handleNext = () => {
        if (!isLastLesson) {
            setCurrentLessonIndex(prev => prev + 1);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <BookOpen className="w-12 h-12 mx-auto mb-4 text-blue-500 animate-pulse" />
                    <p className="text-slate-500 font-medium">Cargando lecciones...</p>
                </div>
            </div>
        );
    }

    if (lessons.length === 0) {
        return (
            <div className="p-8 max-w-4xl mx-auto">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-bold mb-6 transition"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Volver a módulos
                </button>

                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
                    <BookOpen className="w-16 h-16 mx-auto mb-4 text-amber-500" />
                    <h3 className="text-xl font-bold text-amber-900 mb-2">
                        Este módulo está en construcción
                    </h3>
                    <p className="text-amber-700">
                        Las lecciones se agregarán pronto
                    </p>
                </div>
            </div>
        );
    }

    // Si todas las lecciones están completadas y hay quiz, mostrar el quiz
    if (showQuiz && quiz) {
        return (
            <QuizEngine
                quiz={quiz}
                module={module}
                onComplete={() => {
                    // Volver al dashboard cuando completa el quiz
                    onBack();
                }}
            />
        );
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm backdrop-blur-md bg-white/90">
                <div className="max-w-4xl mx-auto px-4 md:px-8 py-4">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold mb-3 transition text-sm"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Volver a módulos
                    </button>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded">
                                    Módulo {module.order}
                                </span>
                                {module.duration && (
                                    <span className="flex items-center text-xs text-slate-500 font-medium">
                                        <Clock className="w-3 h-3 mr-1" />
                                        {module.duration}
                                    </span>
                                )}
                            </div>
                            <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                                {module.title}
                            </h1>
                        </div>

                        <div className="flex items-center justify-between md:block md:text-right">
                            <p className="text-xs text-slate-500 mb-1 font-semibold uppercase tracking-wider">Progreso</p>
                            <p className="text-2xl font-black text-indigo-600">
                                {Math.round((completedLessons.size / lessons.length) * 100)}%
                            </p>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4 bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                        <div
                            className="bg-indigo-600 h-full transition-all duration-500 shadow-[0_0_10px_rgba(79,70,229,0.3)]"
                            style={{ width: `${(completedLessons.size / lessons.length) * 100}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 animate-fade-in">
                {/* Lesson Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-bold text-slate-500">
                            Lección {currentLessonIndex + 1} de {lessons.length}
                        </span>
                        {completedLessons.has(currentLesson?.id) && (
                            <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                <CheckCircle className="w-3 h-3" />
                                Completada
                            </span>
                        )}
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 leading-tight">
                        {currentLesson?.title}
                    </h2>
                </div>

                {/* Lesson Content */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 p-8 mb-8">
                    {/* [UPDATED] Render with Widgets */}
                    {renderContentWithWidgets(currentLesson?.content || '')}

                    {/* Resources */}
                    {currentLesson?.resources && currentLesson.resources.length > 0 && (
                        <div className="mt-8 pt-8 border-t border-slate-100">
                            <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <span className="bg-indigo-100 text-indigo-600 p-1 rounded">📎</span> Recursos adicionales
                            </h4>
                            <div className="space-y-2">
                                {currentLesson.resources.map((resource: { url: string; title: string }, index: number) => (
                                    <a
                                        key={index}
                                        href={resource.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block p-4 bg-slate-50 hover:bg-indigo-50/50 rounded-xl transition font-medium text-slate-700 hover:text-indigo-700 border border-slate-100 hover:border-indigo-100 group"
                                    >
                                        <span className="group-hover:translate-x-1 transition-transform inline-block">📄 {resource.title}</span>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between gap-4">
                    <button
                        onClick={handlePrevious}
                        disabled={isFirstLesson}
                        aria-label="Lección anterior"
                        className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 hover:text-slate-900 font-bold transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Anterior
                    </button>

                    {!completedLessons.has(currentLesson?.id) && (
                        <button
                            onClick={handleMarkComplete}
                            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-bold shadow-lg shadow-emerald-600/20 transition active:scale-[0.98]"
                        >
                            <CheckCircle className="w-5 h-5" />
                            Marcar como completada
                        </button>
                    )}

                    <button
                        onClick={handleNext}
                        disabled={isLastLesson}
                        aria-label="Siguiente lección"
                        className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-600/20 transition disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                    >
                        Siguiente
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </div>

                {/* Completion Status */}
                {isLastLesson && completedLessons.size === lessons.length && (
                    <div className="mt-8 bg-emerald-50 border border-emerald-100 rounded-2xl p-6 text-center animate-fade-in-up">
                        <CheckCircle className="w-12 h-12 mx-auto mb-3 text-emerald-600" />
                        <h3 className="text-xl font-black text-emerald-900 mb-2">
                            🎉 ¡Módulo completado!
                        </h3>
                        <p className="text-emerald-700">
                            Has terminado todas las lecciones de este módulo
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ModuleViewer;
