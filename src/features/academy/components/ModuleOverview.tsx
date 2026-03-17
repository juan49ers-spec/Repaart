import { motion } from 'framer-motion';
import { 
    BookOpen, 
    CheckCircle, 
    Lock, 
    Play, 
    Youtube, 
    FileText, 
    Clock, 
    ClipboardCheck,
    Loader2
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { AcademyModule, AcademyLesson } from '../../../services/academyService';

interface ModuleOverviewProps {
    module: AcademyModule;
    lessons: AcademyLesson[];
    completedLessons: string[];
    onSelectLesson: (id: string) => void;
    lessonsLoading: boolean;
    moduleId?: string;
}

const ModuleOverview = ({
    module,
    lessons,
    completedLessons,
    onSelectLesson,
    lessonsLoading,
    moduleId
}: ModuleOverviewProps) => {
    
    const extractYouTubeId = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const progressPercentage = lessons.length > 0 
        ? Math.round((completedLessons.filter(id => lessons.some(l => l.id === id)).length / lessons.length) * 100)
        : 0;

    return (
        <div className="max-w-6xl mx-auto px-4 pt-1">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="academy-lesson-header"
            >
                <h1 className="academy-title">{module.title}</h1>
                <p className="academy-description">{module.description}</p>

                <div className="flex flex-wrap items-center gap-3 mt-2">
                    <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-full border border-blue-200 dark:border-blue-800">
                        <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                            {lessons.length} lecciones
                        </span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-full border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                            {progressPercentage}% completado
                        </span>
                    </div>
                </div>
            </motion.div>

            <div className="academy-lessons-grid">
                {lessons.map((lesson, index) => {
                    const lessonCompleted = completedLessons.includes(lesson.id!);
                    const lessonYtId = lesson.video_url ? extractYouTubeId(lesson.video_url) : null;
                    const isLocked = !lessonCompleted && index > 0 && !completedLessons.includes(lessons[index - 1].id!);

                    return (
                        <motion.div
                            key={lesson.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="h-full"
                        >
                            <div
                                onClick={() => !isLocked && onSelectLesson(lesson.id!)}
                                className={cn(
                                    'relative bg-white dark:bg-slate-900 rounded-2xl shadow-lg border-2 transition-all overflow-hidden cursor-pointer group h-full',
                                    isLocked
                                        ? 'border-slate-200 dark:border-slate-700 opacity-60'
                                        : 'border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-xl'
                                )}
                            >
                                {/* Thumbnail Section */}
                                <div className="relative h-40 bg-slate-900 overflow-hidden">
                                    {lessonYtId ? (
                                        <img
                                            src={`https://img.youtube.com/vi/${lessonYtId}/maxresdefault.jpg`}
                                            alt={lesson.title}
                                            className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                                            loading="lazy"
                                            onError={(e) => {
                                                if (e.currentTarget.src.includes('maxresdefault.jpg')) {
                                                    e.currentTarget.src = `https://img.youtube.com/vi/${lessonYtId}/hqdefault.jpg`;
                                                }
                                            }}
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
                                        {lesson.content_type === 'quiz' ? (
                                            <div className="bg-purple-500/90 backdrop-blur-sm px-2 py-1 rounded-lg shadow-lg">
                                                <ClipboardCheck className="w-4 h-4 text-white" />
                                            </div>
                                        ) : (
                                            <>
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
                                            </>
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
                                            {lesson.content_type === 'quiz' ? 'Evaluación' : lessonYtId && lesson.content ? 'Video + Texto' : lessonYtId ? 'Video' : 'Texto'}
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
                            {lessonsLoading ? (
                                <>
                                    <Loader2 className="academy-empty-icon animate-spin" />
                                    <p className="academy-empty-title">Cargando lecciones...</p>
                                    <p className="academy-empty-description">Por favor espera un momento</p>
                                </>
                            ) : (
                                <>
                                    <BookOpen className="academy-empty-icon" />
                                    <p className="academy-empty-title">No hay lecciones disponibles</p>
                                    <p className="academy-empty-description">
                                        Este módulo aún no tiene contenido publicado.
                                        <br />
                                        <span className="text-xs text-slate-400 mt-2 block">
                                            Módulo ID: {moduleId}
                                        </span>
                                    </p>
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default ModuleOverview;
