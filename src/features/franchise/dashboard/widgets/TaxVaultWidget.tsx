import { type FC, type CSSProperties, useState } from 'react';
import { Landmark, Lock, Maximize2, ShieldCheck, TrendingUp } from 'lucide-react';
import { formatMoney, MonthlyData } from '../../../../lib/finance';
import QuarterlyTaxModal from './QuarterlyTaxModal';
import { Card } from '../../../../components/ui/primitives/Card';

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

    // Simulate a "Safe" percentage (e.g., assuming we want to have 20% buffer)
    const safeTotal = totalTax * 1.0;

    return (
        <Card className="h-full relative overflow-hidden group p-0" noPadding>
            {/* Premium Banking Backdrop */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-indigo-500/5 dark:from-emerald-500/10 dark:to-indigo-500/10 pointer-events-none" />

            <div className="relative z-10 p-5 flex flex-col h-full">
                {/* Header Section */}
                <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="p-2.5 bg-emerald-600 rounded-2xl shadow-lg shadow-emerald-500/20">
                                <Landmark className="w-5 h-5 text-white" />
                            </div>
                            <div className="absolute -bottom-1 -right-1 p-1 bg-white dark:bg-slate-900 rounded-full border border-emerald-50 shadow-sm">
                                <ShieldCheck className="w-2.5 h-2.5 text-emerald-500" />
                            </div>
                        </div>
                        <div>
                            <h3 className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-wider">
                                Hucha Fiscal
                            </h3>
                            <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">Reserva Activa</p>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:scale-110 active:scale-95 transition-all shadow-sm group/btn"
                    >
                        <Maximize2 className="w-4 h-4 text-slate-400 group-hover/btn:text-indigo-500 transition-colors" />
                    </button>
                </div>

                {/* Main Vault Status */}
                <div className="mb-6 text-center lg:text-left">
                    <div className="inline-flex items-center gap-2 mb-1">
                        <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter tabular-nums">
                            {formatMoney(safeTotal)}
                        </span>
                        <span className="text-xl font-bold text-slate-400 group-hover:text-emerald-500/50 transition-colors">€</span>
                    </div>
                    <div className="flex items-center gap-2 justify-center lg:justify-start">
                        <div className="px-2 py-0.5 rounded-md bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" />
                            Patrimonio Protegido
                        </div>
                    </div>
                </div>

                {/* Pro Progress Visualizers */}
                <div className="space-y-4 flex-1">
                    <div className="relative group/bar">
                        <div className="flex justify-between items-end mb-1.5 px-1">
                            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">IVA (303)</span>
                            <span className="text-xs font-black text-slate-900 dark:text-white tracking-tight">{formatMoney(ivaAPagar)}€</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden p-0.5">
                            <div
                                className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(79,70,229,0.3)]"
                                style={{ width: `${Math.min((ivaAPagar / totalTax) * 100, 100)}%` } as CSSProperties}
                            />
                        </div>
                    </div>

                    <div className="relative group/bar">
                        <div className="flex justify-between items-end mb-1.5 px-1">
                            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">IRPF (130)</span>
                            <span className="text-xs font-black text-slate-900 dark:text-white tracking-tight">{formatMoney(irpfPago)}€</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden p-0.5">
                            <div
                                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                                style={{ width: `${Math.min((irpfPago / totalTax) * 100, 100)}%` } as CSSProperties}
                            />
                        </div>
                    </div>
                </div>

                {/* Banker's Advice Note */}
                <div className="mt-6 p-3 rounded-2xl bg-white/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                        <TrendingUp className="w-4 h-4 text-indigo-500" />
                    </div>
                    <p className="text-[10px] leading-tight text-slate-500 dark:text-slate-400 font-bold uppercase tracking-tight">
                        Fondo de seguridad recomendado para el trimestre en curso.
                    </p>
                </div>
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
        </Card>
    );
};

export default TaxVaultWidget;
