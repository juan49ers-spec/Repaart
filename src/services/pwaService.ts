/**
 * PWA Service Worker Handler
 *
 * vite-plugin-pwa maneja el registro del SW automáticamente.
 * Este módulo expone utilidades de conectividad, notificaciones y estado.
 */

/**
 * registerServiceWorker ya NO registra manualmente.
 * vite-plugin-pwa (registerType: 'autoUpdate') lo hace por nosotros.
 * Mantenemos la función por compatibilidad con main.tsx PWAWrapper.
 */
export const registerServiceWorker = async () => {
    console.log('[PWA] Service Worker managed by vite-plugin-pwa (autoUpdate)');
    return null;
};

export const unregisterServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
            await registration.unregister();
            console.log('[PWA] Service worker unregistered:', registration);
        }
    }
};

export const checkForUpdates = async () => {
    if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
            await registration.update();
            console.log('[PWA] Checked for service worker updates');
        }
    }
};


export const requestNotificationPermission = async () => {
    if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            console.log('[PWA] Notification permission granted');
        } else {
            console.log('[PWA] Notification permission denied:', permission);
        }
        return permission;
    }
    return 'denied';
};

export const isOnline = () => {
    return navigator.onLine;
};

export const isOffline = () => {
    return !navigator.onLine;
};

export const onOnline = (callback: () => void) => {
    window.addEventListener('online', callback);
    return () => window.removeEventListener('online', callback);
};

export const onOffline = (callback: () => void) => {
    window.addEventListener('offline', callback);
    return () => window.removeEventListener('offline', callback);
};

export const checkConnectivity = () => {
    const handleOnline = () => {
        console.log('[PWA] Device is online');
        document.body.classList.remove('offline');
    };

    const handleOffline = () => {
        console.log('[PWA] Device is offline');
        document.body.classList.add('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return {
        cleanup: () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        }
    };
};

// Install prompt ahora gestionado por el componente InstallPrompt.tsx
// Se mantienen las funciones como no-ops por compatibilidad
export const getInstallPrompt = async () => ({
    prompt: async () => false,
    canPrompt: () => false
});

export const dismissInstallPrompt = () => {};

export const showOfflineBanner = () => {
    if (isOffline()) {
        const banner = document.createElement('div');
        banner.id = 'offline-banner';
        banner.className = 'fixed bottom-0 left-0 right-0 bg-amber-500 text-white p-4 text-center z-50';
        banner.innerHTML = `
            <p class="font-medium">
                <span class="inline-block w-4 h-4 bg-white rounded-full mr-2"></span>
                No estás conectado a internet. Algunas funciones pueden no estar disponibles.
            </p>
        `;
        document.body.appendChild(banner);
        setTimeout(() => {
            banner.remove();
        }, 5000);
    }
};

export const hideOfflineBanner = () => {
    const banner = document.getElementById('offline-banner');
    if (banner) {
        banner.remove();
    }
};

export const PWA_STATUS = {
    REGISTERED: 'registered',
    UNREGISTERED: 'unregistered',
    UPDATING: 'updating',
    UPDATED: 'updated',
    OFFLINE: 'offline',
    ONLINE: 'online'
};

export const getPWAStatus = (): string => {
    if (isOffline()) return PWA_STATUS.OFFLINE;
    return PWA_STATUS.ONLINE;
};

export default {
    registerServiceWorker,
    unregisterServiceWorker,
    checkForUpdates,
    requestNotificationPermission,
    isOnline,
    isOffline,
    onOnline,
    onOffline,
    checkConnectivity,
    getInstallPrompt,
    dismissInstallPrompt,
    showOfflineBanner,
    hideOfflineBanner,
    getPWAStatus,
    PWA_STATUS
};