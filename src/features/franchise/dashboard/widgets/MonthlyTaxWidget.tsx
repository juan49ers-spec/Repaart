import React, { type FC } from 'react';
import { Receipt } from 'lucide-react';
import { formatMoney } from '../../../../lib/finance';

interface TaxData {
    ivaAPagar: number;
    irpfPago: number;
}

interface MonthlyTaxWidgetProps {
    taxes: TaxData | null;
}

const MonthlyTaxWidget: FC<MonthlyTaxWidgetProps> = ({ taxes }) => {
    if (!taxes) return null;

    const { ivaAPagar, irpfPago } = taxes;

    return (
        <div className="glass-panel rounded-ios-xl p-6 relative overflow-hidden group h-full">

            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-400/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none transition-all duration-700 group-hover:scale-150 group-hover:bg-indigo-400/20" />

            {/* Header */}
            <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-br from-indigo-50 to-white rounded-xl shadow-sm border border-indigo-50">
                        <Receipt className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 text-sm md:text-base tracking-tight">
                            Previsión de Impuestos
                        </h3>
                        <p className="text-xs text-slate-500 font-medium">Estimación mes actual</p>
                    </div>
                </div>
            </div>


            {/* IVA & IRPF Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                {/* IVA */}
                <div className="relative group/item">
                    <div className="absolute inset-0 bg-indigo-500/5 rounded-2xl blur-sm transition-opacity opacity-0 group-hover/item:opacity-100" />
                    <div className="relative bg-white/60 backdrop-blur-md rounded-2xl p-4 border border-white/80 shadow-sm hover:shadow-md transition-all duration-300">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">IVA (21%)</span>
                            </div>
                        </div>
                        <p className="text-2xl font-black text-slate-800 tracking-tight truncate" title={formatMoney(ivaAPagar)}>{formatMoney(ivaAPagar)}€</p>
                        <p className="text-[10px] text-slate-400 mt-1 font-medium">
                            Impuesto sobre valor añadido
                        </p>
                    </div>
                </div>

                {/* IRPF */}
                <div className="relative group/item">
                    <div className="absolute inset-0 bg-amber-500/5 rounded-2xl blur-sm transition-opacity opacity-0 group-hover/item:opacity-100" />
                    <div className="relative bg-white/60 backdrop-blur-md rounded-2xl p-4 border border-white/80 shadow-sm hover:shadow-md transition-all duration-300">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">IRPF (20%)</span>
                            </div>
                        </div>
                        <p className="text-2xl font-black text-slate-800 tracking-tight truncate" title={formatMoney(irpfPago)}>{formatMoney(irpfPago)}€</p>
                        <p className="text-[10px] text-slate-400 mt-1 font-medium">
                            Retención a cuenta
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default React.memo(MonthlyTaxWidget);
