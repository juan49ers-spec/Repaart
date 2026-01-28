/**
 * PWA Service Worker Handler
 *
 * Manages service worker registration, updates, and offline functionality
 */

export const PWA_SERVICE_WORKER_URL = '/sw.js';
export const PWA_SERVICE_WORKER_ENABLED = import.meta.env.MODE === 'production';

export const registerServiceWorker = async () => {
    if ('serviceWorker' in navigator && PWA_SERVICE_WORKER_ENABLED) {
        try {
            const registration = await navigator.serviceWorker.register(PWA_SERVICE_WORKER_URL, {
                scope: '/',
                updateViaCache: 'none'
            });

            console.log('[PWA] Service worker registered:', registration);

            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                if (newWorker) {
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            console.log('[PWA] New service worker available, waiting to activate');
                            // Show update notification to user
                            showUpdateNotification();
                        }
                    });
                }
            });

            registration.addEventListener('controllerchange', () => {
                console.log('[PWA] Service worker controller changed, reloading page');
                window.location.reload();
            });

            // Check for updates periodically (every 30 minutes)
            setInterval(() => {
                registration.update();
            }, 30 * 60 * 1000);

            return registration;
        } catch (error) {
            console.error('[PWA] Service worker registration failed:', error);
        }
    }
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

const showUpdateNotification = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Nueva versión disponible', {
            body: 'Actualiza para obtener las últimas mejoras',
            icon: '/pwa-192x192.png',
            badge: '/pwa-64x64.png',
            tag: 'pwa-update',
            requireInteraction: true
        });
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

export const getInstallPrompt = async () => {
    let deferredPrompt: any;

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        console.log('[PWA] Install prompt captured');
    });

    return {
        prompt: async () => {
            if (!deferredPrompt) {
                console.warn('[PWA] No install prompt available');
                return false;
            }

            try {
                const result = await deferredPrompt.prompt();
                console.log('[PWA] Install prompt result:', result);

                if (result.outcome === 'accepted') {
                    deferredPrompt.userChoice.then((choiceResult: any) => {
                        if (choiceResult.outcome === 'accepted') {
                            console.log('[PWA] App installed');
                        }
                    });
                }

                deferredPrompt = null;
                return result.outcome === 'accepted';
            } catch (error) {
                console.error('[PWA] Install prompt error:', error);
                return false;
            }
        },
        canPrompt: () => !!deferredPrompt
    };
};

export const dismissInstallPrompt = () => {
    window.addEventListener('appinstalled', () => {
        console.log('[PWA] App installed');
        // Clear any stored install prompts
    });
};

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