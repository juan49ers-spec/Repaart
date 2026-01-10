import React from 'react';
import { formatMoney } from '../../../lib/finance';
import { ShieldCheck } from 'lucide-react';
import { Card } from '../../../ui/primitives/Card';
import { SectionHeader } from '../../../ui/primitives/SectionHeader';
import { Badge } from '../../../ui/primitives/Badge';
import { StatValue } from '../../../ui/primitives/StatValue';

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
        <Card className="h-full flex flex-col group relative">
            <SectionHeader
                title="La Hucha"
                subtitle="Impuestos acumulados"
                icon={<ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
                action={
                    <Badge intent="info" className="gap-1.5">
                        <span className="text-xs">🛡️</span> Protegido
                    </Badge>
                }
            />

            {/* Main Value */}
            <div className="mb-5 relative z-10">
                <StatValue
                    value={formatMoney(totalReserve)}
                    unit="€"
                    description="Reserva Total"
                    size="xl"
                />
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
        </Card>
    );
};

export default TaxVaultWidget;
