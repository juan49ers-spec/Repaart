import React from 'react';
import { Wallet, TrendingUp, Info, Sparkles, PartyPopper, Target } from 'lucide-react';
import { formatMoney } from '../../../../lib/finance';

interface TakeHomeProfitWidgetProps {
    /** Total revenue for the month */
    revenue: number;
    /** Total operating expenses */
    totalExpenses: number;
    /** IRPF tax percentage (default 20%) */
    irpfPercent?: number;
    /** Trend data for sparkline visualization */
    trend?: number[];
}

/**
 * TakeHomeProfitWidget - Motivational widget showing net profit after all deductions
 * 
 * Purpose: Show franchisees EXACTLY what money goes into their pocket
 * This is the most important number for owner motivation!
 * 
 * Calculation Flow:
 * 1. Revenue (Facturación total)
 * 2. - Operating Expenses (Gastos operativos)
 * 3. = Operating Profit / EBITDA
 * 4. - IRPF Taxes (Impuestos estimados)
 * 5. = TAKE HOME PROFIT (Lo que te queda!)
 */
const TakeHomeProfitWidget: React.FC<TakeHomeProfitWidgetProps> = ({
    revenue,
    totalExpenses,
    irpfPercent = 20,
    trend = []
}) => {
    const [showBreakdown, setShowBreakdown] = React.useState(false);

    const operatingProfit = revenue - totalExpenses;
    const estimatedTax = operatingProfit > 0 ? (operatingProfit * irpfPercent) / 100 : 0;
    const takeHomeProfit = operatingProfit - estimatedTax;
    const margin = revenue > 1 ? (takeHomeProfit / revenue) * 100 : 0;

    const isExcellent = margin >= 20;
    const isWarning = margin < 8;
    const isHealthy = margin >= 12 && margin < 20;

    const getConfig = () => {
        if (isExcellent) return {
            color: 'text-emerald-600 dark:text-emerald-400',
            bg: 'bg-emerald-50 dark:bg-emerald-950/20',
            border: 'border-emerald-200 dark:border-emerald-800',
            lightBg: 'bg-emerald-500/5',
            icon: PartyPopper,
            badge: '🟢',
            label: 'Excelente'
        };
        if (isWarning) return {
            color: 'text-rose-600 dark:text-rose-400',
            bg: 'bg-rose-50 dark:bg-rose-950/20',
            border: 'border-rose-200 dark:border-rose-800',
            lightBg: 'bg-rose-500/5',
            icon: Info,
            badge: '🔴',
            label: 'Optimizar'
        };
        return {
            color: 'text-indigo-600 dark:text-indigo-400',
            bg: 'bg-indigo-50 dark:bg-indigo-950/20',
            border: 'border-indigo-200 dark:border-indigo-800',
            lightBg: 'bg-indigo-500/5',
            icon: Wallet,
            badge: '🟡',
            label: 'Estable'
        };
    };

    const config = getConfig();

    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 h-full flex flex-col relative overflow-hidden group">
            {/* Subtle hover background */}
            <div className={`absolute inset-0 ${config.lightBg} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

            {/* Header */}
            <div className="flex items-start justify-between mb-5 relative z-10">
                <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl ${config.bg} flex items-center justify-center border ${config.border} transition-all duration-300 group-hover:scale-110 group-hover:shadow-md`}>
                        <config.icon className={`w-5 h-5 ${config.color}`} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-800 dark:text-white tracking-tight">Tu Bolsillo</h3>
                        <p className="text-[9px] text-slate-500 font-semibold uppercase tracking-[0.08em] leading-none mt-1.5">Beneficio neto estimado</p>
                    </div>
                </div>

                {/* Health Badge */}
                <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg ${config.bg} border ${config.border} transition-all duration-300 group-hover:scale-105`}>
                    <span className="text-xs">{config.badge}</span>
                    <span className={`text-xs font-bold ${config.color}`}>{config.label}</span>
                </div>
            </div>

            {/* Main Value */}
            <div className="mb-5 relative z-10">
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
                        {formatMoney(takeHomeProfit)}
                    </span>
                    <span className="text-xl font-bold text-slate-400">€</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                    <div className={`text-[10px] font-bold uppercase tracking-wider ${config.color}`}>
                        {margin.toFixed(1)}% MARGEN NETO
                    </div>
                </div>
            </div>

            {/* Always-Visible Breakdown */}
            <div className="flex-1 space-y-2. mb-4 relative z-10">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 transition-all hover:bg-slate-100 dark:hover:bg-slate-800">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Ingresos Brutos</span>
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 tabular-nums">{formatMoney(revenue)}€</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 transition-all hover:bg-slate-100 dark:hover:bg-slate-800">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-rose-500" />
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Gastos + IRPF</span>
                    </div>
                    <span className="text-xs font-bold text-rose-500 tabular-nums">-{formatMoney(totalExpenses + estimatedTax)}€</span>
                </div>
            </div>

            {/* Footer Action with Enhanced Context */}
            <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800 relative z-10">
                <button
                    onClick={() => setShowBreakdown(!showBreakdown)}
                    className="w-full flex items-center justify-center gap-2 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                >
                    {showBreakdown ? 'Ocultar Detalle' : 'Ver Detalle Completo'}
                    <TrendingUp className={`w-3 h-3 transition-transform duration-300 ${showBreakdown ? 'rotate-180' : ''}`} />
                </button>

                {showBreakdown && (
                    <div className="mt-3 space-y-2 animate-in fade-in slide-in-from-top-1 duration-300">
                        <div className="flex justify-between text-[10px] py-1.5">
                            <span className="text-slate-500 font-medium">Gastos Operativos</span>
                            <span className="font-mono text-slate-700 dark:text-slate-300 font-bold">{formatMoney(totalExpenses)}€</span>
                        </div>
                        <div className="flex justify-between text-[10px] py-1.5">
                            <span className="text-slate-500 font-medium">Reserva IRPF ({irpfPercent}%)</span>
                            <span className="font-mono text-slate-700 dark:text-slate-300 font-bold">{formatMoney(estimatedTax)}€</span>
                        </div>
                        <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800">
                            <p className={`text-[9px] ${config.color} font-bold italic text-center`}>
                                {isExcellent && 'Rentabilidad superior. ¡Continúa así!'}
                                {isHealthy && 'Márgenes saludables. Puedes optimizar aún más.'}
                                {isWarning && 'Atención: considera reducir gastos o aumentar ingresos.'}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};


export default TakeHomeProfitWidget;
