import React from 'react';
import { Lesson } from '../../hooks/useAcademy';
import { CheckCircle, PlayCircle, FileText } from 'lucide-react';

interface LessonSidebarProps {
    lessons: Lesson[];
    currentLessonId: string;
    completedLessons: Set<string>;
    onSelectLesson: (lessonId: string) => void;
    title: string;
    description?: string;
    onBack: () => void;
}

export const LessonSidebar: React.FC<LessonSidebarProps> = ({
    lessons,
    currentLessonId,
    completedLessons,
    onSelectLesson,
    title,
    description,
    onBack
}) => {
    return (
        <div className="w-full md:w-80 bg-white border-r border-slate-200 h-screen overflow-y-auto flex flex-col sticky top-0">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 bg-white z-10 sticky top-0">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-indigo-600 mb-4 transition uppercase tracking-wider"
                >
                    ← Volver al Módulo
                </button>
                <h2 className="text-xl font-black text-slate-900 leading-tight mb-2">
                    {title}
                </h2>
                {description && (
                    <p className="text-sm text-slate-500 line-clamp-2">
                        {description}
                    </p>
                )}
            </div>

            {/* Lesson List */}
            <div className="flex-1 py-4">
                <div className="px-6 mb-2">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Contenido del Curso
                    </h3>
                </div>
                <div className="space-y-1">
                    {lessons.map((lesson, index) => {
                        const isCompleted = completedLessons.has(lesson.id || '');
                        const isCurrent = currentLessonId === lesson.id;
                        // Logic for locking could be added here if needed, for now assuming linear but accessible

                        return (
                            <button
                                key={lesson.id}
                                onClick={() => onSelectLesson(lesson.id || '')}
                                className={`w-full text-left px-6 py-4 flex items-start gap-4 transition-colors relative group
                                    ${isCurrent
                                        ? 'bg-indigo-50/50'
                                        : 'hover:bg-slate-50'
                                    }
                                `}
                            >
                                {isCurrent && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600" />
                                )}

                                <div className={`mt-0.5 flex-shrink-0 transition-colors
                                    ${isCompleted ? 'text-emerald-500' : isCurrent ? 'text-indigo-600' : 'text-slate-300 group-hover:text-slate-400'}
                                `}>
                                    {isCompleted ? (
                                        <CheckCircle className="w-5 h-5 fill-emerald-50" />
                                    ) : lesson.videoUrl ? (
                                        <PlayCircle className="w-5 h-5" />
                                    ) : (
                                        <FileText className="w-5 h-5" />
                                    )}
                                </div>

                                <div>
                                    <p className={`text-sm font-bold leading-snug mb-0.5 transition-colors
                                        ${isCurrent ? 'text-indigo-900' : 'text-slate-700'}
                                        ${isCompleted && !isCurrent ? 'text-slate-500' : ''}
                                    `}>
                                        {lesson.title}
                                    </p>
                                    <span className="text-xs text-slate-400 font-medium">
                                        Lección {index + 1}
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Progress Footer */}
            <div className="p-6 bg-slate-50 border-t border-slate-100">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-slate-500 uppercase">Tu Progreso</span>
                    <span className="text-sm font-black text-indigo-600">
                        {Math.round((completedLessons.size / lessons.length) * 100)}%
                    </span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-indigo-500 transition-all duration-500"
                        style={{ width: `${Math.round((completedLessons.size / lessons.length) * 100)}%` }}
                    />
                </div>
            </div>
        </div>
    );
};
