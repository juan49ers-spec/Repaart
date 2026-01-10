import React from 'react';
import { formatMoney } from '../../../lib/finance';
import { ShieldCheck } from 'lucide-react';

interface TaxVaultWidgetProps {
    taxes: {
        ivaRepercutido: number;
        ivaSoportado: number;
        ivaAPagar: number;
        irpfPago: number;
        totalReserve: number;
    };
    minimal?: boolean;
}

const TaxVaultWidget: React.FC<TaxVaultWidgetProps> = ({ taxes }) => {
    const { ivaAPagar, irpfPago, totalReserve, ivaRepercutido } = taxes;

    // Prevenir divisiones por cero
    const safeTotal = (ivaRepercutido + irpfPago) || 1;
    const ivaPercent = (ivaRepercutido / safeTotal) * 100;
    const irpfPercent = (irpfPago / safeTotal) * 100;

    // Calcular fechas de pago próximas (Fiscal español)
    // Trimestrales: Abril, Julio, Octubre, Enero
    // IVA: 20 de Abr/Jul/Oct, 31 de Enero
    // IRPF: 20 de Abr/Jul/Oct, 20 de Enero
    const now = new Date();
    const currentYear = now.getFullYear();

    const getNextTaxDate = (isIVA: boolean) => {
        const dates = [
            { m: 0, d: isIVA ? 31 : 20 }, // Enero
            { m: 3, d: 20 },               // Abril
            { m: 6, d: 20 },               // Julio
            { m: 9, d: 20 }                // Octubre
        ];

        for (const date of dates) {
            const targetDate = new Date(currentYear, date.m, date.d, 23, 59, 59);
            if (targetDate > now) return targetDate;
        }

        // Si ya pasaron todas este año, la primera del próximo año
        return new Date(currentYear + 1, dates[0].m, dates[0].d, 23, 59, 59);
    };

    const nextIvaDate = getNextTaxDate(true);
    const nextIrpfDate = getNextTaxDate(false);

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const daysUntil = (date: Date) => {
        const diff = date.getTime() - now.getTime();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };

    const ivaUrgent = daysUntil(nextIvaDate) < 30;
    const irpfUrgent = daysUntil(nextIrpfDate) < 60;

    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 h-full flex flex-col relative overflow-hidden group">
            {/* Subtle hover background */}
            <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Header */}
            <div className="flex items-start justify-between mb-5 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 flex items-center justify-center border border-indigo-100 dark:border-indigo-900 transition-all duration-300 group-hover:scale-110 group-hover:shadow-md">
                        <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-800 dark:text-white tracking-tight">La Hucha</h3>
                        <p className="text-[9px] text-slate-500 font-semibold uppercase tracking-[0.08em] leading-none mt-1.5">Impuestos acumulados</p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 transition-all duration-300 group-hover:scale-105">
                    <span className="text-xs">🛡️</span>
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Protegido</span>
                </div>
            </div>

            {/* Main Value */}
            <div className="mb-5 relative z-10">
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
                        {formatMoney(totalReserve)}
                    </span>
                    <span className="text-xl font-bold text-slate-400">€</span>
                </div>
                <p className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider mt-2">Reserva Total</p>
            </div>

            {/* Enhanced Visualization Bar */}
            <div className="space-y-3 flex-1 relative z-10 mb-4">
                <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full flex overflow-hidden shadow-inner">
                    <div
                        style={{ width: `${ivaPercent}%` }}
                        className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-1000 relative group/segment"
                    >
                        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover/segment:opacity-100 transition-opacity" />
                    </div>
                    <div
                        style={{ width: `${irpfPercent}%` }}
                        className="h-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-1000 relative group/segment"
                    >
                        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover/segment:opacity-100 transition-opacity" />
                    </div>
                </div>

                {/* Enhanced Legend with Payment Dates */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 transition-all hover:bg-slate-100 dark:hover:bg-slate-800">
                        <div className="flex items-center gap-1.5 mb-1">
                            <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-sm" />
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">IVA</span>
                        </div>
                        <div className="text-sm font-bold text-slate-700 dark:text-slate-200 tabular-nums mb-1">
                            {formatMoney(ivaAPagar)}€
                        </div>
                        <div className={`text-[8px] font-semibold ${ivaUrgent ? 'text-orange-500' : 'text-slate-400'} flex items-center gap-1`}>
                            <span>📅</span>
                            <span>{formatDate(nextIvaDate)}</span>
                        </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 transition-all hover:bg-slate-100 dark:hover:bg-slate-800">
                        <div className="flex items-center gap-1.5 mb-1">
                            <div className="w-2 h-2 rounded-full bg-amber-500 shadow-sm" />
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">IRPF</span>
                        </div>
                        <div className="text-sm font-bold text-slate-700 dark:text-slate-200 tabular-nums mb-1">
                            {formatMoney(irpfPago)}€
                        </div>
                        <div className={`text-[8px] font-semibold ${irpfUrgent ? 'text-orange-500' : 'text-slate-400'} flex items-center gap-1`}>
                            <span>📅</span>
                            <span>{formatDate(nextIrpfDate)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer with Context */}
            <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800 relative z-10">
                <p className="text-[9px] text-slate-400 text-center font-medium italic">
                    {totalReserve > 0
                        ? `Mueve ${formatMoney(totalReserve)}€ a tu cuenta de ahorro fiscal.`
                        : "No hay impuestos pendientes de reserva."}
                </p>
            </div>
        </div>
    );
};


export default TaxVaultWidget;
