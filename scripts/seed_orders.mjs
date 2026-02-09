/**
 * Script para crear datos de prueba en la colección orders
 * Ejecutar con: node scripts/seed_orders.mjs
 */

import { db } from '../src/lib/firebase.js';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

const SAMPLE_ORDERS = [
  {
    riderId: 'rider1',
    riderName: 'Juan Pérez',
    franchiseId: 'repaart',
    franchiseName: 'Repaart Madrid',
    storeId: 'store1',
    storeName: 'Glovo Centro',
    distance: 3.5,
    status: 'finished',
    amount: 8.50,
    platform: 'glovo',
    createdAt: Timestamp.fromDate(new Date(Date.now() - 1000 * 60 * 30)),
    finishedAt: Timestamp.fromDate(new Date(Date.now() - 1000 * 60 * 25)),
    deliveryTime: 25,
    customerAddress: 'Calle Mayor 45, Madrid'
  },
  {
    riderId: 'rider1',
    riderName: 'Juan Pérez',
    franchiseId: 'repaart',
    franchiseName: 'Repaart Madrid',
    storeId: 'store2',
    storeName: 'UberEats Sol',
    distance: 2.1,
    status: 'finished',
    amount: 12.30,
    platform: 'uber',
    createdAt: Timestamp.fromDate(new Date(Date.now() - 1000 * 60 * 60)),
    finishedAt: Timestamp.fromDate(new Date(Date.now() - 1000 * 60 * 55)),
    deliveryTime: 20,
    customerAddress: 'Gran Vía 32, Madrid'
  },
  {
    riderId: 'rider2',
    riderName: 'María García',
    franchiseId: 'repaart',
    franchiseName: 'Repaart Madrid',
    storeId: 'store1',
    storeName: 'Glovo Centro',
    distance: 4.2,
    status: 'finished',
    amount: 15.00,
    platform: 'glovo',
    createdAt: Timestamp.fromDate(new Date(Date.now() - 1000 * 60 * 120)),
    finishedAt: Timestamp.fromDate(new Date(Date.now() - 1000 * 60 * 110)),
    deliveryTime: 30,
    customerAddress: 'Plaza España 8, Madrid'
  },
  {
    riderId: 'rider2',
    riderName: 'María García',
    franchiseId: 'repaart',
    franchiseName: 'Repaart Madrid',
    storeId: 'store3',
    storeName: 'JustEat Atocha',
    distance: 1.8,
    status: 'cancelled',
    amount: 9.90,
    platform: 'justeat',
    createdAt: Timestamp.fromDate(new Date(Date.now() - 1000 * 60 * 180)),
    deliveryTime: null,
    customerAddress: 'Calle Atocha 55, Madrid'
  },
  {
    riderId: 'rider1',
    riderName: 'Juan Pérez',
    franchiseId: 'repaart',
    franchiseName: 'Repaart Madrid',
    storeId: 'store2',
    storeName: 'UberEats Sol',
    distance: 2.5,
    status: 'in_progress',
    amount: 11.20,
    platform: 'uber',
    createdAt: Timestamp.fromDate(new Date(Date.now() - 1000 * 60 * 10)),
    finishedAt: null,
    deliveryTime: null,
    customerAddress: 'Calle Alcalá 123, Madrid'
  },
  {
    riderId: 'rider3',
    riderName: 'Carlos López',
    franchiseId: 'repaart',
    franchiseName: 'Repaart Madrid',
    storeId: 'store1',
    storeName: 'Glovo Centro',
    distance: 3.8,
    status: 'finished',
    amount: 14.50,
    platform: 'glovo',
    createdAt: Timestamp.fromDate(new Date(Date.now() - 1000 * 60 * 90)),
    finishedAt: Timestamp.fromDate(new Date(Date.now() - 1000 * 60 * 85)),
    deliveryTime: 28,
    customerAddress: 'Paseo Prado 21, Madrid'
  },
  {
    riderId: 'rider3',
    riderName: 'Carlos López',
    franchiseId: 'repaart',
    franchiseName: 'Repaart Madrid',
    storeId: 'store2',
    storeName: 'UberEats Sol',
    distance: 1.5,
    status: 'finished',
    amount: 7.80,
    platform: 'uber',
    createdAt: Timestamp.fromDate(new Date(Date.now() - 1000 * 60 * 150)),
    finishedAt: Timestamp.fromDate(new Date(Date.now() - 1000 * 60 * 145)),
    deliveryTime: 18,
    customerAddress: 'Calle Mayor 78, Madrid'
  },
  {
    riderId: 'rider2',
    riderName: 'María García',
    franchiseId: 'repaart',
    franchiseName: 'Repaart Madrid',
    storeId: 'store3',
    storeName: 'JustEat Atocha',
    distance: 2.9,
    status: 'finished',
    amount: 13.70,
    platform: 'justeat',
    createdAt: Timestamp.fromDate(new Date(Date.now() - 1000 * 60 * 200)),
    finishedAt: Timestamp.fromDate(new Date(Date.now() - 1000 * 60 * 195)),
    deliveryTime: 22,
    customerAddress: 'Ronda Valencia 12, Madrid'
  },
  {
    riderId: 'rider1',
    riderName: 'Juan Pérez',
    franchiseId: 'repaart',
    franchiseName: 'Repaart Madrid',
    storeId: 'store1',
    storeName: 'Glovo Centro',
    distance: 3.1,
    status: 'finished',
    amount: 10.40,
    platform: 'glovo',
    createdAt: Timestamp.fromDate(new Date(Date.now() - 1000 * 60 * 240)),
    finishedAt: Timestamp.fromDate(new Date(Date.now() - 1000 * 60 * 235)),
    deliveryTime: 26,
    customerAddress: 'Calle Fuencarral 51, Madrid'
  },
  {
    riderId: 'rider3',
    riderName: 'Carlos López',
    franchiseId: 'repaart',
    franchiseName: 'Repaart Madrid',
    storeId: 'store2',
    storeName: 'UberEats Sol',
    distance: 2.2,
    status: 'cancelled',
    amount: 8.90,
    platform: 'uber',
    createdAt: Timestamp.fromDate(new Date(Date.now() - 1000 * 60 * 300)),
    deliveryTime: null,
    customerAddress: 'Gran Vía 67, Madrid'
  }
];

async function seedOrders() {
  try {
    console.log('🌱 Sembrando datos de prueba en la colección orders...');
    
    const ordersRef = collection(db, 'orders');
    let count = 0;
    
    for (const order of SAMPLE_ORDERS) {
      try {
        const docRef = await addDoc(ordersRef, order);
        console.log(`✅ Pedido creado: ${docRef.id}`);
        count++;
      } catch (error) {
        console.error(`❌ Error creando pedido:`, error);
      }
    }
    
    console.log(`\n📊 Total de pedidos creados: ${count}/${SAMPLE_ORDERS.length}`);
    console.log('✅ Datos de prueba creados exitosamente');
    console.log('💡 Ahora puedes ver los pedidos en el dashboard de Flyder');
  } catch (error) {
    console.error('❌ Error al sembrar datos:', error);
    process.exit(1);
  }
}

seedOrders();
