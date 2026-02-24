import React from 'react';
import { ArrowLeft, ArrowRight, Save, Lock, CheckCircle } from 'lucide-react';

interface FinancialFooterProps {
    step: number;
    setStep: (step: 1 | 2 | 3) => void;
    onClose: () => void;
    onSaveDraft: () => void;
    onConfirm: () => void;
    isLocked: boolean;
    saving: boolean;
}

export const FinancialFooter: React.FC<FinancialFooterProps> = ({
    step, setStep, onClose, onSaveDraft, onConfirm, isLocked, saving
}) => {
    return (
        <div className="h-14 bg-white dark:bg-slate-900 flex items-center justify-between px-5 lg:px-6 shrink-0 z-20 border-t border-slate-100 dark:border-slate-800">
            {/* Left: Back */}
            <div>
                {step > 1 && (
                    <button
                        onClick={() => setStep((step - 1) as 1 | 2 | 3)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Atrás
                    </button>
                )}
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
                {!isLocked && (
                    <button
                        onClick={onSaveDraft}
                        disabled={saving}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500 hover:text-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                    >
                        <Save className="w-3.5 h-3.5" />
                        Borrador
                    </button>
                )}

                {step < 3 ? (
                    <button
                        onClick={() => setStep((step + 1) as 1 | 2 | 3)}
                        className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all"
                    >
                        Siguiente
                        <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                ) : (
                    <button
                        onClick={() => isLocked ? onClose() : onConfirm()}
                        disabled={saving}
                        className={`flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-bold text-white shadow-sm transition-all ${isLocked
                                ? 'bg-slate-800 hover:bg-slate-700'
                                : 'bg-emerald-600 hover:bg-emerald-700'
                            }`}
                    >
                        {saving ? (
                            <>
                                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Guardando...
                            </>
                        ) : isLocked ? (
                            <>
                                <Lock className="w-3.5 h-3.5" />
                                Cerrar
                            </>
                        ) : (
                            <>
                                <CheckCircle className="w-3.5 h-3.5" />
                                Confirmar Cierre
                            </>
                        )}
                    </button>
                )}
            </div>
        </div>
    );
};
