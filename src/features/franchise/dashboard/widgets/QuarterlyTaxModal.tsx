import React, { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, Calculator, TrendingUp, AlertCircle, Zap, ArrowRight, PiggyBank } from 'lucide-react';
import { formatMoney, calculateExpenses, MonthlyData } from '../../../../lib/finance';

interface QuarterlyTaxModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentMonth: string; // YYYY-MM
    historicalData: MonthlyData[];
    currentMonthTaxes?: { ivaAPagar: number; irpfPago: number };
    isPaymentMode?: boolean;
}

const QuarterlyTaxModal: React.FC<QuarterlyTaxModalProps> = ({ isOpen, onClose, currentMonth, historicalData, currentMonthTaxes, isPaymentMode }) => {
    const selectedDate = new Date(currentMonth + '-01');
    const currentYear = selectedDate.getFullYear();
    const currentMonthIndex = selectedDate.getMonth();

    const quarterIndex = Math.floor(currentMonthIndex / 3);
    const quarterNumber = quarterIndex + 1;
    const startMonthIndex = quarterIndex * 3;
    const endMonthIndex = startMonthIndex + 2;

    const quarterData = useMemo(() => {
        return historicalData.filter(d => {
            const dMonthStr = (d as MonthlyData & { month?: string; id?: string }).month || (d as MonthlyData & { month?: string; id?: string }).id;
            if (!dMonthStr) return false;
            const dDate = new Date(dMonthStr + '-01');
            return dDate.getFullYear() === currentYear && dDate.getMonth() >= startMonthIndex && dDate.getMonth() <= endMonthIndex;
        });
    }, [historicalData, currentYear, startMonthIndex, endMonthIndex]);

    const accumulated = useMemo(() => {
        let totalIVA = 0;
        let totalIRPF = 0;
        let totalRevenue = 0;
        const includedMonths = new Set<number>();

        quarterData.forEach(monthData => {
            const anyData = monthData as any;
            const dataMonth = anyData.month || anyData.id;
            const revenue = monthData.revenue || monthData.totalIncome || anyData.grossIncome || 0;

            if (revenue > 0 && dataMonth) {
                // Track which month index (0, 1, 2) this is within the quarter
                const dDate = new Date(dataMonth + '-01');
                const relIndex = dDate.getMonth() % 3;
                includedMonths.add(relIndex);

                const isCurrentMonth = dataMonth === currentMonth;
                if (isCurrentMonth && currentMonthTaxes) {
                    totalIVA += currentMonthTaxes.ivaAPagar;
                    totalIRPF += currentMonthTaxes.irpfPago;
                } else {
                    const storedIVA = anyData.breakdown?.['IVA a Pagar'] || anyData.breakdown?.['IVA'] || anyData.taxes?.ivaAPagar;
                    const storedIRPF = anyData.breakdown?.['IRPF'] || anyData.breakdown?.['IRPF Pago'] || anyData.taxes?.irpfPago;
                    if (storedIVA !== undefined || storedIRPF !== undefined) {
                        totalIVA += Number(storedIVA || 0);
                        totalIRPF += Number(storedIRPF || 0);
                    } else {
                        const orders = monthData.orders || 0;
                        const report = calculateExpenses(revenue, orders, monthData);
                        totalIVA += report.taxes.ivaAPagar;
                        totalIRPF += report.taxes.irpfPago;
                    }
                }
                totalRevenue += revenue;
            }
        });
        return { totalIVA, totalIRPF, totalRevenue, includedMonths };
    }, [quarterData, currentMonth, currentMonthTaxes]);

    const deadlines = useMemo(() => {
        const nextQuarterMonthIndex = (quarterIndex + 1) * 3;
        const ivaDate = new Date(currentYear, nextQuarterMonthIndex, 20);
        const irpfDate = new Date(currentYear, nextQuarterMonthIndex, 20);

        if (quarterNumber === 4) {
            irpfDate.setFullYear(currentYear + 1);
            irpfDate.setMonth(0);
            irpfDate.setDate(20);
            ivaDate.setFullYear(currentYear + 1);
            ivaDate.setMonth(0);
            ivaDate.setDate(31);
        }
        const fmt = (d: Date) => d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
        return { iva: fmt(ivaDate), irpf: fmt(irpfDate) };
    }, [currentYear, quarterIndex, quarterNumber]);

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] isolation-auto">
            {/* Minimalist Dark Overlay */}
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />

            <div className="fixed inset-0 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-[360px] p-6 animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 relative overflow-hidden">

                    {/* Header: Clean & Bold - Compact */}
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transform rotate-[-3deg] ${isPaymentMode
                                ? 'bg-red-600 shadow-red-500/30'
                                : 'bg-indigo-600 shadow-indigo-500/30'}`}>
                                <AlertCircle className="w-5 h-5 text-white" strokeWidth={2} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-none tracking-tight">
                                    Pago {quarterNumber}T
                                </h3>
                                <div className={`mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest ${isPaymentMode
                                    ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                                    : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400'}`}>
                                    <Zap className="w-2 h-2 fill-current" />
                                    {isPaymentMode ? 'Pendiente' : 'En Curso'}
                                </div>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors">
                            <X className="w-4 h-4 text-slate-400" strokeWidth={2} />
                        </button>
                    </div>

                    {/* Main Hero Amount - Compact */}
                    <div className={`mb-5 p-4 rounded-2xl text-center border ${isPaymentMode
                        ? 'bg-red-50/50 border-red-100 dark:bg-red-900/10 dark:border-red-500/10'
                        : 'bg-indigo-50/50 border-indigo-100 dark:bg-indigo-900/10 dark:border-indigo-500/10'}`}>
                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-1 block">
                            Reserva Total Sugerida
                        </span>
                        <div className="flex items-baseline justify-center gap-0.5">
                            <span className={`text-4xl font-bold tracking-tight drop-shadow-sm ${isPaymentMode ? 'text-red-600 dark:text-red-500' : 'text-indigo-600 dark:text-indigo-500'}`}>
                                {formatMoney(accumulated.totalIVA + accumulated.totalIRPF).split(',')[0]}
                            </span>
                            <span className={`text-xl font-semibold ${isPaymentMode ? 'text-red-400' : 'text-indigo-400'}`}>
                                ,{formatMoney(accumulated.totalIVA + accumulated.totalIRPF).split(',')[1]}€
                            </span>
                        </div>

                        <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-white/5">
                            <TrendingUp className="w-2.5 h-2.5 text-emerald-500" />
                            <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide">
                                Base: <span className="text-slate-600 dark:text-slate-300">{formatMoney(accumulated.totalRevenue)}€</span>
                            </span>
                        </div>
                    </div>

                    {/* Timeline Visualization - Compact & Accurate */}
                    <div className="mb-5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-1.5 mb-3">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <h4 className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest">Ciclo Fiscal</h4>
                        </div>

                        <div className="flex items-center justify-between relative px-1">
                            {/* Connector Line */}
                            <div className="absolute top-1/2 left-0 w-full h-[1.5px] bg-slate-200 dark:bg-slate-800 -z-0 transform -translate-y-1/2" />

                            {[0, 1, 2].map((i) => {
                                const isIncluded = accumulated.includedMonths.has(i);
                                const monthDate = new Date(currentYear, startMonthIndex + i);
                                const monthName = monthDate.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '').toUpperCase();

                                return (
                                    <div key={i} className="relative z-10 flex flex-col items-center gap-1.5 bg-slate-50 dark:bg-slate-900/50 p-1.5 rounded-lg">
                                        <div className={`w-8 h-8 rounded-full border-[2px] flex items-center justify-center transition-all ${isIncluded
                                            ? 'bg-white dark:bg-slate-800 border-emerald-500 shadow-md shadow-emerald-500/20'
                                            : 'bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 border-dashed opacity-70'
                                            }`}>
                                            <TrendingUp className={`w-3.5 h-3.5 ${isIncluded ? 'text-emerald-500' : 'text-slate-300'}`} />
                                        </div>
                                        <div className="text-center">
                                            <div className={`text-[8px] font-semibold ${isIncluded ? 'text-slate-600 dark:text-slate-400' : 'text-slate-400'}`}>{monthName}</div>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Payment Node */}
                            <div className="relative z-10 flex flex-col items-center gap-1.5 bg-slate-50 dark:bg-slate-900/50 p-1.5 rounded-lg">
                                <div className={`w-10 h-10 rounded-full border-[2px] flex items-center justify-center transition-all ${isPaymentMode
                                    ? 'bg-red-600 border-red-500 shadow-lg shadow-red-500/30'
                                    : 'bg-white border-slate-200'}`}>
                                    <Zap className={`w-4 h-4 ${isPaymentMode ? 'text-white fill-white' : 'text-slate-300'}`} />
                                </div>
                                <div className="text-center">
                                    <div className={`text-[8px] font-bold ${isPaymentMode ? 'text-red-600' : 'text-slate-400'}`}>PAGO</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tax Breakdown Cards - Compact */}
                    <div className="space-y-2 mb-5">
                        {/* IVA */}
                        <div className="group flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-800/20 border border-slate-100 dark:border-white/5 hover:border-indigo-500/30 hover:shadow-md hover:shadow-indigo-500/5 transition-all">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                    <Calculator className="w-4 h-4" />
                                </div>
                                <div>
                                    <h5 className="text-[9px] font-semibold uppercase tracking-wider text-slate-900 dark:text-white">IVA (303)</h5>
                                    <div className="flex items-center gap-1 mt-0.5">
                                        <Calendar className="w-2.5 h-2.5 text-slate-400" />
                                        <span className="text-[8px] font-medium text-slate-500">PAGAR: <span className="font-semibold text-indigo-600">{deadlines.iva}</span></span>
                                    </div>
                                </div>
                            </div>
                            <span className="text-base font-semibold text-indigo-600 dark:text-indigo-400 tabular-nums">
                                {formatMoney(Math.abs(accumulated.totalIVA))}€
                            </span>
                        </div>

                        {/* IRPF */}
                        <div className="group flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-800/20 border border-slate-100 dark:border-white/5 hover:border-amber-500/30 hover:shadow-md hover:shadow-amber-500/5 transition-all">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                                    <PiggyBank className="w-4 h-4" />
                                </div>
                                <div>
                                    <h5 className="text-[9px] font-semibold uppercase tracking-wider text-slate-900 dark:text-white">IRPF (130)</h5>
                                    <div className="flex items-center gap-1 mt-0.5">
                                        <Calendar className="w-2.5 h-2.5 text-slate-400" />
                                        <span className="text-[8px] font-medium text-slate-500">PAGAR: <span className="font-semibold text-amber-600">{deadlines.irpf}</span></span>
                                    </div>
                                </div>
                            </div>
                            <span className="text-base font-semibold text-amber-600 dark:text-amber-400 tabular-nums">
                                {formatMoney(Math.abs(accumulated.totalIRPF))}€
                            </span>
                        </div>
                    </div>

                    {/* Action Button - Compact */}
                    <button
                        onClick={onClose}
                        className={`group/btn w-full py-3 rounded-xl font-semibold text-[10px] uppercase tracking-[0.2em] shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 ${isPaymentMode
                            ? 'bg-red-600 text-white shadow-red-500/30 hover:bg-red-500'
                            : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-slate-900/30'}`}
                    >
                        {isPaymentMode ? 'Revisar facturas y confirmar cálculo' : 'Confirmar Reserva'}
                        <ArrowRight className="w-3.5 h-3.5 transform group-hover/btn:translate-x-1 transition-transform" strokeWidth={2} />
                    </button>

                    <p className="mt-6 text-center text-[9px] text-slate-400 font-semibold uppercase tracking-widest opacity-60">
                        Cálculo profesional ({accumulated.includedMonths.size} meses)
                    </p>

                </div>
            </div>
        </div>,
        document.body
    );
};

export default QuarterlyTaxModal;
