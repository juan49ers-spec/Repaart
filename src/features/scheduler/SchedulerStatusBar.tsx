import React from 'react';
import { Zap } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SchedulerStatusBarProps {
    totalCost: number;
    hoursCount: number;
    sheriffScore: number | null;
    hasChanges: boolean;
    onAutoFill: () => void;
    onOpenGuide?: () => void;
}

export const SchedulerStatusBar: React.FC<SchedulerStatusBarProps> = ({
    totalCost,
    hoursCount,
    sheriffScore,
    hasChanges,
    onAutoFill,
    onOpenGuide
}) => {
    return (
        <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-40">
            <div className="flex items-center gap-8">
                {/* Cost Metric - Plain & Simple */}
                <div className="flex flex-col">
                    <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Coste Semanal</span>
                    <div className="flex items-baseline gap-1 text-slate-900">
                        <span className="text-xl font-medium tracking-tight">
                            {totalCost.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </span>
                        <span className="text-xs font-medium text-slate-400">€</span>
                    </div>
                </div>

                {/* Operations Metric */}
                <div className="flex flex-col">
                    <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Carga Operativa</span>
                    <div className="flex items-baseline gap-1 text-slate-900">
                        <span className="text-xl font-medium tracking-tight">{hoursCount.toFixed(0)}</span>
                        <span className="text-xs font-medium text-slate-400">h</span>
                    </div>
                </div>

                {/* Sheriff Score - Simplified */}
                {sheriffScore !== null && (
                    <div className="flex flex-col">
                        <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Salud</span>
                        <div className="flex items-center gap-1.5">
                            <span className={cn("text-xl font-medium tracking-tight",
                                sheriffScore >= 90 ? "text-emerald-600" :
                                    sheriffScore >= 70 ? "text-amber-600" : "text-rose-600"
                            )}>
                                {sheriffScore}%
                            </span>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-4">
                {/* Guide Button - Text Only */}
                {onOpenGuide && (
                    <button
                        onClick={onOpenGuide}
                        className="text-slate-500 hover:text-slate-800 text-xs font-medium transition-colors"
                    >
                        Guía
                    </button>
                )}

                {hasChanges && (
                    <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded">Cambios sin guardar</span>
                )}

                <button
                    onClick={onAutoFill}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-medium transition-colors"
                >
                    <Zap size={14} />
                    Auto-Completar
                </button>
            </div>
        </div>
    );
};
