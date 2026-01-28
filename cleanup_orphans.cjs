const admin = require('firebase-admin');
admin.initializeApp({
    projectId: 'repaartfinanzas'
});

const db = admin.firestore();

async function cleanup() {
    const orphans = [
        'IAVDV9ZDFZWGF0OSU986OCYWU0A3',
        'S5DLjXdrAyfQxDGbLsARIp1sufD3'
    ];

    for (const id of orphans) {
        console.log(`Cleaning up riders for franchise: ${id}`);
        const snap = await db.collection('users').where('franchiseId', '==', id).get();
        console.log(`  Found ${snap.size} documents for this franchise.`);

        if (snap.empty) {
            console.log('  No riders found.');
            continue;
        }

        const batch = db.batch();
        let count = 0;
        snap.docs.forEach(doc => {
            const data = doc.data();
            console.log(`  - Checking user: ${doc.id} (Role: ${data.role}, Status: ${data.status})`);
            if (data.role === 'rider' && data.status !== 'deleted') {
                batch.update(doc.ref, {
                    status: 'deleted',
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
                console.log(`    * Queuing rider ${doc.id} for deletion.`);
                count++;
            }
        });

        if (count > 0) {
            await batch.commit();
            console.log(`  Successfully marked ${count} riders as deleted.`);
        } else {
            console.log('  No active riders to delete.');
        }
    }
}

console.log('Starting cleanup process...');
cleanup().then(() => {
    console.log('Cleanup process finished successfully.');
    process.exit(0);
}).catch(err => {
    console.error('Cleanup process failed:', err);
    process.exit(1);
});
