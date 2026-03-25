import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as path from 'path';

// I need the service account key. Do I have one in `functions/serviceAccountKey.json`?
import fs from 'fs';

let app;
try {
    const keyPath = path.resolve('functions', 'serviceAccountKey.json');
    if (fs.existsSync(keyPath)) {
        app = initializeApp({ credential: cert(require(keyPath)) });
    } else {
        app = initializeApp(); 
    }
} catch (e) {
    console.error("No service account:", e);
    process.exit(1);
}

const db = getFirestore(app);

async function run() {
    console.log("Fetching invoices...");
    const snap = await db.collection("invoices").where("customerSnapshot.cif", "==", "B10473155").get();
    
    let totalInvoiced = 0;
    let totalPaid = 0;
    let totalRem = 0;
    
    snap.docs.forEach(doc => {
        const d = doc.data();
        if (d.status === "ISSUED" || d.status === "RECTIFIED") {
            const total = d.total || 0;
            const paid = d.totalPaid || 0;
            const remaining = d.remainingAmount || 0;
            console.log(`[${d.id}] ${d.fullNumber} | Total: ${total} | Paid: ${paid} | Remaining: ${remaining} | Status: ${d.status}`);
            
            totalInvoiced += total;
            totalPaid += paid;
            totalRem += remaining;
        }
    });

    console.log(`TOTAL INVOICED: ${totalInvoiced}`);
    console.log(`TOTAL PAID: ${totalPaid}`);
    console.log(`TOTAL PENDING: ${totalRem}`);
    console.log(`totalInvoiced - totalPaid = ${totalInvoiced - totalPaid}`);
}

run().catch(console.error);
