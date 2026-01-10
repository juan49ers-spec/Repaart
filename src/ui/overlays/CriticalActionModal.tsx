import { useState, useEffect } from 'react';
import { AlertTriangle, X, Loader2 } from 'lucide-react';

export interface CriticalActionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmKeyword: string;
    isLoading?: boolean;
    confirmButtonText?: string;
    variant?: 'danger' | 'warning';
}

const CriticalActionModal: React.FC<CriticalActionModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmKeyword,
    isLoading = false,
    confirmButtonText = 'Confirmar',
    variant = 'danger' // 'danger' | 'warning'
}) => {
    const [input, setInput] = useState('');
    const [error, setError] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setInput('');
            setError(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (input !== confirmKeyword) {
            setError(true);
            return;
        }
        onConfirm();
    };

    const isMatch = input === confirmKeyword;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden border border-slate-200 scale-100 animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className={`p-6 border-b ${variant === 'danger' ? 'bg-rose-50 border-rose-100' : 'bg-amber-50 border-amber-100'} flex items-start gap-4`}>
                    <div className={`p-3 rounded-full shrink-0 ${variant === 'danger' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className={`text-lg font-black ${variant === 'danger' ? 'text-rose-900' : 'text-amber-900'}`}>
                            {title}
                        </h3>
                        <p className={`text-sm mt-1 font-medium ${variant === 'danger' ? 'text-rose-700' : 'text-amber-700'}`}>
                            {description}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="ml-auto text-slate-400 hover:text-slate-600 transition-colors"
                        disabled={isLoading}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">
                            Para confirmar, escribe <span className="font-mono text-slate-900 bg-slate-100 px-1 rounded select-all">{confirmKeyword}</span> abajo:
                        </label>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => {
                                setInput(e.target.value);
                                setError(false);
                            }}
                            placeholder={confirmKeyword}
                            className={`w-full px-4 py-2.5 rounded-xl border-2 font-medium focus:ring-0 outline-none transition-all ${error
                                ? 'border-rose-300 focus:border-rose-500 bg-rose-50 text-rose-900 placeholder-rose-300'
                                : 'border-slate-200 focus:border-blue-500 bg-white text-slate-900'
                                }`}
                            autoFocus
                            disabled={isLoading}
                        />
                        {error && (
                            <p className="text-xs font-bold text-rose-500 flex items-center gap-1 animate-pulse">
                                La confirmación no coincide. Inténtalo de nuevo.
                            </p>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-4 py-2 text-slate-600 font-bold text-sm hover:bg-slate-200 rounded-lg transition-colors border border-transparent"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!isMatch || isLoading}
                        className={`px-4 py-2 rounded-lg font-bold text-sm shadow-sm flex items-center gap-2 transition-all ${variant === 'danger'
                            ? 'bg-rose-600 hover:bg-rose-700 text-white disabled:bg-rose-300'
                            : 'bg-amber-500 hover:bg-amber-600 text-white disabled:bg-amber-300'
                            } disabled:cursor-not-allowed`}
                    >
                        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                        {confirmButtonText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CriticalActionModal;
