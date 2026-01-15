import admin from 'firebase-admin';

if (!admin.apps.length) {
    admin.initializeApp({
        projectId: 'repaart-2025'
    });
}

const db = admin.firestore();

async function diagnose() {
    console.log('--- START DIAGNOSIS ---');

    // 1. Get Franchise Profile
    const userEmail = 'franquicia3@repaart.es';
    const usersSnap = await db.collection('users').where('email', '==', userEmail).get();

    if (usersSnap.empty) {
        console.log(`No user found with email: ${userEmail}`);
        return;
    }

    const userDoc = usersSnap.docs[0];
    const userData = userDoc.data();
    console.log(`User Profile Found:`);
    console.log(`  UID: ${userDoc.id}`);
    console.log(`  Email: ${userData.email}`);
    console.log(`  Role: ${userData.role}`);
    console.log(`  FranchiseId (Slug): ${userData.franchiseId}`);

    const uid = userDoc.id;
    const slug = userData.franchiseId;

    // 2. Sample Shifts
    console.log('\n--- Checking Work Shifts ---');
    const shiftsById = await db.collection('work_shifts').where('franchiseId', '==', uid).limit(1).get();
    console.log(`Shifts with UID (${uid}): ${shiftsById.size}`);

    const shiftsBySlug = await db.collection('work_shifts').where('franchiseId', '==', slug).limit(1).get();
    console.log(`Shifts with Slug (${slug}): ${shiftsBySlug.size}`);

    // 3. Sample Financial Summaries
    console.log('\n--- Checking Financial Summaries ---');
    const summariesById = await db.collection('financial_summaries').where('franchiseId', '==', uid).limit(1).get();
    console.log(`Summaries with UID (${uid}): ${summariesById.size}`);

    const summariesBySlug = await db.collection('financial_summaries').where('franchiseId', '==', slug).limit(1).get();
    console.log(`Summaries with Slug (${slug}): ${summariesBySlug.size}`);

    if (summariesBySlug.size > 0) {
        console.log(`Sample Summary Data:`, JSON.stringify(summariesBySlug.docs[0].data()));
    }

    console.log('\n--- END DIAGNOSIS ---');
}

diagnose().catch(console.error);
