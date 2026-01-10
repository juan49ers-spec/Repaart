import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Card, CardContent } from '@/components/ui/card';
import { Info, TrendingUp, Wallet, ReceiptText, Banknote } from 'lucide-react';
import { calculateTotalExpenses, calculateNetProfit, calculateProfitMargin } from '@/utils/financialUtils';
import { formatMoney } from '../../../../lib/finance';
import { ExpenseData } from '../../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';

interface SummaryStepProps {
    totalIncome: number;
    totalExpenses: number;
    grossProfit: number;
    expenses: ExpenseData;
    totalHours: number;
}

interface SummaryCardProps {
    title: string;
    amount: number;
    type: 'income' | 'expense' | 'profit';
    icon: any;
    highlight?: boolean;
}

interface RowProps {
    label: string;
    value: number;
}

// Subcomponents
const SummaryCard = ({ title, amount, type, icon: Icon, highlight }: SummaryCardProps) => {
    const colorClass = type === 'income' ? 'text-emerald-600' : type === 'expense' ? 'text-red-600' : amount >= 0 ? 'text-blue-600' : 'text-red-600';
    const bgClass = type === 'income' ? 'bg-emerald-50' : type === 'expense' ? 'bg-red-50' : amount >= 0 ? 'bg-blue-50' : 'bg-red-50';
    const borderClass = highlight ? (amount >= 0 ? 'border-blue-200 ring-4 ring-blue-500/5' : 'border-red-200 ring-4 ring-red-500/5') : 'border-slate-200';

    return (
        <div className={`p-4 rounded-xl border ${borderClass} bg-white shadow-sm flex flex-col justify-between h-24`}>
            <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">{title}</span>
                <div className={`p-1.5 rounded-lg ${bgClass}`}>
                    <Icon className={`w-3.5 h-3.5 ${colorClass}`} />
                </div>
            </div>
            <span className={`text-xl font-black font-mono ${colorClass}`}>
                {formatMoney(amount)}€
            </span>
        </div>
    );
};

const Row: React.FC<RowProps> = ({ label, value }) => (
    <div className="flex justify-between items-center py-2 border-b border-slate-200 last:border-0 hover:bg-slate-50 px-2 rounded-lg transition-colors">
        <span className="text-slate-600">{label}</span>
        <span className="text-slate-800 font-mono font-bold">{formatMoney(value)}€</span>
    </div>
);

export const SummaryStep: React.FC = () => {
    const { watch } = useFormContext();
    const data = watch();

    const totalIncome = parseFloat(data.totalIncome || '0');
    // Helper to extract numeric values safely from potentially string or number fields
    const safeVal = (val: any) => parseFloat(val || 0);

    // Calculate expenses based on form data structure
    // We replicate the logic from `categoryTotals` but adapting to the form data format
    const categoryTotals = React.useMemo(() => {
        // Renting
        const rentingCount = safeVal(data.renting?.count);
        const rentingPrice = safeVal(data.renting?.pricePerUnit);
        const rentingTotal = rentingCount * rentingPrice;

        return {
            team: safeVal(data.payroll) + safeVal(data.quota),
            fleet: rentingTotal + safeVal(data.fuel) + safeVal(data.repairs),
            structure: safeVal(data.insurance) + safeVal(data.agencyFee) + safeVal(data.prlFee) + safeVal(data.accountingFee),
            marketing: safeVal(data.marketing) + safeVal(data.appFlyder) + safeVal(data.incidents) + safeVal(data.other) + ((safeVal(data.royaltyPercent) || 0) * totalIncome / 100)
        };
    }, [data, totalIncome]);

    const totalExpenses = categoryTotals.team + categoryTotals.fleet + categoryTotals.structure + categoryTotals.marketing;
    const grossProfit = totalIncome - totalExpenses;
    // const margin = totalIncome > 0 ? ((grossProfit / totalIncome) * 100).toFixed(1) : '0';
    const totalHours = safeVal(data.totalHours);

    const taxes = React.useMemo(() => {
        const irpfPercent = safeVal(data.irpfPercent) || 20;
        const irpfAmount = grossProfit > 0 ? grossProfit * (irpfPercent / 100) : 0;
        const netClean = grossProfit - irpfAmount;
        return { irpfAmount, netClean, percent: irpfPercent };
    }, [grossProfit, data.irpfPercent]);

    // Recharts Data
    const chartData = [
        { name: 'Ingresos', value: totalIncome, fill: '#10b981' },
        { name: 'Gastos', value: totalExpenses, fill: '#ef4444' },
        { name: 'Beneficio', value: grossProfit, fill: grossProfit >= 0 ? '#3b82f6' : '#ef4444' }
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-3 p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl">
                <div className="p-2 bg-indigo-100 rounded-lg">
                    <Info className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                    <h3 className="font-bold text-indigo-900">Resumen Financiero</h3>
                    <p className="text-sm text-indigo-700">Revisa los resultados preliminares antes de confirmar.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Visual Chart - Using Recharts */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col relative min-h-[220px] shadow-sm">
                    <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Resumen Financiero</h5>
                    <div className="w-full h-[180px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                                <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis hide />
                                <RechartsTooltip
                                    formatter={(value: number) => [formatMoney(value) + ' €', 'Valor']}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <SummaryCard title="Ingresos" amount={totalIncome} type="income" icon={Wallet} />
                    <SummaryCard title="Gastos" amount={totalExpenses} type="expense" icon={ReceiptText} />
                    <SummaryCard title="Beneficio Neto" amount={grossProfit} type="profit" icon={Banknote} highlight />
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
