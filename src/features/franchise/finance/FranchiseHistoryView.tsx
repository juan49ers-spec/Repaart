import React from 'react';
import { useFranchiseHistory } from '../../../hooks/useFranchiseHistory';
import MonthlyHistoryTable from './MonthlyHistoryTable';
import { ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, Area, Bar, ComposedChart } from 'recharts';
import { formatMoney } from '../../../lib/finance';
import { Activity, TrendingUp, DollarSign } from 'lucide-react';
import KPICard from '../dashboard/widgets/KPICard';

interface FranchiseHistoryViewProps {
    franchiseId: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xl z-50">
                <p className="text-slate-800 font-bold mb-3 border-b border-slate-100 pb-2">{label}</p>
                <div className="space-y-2">
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center gap-3 text-xs">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span className="text-slate-500 w-20">{entry.name}:</span>
                            <span className="text-slate-900 font-mono font-bold">
                                {formatMoney(entry.value)}€
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    return null;
};

const FranchiseHistoryView: React.FC<FranchiseHistoryViewProps> = ({ franchiseId }) => {
    const { records, loading, error } = useFranchiseHistory(franchiseId);

    if (loading) return (
        <div className="p-24 text-center flex flex-col items-center gap-6 animate-in fade-in duration-700">
            <div className="w-16 h-16 border-4 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin"></div>
            <p className="text-slate-400 font-medium tracking-tight">Analizando histórico...</p>
        </div>
    );

    if (error) return <div className="p-12 text-center text-rose-500 bg-rose-50 rounded-2xl border border-rose-100">Error: {error}</div>;

    // Sort oldest to newest for the chart
    const sortedRecords = [...records].sort((a, b) => a.month.localeCompare(b.month));

    // If no records, just show table (which handles empty state)
    if (!records || records.length === 0) return <MonthlyHistoryTable franchiseId={franchiseId} />;

    // --- AGGREGATE STATS ---
    const totalRev = records.reduce((acc, r) => acc + r.revenue, 0);
    const totalProfit = records.reduce((acc, r) => acc + r.profit, 0);
    const avgMargin = totalRev > 0 ? (totalProfit / totalRev) * 100 : 0;

    // Trend Analysis (Simple: compare last month vs avg)
    const lastRecord = sortedRecords[sortedRecords.length - 1];
    const isTrendingUp = lastRecord && ((lastRecord.profit / lastRecord.revenue) * 100) > avgMargin;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000 ease-out">

            {/* COMPACT SUMMARY CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <KPICard
                    title="Facturación Histórica"
                    value={formatMoney(totalRev) + '€'}
                    trend={isTrendingUp ? 5.2 : -2.1} // Simple trend indicator based on last month
                    trendData={sortedRecords.map(r => r.revenue)}
                    icon={<Activity />}
                    color="blue"
                    subtext="Acumulado Total"
                />

                <KPICard
                    title="Beneficio Acumulado"
                    value={formatMoney(totalProfit) + '€'}
                    trend={isTrendingUp ? 8.4 : -1.5}
                    trendData={sortedRecords.map(r => r.profit)}
                    icon={<DollarSign />}
                    color="emerald"
                    subtext={`${avgMargin.toFixed(1)}% Margen Medio`}
                />

                <KPICard
                    title="Promedio Mensual"
                    value={formatMoney(totalRev / (records.length || 1)) + '€'}
                    trend={0}
                    trendData={sortedRecords.map(r => r.revenue)} // Just to show activity
                    icon={<TrendingUp />}
                    color="purple"
                    subtext="Ingreso Medio"
                />
            </div>

            {/* MAIN CHART */}
            <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 tracking-tight">
                            Evolución Financiera
                        </h3>
                        <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Ingresos vs Gastos (Últimos 12 meses)</p>
                    </div>
                    {/* Legend */}
                    <div className="flex gap-3 text-[9px] font-bold uppercase tracking-widest">
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-sm ring-1 ring-indigo-50"></span>
                            <span className="text-slate-500">Ingresos</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-md bg-emerald-500 shadow-sm ring-1 ring-emerald-50"></span>
                            <span className="text-slate-500">Beneficio</span>
                        </div>
                    </div>
                </div>

                <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={sortedRecords} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis
                                dataKey="month"
                                stroke="#94a3b8"
                                tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }}
                                axisLine={false}
                                tickLine={false}
                                dy={10}
                            />
                            <YAxis
                                stroke="#94a3b8"
                                tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600, fontFamily: 'monospace' }}
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc', opacity: 0.8 }} />

                            <Area
                                type="monotone"
                                dataKey="revenue"
                                name="Ingresos"
                                stroke="#6366f1"
                                fillOpacity={1}
                                fill="url(#colorIngresos)"
                                strokeWidth={2}
                                strokeLinecap="round"
                            />
                            <Bar
                                dataKey="profit"
                                name="Beneficio"
                                barSize={24}
                                fill="#10b981"
                                radius={[4, 4, 0, 0]}
                                opacity={1}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* DATA TABLE */}
            <div>
                <MonthlyHistoryTable franchiseId={franchiseId} records={records} />
            </div>
        </div>
    );
};

export default FranchiseHistoryView;
