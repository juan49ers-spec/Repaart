import { type FC } from 'react';
import { Clock, Info, Users, Euro } from 'lucide-react';
import { formatMoney } from '../../../../lib/finance';
import { Card } from '../../../../ui/primitives/Card';
import { SectionHeader } from '../../../../ui/primitives/SectionHeader';
import { Badge, BadgeIntent } from '../../../../ui/primitives/Badge';
import { StatValue } from '../../../../ui/primitives/StatValue';

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


    const laborPercentage = totalCost > 0 ? (laborCost / totalCost) * 100 : 0;
    const otherPercentage = totalCost > 0 ? (otherCosts / totalCost) * 100 : 0;

    // Benchmarks de industria (hostelería)
    const INDUSTRY_BENCHMARK_MIN = 15; // €/h
    const INDUSTRY_BENCHMARK_MAX = 25; // €/h
    const INDUSTRY_BENCHMARK_OPTIMAL = 20; // €/h

    const isUnderBenchmark = costPerHour < INDUSTRY_BENCHMARK_MIN;

    const isOverBenchmark = costPerHour > INDUSTRY_BENCHMARK_MAX;

    const benchmarkDiff = costPerHour - INDUSTRY_BENCHMARK_OPTIMAL;
    const benchmarkPercentDiff = (benchmarkDiff / INDUSTRY_BENCHMARK_OPTIMAL) * 100;

    // Determine health status
    const getStatusConfig = () => {
        if (isOverBenchmark) return {
            intent: 'danger' as BadgeIntent,
            icon: '⚠️',
            label: 'Alto',
            message: `${Math.abs(benchmarkPercentDiff).toFixed(0)}% sobre benchmark. Optimiza gastos.`
        };
        if (isUnderBenchmark) return {
            intent: 'warning' as BadgeIntent,
            icon: '⚡',
            label: 'Bajo',
            message: `Coste bajo. Verifica calidad del servicio.`
        };
        return {
            intent: 'success' as BadgeIntent,
            icon: '✓',
            label: 'Óptimo',
            message: `Coste óptimo. Benchmark: ${INDUSTRY_BENCHMARK_MIN}-${INDUSTRY_BENCHMARK_MAX}€/h`
        };
    };

    const statusConfig = getStatusConfig();
    const trendText = trend !== 0 ? `${Math.abs(trend).toFixed(1)}% vs mes anterior` : undefined;

    return (
        <Card className="h-full flex flex-col relative group">
            {/* Header */}
            <SectionHeader
                title="Coste Operativo"
                subtitle="Gasto por hora trabajada"
                icon={<Clock className="w-5 h-5 text-amber-600 dark:text-amber-500" />}
                action={
                    <Badge intent={statusConfig.intent} className="gap-1.5">
                        <span className="text-xs">{statusConfig.icon}</span> {statusConfig.label}
                    </Badge>
                }
            />

            {/* Main Value with Benchmark Context */}
            <div className="mb-5 relative z-10">
                <StatValue
                    value={formatMoney(costPerHour)}
                    unit="€/h"
                    description={`${totalHours}h operativas`}
                    trend={{ value: trend, label: trendText }}
                    size="xl"
                />
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
                <div className="flex items-center gap-1.5 text-[9px] font-medium italic text-slate-500 text-center justify-center">
                    <Info className="w-3 h-3" />
                    <p>{statusConfig.message}</p>
                </div>
            </div>
        </Card>
    );
};

export default HourlyCostWidget;
