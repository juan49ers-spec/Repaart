
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { join } from 'path';

const serviceAccountPath = 'c:/Users/Usuario/.gemini/antigravity/playground/repaart/service-account.json';
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

initializeApp({
    credential: cert(serviceAccount),
    projectId: 'repaartfinanzas'
});

const db = getFirestore();

const oldId = 'IAVDV9ZDFZWGF0OSU986OCYWU0A3';
const newId = 'smHpadjQMXWX4WHVKZwt9VWWp822';

async function migrateSummaries() {
    const months = ['2025-11', '2025-12', '2026-01', '2026-02'];
    for (const month of months) {
        const oldDocId = `${oldId}_${month}`;
        const newDocId = `${newId}_${month}`;

        console.log(`Migrating summary ${oldDocId} to ${newDocId}...`);

        const oldRef = db.collection('financial_summaries').doc(oldDocId);
        const oldSnap = await oldRef.get();

        if (oldSnap.exists) {
            const data = oldSnap.data();
            data.franchiseId = newId;
            data.franchise_id = newId;
            await db.collection('financial_summaries').doc(newDocId).set(data);
            await oldRef.delete();
            console.log(`  ✅ Summary ${month} migrated.`);
        }
    }
}

async function migrateShifts() {
    console.log(`Migrating work_shifts for ${oldId}...`);
    const shiftsSnap = await db.collection('work_shifts')
        .where('franchiseId', '==', oldId)
        .get();

    console.log(`  Found ${shiftsSnap.size} shifts.`);

    const batch = db.batch();
    shiftsSnap.forEach(doc => {
        batch.update(doc.ref, {
            franchiseId: newId,
            // also update franchise_id if it exists
            ...(doc.data().franchise_id ? { franchise_id: newId } : {})
        });
    });

    if (shiftsSnap.size > 0) {
        await batch.commit();
        console.log(`  ✅ ${shiftsSnap.size} shifts updated.`);
    }
}

async function main() {
    try {
        await migrateSummaries();
        await migrateShifts();
        console.log('🚀 Migration complete.');
    } catch (err) {
        console.error('❌ Error during migration:', err);
    }
}

main();
