import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';

// Guardar suscripción en Firestore
export const subscribeToPush = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  const { subscription } = data;
  const userId = context.auth.uid;

  await admin.firestore().collection('pushSubscriptions').doc(userId).set({
    subscription,
    userId,
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

  const { userId, title, body } = data;

  // Obtener suscripción del usuario
  const subDoc = await admin.firestore().collection('pushSubscriptions').doc(userId).get();
  
  if (!subDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'User not subscribed');
  }

  // Guardar notificación en Firestore
  await admin.firestore().collection('notifications').add({
    userId,
    title,
    body,
    type: 'push',
    read: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return { success: true, message: 'Notification saved' };
});
