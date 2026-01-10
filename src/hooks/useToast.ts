import { useContext } from 'react';
import { ToastContext } from '../context/contexts';

interface ToastAPI {
    success: (msg: string) => void;
    error: (msg: string) => void;
    info: (msg: string) => void;
    warning: (msg: string) => void;
}

interface UseToastReturn {
    toast: ToastAPI;
}

export const useToast = (): UseToastReturn | null => {
    const context = useContext(ToastContext);
    if (!context) return null; // Safe fallback

    // Adapter for user's preferred API: const { toast } = useToast(); toast.success()
    return {
        toast: {
            success: (msg: string) => context.addToast(msg, 'success'),
            error: (msg: string) => context.addToast(msg, 'error'),
            info: (msg: string) => context.addToast(msg, 'info'),
            warning: (msg: string) => context.addToast(msg, 'warning')
        }
    };
};
