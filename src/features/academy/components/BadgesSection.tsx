import { motion } from 'framer-motion';
import { Award, Star, Lock } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface Badge {
    id: string;
    title: string;
    description: string;
    icon: string;
    unlocked: boolean;
    progress?: number;
    category: 'completion' | 'streak' | 'time' | 'milestone';
}

interface BadgesSectionProps {
    badges: Badge[];
}

const BadgesSection = ({ badges }: BadgesSectionProps) => {
    const categoryColors = {
        completion: {
            bg: 'bg-blue-100 dark:bg-blue-900/30',
            icon: 'bg-blue-600 dark:bg-blue-500',
            text: 'text-blue-700 dark:text-blue-400'
        },
        streak: {
            bg: 'bg-amber-100 dark:bg-amber-900/30',
            icon: 'bg-amber-600 dark:bg-amber-500',
            text: 'text-amber-700 dark:text-amber-400'
        },
        time: {
            bg: 'bg-emerald-100 dark:bg-emerald-900/30',
            icon: 'bg-emerald-600 dark:bg-emerald-500',
            text: 'text-emerald-700 dark:text-emerald-400'
        },
        milestone: {
            bg: 'bg-purple-100 dark:bg-purple-900/30',
            icon: 'bg-purple-600 dark:bg-purple-500',
            text: 'text-purple-700 dark:text-purple-400'
        }
    };

    const unlockedCount = badges.filter(b => b.unlocked).length;

    return (
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4">
            <div className="flex items-center justify-between mb-3">
                <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-0.5">
                        Logros
                    </h3>
                    <p className="text-[10px] text-slate-600 dark:text-slate-400">
                        {unlockedCount} de {badges.length} desbloqueados
                    </p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center shadow-sm">
                    <Award className="w-5 h-5 text-white" />
                </div>
            </div>

            {/* Progress Overview */}
            <div className="mb-4">
                <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Progreso total</span>
                    <span className="text-blue-600 dark:text-blue-400 font-bold">{Math.round((unlockedCount / badges.length) * 100)}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full transition-all duration-300"
                        style={{ width: `${(unlockedCount / badges.length) * 100}%` }}
                        initial={{ width: 0 }}
                    />
                </div>
            </div>

            {/* Badges Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {badges.map((badge, index) => {
                    const colors = categoryColors[badge.category];
                    const Icon = badge.unlocked ? Star : Lock;

                    return (
                        <motion.div
                            key={badge.id}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.02 }}
                            className={cn(
                                "rounded-lg border-2 p-3",
                                badge.unlocked
                                    ? 'bg-white dark:bg-slate-900 border-amber-200 dark:border-amber-800'
                                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 opacity-60'
                            )}
                        >
                            <div className="flex items-start justify-between mb-2">
                                <div className={cn(
                                    "w-10 h-10 rounded-lg flex items-center justify-center",
                                    badge.unlocked ? colors.icon : 'bg-slate-200 dark:bg-slate-700'
                                )}>
                                    <Icon className={cn(
                                        "w-5 h-5",
                                        badge.unlocked ? 'text-white' : 'text-slate-400'
                                    )} />
                                </div>
                                {badge.progress !== undefined && badge.progress > 0 && badge.progress < 100 && (
                                    <div className="flex items-center gap-1">
                                        <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400">
                                            {badge.progress}%
                                        </span>
                                    </div>
                                )}
                            </div>

                            <h4 className={cn(
                                "text-xs font-semibold mb-1",
                                badge.unlocked ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'
                            )}>
                                {badge.title}
                            </h4>
                            <p className={cn(
                                "text-xs line-clamp-2",
                                badge.unlocked ? 'text-slate-600 dark:text-slate-400' : 'text-slate-500 dark:text-slate-500'
                            )}>
                                {badge.description}
                            </p>

                            {badge.progress !== undefined && badge.progress < 100 && (
                                <div className="mt-2">
                                    <div className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full bg-amber-500 rounded-full transition-all duration-300"
                                            style={{ width: `${badge.progress}%` }}
                                            initial={{ width: 0 }}
                                        />
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

export default BadgesSection;