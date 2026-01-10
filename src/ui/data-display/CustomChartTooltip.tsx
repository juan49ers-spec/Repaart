import { type FC } from 'react';
import { TooltipProps } from 'recharts';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';

type CustomChartTooltipProps = TooltipProps<ValueType, NameType>;

const CustomChartTooltip: FC<CustomChartTooltipProps> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-900/95 text-white p-3 rounded-xl shadow-2xl border border-slate-700 backdrop-blur-md z-50">
                <p className="font-bold text-sm mb-1 text-slate-300">{label}</p>
                {payload.map((entry, index) => (
                    <p key={index} className="text-xs font-semibold" style={{ color: entry.color }}>
                        {entry.name}: <span className="font-mono">{typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}</span>
                        {entry.unit}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

export default CustomChartTooltip;
