
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import * as dotenv from 'dotenv';
dotenv.config();

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID
};

console.log("Initializing Firebase with project:", firebaseConfig.projectId);

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkRecords() {
    console.log("Fetching last 5 records...");
    try {
        const q = query(collection(db, 'financial_records'), orderBy('created_at', 'desc'), limit(5));
        const snap = await getDocs(q);

        if (snap.empty) {
            console.log("No records found.");
            return;
        }

        snap.forEach(doc => {
            const data = doc.data();
            console.log("\n--- Record ID:", doc.id, "---");
            console.log("FranchiseID:", data.franchise_id);
            console.log("Month:", data.month);
            // Handle Timestamp objects specifically
            const dateVal = data.date && typeof data.date.toDate === 'function' ? data.date.toDate().toISOString() : data.date;
            console.log("Date:", dateVal);
            console.log("Type:", data.type);
            console.log("Amount:", data.amount);
            console.log("Revenue:", data.revenue);
            console.log("Expenses:", data.expenses);
            console.log("Breakdown Keys:", data.breakdown ? Object.keys(data.breakdown) : 'None');
        });
    } catch (e) {
        console.error("Error fetching records:", e);
    }
}

checkRecords();
