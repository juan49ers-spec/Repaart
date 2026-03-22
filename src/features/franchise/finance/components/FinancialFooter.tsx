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
    status: string;
}

export const FinancialFooter: React.FC<FinancialFooterProps> = ({
    step, setStep, onClose, onSaveDraft, onConfirm, isLocked, saving, status
}) => {
    return (
        <div className="h-14 bg-white dark:bg-slate-900 flex items-center justify-between px-5 lg:px-6 shrink-0 z-20 border-t border-slate-100 dark:border-slate-800">
            {/* Left: Back */}
            <div>
                {step > 1 && (
                    <button
                        onClick={() => setStep((step - 1) as 1 | 2 | 3)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-all"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Atrás
                    </button>
                )}
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 relative">
                
                {/* Indicador Flotante de Estado (Justo encima del botón principal) */}
                <div className="absolute bottom-[calc(100%+14px)] right-0 bg-slate-800 dark:bg-slate-700 text-white rounded-lg shadow-xl shadow-slate-900/10 border border-slate-700/50 flex flex-col items-center px-3 py-2 pointer-events-none animate-in slide-in-from-bottom-2 fade-in whitespace-nowrap z-50 min-w-[160px]">
                    <span className="text-slate-400 text-[8px] uppercase tracking-widest font-bold mb-1">Estado del Mes</span>
                    <span className="font-bold text-xs flex items-center gap-1.5 pt-0.5">
                        {status === 'draft' && <><span className="w-2 h-2 rounded-full bg-yellow-400"></span> Borrador (Incompleto)</>}
                        {status === 'approved' && <><span className="w-2 h-2 rounded-full bg-emerald-400"></span> Aprobado</>}
                        {status === 'locked' && <><span className="w-2 h-2 rounded-full bg-slate-400"></span> Cerrado</>}
                        {(!status || status === 'open') && <><span className="w-2 h-2 rounded-full bg-indigo-400"></span> Abierto (Editando)</>}
                    </span>
                    <div className="absolute -bottom-1.5 right-6 w-3 h-3 bg-slate-800 dark:bg-slate-700 border-b border-r border-slate-700/50 rotate-45 transition-colors"></div>
                </div>

                {!isLocked && (
                    <button
                        onClick={onSaveDraft}
                        disabled={saving}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all border border-indigo-200 dark:border-indigo-500/30"
                        title="Guardar datos temporalmente sin finalizar el cierre"
                    >
                        {saving ? (
                            <span className="w-3.5 h-3.5 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
                        ) : (
                            <Save className="w-3.5 h-3.5" />
                        )}
                        Guardar Borrador
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
