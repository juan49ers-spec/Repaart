import React, { useState } from 'react';
import {
    BookOpen,
    MoreVertical,
    Edit2,
    Trash2,
    FileText,
    HelpCircle,
    Clock,
    Eye,
    EyeOff
} from 'lucide-react';
import { AcademyModule } from '../../hooks/useAcademy';

interface AdminModuleCardProps {
    module: AcademyModule;
    onEdit: (module: AcademyModule) => void;
    onEditContent: (module: AcademyModule) => void;
    onEditQuiz: (module: AcademyModule) => void;
    onDelete: (id: string, title: string) => void;
    onToggleStatus: (module: AcademyModule) => void;
}

// Reusing the same color config logic for consistency
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

const AdminModuleCard: React.FC<AdminModuleCardProps> = ({
    module,
    onEdit,
    onEditContent,
    onEditQuiz,
    onDelete,
    onToggleStatus
}) => {
    const colorConfig = colorConfigs[(module.order || 1) % colorConfigs.length];
    const isActive = module.status === 'active';
    const [showMenu, setShowMenu] = useState(false);

    return (
        <div className={`
            group relative bg-white dark:bg-slate-900 
            rounded-2xl border transition-all duration-300 overflow-visible
            hover:shadow-xl hover:-translate-y-1 ${colorConfig.borderColor}
            ${!isActive ? 'opacity-90 grayscale-[0.3]' : ''}
        `}>
            {/* Illustration Header */}
            <div className={`relative h-28 ${colorConfig.bgColor} flex items-center justify-center overflow-hidden rounded-t-2xl`}>
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

                {/* Status Toggle Badge */}
                <button
                    onClick={(e) => { e.stopPropagation(); onToggleStatus(module); }}
                    className={`
                        absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide
                        transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer
                        ${isActive
                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 ring-2 ring-emerald-500/20'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-300'
                        }
                    `}
                    title={isActive ? "Publicado (Click para ocultar)" : "Borrador (Click para publicar)"}
                >
                    {isActive ? (
                        <>
                            <Eye className="w-3 h-3" />
                            <span>Publicado</span>
                        </>
                    ) : (
                        <>
                            <EyeOff className="w-3 h-3" />
                            <span>Borrador</span>
                        </>
                    )}
                </button>
            </div>

            {/* Content Body */}
            <div className="p-5">
                {/* Header Row */}
                <div className="flex justify-between items-start mb-2">
                    <span className={`inline-block text-[10px] font-bold uppercase tracking-widest ${colorConfig.textColor}`}>
                        Módulo {module.order}
                    </span>
                    <div className="relative">
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            <MoreVertical className="w-4 h-4" />
                        </button>

                        {/* Dropdown Menu */}
                        {showMenu && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                                <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-20 overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-200">
                                    <button
                                        onClick={() => { onEdit(module); setShowMenu(false); }}
                                        className="w-full text-left px-4 py-2.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                                    >
                                        <Edit2 className="w-3.5 h-3.5" /> Editar Detalles
                                    </button>
                                    <button
                                        onClick={() => { onDelete(module.id!, module.title); setShowMenu(false); }}
                                        className="w-full text-left px-4 py-2.5 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 flex items-center gap-2"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" /> Eliminar Módulo
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 leading-tight line-clamp-2 min-h-[3rem]">
                    {module.title}
                </h3>

                {/* Description */}
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 min-h-[2.5em]">
                    {module.description}
                </p>

                {/* Admin Stats / Metadata */}
                <div className="grid grid-cols-2 gap-2 mb-5">
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg text-center border border-slate-100 dark:border-slate-800">
                        <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">Lecciones</div>
                        <div className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1">
                            <BookOpen className="w-3 h-3 text-indigo-500" />
                            {module.lessonCount || 0}
                        </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg text-center border border-slate-100 dark:border-slate-800">
                        <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">Duración</div>
                        <div className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1">
                            <Clock className="w-3 h-3 text-emerald-500" />
                            {module.duration || '0m'}
                        </div>
                    </div>
                </div>

                {/* Main Actions */}
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={() => onEditContent(module)}
                        className={`
                            col-span-2 py-2 px-4 rounded-xl text-xs font-bold text-white shadow-md transition-all
                            flex items-center justify-center gap-2
                            ${colorConfig.buttonBg}
                        `}
                    >
                        <FileText className="w-4 h-4" />
                        Gestionar Contenido
                    </button>
                    <button
                        onClick={() => onEditQuiz(module)}
                        className="py-2 px-3 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center justify-center gap-1.5"
                    >
                        <HelpCircle className="w-3.5 h-3.5 text-purple-500" />
                        Quiz
                    </button>
                    <button
                        onClick={() => onEdit(module)}
                        className="py-2 px-3 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center justify-center gap-1.5"
                    >
                        <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                        Info
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminModuleCard;
