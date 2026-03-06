import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

async function run() {
    const userQuery = await db.collection('users').where('email', '==', 'repaartbenavente@gmail.com').get();
    if (userQuery.empty) {
        console.log("No user found");
        process.exit(1);
    }
    const franchise = userQuery.docs[0].data();
    console.log("Found franchise data:", franchise.franchiseId);

    if (franchise.franchiseId) {
        // Find franchise document and activate modules
        const fRef = db.collection('franchises').doc(franchise.franchiseId);
        const fDoc = await fRef.get();
        if (fDoc.exists) {
            console.log("Current modules:", fDoc.data()?.modules);
            await fRef.update({
                'modules.billing.active': true,
                'modules.billing.plan': 'premium'
            });
            console.log("Billing module activated on franchise ref.");
        } else {
            console.log("Franchise document not found!");
        }
    }

    // Also update on user doc just in case
    await userQuery.docs[0].ref.update({
        'modules.billing.active': true,
        'modules.billing.plan': 'premium'
    });
    console.log("Billing module activated on user ref.");

    process.exit(0);
}

run();
