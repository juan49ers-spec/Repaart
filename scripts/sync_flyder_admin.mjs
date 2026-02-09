/**
 * Script para sincronizar pedidos desde Flyder MySQL a Firestore
 * Usando Firebase Admin SDK para permisos completos
 */

import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Leer configuración desde .env
const envFile = readFileSync(join(__dirname, '../.env'), 'utf-8');

const DB_CONFIG = {
  host: 'api.flyder.app',
  database: 'flyder_prod',
  user: 'repaart_dashboard',
  password: 'KvPJHf4R48US7iK',
  port: 3306
};

console.log('🔧 Configuración Base de Datos Flyder (MySQL):');
console.log(`   Host: ${DB_CONFIG.host}`);
console.log(`   Database: ${DB_CONFIG.database}`);
console.log(`   User: ${DB_CONFIG.user}`);
console.log(`   Port: ${DB_CONFIG.port}\n`);

// Inicializar Firebase Admin
const serviceAccount = {
  "type": "service_account",
  "project_id": "repaartfinanzas",
  "private_key": process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') || "",
  "client_email": process.env.FIREBASE_CLIENT_EMAIL || ""
};

if (!serviceAccount.private_key) {
  console.log('⚠️  FIREBASE_PRIVATE_KEY no está configurado');
  console.log('💡 Usando autenticación con API key alternativa...\n');
  
  // Usar application credentials por defecto
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'repaartfinanzas'
  });
} else {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'repaartfinanzas'
  });
}

const db = admin.firestore();

/**
 * Conectar a Flyder MySQL
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
  
  console.log('✅ Conectado a Flyder DB\n');
  return connection;
}

/**
 * Obtener pedidos desde Flyder
 */
async function fetchOrdersFromDB(connection) {
  console.log('📦 Obteniendo pedidos de Flyder...');
  
  const [orders] = await connection.query(`
    SELECT * FROM orders
    WHERE DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    ORDER BY created_at DESC
    LIMIT 100
  `);
  
  console.log(`✅ ${orders.length} pedidos obtenidos\n`);
  return orders;
}

/**
 * Guardar en Firestore usando Admin SDK
 */
async function saveToFirestore(orders) {
  console.log('💾 Guardando en Firestore (Admin SDK)...\n');
  
  const batch = db.batch();
  const collectionRef = db.collection('orders');
  
  let count = 0;
  
  for (const order of orders) {
    try {
      const docId = `flyder_${order.id}`;
      const docRef = collectionRef.doc(docId);
      
      const orderData = {
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
        comments: order.comments || null,
        details: order.details || null,
        source: order.source || null
      };
      
      batch.set(docRef, orderData, { merge: true });
      count++;
      
      console.log(`  ✅ ${docId} - ${order.status} - €${orderData.amount.toFixed(2)}`);
      
      // Firestore batch limit is 500
      if (count % 500 === 0) {
        await batch.commit();
        console.log(`\n📊 Batch de 500 documentos guardado\n`);
        batch.reset();
      }
    } catch (error) {
      console.error(`  ❌ Error con pedido ${order.id}:`, error.message);
    }
  }
  
  if (count > 0 && count % 500 !== 0) {
    await batch.commit();
  }
  
  console.log(`\n📊 Total: ${count} pedidos guardados`);
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
    const orders = await fetchOrdersFromDB(connection);
    
    if (orders.length > 0) {
      await saveToFirestore(orders);
      console.log('\n✅ Sincronización completada exitosamente');
      console.log('💡 Refresca la página (F5) para ver los pedidos\n');
    } else {
      console.log('⚠️  No hay pedidos recientes\n');
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

main();
