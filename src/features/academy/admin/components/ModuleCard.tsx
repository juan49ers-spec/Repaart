import React from 'react';
import { BookOpen, Edit3, Eye, EyeOff, Trash2, Lock, ChevronRight } from 'lucide-react';
import { AcademyModule } from '../../../../services/academyService';
import { cn } from '../../../../lib/utils';
import { motion } from 'framer-motion';

interface ModuleCardProps {
    module: AcademyModule;
    isSelected: boolean;
    onSelect: () => void;
    onEdit: () => void;
    onToggleStatus: () => void;
    onDelete: () => void;
}

const getStatusStyles = (status: string) => {
    const styles: Record<string, { bg: string; text: string; border: string; iconBg: string }> = {
        active: {
            bg: 'bg-emerald-50 dark:bg-emerald-500/10',
            text: 'text-emerald-700 dark:text-emerald-400',
            border: 'border-emerald-200 dark:border-emerald-500/20',
            iconBg: 'bg-emerald-100 dark:bg-emerald-500/20'
        },
        draft: {
            bg: 'bg-amber-50 dark:bg-amber-500/10',
            text: 'text-amber-700 dark:text-amber-400',
            border: 'border-amber-200 dark:border-amber-500/20',
            iconBg: 'bg-amber-100 dark:bg-amber-500/20'
        }
    };
    return styles[status] || styles.draft;
};

const ModuleCard: React.FC<ModuleCardProps> = ({
    module,
    isSelected,
    onSelect,
    onEdit,
    onToggleStatus,
    onDelete
}) => {
    const statusStyles = getStatusStyles(module.status || 'draft');

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            whileHover={{ scale: 1.01, y: -2 }}
            onClick={onSelect}
            className={cn(
                "group relative bg-white dark:bg-slate-900 rounded-xl border-2 transition-all duration-300 cursor-pointer overflow-hidden",
                isSelected
                    ? 'border-blue-500 dark:border-blue-400 shadow-lg shadow-blue-500/10'
                    : 'border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600'
            )}
        >
            {/* Selection Indicator */}
            {isSelected && (
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500 dark:bg-blue-400 z-10"
                />
            )}

            {/* Header with Module Number Badge */}
            <div className="relative p-4 sm:p-5 pb-3">
                {/* Module Number Badge */}
                <div className="absolute -top-2 -left-2 z-10">
                    <div className={cn(
                        "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-lg",
                        "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-blue-500/30"
                    )}>
                        Módulo {module.order}
                    </div>
                </div>

                {/* Top Section: Icon + Title + Status */}
                <div className="flex items-start gap-3 pl-2">
                    {/* Icon */}
                    <div className="shrink-0">
                        <div className={cn(
                            "w-11 h-11 rounded-lg flex items-center justify-center shadow-md",
                            "bg-gradient-to-br from-slate-700 to-slate-800 dark:from-slate-600 dark:to-slate-700"
                        )}>
                            <BookOpen className="w-5 h-5 text-white/95" />
                        </div>
                    </div>

                    {/* Title and Status */}
                    <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug">
                                {module.title}
                            </h3>
                            
                            {/* Status Badge */}
                            <span className={cn(
                                "px-2 py-0.5 rounded-md text-[9px] font-semibold uppercase tracking-wider flex items-center gap-1 shrink-0",
                                statusStyles.bg,
                                statusStyles.text,
                                statusStyles.border
                            )}>
                                {module.status === 'active' ? 'Publicado' : 'Borrador'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Description Section */}
            <div className="px-4 sm:px-5 pb-3">
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3">
                    {module.description}
                </p>
            </div>

            {/* Footer: Actions + Lessons Indicator */}
            <div className="px-4 sm:px-5 pb-4 sm:pb-5">
                <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                    {/* Lessons Indicator */}
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-medium">
                        <Lock className="w-3 h-3" />
                        <span>Lecciones</span>
                        <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit();
                            }}
                            className={cn(
                                "p-1.5 rounded-md transition-all group/btn",
                                "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                            )}
                            title="Editar módulo"
                        >
                            <Edit3 className="w-3.5 h-3.5 group-hover/btn:text-blue-600 dark:group-hover/btn:text-blue-400 transition-colors" />
                        </button>

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleStatus();
                            }}
                            className={cn(
                                "p-1.5 rounded-md transition-all",
                                statusStyles.bg,
                                statusStyles.text
                            )}
                            title={module.status === 'active' ? 'Desactivar' : 'Publicar'}
                        >
                            {module.status === 'active' ? (
                                <EyeOff className="w-3.5 h-3.5" />
                            ) : (
                                <Eye className="w-3.5 h-3.5" />
                            )}
                        </button>

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete();
                            }}
                            className={cn(
                                "p-1.5 rounded-md transition-all hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-600 dark:text-rose-400",
                                "hover:text-rose-700 dark:hover:text-rose-300"
                            )}
                            title="Eliminar módulo"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Hover Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        </motion.div>
    );
};

export default ModuleCard;
