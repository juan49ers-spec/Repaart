import admin from 'firebase-admin';
import { readFileSync } from 'fs';

// --- CONFIGURATION ---
const SERVICE_ACCOUNT_PATH = './service-account.json'; // Ensure this file exists
const DUMMY_FRANCHISE_ID = 'test-franchise-owner-id'; // Replace with a REAL franchise UID from your Auth list if possible

// Initialize Admin SDK
try {
    const serviceAccount = JSON.parse(readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    }
    console.log("✅ Firebase Admin Initialized");
} catch (error) {
    console.error("❌ Error initializing Firebase Admin. Check sensitive-account.json path.", error);
    process.exit(1);
}

const db = admin.firestore();

async function triggerIncidentAlert() {
    console.log("🚀 Simulating Incident Creation...");

    const incidentData = {
        description: "TEST: Accidente leve simulado para verificar notificaciones.",
        isUrgent: true,
        riderId: "rider-test-01",
        vehicleId: "moto-01",
        franchiseId: DUMMY_FRANCHISE_ID,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'open',
        location: { lat: 40.416, lng: -3.703 }
    };

    try {
        const docRef = await db.collection('incidents').add(incidentData);
        console.log(`✅ Incident Created with ID: ${docRef.id}`);
        console.log("👀 Check Firestore 'notifications' collection for a new alert targeting:", DUMMY_FRANCHISE_ID);
    } catch (error) {
        console.error("❌ Error creating incident:", error);
    }
}

triggerIncidentAlert();
