import React from 'react';
import {
    Lock,
    CheckCircle,
    PlayCircle,
    Clock,
    BookOpen,
    Award,
    ChevronRight
} from 'lucide-react';
import { AcademyModule } from '../../hooks/useAcademy';

type ModuleStatus = 'available' | 'locked' | 'in_progress' | 'completed';

interface ModuleCardProps {
    module: AcademyModule;
    status: ModuleStatus;
    progress?: {
        progress: number;
        completedLessons: number;
        quizScore?: number;
    };
    onClick: () => void;
}

// Color configurations by module order (cycling through)
const colorConfigs = [
    {
        gradientFrom: "from-blue-400",
        gradientTo: "to-indigo-500",
        bgColor: "bg-blue-50 dark:bg-blue-950/40",
        borderColor: "border-blue-200 dark:border-blue-800/50",
        textColor: "text-blue-600 dark:text-blue-400",
        buttonBg: "bg-blue-500 hover:bg-blue-600"
    },
    {
        gradientFrom: "from-violet-400",
        gradientTo: "to-purple-500",
        bgColor: "bg-violet-50 dark:bg-violet-950/40",
        borderColor: "border-violet-200 dark:border-violet-800/50",
        textColor: "text-violet-600 dark:text-violet-400",
        buttonBg: "bg-violet-500 hover:bg-violet-600"
    },
    {
        gradientFrom: "from-emerald-400",
        gradientTo: "to-teal-500",
        bgColor: "bg-emerald-50 dark:bg-emerald-950/40",
        borderColor: "border-emerald-200 dark:border-emerald-800/50",
        textColor: "text-emerald-600 dark:text-emerald-400",
        buttonBg: "bg-emerald-500 hover:bg-emerald-600"
    },
    {
        gradientFrom: "from-orange-400",
        gradientTo: "to-rose-500",
        bgColor: "bg-orange-50 dark:bg-orange-950/40",
        borderColor: "border-orange-200 dark:border-orange-800/50",
        textColor: "text-orange-600 dark:text-orange-400",
        buttonBg: "bg-orange-500 hover:bg-orange-600"
    },
    {
        gradientFrom: "from-cyan-400",
        gradientTo: "to-blue-500",
        bgColor: "bg-cyan-50 dark:bg-cyan-950/40",
        borderColor: "border-cyan-200 dark:border-cyan-800/50",
        textColor: "text-cyan-600 dark:text-cyan-400",
        buttonBg: "bg-cyan-500 hover:bg-cyan-600"
    },
    {
        gradientFrom: "from-pink-400",
        gradientTo: "to-rose-500",
        bgColor: "bg-pink-50 dark:bg-pink-950/40",
        borderColor: "border-pink-200 dark:border-pink-800/50",
        textColor: "text-pink-600 dark:text-pink-400",
        buttonBg: "bg-pink-500 hover:bg-pink-600"
    },
];

const getStatusConfig = (status: ModuleStatus) => {
    switch (status) {
        case 'completed':
            return {
                icon: <CheckCircle className="w-5 h-5" />,
                label: 'Completado',
                iconColor: 'text-emerald-500'
            };
        case 'in_progress':
            return {
                icon: <PlayCircle className="w-5 h-5" />,
                label: 'En progreso',
                iconColor: 'text-blue-500'
            };
        case 'locked':
            return {
                icon: <Lock className="w-5 h-5" />,
                label: 'Bloqueado',
                iconColor: 'text-slate-400'
            };
        case 'available':
        default:
            return {
                icon: <BookOpen className="w-5 h-5" />,
                label: 'Disponible',
                iconColor: 'text-blue-500'
            };
    }
};

