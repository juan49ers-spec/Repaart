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

    return (
        <motion.div
            key="step1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="h-full"
        >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full p-2">
                {/* Left: Km Breakdown */}
                <div className="lg:col-span-7 flex flex-col h-full bg-white dark:bg-slate-900/50 rounded-3xl border border-slate-200/60 dark:border-white/5 overflow-hidden shadow-sm">
                    <div className="px-6 py-5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-transparent">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl text-indigo-600 dark:text-indigo-400">
                                <Wallet className="w-5 h-5" strokeWidth={2} />
                            </div>
                            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Desglose por Distancia</h2>
                        </div>
                        {hasInvoicedData && (
                            <button
                                onClick={handleSyncFromInvoices}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-black tracking-widest uppercase transition-all border border-indigo-200/50 dark:border-indigo-500/20"
                                title="Sincronizar todos los pedidos con las facturas emitidas"
                            >
                                <RefreshCw className="w-3.5 h-3.5" strokeWidth={2.5} />
                                SINCRONIZAR
                            </button>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar flex flex-col gap-3">
                        {activeRanges.map((range, index) => {
                            const rateInfo = logisticsRates.find(r =>
                                normalizeRangeKey(r.name || '') === normalizeRangeKey(range) ||
                                normalizeRangeKey(`${r.min}-${r.max} km`) === normalizeRangeKey(range)
                            );
                            return (
                                <div key={range} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 group transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-800">
                                    <div className="flex items-center gap-3">
                                        <div className={`
                                            w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold
                                            ${index === 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                                index === 1 ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' :
                                                    index === 2 ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400' :
                                                        index === 3 ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400' :
                                                            'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'}
                                        `}>
                                            {index + 1}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">{range}</span>
                                                {rateInfo && (
                                                    <span className="text-[10px] font-medium text-indigo-500/70 dark:text-indigo-400/50 bg-indigo-50 dark:bg-indigo-500/5 px-1.5 rounded-full border border-indigo-100/50 dark:border-indigo-500/10 italic">
                                                        {rateInfo.price}€/ped
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-[9px] font-medium text-slate-400 uppercase tracking-wide">Pedidos</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <div className="flex items-center gap-2">
                                            {hasInvoicedData && activeRanges.length > 0 && (() => {
                                                const normalizedInvoicedItems = Object.entries(invoicedIncome.ordersDetail || {});
                                                const invItem = normalizedInvoicedItems.find(([k]) => normalizeRangeKey(k) === normalizeRangeKey(range));
                                                const invCount = invItem ? invItem[1] : undefined;

                                                if (invCount === undefined) {
                                                    return null;
                                                }
                                                const isMatch = (orders[range] || 0) === invCount;

                                                return (
                                                    <div className={`
                                                        text-[9px] px-1.5 py-0.5 rounded flex items-center gap-1 font-black uppercase tracking-tighter
                                                        ${isMatch
                                                            ? 'bg-emerald-100/80 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                            : 'bg-amber-100/80 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 animate-pulse'}
                                                    `}>
                                                        {isMatch ? <CheckCircle2 className="w-2.5 h-2.5" /> : <AlertCircle className="w-2.5 h-2.5" />}
                                                        Facturado: {invCount}
                                                    </div>
                                                );
                                            })()}
                                            <div className="w-16">
                                                <input
                                                    type="number"
                                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-right text-sm font-bold py-1 px-2 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono text-slate-900 dark:text-white"
                                                    value={orders[range] || ''}
                                                    onChange={(e) => setOrders(prev => ({ ...prev, [range]: parseInt(e.target.value) || 0 }))}
                                                    disabled={isLocked}
                                                    placeholder="0"
                                                />
                                            </div>
                                        </div>
                                        {rateInfo && (orders[range] || 0) > 0 && (
                                            <span className="text-[10px] font-bold text-slate-400/80 dark:text-slate-500 tabular-nums">
                                                {formatMoney((orders[range] || 0) * rateInfo.price)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center px-2">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em]">Total Pedidos</span>
                            <span className="text-lg font-black text-slate-800 dark:text-white tabular-nums">
                                {Object.values(orders).reduce((sum, count) => sum + count, 0)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right: Totals & Adjustments */}
                <div className="lg:col-span-5 flex flex-col gap-6 h-full">
                    {/* Ajustes */}
                    <div className="bg-white dark:bg-slate-900/50 rounded-3xl border border-slate-200/60 dark:border-white/5 p-6 shadow-sm flex-shrink-0">
                        <div className="flex items-center gap-2 mb-4">
                            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Ajustes</h2>
                        </div>
                        <ProfessionalInput label="Pedidos Cancelados" value={cancelledOrders} onChange={setCancelledOrders} type="number" size="medium" />
                    </div>

                    {/* Total Card */}
                    <div className="flex-1 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-3xl p-8 border border-indigo-100/50 dark:border-indigo-800/30 flex flex-col justify-center items-center text-center relative overflow-hidden group">
                        <div className="relative z-10 w-full flex flex-col items-center">
                            <p className="text-[10px] sm:text-[11px] font-bold text-indigo-600/70 dark:text-indigo-400 uppercase tracking-[0.25em] mb-4">Ingreso Bruto Total</p>
                            <div className="flex items-baseline justify-center gap-1 mb-8">
                                <span className="text-5xl sm:text-6xl font-black tabular-nums tracking-tighter text-indigo-950 dark:text-white">
                                    {Math.floor(totalIncome)}
                                </span>
                                <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                                    ,{String(Math.round((totalIncome % 1) * 100)).padStart(2, '0')}€
                                </span>
                            </div>

                            {hasInvoicedInconsistency && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    className="mb-8 w-full max-w-sm p-4 bg-amber-500/10 backdrop-blur-md border border-amber-500/20 rounded-2xl text-left"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="mt-0.5 text-amber-500 bg-amber-500/10 p-1.5 rounded-lg"><AlertCircle className="w-4 h-4" /></div>
                                        <div className="flex-1">
                                            <p className="text-[11px] font-bold text-amber-400 uppercase tracking-widest mb-1">Discrepancia detectada</p>
                                            <p className="text-xs text-amber-200/80 leading-relaxed mb-3">
                                                El total manual no coincide con la base imponible facturada ({formatMoney(invoicedIncome?.subtotal || 0)}).
                                            </p>
                                            {hasInvoicedData && !isLocked && (
                                                <button
                                                    onClick={handleSyncFromInvoices}
                                                    className="w-full py-2 px-4 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-400 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all active:scale-[0.98]"
                                                >
                                                    Sincronizar Facturas
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            <div className="w-full max-w-[240px]">
                                <label className="block text-[10px] font-bold text-indigo-300/60 uppercase tracking-[0.2em] mb-2">Ajuste Manual (€)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">€</span>
                                    <input
                                        type="number"
                                        value={totalIncome}
                                        onChange={(e) => setTotalIncome(parseFloat(e.target.value) || 0)}
                                        className="w-full bg-white/5 border border-white/10 hover:border-white/20 text-white font-mono font-bold text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent rounded-2xl py-3 pl-10 pr-4 transition-all placeholder-white/20"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default RevenueStep;
