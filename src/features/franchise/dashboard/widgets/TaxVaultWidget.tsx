import { type FC, type CSSProperties } from 'react';
import { ShieldCheck, Lock } from 'lucide-react';
import { formatMoney } from '../../../../lib/finance';

interface TaxData {
    ivaAPagar: number;
    irpfPago: number;
}

interface TaxVaultWidgetProps {
    taxes: TaxData | null;
}

const TaxVaultWidget: FC<TaxVaultWidgetProps> = ({ taxes }) => {
    if (!taxes) return null;

    const { ivaAPagar, irpfPago } = taxes;
    const totalTax = ivaAPagar + irpfPago;

    // Simulate a "Safe" percentage (e.g., assuming we want to have 20% buffer)
    const safeTotal = totalTax * 1.0;

    return (
        <div className="glass-panel rounded-ios-xl p-5 relative overflow-hidden group">
            {/* Ambient Background */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400/10 dark:bg-emerald-400/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-400/5 dark:bg-indigo-400/3 rounded-full blur-2xl -ml-24 -mb-24 pointer-events-none" />

            <div className="relative z-10">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-gradient-to-br from-emerald-100 to-teal-50 dark:from-emerald-950/50 dark:to-teal-950/50 rounded-xl shadow-sm border border-emerald-100 dark:border-emerald-900">
                            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 dark:text-white text-base tracking-tight">
                                Hucha de Impuestos
                            </h3>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Recomendación de ahorro</p>
                        </div>
                    </div>
                </div>

                {/* Main Vault Value */}
                <div className="mb-4">
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight tabular-nums">
                            {formatMoney(safeTotal)}
                        </span>
                        <span className="text-2xl font-bold text-slate-400 dark:text-slate-500">€</span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                            <Lock className="w-3 h-3" />
                            Ahorro Sugerido
                        </span>
                    </div>
                </div>

                {/* Progress Visualizer */}
                <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-white/50 dark:bg-white/5 border border-white/60 dark:border-white/10 shadow-sm backdrop-blur-md">
                        <div className="flex justify-between items-end mb-1.5">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-indigo-500 dark:bg-indigo-400" />
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">IVA Acumulado</span>
                            </div>
                            <span className="text-sm font-bold text-slate-800 dark:text-white tabular-nums">{formatMoney(ivaAPagar)}€</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                            <div
                                className="h-full bg-indigo-500 dark:bg-indigo-400 rounded-full transition-all duration-1000 ease-out"
                                 
                                style={{ width: `${Math.min((ivaAPagar / totalTax) * 100, 100)}%` } as CSSProperties}
                            />
                        </div>
                    </div>

                    <div className="p-3 rounded-xl bg-white/50 dark:bg-white/5 border border-white/60 dark:border-white/10 shadow-sm backdrop-blur-md">
                        <div className="flex justify-between items-end mb-1.5">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-amber-500 dark:bg-amber-400" />
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">IRPF Acumulado</span>
                            </div>
                            <span className="text-sm font-bold text-slate-800 dark:text-white tabular-nums">{formatMoney(irpfPago)}€</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                            <div
                                className="h-full bg-amber-500 dark:bg-amber-400 rounded-full transition-all duration-1000 ease-out"
                                 
                                style={{ width: `${Math.min((irpfPago / totalTax) * 100, 100)}%` } as CSSProperties}
                            />
                        </div>
                    </div>
                </div>

                {/* Bottom Note */}
                <div className="mt-4 pt-3 border-t border-slate-100/60 dark:border-slate-700/60">
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center text-balance leading-relaxed font-medium">
                        Este dinero no es tuyo. Guárdalo mensualmente para evitar sorpresas en el trimestre.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default TaxVaultWidget;
