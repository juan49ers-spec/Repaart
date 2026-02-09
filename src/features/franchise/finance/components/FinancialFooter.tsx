import React from 'react';

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
        <div className="h-16 bg-white dark:bg-slate-900 flex items-center justify-end px-6 gap-3 shrink-0 z-20 border-t border-slate-100 dark:border-slate-800">
            {step > 1 && (
                <button
                    onClick={() => setStep((step - 1) as 1 | 2 | 3)}
                    className="mr-auto px-4 py-2 rounded-lg text-xs font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center gap-2"
                >
                    ← Atrás
                </button>
            )}

            {!isLocked && (
                <button
                    onClick={onSaveDraft}
                    className="px-4 py-2 rounded-lg text-xs font-bold text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition-all"
                >
                    Guardar Borrador
                </button>
            )}

            {step < 3 ? (
                <button
                    onClick={() => setStep((step + 1) as 1 | 2 | 3)}
                    className="px-6 py-2 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md transition-all flex items-center gap-2"
                >
                    Siguiente →
                </button>
            ) : (
                <button
                    onClick={() => isLocked ? onClose() : onConfirm()}
                    disabled={saving}
                    className={`
                        px-6 py-2 rounded-lg text-xs font-bold text-white shadow-md transition-all flex items-center gap-2
                        ${isLocked ? 'bg-slate-800 hover:bg-slate-700' : 'bg-emerald-600 hover:bg-emerald-700'}
                    `}
                >
                    {saving ? '...' : isLocked ? 'Cerrar' : 'Confirmar Cierre'}
                </button>
            )}
        </div>
    );
};
