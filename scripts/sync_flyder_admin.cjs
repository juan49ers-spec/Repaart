/**
 * Script para sincronizar pedidos desde Flyder MySQL a Firestore
 * Usando Firebase Admin SDK para permisos completos
 */

const { readFileSync } = require('fs');
const { dirname, join } = require('path');
const mysql = require('mysql2/promise');
const admin = require('firebase-admin');

// Leer configuración
const envFile = readFileSync(join(__dirname, '../.env'), 'utf-8');

const DB_CONFIG = {
  host: 'api.flyder.app',
  database: 'flyder_prod',
  user: 'repaart_dashboard',
  password: 'KvPJHf4R48US7iK',
  port: 3306
};

console.log('🔧 Configuración Flyder MySQL:');
console.log(`   Host: ${DB_CONFIG.host}`);
console.log(`   Database: ${DB_CONFIG.database}`);
console.log(`   User: ${DB_CONFIG.user}`);
console.log(`   Port: ${DB_CONFIG.port}\n`);

// Inicializar Firebase Admin
try {
  // Intentar usar credenciales por defecto de Google Cloud
  admin.initializeApp({
    projectId: 'repaartfinanzas'
  });
  console.log('✅ Firebase Admin inicializado\n');
} catch (error) {
  console.error('❌ Error inicializando Firebase:', error.message);
  process.exit(1);
}

const db = admin.firestore();

/**
 * Conectar a Flyder
 */
async function connectToFlyderDB() {
  console.log('🔗 Conectando a Flyder MySQL...');
  
  const connection = await mysql.createConnection({
    host: DB_CONFIG.host,
    database: DB_CONFIG.database,
    user: DB_CONFIG.user,
    password: DB_CONFIG.password,
    port: DB_CONFIG.port,
    ssl: null
  });
  
  console.log('✅ Conectado\n');
  return connection;
}

/**
 * Obtener pedidos
 */
async function fetchOrders(connection) {
  console.log('📦 Obteniendo pedidos...');
  
  const [orders] = await connection.query(`
    SELECT * FROM orders
    WHERE DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
    ORDER BY created_at DESC
    LIMIT 100
  `);
  
  console.log(`✅ ${orders.length} pedidos\n`);
  return orders;
}

/**
 * Guardar en Firestore
 */
async function saveToFirestore(orders) {
  console.log('💾 Guardando en Firestore...\n');
  
  const collectionRef = db.collection('orders');
  let count = 0;
  
  for (const order of orders) {
    try {
      const docId = `flyder_${order.id}`;
      const docRef = collectionRef.doc(docId);
      
      await docRef.set({
        id: docId,
        riderId: order.shift_id ? `shift_${order.shift_id}` : 'unassigned',
        franchiseId: 'repaart',
        franchiseName: 'Repaart',
        storeId: order.store_id ? `store_${order.store_id}` : null,
        distance: parseFloat(order.distance || 0) / 1000,
        status: mapStatus(order.status),
        amount: parseFloat(order.amount || 0),
        platform: 'flyder',
        createdAt: admin.firestore.Timestamp.fromDate(new Date(order.created_at)),
        finishedAt: (order.status === 'finished' && order.updated_at) ? 
          admin.firestore.Timestamp.fromDate(new Date(order.updated_at)) : null,
        deliveryTime: order.duration ? Math.round(order.duration / 60) : null,
        customerAddress: order.customer_addr_street ? 
          `${order.customer_addr_street} ${order.customer_addr_no || ''}`.trim() : null,
        orderNumber: order.sku || null,
        customerName: order.customer_name || null,
        customerPhone: order.customer_phone || null,
        paymentMethod: order.payment_method || null,
        size: order.size || null,
        urgent: order.urgent === 1,
        cold: order.cold === 1,
        scheduled: order.scheduled === 1,
        readyTime: order.ready_time ? admin.firestore.Timestamp.fromDate(new Date(order.ready_time)) : null,
        source: order.source || null
      }, { merge: true });
      
      count++;
      console.log(`  ✅ ${docId} - ${order.status} - €${parseFloat(order.amount || 0).toFixed(2)}`);
    } catch (error) {
      console.error(`  ❌ Error:`, error.message);
    }
  }
  
  console.log(`\n📊 Total guardados: ${count}`);
}

function mapStatus(status) {
  const map = {
    'new': 'pending',
    'assigned': 'in_progress',
    'to_pickup': 'in_progress',
    'picking_up': 'in_progress',
    'in_delivery': 'in_progress',
    'finished': 'finished',
    'cancelled': 'cancelled'
  };
  return map[status] || status;
}

/**
 * Main
 */
async function main() {
  let connection = null;
  
  try {
    connection = await connectToFlyderDB();
    const orders = await fetchOrders(connection);
    
    if (orders.length > 0) {
      await saveToFirestore(orders);
      console.log('\n✅ Sincronización completada');
      console.log('💡 Refresca la página (F5)\n');
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

main();
