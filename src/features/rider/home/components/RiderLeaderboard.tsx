import React from 'react';
import { Trophy, Medal, Award, Crown, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface LeaderboardEntry {
    id: string;
    riderId: string;
    riderName: string;
    avatar?: string;
    score: number;
    weeklyHours: number;
    monthlyHours: number;
    efficiency: number;
    rankChange?: 'up' | 'down' | 'same';
    rankChangeValue?: number;
}

export interface RiderLeaderboardProps {
    entries: LeaderboardEntry[];
    currentRiderId: string;
}

const RiderLeaderboard: React.FC<RiderLeaderboardProps> = ({ entries, currentRiderId }) => {
    const currentRiderEntry = entries.find(e => e.riderId === currentRiderId);
    const top3 = entries.slice(0, 3);

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1:
                return <Crown size={16} className="text-amber-500" />;
            case 2:
                return <Medal size={16} className="text-slate-400" />;
            case 3:
                return <Award size={16} className="text-amber-700" />;
            default:
                return <span className="text-xs font-bold text-slate-500">{rank}</span>;
        }
    };

    const getRankChangeIcon = (change?: 'up' | 'down' | 'same') => {
        switch (change) {
            case 'up':
                return <TrendingUp size={12} className="text-emerald-500" />;
            case 'down':
                return <TrendingDown size={12} className="text-rose-500" />;
            case 'same':
            default:
                return <Minus size={12} className="text-slate-400" />;
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 90) return 'text-emerald-500';
        if (score >= 70) return 'text-blue-500';
        if (score >= 50) return 'text-amber-500';
        return 'text-slate-400';
    };

    return (
        <div className="rider-leaderboard">
            <div className="glass-premium rounded-[2rem] p-6 relative overflow-hidden">
                <div className="absolute top-0 bottom-0 left-0 w-1 bg-gradient-to-b from-amber-500 to-amber-400" />

                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <Trophy size={16} className="text-amber-500" />
                            Leaderboard
                        </h3>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            Top 10
                        </span>
                    </div>

                    {/* Podium - Top 3 */}
                    <div className="grid grid-cols-3 gap-3 mb-6">
                        {top3.map((entry, index) => (
                            <div
                                key={entry.id}
                                className={`
                                    relative p-3 rounded-xl text-center
                                    ${index === 0
                                        ? 'bg-gradient-to-b from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/10 border-2 border-amber-300 dark:border-amber-700'
                                        : 'bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700'
                                    }
                                `}
                            >
                                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center shadow-lg">
                                    {getRankIcon(index + 1)}
                                </div>
                                <div className={`w-10 h-10 rounded-full mx-auto mb-2 overflow-hidden ${index === 0 ? 'ring-2 ring-amber-400' : ''}`}>
                                    {entry.avatar ? (
                                        <img src={entry.avatar} alt={entry.riderName} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400">
                                            <Award size={18} />
                                        </div>
                                    )}
                                </div>
                                <div className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate">
                                    {entry.riderName.split(' ')[0]}
                                </div>
                                <div className={`text-lg font-black ${getScoreColor(entry.score)}`}>
                                    {entry.score}
                                </div>
                                <div className="flex items-center justify-center gap-1 mt-1">
                                    {getRankChangeIcon(entry.rankChange)}
                                    {entry.rankChangeValue !== undefined && (
                                        <span className={`text-[9px] font-bold ${
                                            entry.rankChange === 'up' ? 'text-emerald-500' :
                                            entry.rankChange === 'down' ? 'text-rose-500' : 'text-slate-400'
                                        }`}>
                                            {entry.rankChangeValue > 0 ? '+' : ''}{entry.rankChangeValue}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Full List */}
                    <div className="space-y-2">
                        {entries.map((entry, index) => (
                            <div
                                key={entry.id}
                                className={`
                                    flex items-center gap-3 p-3 rounded-lg
                                    ${entry.riderId === currentRiderId
                                        ? 'bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 ring-1 ring-indigo-500/30'
                                        : 'bg-white dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/30'
                                    }
                                    transition-all cursor-pointer
                                `}
                            >
                                <div className="flex items-center gap-2 min-w-[40px]">
                                    {index < 3 ? (
                                        getRankIcon(index + 1)
                                    ) : (
                                        <span className={`text-sm font-bold ${
                                            entry.riderId === currentRiderId
                                                ? 'text-indigo-600 dark:text-indigo-400'
                                                : 'text-slate-500'
                                        }`}>
                                            {index + 1}
                                        </span>
                                    )}
                                </div>

                                <div className={`w-8 h-8 rounded-full overflow-hidden ${entry.riderId === currentRiderId ? 'ring-2 ring-indigo-400' : ''}`}>
                                    {entry.avatar ? (
                                        <img src={entry.avatar} alt={entry.riderName} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400">
                                            <Award size={14} />
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate">
                                        {entry.riderName}
                                    </div>
                                    <div className="text-[9px] text-slate-500">
                                        {entry.weeklyHours.toFixed(1)}h sem
                                    </div>
                                </div>

                                <div className="text-right">
                                    <div className={`text-base font-black ${getScoreColor(entry.score)}`}>
                                        {entry.score}
                                    </div>
                                    <div className="flex items-center justify-end gap-1">
                                        {getRankChangeIcon(entry.rankChange)}
                                        {entry.rankChangeValue !== undefined && (
                                            <span className={`text-[9px] font-bold ${
                                                entry.rankChange === 'up' ? 'text-emerald-500' :
                                                entry.rankChange === 'down' ? 'text-rose-500' : 'text-slate-400'
                                            }`}>
                                                {entry.rankChangeValue > 0 ? '+' : ''}{entry.rankChangeValue}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Current Rider Stats */}
                    {currentRiderEntry && (
                        <div className="mt-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <Trophy size={14} className="text-indigo-500" />
                                    <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-widest">
                                        Tu Posición
                                    </span>
                                </div>
                                <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">
                                    #{entries.findIndex(e => e.riderId === currentRiderId) + 1}
                                </span>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <div className="text-center">
                                    <div className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">
                                        Score
                                    </div>
                                    <div className="text-lg font-bold text-slate-800 dark:text-white">
                                        {currentRiderEntry.score}
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">
                                        Horas Sem
                                    </div>
                                    <div className="text-lg font-bold text-slate-800 dark:text-white">
                                        {currentRiderEntry.weeklyHours.toFixed(1)}h
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">
                                        Eficiencia
                                    </div>
                                    <div className="text-lg font-bold text-slate-800 dark:text-white">
                                        {currentRiderEntry.efficiency.toFixed(1)}%
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RiderLeaderboard;