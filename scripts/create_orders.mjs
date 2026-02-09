/**
 * Crear colección orders con datos de prueba
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, Timestamp } from 'firebase/firestore';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Leer config desde .env
const envFile = readFileSync(join(__dirname, '../.env'), 'utf-8');
const apiKey = envFile.match(/VITE_FIREBASE_API_KEY=(.+)/)?.[1];
const authDomain = envFile.match(/VITE_FIREBASE_AUTH_DOMAIN=(.+)/)?.[1];
const projectId = envFile.match(/VITE_FIREBASE_PROJECT_ID=(.+)/)?.[1];

const firebaseConfig = {
  apiKey,
  authDomain,
  projectId
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const SAMPLE_ORDERS = [
  {
    riderId: 'rider1',
    riderName: 'Juan Pérez',
    franchiseId: 'nVl24d9oewPQ3huEsPd76WV49yi1',
    franchiseName: 'Repaart Admin',
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
    franchiseId: 'nVl24d9oewPQ3huEsPd76WV49yi1',
    franchiseName: 'Repaart Admin',
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
    franchiseId: 'nVl24d9oewPQ3huEsPd76WV49yi1',
    franchiseName: 'Repaart Admin',
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
    franchiseId: 'nVl24d9oewPQ3huEsPd76WV49yi1',
    franchiseName: 'Repaart Admin',
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
    franchiseId: 'nVl24d9oewPQ3huEsPd76WV49yi1',
    franchiseName: 'Repaart Admin',
    distance: 2.5,
    status: 'in_progress',
    amount: 11.20,
    platform: 'uber',
    createdAt: Timestamp.fromDate(new Date(Date.now() - 1000 * 60 * 10)),
    finishedAt: null,
    deliveryTime: null,
    customerAddress: 'Calle Alcalá 123, Madrid'
  }
];

async function seedOrders() {
  try {
    console.log('🌱 Creando colección orders con datos de prueba...');
    console.log(`📊 Project ID: ${projectId}`);
    
    const ordersRef = collection(db, 'orders');
    let count = 0;
    
    for (const order of SAMPLE_ORDERS) {
      try {
        const docRef = await addDoc(ordersRef, order);
        console.log(`✅ Pedido creado: ${docRef.id}`);
        count++;
      } catch (error) {
        console.error(`❌ Error creando pedido:`, error.message);
      }
    }
    
    console.log(`\n📊 Total de pedidos creados: ${count}/${SAMPLE_ORDERS.length}`);
    console.log('✅ Colección orders creada exitosamente');
    console.log('💡 Refresca la página para ver los pedidos');
  } catch (error) {
    console.error('❌ Error al sembrar datos:', error);
    process.exit(1);
  }
}

seedOrders();
