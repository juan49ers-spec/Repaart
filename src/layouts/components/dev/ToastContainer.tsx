import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
}

interface ToastContainerProps {
    toasts: Toast[];
    onDismiss: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
    return (
        <div className="fixed bottom-4 right-4 z-[9999] space-y-2 pointer-events-none">
            {toasts.map(toast => (
                <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
            ))}
        </div>
    );
};

interface ToastItemProps {
    toast: Toast;
    onDismiss: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onDismiss }) => {
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        const duration = toast.duration || 4000;

        const exitTimer = setTimeout(() => {
            setIsExiting(true);
        }, duration - 300);

        const dismissTimer = setTimeout(() => {
            onDismiss(toast.id);
        }, duration);

        return () => {
            clearTimeout(exitTimer);
            clearTimeout(dismissTimer);
        };
    }, [toast, onDismiss]);

    const iconMap = {
        success: <CheckCircle className="w-5 h-5 text-green-400" />,
        error: <XCircle className="w-5 h-5 text-red-400" />,
        warning: <AlertTriangle className="w-5 h-5 text-amber-400" />,
        info: <Info className="w-5 h-5 text-blue-400" />
    };

    const colorMap = {
        success: 'bg-green-500/10 border-green-500/30',
        error: 'bg-red-500/10 border-red-500/30',
        warning: 'bg-amber-500/10 border-amber-500/30',
        info: 'bg-blue-500/10 border-blue-500/30'
    };

    return (
        <div
            className={`
                pointer-events-auto
                bg-slate-900 border rounded-lg shadow-2xl p-4 min-w-[300px] max-w-md
                transition-all duration-300 transform
                ${isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}
                ${colorMap[toast.type]}
            `}
        >
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                    {iconMap[toast.type]}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">{toast.title}</p>
                    {toast.message && (
                        <p className="text-xs text-slate-400 mt-1">{toast.message}</p>
                    )}
                </div>
                <button
                    onClick={() => onDismiss(toast.id)}
                    className="flex-shrink-0 p-1 hover:bg-white/10 rounded transition-colors"
                >
                    <X className="w-4 h-4 text-slate-400" />
                </button>
            </div>
        </div>
    );
};

export default ToastContainer;

// Hook para usar el sistema de toasts
export function useToast() {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = (toast: Omit<Toast, 'id'>) => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts(prev => [...prev, { ...toast, id }]);
    };

    const dismissToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return {
        toasts,
        showToast,
        dismissToast,
        success: (title: string, message?: string) =>
            showToast({ type: 'success', title, message }),
        error: (title: string, message?: string) =>
            showToast({ type: 'error', title, message }),
        warning: (title: string, message?: string) =>
            showToast({ type: 'warning', title, message }),
        info: (title: string, message?: string) =>
            showToast({ type: 'info', title, message })
    };
}
