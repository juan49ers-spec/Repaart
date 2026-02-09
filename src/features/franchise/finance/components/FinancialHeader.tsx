import React from 'react';
import { X, Activity } from 'lucide-react';

interface FinancialHeaderProps {
    month: string;
    step: number;
    setStep: (step: 1 | 2 | 3) => void;
    onClose: () => void;
    isLocked: boolean;
}

export const FinancialHeader: React.FC<FinancialHeaderProps> = ({ month, step, setStep, onClose, isLocked }) => {
    return (
        <div className="h-14 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md flex items-center justify-between px-6 shrink-0 relative z-20 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
                <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg shadow-sm text-white">
                    <Activity className="w-4 h-4" strokeWidth={2} />
                </div>
                <div>
                    <h1 className="text-base font-bold text-slate-900 dark:text-white tracking-tight leading-none">Cierre Financiero</h1>
                    <p className="text-[10px] text-slate-500 font-bold tracking-wide mt-0.5 opacity-80">PERIODO: {month.toUpperCase()}</p>
                </div>
            </div>

            {/* Stepper Integrado en Header */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-lg" role="tablist">
                <button
                    role="tab"
                    aria-selected={step === 1 ? "true" : "false"}
                    aria-controls={step === 1 ? "panel-revenue" : undefined}
                    onClick={() => !isLocked && setStep(1)}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${step === 1 ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    1. Ingresos
                </button>
                <button
                    role="tab"
                    aria-selected={step === 2 ? "true" : "false"}
                    aria-controls={step === 2 ? "panel-expenses" : undefined}
                    onClick={() => !isLocked && setStep(2)}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${step === 2 ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    2. Gastos
                </button>
                {/* NEW STEP 3 */}
                <button
                    role="tab"
                    aria-selected={step === 3 ? "true" : "false"}
                    aria-controls={step === 3 ? "panel-review" : undefined}
                    onClick={() => !isLocked && setStep(3)}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${step === 3 ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    3. Revisión
                </button>
            </div>

            <button onClick={onClose} aria-label="Cerrar" className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-400">
                <X className="w-4 h-4" strokeWidth={2.5} />
            </button>
        </div>
    );
};
