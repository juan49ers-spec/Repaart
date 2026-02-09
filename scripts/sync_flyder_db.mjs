/**
 * Script para conectar directamente a la base de datos de Flyder
 * y sincronizar pedidos con Firestore
 * 
 * Credenciales:
 * - Host: api.flyder.app
 * - Database: flyder_prod
 * - User: repaart_dashboard
 * - Pass: KvPJHf4R48US7iK
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
  port: 5432 // Puerto PostgreSQL por defecto
};

console.log('🔧 Configuración Base de Datos Flyder:');
console.log(`   Host: ${DB_CONFIG.host}`);
console.log(`   Database: ${DB_CONFIG.database}`);
console.log(`   User: ${DB_CONFIG.user}`);
console.log(`   Port: ${DB_CONFIG.port}`);

// Instalar paquetes necesarios si no existen
async function checkDependencies() {
  console.log('\n📦 Verificando dependencias...');
  
  try {
    await import('pg');
    console.log('✅ pg (PostgreSQL) instalado');
  } catch {
    console.log('❌ PostgreSQL client no encontrado');
    console.log('💡 Ejecuta: npm install pg');
    process.exit(1);
  }
}

/**
 * Conectar a la base de datos de Flyder
 */
async function connectToFlyderDB() {
  console.log('\n🔗 Conectando a la base de datos de Flyder...');
  
  const { Pool } = await import('pg');
  
  const pool = new Pool({
    host: DB_CONFIG.host,
    database: DB_CONFIG.database,
    user: DB_CONFIG.user,
    password: DB_CONFIG.password,
    port: DB_CONFIG.port,
    ssl: {
      rejectUnauthorized: false // Necesario para conexiones remotas
    }
  });
  
  try {
    const client = await pool.connect();
    console.log('✅ Conexión exitosa a Flyder DB');
    return { pool, client };
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    
    if (error.message.includes('password authentication failed')) {
      console.log('\n💡 La contraseña es incorrecta');
    } else if (error.message.includes('connection refused')) {
      console.log('\n💡 El servidor no acepta conexiones remotas');
      console.log('   Puede necesitar VPN o whitelist de IP');
    } else if (error.message.includes('ENOTFOUND')) {
      console.log('\n💡 El host no existe o no es accesible');
      console.log('   ¿El host es correcto?');
    }
    
    throw error;
  }
}

/**
 * Explorar la estructura de la base de datos
 */
async function exploreDatabase(client) {
  console.log('\n🔍 Explorando estructura de la base de datos...');
  
  try {
    // Obtener todas las tablas
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log(`📊 ${tablesResult.rows.length} tablas encontradas:`);
    tablesResult.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    
    // Buscar tablas relacionadas con pedidos
    const orderTables = tablesResult.rows
      .map(row => row.table_name)
      .filter(name => 
        name.toLowerCase().includes('order') ||
        name.toLowerCase().includes('pedido') ||
        name.toLowerCase().includes('delivery')
      );
    
    if (orderTables.length > 0) {
      console.log('\n📦 Tablas de pedidos encontradas:');
      orderTables.forEach(table => {
        console.log(`   ⭐ ${table}`);
      });
      
      // Obtener estructura de la primera tabla de pedidos
      const mainTable = orderTables[0];
      console.log(`\n🔍 Estructura de la tabla "${mainTable}":`);
      
      const columnsResult = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = '${mainTable}'
        ORDER BY ordinal_position
      `);
      
      columnsResult.rows.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : ''}`);
      });
      
      // Mostrar algunos datos de ejemplo
      console.log(`\n📋 Muestras de datos de "${mainTable}":`);
      const sampleResult = await client.query(`
        SELECT * FROM ${mainTable}
        ORDER BY created_at DESC NULLS LAST
        LIMIT 3
      `);
      
      console.log(`   ${sampleResult.rows.length} registros encontrados`);
      sampleResult.rows.forEach((row, i) => {
        console.log(`   \n   Registro ${i + 1}:`);
        Object.keys(row).forEach(key => {
          console.log(`      ${key}: ${JSON.stringify(row[key])}`);
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
async function fetchOrdersFromDB(client, tableName) {
  console.log(`\n📦 Obteniendo pedidos desde la tabla "${tableName}"...`);
  
  try {
    // Ajustar la query según la estructura real de la tabla
    const query = `
      SELECT * FROM ${tableName}
      WHERE created_at >= CURRENT_DATE
      ORDER BY created_at DESC
      LIMIT 50
    `;
    
    const result = await client.query(query);
    console.log(`✅ ${result.rows.length} pedidos obtenidos`);
    
    return result.rows;
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
      // Mapear campos - AJUSTAR según la estructura real
      const orderData = {
        id: order.id || order.order_id || `flyder_${Date.now()}`,
        riderId: order.rider_id || 'unknown',
        riderName: order.rider_name || null,
        franchiseId: 'repaart',
        franchiseName: 'Repaart',
        storeId: order.store_id || order.location_id || null,
        storeName: order.store_name || null,
        distance: order.distance || 0,
        status: order.status || 'pending',
        amount: order.amount || 0,
        platform: 'flyder',
        createdAt: order.created_at ? Timestamp.fromDate(new Date(order.created_at)) : Timestamp.now(),
        finishedAt: order.finished_at ? Timestamp.fromDate(new Date(order.finished_at)) : null,
        deliveryTime: order.delivery_time || null,
        customerAddress: order.customer_address || null,
        orderNumber: order.external_id || null
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
 * Función principal
 */
async function main() {
  let pool = null;
  let client = null;
  
  try {
    await checkDependencies();
    
    const connection = await connectToFlyderDB();
    pool = connection.pool;
    client = connection.client;
    
    const tableName = await exploreDatabase(client);
    
    if (tableName) {
      const orders = await fetchOrdersFromDB(client, tableName);
      
      if (orders.length > 0) {
        await saveToFirestore(orders);
        console.log('\n✅ Sincronización completada');
        console.log('💡 Refresca la página (F5) para ver los pedidos');
      } else {
        console.log('\n⚠️  No se encontraron pedidos');
      }
    } else {
      console.log('\n⚠️  No se encontraron tablas de pedidos');
      console.log('💡 Revisa la estructura de la base de datos');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (client) client.release();
    if (pool) await pool.end();
  }
}

main();
