import { motion } from 'framer-motion';
import { Zap, TrendingUp, Star } from 'lucide-react';
import { AcademyProfile } from '../../../services/academyService';
import { calculateLevel, getNextLevel, getXpProgressToNextLevel, ACADEMY_LEVELS } from '../../../lib/academyGamification';

interface XpProgressBarProps {
    profile: AcademyProfile | null;
    compact?: boolean;
}

const XpProgressBar = ({ profile, compact = false }: XpProgressBarProps) => {
    const totalXp = profile?.total_xp ?? 0;
    const currentLevel = calculateLevel(totalXp);
    const nextLevel = getNextLevel(totalXp);
    const progressPercent = getXpProgressToNextLevel(totalXp);
    const currentLevelIndex = ACADEMY_LEVELS.findIndex(l => l.name === currentLevel.name);
    const isMaxLevel = !nextLevel;

    if (compact) {
        return (
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 px-3 py-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700"
            >
                <div className={`flex items-center gap-1.5 text-xs font-bold ${currentLevel.color}`}>
                    <Star className="w-3.5 h-3.5" />
                    <span>{currentLevel.name}</span>
                </div>
                <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden min-w-[60px]">
                    <motion.div
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                </div>
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 tabular-nums">
                    {totalXp} XP
                </span>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${currentLevel.bg}`}>
                        <Zap className={`w-4 h-4 ${currentLevel.color}`} />
                    </div>
                    <div>
                        <p className={`text-sm font-bold ${currentLevel.color}`}>
                            {currentLevel.name}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                            Nivel {currentLevelIndex + 1} de {ACADEMY_LEVELS.length}
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-lg font-black text-slate-900 dark:text-white tabular-nums">
                        {totalXp}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                        XP total
                    </p>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="relative">
                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full relative"
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
                    >
                        {/* Shimmer effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                    </motion.div>
                </div>

                {/* Labels */}
                <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                        {currentLevel.minXp} XP
                    </span>
                    {isMaxLevel ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-amber-500">
                            <TrendingUp className="w-3 h-3" />
                            ¡Nivel máximo!
                        </span>
                    ) : (
                        <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                            {nextLevel.minXp} XP
                        </span>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default XpProgressBar;
