import { type FC } from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-800/50">
                    <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                        {isDestructive && <AlertTriangle className="w-5 h-5 text-red-500" />}
                        {title}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    <p className="text-slate-300 text-sm leading-relaxed">
                        {message}
                    </p>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-4 bg-slate-950/50 border-t border-slate-800">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={`px-4 py-2 text-sm font-medium text-white rounded-lg shadow-lg transition-all ${isDestructive
                            ? 'bg-red-600 hover:bg-red-500 hover:shadow-red-500/20'
                            : 'bg-blue-600 hover:bg-blue-500 hover:shadow-blue-500/20'
                            }`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
