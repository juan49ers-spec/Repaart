
import { db } from './config/firebase';

async function inspect() {
    const searchTerms = ['benavente', 'Benavente', 'BENAVENTE'];
    console.log('--- INSPECTING FRANCHISES ---');
    for (const id of searchTerms) {
        const doc = await db.collection('franchises').doc(id).get();
        if (doc.exists) {
            console.log(`Found franchises/${id}:`, JSON.stringify(doc.data(), null, 2));
        }
    }

    console.log('\n--- INSPECTING USERS BY FRANCHISEID FIELD ---');
    for (const id of searchTerms) {
        const users = await db.collection('users').where('franchiseId', '==', id).get();
        if (!users.empty) {
            console.log(`Found ${users.size} users with franchiseId == ${id}:`);
            users.docs.forEach(d => {
                const data = d.data();
                console.log(`- User ${d.id} (${data.email}): invoicingEnabled=${data.invoicingEnabled}, modules.billing.active=${data.modules?.billing?.active}`);
            });
        }
    }

    console.log('\n--- LISTING ALL FRANCHISES (LIMIT 10) ---');
    const allFranchises = await db.collection('franchises').limit(10).get();
    allFranchises.docs.forEach(d => console.log(`- ${d.id}: ${d.data().name || 'No name'}`));

    process.exit(0);
}

inspect().catch(e => {
    console.error(e);
    process.exit(1);
});
