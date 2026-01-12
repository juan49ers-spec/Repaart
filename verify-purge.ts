import { db } from './src/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

const COLLECTIONS = [
    'riders',
    'fleet_assets',
    'work_shifts',
    'notifications',
    'franchise_riders',
    'franchise_motos',
    'admin_notifications'
];

async function verifyPurge() {
    console.log('--- DB PURGE VERIFICATION ---');
    for (const coll of COLLECTIONS) {
        const snap = await getDocs(collection(db, coll));
        console.log(`Collection [${coll}]: ${snap.size} documents found.`);
    }
}

verifyPurge();
