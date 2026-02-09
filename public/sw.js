/**
 * Service Worker para Push Notifications
 * 
 * Este archivo debe estar en la carpeta public/
 * y registrarse en el main.tsx
 */

// Nombre del cache
const CACHE_NAME = 'repaart-v1';

// URLs a cachear
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/pwa-192x192.png',
  '/pwa-512x512.png'
];

// Instalación - cachear recursos estáticos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Cache opened');
        return cache.addAll(urlsToCache);
      })
      .catch((err) => {
        console.error('[SW] Cache failed:', err);
      })
  );
  self.skipWaiting();
});

// Activación - limpiar caches antiguos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch - estrategia cache-first para recursos estáticos
self.addEventListener('fetch', (event) => {
  // No interceptar requests de API o analytics
  if (event.request.url.includes('/api/') || 
      event.request.url.includes('google-analytics') ||
      event.request.url.includes('firebase')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

// ============================================
// PUSH NOTIFICATIONS
// ============================================

self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event);

  let data = {};
  try {
    data = event.data?.json() || {};
  } catch (e) {
    data = {
      title: 'Nueva notificación',
      body: event.data?.text() || 'Tienes una nueva notificación'
    };
  }

  const options = {
    body: data.body || 'Tienes una nueva notificación',
    icon: data.icon || '/pwa-192x192.png',
    badge: data.badge || '/pwa-64x64.png',
    image: data.image,
    tag: data.tag || 'default',
    requireInteraction: data.requireInteraction || false,
    actions: data.actions || [],
    data: {
      url: data.url || '/',
      ...data.data
    }
  };

  event.waitUntil(
    self.registration.showNotification(
      data.title || 'Repaart',
      options
    )
  );
});

// Click en notificación
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click:', event);

  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Si ya hay una ventana abierta, enfocarla
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // Si no, abrir nueva ventana
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
  );
});

// Cerrar notificación
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed:', event);
});

// ============================================
// BACKGROUND SYNC
// ============================================

self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);

  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  try {
    // Obtener datos pendientes de IndexedDB
    const db = await openDB('repaart-sync', 1);
    const pendingData = await db.getAll('pending');

    for (const item of pendingData) {
      try {
        await fetch(item.url, {
          method: item.method || 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(item.data)
        });
        
        // Eliminar de pendientes si fue exitoso
        await db.delete('pending', item.id);
      } catch (error) {
        console.error('[SW] Sync failed for item:', item.id, error);
      }
    }
  } catch (error) {
    console.error('[SW] Background sync error:', error);
  }
}

// Helper para IndexedDB
function openDB(name, version) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, version);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pending')) {
        db.createObjectStore('pending', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}
