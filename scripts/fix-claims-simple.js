/**
 * Script SIMPLE para actualizar el documento del usuario
 * Usa el SDK de Firebase del proyecto directamente
 *
 * Uso: node scripts/fix-claims-simple.js
 */

// Usar require para importar desde node_modules
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, updateDoc, serverTimestamp } = require('firebase/firestore');

// Configuración de Firebase (la misma que en src/lib/firebase.ts)
const firebaseConfig = {
  apiKey: "AIzaSyC0vTiufm9bWbzXzWwqy2sEuIZLNxYiVdg",
  authDomain: "repaartfinanzas.firebaseapp.com",
  projectId: "repaartfinanzas",
  storageBucket: "repaartfinanzas.firebasestorage.app",
  messagingSenderId: "263883873106",
  appId: "1:263883873106:web:9860e5519848f48533788b",
  measurementId: "G-JK3BF315QM"
};

async function fixClaims() {
  const userId = 'oVRUt28thDYs2UvSeMAitUdfynG3';

  console.log('🔧 Inicializando Firebase...');
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  console.log('📝 Actualizando documento del usuario...');
  console.log(`Usuario: ${userId}`);
  console.log(`Role: franchise`);
  console.log(`FranchiseId: F-0004`);
  console.log('');

  try {
    const userRef = doc(db, 'users', userId);

    await updateDoc(userRef, {
      role: 'franchise',
      franchiseId: 'F-0004',
      updatedAt: serverTimestamp()
    });

    console.log('✅ Documento actualizado exitosamente');
    console.log('📡 El trigger onUserWrite se ejecutará y sincronizará los custom claims');
    console.log('');
    console.log('⚠️ IMPORTANTE: Sigue estos pasos:');
    console.log('1. En la aplicación, haz logout');
    console.log('2. Vuelve a hacer login');
    console.log('3. ¡Los custom claims estarán actualizados!');
    console.log('');
    console.log('🎉 El error 403 debería desaparecer');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    console.error('');
    console.error('Si ves un error de permisos, intenta usar el botón amarillo en la app');

    process.exit(1);
  }
}

fixClaims();
