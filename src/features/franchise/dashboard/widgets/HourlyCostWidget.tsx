import { type FC } from 'react';
import { Clock, TrendingDown, TrendingUp, Info, Users, Euro } from 'lucide-react';
import { formatMoney } from '../../../../lib/finance';

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
    trend = 0,
    laborCost = 0,
    otherCosts = 0
}) => {
    const costPerHour = totalHours > 0 ? totalCost / totalHours : 0;
    const laborCostPerHour = totalHours > 0 ? laborCost / totalHours : 0;
    const otherCostPerHour = totalHours > 0 ? otherCosts / totalHours : 0;

    const isPositiveTrend = trend >= 0;
    const laborPercentage = totalCost > 0 ? (laborCost / totalCost) * 100 : 0;
    const otherPercentage = totalCost > 0 ? (otherCosts / totalCost) * 100 : 0;

    // Benchmarks de industria (hostelería)
    const INDUSTRY_BENCHMARK_MIN = 15; // €/h
    const INDUSTRY_BENCHMARK_MAX = 25; // €/h
    const INDUSTRY_BENCHMARK_OPTIMAL = 20; // €/h

    const isUnderBenchmark = costPerHour < INDUSTRY_BENCHMARK_MIN;
    const isOptimal = costPerHour >= INDUSTRY_BENCHMARK_MIN && costPerHour <= INDUSTRY_BENCHMARK_MAX;
    const isOverBenchmark = costPerHour > INDUSTRY_BENCHMARK_MAX;

    const benchmarkDiff = costPerHour - INDUSTRY_BENCHMARK_OPTIMAL;
    const benchmarkPercentDiff = (benchmarkDiff / INDUSTRY_BENCHMARK_OPTIMAL) * 100;

    // Determine health status
    const statusConfig = isOverBenchmark
        ? {
            color: 'text-rose-600 dark:text-rose-400',
            bg: 'bg-rose-50 dark:bg-rose-950/30',
            border: 'border-rose-200 dark:border-rose-800',
            lightBg: 'bg-rose-500/5',
            icon: '⚠️',
            label: 'Alto'
        }
        : isUnderBenchmark
            ? {
                color: 'text-amber-600 dark:text-amber-400',
                bg: 'bg-amber-50 dark:bg-amber-950/30',
                border: 'border-amber-200 dark:border-amber-800',
                lightBg: 'bg-amber-500/5',
                icon: '⚡',
                label: 'Bajo'
            }
            : {
                color: 'text-emerald-600 dark:text-emerald-400',
                bg: 'bg-emerald-50 dark:bg-emerald-950/30',
                border: 'border-emerald-200 dark:border-emerald-800',
                lightBg: 'bg-emerald-500/5',
                icon: '✓',
                label: 'Óptimo'
            };

    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 h-full flex flex-col relative overflow-hidden group">
            {/* Subtle hover background */}
            <div className={`absolute inset-0 ${statusConfig.lightBg} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

            {/* Header */}
            <div className="flex items-start justify-between mb-5 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/20 flex items-center justify-center border border-amber-100 dark:border-amber-900 transition-all duration-300 group-hover:scale-110 group-hover:shadow-md">
                        <Clock className="w-5 h-5 text-amber-600 dark:text-amber-500" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-800 dark:text-white tracking-tight">Coste Operativo</h3>
                        <p className="text-[9px] text-slate-500 font-semibold uppercase tracking-[0.08em] leading-none mt-1.5">Gasto por hora trabajada</p>
                    </div>
                </div>
                <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg ${statusConfig.bg} border ${statusConfig.border} transition-all duration-300 group-hover:scale-105`}>
                    <span className="text-xs">{statusConfig.icon}</span>
                    <span className={`text-xs font-bold ${statusConfig.color}`}>{statusConfig.label}</span>
                </div>
            </div>

            {/* Main Value with Benchmark Context */}
            <div className="mb-5 relative z-10">
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
                        {formatMoney(costPerHour)}
                    </span>
                    <span className="text-xl font-bold text-slate-400">€/h</span>
                </div>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="text-[10px] text-slate-500 font-medium">{totalHours}h operativas</span>
                    <div className="h-1 w-1 rounded-full bg-slate-300" />
                    <div className={`text-[10px] font-bold uppercase tracking-wider ${statusConfig.color}`}>
                        {benchmarkDiff >= 0 ? '+' : ''}{formatMoney(Math.abs(benchmarkDiff))}€ vs benchmark
                    </div>
                </div>
                {trend !== 0 && (
                    <div className={`flex items-center gap-1 text-[10px] font-bold mt-1 ${!isPositiveTrend ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {!isPositiveTrend ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                        {Math.abs(trend).toFixed(1)}% vs mes anterior
                    </div>
                )}
            </div>

            {/* Enhanced Cost Breakdown */}
            <div className="flex-1 space-y-2.5 mb-4 relative z-10">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 transition-all hover:bg-slate-100 dark:hover:bg-slate-800">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <Users className="w-3.5 h-3.5 text-indigo-500" />
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Personal</span>
                        </div>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 tabular-nums">{formatMoney(laborCostPerHour)}€/h</span>
                    </div>
                    <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-indigo-400 to-indigo-600 transition-all duration-1000"
                            style={{ width: `${laborPercentage}%` }}
                        />
                    </div>
                    <div className="flex justify-between mt-1">
                        <span className="text-[8px] text-slate-400">{laborPercentage.toFixed(0)}% del total</span>
                        <span className="text-[8px] font-mono text-slate-500">{formatMoney(laborCost)}€</span>
                    </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 transition-all hover:bg-slate-100 dark:hover:bg-slate-800">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <Euro className="w-3.5 h-3.5 text-amber-500" />
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Otros Gastos</span>
                        </div>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 tabular-nums">{formatMoney(otherCostPerHour)}€/h</span>
                    </div>
                    <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-1000"
                            style={{ width: `${otherPercentage}%` }}
                        />
                    </div>
                    <div className="flex justify-between mt-1">
                        <span className="text-[8px] text-slate-400">{otherPercentage.toFixed(0)}% del total</span>
                        <span className="text-[8px] font-mono text-slate-500">{formatMoney(otherCosts)}€</span>
                    </div>
                </div>
            </div>

            {/* Footer with Industry Insight */}
            <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800 relative z-10">
                <div className={`flex items-center gap-1.5 text-[9px] font-medium italic ${statusConfig.color} text-center justify-center`}>
                    <Info className="w-3 h-3" />
                    <p>
                        {isOptimal && `Coste óptimo. Benchmark: ${INDUSTRY_BENCHMARK_MIN}-${INDUSTRY_BENCHMARK_MAX}€/h`}
                        {isOverBenchmark && `${Math.abs(benchmarkPercentDiff).toFixed(0)}% sobre benchmark. Optimiza gastos.`}
                        {isUnderBenchmark && `Coste bajo. Verifica calidad del servicio.`}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default HourlyCostWidget;
