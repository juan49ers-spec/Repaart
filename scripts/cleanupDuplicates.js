/**
 * EMERGENCY CLEANUP - Remove duplicate Encyclopedia modules
 * 
 * WARNING: This will DELETE documents from Firestore
 * Run ONLY if you have confirmed duplicates exist
 * 
 * Strategy: Keep the OLDEST document for each unique title
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';

// Firebase config (same as your app)
const firebaseConfig = {
    apiKey: "AIzaSyDGU0IjPPFe8Mz0MjbwK9E6EWZfEW7fVD8",
    authDomain: "repaartfinanzas.firebaseapp.com",
    projectId: "repaartfinanzas",
    storageBucket: "repaartfinanzas.firebasestorage.app",
    messagingSenderId: "893626733062",
    appId: "1:893626733062:web:6b4d45e43cbeef77ec2856",
    measurementId: "G-6F4G1EE925"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const COLORS = {
    RED: '\x1b[31m',
    GREEN: '\x1b[32m',
    YELLOW: '\x1b[33m',
    RESET: '\x1b[0m',
    BOLD: '\x1b[1m'
};

async function cleanupDuplicates() {
    console.log(`\n${COLORS.BOLD}🧹 STARTING CLEANUP PROCESS${COLORS.RESET}\n`);

    try {
        // Fetch all modules
        const modulesRef = collection(db, 'encyclopedia_modules');
        const modulesQuery = query(modulesRef, orderBy('createdAt', 'asc')); // Oldest first
        const snapshot = await getDocs(modulesQuery);

        const modules = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        console.log(`📊 Total modules found: ${modules.length}`);
        console.log(`Expected: 150\n`);

        // Group by title
        const titleMap = new Map();
        const toDelete = [];

        modules.forEach(mod => {
            const title = mod.title;

            if (!titleMap.has(title)) {
                // First occurrence - KEEP IT
                titleMap.set(title, mod);
            } else {
                // Duplicate - MARK FOR DELETION
                toDelete.push(mod.id);
                console.log(`${COLORS.YELLOW}🗑️  Duplicate: "${title}" (ID: ${mod.id})${COLORS.RESET}`);
            }
        });

        console.log(`\n${COLORS.BOLD}SUMMARY:${COLORS.RESET}`);
        console.log(`Unique modules: ${titleMap.size}`);
        console.log(`Duplicates to delete: ${toDelete.length}\n`);

        if (toDelete.length === 0) {
            console.log(`${COLORS.GREEN}✅ No duplicates found! Database is clean.${COLORS.RESET}\n`);
            return;
        }

        // Confirmation
        console.log(`${COLORS.RED}${COLORS.BOLD}⚠️  WARNING: About to DELETE ${toDelete.length} documents!${COLORS.RESET}`);
        console.log(`${COLORS.YELLOW}Press Ctrl+C NOW to cancel, or wait 5 seconds to proceed...${COLORS.RESET}\n`);

        await new Promise(resolve => setTimeout(resolve, 5000));

        // Delete duplicates
        let deleted = 0;
        for (const id of toDelete) {
            try {
                await deleteDoc(doc(db, 'encyclopedia_modules', id));
                deleted++;
                if (deleted % 10 === 0) {
                    console.log(`Deleted ${deleted}/${toDelete.length}...`);
                }
            } catch (error) {
                console.error(`${COLORS.RED}Error deleting ${id}:${COLORS.RESET}`, error.message);
            }
        }

        console.log(`\n${COLORS.GREEN}${COLORS.BOLD}✅ CLEANUP COMPLETE!${COLORS.RESET}`);
        console.log(`${COLORS.GREEN}Deleted ${deleted} duplicate modules${COLORS.RESET}`);
        console.log(`${COLORS.GREEN}Remaining: ${modules.length - deleted} modules${COLORS.RESET}\n`);

    } catch (error) {
        console.error(`${COLORS.RED}Fatal error:${COLORS.RESET}`, error);
    }
}

cleanupDuplicates().then(() => {
    console.log('Script finished. Exiting...\n');
    process.exit(0);
}).catch(err => {
    console.error('Unhandled error:', err);
    process.exit(1);
});
