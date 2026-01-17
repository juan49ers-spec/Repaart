import { type FC } from 'react';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';

interface SparkLineProps {
    data: number[];
    color?: string;
    height?: number;
    className?: string;
}

const SparkLine: FC<SparkLineProps> = ({
    data,
    color = '#6366f1', // Indigo 500
    height = 40,
    className = ''
}) => {
    if (!data || data.length < 2) return null;

    const chartData = data.map((val, i) => ({ i, val }));

    return (
        <div className={`w-full ${className}`} style={{ height }}>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                    <YAxis domain={['dataMin', 'dataMax']} hide />
                    <Line
                        type="monotone"
                        dataKey="val"
                        stroke={color}
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={true}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default SparkLine;
