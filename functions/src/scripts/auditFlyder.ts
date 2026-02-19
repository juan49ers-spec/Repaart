
import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno desde functions/.env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const auditFlyderData = async () => {
    const host = process.env.FLYDER_HOST;
    const user = process.env.FLYDER_USER;
    const password = process.env.FLYDER_PASSWORD;
    const database = process.env.FLYDER_DATABASE;

    if (!host || !user || !password || !database) {
        console.error('❌ Falta configuración de base de datos en .env');
        console.log({ host, user, database }); // No loguear password
        process.exit(1);
    }

    console.log('🔍 Conectando a Flyder DB:', host);
    console.log('---------------------------------------------------');

    let connection;
    try {
        connection = await mysql.createConnection({
            host,
            user,
            password,
            database,
            connectTimeout: 10000,
            dateStrings: true
        });

        console.log('✅ Conexión establecida.');

        // 1. Total de Pedidos
        const [totalRows] = await connection.execute('SELECT COUNT(*) as total FROM orders');
        const totalOrders = (totalRows as any)[0].total;
        console.log(`📦 Total de Pedidos: ${totalOrders.toLocaleString()}`);

        // 2. Pedidos por Estado
        console.log('\n📊 Pedidos por Estado:');
        const [statusRows] = await connection.execute(`
      SELECT status, COUNT(*) as count 
      FROM orders 
      GROUP BY status 
      ORDER BY count DESC
    `);
        (statusRows as any[]).forEach(row => {
            console.log(`   - ${row.status}: ${row.count.toLocaleString()}`);
        });

        // 3. Integridad de Riders (Pedidos terminados sin Rider)
        const [orphanRows] = await connection.execute(`
      SELECT COUNT(*) as orphans
      FROM orders o
      LEFT JOIN services svc ON o.id = svc.order_id
      WHERE o.status = 'finished' AND svc.rider_id IS NULL
    `);
        const orphans = (orphanRows as any)[0].orphans;
        console.log(`\n⚠️ Pedidos 'finished' sin Rider asignado: ${orphans.toLocaleString()}`);

        // 4. Integridad de Tiendas (Pedidos sin Store)
        const [noStoreRows] = await connection.execute(`
      SELECT COUNT(*) as no_store
      FROM orders
      WHERE store_id IS NULL
    `);
        const noStore = (noStoreRows as any)[0].no_store;
        if (noStore > 0) console.log(`⚠️ Pedidos sin Store ID: ${noStore.toLocaleString()}`);

        // 5. Último pedido registrado
        const [lastOrder] = await connection.execute(`
      SELECT created_at, status, id 
      FROM orders 
      ORDER BY created_at DESC 
      LIMIT 1
    `);
        if ((lastOrder as any[]).length > 0) {
            console.log(`\n🕒 Último pedido registrado: ${(lastOrder as any)[0].created_at} (ID: ${(lastOrder as any)[0].id})`);
        }

        // 6. Muestra de Datos (para inspección visual de formatos)
        console.log('\n🔎 Muestra de un pedido reciente (JSON):');
        const [sampleRows] = await connection.execute(`
      SELECT * FROM orders ORDER BY created_at DESC LIMIT 1
    `);
        if ((sampleRows as any[]).length > 0) {
            const sample = (sampleRows as any)[0];
            // Ocultar datos sensibles si los hubiera
            console.log(JSON.stringify(sample, null, 2));
        }

    } catch (error) {
        console.error('❌ Error durante la auditoría:', error);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Conexión cerrada.');
        }
    }
};

auditFlyderData();
