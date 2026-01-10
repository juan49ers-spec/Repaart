
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
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

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const FRANCHISE_ID = 'IAvDv9ZdFzWgF0osu986OCYWu0A3'; // From user logs
const MONTH = '2026-01';

async function checkData() {
    console.log(`Checking data for ${FRANCHISE_ID} - ${MONTH}`);

    // 1. Check Record
    const summaryId = `${FRANCHISE_ID}_${MONTH}`;
    const summaryRef = doc(db, 'financial_summaries', summaryId);
    const summarySnap = await getDoc(summaryRef);

    if (summarySnap.exists()) {
        console.log("------------------------------------------------Data in Summary Doc:");
        console.log(JSON.stringify(summarySnap.data(), null, 2));
    } else {
        console.log("------------------------------------------------Summary Doc DOES NOT EXIST");
    }

    // 2. Check Records
    console.log("\n------------------------------------------------Checking Financial Records:");
    const validRecords = [];
    const q = query(
        collection(db, 'financial_records'),
        where('franchise_id', '==', FRANCHISE_ID)
        // We can't query by date easily without range, but let's filter in memory for simplicity or just list all
    );

    const recordsSnap = await getDocs(q);
    recordsSnap.forEach(doc => {
        const d = doc.data();
        const date = d.date?.toDate ? d.date.toDate() : new Date(d.date);
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const key = `${y}-${m}`;

        if (key === MONTH) {
            console.log(`Record ID: ${doc.id}`);
            console.log(`  Type: ${d.type}`);
            console.log(`  Status: ${d.status}`);
            console.log(`  Revenue: ${d.revenue}, Expenses: ${d.expenses}, Profit: ${d.profit}`);
            console.log(`  Breakdown:`, d.breakdown);

            if (d.status !== 'rejected' && d.status !== 'draft') {
                validRecords.push(d);
            }
        }
    });

    // Manual Calc
    let totalRev = 0;
    let totalExp = 0;
    validRecords.forEach(r => {
        totalRev += (Number(r.revenue) || 0);
        totalExp += (Number(r.expenses) || 0);
    });

    console.log(`\n------------------------------------------------Manual Calc from Active Records:`);
    console.log(`Total Revenue: ${totalRev}`);
    console.log(`Total Expenses: ${totalExp}`);
    console.log(`Net Profit: ${totalRev - totalExp}`);
}

checkData();
