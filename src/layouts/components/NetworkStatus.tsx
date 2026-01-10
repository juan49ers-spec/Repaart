import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

const NetworkStatus: React.FC = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (isOnline) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-[60] bg-rose-500 text-white text-xs font-bold py-1 px-4 text-center animate-slide-down flex items-center justify-center gap-2">
            <WifiOff className="w-3 h-3" />
            <span>Sin conexión a internet. Los cambios no se guardarán.</span>
        </div>
    );
};

export default NetworkStatus;
