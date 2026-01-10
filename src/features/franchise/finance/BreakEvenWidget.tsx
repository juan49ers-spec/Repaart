import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Info } from 'lucide-react';

const BreakEvenWidget = ({ trendData }: { trendData: any[] }) => {
    // 1. Process Data for the Formula
    // BEP (Orders/Hour) = (Total Expenses / (Revenue / Orders)) / Total Hours
    // Simplified: BEP = Total Expenses / (Avg Ticket * Total Hours)

    const chartData = trendData.map((d: any) => {
        const avgTicket = d.orders > 0 ? d.revenue / d.orders : 0;
        const totalExpenses = d.expenses || 0;
        const totalHours = d.totalHours || 0;

        // Calculate Break Even Orders (Volume needed to cover expenses)
        const breakEvenOrders = avgTicket > 0 ? totalExpenses / avgTicket : 0;

        // Calculate Break Even Productivity (Orders/Hour needed)
        // Guard against division by zero
        const breakEvenProductivity = totalHours > 0 ? breakEvenOrders / totalHours : 0;

        // Actual Productivity
        const actualProductivity = totalHours > 0 ? d.orders / totalHours : 0;

        return {
            name: d.name,
            fullDate: d.fullDate,
            actual: Number(actualProductivity.toFixed(2)),
            required: Number(breakEvenProductivity.toFixed(2)),
            // Metadata for tooltip
            expenses: totalExpenses,
            avgTicket: Number(avgTicket.toFixed(2)),
            hours: totalHours
        };
    }).reverse(); // Show oldest to newest? No, trendData is usually usually newest to oldest?
    // trendData in useFranchiseFinance comes from financeService, which builds it back-to-front (monthsBack to 0).
    // Let's verify sort. The loop goes i=monthsBack down to 0. So it is Oldest -> Newest. Correct.

    const currentMonth = chartData[chartData.length - 1] || {};
    const isProfitable = (currentMonth.actual || 0) >= (currentMonth.required || 0);

    return (
        <div className="bg-slate-900 rounded-2xl p-6 h-full flex flex-col border border-slate-800/50">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        Punto Muerto TOTAL (Cubre Todo)
                        <div className="group relative">
                            <Info className="w-3.5 h-3.5 text-slate-500 cursor-help" />
                            <div className="absolute left-0 bottom-full mb-2 w-64 p-3 bg-slate-800 rounded-xl border border-slate-700 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 pointer-events-none">
                                <p className="text-[10px] text-slate-300 leading-relaxed">
                                    <strong>Fórmula Definitiva:</strong> Pedidos/Hora necesarios para pagar NÓMINAS, ALQUILER, LUZ y TODOS los gastos.
                                </p>
                            </div>
                        </div>
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">Tu carrera hacia la rentabilidad real.</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold border ${isProfitable
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    }`}>
                    {isProfitable ? 'RENTABLE' : 'DÉFICIT'}
                </div>
            </div>

            <div className="flex-1 min-h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorRequired" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <XAxis
                            dataKey="name"
                            stroke="#475569"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="#475569"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${value}`}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', fontSize: '12px' }}
                            itemStyle={{ padding: 0 }}
                            formatter={(value, name) => [
                                `${value} peds/h`,
                                name === 'actual' ? 'Eficiencia Real' : 'Necesario (B.E.P)'
                            ]}
                            labelStyle={{ color: '#94a3b8', marginBottom: '8px' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="required"
                            stroke="#f43f5e"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            fillOpacity={1}
                            fill="url(#colorRequired)"
                            name="required"
                        />
                        <Area
                            type="monotone"
                            dataKey="actual"
                            stroke="#6366f1"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorActual)"
                            name="actual"
                            activeDot={{ r: 6, strokeWidth: 0 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 border-t border-slate-800 pt-4">
                <div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-0.5">Ticket Medio</p>
                    <p className="text-lg font-mono font-bold text-slate-300">
                        {currentMonth.avgTicket ? currentMonth.avgTicket.toFixed(2) : '0.00'}€
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-0.5">Margen Seguridad</p>
                    <p className={`text-lg font-mono font-bold ${(currentMonth.actual - currentMonth.required) > 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                        {((currentMonth.actual - currentMonth.required) || 0).toFixed(2)} peds/h
                    </p>
                </div>
            </div>
        </div>
    );
};

export default BreakEvenWidget;
