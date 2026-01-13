import { useEffect } from 'react';

// Defined in vite.config.js
declare const __APP_VERSION__: string;

export const useVersionCheck = (checkInterval: number = 60000) => { // Check every 1 minute
    useEffect(() => {
        const checkVersion = async () => {
            try {
                // Bypass cache with timestamp
                const response = await fetch(`/version.json?t=${Date.now()}`);
                if (!response.ok) return;

                const data = await response.json();
                const remoteVersion = data.version;

                // __APP_VERSION__ is injected by Vite at build time
                if (remoteVersion && remoteVersion !== __APP_VERSION__) {
                    console.info(`[AutoUpdate] New version detected (Server: ${remoteVersion}, Local: ${__APP_VERSION__}). Updating...`);

                    // Clear any potential service worker caches to be safe
                    if ('serviceWorker' in navigator) {
                        const registrations = await navigator.serviceWorker.getRegistrations();
                        for (const registration of registrations) {
                            await registration.unregister();
                        }
                    }

                    // Force reload ignoring cache
                    window.location.reload();
                }
            } catch (error) {
                console.warn('[AutoUpdate] Failed to check version', error);
            }
        };

        // Initial check
        checkVersion();

        // Periodic check
        const interval = setInterval(checkVersion, checkInterval);

        // Check on window focus
        const onFocus = () => checkVersion();
        window.addEventListener('focus', onFocus);

        return () => {
            clearInterval(interval);
            window.removeEventListener('focus', onFocus);
        };
    }, [checkInterval]);

    return {};
};
