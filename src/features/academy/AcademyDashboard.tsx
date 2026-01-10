import { type FC, type ReactNode, useState, useMemo } from 'react';
import { BookOpen, Lock, CheckCircle, Clock, PlayCircle, Award, Search } from 'lucide-react';
import { useAcademyModules, useAcademyProgress } from '../../hooks/useAcademy';
import { useAuth } from '../../context/AuthContext';

type ModuleStatus = 'available' | 'locked' | 'in_progress' | 'completed';

interface Module {
    id: string;
    order: number;
    title: string;
    description: string;
    duration?: string;
    lessonCount?: number;
}

interface AcademyDashboardProps {
    onModuleClick: (module: Module) => void;
}

/**
 * Academy Dashboard - Vista principal de la academia
 * Para franquiciados: Muestra módulos y progreso
 */
const AcademyDashboard: FC<AcademyDashboardProps> = ({ onModuleClick }) => {
    const { user } = useAuth();
    const { modules, loading } = useAcademyModules();
    const { progress, totalProgress } = useAcademyProgress(user?.uid ?? null);

    // Filter and search state
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<ModuleStatus | 'all'>('all');

    const getModuleStatus = (module: Module): ModuleStatus => {
        const moduleProgress = progress[module.id];

        if (!moduleProgress) {
            // Verificar si está desbloqueado
            if (module.order === 1) return 'available';

            // Verificar si el módulo anterior está completado
            const prevModule = modules.find(m => m.order === module.order - 1);
            const prevProgress = progress[prevModule?.id || ''];

            if (prevProgress && prevProgress.score && prevProgress.score >= 80) {
                return 'available';
            }

            return 'locked';
        }

        if (moduleProgress.completed) return 'completed';
        return 'in_progress';
    };

    const getStatusIcon = (status: ModuleStatus): ReactNode => {
        switch (status) {
            case 'completed':
                return <CheckCircle className="w-6 h-6 text-emerald-500" />;
            case 'in_progress':
                return <PlayCircle className="w-6 h-6 text-blue-500" />;
            case 'locked':
                return <Lock className="w-6 h-6 text-slate-400" />;
            default:
                return <BookOpen className="w-6 h-6 text-blue-500" />;
        }
    };



    // Filtered and searched modules
    const filteredModules = useMemo(() => {
        return modules.filter(module => {
            const status = getModuleStatus(module);
            const matchesSearch = module.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                module.description.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesFilter = statusFilter === 'all' || status === statusFilter;
            return matchesSearch && matchesFilter;
        });
    }, [modules, progress, searchQuery, statusFilter]);

    // Statistics
    const completedCount = modules.filter(m => getModuleStatus(m) === 'completed').length;
    const inProgressCount = modules.filter(m => getModuleStatus(m) === 'in_progress').length;


    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <BookOpen className="w-12 h-12 mx-auto mb-4 text-blue-500 animate-pulse" />
                    <p className="text-slate-500 font-medium">Cargando academia...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8 animate-fade-in">
            {/* Header */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 md:p-8 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50">
                <div className="flex flex-col gap-6">
                    {/* Title and Stats */}
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-black mb-2 text-slate-900 dark:text-white">🎓 Academia Repaart</h1>
                            <p className="text-slate-500 dark:text-slate-400 text-base md:text-lg">
                                Tu camino hacia la excelencia operativa
                            </p>
                        </div>
                        <div className="flex gap-4">
                            <div className="text-center bg-indigo-50 dark:bg-indigo-950/30 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900">
                                <p className="text-xs text-indigo-600 dark:text-indigo-400 mb-1 font-bold uppercase tracking-wider">Progreso</p>
                                <p className="text-3xl font-black text-indigo-900 dark:text-indigo-100">{Math.round(totalProgress)}%</p>
                            </div>
                            <div className="text-center bg-emerald-50 dark:bg-emerald-950/30 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900">
                                <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1 font-bold uppercase tracking-wider">Completados</p>
                                <p className="text-3xl font-black text-emerald-900 dark:text-emerald-100">{completedCount}/{modules.length}</p>
                            </div>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="bg-slate-100 dark:bg-slate-700 rounded-full h-4 overflow-hidden border border-slate-200 dark:border-slate-600">
                        <div
                            className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(99,102,241,0.4)]"
                            style={{ width: `${totalProgress}%` }}
                        />
                    </div>

                    {/* Search and Filters */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        {/* Search Bar */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Buscar módulos..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                        </div>

                        {/* Filter Buttons */}
                        <div className="flex gap-2 bg-slate-100 dark:bg-slate-700 p-1 rounded-xl border border-slate-200 dark:border-slate-600">
                            <button
                                onClick={() => setStatusFilter('all')}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition ${statusFilter === 'all'
                                    ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                    }`}
                            >
                                Todos ({modules.length})
                            </button>
                            <button
                                onClick={() => setStatusFilter('in_progress')}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition ${statusFilter === 'in_progress'
                                    ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow-sm'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                    }`}
                            >
                                En Curso ({inProgressCount})
                            </button>
                            <button
                                onClick={() => setStatusFilter('completed')}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition ${statusFilter === 'completed'
                                    ? 'bg-white dark:bg-slate-600 text-emerald-600 dark:text-emerald-400 shadow-sm'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                    }`}
                            >
                                Completados ({completedCount})
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modules Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {filteredModules.map((module) => {
                    const status = getModuleStatus(module);
                    const moduleProgress = progress[module.id];
                    const isLocked = status === 'locked';
                    // Dynamic border color based on status
                    const borderColor = status === 'completed' ? 'border-emerald-200' : status === 'in_progress' ? 'border-indigo-200' : 'border-slate-200';
                    const bgColor = status === 'completed' ? 'bg-emerald-50/30' : status === 'in_progress' ? 'bg-white' : 'bg-slate-50/50';

                    return (
                        <div
                            key={module.id}
                            onClick={() => !isLocked && onModuleClick(module)}
                            className={`
                                relative rounded-2xl border ${borderColor} ${bgColor} p-6 transition-all duration-300
                                ${!isLocked ? 'cursor-pointer hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1 hover:border-indigo-300' : 'cursor-not-allowed opacity-80'}
                            `}
                        >
                            {/* Status Badge */}
                            <div className="absolute top-4 right-4">
                                {getStatusIcon(status)}
                            </div>

                            {/* Module Info */}
                            <div className="mb-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-2 py-1 rounded-md">
                                        Módulo {module.order}
                                    </span>
                                    {module.duration && (
                                        <span className="flex items-center text-xs text-slate-500 font-medium">
                                            <Clock className="w-3 h-3 mr-1" />
                                            {module.duration}
                                        </span>
                                    )}
                                </div>
                                <h3 className={`text-xl font-black mb-2 line-clamp-2 ${isLocked ? 'text-slate-400' : 'text-slate-900'}`}>
                                    {module.title}
                                </h3>
                                <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed">
                                    {module.description}
                                </p>
                            </div>

                            {/* Progress */}
                            {moduleProgress && (
                                <div className="space-y-2 mt-6">
                                    <div className="flex justify-between items-center text-xs font-bold">
                                        <span className="text-slate-500">
                                            {moduleProgress.completedLessons || 0}/{module.lessonCount || 0} lecciones
                                        </span>
                                        <span className="text-indigo-600">
                                            {Math.round(moduleProgress.progress || 0)}%
                                        </span>
                                    </div>
                                    <div className="bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                                        <div
                                            className="bg-indigo-500 h-full transition-all duration-500"
                                            style={{ width: `${moduleProgress.progress || 0}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Certificate Badge */}
                            {status === 'completed' && moduleProgress?.score && moduleProgress.score >= 80 && (
                                <div className="mt-4 flex items-center gap-2 text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg text-xs font-bold border border-emerald-100">
                                    <Award className="w-4 h-4" />
                                    Certificado: {moduleProgress.score}%
                                </div>
                            )}

                            {/* Locked Message */}
                            {isLocked && (
                                <div className="mt-4 text-xs text-slate-400 italic flex items-center gap-1 bg-slate-100 px-3 py-2 rounded-lg">
                                    <Lock className="w-3 h-3" />
                                    Módulo bloqueado
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Empty State */}
            {modules.length === 0 && (
                <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 border-dashed">
                    <BookOpen className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                    <h3 className="text-xl font-bold text-slate-700 mb-2">
                        No hay módulos disponibles
                    </h3>
                    <p className="text-slate-500">
                        Los módulos aparecerán aquí cuando el administrador los publique
                    </p>
                </div>
            )}
        </div>
    );
};

export default AcademyDashboard;
