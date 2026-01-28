/**
 * Script para sincronizar custom claims de usuarios administradores
 *
 * Este script verifica que los usuarios con rol 'admin' en Firestore
 * tengan los custom claims correspondientes en Firebase Auth.
 */

const admin = require("firebase-admin");
const serviceAccount = require("../service-account.json"); // DESCÁRGALO DE FIREBASE CONSOLA

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'repaartfinanzas'
});

const db = admin.firestore();
const auth = admin.auth();

async function syncAdminClaims() {
  console.log('🔍 Buscando usuarios con rol "admin"...');

  try {
    // Obtener todos los usuarios con rol 'admin'
    const adminUsersSnapshot = await db
      .collection('users')
      .where('role', '==', 'admin')
      .get();

    if (adminUsersSnapshot.empty) {
      console.log('⚠️  No se encontraron usuarios con rol "admin"');
      return;
    }

    console.log(`✅ Se encontraron ${adminUsersSnapshot.size} usuarios con rol "admin"`);

    let updatedCount = 0;

    for (const doc of adminUsersSnapshot.docs) {
      const userId = doc.id;
      const userData = doc.data();

      console.log(`\n📋 Procesando usuario: ${userData.email || userId}`);

      try {
        // Obtener el usuario de Auth
        const userRecord = await auth.getUser(userId);

        // Verificar si tiene el custom claim 'role': 'admin'
        const currentClaims = userRecord.customClaims || {};
        const hasAdminClaim = currentClaims.role === 'admin';

        if (hasAdminClaim) {
          console.log(`  ✅ Usuario ya tiene el custom claim 'role': 'admin'`);
        } else {
          console.log(`  ⚠️  Usuario NO tiene el custom claim 'role': 'admin'`);
          console.log(`  Claims actuales:`, JSON.stringify(currentClaims));

          // Actualizar custom claims
          const newClaims = {
            ...currentClaims,
            role: 'admin',
            franchiseId: userData.franchiseId || null
          };

          await auth.setCustomUserClaims(userId, newClaims);
          console.log(`  ✅ Custom claims actualizados exitosamente`);
          updatedCount++;
        }
      } catch (error) {
        if (error.code === 'auth/user-not-found') {
          console.log(`  ❌ Usuario no encontrado en Firebase Auth: ${userId}`);
        } else {
          console.log(`  ❌ Error al procesar usuario:`, error.message);
        }
      }
    }

    console.log(`\n📊 Resumen:`);
    console.log(`  - Total usuarios admin: ${adminUsersSnapshot.size}`);
    console.log(`  - Usuarios actualizados: ${updatedCount}`);
    console.log(`  - Usuarios ya sincronizados: ${adminUsersSnapshot.size - updatedCount}`);

    if (updatedCount > 0) {
      console.log(`\n⚠️  IMPORTANTE: Los usuarios deben cerrar sesión y volver a entrar para obtener los nuevos tokens.`);
    }

  } catch (error) {
    console.error('❌ Error general:', error);
  } finally {
    process.exit(0);
  }
}

// Ejecutar el script
syncAdminClaims();
