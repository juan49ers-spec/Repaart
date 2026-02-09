/**
 * Exportar pedidos de Flyder a JSON para importar en Firestore
 */

const { readFileSync } = require('fs');
const { writeFileSync } = require('fs');
const mysql = require('mysql2/promise');

// Configuración Flyder
const DB_CONFIG = {
  host: 'api.flyder.app',
  database: 'flyder_prod',
  user: 'repaart_dashboard',
  password: 'KvPJHf4R48US7iK',
  port: 3306
};

async function main() {
  let connection = null;
  
  try {
    console.log('🔗 Conectando a Flyder MySQL...');
    connection = await mysql.createConnection({
      host: DB_CONFIG.host,
      database: DB_CONFIG.database,
      user: DB_CONFIG.user,
      password: DB_CONFIG.password,
      port: DB_CONFIG.port,
      ssl: null
    });
    
    console.log('✅ Conectado\n');
    console.log('📦 Obteniendo pedidos...');
    
    const [orders] = await connection.query(`
      SELECT 
        id,
        sku,
        status,
        store_id,
        shift_id,
        distance,
        amount,
        payment_method,
        customer_name,
        customer_phone,
        customer_addr_street,
        customer_addr_no,
        customer_addr_city,
        customer_addr_postal_code,
        customer_latitude,
        customer_longitude,
        size,
        cold,
        urgent,
        scheduled,
        created_at,
        updated_at,
        duration,
        ready_time
      FROM orders
      WHERE DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      ORDER BY created_at DESC
      LIMIT 100
    `);
    
    console.log(`✅ ${orders.length} pedidos exportados`);
    
    // Formatear para Firestore
    const firestoreOrders = orders.map(order => ({
      id: `flyder_${order.id}`,
      riderId: order.shift_id ? `shift_${order.shift_id}` : 'unassigned',
      franchiseId: 'repaart',
      franchiseName: 'Repaart',
      storeId: order.store_id?.toString(),
      distance: parseFloat(order.distance || 0) / 1000,
      status: order.status,
      amount: parseFloat(order.amount || 0),
      platform: 'flyder',
      createdAt: new Date(order.created_at).toISOString(),
      finishedAt: order.status === 'finished' && order.updated_at ? 
        new Date(order.updated_at).toISOString() : null,
      deliveryTime: order.duration ? Math.round(order.duration / 60) : null,
      customerAddress: order.customer_addr_street ? 
        `${order.customer_addr_street} ${order.customer_addr_no || ''}, ${order.customer_addr_city || ''}`.trim() : null,
      orderNumber: order.sku,
      customerName: order.customer_name,
      customerPhone: order.customer_phone,
      customerLatitude: order.customer_latitude,
      customerLongitude: order.customer_longitude,
      paymentMethod: order.payment_method,
      size: order.size,
      cold: order.cold === 1,
      urgent: order.urgent === 1,
      scheduled: order.scheduled === 1,
      readyTime: order.ready_time ? new Date(order.ready_time).toISOString() : null
    }));
    
    // Guardar en archivo JSON
    const outputFile = './flyder_orders_export.json';
    writeFileSync(outputFile, JSON.stringify(firestoreOrders, null, 2));
    
    console.log(`\n✅ Exportado a: ${outputFile}`);
    console.log(`📊 ${firestoreOrders.length} pedidos listos para importar`);
    console.log('\n💡 Para importar en Firestore:');
    console.log('   1. Ve a Firebase Console: https://console.firebase.google.com/project/repaartfinanzas/firestore');
    console.log('   2. Entra en la colección "orders"');
    console.log('   3. Haz clic en "Importar JSON" o "Import Data"');
    console.log(`   4. Selecciona el archivo: ${outputFile}`);
    console.log('   5. Confirma la importación\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

main();
