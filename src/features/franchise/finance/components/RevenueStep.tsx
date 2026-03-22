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
    totalIncome: number;
    setTotalIncome: (val: number) => void;
    isLocked: boolean;
    invoicedIncome?: { subtotal: number; total: number; ordersDetail?: Record<string, number> };
    logisticsRates: LogisticsRate[];
}

export const RevenueStep: React.FC<RevenueStepProps> = ({
    orders,
    setOrders,
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
            const detail = invoicedIncome.ordersDetail;
            setOrders(prev => {
                const newOrders = { ...prev };
                // Sync standard ranges
                activeRanges.forEach(range => {
                    const normalizedRange = normalizeRangeKey(range);
                    const invoicedMatch = Object.entries(detail).find(([k]) => normalizeRangeKey(k) === normalizedRange);
                    if (invoicedMatch) {
                        newOrders[range] = invoicedMatch[1];
                    }
                });

                // Sync 'Otros' bucket if it exists in invoiced data
                if (detail['Otros'] !== undefined) {
                    newOrders['Otros'] = detail['Otros'];
                }

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
                <div className="lg:col-span-7 flex flex-col h-full bg-white dark:bg-slate-900/50 rounded-3xl border border-slate-200/80 dark:border-white/5 overflow-hidden shadow-sm">
                    {/* Section Header */}
                    <div className="px-5 py-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/20">
                        <div className="flex items-center gap-2.5">
                            <Wallet className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            <h2 className="text-[10px] font-black tracking-[0.15em] text-slate-800 dark:text-slate-100 uppercase">Pedidos por distancia</h2>
                        </div>
                        {hasInvoicedData && (
                            <button
                                onClick={handleSyncFromInvoices}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-[9px] font-bold uppercase tracking-wider transition-all border border-indigo-100 dark:border-indigo-500/20"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Sincronizar
                            </button>
                        )}
                    </div>

                    {/* Rows */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 bg-white dark:bg-slate-900/95 backdrop-blur-sm z-10">
                                <tr className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-white/5">
                                    <th className="text-left px-5 py-3 w-12">#</th>
                                    <th className="text-left py-3">Rango</th>
                                    <th className="text-right py-3 pr-4">Tarifa</th>
                                    {hasInvoicedData && <th className="text-right py-3 pr-4">Facturado</th>}
                                    <th className="text-center py-3 w-24">Pedidos</th>
                                    <th className="text-right py-3 pr-5 w-24">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(() => {
                                    // Combine activeRanges with any extra keys from orders (like 'Otros')
                                    const allDisplayedRanges = [...activeRanges];
                                    if (orders['Otros'] !== undefined && !allDisplayedRanges.includes('Otros')) {
                                        allDisplayedRanges.push('Otros');
                                    } else if (invoicedIncome.ordersDetail?.['Otros'] !== undefined && !allDisplayedRanges.includes('Otros')) {
                                        allDisplayedRanges.push('Otros');
                                    }

                                    return allDisplayedRanges.map((range, index) => {
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
                                                className={`border-b border-slate-50 dark:border-slate-800/30 hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors ${range === 'Otros' ? 'bg-amber-50/10' : ''}`}
                                            >
                                                {/* Index */}
                                                <td className="px-5 py-2.5">
                                                    <span className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                                        {range === 'Otros' ? '?' : index + 1}
                                                    </span>
                                                </td>

                                                {/* Range */}
                                                <td className="py-2.5">
                                                    <span className={`text-xs font-bold ${range === 'Otros' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                                        {range}
                                                    </span>
                                                </td>

                                                {/* Rate */}
                                                <td className="text-right py-2.5 pr-4">
                                                    {rateInfo ? (
                                                        <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 tabular-nums">
                                                            {rateInfo.price.toFixed(2)}€
                                                        </span>
                                                    ) : range === 'Otros' ? (
                                                        <span className="text-[10px] text-slate-400 italic font-medium">Varía</span>
                                                    ) : null}
                                                </td>

                                                {/* Invoice Match */}
                                                {hasInvoicedData && (
                                                    <td className="text-right py-2.5 pr-4">
                                                        {invCount !== undefined && (
                                                            <div className={`inline-flex items-center gap-1 text-[11px] font-bold tabular-nums px-2 py-0.5 rounded-full ${isMatch
                                                                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                                                                : 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
                                                                }`}>
                                                                {isMatch
                                                                    ? <CheckCircle2 className="w-3 h-3" />
                                                                    : <AlertCircle className="w-3 h-3" />
                                                                }
                                                                {invCount}
                                                            </div>
                                                        )}
                                                    </td>
                                                )}

                                                {/* Input */}
                                                <td className="text-center py-2.5">
                                                    <input
                                                        type="number"
                                                        className="w-16 h-8 mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-center text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono text-slate-900 dark:text-white shadow-sm"
                                                        value={orders[range] || ''}
                                                        onChange={(e) => setOrders(prev => ({ ...prev, [range]: parseInt(e.target.value) || 0 }))}
                                                        disabled={isLocked}
                                                        placeholder="0"
                                                    />
                                                </td>

                                                {/* Subtotal */}
                                                <td className="text-right py-2.5 pr-5">
                                                    <span className={`text-xs font-black tabular-nums ${subtotal > 0 ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400 dark:text-slate-600'}`}>
                                                        {subtotal > 0 ? `${formatMoney(subtotal)}€` : range === 'Otros' && count > 0 ? '—' : '0,00€'}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    });
                                })()}
                            </tbody>
                        </table>
                    </div>

                    {/* Total Orders Footer */}
                    <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/80 dark:bg-slate-900/50 mt-auto shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)]">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Pedidos</span>
                        <div className="flex items-center gap-2">
                            <span className="text-base font-black text-indigo-600 dark:text-indigo-400 tabular-nums bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1 rounded-lg">
                                {totalOrders}
                            </span>
                        </div>
                    </div>
                </div>

                {/* ── Right: Totals & Adjustments ── */}
                <div className="lg:col-span-5 flex flex-col gap-4 h-full">
                    
                    {/* Total Income Card - Minimalist redesign */}
                    <div className="flex-1 bg-white dark:bg-slate-900/50 rounded-3xl border border-slate-200/80 dark:border-white/5 p-6 flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden">
                        {/* Subtle decorative accent */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500/0 via-indigo-500/20 to-indigo-500/0 opacity-50"></div>

                        <div className="relative z-10 w-full">
                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">
                                Ingreso Bruto Calculado
                            </p>
                            
                            <div className="flex items-center justify-center mb-6">
                                <span className="text-4xl font-bold text-slate-800 dark:text-white tabular-nums tracking-tight">
                                    {formatMoney(totalIncome)}€
                                </span>
                            </div>

                            <div className="w-full max-w-[220px] mx-auto bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-white/5">
                                <ProfessionalInput
                                    label="Ajuste Manual (€)"
                                    value={totalIncome}
                                    onChange={(v) => setTotalIncome(v)}
                                    prefix="€"
                                    size="medium"
                                    disabled={isLocked}
                                />
                                <p className="text-[9px] text-slate-400 mt-2 font-medium">
                                    Ajuste para coincidir con facturación real.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Invoice Discrepancy Alert */}
                    {hasInvoicedInconsistency && hasInvoicedData && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="w-full p-5 bg-white dark:bg-slate-900/50 border border-amber-200/60 dark:border-amber-900/30 rounded-3xl flex flex-col shadow-sm"
                        >
                            <div className="flex items-start gap-4">
                                <div className="p-2.5 bg-amber-50 dark:bg-amber-900/20 rounded-xl shrink-0">
                                    <AlertCircle className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                                </div>
                                <div className="flex-1 min-w-0 pt-0.5">
                                    <p className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-1">Discrepancia Detectada</p>
                                    <p className="text-xs font-medium text-slate-600 dark:text-slate-300 tracking-tight leading-relaxed">
                                        El total facturado registrado es <strong className="font-extrabold text-slate-900 dark:text-white">{formatMoney(invoicedIncome?.subtotal || 0)}€</strong>.
                                    </p>
                                    {!isLocked && (
                                        <button
                                            onClick={handleSyncFromInvoices}
                                            className="mt-4 w-full py-2.5 px-4 bg-white hover:bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 group"
                                        >
                                            <RefreshCw className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500 text-indigo-500" />
                                            Autosincronizar Valores
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default RevenueStep;
