import { useEffect, useState } from 'react';
import { useToast } from './useToast';

interface RemoteVersionData {
    version: string;
    buildTime: number;
}

// Extend Window interface to include __BUILD_TIME__
declare global {
    interface Window {
        __BUILD_TIME__?: number;
    }
}

export const useVersionCheck = (checkInterval: number = 60000 * 5) => { // Check every 5 minutes
    const [updateAvailable, setUpdateAvailable] = useState<boolean>(false);
    const toastReturn = useToast();
    const toast = toastReturn?.toast;

    useEffect(() => {
        const checkVersion = async () => {
            try {
                // Bypass cache with timestamp
                const response = await fetch(`/version.json?t=${Date.now()}`);
                if (!response.ok) return;

                const remoteVersionData: RemoteVersionData = await response.json();

                // Read local version from meta tag or just compare with what we loaded initially
                // For simplicity, we'll store the initial load time version in a var
                const localBuildTime = window.__BUILD_TIME__;

                // If we don't have a local build time (first load), set it
                if (!localBuildTime) {
                    window.__BUILD_TIME__ = remoteVersionData.buildTime;
                    return;
                }

                if (remoteVersionData.buildTime > localBuildTime) {
                    console.log("🚀 New version detected:", remoteVersionData.version);
                    setUpdateAvailable(true);

                    toast?.info("Nueva versión disponible. Recarga para actualizar.");
                }
            } catch (error) {
                console.error("Error checking version:", error);
            }
        };

        // Initial check
        checkVersion();

        // Periodic check
        const interval = setInterval(checkVersion, checkInterval);

        // Check on window focus (user comes back to tab)
        const onFocus = () => checkVersion();
        window.addEventListener('focus', onFocus);

        return () => {
            clearInterval(interval);
            window.removeEventListener('focus', onFocus);
        };
    }, [checkInterval, toast]);

    return { updateAvailable };
};
