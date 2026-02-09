
import mysql from 'mysql2/promise';

async function listBusinesses() {
    const config = {
        host: 'api.flyder.app',
        user: 'repaart_dashboard',
        password: 'KvPJHf4R48US7iK',
        database: 'flyder_prod',
        port: 3306,
        connectTimeout: 10000
    };

    console.log('Connecting to Flyder DB to list businesses...');
    try {
        const connection = await mysql.createConnection(config);
        console.log('Connected!');

        const [rows] = await connection.query('SELECT id, name, tax_number FROM businesses ORDER BY id ASC');

        console.log('\n--- FLYDER BUSINESSES ---');
        console.table(rows);
        console.log('-------------------------\n');

        await connection.end();
    } catch (err) {
        console.error('Failed to list businesses:', err.message);
    }
}

listBusinesses();
