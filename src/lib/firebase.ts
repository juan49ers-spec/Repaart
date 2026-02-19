import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
    initializeFirestore,
    persistentLocalCache,
    persistentMultipleTabManager,
    disableNetwork,
    enableNetwork
} from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

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
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Initialize Firestore with optimized offline persistence
// Cache size: 50 MB (reasonable for mobile devices)
const CACHE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

export const db = initializeFirestore(app, {
    localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
        cacheSizeBytes: CACHE_SIZE_BYTES
    })
});

export const storage = getStorage(app);

// Initialize Cloud Functions
export const functions = getFunctions(app, 'us-central1');
// Uncomment for local development with Functions emulator
// if (location.hostname === 'localhost') {
//   connectFunctionsEmulator(functions, 'localhost', 5001);
// }

export const firebaseConfigExport = firebaseConfig;

// Export cache size for monitoring
export const FIRESTORE_CACHE_SIZE = CACHE_SIZE_BYTES;

// Helper function to enable offline mode
export async function enableOfflineMode(): Promise<void> {
    try {
        await disableNetwork(db);
        console.log('📴 Firestore offline mode enabled');
    } catch (error) {
        console.error('Failed to enable offline mode:', error);
        throw error;
    }
}

// Helper function to enable online mode
export async function enableOnlineMode(): Promise<void> {
    try {
        await enableNetwork(db);
        console.log('📶 Firestore online mode enabled');
    } catch (error) {
        console.error('Failed to enable online mode:', error);
        throw error;
    }
}

// Check if currently online (not cached, can be used for UI indicators)
export function isFirestoreEnabled(): boolean {
    // This is a basic check - for more accurate status, use onSnapshotsInSync
    return db !== null;
}
