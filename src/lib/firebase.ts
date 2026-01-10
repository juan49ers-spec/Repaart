import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyC0vTiufm9bWbzXzWwqy2sEuIZLNxYiVdg",
    authDomain: "repaartfinanzas.firebaseapp.com",
    projectId: "repaartfinanzas",
    storageBucket: "repaartfinanzas.firebasestorage.app",
    messagingSenderId: "263883873106",
    appId: "1:263883873106:web:9860e5519848f48533788b",
    measurementId: "G-JK3BF315QM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const firebaseConfigExport = firebaseConfig; // Export for Secondary App usage
