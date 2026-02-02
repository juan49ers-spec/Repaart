/**
 * Servicio de Push Notifications - Backend
 * 
 * Este archivo es para el backend (Node.js/Firebase Functions)
 * Para enviar notificaciones push a los usuarios
 * 
 * Instalación:
 * npm install web-push
 * 
 * Configuración:
 * 1. Generar VAPID keys: npx web-push generate-vapid-keys
 * 2. Guardar en variables de entorno
 * 3. Usar este servicio para enviar notificaciones
 */

// Ejemplo de implementación con Firebase Functions
// Este código va en tu backend (functions/src/index.ts)

/*
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import webpush from 'web-push';

// Configurar VAPID
const vapidKeys = {
  publicKey: functions.config().vapid.public_key,
  privateKey: functions.config().vapid.private_key
};

webpush.setVapidDetails(
  'mailto:admin@repaart.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// Guardar suscripción en Firestore
export const subscribeToPush = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  const { subscription } = data;
  const userId = context.auth.uid;

  await admin.firestore().collection('pushSubscriptions').doc(userId).set({
    subscription,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return { success: true };
});

// Eliminar suscripción
export const unsubscribeFromPush = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  const userId = context.auth.uid;
  await admin.firestore().collection('pushSubscriptions').doc(userId).delete();

  return { success: true };
});

// Enviar notificación a un usuario
export const sendPushNotification = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  const { userId, title, body, data: payloadData } = data;

  // Obtener suscripción del usuario
  const subDoc = await admin.firestore().collection('pushSubscriptions').doc(userId).get();
  
  if (!subDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'User not subscribed');
  }

  const { subscription } = subDoc.data();

  const notificationPayload = {
    notification: {
      title,
      body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-64x64.png',
      data: payloadData,
      requireInteraction: true,
      actions: [
        { action: 'open', title: 'Abrir' },
        { action: 'close', title: 'Cerrar' }
      ]
    }
  };

  try {
    await webpush.sendNotification(subscription, JSON.stringify(notificationPayload));
    return { success: true };
  } catch (error) {
    console.error('Push notification failed:', error);
    
    // Si falla, eliminar suscripción inválida
    if (error.statusCode === 410) {
      await admin.firestore().collection('pushSubscriptions').doc(userId).delete();
    }
    
    throw new functions.https.HttpsError('internal', 'Failed to send notification');
  }
});

// Enviar notificación masiva (ej: anuncios)
export const sendBulkPushNotification = functions.https.onCall(async (data, context) => {
  if (!context.auth?.token?.admin) {
    throw new functions.https.HttpsError('permission-denied', 'Admin only');
  }

  const { title, body, target = 'all' } = data;

  // Obtener todas las suscripciones
  const subscriptions = await admin.firestore().collection('pushSubscriptions').get();
  
  const results = {
    success: 0,
    failed: 0
  };

  const notificationPayload = {
    notification: {
      title,
      body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-64x64.png',
      requireInteraction: true
    }
  };

  // Enviar en batches
  const batch = [];
  subscriptions.forEach((doc) => {
    const { subscription } = doc.data();
    
    batch.push(
      webpush.sendNotification(subscription, JSON.stringify(notificationPayload))
        .then(() => { results.success++; })
        .catch(async (error) => {
          console.error('Push failed for', doc.id, error);
          results.failed++;
          
          // Eliminar suscripciones inválidas
          if (error.statusCode === 410) {
            await doc.ref.delete();
          }
        })
    );
  });

  await Promise.all(batch);

  return results;
});

// Trigger: Enviar notificación cuando se crea un ticket de soporte
export const onSupportTicketCreated = functions.firestore
  .document('tickets/{ticketId}')
  .onCreate(async (snap, context) => {
    const ticket = snap.data();
    
    // Notificar a admins
    const admins = await admin.firestore()
      .collection('users')
      .where('role', '==', 'admin')
      .get();

    const notificationPromises = [];

    admins.forEach(async (adminDoc) => {
      const subDoc = await admin.firestore()
        .collection('pushSubscriptions')
        .doc(adminDoc.id)
        .get();

      if (subDoc.exists) {
        const { subscription } = subDoc.data();
        
        notificationPromises.push(
          webpush.sendNotification(subscription, JSON.stringify({
            notification: {
              title: 'Nuevo ticket de soporte',
              body: `${ticket.subject} - ${ticket.userName}`,
              icon: '/pwa-192x192.png',
              badge: '/pwa-64x64.png',
              data: {
                url: `/admin/support/${context.params.ticketId}`,
                ticketId: context.params.ticketId
              }
            }
          })).catch(console.error)
        );
      }
    });

    await Promise.all(notificationPromises);
  });

// Trigger: Notificación de cierre de mes financiero
export const onMonthClosed = functions.firestore
  .document('finance_closures/{closureId}')
  .onCreate(async (snap, context) => {
    const closure = snap.data();
    
    // Notificar a la franquicia
    const subDoc = await admin.firestore()
      .collection('pushSubscriptions')
      .doc(closure.franchiseId)
      .get();

    if (subDoc.exists) {
      const { subscription } = subDoc.data();
      
      await webpush.sendNotification(subscription, JSON.stringify({
        notification: {
          title: 'Cierre de mes completado',
          body: `El cierre de ${closure.month} ha sido procesado`,
          icon: '/pwa-192x192.png',
          badge: '/pwa-64x64.png',
          data: {
            url: `/finance/closures/${context.params.closureId}`,
            closureId: context.params.closureId
          }
        }
      })).catch(console.error);
    }
  });
*/

// ============================================
// INSTRUCCIONES DE CONFIGURACIÓN
// ============================================

/*
1. INSTALAR DEPENDENCIAS:
   cd functions
   npm install web-push

2. CONFIGURAR VAPID KEYS:
   npx web-push generate-vapid-keys
   
   O manualmente:
   - Ir a https://web-push-codelab.glitch.me/
   - Copiar las keys generadas

3. CONFIGURAR FIREBASE:
   firebase functions:config:set vapid.public_key="TU_PUBLIC_KEY"
   firebase functions:config:set vapid.private_key="TU_PRIVATE_KEY"

4. DESPLEGAR:
   firebase deploy --only functions

5. ACTUALIZAR FRONTEND:
   - Copiar la public key a .env
   - VITE_VAPID_PUBLIC_KEY=TU_PUBLIC_KEY
*/

export default {};
