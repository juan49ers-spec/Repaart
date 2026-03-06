import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

async function checkStatus() {
    const id = 'repaartbenavente@gmail.com';
    const fRef = db.collection('franchises').doc(id);
    const uRef = db.collection('users').doc(id);

    const fDoc = await fRef.get();
    const uDoc = await uRef.get();

    console.log("Franchise doc:", fDoc.exists, "invoicingEnabled:", fDoc.data()?.invoicingEnabled);
    console.log("User doc:", uDoc.exists, "invoicingEnabled:", uDoc.data()?.invoicingEnabled);

    process.exit(0);
}

checkStatus();
