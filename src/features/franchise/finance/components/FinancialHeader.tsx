import React from 'react';
import { X, Activity } from 'lucide-react';

interface FinancialHeaderProps {
    month: string;
    step: number;
    setStep: (step: 1 | 2 | 3) => void;
    onClose: () => void;
    isLocked: boolean;
    onOpenGuide?: () => void;
}

export const FinancialHeader: React.FC<FinancialHeaderProps> = ({ month, step, setStep, onClose, isLocked, onOpenGuide }) => {
    return (
        <div className="h-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl flex items-center justify-between px-8 shrink-0 relative z-20 border-b border-slate-200/50 dark:border-white/5">
            <div className="flex items-center gap-4">
                <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-[0_4px_12px_rgba(99,102,241,0.2)] text-white">
                    <Activity className="w-5 h-5" strokeWidth={2.5} />
                </div>
                <div>
                    <h1 className="text-xl font-black text-slate-800 dark:text-white tracking-tight leading-none mb-1">Cierre Financiero</h1>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 font-bold tracking-[0.2em] uppercase">PERIODO: {month}</p>
                </div>
            </div>

            {/* Elegant Stepper Integrado en Header */}
            <div className="flex items-center gap-1 sm:gap-2 lg:gap-8" role="tablist">
                <button
                    role="tab"
                    aria-selected={step === 1}
                    aria-controls="panel-revenue"
                    onClick={() => !isLocked && setStep(1)}
                    className={`flex items-center gap-2 px-3 py-2 border-b-2 transition-all duration-300 font-bold tracking-widest uppercase text-[10px] sm:text-[11px] ${step === 1 ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                >
                    <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] ${step === 1 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}>1</span>
                    <span className="hidden sm:inline">Ingresos</span>
                </button>
                <div className="hidden lg:block w-8 h-px bg-slate-200 dark:bg-slate-700"></div>
                <button
                    role="tab"
                    aria-selected={step === 2}
                    aria-controls="panel-expenses"
                    onClick={() => !isLocked && setStep(2)}
                    className={`flex items-center gap-2 px-3 py-2 border-b-2 transition-all duration-300 font-bold tracking-widest uppercase text-[10px] sm:text-[11px] ${step === 2 ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                >
                    <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] ${step === 2 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}>2</span>
                    <span className="hidden sm:inline">Gastos</span>
                </button>
                <div className="hidden lg:block w-8 h-px bg-slate-200 dark:bg-slate-700"></div>
                <button
                    role="tab"
                    aria-selected={step === 3}
                    aria-controls="panel-review"
                    onClick={() => !isLocked && setStep(3)}
                    className={`flex items-center gap-2 px-3 py-2 border-b-2 transition-all duration-300 font-bold tracking-widest uppercase text-[10px] sm:text-[11px] ${step === 3 ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                >
                    <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] ${step === 3 ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}>3</span>
                    <span className="hidden sm:inline">Revisión</span>
                </button>
            </div>

            <div className="flex items-center gap-3">
                {onOpenGuide && (
                    <button
                        onClick={onOpenGuide}
                        className="flex items-center gap-1.5 px-4 py-2 bg-indigo-50/80 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors border border-indigo-100 dark:border-indigo-800/50"
                    >
                        <span>Guía</span>
                    </button>
                )}
                <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>
                <button onClick={onClose} aria-label="Cerrar" className="p-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/30 rounded-xl transition-all text-slate-400 border border-slate-200/50 dark:border-slate-700">
                    <X className="w-5 h-5" strokeWidth={2.5} />
                </button>
            </div>
        </div>
    );
};
