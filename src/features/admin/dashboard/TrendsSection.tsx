import { type FC, useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { ResponsiveContainer, ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip, Area, Line } from 'recharts';
import CustomChartTooltip from '../../../ui/data-display/CustomChartTooltip';
import InfoTooltip from '../../../ui/feedback/InfoTooltip';
import DrillDownModal from './DrillDownModal';

type TrendIndicator = 'up' | 'down';

interface TrendDataBreakdown {
    taxes?: number;
}

interface TrendDataPoint {
    name: string;
    revenue: number;
    expenses: number;
    profit: number;
    orders: number;
    logisticsIncome?: number;
    breakdown?: TrendDataBreakdown;
}

interface DrillDownItem {
    label: string;
    value: string;
    trend: TrendIndicator;
    pct: number | string;
}

interface ChartClickData {
    activePayload?: Array<{ payload: TrendDataPoint }>;
}

interface TrendsSectionProps {
    trendData: TrendDataPoint[];
}

const TrendsSection: FC<TrendsSectionProps> = ({ trendData }) => {
    // State for DrillDown
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalData, setModalData] = useState<DrillDownItem[] | null>(null);
    const [modalTitle, setModalTitle] = useState('');

    const handleChartClick = (data: ChartClickData): void => {
        if (data && data.activePayload && data.activePayload.length > 0) {
            const payload = data.activePayload[0].payload;
            const monthName = payload.name;

            // Calculate margins
            const revenue = payload.revenue || 0;
            const expenses = payload.expenses || 0;
            const profit = payload.profit || 0;
            const orders = payload.orders || 0;

            // Extract Details
            const logisticsIncome = payload.logisticsIncome || 0; // Tarifas
            const taxes = payload.breakdown?.taxes || 0; // Impuestos

            // Format for DrillDownModal
            const drillDownData: DrillDownItem[] = [
                {
                    label: 'Facturación Total',
                    value: `${(revenue / 1000).toFixed(1)}k€`,
                    trend: 'up',
                    pct: 100
                },
                {
                    label: 'Pedidos',
                    value: orders.toString(),
                    trend: 'up',
                    pct: orders > 0 ? ((revenue / orders).toFixed(1) + '€/order') : 0 // Show AOV instead of simple pct
                },
                {
                    label: 'Tarifas (Logística)',
                    value: `${(logisticsIncome / 1000).toFixed(1)}k€`,
                    trend: 'down',
                    pct: revenue > 0 ? ((logisticsIncome / revenue) * 100).toFixed(1) : 0
                },
                {
                    label: 'Impuestos',
                    value: `${(taxes / 1000).toFixed(1)}k€`,
                    trend: 'down',
                    pct: revenue > 0 ? ((taxes / revenue) * 100).toFixed(1) : 0
                },
                {
                    label: 'Gastos Operativos',
                    value: `${(expenses / 1000).toFixed(1)}k€`,
                    trend: 'down',
                    pct: revenue > 0 ? ((expenses / revenue) * 100).toFixed(1) : 0
                },
                {
                    label: 'Beneficio Neto',
                    value: `${(profit / 1000).toFixed(1)}k€`,
                    trend: profit > 0 ? 'up' : 'down',
                    pct: revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : 0
                }
            ];

            setModalTitle(`Detalle: ${monthName}`);
            setModalData(drillDownData);
            setIsModalOpen(true);
        }
    };

    return (
        <>
            <div className="w-full h-[300px] flex flex-col">
                <div className="flex justify-between items-center mb-2 px-2">
                    <div>
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-indigo-400" />
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Evolución Semestral</span>
                        </div>
                    </div>
                    <InfoTooltip text="Ingresos vs Beneficios (6 meses). Click para detalle." />
                </div>

                <div className="flex-1 w-full min-h-0 cursor-pointer">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart
                            data={trendData}
                            margin={{ top: 10, right: 10, bottom: 0, left: -20 }}
                            onClick={(data: any) => handleChartClick(data)}
                        >
                            <defs>
                                <linearGradient id="colorTrendRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                            <XAxis
                                dataKey="name"
                                stroke="#64748b"
                                tick={{ fontSize: 10 }}
                                axisLine={false}
                                tickLine={false}
                                dy={10}
                            />
                            <YAxis
                                yAxisId="left"
                                stroke="#64748b"
                                tick={{ fontSize: 10 }}
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={(value: number) => `${(value / 1000).toFixed(0)}k`}
                                domain={[0, 'auto']}
                            />
                            <YAxis
                                yAxisId="right"
                                orientation="right"
                                stroke="#10b981"
                                tick={{ fontSize: 10 }}
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={(value: number) => `${(value / 1000).toFixed(0)}k`}
                                domain={[0, 'auto']}
                            />
                            <Tooltip content={<CustomChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                            <Area
                                yAxisId="left"
                                type="monotone"
                                dataKey="revenue"
                                name="Facturación"
                                stroke="#818cf8"
                                fillOpacity={1}
                                fill="url(#colorTrendRevenue)"
                                strokeWidth={2}
                                activeDot={{ r: 6, strokeWidth: 0, fill: '#818cf8' }}
                            />
                            <Line
                                yAxisId="right"
                                type="monotone"
                                dataKey="profit"
                                name="B° Neto"
                                stroke="#34d399"
                                strokeWidth={2}
                                dot={{ r: 3, strokeWidth: 2, fill: '#0f172a' }}
                                activeDot={{ r: 6, strokeWidth: 0, fill: '#34d399' }}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Drill Down Modal */}
            {isModalOpen && (
                <DrillDownModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    data={modalData || []}
                    title={modalTitle}
                />
            )}
        </>
    );
};

export default TrendsSection;
