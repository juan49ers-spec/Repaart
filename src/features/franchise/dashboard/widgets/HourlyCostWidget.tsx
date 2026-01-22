import { type FC } from 'react';
import { Timer, Info } from 'lucide-react';
import { formatMoney } from '../../../../lib/finance';
import { cn } from '../../../../lib/utils';

interface HourlyCostWidgetProps {
    totalCost: number;
    totalHours: number;
    trend?: number;
    laborCost?: number;
    otherCosts?: number;
}

const HourlyCostWidget: FC<HourlyCostWidgetProps> = ({
    totalCost,
    totalHours,
    laborCost = 0,
    otherCosts = 0
}) => {
    const costPerHour = totalHours > 0 ? totalCost / totalHours : 0;
    const laborCostPerHour = totalHours > 0 ? laborCost / totalHours : 0;
    const otherCostPerHour = totalHours > 0 ? otherCosts / totalHours : 0;

    const laborPercentage = totalCost > 0 ? (laborCost / totalCost) * 100 : 0;
    const otherPercentage = totalCost > 0 ? (otherCosts / totalCost) * 100 : 0;

    const INDUSTRY_BENCHMARK_MIN = 15;
    const INDUSTRY_BENCHMARK_MAX = 16;

    const isUnderBenchmark = costPerHour < INDUSTRY_BENCHMARK_MIN;
    const isOverBenchmark = costPerHour > INDUSTRY_BENCHMARK_MAX;

    const getStatus = () => {
        if (isOverBenchmark) return { label: 'excedido', color: 'text-ruby-600' };
        if (isUnderBenchmark) return { label: 'suboptimo', color: 'text-amber-500' };
        return { label: 'nominal', color: 'text-emerald-500' };
    };

    const status = getStatus();

    return (
        <div className="workstation-card workstation-scanline p-6 h-full flex flex-col group/card transition-all mechanical-press overflow-hidden">

            {/* HEADER */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-amber-50 dark:bg-amber-900/10 rounded-lg">
                        <Timer className="w-3.5 h-3.5 text-amber-600" />
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-slate-900 dark:text-white leading-tight">
                            Eficiencia Operativa
                        </h3>
                    </div>
                </div>
                <div className={cn("text-xs font-bold px-2 py-0.5 rounded capitalize", status.color)}>
                    {status.label}
                </div>
            </div>

            {/* MAIN PERFORMANCE DISPLAY */}
            <div className="mb-5">
                <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight tabular-nums">
                        {formatMoney(costPerHour)}€
                    </span>
                    <span className="text-xs font-medium text-slate-400 ml-1">por hora</span>
                </div>
            </div>

            {/* HIGH-DENSITY LOAD ANALYSIS */}
            <div className="space-y-1 mb-6">
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Carga Laboral</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-slate-400 tabular-nums">({laborPercentage.toFixed(0)}%)</span>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200 tabular-nums">{formatMoney(laborCostPerHour)}€/h</span>
                    </div>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Gastos Estructura</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-slate-400 tabular-nums">({otherPercentage.toFixed(0)}%)</span>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200 tabular-nums">{formatMoney(otherCostPerHour)}€/h</span>
                    </div>
                </div>
            </div>

            {/* SYSTEM THRESHOLD BENCHMARK */}
            <div className="mt-auto pt-4 border-t border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/5">
                    <Info className="w-3.5 h-3.5 text-slate-400" />
                    <p className="text-xs font-medium text-slate-500 leading-none">
                        Referencia: {INDUSTRY_BENCHMARK_MIN}-{INDUSTRY_BENCHMARK_MAX}€/h — <span className={cn("font-bold capitalize", status.color)}>{status.label}</span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default HourlyCostWidget;
