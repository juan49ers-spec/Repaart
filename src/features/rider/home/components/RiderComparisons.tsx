import React from 'react';
import { ArrowUp, ArrowDown, Minus, TrendingUp, BarChart, Users, Target, Zap } from 'lucide-react';

export interface RiderStats {
    riderId: string;
    riderName: string;
    avatar?: string;
    score: number;
    hours: number;
    shifts: number;
    efficiency: number;
    position: number;
}

export interface RiderComparisonsProps {
    currentRider: RiderStats;
    aboveRider?: RiderStats;
    belowRider?: RiderStats;
    teamAverage: {
        score: number;
        hours: number;
        shifts: number;
        efficiency: number;
    };
}

const RiderComparisons: React.FC<RiderComparisonsProps> = ({
    currentRider,
    aboveRider,
    belowRider,
    teamAverage
}) => {
    const getComparison = (current: number, other: number) => {
        if (current > other) return 'better';
        if (current < other) return 'worse';
        return 'equal';
    };

    const getComparisonColor = (comparison: 'better' | 'worse' | 'equal') => {
        switch (comparison) {
            case 'better':
                return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20';
            case 'worse':
                return 'text-rose-500 bg-rose-50 dark:bg-rose-900/20';
            case 'equal':
            default:
                return 'text-slate-500 bg-slate-50 dark:bg-slate-800/30';
        }
    };

    const getComparisonIcon = (comparison: 'better' | 'worse' | 'equal') => {
        switch (comparison) {
            case 'better':
                return <ArrowUp size={14} className="text-emerald-500" />;
            case 'worse':
                return <ArrowDown size={14} className="text-rose-500" />;
            case 'equal':
            default:
                return <Minus size={14} className="text-slate-400" />;
        }
    };

    const getComparisonLabel = (comparison: 'better' | 'worse' | 'equal') => {
        switch (comparison) {
            case 'better':
                return 'Superior';
            case 'worse':
                return 'Inferior';
            case 'equal':
            default:
                return 'Igual';
        }
    };

    const getComparisonPercentage = (current: number, other: number) => {
        if (other === 0) return 0;
        const percentage = ((current - other) / other) * 100;
        return Math.round(percentage);
    };

    const renderStatCard = (
        label: string,
        currentValue: number,
        compareValue: number,
        icon: React.ReactNode,
        unit: string = '',
        isPercentage = false
    ) => {
        const comparison = getComparison(currentValue, compareValue);
        const percentage = getComparisonPercentage(currentValue, compareValue);

        return (
            <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-400">
                    {icon}
                </div>
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            {label}
                        </span>
                        <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold ${getComparisonColor(comparison)}`}>
                            {getComparisonIcon(comparison)}
                            <span>{getComparisonLabel(comparison)}</span>
                        </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-lg font-black text-slate-800 dark:text-white">
                            {currentValue.toFixed(1)}{unit}
                        </span>
                        <span className="text-xs text-slate-500">
                            (vs {compareValue.toFixed(1)}{unit})
                        </span>
                    </div>
                    {comparison !== 'equal' && (
                        <div className="text-[9px] font-bold">
                            {percentage > 0 ? '+' : ''}{percentage}%
                            {isPercentage ? '' : ' más'}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="rider-comparisons">
            <div className="glass-premium rounded-[2rem] p-6 relative overflow-hidden">
                <div className="absolute top-0 bottom-0 left-0 w-1 bg-gradient-to-b from-blue-500 to-blue-400" />

                <div className="relative z-10">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <BarChart size={16} className="text-blue-500" />
                            Comparativas
                        </h3>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                            <Users size={12} />
                            Equipo
                        </div>
                    </div>

                    {/* Current Rider vs Above */}
                    {aboveRider && (
                        <div className="mb-4">
                            <div className="flex items-center gap-3 mb-3">
                                <div className={`w-8 h-8 rounded-full overflow-hidden ring-2 ${getComparisonColor(getComparison(currentRider.score, aboveRider.score))}`}>
                                    {aboveRider.avatar ? (
                                        <img src={aboveRider.avatar} alt={aboveRider.riderName} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400">
                                            <Users size={14} />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                                        Posición #{aboveRider.position}
                                    </div>
                                    <div className="text-sm font-bold text-slate-800 dark:text-white">
                                        {aboveRider.riderName}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700">
                                    <Target size={14} className="text-amber-500" />
                                    <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-widest">
                                        Objetivo
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                {renderStatCard('Score', currentRider.score, aboveRider.score, <BarChart size={16} />)}
                                {renderStatCard('Horas', currentRider.hours, aboveRider.hours, <TrendingUp size={16} />, 'h')}
                                {renderStatCard('Eficiencia', currentRider.efficiency, aboveRider.efficiency, <Zap size={16} />, '%', true)}
                            </div>
                        </div>
                    )}

                    {/* Current Rider vs Team Average */}
                    <div className="mb-4">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white ring-2 ring-blue-500/50">
                                <Users size={14} />
                            </div>
                            <div className="flex-1">
                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                                    Promedio Equipo
                                </div>
                                <div className="text-sm font-bold text-slate-800 dark:text-white">
                                    Todos los Riders
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-700">
                                <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                    <BarChart size={16} />
                                </div>
                                <div className="flex-1">
                                    <div className="text-[9px] text-slate-500 mb-1">Tu Score</div>
                                    <div className="text-base font-bold text-slate-800 dark:text-white">
                                        {currentRider.score}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-700">
                                <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-400">
                                    <Users size={16} />
                                </div>
                                <div className="flex-1">
                                    <div className="text-[9px] text-slate-500 mb-1">Promedio</div>
                                    <div className="text-base font-bold text-slate-800 dark:text-white">
                                        {teamAverage.score}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mt-3">
                            {renderStatCard('Horas', currentRider.hours, teamAverage.hours, <TrendingUp size={16} />, 'h')}
                            {renderStatCard('Eficiencia', currentRider.efficiency, teamAverage.efficiency, <Zap size={16} />, '%', true)}
                        </div>
                    </div>

                    {/* Current Rider vs Below */}
                    {belowRider && (
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className={`w-8 h-8 rounded-full overflow-hidden ring-2 ${getComparisonColor(getComparison(belowRider.score, currentRider.score))}`}>
                                    {belowRider.avatar ? (
                                        <img src={belowRider.avatar} alt={belowRider.riderName} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400">
                                            <Users size={14} />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                                        Posición #{belowRider.position}
                                    </div>
                                    <div className="text-sm font-bold text-slate-800 dark:text-white">
                                        {belowRider.riderName}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700">
                                    <TrendingUp size={14} className="text-emerald-500" />
                                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">
                                        Superas
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                {renderStatCard('Score', currentRider.score, belowRider.score, <BarChart size={16} />)}
                                {renderStatCard('Horas', currentRider.hours, belowRider.hours, <TrendingUp size={16} />, 'h')}
                                {renderStatCard('Eficiencia', currentRider.efficiency, belowRider.efficiency, <Zap size={16} />, '%', true)}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RiderComparisons;