const ModuleCard: React.FC<ModuleCardProps> = ({
    module,
    status,
    progress,
    onClick
}) => {
    const colorConfig = colorConfigs[(module.order || 1) % colorConfigs.length];
    const statusConfig = getStatusConfig(status);
    const isLocked = status === 'locked';
    const isCompleted = status === 'completed';
    const hasProgress = progress && progress.progress > 0;

    return (
        <div
            onClick={() => !isLocked && onClick()}
            className={`
                group relative bg-white dark:bg-slate-900 
                rounded-2xl border overflow-hidden transition-all duration-300
                ${isLocked
                    ? 'opacity-70 cursor-not-allowed border-slate-200 dark:border-slate-800'
                    : `cursor-pointer hover:shadow-xl hover:-translate-y-1 ${colorConfig.borderColor}`
                }
                ${isCompleted ? 'border-emerald-200 dark:border-emerald-800/50' : ''}
            `}
        >
            {/* Illustration Header */}
            <div className={`relative h-24 ${colorConfig.bgColor} flex items-center justify-center overflow-hidden`}>
                {/* Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${colorConfig.gradientFrom} ${colorConfig.gradientTo} opacity-20`} />

                {/* Abstract Shapes */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className={`absolute -top-8 -right-8 w-32 h-32 rounded-full bg-gradient-to-br ${colorConfig.gradientFrom} ${colorConfig.gradientTo} opacity-20 blur-xl`} />
                    <div className={`absolute -bottom-4 -left-4 w-24 h-24 rounded-full bg-gradient-to-br ${colorConfig.gradientFrom} ${colorConfig.gradientTo} opacity-15 blur-lg`} />
                </div>

                {/* Module Number Badge */}
                <div className={`relative z-10 w-12 h-12 rounded-xl bg-white dark:bg-slate-900 border ${colorConfig.borderColor} shadow-lg flex items-center justify-center`}>
                    <span className={`text-xl font-bold ${colorConfig.textColor}`}>
                        {module.order}
                    </span>
                </div>

                {/* Status Badge */}
                <div className={`absolute top-2 right-2 flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide ${isCompleted
                    ? 'bg-emerald-500 text-white'
                    : status === 'in_progress'
                        ? 'bg-blue-500 text-white'
                        : 'bg-white/80 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                    }`}>
                    <span className={statusConfig.iconColor}>{React.cloneElement(statusConfig.icon as React.ReactElement<any>, { className: "w-3 h-3" })}</span>
                </div>
            </div>

            {/* Content Body */}
            <div className="p-4">
                {/* Category Label */}
                <span className={`inline-block text-[9px] font-bold uppercase tracking-widest ${colorConfig.textColor} mb-1.5`}>
                    Módulo {module.order}
                </span>

                {/* Title */}
                <h3 className={`text-base font-bold mb-1.5 leading-tight ${isLocked ? 'text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                    {module.title}
                </h3>

                {/* Description */}
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
                    {module.description}
                </p>

                {/* Metadata */}
                <div className="flex items-center gap-3 text-[10px] text-slate-400 mb-3">
                    {module.duration && (
                        <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {module.duration}
                        </span>
                    )}
                    {module.lessonCount && (
                        <span className="flex items-center gap-1">
                            <BookOpen className="w-3 h-3" />
                            {module.lessonCount} lecciones
                        </span>
                    )}
                </div>

                {/* Progress Bar */}
                {hasProgress && (
                    <div className="mb-3">
                        <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-wide mb-1">
                            <span className="text-slate-400">
                                {progress.completedLessons}/{module.lessonCount}
                            </span>
                            <span className={colorConfig.textColor}>
                                {Math.round(progress.progress)}%
                            </span>
                        </div>
                        <div className="h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className={`h-full bg-gradient-to-r ${colorConfig.gradientFrom} ${colorConfig.gradientTo} transition-all duration-500`}
                                style={{ width: `${progress.progress}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Certificate Badge */}
                {isCompleted && progress?.quizScore && progress.quizScore >= 80 && (
                    <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1.5 rounded-lg text-[10px] font-bold border border-emerald-200 dark:border-emerald-800/50 mb-3">
                        <Award className="w-3 h-3" />
                        Certificado: {progress.quizScore}%
                    </div>
                )}

                {/* CTA Button */}
                {!isLocked && (
                    <button className={`w-full py-2 px-3 ${colorConfig.buttonBg} text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all group-hover:shadow-md`}>
                        {isCompleted ? 'Repasar' : hasProgress ? 'Continuar' : 'Comenzar'}
                        <ChevronRight className="w-3 h-3" />
                    </button>
                )}

                {/* Locked Message */}
                {isLocked && (
                    <div className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-lg text-xs font-medium">
                        <Lock className="w-3 h-3" />
                        Completa el anterior
                    </div>
                )}
            </div>
        </div>
    );
};

export default ModuleCard;
