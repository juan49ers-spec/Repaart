/**
 * SCRIPT DE DIAGNÓSTICO - Encyclopedia Data Integrity
 * Identifica duplicados y problemas en Firestore
 */

import { db } from '../src/lib/firebase.js';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

const COLORS = {
    RED: '\x1b[31m',
    GREEN: '\x1b[32m',
    YELLOW: '\x1b[33m',
    BLUE: '\x1b[36m',
    RESET: '\x1b[0m',
    BOLD: '\x1b[1m'
};

console.log('\n🔍 DIAGNOSING ENCYCLOPEDIA DATA...\n');

async function diagnose() {
    try {
        // Fetch all modules
        const modulesRef = collection(db, 'encyclopedia_modules');
        const modulesQuery = query(modulesRef, orderBy('order', 'asc'));
        const modulesSnapshot = await getDocs(modulesQuery);

        const modules = modulesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        console.log(`${COLORS.BLUE}📊 Total modules in Firestore: ${modules.length}${COLORS.RESET}`);
        console.log(`${COLORS.YELLOW}⚠️  Expected: 150${COLORS.RESET}\n`);

        // Check for duplicates by title
        const titleMap = new Map();
        const duplicates = [];

        modules.forEach(mod => {
            const title = mod.title;
            if (titleMap.has(title)) {
                duplicates.push({
                    title,
                    ids: [...titleMap.get(title), mod.id]
                });
                titleMap.set(title, [...titleMap.get(title), mod.id]);
            } else {
                titleMap.set(title, [mod.id]);
            }
        });

        if (duplicates.length > 0) {
            console.log(`${COLORS.RED}❌ FOUND ${duplicates.length} DUPLICATE TITLES:${COLORS.RESET}\n`);
            duplicates.slice(0, 10).forEach((dup, index) => {
                console.log(`${index + 1}. "${dup.title}"`);
                console.log(`   IDs: ${dup.ids.join(', ')}\n`);
            });

            if (duplicates.length > 10) {
                console.log(`   ... and ${duplicates.length - 10} more duplicates\n`);
            }
        } else {
            console.log(`${COLORS.GREEN}✅ No duplicate titles found${COLORS.RESET}\n`);
        }

        // Check for missing required fields
        console.log(`${COLORS.BLUE}🔍 Checking for modules with missing data...${COLORS.RESET}\n`);

        const problematicModules = modules.filter(mod =>
            !mod.title || !mod.content || !mod.action || !mod.categoryId
        );

        if (problematicModules.length > 0) {
            console.log(`${COLORS.RED}❌ FOUND ${problematicModules.length} MODULES WITH MISSING DATA:${COLORS.RESET}\n`);
            problematicModules.slice(0, 5).forEach((mod, index) => {
                console.log(`${index + 1}. ID: ${mod.id}`);
                console.log(`   Title: ${mod.title || 'MISSING'}`);
                console.log(`   Has content: ${!!mod.content}`);
                console.log(`   Has action: ${!!mod.action}`);
                console.log(`   CategoryId: ${mod.categoryId || 'MISSING'}\n`);
            });
        } else {
            console.log(`${COLORS.GREEN}✅ All modules have required fields${COLORS.RESET}\n`);
        }

        // Summary
        console.log(`${COLORS.BOLD}${COLORS.BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${COLORS.RESET}`);
        console.log(`${COLORS.BOLD}SUMMARY:${COLORS.RESET}`);
        console.log(`Total modules: ${modules.length} (expected: 150)`);
        console.log(`Duplicates found: ${duplicates.length}`);
        console.log(`Modules with missing data: ${problematicModules.length}`);
        console.log(`${COLORS.BOLD}${COLORS.BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${COLORS.RESET}\n`);

        // Export duplicate IDs for cleanup
        if (duplicates.length > 0) {
            const idsToDelete = [];
            duplicates.forEach(dup => {
                // Keep the first one, delete the rest
                idsToDelete.push(...dup.ids.slice(1));
            });

            console.log(`${COLORS.YELLOW}💡 To clean up, delete these ${idsToDelete.length} duplicate document IDs:${COLORS.RESET}`);
            console.log(JSON.stringify(idsToDelete, null, 2));
        }

    } catch (error) {
        console.error(`${COLORS.RED}Error during diagnosis:${COLORS.RESET}`, error);
    }
}

diagnose().then(() => {
    console.log('\n✅ Diagnosis complete\n');
    process.exit(0);
}).catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
