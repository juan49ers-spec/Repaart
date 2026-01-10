import { type FC } from 'react';
import { ScatterChart as ScatterIcon, BarChart2 } from 'lucide-react';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Cell, BarChart, ReferenceLine, Bar, LabelList } from 'recharts';
import CustomChartTooltip from '../../CustomChartTooltip';
import { formatMoney } from '../../../lib/finance';

interface FranchiseMetrics {
    orders: number;
    profit: number;
}

interface Franchise {
    id: string;
    name: string;
    metrics: FranchiseMetrics;
}

interface CostItem {
    name: string;
    value: number;
}

interface Stats {
    totalOrders: number;
    totalRevenue: number;
    totalProfit: number;
    costStructure: CostItem[];
}

interface IntelligenceGridProps {
    franchises: Franchise[];
    stats: Stats;
    setSelectedScorecard: (franchise: Franchise) => void;
}

interface ChartData {
    name: string;
    value: number;
    fill: string;
}

const IntelligenceGrid: FC<IntelligenceGridProps> = ({ franchises, stats, setSelectedScorecard }) => {
    console.log('DEBUG: IntelligenceGrid mounted');
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* SCATTER PLOT */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h4 className="font-bold text-slate-800 text-lg flex items-center"><ScatterIcon className="w-5 h-5 mr-2 text-blue-500" /> Matriz de Eficiencia</h4>
                        <p className="text-xs text-slate-400 mt-1">Comparativa Volumen vs Rentabilidad</p>
                    </div>
                    <div className="flex space-x-2">
                        <span className="w-3 h-3 rounded-full bg-emerald-400" /><span className="text-[10px] text-slate-400">Rentable</span>
                        <span className="w-3 h-3 rounded-full bg-rose-400 ml-2" /><span className="text-[10px] text-slate-400">Pérdidas</span>
                    </div>
                </div>
                <div className="flex-1 w-full h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis type="number" dataKey="metrics.orders" name="Pedidos" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                            <YAxis type="number" dataKey="metrics.profit" name="Beneficio" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                            <Tooltip content={<CustomChartTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                            <Scatter name="Franquicias" data={franchises} shape="circle" onClick={(data: Franchise) => setSelectedScorecard(data)}>
                                {franchises.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.metrics.profit >= 0 ? '#10b981' : '#ef4444'}
                                        stroke="white"
                                        strokeWidth={2}
                                        className="cursor-pointer hover:opacity-80 transition-opacity"
                                    />
                                ))}
                            </Scatter>
                        </ScatterChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* UNIT ECONOMICS WATERFALL */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col">
                <div className="mb-6">
                    <h4 className="font-bold text-slate-800 text-lg flex items-center"><BarChart2 className="w-5 h-5 mr-2 text-blue-500" /> Unit Economics (Por Pedido)</h4>
                    <p className="text-xs text-slate-400 mt-1">Desglose medio de rentabilidad por pedido (Red Global). ¿Dónde va el dinero?</p>
                </div>
                <div className="flex-1 w-full h-80 min-h-[320px]">
                    {stats.totalOrders > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={[
                                    { name: 'Ticket Medio', value: stats.totalOrders > 0 ? stats.totalRevenue / stats.totalOrders : 0, fill: '#6366f1' }, // Ingreso
                                    { name: 'Coste Rider', value: stats.totalOrders > 0 ? -(stats.costStructure.find(c => c.name === 'Salarios')?.value || 0) / stats.totalOrders : 0, fill: '#ef4444' },
                                    { name: 'Gasolina', value: stats.totalOrders > 0 ? -((stats.costStructure.find(c => c.name === 'Gasolina')?.value || 0)) / stats.totalOrders : 0, fill: '#f59e0b' },
                                    { name: 'Estructura', value: stats.totalOrders > 0 ? -((stats.costStructure.find(c => c.name === 'Otros')?.value || 0) + (stats.costStructure.find(c => c.name === 'Marketing')?.value || 0) + (stats.costStructure.find(c => c.name === 'Motos')?.value || 0)) / stats.totalOrders : 0, fill: '#94a3b8' },
                                    { name: 'Beneficio', value: stats.totalOrders > 0 ? stats.totalProfit / stats.totalOrders : 0, fill: stats.totalProfit > 0 ? '#10b981' : '#ef4444' }
                                ] as ChartData[]}
                                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 600 }} interval={0} />
                                <YAxis tick={{ fontSize: 12 }} tickFormatter={(value: number) => `${(value || 0).toFixed(1)}€`} />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const data = payload[0].payload as ChartData;
                                            return (
                                                <div className="bg-slate-900 text-white p-3 rounded-lg text-xs shadow-xl border border-slate-700">
                                                    <p className="font-bold mb-1 text-slate-300">{data.name}</p>
                                                    <p className={`text-lg font-black ${data.value >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                                        {formatMoney(data.value)}€
                                                    </p>
                                                    <p className="text-[10px] text-slate-500 mt-1">por pedido</p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <ReferenceLine y={0} stroke="#cbd5e1" strokeWidth={2} />
                                <Bar dataKey="value" radius={[4, 4, 4, 4]} barSize={45}>
                                    <LabelList dataKey="value" position="top" formatter={(val: number) => formatMoney(val) + '€'} style={{ fill: '#64748b', fontSize: '11px', fontWeight: 'bold' }} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-full text-slate-400">
                            <p>Sin datos de pedidos para este mes</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default IntelligenceGrid;
