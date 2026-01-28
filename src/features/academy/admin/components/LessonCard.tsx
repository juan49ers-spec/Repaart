import React from 'react';
import { Video, FileText, Eye, EyeOff, Trash2, Edit2 } from 'lucide-react';
import { AcademyLesson } from '../../../../services/academyService';
import { cn } from '../../../../lib/utils';

interface LessonCardProps {
    lesson: AcademyLesson;
    onEdit: () => void;
    onToggleStatus: () => void;
    onDelete: () => void;
}

const LessonCard: React.FC<LessonCardProps> = ({
    lesson,
    onEdit,
    onToggleStatus,
    onDelete
}) => {
    const getPreviewText = () => {
        if (lesson.content_type === 'video') {
            return lesson.video_url ? 'Video de YouTube' : 'Sin video';
        }
        const plainText = lesson.content.replace(/<[^>]+>/g, '');
        return plainText.length > 100 ? plainText.substring(0, 100) + '...' : plainText;
    };

    return (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 hover:shadow-sm transition-shadow">
            <div className="flex items-start gap-3">
                <div className="flex-1">
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
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            {lesson.content_type === 'video' ? (
                                <>
                                    <Video className="w-2.5 h-2.5" />
                                    Video
                                </>
                            ) : (
                                <>
                                    <FileText className="w-2.5 h-2.5" />
                                    Texto
                                </>
                            )}
                        </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                        {lesson.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
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