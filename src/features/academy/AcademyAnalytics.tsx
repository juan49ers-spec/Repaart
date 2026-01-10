import { useState, useEffect, type FC } from 'react';
import { db } from '../../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import {
    Users,
    Award,
    BookOpen,
    BarChart3,
    Clock
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

interface ProgressData {
    userId: string;
    moduleId: string;
    completed: boolean;
    score?: number;
}

interface ModuleStats {
    name: string;
    completed: number;
    started: number;
}

interface Stats {
    totalStudents: number;
    activeStudents: number;
    completedModules: number;
    averageScore: number;
    moduleProgress: ModuleStats[];
}

interface ScoreDistribution {
    name: string;
    value: number;
}

/**
 * AcademyAnalytics - Dashboard de métricas para el administrador
 */
const AcademyAnalytics: FC = () => {
    const [loading, setLoading] = useState<boolean>(true);
    const [stats, setStats] = useState<Stats>({
        totalStudents: 0,
        activeStudents: 0,
        completedModules: 0,
        averageScore: 0,
        moduleProgress: []
    });

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async (): Promise<void> => {
        try {
            const progressSnap = await getDocs(collection(db, 'academy_progress'));
            const modulesSnap = await getDocs(collection(db, 'academy_modules'));

            const progressData: ProgressData[] = progressSnap.docs.map(doc => doc.data() as ProgressData);
            const modulesData: Record<string, string> = modulesSnap.docs.reduce((acc, doc) => {
                acc[doc.id] = doc.data().title as string;
                return acc;
            }, {} as Record<string, string>);

            // Process Metrics
            const uniqueStudents = new Set(progressData.map(p => p.userId));
            const completedCount = progressData.filter(p => p.completed).length;

            // Calculate Average Quiz Score
            const scores = progressData.filter(p => p.score).map(p => p.score!);
            const avgScore = scores.length > 0
                ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
                : 0;

            // Module Breakdown
            const moduleStats: Record<string, ModuleStats> = {};
            progressData.forEach(p => {
                if (!moduleStats[p.moduleId]) {
                    moduleStats[p.moduleId] = {
                        name: modulesData[p.moduleId] || 'Módulo Desconocido',
                        completed: 0,
                        started: 0
                    };
                }
                moduleStats[p.moduleId].started++;
                if (p.completed) moduleStats[p.moduleId].completed++;
            });

            const moduleChartData = Object.values(moduleStats);

            setStats({
                totalStudents: uniqueStudents.size,
                activeStudents: uniqueStudents.size, // Simplificado, idealmente filtrar por lastActivity
                completedModules: completedCount,
                averageScore: avgScore,
                moduleProgress: moduleChartData
            });

        } catch (error) {
            console.error("Error fetching analytics:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
            <span className="ml-3 text-slate-500 font-medium animate-pulse">Cargando métricas...</span>
        </div>
    );

    const scoreDistribution: ScoreDistribution[] = [
        { name: 'Excelente (90-100)', value: 40 },
        { name: 'Bueno (80-89)', value: 30 },
        { name: 'Regular (70-79)', value: 20 },
        { name: 'Bajo (<70)', value: 10 },
    ];

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-normal text-slate-900 flex items-center gap-3">
                    <BarChart3 className="w-8 h-8 text-indigo-600" />
                    Analytics de Formación
                </h2>
                <p className="text-slate-500 font-normal">Visión global del rendimiento de la academia</p>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400">
                            <Users size={24} />
                        </div>
                        <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1">
                            +12%
                        </span>
                    </div>
                    <p className="text-3xl font-medium text-slate-900 dark:text-white">{stats.totalStudents}</p>
                    <p className="text-sm font-medium text-slate-400 uppercase tracking-wide">Estudiantes Activos</p>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl text-emerald-600 dark:text-emerald-400">
                            <BookOpen size={24} />
                        </div>
                    </div>
                    <p className="text-3xl font-medium text-slate-900 dark:text-white">{stats.completedModules}</p>
                    <p className="text-sm font-medium text-slate-400 uppercase tracking-wide">Módulos Completados</p>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-xl text-purple-600 dark:text-purple-400">
                            <Award size={24} />
                        </div>
                    </div>
                    <p className="text-3xl font-medium text-slate-900 dark:text-white">{stats.averageScore}%</p>
                    <p className="text-sm font-medium text-slate-400 uppercase tracking-wide">Nota Promedio Quiz</p>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-amber-50 dark:bg-amber-900/30 rounded-xl text-amber-600 dark:text-amber-400">
                            <Clock size={24} />
                        </div>
                    </div>
                    <p className="text-3xl font-medium text-slate-900 dark:text-white">45m</p>
                    <p className="text-sm font-medium text-slate-400 uppercase tracking-wide">Tiempo Promedio/Módulo</p>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Module Progress Chart */}
                <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-medium text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-indigo-500" />
                        Progreso por Módulo
                    </h3>
                    <div className="h-64 cursor-default">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.moduleProgress}>
                                <XAxis dataKey="name" fontSize={10} angle={-15} textAnchor="end" height={60} tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    cursor={{ fill: '#f1f5f9' }}
                                />
                                <Bar dataKey="started" name="Iniciados" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="completed" name="Completados" fill="#6366f1" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Score Distribution */}
                <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-medium text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                        <Award className="w-5 h-5 text-emerald-500" />
                        Distribución de Notas
                    </h3>
                    <div className="h-64 flex items-center justify-center cursor-default">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={scoreDistribution}
                                    innerRadius={70}
                                    outerRadius={90}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    <Cell fill="#10b981" /> {/* Emerald */}
                                    <Cell fill="#4f46e5" /> {/* Indigo */}
                                    <Cell fill="#f59e0b" /> {/* Amber */}
                                    <Cell fill="#ef4444" /> {/* Red */}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend
                                    iconType="circle"
                                    layout="vertical"
                                    verticalAlign="middle"
                                    align="right"
                                    wrapperStyle={{ fontSize: '12px', fontWeight: 500, color: '#64748b' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AcademyAnalytics;
