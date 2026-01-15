import React from 'react';
import { AlertCircle, CheckCircle2, HelpCircle, Zap } from 'lucide-react';
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
        <div className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-50">
            <div className="flex items-center gap-12">
                {/* Cost Metric */}
                <div className="flex flex-col">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Coste Semanal</span>
                    <div className="flex items-baseline gap-1 text-slate-900">
                        <span className="text-2xl font-light tracking-tight">
                            {totalCost.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </span>
                        <span className="text-sm font-medium text-slate-400">€</span>
                    </div>
                </div>

                {/* Operations Metric */}
                <div className="flex flex-col">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Carga Operativa</span>
                    <div className="flex items-baseline gap-1 text-slate-900">
                        <span className="text-2xl font-light tracking-tight">{hoursCount.toFixed(0)}</span>
                        <span className="text-sm font-medium text-slate-400">h</span>
                    </div>
                </div>

                {/* Sheriff Score */}
                {sheriffScore !== null && (
                    <div className="flex flex-col">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Salud</span>
                        <div className="flex items-center gap-2">
                            <span className={cn("text-2xl font-light tracking-tight",
                                sheriffScore >= 90 ? "text-emerald-600" :
                                    sheriffScore >= 70 ? "text-amber-600" : "text-rose-600"
                            )}>
                                {sheriffScore}%
                            </span>
                            {sheriffScore >= 90 ? (
                                <CheckCircle2 size={16} className="text-emerald-500" />
                            ) : (
                                <AlertCircle size={16} className={sheriffScore >= 70 ? "text-amber-500" : "text-rose-500"} />
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-6">
                {/* Guide Button */}
                {onOpenGuide && (
                    <>
                        <button
                            onClick={onOpenGuide}
                            className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-semibold rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors border border-indigo-200 dark:border-indigo-800"
                        >
                            <HelpCircle size={14} />
                            <span>Guía</span>
                        </button>
                        <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-2 hidden sm:block" />
                    </>
                )}

                {hasChanges && (
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        <span className="text-xs font-medium text-amber-600">Cambios sin guardar</span>
                    </div>
                )}

                <button
                    onClick={onAutoFill}
                    className="flex items-center gap-2 px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-medium transition-colors shadow-sm"
                >
                    <Zap size={14} />
                    Auto-Completar
                </button>
            </div>
        </div>
    );
};
