
import mysql from 'mysql2/promise';

async function probe() {
    const config = {
        host: 'api.flyder.app',
        user: 'repaart_dashboard',
        password: 'KvPJHf4R48US7iK',
        database: 'flyder_prod',
        port: 3306,
        connectTimeout: 10000
    };

    console.log('Connecting to Flyder DB...');
    try {
        const connection = await mysql.createConnection(config);
        console.log('Connected!');

        const [tables] = await connection.query('SHOW TABLES');
        console.log('Tables found:', tables.map(t => Object.values(t)[0]));

        for (const tableRow of tables) {
            const tableName = Object.values(tableRow)[0];
            const [columns] = await connection.query(`DESCRIBE \`${tableName}\``);
            console.log(`\nTable: ${tableName}`);
            console.log(columns.map(c => `${c.Field} (${c.Type})`).join(', '));

            // Get sample data from interesting tables
            if (['orders', 'deliveries', 'transactions', 'riders', 'drivers', 'payments'].includes(tableName.toLowerCase())) {
                const [rows] = await connection.query(`SELECT * FROM \`${tableName}\` LIMIT 2`);
                console.log(`Sample Data for ${tableName}:`, JSON.stringify(rows, null, 2));
            }
        }

        await connection.end();
    } catch (err) {
        console.error('Connection failed:', err.message);
    }
}

probe();
