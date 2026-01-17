import { type FC, type ReactNode } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: ReactNode;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
    variant?: 'default' | 'warning' | 'danger';
}

const ConfirmationModal: FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Confirmar",
    cancelText = "Cancelar",
    isDestructive = false
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-sm transition-all animate-in fade-in duration-200">
            <div className="bg-white border border-white/20 rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden ring-1 ring-black/5 animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-8 pt-8 pb-4">
                    <h3 className={cn(
                        "text-lg font-semibold tracking-tight flex items-center gap-3",
                        isDestructive ? "text-rose-600" : "text-slate-800"
                    )}>
                        {isDestructive ? (
                            <div className="p-2 bg-rose-50 rounded-xl">
                                <AlertTriangle className="w-5 h-5 text-rose-500" />
                            </div>
                        ) : (
                            <div className="p-2 bg-indigo-50 rounded-xl">
                                <div className="w-5 h-5 bg-indigo-500 rounded-md shadow-sm" />
                            </div>
                        )}
                        {title}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-slate-300 hover:text-slate-900 p-2 rounded-full hover:bg-slate-50 transition-all"
                        title="Cerrar"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-8 pb-8 pt-2">
                    <p className="text-slate-500 text-sm leading-relaxed font-medium">
                        {message}
                    </p>
                </div>

                {/* Footer */}
                <div className="bg-slate-50/50 px-8 py-6 border-t border-slate-100 flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-all rounded-xl"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={cn(
                            "px-6 py-2.5 text-xs font-bold text-white uppercase tracking-widest rounded-xl shadow-lg transition-all active:scale-95",
                            isDestructive
                                ? "bg-rose-500 hover:bg-rose-600 shadow-rose-500/20"
                                : "bg-slate-900 hover:bg-slate-800 shadow-slate-900/20"
                        )}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
