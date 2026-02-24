import React from 'react';
import { Wallet, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { ProfessionalInput } from './ui/ProfessionalInput';
import { formatMoney } from '../../../../lib/finance';
import { LogisticsRate } from '../../../../types/franchise';

interface OrderCounts {
    [key: string]: number;
}

interface RevenueStepProps {
    orders: OrderCounts;
    setOrders: React.Dispatch<React.SetStateAction<OrderCounts>>;
    cancelledOrders: number;
    setCancelledOrders: (val: number) => void;
    totalIncome: number;
    setTotalIncome: (val: number) => void;
    isLocked: boolean;
    invoicedIncome?: { subtotal: number; total: number; ordersDetail?: Record<string, number> };
    logisticsRates: LogisticsRate[];
}

export const RevenueStep: React.FC<RevenueStepProps> = ({
    orders,
    setOrders,
    cancelledOrders,
    setCancelledOrders,
    totalIncome,
    setTotalIncome,
    isLocked,
    invoicedIncome = { subtotal: 0, total: 0 },
    logisticsRates = []
}) => {
    const hasInvoicedInconsistency = Math.abs(totalIncome - (invoicedIncome?.subtotal || 0)) > 0.01;
    const hasInvoicedData = (invoicedIncome?.subtotal || 0) > 0;

    const normalizeRangeKey = (key: string): string => {
        if (!key) return '';
        return key.toLowerCase().replace(/\s/g, '').replace(/,/g, '.').replace('.1-', '-');
    };

    const defaultRanges = ['0-4 km', '4-5 km', '5-6 km', '6-7 km', '>7 km'];
    const activeRanges = logisticsRates.length > 0
        ? logisticsRates.map(r => r.name || `${r.min}-${r.max} km`)
        : defaultRanges;

    const handleSyncFromInvoices = () => {
        if (invoicedIncome?.subtotal) {
            setTotalIncome(invoicedIncome.subtotal);
        }
        if (invoicedIncome?.ordersDetail) {
            setOrders(prev => {
                const newOrders = { ...prev };
                activeRanges.forEach(range => {
                    const normalizedRange = normalizeRangeKey(range);
                    const invoicedMatch = Object.entries(invoicedIncome.ordersDetail || {}).find(([k]) => normalizeRangeKey(k) === normalizedRange);
                    if (invoicedMatch) {
                        newOrders[range] = invoicedMatch[1];
                    }
                });
                return newOrders;
            });
        }
    };

    const totalOrders = Object.values(orders).reduce((sum, count) => sum + count, 0);

    return (
        <motion.div
            key="step1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="h-full"
        >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full">
                {/* ── Left: Distance Breakdown ── */}
                <div className="lg:col-span-7 flex flex-col h-full bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200/60 dark:border-white/5 overflow-hidden">
                    {/* Section Header */}
                    <div className="px-5 py-3.5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <Wallet className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            <h2 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">Pedidos por distancia</h2>
                        </div>
                        {hasInvoicedData && (
                            <button
                                onClick={handleSyncFromInvoices}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-wider transition-all border border-indigo-100 dark:border-indigo-500/20"
                            >
                                <RefreshCw className="w-3 h-3" />
                                Sincronizar
                            </button>
                        )}
                    </div>

                    {/* Rows */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <table className="w-full">
                            <thead>
                                <tr className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                    <th className="text-left px-5 py-2.5">#</th>
                                    <th className="text-left py-2.5">Rango</th>
                                    <th className="text-right py-2.5 pr-1">Tarifa</th>
                                    {hasInvoicedData && <th className="text-right py-2.5 pr-1">Facturado</th>}
                                    <th className="text-right py-2.5">Pedidos</th>
                                    <th className="text-right py-2.5 pr-5">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {activeRanges.map((range, index) => {
                                    const rateInfo = logisticsRates.find(r =>
                                        normalizeRangeKey(r.name || '') === normalizeRangeKey(range) ||
                                        normalizeRangeKey(`${r.min}-${r.max} km`) === normalizeRangeKey(range)
                                    );
                                    const count = orders[range] || 0;
                                    const subtotal = count * (rateInfo?.price || 0);

                                    // Invoice matching
                                    const invoicedItems = Object.entries(invoicedIncome?.ordersDetail || {});
                                    const invMatch = invoicedItems.find(([k]) => normalizeRangeKey(k) === normalizeRangeKey(range));
                                    const invCount = invMatch ? invMatch[1] : undefined;
                                    const isMatch = invCount !== undefined && count === invCount;

                                    return (
                                        <tr
                                            key={range}
                                            className="border-b border-slate-50 dark:border-slate-800/30 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
                                        >
                                            {/* Index */}
                                            <td className="px-5 py-2">
                                                <span className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                                    {index + 1}
                                                </span>
                                            </td>

                                            {/* Range */}
                                            <td className="py-2">
                                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{range}</span>
                                            </td>

                                            {/* Rate */}
                                            <td className="text-right py-2 pr-1">
                                                {rateInfo && (
                                                    <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 tabular-nums">
                                                        {rateInfo.price}€
                                                    </span>
                                                )}
                                            </td>

                                            {/* Invoice Match */}
                                            {hasInvoicedData && (
                                                <td className="text-right py-2 pr-1">
                                                    {invCount !== undefined && (
                                                        <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold tabular-nums ${isMatch
                                                            ? 'text-emerald-600 dark:text-emerald-400'
                                                            : 'text-amber-600 dark:text-amber-400'
                                                            }`}>
                                                            {isMatch
                                                                ? <CheckCircle2 className="w-3 h-3" />
                                                                : <AlertCircle className="w-3 h-3" />
                                                            }
                                                            {invCount}
                                                        </span>
                                                    )}
                                                </td>
                                            )}

                                            {/* Input */}
                                            <td className="text-right py-1.5">
                                                <input
                                                    type="number"
                                                    className="w-14 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-md text-right text-xs font-bold py-1.5 px-2 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono text-slate-900 dark:text-white"
                                                    value={orders[range] || ''}
                                                    onChange={(e) => setOrders(prev => ({ ...prev, [range]: parseInt(e.target.value) || 0 }))}
                                                    disabled={isLocked}
                                                    placeholder="0"
                                                />
                                            </td>

                                            {/* Subtotal */}
                                            <td className="text-right py-2 pr-5">
                                                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 tabular-nums">
                                                    {subtotal > 0 ? `${formatMoney(subtotal)}€` : '—'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Total Orders Footer */}
                    <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Pedidos</span>
                        <span className="text-base font-black text-slate-800 dark:text-white tabular-nums">{totalOrders}</span>
                    </div>
                </div>

                {/* ── Right: Totals & Adjustments ── */}
                <div className="lg:col-span-5 flex flex-col gap-4 h-full">
                    {/* Cancelled Orders */}
                    <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200/60 dark:border-white/5 p-5">
                        <ProfessionalInput
                            label="Pedidos Cancelados"
                            value={cancelledOrders}
                            onChange={setCancelledOrders}
                            type="number"
                            size="medium"
                            disabled={isLocked}
                        />
                    </div>

                    {/* Total Income Card */}
                    <div className="flex-1 bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200/60 dark:border-white/5 p-6 flex flex-col justify-center items-center text-center">
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-3">
                            Ingreso Bruto Total
                        </p>
                        <div className="flex items-baseline justify-center gap-0.5 mb-6">
                            <span className="text-4xl sm:text-5xl font-black tabular-nums tracking-tighter text-slate-900 dark:text-white">
                                {Math.floor(totalIncome).toLocaleString('es-ES')}
                            </span>
                            <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                                ,{String(Math.round((totalIncome % 1) * 100)).padStart(2, '0')}€
                            </span>
                        </div>

                        {/* Invoice Discrepancy Alert */}
                        {hasInvoicedInconsistency && hasInvoicedData && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="mb-5 w-full max-w-xs p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/30 rounded-xl text-left"
                            >
                                <div className="flex items-start gap-2.5">
                                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-0.5">Discrepancia</p>
                                        <p className="text-[11px] text-amber-600 dark:text-amber-300/80 leading-relaxed">
                                            No coincide con facturación: {formatMoney(invoicedIncome?.subtotal || 0)}€
                                        </p>
                                        {!isLocked && (
                                            <button
                                                onClick={handleSyncFromInvoices}
                                                className="mt-2 w-full py-1.5 px-3 bg-amber-100 dark:bg-amber-800/30 hover:bg-amber-200 dark:hover:bg-amber-800/50 text-amber-700 dark:text-amber-300 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all"
                                            >
                                                Sincronizar
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Manual Adjustment */}
                        <div className="w-full max-w-[200px]">
                            <ProfessionalInput
                                label="Ajuste Manual (€)"
                                value={totalIncome}
                                onChange={(v) => setTotalIncome(v)}
                                prefix="€"
                                size="medium"
                                disabled={isLocked}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default RevenueStep;
