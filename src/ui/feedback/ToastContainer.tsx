import { type FC } from 'react';
import Toast from './Toast';

// Redefining types here to avoid circular dep issues if Toast types aren't exported,
// but ideally we should import them. Assuming basic structure for now.
type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastData {
    id: string;
    message: string;
    type?: ToastType;
    duration?: number;
}

interface ToastContainerProps {
    toasts: ToastData[];
    removeToast: (id: string) => void;
}

const ToastContainer: FC<ToastContainerProps> = ({ toasts, removeToast }) => {
    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
            {toasts.map((toast) => (
                <Toast key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />
            ))}
        </div>
    );
};

export default ToastContainer;
