import React, { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '../primitives/Button';

export const InstallPrompt: React.FC = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handler = (e: any) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            // Update UI notify the user they can install the PWA
            setIsVisible(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);

        // We've used the prompt, and can't use it again, throw it away
        setDeferredPrompt(null);
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 z-50 animate-in slide-in-from-bottom-5 fade-in duration-500">
            <div className="bg-slate-900 dark:bg-slate-800 text-white p-4 rounded-xl shadow-xl flex items-center justify-between gap-4 border border-slate-700/50">
                <div className="flex-1">
                    <h4 className="font-semibold text-sm">Instalar App</h4>
                    <p className="text-xs text-slate-400">Acceso rápido y sin conexión</p>
                </div>
                <Button
                    size="sm"
                    onClick={handleInstallClick}
                    className="bg-blue-600 hover:bg-blue-500 text-white border-none"
                    icon={<Download className="w-4 h-4" />}
                >
                    Instalar
                </Button>
                <button
                    onClick={() => setIsVisible(false)}
                    className="p-1 hover:bg-slate-800 rounded-full text-slate-400"
                >
                    ✕
                </button>
            </div>
        </div>
    );
};
