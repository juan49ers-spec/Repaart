/**
 * Script para sincronizar pedidos desde Flyder API
 * Documentación: https://test.flyder.app/docs/public
 */

import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Leer configuración desde .env
const envFile = readFileSync(join(__dirname, '../.env'), 'utf-8');

const FLYDER_API_KEY = envFile.match(/VITE_FLYDER_PASSWORD=(.+)/)?.[1]?.trim() || '';

console.log('🔧 Configuración Flyder:');
console.log(`   API Key: ${FLYDER_API_KEY ? '✅ Configurada' : '❌ NO CONFIGURADA'}`);

if (!FLYDER_API_KEY) {
  console.log('\n⚠️  ERROR: La API Key de Flyder no está configurada.');
  console.log('💡 Agrega esto en tu archivo .env:');
  console.log('   VITE_FLYDER_PASSWORD=tu_api_key_de_flyder');
  process.exit(1);
}

/**
 * Obtener pedidos desde Flyder API
 */
async function fetchOrders(startDate, endDate) {
  console.log(`\n📦 Obteniendo pedidos desde ${startDate} hasta ${endDate}...`);
  
  try {
    const response = await fetch('https://test.flyder.app/api/providers/orders/query', {
      method: 'POST',
      headers: {
        'X-Authorization': FLYDER_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        date_start: `${startDate}T00:00:00`,
        date_end: `${endDate}T23:59:59`,
        order_direction: 'desc'
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Error ${response.status}: ${error.message || 'Desconocido'}`);
    }

    const result = await response.json();
    
    if (result.status !== 'success') {
      throw new Error(`Error en respuesta: ${result.message}`);
    }
    
    console.log(`✅ ${result.data?.length || 0} pedidos obtenidos de Flyder`);
    
    return result.data || [];
  } catch (error) {
    console.error('❌ Error obteniendo pedidos:', error.message);
    throw error;
  }
}

/**
 * Guardar pedidos en Firestore
 */
async function saveToFirestore(orders) {
  console.log('\n💾 Guardando pedidos en Firestore...');
  
  const { initializeApp } = await import('firebase/app');
  const { getFirestore, collection, addDoc, Timestamp, query, where, getDocs, updateDoc, doc } = await import('firebase/firestore');
  
  // Leer config de Firebase
  const apiKey = envFile.match(/VITE_FIREBASE_API_KEY=(.+)/)?.[1];
  const projectId = envFile.match(/VITE_FIREBASE_PROJECT_ID=(.+)/)?.[1];

  const app = initializeApp({
    apiKey,
    projectId
  });

  const db = getFirestore(app);
  const ordersRef = collection(db, 'orders');
  
  let added = 0;
  let updated = 0;
  let errors = 0;

  for (const order of orders) {
    try {
      // Mapear campos de Flyder a nuestro modelo
      const orderData = {
        id: order.id,
        riderId: order.delivery?.rider ? 
          `${order.delivery.rider.first_name} ${order.delivery.rider.last_name}`.trim() :
          'unassigned',
        riderName: order.delivery?.rider ? 
          `${order.delivery.rider.first_name} ${order.delivery.rider.last_name}`.trim() :
          null,
        riderPhone: order.delivery?.rider?.phone || null,
        franchiseId: 'repaart', // Ajustar según tu configuración
        franchiseName: 'Repaart',
        storeId: order.location_id || null,
        storeName: order.store || null,
        distance: 0, // Flyder no proporciona distancia
        status: mapFlyderStatus(order.status),
        amount: order.amount / 100, // Convertir de centimos a euros
        platform: 'flyder',
        createdAt: Timestamp.fromDate(new Date(order.created_at)),
        finishedAt: order.delivery?.status_history?.find(h => h.status === 'finished') ?
          Timestamp.fromDate(new Date(order.delivery.status_history.find(h => h.status === 'finished').changed_at)) :
          null,
        deliveryTime: order.delivery ? 
          calculateDeliveryTime(order.delivery.status_history) :
          null,
        customerAddress: order.customer ? 
          `${order.customer.address.street} ${order.customer.address.street_number}, ${order.customer.address.city}` :
          null,
        orderNumber: order.external_id || null,
        customerName: order.customer?.name || null,
        customerPhone: order.customer?.phone || null,
        size: order.size,
        urgent: order.urgent,
        cold: order.cold,
        paymentMethod: order.payment_method
      };

      // Verificar si ya existe
      const q = query(ordersRef, where('id', '==', order.id));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        // Crear nuevo documento
        await addDoc(ordersRef, orderData);
        added++;
        console.log(`  ✅ Nuevo: ${order.id} (${order.status})`);
      } else {
        // Actualizar existente
        const docRef = doc(db, 'orders', snapshot.docs[0].id);
        await updateDoc(docRef, orderData);
        updated++;
        console.log(`  🔄 Actualizado: ${order.id} (${order.status})`);
      }
    } catch (error) {
      errors++;
      console.error(`  ❌ Error con pedido ${order.id}:`, error.message);
    }
  }

  console.log(`\n📊 Resumen:`);
  console.log(`   ✅ Nuevos: ${added}`);
  console.log(`   🔄 Actualizados: ${updated}`);
  console.log(`   ❌ Errores: ${errors}`);
}

/**
 * Mapear estado de Flyder a nuestro modelo
 */
function mapFlyderStatus(flyderStatus) {
  const statusMap = {
    'new': 'pending',
    'scheduled': 'pending',
    'assigned': 'in_progress',
    'to_pickup': 'in_progress',
    'picking_up': 'in_progress',
    'in_delivery': 'in_progress',
    'finished': 'finished',
    'cancelled': 'cancelled'
  };
  
  return statusMap[flyderStatus] || flyderStatus;
}

/**
 * Calcular tiempo de entrega desde historial de estados
 */
function calculateDeliveryTime(statusHistory) {
  if (!statusHistory || statusHistory.length < 2) return null;
  
  const start = statusHistory[0]?.changed_at;
  const end = statusHistory.find(h => h.status === 'finished')?.changed_at;
  
  if (start && end) {
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    return Math.round((endTime - startTime) / 60000); // Minutos
  }
  
  return null;
}

/**
 * Sincronizar pedidos de hoy
 */
async function syncToday() {
  const today = new Date().toISOString().split('T')[0];
  
  try {
    const orders = await fetchOrders(today, today);
    
    if (orders.length === 0) {
      console.log('\n⚠️  No hay pedidos para sincronizar hoy');
      console.log('💡 Intenta con un rango de fechas más amplio');
      return;
    }
    
    await saveToFirestore(orders);
    console.log('\n✅ Sincronización completada exitosamente');
    console.log('💡 Refresca la página (F5) para ver los pedidos');
  } catch (error) {
    console.error('\n❌ Error en la sincronización:', error.message);
    
    if (error.message.includes('403') || error.message.includes('Invalid API Key')) {
      console.log('\n💡 La API Key no es válida.');
      console.log('   Verifica que VITE_FLYDER_PASSWORD en .env sea correcto.');
    }
    process.exit(1);
  }
}

// Ejecutar sincronización
syncToday();
