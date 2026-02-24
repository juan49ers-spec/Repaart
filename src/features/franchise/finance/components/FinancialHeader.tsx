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

const steps = [
    { id: 1 as const, label: 'Ingresos' },
    { id: 2 as const, label: 'Gastos' },
    { id: 3 as const, label: 'Revisión' },
];

export const FinancialHeader: React.FC<FinancialHeaderProps> = ({ month, step, setStep, onClose, isLocked, onOpenGuide }) => {
    return (
        <div className="h-16 bg-white dark:bg-slate-900 flex items-center justify-between px-5 lg:px-6 shrink-0 relative z-20 border-b border-slate-200/50 dark:border-white/5">
            {/* Left: Title */}
            <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-600 rounded-lg text-white">
                    <Activity className="w-4 h-4" strokeWidth={2.5} />
                </div>
                <div>
                    <h1 className="text-sm font-black text-slate-800 dark:text-white tracking-tight leading-none">Cierre Financiero</h1>
                    <p className="text-[10px] text-slate-400 font-bold tracking-wider uppercase mt-0.5">{month}</p>
                </div>
            </div>

            {/* Center: Stepper */}
            <div className="hidden sm:flex items-center gap-1" role="tablist">
                {steps.map((s, idx) => {
                    const isActive = step === s.id;
                    const isReview = s.id === 3;
                    const activeColor = isReview ? 'border-emerald-500 text-emerald-600' : 'border-indigo-600 text-indigo-600';
                    const activeBg = isReview ? 'bg-emerald-500' : 'bg-indigo-600';

                    return (
                        <React.Fragment key={s.id}>
                            {idx > 0 && <div className="w-6 h-px bg-slate-200 dark:bg-slate-700 hidden lg:block" />}
                            <button
                                role="tab"
                                aria-selected={isActive ? 'true' : 'false'}
                                onClick={() => !isLocked && setStep(s.id)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 border-b-2 transition-all text-[10px] font-bold uppercase tracking-wider ${isActive ? activeColor : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                                    }`}
                            >
                                <span className={`w-[18px] h-[18px] flex items-center justify-center rounded-full text-[9px] font-bold ${isActive ? `${activeBg} text-white` : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                    }`}>
                                    {s.id}
                                </span>
                                <span className="hidden md:inline">{s.label}</span>
                            </button>
                        </React.Fragment>
                    );
                })}
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
                {onOpenGuide && (
                    <button
                        onClick={onOpenGuide}
                        className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border border-slate-200/50 dark:border-slate-700"
                    >
                        Guía
                    </button>
                )}
                <button
                    onClick={onClose}
                    aria-label="Cerrar"
                    className="p-2 bg-slate-50 dark:bg-slate-800 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-900/30 rounded-lg transition-all text-slate-400 border border-slate-200/50 dark:border-slate-700"
                >
                    <X className="w-4 h-4" strokeWidth={2.5} />
                </button>
            </div>
        </div>
    );
};
