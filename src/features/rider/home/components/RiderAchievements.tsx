import React, { useState } from 'react';
import { Award, Star, Clock, Zap, Shield, Target, Flame, Trophy, Lock, Check, ChevronRight } from 'lucide-react';

export interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: string;
    category: 'turns' | 'performance' | 'special' | 'consistency';
    progress: number;
    maxProgress: number;
    unlocked: boolean;
    unlockedAt?: Date;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    reward?: {
        points: number;
        badge?: string;
    };
}

export interface RiderAchievementsProps {
    achievements: Achievement[];
}

const RiderAchievements: React.FC<RiderAchievementsProps> = ({ achievements }) => {
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);

    const getAchievementIcon = (icon: string) => {
        const icons: Record<string, React.ReactNode> = {
            star: <Star size={20} />,
            clock: <Clock size={20} />,
            zap: <Zap size={20} />,
            shield: <Shield size={20} />,
            target: <Target size={20} />,
            flame: <Flame size={20} />,
            trophy: <Trophy size={20} />,
        };
        return icons[icon] || <Award size={20} />;
    };

    const getRarityColor = (rarity: string) => {
        switch (rarity) {
            case 'legendary':
                return {
                    bg: 'bg-amber-50 dark:bg-amber-900/20',
                    border: 'border-amber-300 dark:border-amber-700',
                    icon: 'text-amber-600 dark:text-amber-400',
                    progress: 'bg-amber-500',
                };
            case 'epic':
                return {
                    bg: 'bg-purple-50 dark:bg-purple-900/20',
                    border: 'border-purple-300 dark:border-purple-700',
                    icon: 'text-purple-600 dark:text-purple-400',
                    progress: 'bg-purple-500',
                };
            case 'rare':
                return {
                    bg: 'bg-blue-50 dark:bg-blue-900/20',
                    border: 'border-blue-300 dark:border-blue-700',
                    icon: 'text-blue-600 dark:text-blue-400',
                    progress: 'bg-blue-500',
                };
            default:
                return {
                    bg: 'bg-slate-50 dark:bg-slate-800/30',
                    border: 'border-slate-300 dark:border-slate-700',
                    icon: 'text-slate-600 dark:text-slate-400',
                    progress: 'bg-slate-500',
                };
        }
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'turns':
                return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400';
            case 'performance':
                return 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400';
            case 'special':
                return 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400';
            case 'consistency':
                return 'bg-rose-100 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400';
            default:
                return 'bg-slate-100 text-slate-700 dark:bg-slate-800/30 dark:text-slate-400';
        }
    };

    const getCategoryInitial = (category: string) => {
        switch (category) {
            case 'turns': return 'T';
            case 'performance': return 'P';
            case 'special': return 'E';
            case 'consistency': return 'C';
            default: return '';
        }
    };

    const filteredAchievements = achievements.filter(a => {
        if (selectedCategory === 'all') return true;
        return a.category === selectedCategory;
    });

    const unlockedCount = achievements.filter(a => a.unlocked).length;
    const totalProgress = achievements.reduce((acc, a) => acc + (a.progress / a.maxProgress), 0);

    return (
        <div className="rider-achievements">
            <div className="glass-premium rounded-[2rem] p-6 relative overflow-hidden">
                <div className="absolute top-0 bottom-0 left-0 w-1 bg-gradient-to-b from-purple-500 to-purple-400" />

                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <Award size={16} className="text-purple-500" />
                            Logros
                        </h3>
                        <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500">
                            <span>{unlockedCount}/{achievements.length} desbloqueados</span>
                            <span>{Math.round((totalProgress / achievements.length) * 100)}% progreso total</span>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-6">
                        {['all', 'turns', 'performance', 'special', 'consistency'].map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat as any)}
                                className={selectedCategory === cat ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all'}
                            >
                                {cat === 'all' ? 'Todas' : cat === 'turns' ? 'Turnos' : cat === 'performance' ? 'Rendimiento' : cat === 'special' ? 'Especiales' : 'Consistencia'}
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {filteredAchievements.map((achievement) => {
                            const rarityColors = getRarityColor(achievement.rarity);
                            const progressPercent = Math.min((achievement.progress / achievement.maxProgress) * 100, 100);
                            const categoryInitial = getCategoryInitial(achievement.category);

                            return (
                                <div
                                    key={achievement.id}
                                    onClick={() => setSelectedAchievement(achievement)}
                                    className={achievement.unlocked ? `${rarityColors.bg} ${rarityColors.border} cursor-pointer hover:scale-105 transition-all relative p-3 rounded-xl border-2` : 'bg-slate-50/50 dark:bg-slate-800/20 border-slate-200 dark:border-slate-700 opacity-60 relative p-3 rounded-xl border-2'}
                                >
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-2 ${achievement.unlocked ? rarityColors.icon : 'text-slate-400'}`}>
                                        {achievement.unlocked ? getAchievementIcon(achievement.icon) : <Lock size={20} />}
                                    </div>

                                    <div className="text-[10px] font-bold text-slate-800 dark:text-white truncate mb-1">
                                        {achievement.title}
                                    </div>

                                    <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                        <div className={`h-full ${rarityColors.progress} transition-all duration-500`} style={{ width: `${progressPercent}%` }} />
                                    </div>

                                    {achievement.unlocked && (
                                        <div className="absolute top-1 right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                                            <Check size={10} className="text-white" />
                                        </div>
                                    )}

                                    <div className={`absolute top-1 left-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${getCategoryColor(achievement.category)}`}>
                                        {categoryInitial}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {selectedAchievement && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedAchievement(null)}>
                    <div className="glass-premium rounded-[2rem] p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-start justify-between mb-4">
                            <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${getRarityColor(selectedAchievement?.rarity || 'common').icon}`}>
                                {getAchievementIcon(selectedAchievement?.icon || 'award')}
                            </div>
                            <button onClick={() => setSelectedAchievement(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">x</button>
                        </div>

                        <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
                            {selectedAchievement?.title}
                        </h4>

                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                            {selectedAchievement?.description}
                        </p>

                        <div className="flex items-center gap-2 mb-4">
                            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${getCategoryColor(selectedAchievement?.category || 'turns')}`}>
                                {selectedAchievement?.category === 'turns' ? 'Turnos' : selectedAchievement?.category === 'performance' ? 'Rendimiento' : selectedAchievement?.category === 'special' ? 'Especiales' : 'Consistencia'}
                            </span>
                            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${getRarityColor(selectedAchievement?.rarity || 'common').bg}`}>
                                {selectedAchievement?.rarity === 'legendary' ? 'Legendaria' : selectedAchievement?.rarity === 'epic' ? 'Épica' : selectedAchievement?.rarity === 'rare' ? 'Rara' : 'Común'}
                            </span>
                        </div>

                        <div className="mb-4">
                            <div className="flex justify-between text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                                <span>Progreso</span>
                                <span>{selectedAchievement?.progress}/{selectedAchievement?.maxProgress}</span>
                            </div>
                            <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div className={`h-full ${getRarityColor(selectedAchievement?.rarity || 'common').progress} transition-all duration-500`} style={{ width: `${Math.min(((selectedAchievement?.progress || 0) / (selectedAchievement?.maxProgress || 1)) * 100, 100)}%` }} />
                            </div>
                        </div>

                        {selectedAchievement?.reward && (
                            <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/30 rounded-lg border border-slate-200 dark:border-slate-700">
                                <Star size={14} className="text-amber-500" />
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    {selectedAchievement.reward.points} puntos
                                </span>
                                {selectedAchievement.reward.badge && (
                                    <>
                                        <ChevronRight size={14} className="text-slate-400" />
                                        <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                                            {selectedAchievement.reward.badge}
                                        </span>
                                    </>
                                )}
                            </div>
                        )}

                        {selectedAchievement?.unlockedAt && (
                            <div className="mt-4 text-[9px] text-slate-500 dark:text-slate-400">
                                Desbloqueado el {selectedAchievement.unlockedAt.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default RiderAchievements;