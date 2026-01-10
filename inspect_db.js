
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import 'dotenv/config';

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

async function checkData() {
    console.log("Checking users_config collection...");
    try {
        const snap = await getDocs(collection(db, "users_config"));
        console.log(`Found ${snap.size} documents.`);
        if (!snap.empty) {
            const doc = snap.docs[0];
            console.log("Sample Document ID:", doc.id);
            console.log("Sample Data:", JSON.stringify(doc.data(), null, 2));
        } else {
            console.log("Collection is empty.");
        }
    } catch (e) {
        console.error("Error:", e);
    }
}

checkData();
