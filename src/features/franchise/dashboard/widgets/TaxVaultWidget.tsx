import { type FC, type CSSProperties, useState } from 'react';
import { Landmark, Lock, Maximize2, Activity } from 'lucide-react';
import { formatMoney, MonthlyData } from '../../../../lib/finance';
import QuarterlyTaxModal from './QuarterlyTaxModal';

interface TaxData {
    ivaAPagar: number;
    irpfPago: number;
}

interface TaxVaultWidgetProps {
    taxes: TaxData | null;
    currentMonth?: string;
    historicalData?: MonthlyData[];
}

const TaxVaultWidget: FC<TaxVaultWidgetProps> = ({ taxes, currentMonth, historicalData }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    if (!taxes) return null;

    const { ivaAPagar, irpfPago } = taxes;
    const totalTax = ivaAPagar + irpfPago;
    const safeTotal = totalTax * 1.0;

    return (
        <div className="workstation-card workstation-scanline p-6 h-full flex flex-col group/card transition-all mechanical-press overflow-hidden">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-900/20">
                        <Landmark className="w-4 h-4 text-emerald-600 dark:text-emerald-300" />
                    </div>
                    <div className="leading-tight">
                        <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                            Hucha fiscal
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                Reserva activa
                            </span>
                        </div>
                    </div>
                </div>
                <button
                    onClick={(e) => { e.stopPropagation(); setIsModalOpen(true); }}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 text-slate-500 hover:text-ruby-600 transition-colors"
                    title="Ver detalle trimestral"
                >
                    <Maximize2 className="w-4 h-4" />
                </button>
            </div>

            {/* MAIN VAULT DISPLAY */}
            <div className="mb-5">
                <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter italic tabular-nums">
                        {formatMoney(safeTotal)}€
                    </span>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest font-mono opacity-50">protegido</span>
                </div>
                <div className="mt-1 flex items-center gap-1.5 px-2 py-0.5 w-fit rounded bg-emerald-500/10 text-emerald-600 text-[8px] font-black uppercase tracking-widest border border-emerald-500/20">
                    <Lock className="w-2.5 h-2.5" />
                    capital.blindado
                </div>
            </div>

            {/* HIGH-DENSITY PROGRESS TRACKING */}
            <div className="space-y-4 flex-1">
                <div className="group/bar">
                    <div className="flex justify-between items-end mb-1 px-1">
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest font-mono">componente.iva.303</span>
                        <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 tabular-nums">{formatMoney(ivaAPagar)}€</span>
                    </div>
                    <div className="h-1 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                            style={{ width: `${Math.min((ivaAPagar / (totalTax || 1)) * 100, 100)}%` } as CSSProperties}
                        />
                    </div>
                </div>

                <div className="group/bar">
                    <div className="flex justify-between items-end mb-1 px-1">
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest font-mono">componente.irpf.130</span>
                        <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 tabular-nums">{formatMoney(irpfPago)}€</span>
                    </div>
                    <div className="h-1 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-amber-500 rounded-full transition-all duration-1000"
                            style={{ width: `${Math.min((irpfPago / (totalTax || 1)) * 100, 100)}%` } as CSSProperties}
                        />
                    </div>
                </div>
            </div>

            {/* ADVISORY TAPE */}
            <div className="mt-6 flex items-center gap-3 p-2 rounded-lg bg-white/50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                <Activity className="w-3.5 h-3.5 text-ruby-600 shrink-0" />
                <p className="text-[8px] font-black uppercase tracking-tight text-slate-400 font-mono leading-none">
                    Reserva automática activa · Próximo trimestre cubierto
                </p>
            </div>

            {/* Quarterly Modal */}
            {currentMonth && historicalData && (
                <QuarterlyTaxModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    currentMonth={currentMonth}
                    historicalData={historicalData}
                    currentMonthTaxes={taxes}
                />
            )}
        </div>
    );
};

export default TaxVaultWidget;
