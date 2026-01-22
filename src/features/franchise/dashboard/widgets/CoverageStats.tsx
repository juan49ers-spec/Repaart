import React from 'react';
import { Users, AlertTriangle, Clock } from 'lucide-react';

interface CoverageStatsProps {
    totalHours: number;
    coveredHours: number;
    criticalSlots: any[];
    topRiders: any[];
}

const CoverageStats: React.FC<CoverageStatsProps> = ({
    totalHours,
    coveredHours,
    criticalSlots,
    topRiders
}) => {
    const coveragePercent = totalHours > 0 ? (coveredHours / totalHours) * 100 : 0;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Main Coverage Ring */}
            <div className="glass-panel-exec p-4 rounded-xl flex items-center gap-4 border-0 ring-1 ring-white/10">
                <div className="relative w-16 h-16 shrink-0">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle
                            cx="32"
                            cy="32"
                            r="28"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="transparent"
                            className="text-slate-800"
                        />
                        <circle
                            cx="32"
                            cy="32"
                            r="28"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="transparent"
                            strokeDasharray={175.9}
                            strokeDashoffset={175.9 - (175.9 * coveragePercent) / 100}
                            className={`${coveragePercent > 90 ? 'text-emerald-400' : 'text-ruby-500'} transition-all duration-1000 ease-out`}
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-black text-white">{Math.round(coveragePercent)}%</span>
                    </div>
                </div>
                <div>
                    <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Cobertura Total</h4>
                    <p className="text-xl font-black text-white italic tracking-tighter">
                        {coveredHours} / {totalHours}h
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                        <Clock size={10} className="text-slate-500" />
                        <span className="text-[9px] text-slate-500 font-bold uppercase">Estado Operativo</span>
                    </div>
                </div>
            </div>

            {/* Top Riders */}
            <div className="glass-panel-exec p-4 rounded-xl border-0 ring-1 ring-purple-500/20">
                <div className="flex items-center mb-3">
                    <Users className="text-purple-400" size={24} />
                    <span className="ml-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">Top Riders</span>
                </div>
                <div className="space-y-2">
                    {topRiders.map((rider, idx) => (
                        <div key={rider.name} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-purple-400">#{idx + 1}</span>
                                <span className="text-sm font-medium text-slate-200 truncate">{rider.name}</span>
                            </div>
                            <span className="text-xs font-bold text-purple-400">{rider.hours}h</span>
                        </div>
                    ))}
                    {topRiders.length === 0 && (
                        <p className="text-xs text-slate-500 italic">Sin datos</p>
                    )}
                </div>
            </div>

            {/* Critical Gaps */}
            <div className="glass-panel-exec p-4 rounded-xl border-0 ring-1 ring-orange-500/20">
                <div className="flex items-center mb-3">
                    <AlertTriangle className="text-orange-400" size={24} />
                    <span className="ml-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">Gaps Críticos</span>
                </div>
                {criticalSlots.length > 0 ? (
                    <div className="space-y-2">
                        {criticalSlots.slice(0, 3).map((slot, idx) => (
                            <div key={idx} className="flex items-center justify-between text-xs">
                                <span className="text-slate-300 font-medium">{slot.day} - {slot.time}</span>
                                <span className="text-orange-400 font-bold">-{slot.missing} riders</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full pb-4">
                        <span className="text-[10px] text-emerald-400 font-bold uppercase">Sistema Seguro</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CoverageStats;
