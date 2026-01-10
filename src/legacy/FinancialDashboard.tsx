import React, { useState } from 'react';
import { useFinancialPulse } from '../hooks/useFinancialPulse';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { Euro, Clock, Briefcase, TrendingUp, Loader2, Activity, LucideIcon } from 'lucide-react';

interface KPICardProps {
    title: string;
    value: string | number;
    subtext?: string;
    icon: LucideIcon;
    color: string;
}

const KPICard: React.FC<KPICardProps> = ({ title, value, subtext, icon: Icon, color }) => (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden group hover:border-slate-700 transition-all shadow-lg">
        <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${color}`}>
            <Icon size={64} />
        </div>
        <div className="relative z-10">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
            <h3 className="text-3xl font-mono font-bold text-white mb-1 tracking-tight">{value}</h3>
            {subtext && <p className="text-xs text-slate-500 font-medium">{subtext}</p>}
        </div>
    </div>
);

interface FinancialDashboardProps {
    franchiseId: string;
}

const FinancialDashboard: React.FC<FinancialDashboardProps> = ({ franchiseId }) => {
    const { currentMonthData, yearlyTrend, loading } = useFinancialPulse(franchiseId);

    // Tarifa base editable para simulaciones
    const [hourlyRate, setHourlyRate] = useState<number>(15.50);

    if (loading) {
        return (
            <div className="h-64 flex flex-col items-center justify-center text-slate-500 gap-3 bg-slate-950 rounded-2xl border border-slate-800 border-dashed">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                <span className="text-sm font-medium animate-pulse">Sincronizando Libros Contables...</span>
            </div>
        );
    }

    const totalHours = currentMonthData?.totalOperationalHours || 0;
    const totalShifts = currentMonthData?.totalShiftsCount || 0;
    const estimatedBilling = totalHours * hourlyRate;
    const avgShiftDuration = totalShifts > 0 ? (totalHours / totalShifts).toFixed(1) : '0';

    const chartData = yearlyTrend.length > 0 ? yearlyTrend : [
        { monthLabel: 'Inicio', totalOperationalHours: 0 },
        { monthLabel: 'Actual', totalOperationalHours: totalHours }
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            {/* BARRA DE CONTROL */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
                <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <Activity className="text-indigo-500" size={20} />
                        Pulso Financiero
                    </h2>
                    <p className="text-xs text-slate-400">Datos operativos sincronizados en tiempo real.</p>
                </div>

                <div className="flex items-center gap-3 bg-slate-900 p-2 rounded-lg border border-slate-800">
                    <span className="text-xs font-bold text-slate-400 uppercase px-2">Simulador Coste Hora (€):</span>
                    <input
                        type="number"
                        value={hourlyRate}
                        onChange={(e) => setHourlyRate(parseFloat(e.target.value) || 0)}
                        className="bg-slate-950 border border-slate-700 text-white px-3 py-1.5 rounded-md w-24 text-right font-mono font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                </div>
            </div>

            {/* KPI GRID */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <KPICard
                    title="Facturación Estimada"
                    value={`${estimatedBilling.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`}
                    subtext={`Basado en ${totalHours.toFixed(2)} horas operativas auditadas`}
                    icon={Euro}
                    color="text-emerald-500"
                />
                <KPICard
                    title="Carga Operativa Mes"
                    value={`${totalHours.toFixed(1)} h`}
                    subtext="Horas totales confirmadas por el backend"
                    icon={Clock}
                    color="text-blue-500"
                />
                <KPICard
                    title="Volumen de Turnos"
                    value={totalShifts}
                    subtext={`Promedio: ${avgShiftDuration}h / turno`}
                    icon={Briefcase}
                    color="text-amber-500"
                />
            </div>

            {/* GRÁFICA DE TENDENCIA */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl h-[350px] shadow-lg relative">
                <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
                    <TrendingUp size={16} className="text-indigo-400" /> Tendencia de Actividad (Horas)
                </h3>
                <ResponsiveContainer width="100%" height="85%">
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis
                            dataKey="monthLabel"
                            stroke="#64748b"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            dy={10}
                        />
                        <YAxis
                            stroke="#64748b"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            dx={-10}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px' }}
                            itemStyle={{ color: '#818cf8', fontWeight: 'bold' }}
                            formatter={(value: any) => [`${value.toFixed(1)} h`, 'Horas']}
                        />
                        <Area
                            type="monotone"
                            dataKey="totalOperationalHours"
                            stroke="#6366f1"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorHours)"
                            activeDot={{ r: 6, strokeWidth: 0, fill: '#fff' }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default FinancialDashboard;
