import { useEffect, useState, type FC, type ReactNode } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
    message: string;
    type?: ToastType;
    duration?: number;
    onClose: () => void;
}

const icons: Record<ToastType, ReactNode> = {
    success: <CheckCircle className="w-5 h-5 text-emerald-500" />,
    error: <AlertCircle className="w-5 h-5 text-rose-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />
};

const styles: Record<ToastType, string> = {
    success: "border-emerald-200 bg-emerald-50/90 text-emerald-800",
    error: "border-rose-200 bg-rose-50/90 text-rose-800",
    warning: "border-amber-200 bg-amber-50/90 text-amber-800",
    info: "border-blue-200 bg-blue-50/90 text-blue-800"
};

const Toast: FC<ToastProps> = ({ message, type = 'info', duration = 4000, onClose }) => {
    const [isVisible, setIsVisible] = useState<boolean>(false);

    useEffect(() => {
        // Trigger enter animation
        requestAnimationFrame(() => setIsVisible(true));

        // Auto close timer
        const timer = setTimeout(() => {
            setIsVisible(false);
            // Wait for exit animation to finish before unmounting
            setTimeout(onClose, 300);
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const handleClose = (): void => {
        setIsVisible(false);
        setTimeout(onClose, 300);
    };

    return (
        <div
            className={`
                pointer-events-auto flex items-center w-full max-w-sm overflow-hidden rounded-xl border shadow-lg backdrop-blur-md transition-all duration-300 ease-in-out transform
                ${isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-8 opacity-0 scale-95'}
                ${styles[type] || styles.info}
            `}
            role="alert"
        >
            <div className="p-4 flex items-start gap-3 w-full">
                <div className="flex-shrink-0 mt-0.5">
                    {icons[type] || icons.info}
                </div>
                <div className="flex-1">
                    <p className="text-sm font-medium leading-5">
                        {message}
                    </p>
                </div>
                <div className="flex-shrink-0 ml-4">
                    <button
                        onClick={handleClose}
                        className="inline-flex text-current opacity-60 hover:opacity-100 focus:outline-none transition-opacity"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Toast;
