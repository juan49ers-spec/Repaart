
import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyC0vTiufm9bWbzXzWwqy2sEuIZLNxYiVdg",
    authDomain: "repaartfinanzas.firebaseapp.com",
    projectId: "repaartfinanzas",
    storageBucket: "repaartfinanzas.firebasestorage.app",
    messagingSenderId: "263883873106",
    appId: "1:263883873106:web:9860e5519848f48533788b",
    measurementId: "G-JK3BF315QM"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkRole() {
    console.log("Checking role for rider1@repaart.es...");
    const q = query(collection(db, "users"), where("email", "==", "rider1@repaart.es"));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        console.log("❌ No user found with that email.");
    } else {
        snapshot.forEach(doc => {
            const data = doc.data();
            console.log("✅ User Found:");
            console.log(`- ID: ${doc.id}`);
            console.log(`- Role: ${data.role}`);
            console.log(`- FranchiseId: ${data.franchiseId}`);
            console.log(`- Status: ${data.status}`);
            console.log(JSON.stringify(data, null, 2));
        });
    }
    process.exit(0);
}

checkRole().catch(console.error);
