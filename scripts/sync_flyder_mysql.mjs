/**
 * Script para conectar a la base de datos MySQL de Flyder
 * y sincronizar pedidos con Firestore
 */

import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

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
console.log(`   Port: ${DB_CONFIG.port}`);

/**
 * Conectar a la base de datos de Flyder
 */
async function connectToFlyderDB() {
  console.log('\n🔗 Conectando a la base de datos de Flyder...');
  
  const mysql = await import('mysql2/promise');
  
  try {
    const connection = await mysql.createConnection({
      host: DB_CONFIG.host,
      database: DB_CONFIG.database,
      user: DB_CONFIG.user,
      password: DB_CONFIG.password,
      port: DB_CONFIG.port,
      ssl: null
    });
    
    console.log('✅ Conexión exitosa a Flyder DB');
    return connection;
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    
    if (error.message.includes('Access denied')) {
      console.log('\n💡 El usuario o contraseña son incorrectos');
    } else if (error.message.includes('connect')) {
      console.log('\n💡 Error de conexión - verifica host y puerto');
    }
    
    throw error;
  }
}

/**
 * Explorar la estructura de la base de datos
 */
async function exploreDatabase(connection) {
  console.log('\n🔍 Explorando estructura de la base de datos...');
  
  try {
    // Obtener todas las tablas
    const [tables] = await connection.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      OR table_schema = DATABASE()
      ORDER BY table_name
    `);
    
    console.log(`📊 ${tables.length} tablas encontradas:`);
    tables.forEach(row => {
      console.log(`   - ${row.TABLE_NAME || row.table_name}`);
    });
    
    // Buscar tablas relacionadas con pedidos
    const tableName = tables[0]?.TABLE_NAME || tables[0]?.table_name;
    const orderTables = tables
      .map(row => row.TABLE_NAME || row.table_name)
      .filter(name => 
        name && (
          name.toLowerCase().includes('order') ||
          name.toLowerCase().includes('pedido') ||
          name.toLowerCase().includes('delivery')
        )
      );
    
    if (orderTables.length > 0) {
      console.log('\n📦 Tablas de pedidos encontradas:');
      orderTables.forEach(table => {
        console.log(`   ⭐ ${table}`);
      });
      
      const mainTable = orderTables[0];
      console.log(`\n🔍 Estructura de la tabla "${mainTable}":`);
      
      const [columns] = await connection.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = ?
        ORDER BY ordinal_position
      `, [mainTable]);
      
      columns.forEach(col => {
        console.log(`   - ${col.COLUMN_NAME}: ${col.DATA_TYPE} ${col.IS_NULLABLE === 'YES' ? '(nullable)' : ''}`);
      });
      
      // Mostrar algunos datos de ejemplo
      console.log(`\n📋 Muestras de datos de "${mainTable}":`);
      const [samples] = await connection.query(`
        SELECT * FROM ${mainTable}
        ORDER BY created_at DESC, id DESC
        LIMIT 3
      `);
      
      console.log(`   ${samples.length} registros encontrados`);
      samples.forEach((row, i) => {
        console.log(`   \n   Registro ${i + 1}:`);
        Object.keys(row).forEach(key => {
          const value = row[key];
          const display = value && value.length > 50 ? value.substring(0, 50) + '...' : value;
          console.log(`      ${key}: ${JSON.stringify(display)}`);
        });
      });
      
      return mainTable;
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error explorando DB:', error.message);
    return null;
  }
}

/**
 * Obtener pedidos desde Flyder DB
 */
async function fetchOrdersFromDB(connection, tableName) {
  console.log(`\n📦 Obteniendo pedidos desde la tabla "${tableName}"...`);
  
  try {
    const query = `
      SELECT * FROM ${tableName}
      WHERE DATE(created_at) = CURDATE()
        OR created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      ORDER BY created_at DESC
      LIMIT 50
    `;
    
    const [orders] = await connection.query(query);
    console.log(`✅ ${orders.length} pedidos obtenidos`);
    
    return orders;
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
        id: `flyder_${order.id}`,
        riderId: order.shift_id ? `shift_${order.shift_id}` : 'unassigned',
        riderName: null, // Flyder no tiene nombre de rider en la tabla orders
        franchiseId: 'repaart',
        franchiseName: 'Repaart',
        storeId: order.store_id ? `store_${order.store_id}` : null,
        storeName: null, // Necesitaría join con tabla stores
        distance: parseFloat(order.distance || 0) / 1000, // Convertir a km
        status: mapFlyderStatus(order.status),
        amount: parseFloat(order.amount || 0),
        platform: 'flyder',
        createdAt: order.created_at ? Timestamp.fromDate(new Date(order.created_at)) : Timestamp.now(),
        finishedAt: order.updated_at && order.status === 'finished' ? Timestamp.fromDate(new Date(order.updated_at)) : null,
        deliveryTime: order.duration ? Math.round(order.duration / 60) : null, // Convertir segundos a minutos
        customerAddress: order.customer_addr_street ? 
          `${order.customer_addr_street} ${order.customer_addr_no || ''}, ${order.customer_addr_city || ''}`.trim() :
          null,
        orderNumber: order.sku || null,
        customerName: order.customer_name || null,
        customerPhone: order.customer_phone || null,
        customerLatitude: order.customer_latitude ? parseFloat(order.customer_latitude) : null,
        customerLongitude: order.customer_longitude ? parseFloat(order.customer_longitude) : null,
        paymentMethod: order.payment_method || null,
        size: order.size || null,
        urgent: order.urgent === 1,
        cold: order.cold === 1,
        scheduled: order.scheduled === 1,
        readyTime: order.ready_time ? Timestamp.fromDate(new Date(order.ready_time)) : null,
        comments: order.comments || null,
        details: order.details || null,
        source: order.source || null
      };

      // Verificar si ya existe
      const q = query(ordersRef, where('id', '==', orderData.id));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        await addDoc(ordersRef, orderData);
        added++;
        console.log(`  ✅ Nuevo: ${orderData.id}`);
      } else {
        const docRef = doc(db, 'orders', snapshot.docs[0].id);
        await updateDoc(docRef, orderData);
        updated++;
        console.log(`  🔄 Actualizado: ${orderData.id}`);
      }
    } catch (error) {
      errors++;
      console.error(`  ❌ Error:`, error.message);
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
 * Función principal
 */
async function main() {
  let connection = null;
  
  try {
    connection = await connectToFlyderDB();
    const tableName = await exploreDatabase(connection);
    
    if (tableName) {
      const orders = await fetchOrdersFromDB(connection, tableName);
      
      if (orders.length > 0) {
        await saveToFirestore(orders);
        console.log('\n✅ Sincronización completada');
        console.log('💡 Refresca la página (F5) para ver los pedidos');
      } else {
        console.log('\n⚠️  No se encontraron pedidos recientes');
      }
    } else {
      console.log('\n⚠️  No se encontraron tablas de pedidos');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

main();
