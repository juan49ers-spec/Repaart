import { motion } from 'framer-motion';
import { 
    Lock, 
    CheckCircle, 
    Youtube, 
    FileText, 
    Clock, 
    ClipboardCheck 
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { AcademyLesson } from '../../../services/academyService';

interface AcademySidebarProps {
    lessons: AcademyLesson[];
    selectedLessonId: string | null;
    completedLessons: string[];
    onSelectLesson: (id: string) => void;
}

const AcademySidebar = ({
    lessons,
    selectedLessonId,
    completedLessons,
    onSelectLesson
}: AcademySidebarProps) => {
    return (
        <aside className="w-80 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hidden md:flex flex-col h-full sticky top-0 overflow-y-auto">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Contenido del curso</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    {completedLessons.length} / {lessons.length} completado
                </p>
                <div className="mt-4 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-blue-600 transition-all duration-500"
                        style={{ width: `${(completedLessons.length / lessons.length) * 100}%` }}
                    />
                </div>
            </div>

            <div className="flex-1">
                {lessons.map((lesson, index) => {
                    const isSelected = selectedLessonId === lesson.id;
                    const lessonCompleted = completedLessons.includes(lesson.id!);
                    const hasVideo = !!lesson.video_url;
                    const hasText = !!lesson.content && lesson.content.trim().length > 0;
                    
                    // Lógica de bloqueo: una lección está bloqueada si no está completada
                    // Y no es la primera, Y la anterior no está completada.
                    const isLocked = !lessonCompleted && index > 0 && !completedLessons.includes(lessons[index - 1].id!);

                    return (
                        <motion.button
                            key={lesson.id}
                            onClick={() => !isLocked && onSelectLesson(lesson.id!)}
                            className={cn(
                                'w-full text-left border-b border-slate-100 dark:border-slate-800/50 last:border-0 transition-all relative',
                                isSelected ? 'bg-blue-50/50 dark:bg-blue-900/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50',
                                isLocked && 'cursor-not-allowed opacity-75'
                            )}
                        >
                            {isSelected && (
                                <motion.div
                                    layoutId="active-lesson"
                                    className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600"
                                />
                            )}
                            
                            <div className="flex items-start gap-3 p-4 transition-colors">
                                <div className={cn(
                                    "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors",
                                    isLocked ? 'bg-slate-100 dark:bg-slate-800 text-slate-400' :
                                    lessonCompleted ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' :
                                    isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                )}>
                                    {isLocked ? <Lock className="w-4 h-4" /> :
                                        lessonCompleted ? <CheckCircle className="w-5 h-5" /> :
                                            index + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className={cn(
                                        "font-semibold text-sm mb-1 truncate transition-colors",
                                        isSelected ? 'text-blue-700 dark:text-blue-400' : 'text-slate-900 dark:text-white',
                                        isLocked && 'text-slate-400 dark:text-slate-500'
                                    )}>
                                        {lesson.title}
                                    </h4>
                                    <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider font-bold">
                                        {lesson.content_type === 'quiz' ? (
                                            <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
                                                <ClipboardCheck className="w-3 h-3" />
                                                Evaluación
                                            </span>
                                        ) : (
                                            <>
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
                                            </>
                                        )}
                                        <span className="flex items-center gap-1 text-slate-400 dark:text-slate-500 ml-auto">
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
    );
};

export default AcademySidebar;
