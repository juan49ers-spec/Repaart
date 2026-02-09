/**
 * Script para eliminar pedidos de prueba de Firestore
 * Ejecutar: node scripts/clean_test_orders.mjs
 */

import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Leer config desde .env
const envFile = readFileSync(join(__dirname, '../.env'), 'utf-8');
const projectId = envFile.match(/VITE_FIREBASE_PROJECT_ID=(.+)/)?.[1];

console.log('🗑️  Limpiando pedidos de prueba...');
console.log(`📊 Project ID: ${projectId}\n`);

const { initializeApp } = await import('firebase/app');
const { getFirestore, collection, query, where, getDocs, deleteDoc, doc } = await import('firebase/firestore');

const apiKey = envFile.match(/VITE_FIREBASE_API_KEY=(.+)/)?.[1];

const app = initializeApp({
  apiKey,
  projectId
});

const db = getFirestore(app);
const ordersRef = collection(db, 'orders');

// Buscar pedidos de prueba (rider_test, rider1, rider2, rider3)
const testRiders = ['rider_test', 'rider1', 'rider2', 'rider3'];

console.log('🔍 Buscando pedidos de prueba...');
console.log(`   Riders de prueba: ${testRiders.join(', ')}\n`);

let deleted = 0;

for (const riderId of testRiders) {
  try {
    const q = query(ordersRef, where('riderId', '==', riderId));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      console.log(`📦 Encontrados ${snapshot.docs.length} pedidos de ${riderId}:`);
      
      for (const doc of snapshot.docs) {
        await deleteDoc(doc.ref);
        deleted++;
        console.log(`   ✅ Eliminado: ${doc.id}`);
      }
    }
  } catch (error) {
    console.error(`❌ Error con ${riderId}:`, error.message);
  }
}

console.log(`\n📊 Total de pedidos eliminados: ${deleted}`);
console.log('✅ Limpieza completada');
console.log('\n💡 Ahora puedes sincronizar pedidos reales desde Flyder');
console.log('   Ejecuta: node scripts/sync_flyder_orders.mjs');
