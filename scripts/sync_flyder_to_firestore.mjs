
import mysql from 'mysql2/promise';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

// Constants
const SERVICE_ACCOUNT_PATH = 'c:/Users/Usuario/.gemini/antigravity/playground/repaart/service-account.json';

// Initialize Firebase
if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    console.error('Service account key not found at', SERVICE_ACCOUNT_PATH);
    process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
initializeApp({
    credential: cert(serviceAccount)
});
const db = getFirestore();

async function sync() {
    const dbConfig = {
        host: 'api.flyder.app',
        user: 'repaart_dashboard',
        password: 'KvPJHf4R48US7iK',
        database: 'flyder_prod',
        port: 3306
    };

    console.log('--- STARTING COMPREHENSIVE FLYDER SYNC ---');

    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to Flyder MySQL.');

        // 1. Sync Businesses -> Franchises
        console.log('Syncing Businesses...');
        const [businesses] = await connection.query('SELECT id, name, tax_number FROM businesses');
        for (const b of businesses) {
            const franchiseRef = db.collection('franchises').doc(`flyder_${b.id}`);
            await franchiseRef.set({
                name: b.name,
                taxNumber: b.tax_number || '',
                flyderBusinessId: b.id,
                updatedAt: new Date(),
                isFlyderManaged: true
            }, { merge: true });
        }
        console.log(`Synced ${businesses.length} businesses.`);

        // 2. Sync Riders -> Users
        console.log('Syncing Riders...');
        const [riders] = await connection.query('SELECT id, name, surname, phone, business_id, standard_rate FROM riders');
        for (const r of riders) {
            const userRef = db.collection('users').doc(`flyder_rider_${r.id}`);
            await userRef.set({
                firstName: r.name,
                lastName: r.surname,
                phone: r.phone,
                flyderId: r.id,
                flyderBusinessId: r.business_id,
                standardRate: r.standard_rate,
                role: 'rider',
                updatedAt: new Date(),
                isFlyderManaged: true
            }, { merge: true });
        }
        console.log(`Synced ${riders.length} riders.`);

        // 3. Sync Shifts -> Time Tracking
        console.log('Syncing Shifts...');
        const [shifts] = await connection.query('SELECT * FROM shifts WHERE created_at > DATE_SUB(NOW(), INTERVAL 7 DAY)');
        for (const s of shifts) {
            const shiftRef = db.collection('time_tracking').doc(`flyder_shift_${s.id}`);
            await shiftRef.set({
                flyderId: s.id,
                riderId: `flyder_rider_${s.rider_id}`,
                businessId: s.business_id,
                startAt: s.start_at,
                endAt: s.end_at,
                duration: s.duration,
                status: s.status,
                updatedAt: new Date(),
                isFlyderManaged: true
            }, { merge: true });
        }
        console.log(`Synced ${shifts.length} shifts.`);

        // 4. Sync Orders -> Orders
        console.log('Syncing Orders...');
        const [orders] = await connection.query('SELECT * FROM orders WHERE created_at > DATE_SUB(NOW(), INTERVAL 2 DAY)');
        for (const o of orders) {
            const orderRef = db.collection('orders').doc(`flyder_order_${o.id}`);
            await orderRef.set({
                sku: o.sku,
                status: o.status,
                amount: o.amount,
                customerName: o.customer_name,
                customerPhone: o.customer_phone,
                flyderId: o.id,
                flyderBusinessId: o.business_id,
                flyderRiderId: o.rider_id ? `flyder_rider_${o.rider_id}` : null,
                createdAt: o.created_at,
                updatedAt: o.updated_at,
                isFlyderManaged: true
            }, { merge: true });
        }
        console.log(`Synced ${orders.length} orders.`);

        console.log('--- SYNC COMPLETED SUCCESSFULLY ---');

    } catch (err) {
        console.error('Sync failed:', err);
    } finally {
        if (connection) await connection.end();
    }
}

sync();
