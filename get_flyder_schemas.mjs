
import mysql from 'mysql2/promise';

async function getSchemas() {
    const config = {
        host: 'api.flyder.app',
        user: 'repaart_dashboard',
        password: 'KvPJHf4R48US7iK',
        database: 'flyder_prod',
        port: 3306
    };

    try {
        const connection = await mysql.createConnection(config);
        const tables = ['shifts', 'orders', 'riders'];

        for (const table of tables) {
            const [rows] = await connection.query(`DESCRIBE ${table}`);
            console.log(`\nTable: ${table}`);
            console.table(rows.map(r => ({ Field: r.Field, Type: r.Type })));
        }

        await connection.end();
    } catch (err) {
        console.error(err);
    }
}

getSchemas();
