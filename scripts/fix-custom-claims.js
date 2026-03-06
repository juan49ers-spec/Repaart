/**
 * Script para actualizar el documento del usuario en Firestore
 * Esto activará el trigger onUserWrite que sincroniza los custom claims
 *
 * Uso: node scripts/fix-custom-claims.js
 */

const admin = require('firebase-admin');

// Inicializar Firebase Admin
const serviceAccount = require('./firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function fixCustomClaims() {
  const userId = 'oVRUt28thDYs2UvSeMAitUdfynG3';
  const role = 'franchise';
  const franchiseId = 'F-0004';

  console.log('🔧 Actualizando documento en Firestore...');
  console.log(`Usuario: ${userId}`);
  console.log(`Role: ${role}`);
  console.log(`FranchiseId: ${franchiseId}`);
  console.log('');

  try {
    const userRef = db.collection('users').doc(userId);

    // Actualizar el documento (esto activará el trigger onUserWrite)
    await userRef.update({
      role: role,
      franchiseId: franchiseId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log('✅ Documento actualizado exitosamente');
    console.log('📡 El trigger onUserWrite sincronizará los custom claims automáticamente');
    console.log('');
    console.log('⚠️ IMPORTANTE: Ahora debes:');
    console.log('1. Haz logout en la aplicación');
    console.log('2. Vuelve a hacer login');
    console.log('3. Los custom claims estarán actualizados');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error actualizando el documento:', error);
    process.exit(1);
  }
}

fixCustomClaims();
