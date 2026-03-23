import React from 'react';
import { Video, FileText, Eye, EyeOff, Trash2, Edit2, GripVertical, ListChecks } from 'lucide-react';
import { AcademyLesson } from '../../../../services/academyService';
import { cn } from '../../../../lib/utils';

interface LessonCardProps {
    lesson: AcademyLesson;
    onEdit: () => void;
    onToggleStatus: () => void;
    onDelete: () => void;
    // Drag & Drop
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dragListeners?: Record<string, any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dragAttributes?: Record<string, any>;
    setNodeRef?: (node: HTMLElement | null) => void;
    style?: React.CSSProperties;
    isDragging?: boolean;
}

const LessonCard: React.FC<LessonCardProps> = ({
    lesson,
    onEdit,
    onToggleStatus,
    onDelete,
    dragListeners,
    dragAttributes,
    setNodeRef,
    style,
    isDragging
}) => {
    const getPreviewText = () => {
        if (lesson.content_type === 'video') {
            return lesson.video_url ? 'Video de YouTube' : 'Sin video';
        }
        if (lesson.content_type === 'quiz') {
            return 'Cuestionario de evaluación';
        }
        const plainText = lesson.content.replace(/<[^>]+>/g, '');
        return plainText.length > 100 ? plainText.substring(0, 100) + '...' : plainText;
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "bg-white dark:bg-slate-800 border-2 rounded-lg p-3 hover:shadow-sm transition-all relative overflow-hidden",
                isDragging
                    ? "opacity-50 z-50 border-blue-500 scale-[1.02] shadow-xl"
                    : "border-slate-200 dark:border-slate-700"
            )}
        >
            <div className="flex items-start gap-3">
                {/* Drag Handle */}
                {dragListeners && (
                    <div
                        {...dragAttributes}
                        {...dragListeners}
                        className="cursor-grab active:cursor-grabbing p-1 -ml-1 mt-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors shrink-0"
                    >
                        <GripVertical className="w-4 h-4" />
                    </div>
                )}

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                            Lección {lesson.order}
                        </span>
                        <span className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-full",
                            lesson.status === 'published'
                                ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                        )}>
                            {lesson.status === 'published' ? 'Publicado' : 'Borrador'}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 shrink-0">
                            {lesson.content_type === 'video' ? (
                                <>
                                    <Video className="w-2.5 h-2.5" />
                                    Video
                                </>
                            ) : lesson.content_type === 'quiz' ? (
                                <>
                                    <ListChecks className="w-2.5 h-2.5" />
                                    Quiz
                                </>
                            ) : (
                                <>
                                    <FileText className="w-2.5 h-2.5" />
                                    Texto
                                </>
                            )}
                        </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1 truncate">
                        {lesson.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 pr-2">
                        {getPreviewText()}
                    </p>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={onEdit}
                        className="p-1.5 rounded-md text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        title="Editar lección"
                    >
                        <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={onToggleStatus}
                        className="p-1.5 rounded-md text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        title={lesson.status === 'published' ? 'Desactivar' : 'Activar'}
                    >
                        {lesson.status === 'published' ? (
                            <EyeOff className="w-3.5 h-3.5" />
                        ) : (
                            <Eye className="w-3.5 h-3.5" />
                        )}
                    </button>
                    <button
                        onClick={onDelete}
                        className="p-1.5 rounded-md text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                        title="Eliminar lección"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LessonCard;