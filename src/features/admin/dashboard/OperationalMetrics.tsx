import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import CustomChartTooltip from '../../../ui/data-display/CustomChartTooltip';


import { useQueryClient } from '@tanstack/react-query';
import { financeService } from '../../../services/financeService';

interface Franchise {
    id: string;
    name: string;
    metrics: {
        productivity: number;
        avgDistance: number;
    };
}

interface OperationalMetricsProps {
    franchises: Franchise[];
    onChartClick?: (franchise: Franchise) => void;
}

const OperationalMetrics: React.FC<OperationalMetricsProps> = ({ franchises, onChartClick }) => {
    const queryClient = useQueryClient();
    const handlePrefetch = (franchiseId: string) => {
        if (!franchiseId) return;
        const currentMonth = new Date().toISOString().slice(0, 7);
        queryClient.prefetchQuery({
            queryKey: ['finance', franchiseId, currentMonth],
            queryFn: async () => {
                const data = await financeService.getFinancialData(franchiseId, currentMonth);
                return data;
            },
            staleTime: 5 * 60 * 1000
        });
    };

    return (
        <div className="bg-transparent">
            {/* Charts Grid */}
            <div className="flex flex-col gap-4">
                {/* Productivity Chart */}
                <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors">
                    <h4 className="flex justify-between items-center mb-4">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Productividad (Peds/H)</span>
                        <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Target {'>'} 2.5
                        </span>
                    </h4>
                    <div className="h-40 cursor-pointer">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                layout="vertical"
                                data={franchises.slice(0, 5).map(f => ({
                                    ...f,
                                    metrics: {
                                        productivity: f.metrics?.productivity || 0,
                                        avgDistance: f.metrics?.avgDistance || 0
                                    }
                                }))}
                                margin={{ top: 0, right: 10, left: 10, bottom: 0 }}
                                onClick={(state: any) => {
                                    if (state && state.activePayload) {
                                        onChartClick && onChartClick(state.activePayload[0].payload);
                                    }
                                }}
                            >
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <Tooltip content={<CustomChartTooltip />} cursor={{ fill: '#1e293b' }} />
                                <Bar dataKey="metrics.productivity" name="Peds/H" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={8}>
                                    {franchises.slice(0, 5).map((entry, index) => {
                                        const productivity = entry.metrics?.productivity || 0;
                                        return (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={productivity < 2 ? '#f43f5e' : '#8b5cf6'}
                                                onMouseEnter={() => handlePrefetch(entry.id)}
                                            />
                                        );
                                    })}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Distance Chart */}
                <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors">
                    <h4 className="flex justify-between items-center mb-4">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Eficiencia Logística</span>
                        <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {'<'} 3.5km
                        </span>
                    </h4>
                    <div className="h-40 cursor-pointer">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                layout="vertical"
                                data={franchises.slice(0, 5).map(f => ({
                                    ...f,
                                    metrics: {
                                        productivity: f.metrics?.productivity || 0,
                                        avgDistance: f.metrics?.avgDistance || 0
                                    }
                                }))}
                                margin={{ top: 0, right: 10, left: 10, bottom: 0 }}
                                onClick={(state: any) => {
                                    if (state && state.activePayload) {
                                        onChartClick && onChartClick(state.activePayload[0].payload);
                                    }
                                }}
                            >
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <Tooltip content={<CustomChartTooltip />} cursor={{ fill: '#1e293b' }} />
                                <Bar dataKey="metrics.avgDistance" name="Km" fill="#06b6d4" radius={[0, 4, 4, 0]} barSize={8} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OperationalMetrics;
