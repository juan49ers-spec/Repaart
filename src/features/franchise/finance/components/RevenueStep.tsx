import React from 'react';
import { Wallet } from 'lucide-react';
import { motion } from 'framer-motion';
import { ProfessionalCard } from './ui/ProfessionalCard';
import { ProfessionalInput } from './ui/ProfessionalInput';
import { formatMoney } from '../../../../lib/finance';

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
}

export const RevenueStep: React.FC<RevenueStepProps> = ({
    orders,
    setOrders,
    cancelledOrders,
    setCancelledOrders,
    totalIncome,
    setTotalIncome,
    isLocked
}) => {
    return (
        <motion.div
            key="step1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="h-full"
        >
            <div className="grid grid-cols-2 gap-4 h-full">
                {/* Left: Km Breakdown */}
                <ProfessionalCard title="Desglose por Distancia" icon={Wallet} className="h-full">
                    <div className="flex flex-col h-full gap-2">
                        {['0-4 km', '4-5 km', '5-6 km', '6-7 km', '>7 km'].map((range, index) => (
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
                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">{range}</span>
                                        <span className="text-[9px] font-medium text-slate-400 uppercase tracking-wide">Pedidos</span>
                                    </div>
                                </div>
                                <div className="w-24">
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
                        ))}
                        <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center px-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Pedidos</span>
                            <span className="text-sm font-black text-slate-900 dark:text-white tabular-nums">
                                {Object.values(orders).reduce((sum, count) => sum + count, 0)}
                            </span>
                        </div>
                    </div>
                </ProfessionalCard>

                {/* Right: Totals & Adjustments */}
                <div className="flex flex-col gap-4 h-full">
                    <ProfessionalCard title="Ajustes" className="flex-shrink-0">
                        <ProfessionalInput label="Pedidos Cancelados" value={cancelledOrders} onChange={setCancelledOrders} type="number" size="small" />
                    </ProfessionalCard>

                    <div className="flex-1 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-xl p-6 shadow-xl shadow-indigo-500/20 flex flex-col justify-center items-center text-center relative overflow-hidden group border border-indigo-500/50">
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                        <div className="relative z-10">
                            <p className="text-[10px] font-bold text-indigo-100 uppercase tracking-[0.2em] mb-3 opacity-80">Ingreso Bruto Total</p>
                            <div className="flex items-baseline justify-center gap-1 mb-6">
                                <span className="text-5xl font-black text-white tracking-tighter tabular-nums drop-shadow-sm">
                                    {formatMoney(totalIncome).split(',')[0]}
                                </span>
                                <span className="text-2xl font-bold text-indigo-200">,{formatMoney(totalIncome).split(',')[1]}€</span>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/10 max-w-[220px] mx-auto">
                                <label className="block text-[9px] font-bold text-indigo-200 uppercase tracking-wider mb-1 text-left">Ajuste Manual (€)</label>
                                <input
                                    type="number"
                                    value={totalIncome}
                                    onChange={(e) => setTotalIncome(parseFloat(e.target.value) || 0)}
                                    className="w-full bg-transparent border-b border-indigo-300/30 text-white font-mono font-bold text-sm focus:outline-none focus:border-white py-1 text-center placeholder-indigo-300/50"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
