import { useState, useEffect, useCallback } from 'react';

/**
 * usePushNotifications - Hook para manejar push notifications
 * 
 * Usage:
 * ```tsx
 * const { 
 *   isSupported, 
 *   permission, 
 *   subscribe, 
 *   unsubscribe 
 * } = usePushNotifications();
 * 
 * // Suscribirse a notificaciones
 * await subscribe();
 * ```
 */
export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const existingSubscription = await registration.pushManager.getSubscription();
      setSubscription(existingSubscription);
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  useEffect(() => {
    // Verificar soporte
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setTimeout(() => {
        setIsSupported(true);

        // Obtener permiso actual
        if ('Notification' in window) {
          setPermission(Notification.permission);
        }

        // Verificar suscripción existente
        checkSubscription();
      }, 0);
    }
  }, []);

  const requestPermission = async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) return 'denied';

    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  };

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;

    try {
      // Solicitar permiso si es necesario
      if (permission !== 'granted') {
        const newPermission = await requestPermission();
        if (newPermission !== 'granted') return false;
      }

      // Obtener service worker
      const registration = await navigator.serviceWorker.ready;

      // Suscribirse a push
      const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';
      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKey ? urlBase64ToUint8Array(vapidKey) : undefined
      });

      setSubscription(newSubscription);

      // Enviar suscripción al servidor
      await sendSubscriptionToServer(newSubscription);

      return true;
    } catch (error) {
      console.error('Error subscribing to push:', error);
      return false;
    }
  }, [isSupported, permission]);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!subscription) return false;

    try {
      await subscription.unsubscribe();
      setSubscription(null);

      // Notificar al servidor
      await removeSubscriptionFromServer(subscription);

      return true;
    } catch (error) {
      console.error('Error unsubscribing:', error);
      return false;
    }
  }, [subscription]);

  const showNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (permission !== 'granted') return;

    navigator.serviceWorker.ready.then(registration => {
      registration.showNotification(title, {
        icon: '/pwa-192x192.png',
        badge: '/pwa-64x64.png',
        ...options
      });
    });
  }, [permission]);

  return {
    isSupported,
    permission,
    subscription,
    subscribe,
    unsubscribe,
    showNotification,
    requestPermission
  };
}

// Helper para convertir VAPID key
function urlBase64ToUint8Array(base64String: string): BufferSource {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray as BufferSource;
}

// Enviar suscripción al servidor
async function sendSubscriptionToServer(subscription: PushSubscription) {
  try {
    await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(subscription)
    });
  } catch (error) {
    console.error('Error sending subscription:', error);
  }
}

// Remover suscripción del servidor
async function removeSubscriptionFromServer(subscription: PushSubscription) {
  try {
    await fetch('/api/notifications/unsubscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ endpoint: subscription.endpoint })
    });
  } catch (error) {
    console.error('Error removing subscription:', error);
  }
}

export default usePushNotifications;
