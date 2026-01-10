import React from 'react';
import { TrendingUp } from 'lucide-react';
import { formatMoney } from '../../../lib/finance';
import { ExpenseData } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface SummaryStepProps {
    // Polymorphic props to support both Wizards
    income?: number; // SimpleFinanceWizard
    totalIncome?: number; // FinancialClerkWizard

    expensesTotal?: number; // SimpleFinanceWizard
    totalExpenses?: number; // FinancialClerkWizard

    data?: ExpenseData; // SimpleFinanceWizard
    expenses?: ExpenseData; // FinancialClerkWizard

    grossProfit: number;
    totalHours: number;
}

// Helper Components
const SummaryCard = ({ title, value, color, suffix = "€" }: any) => {
    const colors: any = {
        emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
        rose: "text-rose-400 bg-rose-500/10 border-rose-500/20",
        indigo: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
        orange: "text-orange-400 bg-orange-500/10 border-orange-500/20",
        blue: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    };
    return (
        <div className={`p-6 rounded-2xl border ${colors[color]} flex flex-col items-center justify-center text-center`}>
            <span className="text-[10px] uppercase font-bold tracking-wider opacity-70 mb-2">{title}</span>
            <span className={`text-xl font-black font-mono`}>{formatMoney(value)}{suffix}</span>
        </div>
    );
};

const Row = ({ label, value }: any) => (
    <div className="flex justify-between items-center py-2 border-b border-slate-800/50 last:border-0 hover:bg-slate-800/20 px-2 rounded-lg transition-colors">
        <span className="text-slate-400">{label}</span>
        <span className="text-white font-mono font-bold">{formatMoney(value)}€</span>
    </div>
);

const SummaryStep: React.FC<SummaryStepProps> = (props) => {
    // Unify props
    const totalIncome = props.totalIncome ?? props.income ?? 0;
    const totalExpenses = props.totalExpenses ?? props.expensesTotal ?? 0;
    const expenses = props.expenses ?? props.data ?? ({} as ExpenseData);
    const { grossProfit, totalHours } = props;

    // Optimize: Calculate category totals once
    const categoryTotals = React.useMemo(() => {
        const rentingTotal = (expenses.renting?.count ?? 0) * (expenses.renting?.pricePerUnit ?? 0);
        return {
            team: (expenses.payroll ?? 0) + (expenses.quota ?? 0),
            fleet: rentingTotal + (expenses.fuel ?? 0) + (expenses.repairs ?? 0),
            structure: (expenses.insurance ?? 0) + (expenses.agencyFee ?? 0) + (expenses.prlFee ?? 0) + (expenses.accountingFee ?? 0),
            marketing: (expenses.marketing ?? 0) + (expenses.appFlyder ?? 0) + (expenses.incidents ?? 0) + (expenses.other ?? 0) + ((expenses.royaltyPercent || 0) * totalIncome / 100)
        };
    }, [expenses, totalIncome]);

    // Chart Data Preparation
    const chartData = [
        { name: 'Equipo', value: categoryTotals.team, color: '#10b981' },
        { name: 'Flota/Ops', value: categoryTotals.fleet, color: '#f59e0b' },
        { name: 'Estructura', value: categoryTotals.structure, color: '#6366f1' },
        { name: 'Marketing', value: categoryTotals.marketing, color: '#ec4899' },
    ].filter(item => item.value > 0);

    const taxes = React.useMemo(() => {
        // Simple approximation for user clarity
        // IRPF is applied on Net Profit (Yield)
        const irpfAmount = grossProfit > 0 ? grossProfit * ((expenses.irpfPercent || 20) / 100) : 0;
        const netClean = grossProfit - irpfAmount;
        return { irpfAmount, netClean, percent: expenses.irpfPercent || 20 };
    }, [grossProfit, expenses.irpfPercent]);

    return (
        <div className="space-y-8 animate-in zoom-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Visual Chart - New "Widget" feel */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center relative min-h-[220px]">
                    <h5 className="absolute top-4 left-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Distribución</h5>
                    <div className="w-full h-[180px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    innerRadius={50}
                                    outerRadius={70}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value: number) => formatMoney(value) + '€'}
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <SummaryCard title="Ingresos" value={totalIncome} color="emerald" />
                    <SummaryCard title="Gastos" value={totalExpenses} color="rose" />
                    <SummaryCard title="Beneficio Operativo" value={grossProfit} color={grossProfit >= 0 ? 'indigo' : 'orange'} />
                </div>
            </div>

            {/* OPERATIONAL EFFICIENCY BLOCK */}
            {totalHours > 0 && (
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
                    <h4 className="text-blue-400 font-bold uppercase text-xs tracking-wider mb-4 flex items-center gap-2">
                        Eficiencia Operativa
                    </h4>
                    <div className="grid grid-cols-2 gap-8">
                        <div>
                            <p className="text-xs text-slate-500 mb-1">Coste Real / Hora</p>
                            <p className="text-2xl font-black text-white font-mono">{formatMoney(totalExpenses / totalHours)}€/h</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 mb-1">Facturación / Hora</p>
                            <p className="text-2xl font-black text-emerald-400 font-mono">{formatMoney(totalIncome / totalHours)}€/h</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-slate-950 rounded-2xl border border-slate-800 p-6 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <TrendingUp className="w-32 h-32 text-indigo-500" />
                </div>
                <h4 className="font-bold text-white mb-6 relative z-10">Cuenta de Resultados (P&L)</h4>
                <div className="space-y-3 text-sm relative z-10">
                    <Row label="Nóminas y Personal" value={categoryTotals.team} />
                    <Row label="Flota y Operaciones" value={categoryTotals.fleet} />
                    <Row label="Estructura y Servicios" value={categoryTotals.structure} />
                    <Row label="Marketing y Royalty" value={categoryTotals.marketing} />

                    <div className="border-t border-slate-800 my-4"></div>

                    <div className="flex justify-between items-center">
                        <span className="text-slate-400">Resultado Operativo (EBITDA)</span>
                        <span className={`font-mono font-bold text-white`}>
                            {formatMoney(grossProfit)}€
                        </span>
                    </div>

                    {/* TAX BLOCK */}
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-amber-500/80">Estimación IRPF ({taxes.percent}%)</span>
                        <span className="text-amber-500 font-mono">
                            -{formatMoney(taxes.irpfAmount)}€
                        </span>
                    </div>

                    <div className="border-t border-slate-700/50 pt-3 flex justify-between items-center mt-2">
                        <div className="flex flex-col">
                            <span className="font-black text-emerald-400 uppercase tracking-wider text-sm">BENEFICIO NETO (LIMPIO)</span>
                            <span className="text-[10px] text-slate-500">Lo que te queda en el bolsillo</span>
                        </div>

                        <span className={`font-mono font-black text-2xl ${taxes.netClean >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {formatMoney(taxes.netClean)}€
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SummaryStep;
