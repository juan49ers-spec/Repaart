import { motion } from 'framer-motion';
import { Trophy, Clock, BookOpen, Flame } from 'lucide-react';

interface AcademyStatsProps {
    totalModules: number;
    completedModules: number;
    totalLessons: number;
    completedLessons: number;
    totalMinutes: number;
    streakDays: number;
}

const AcademyStats = ({
    totalModules,
    completedModules,
    totalLessons,
    completedLessons,
    totalMinutes,
    streakDays
}: AcademyStatsProps) => {
    const stats = [
        {
            icon: BookOpen,
            label: 'Módulos',
            value: `${completedModules}/${totalModules}`,
            color: 'bg-blue-500',
            bgLight: 'bg-blue-50 dark:bg-blue-900/20',
            text: 'text-blue-600 dark:text-blue-400'
        },
        {
            icon: Trophy,
            label: 'Lecciones',
            value: `${completedLessons}/${totalLessons}`,
            color: 'bg-emerald-500',
            bgLight: 'bg-emerald-50 dark:bg-emerald-900/20',
            text: 'text-emerald-600 dark:text-emerald-400'
        },
        {
            icon: Clock,
            label: 'Tiempo',
            value: `${totalMinutes}h`,
            color: 'bg-purple-500',
            bgLight: 'bg-purple-50 dark:bg-purple-900/20',
            text: 'text-purple-600 dark:text-purple-400'
        },
        {
            icon: Flame,
            label: 'Racha',
            value: `${streakDays} días`,
            color: 'bg-amber-500',
            bgLight: 'bg-amber-50 dark:bg-amber-900/20',
            text: 'text-amber-600 dark:text-amber-400'
        }
    ];

    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-3"
                    >
                        <div className="flex items-start justify-between mb-2">
                            <div className={`${stat.bgLight} p-2 rounded-md`}>
                                <Icon className={`w-4 h-4 ${stat.text}`} />
                            </div>
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: index * 0.03 + 0.1, type: 'spring' }}
                            >
                                <div className={`w-2 h-2 ${stat.color} rounded-full`} />
                            </motion.div>
                        </div>
                        <p className="text-[10px] text-slate-600 dark:text-slate-400 mb-0.5 font-medium">
                            {stat.label}
                        </p>
                        <p className={`text-lg font-bold ${stat.text}`}>
                            {stat.value}
                        </p>
                    </motion.div>
                );
            })}
        </div>
    );
};

export { AcademyStats };