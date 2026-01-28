import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, Crown, Medal, Award, Calendar, BarChart3 } from 'lucide-react';

export interface RankingEntry {
    id: string;
    riderId: string;
    riderName: string;
    avatar?: string;
    position: number;
    previousPosition?: number;
    score: number;
    hours: number;
    shifts: number;
    efficiency: number;
}

export interface RiderRankingsProps {
    weeklyRankings: RankingEntry[];
    monthlyRankings: RankingEntry[];
    currentRiderId: string;
}

const RiderRankings: React.FC<RiderRankingsProps> = ({ weeklyRankings, monthlyRankings, currentRiderId }) => {
    const [period, setPeriod] = useState<'weekly' | 'monthly'>('weekly');

    const rankings = period === 'weekly' ? weeklyRankings : monthlyRankings;
    const currentRiderEntry = rankings.find(e => e.riderId === currentRiderId);

    const getRankChange = (current: number, previous?: number) => {
        if (!previous) return 'same';
        if (current < previous) return 'up';
        if (current > previous) return 'down';
        return 'same';
    };

    const getRankChangeValue = (current: number, previous?: number) => {
        if (!previous) return 0;
        return previous - current;
    };

    const getRankChangeIcon = (change: 'up' | 'down' | 'same') => {
        switch (change) {
            case 'up':
                return <TrendingUp size={14} className="text-emerald-500" />;
            case 'down':
                return <TrendingDown size={14} className="text-rose-500" />;
            case 'same':
            default:
                return <Minus size={14} className="text-slate-400" />;
        }
    };

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

    const getScoreColor = (score: number, index: number) => {
        if (index === 0) return 'text-amber-500';
        if (index === 1) return 'text-slate-400';
        if (index === 2) return 'text-amber-700';
        if (score >= 90) return 'text-emerald-500';
        if (score >= 70) return 'text-blue-500';
        if (score >= 50) return 'text-amber-500';
        return 'text-slate-400';
    };

    const getRankBackgroundColor = (index: number) => {
        switch (index) {
            case 0:
                return 'bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/10 border-amber-300 dark:border-amber-700';
            case 1:
                return 'bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800/30 dark:to-slate-700/20 border-slate-300 dark:border-slate-700';
            case 2:
                return 'bg-gradient-to-r from-amber-100 to-amber-50 dark:from-amber-800/20 dark:to-amber-900/10 border-amber-300 dark:border-amber-700';
            default:
                return 'bg-white dark:bg-slate-800/30 border-slate-200 dark:border-slate-700';
        }
    };

    return (
        <div className="rider-rankings">
            <div className="glass-premium rounded-[2rem] p-6 relative overflow-hidden">
                <div className="absolute top-0 bottom-0 left-0 w-1 bg-gradient-to-b from-rose-500 to-rose-400" />

                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <BarChart3 size={16} className="text-rose-500" />
                            Rankings
                        </h3>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPeriod('weekly')}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                                    period === 'weekly'
                                        ? 'bg-rose-600 text-white shadow-md'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                }`}
                            >
                                <Calendar size={14} />
                                Semanal
                            </button>
                            <button
                                onClick={() => setPeriod('monthly')}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                                    period === 'monthly'
                                        ? 'bg-rose-600 text-white shadow-md'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                }`}
                            >
                                <BarChart3 size={14} />
                                Mensual
                            </button>
                        </div>
                    </div>

                    {/* Current Rider Position */}
                    {currentRiderEntry && (
                        <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-900/20 rounded-xl border border-rose-200 dark:border-rose-800">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 uppercase tracking-widest">
                                        Tu Posición
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {getRankChangeIcon(getRankChange(currentRiderEntry.position, currentRiderEntry.previousPosition))}
                                    <span className="text-xl font-black text-rose-600 dark:text-rose-400">
                                        #{currentRiderEntry.position}
                                    </span>
                                </div>
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
                                        Horas
                                    </div>
                                    <div className="text-lg font-bold text-slate-800 dark:text-white">
                                        {currentRiderEntry.hours.toFixed(1)}
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">
                                        Turnos
                                    </div>
                                    <div className="text-lg font-bold text-slate-800 dark:text-white">
                                        {currentRiderEntry.shifts}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Ranking List */}
                    <div className="space-y-2">
                        {rankings.map((entry, index) => {
                            const rankChange = getRankChange(entry.position, entry.previousPosition);
                            const rankChangeValue = getRankChangeValue(entry.position, entry.previousPosition);
                            const isCurrentRider = entry.riderId === currentRiderId;

                            return (
                                <div
                                    key={entry.id}
                                    className={`
                                        flex items-center gap-3 p-3 rounded-lg border-2
                                        ${getRankBackgroundColor(index)}
                                        ${isCurrentRider ? 'ring-2 ring-rose-500/30' : 'hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-all'}
                                    `}
                                >
                                    {/* Rank */}
                                    <div className="flex items-center gap-2 min-w-[50px]">
                                        {index < 3 ? (
                                            getRankIcon(entry.position)
                                        ) : (
                                            <span className={`text-sm font-bold ${isCurrentRider ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500'}`}>
                                                {entry.position}
                                            </span>
                                        )}
                                    </div>

                                    {/* Avatar */}
                                    <div className={`w-8 h-8 rounded-full overflow-hidden ${isCurrentRider ? 'ring-2 ring-rose-400' : ''}`}>
                                        {entry.avatar ? (
                                            <img src={entry.avatar} alt={entry.riderName} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400">
                                                <Award size={14} />
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate">
                                            {entry.riderName}
                                        </div>
                                        <div className="flex items-center gap-2 text-[9px] text-slate-500">
                                            <span>{entry.hours.toFixed(1)}h</span>
                                            <span>{entry.shifts} turnos</span>
                                        </div>
                                    </div>

                                    {/* Score */}
                                    <div className="text-right">
                                        <div className={`text-base font-black ${getScoreColor(entry.score, index)}`}>
                                            {entry.score}
                                        </div>
                                        <div className="flex items-center justify-end gap-1">
                                            {getRankChangeIcon(rankChange)}
                                            {rankChangeValue !== 0 && (
                                                <span className={`text-[9px] font-bold ${
                                                    rankChange === 'up' ? 'text-emerald-500' :
                                                    rankChange === 'down' ? 'text-rose-500' : 'text-slate-400'
                                                }`}>
                                                    {rankChangeValue > 0 ? '+' : ''}{rankChangeValue}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RiderRankings;