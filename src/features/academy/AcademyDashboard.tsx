import { type FC, useState, useCallback, useMemo } from 'react';
import { Search, BookOpen } from 'lucide-react';
import { useAcademyModules, useAcademyProgress, AcademyModule } from '../../hooks/useAcademy';
import { useAuth } from '../../context/AuthContext';
import { AcademySeeder } from './AcademySeeder';
import ModuleCard from './ModuleCard';

type ModuleStatus = 'available' | 'locked' | 'in_progress' | 'completed';

interface AcademyDashboardProps {
    onModuleClick: (module: AcademyModule) => void;
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

    const getModuleStatus = useCallback((module: AcademyModule): ModuleStatus => {
        const moduleProgress = progress[module.id || ''];

        if (!moduleProgress) {
            // Verificar si está desbloqueado
            if ((module.order || 0) === 1) return 'available';

            // Verificar si el módulo anterior está completado
            const prevModule = modules.find(m => (m.order || 0) === (module.order || 0) - 1);
            const prevProgress = progress[prevModule?.id || ''];

            if (prevProgress && prevProgress.quizScore && prevProgress.quizScore >= 80) {
                return 'available';
            }

            return 'locked';
        }

        if (moduleProgress.status === 'completed') return 'completed';
        return 'in_progress';
    }, [modules, progress]);





    // Filtered and searched modules
    const filteredModules = useMemo(() => {
        return modules.filter(module => {
            const status = getModuleStatus(module);
            const matchesSearch = module.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                module.description.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesFilter = statusFilter === 'all' || status === statusFilter;
            return matchesSearch && matchesFilter;
        });
    }, [modules, progress, searchQuery, statusFilter, getModuleStatus]);

    // Statistics
    const completedCount = modules.filter((m: AcademyModule) => getModuleStatus(m) === 'completed').length;


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
            {/* Seeder Tool (Admin Only) */}
            <AcademySeeder />

            {/* Header Compacto */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
                <div className="flex flex-col gap-4">
                    {/* Top Row: Title & Stats */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">🎓 Academia Repaart</h1>
                                <span className="hidden md:inline-block w-px h-4 bg-slate-300 dark:bg-slate-600"></span>
                                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium hidden md:block">
                                    Tu camino hacia la excelencia operativa
                                </p>
                            </div>
                            
                            {/* Progress Bar Inline */}
                            <div className="flex items-center gap-3 mt-2 max-w-xl">
                                <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden border border-slate-200 dark:border-slate-600">
                                    <div
                                        className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(99,102,241,0.4)]"
                                        style={{ width: `${totalProgress}%` }}
                                    />
                                </div>
                                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">{Math.round(totalProgress)}% Completado</span>
                            </div>
                        </div>

                        {/* Mini Stats */}
                        <div className="flex items-center gap-3 shrink-0">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-100 dark:border-emerald-800">
                                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Módulos</span>
                                <span className="text-sm font-black text-emerald-700 dark:text-emerald-300">{completedCount}/{modules.length}</span>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Row: Search & Filters */}
                    <div className="flex flex-col sm:flex-row gap-2 items-center border-t border-slate-100 dark:border-slate-700/50 pt-3">
                        {/* Search Bar */}
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Buscar lecciones..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            />
                        </div>

                        {/* Compact Filter Buttons */}
                        <div className="flex gap-1 bg-slate-100 dark:bg-slate-700 p-0.5 rounded-lg border border-slate-200 dark:border-slate-600 w-full sm:w-auto overflow-x-auto">
                            <button
                                onClick={() => setStatusFilter('all')}
                                className={`px-3 py-1 rounded-md text-[10px] font-bold transition whitespace-nowrap flex-1 sm:flex-none ${statusFilter === 'all'
                                    ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                    }`}
                            >
                                Todos
                            </button>
                            <button
                                onClick={() => setStatusFilter('in_progress')}
                                className={`px-3 py-1 rounded-md text-[10px] font-bold transition whitespace-nowrap flex-1 sm:flex-none ${statusFilter === 'in_progress'
                                    ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow-sm'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                    }`}
                            >
                                En Curso
                            </button>
                            <button
                                onClick={() => setStatusFilter('completed')}
                                className={`px-3 py-1 rounded-md text-[10px] font-bold transition whitespace-nowrap flex-1 sm:flex-none ${statusFilter === 'completed'
                                    ? 'bg-white dark:bg-slate-600 text-emerald-600 dark:text-emerald-400 shadow-sm'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                    }`}
                            >
                                Listos
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modules Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {filteredModules.map((module) => {
                    const status = getModuleStatus(module);
                    const moduleProgress = module.id ? progress[module.id] : undefined;

                    return (
                        <ModuleCard
                            key={module.id}
                            module={module}
                            status={status}
                            progress={moduleProgress ? {
                                progress: moduleProgress.progress || 0,
                                completedLessons: Array.isArray(moduleProgress.completedLessons)
                                    ? moduleProgress.completedLessons.length
                                    : (moduleProgress.completedLessons || 0),
                                quizScore: moduleProgress.quizScore
                            } : undefined}
                            onClick={() => onModuleClick(module)}
                        />
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
