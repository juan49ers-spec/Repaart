import { type FC } from 'react';
import { Timer } from 'lucide-react';
import { formatMoney } from '../../../../lib/finance';
import { Card } from '../../../../ui/primitives/Card';
import { SectionHeader } from '../../../../ui/primitives/SectionHeader';
import { Badge, BadgeIntent } from '../../../../ui/primitives/Badge';
import { StatValue } from '../../../../ui/primitives/StatValue';
import { DataRow } from '../../../../ui/primitives/DataRow';

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

    // Benchmarks
    const INDUSTRY_BENCHMARK_MIN = 15;
    const INDUSTRY_BENCHMARK_MAX = 16;

    const isUnderBenchmark = costPerHour < INDUSTRY_BENCHMARK_MIN;
    const isOverBenchmark = costPerHour > INDUSTRY_BENCHMARK_MAX;

    const getStatusConfig = (): { intent: BadgeIntent; label: string; message: string } => {
        if (isOverBenchmark) return {
            intent: 'danger',
            label: 'ALTO',
            message: `Supera referencia (> ${INDUSTRY_BENCHMARK_MAX}€/h)`
        };
        if (isUnderBenchmark) return {
            intent: 'warning',
            label: 'BAJO',
            message: `Inferior referencia (< ${INDUSTRY_BENCHMARK_MIN}€/h)`
        };
        return {
            intent: 'success',
            label: 'OK',
            message: `Dentro de rango (${INDUSTRY_BENCHMARK_MIN}-${INDUSTRY_BENCHMARK_MAX}€/h)`
        };
    };

    const statusConfig = getStatusConfig();

    return (
        <Card className="h-full flex flex-col">
            <SectionHeader
                title="Coste / Hora"
                subtitle={null}
                icon={<Timer className="w-5 h-5 text-amber-600 dark:text-amber-500" />}
                action={<Badge intent={statusConfig.intent} title={statusConfig.message}>{statusConfig.label}</Badge>}
            />

            {/* Main Value */}
            <div className="mb-4">
                <StatValue
                    value={formatMoney(costPerHour)}
                    unit="€/h"
                    description={`${totalHours}h operativas`}
                    size="xl"
                />
            </div>

            {/* Compact Breakdown - 2 rows only */}
            <div className="flex-1 space-y-2">
                <DataRow
                    label="Personal"
                    value={`${formatMoney(laborCostPerHour)}€/h`}
                    color="bg-indigo-500"
                    secondaryText={`${laborPercentage.toFixed(0)}%`}
                />
                <DataRow
                    label="Otros Gastos"
                    value={`${formatMoney(otherCostPerHour)}€/h`}
                    color="bg-amber-500"
                    secondaryText={`${otherPercentage.toFixed(0)}%`}
                />
            </div>

            {/* Footer Message */}
            <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800">
                <p className="text-xs font-medium text-slate-500 text-center">
                    {statusConfig.message}
                </p>
            </div>
        </Card>
    );
};

export default HourlyCostWidget;
