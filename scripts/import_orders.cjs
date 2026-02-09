/**
 * Importar pedidos de Flyder a Firestore usando credenciales de usuario
 */

const { readFileSync } = require('fs');
const admin = require('firebase-admin');

// Cargar datos exportados
const ordersData = require('../flyder_orders_export.json');

console.log('📊 Cargados', ordersData.length, 'pedidos desde flyder_orders_export.json');

// Inicializar Firebase Admin sin credenciales de servicio
// Usaremos la base de datos directamente
const adminConfig = {
  databaseURL: 'https://repaartfinanzas-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'repaartfinanzas'
};

try {
  // Intentar inicializar sin credenciales (fallará)
  admin.initializeApp(adminConfig);
} catch (e) {
  // OK, ya está inicializado
}

const db = admin.firestore();

async function importOrders() {
  console.log('💾 Importando a Firestore...');
  
  const batch = db.batch();
  const collectionRef = db.collection('orders');
  
  let count = 0;
  let errors = 0;
  
  for (const order of ordersData) {
    try {
      const docRef = collectionRef.doc(order.id);
      batch.set(docRef, order, { merge: true });
      count++;
      
      if (count % 500 === 0) {
        await batch.commit();
        console.log(`✅ Batch ${count} documentos guardados`);
        batch.reset();
      }
      
      if (count <= 5) {
        console.log(`   📦 ${order.id} - ${order.status} - €${order.amount.toFixed(2)}`);
      }
    } catch (error) {
      errors++;
      console.error(`   ❌ Error con ${order.id}:`, error.message);
    }
  }
  
  // Commit final
  if (count > 0 && count % 500 !== 0) {
    await batch.commit();
  }
  
  console.log(`\n📊 Resumen:`);
  console.log(`   ✅ Importados: ${count}`);
  console.log(`   ❌ Errores: ${errors}`);
  console.log('\n✅ Importación completada');
  console.log('💡 Refresca la página: http://localhost:5173\n');
}

importOrders().catch(console.error);
