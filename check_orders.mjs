/**
 * Script para verificar pedidos en Firestore
 */

import { db } from './src/lib/firebase.js';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';

async function checkOrders() {
  try {
    console.log('🔍 Verificando colección orders...');
    
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(5));
    const snapshot = await getDocs(q);
    
    console.log(`📊 Total de documentos: ${snapshot.docs.length}`);
    
    if (snapshot.docs.length === 0) {
      console.log('⚠️  No hay pedidos en la colección');
      console.log('💡 Necesitas sincronizar pedidos desde Flyder primero');
      return;
    }
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log('────────────────────────────────────');
      console.log(`ID: ${doc.id}`);
      console.log(`Rider ID: ${data.riderId}`);
      console.log(`Franquicia ID: ${data.franchiseId}`);
      console.log(`Estado: ${data.status}`);
      console.log(`Importe: ${data.amount}`);
      console.log(`Fecha: ${data.createdAt?.toDate?.()}`);
    });
    
    console.log('────────────────────────────────────');
    console.log('✅ Verificación completa');
  } catch (error) {
    console.error('❌ Error al verificar pedidos:', error);
    
    if (error.code === 'permission-denied') {
      console.log('🔒 Error de permisos. Verifica que:');
      console.log('  1. Estás autenticado');
      console.log('  2. Tu usuario tiene rol de admin o franchise');
      console.log('  3. Las reglas de Firestore están correctas');
    }
  }
}

checkOrders();
