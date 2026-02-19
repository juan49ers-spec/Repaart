import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    TooltipProps
} from 'recharts';
import { formatMoney } from '../../../../lib/finance';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';

interface WaterfallDataItem {
    name: string;
    display: number; // Value to show in the bar
    start: number;   // Starting height of the bar
    imputedValue: number; // Real value (positive or negative)
    type: 'total' | 'expense' | 'income';
}

const CustomTooltip = ({ active, payload }: TooltipProps<ValueType, NameType>) => {
    if (active && payload && payload.length) {
        const item = payload[0].payload as WaterfallDataItem;
        return (
            <div className="bg-white dark:bg-slate-900 p-3 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl">
                <p className="font-bold text-slate-700 dark:text-slate-200 mb-1">{item.name}</p>
                <p className={`text-lg font-mono font-bold ${item.imputedValue > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                    {item.imputedValue > 0 ? '+' : ''}{formatMoney(item.imputedValue)}€
                </p>
            </div>
        );
    }
    return null;
};

interface PnLWaterfallChartProps {
    revenue: number;
    variableCosts: number;
    fixedCosts: number;
    taxes: number;
    netProfit: number;
}

const PnLWaterfallChart: React.FC<PnLWaterfallChartProps> = ({
    revenue,
    variableCosts,
    fixedCosts,
    taxes,
    netProfit
}) => {
    // Waterfall Logic: We need to calculate cumulative steps
    // Step 1: Revenue (starts at 0)
    // Step 2: Gross Profit (starts at Revenue - VC)
    // ...actually, simpler:
    // [Value, StartOffset]

    const data: WaterfallDataItem[] = [
        {
            name: 'Ingresos',
            display: revenue,
            start: 0,
            imputedValue: revenue,
            type: 'total'
        },
        {
            name: 'Variables',
            display: variableCosts,
            start: revenue - variableCosts,
            imputedValue: -variableCosts,
            type: 'expense'
        },
        {
            name: 'Fijos',
            display: fixedCosts,
            start: revenue - variableCosts - fixedCosts,
            imputedValue: -fixedCosts,
            type: 'expense'
        },
        {
            name: 'Impuestos',
            display: taxes,
            start: revenue - variableCosts - fixedCosts - taxes,
            imputedValue: -taxes,
            type: 'expense'
        },
        {
            name: 'Neto',
            display: netProfit,
            start: 0,
            imputedValue: netProfit,
            type: 'total'
        }
    ];

    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart
                data={data}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                className="font-mono text-[10px]"
            >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8' }}
                />
                <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8' }}
                    tickFormatter={(value) => `${value / 1000}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                    dataKey={(d: WaterfallDataItem) => [d.start, d.start + d.display]}
                    radius={[4, 4, 0, 0]}
                    fillOpacity={0.9}
                >
                    {data.map((entry, index) => (
                        <Cell
                            key={`cell-wf-${index}`}
                            fill={entry.type === 'total' ? '#6366f1' : entry.name === 'Ingresos' ? '#10b981' : '#f43f5e'}
                        />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
};

export default PnLWaterfallChart;
