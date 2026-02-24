
import * as functions from 'firebase-functions/v1';
import { db } from '../config/firebase';
import { CallableContext } from 'firebase-functions/v1/https';
import { Timestamp } from 'firebase-admin/firestore';
import { CreateInvoiceRequest, Invoice, InvoiceLine, Restaurant } from '../types/invoicing';

// --- RESTAURANTS MANAGEMENT ---

export const createRestaurant = functions.https.onCall(async (data: any, context: CallableContext) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');

    const { fiscalName, cif, address, franchiseId, email, phone, notes } = data;
    if (!fiscalName || !cif || !address || !franchiseId) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
    }

    const isAuthorized = context.auth.token.role === 'admin' ||
        context.auth.uid.toLowerCase() === franchiseId.toLowerCase();

    if (!isAuthorized) {
        throw new functions.https.HttpsError('permission-denied', 'Unauthorized');
    }

    try {
        const restaurantRef = db.collection('restaurants').doc();
        const newRestaurant: Partial<Restaurant> = {
            id: restaurantRef.id,
            franchiseId,
            fiscalName,
            cif: cif.toUpperCase(),
            email: email || undefined,
            phone: phone || undefined,
            notes: notes || undefined,
            address,
            status: 'active',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        };

        await restaurantRef.set(newRestaurant);
        return { success: true, id: restaurantRef.id };
    } catch (error: any) {
        throw new functions.https.HttpsError('internal', error.message);
    }
});

export const getRestaurants = functions.https.onCall(async (data: any, context: CallableContext) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');

    const { franchiseId } = data;
    if (!franchiseId) throw new functions.https.HttpsError('invalid-argument', 'Missing franchiseId');

    // Case-insensitive comparison for UID/franchiseId
    const isAuthorized = context.auth.token.role === 'admin' ||
        context.auth.uid.toLowerCase() === franchiseId.toLowerCase();

    if (!isAuthorized) {
        throw new functions.https.HttpsError('permission-denied', 'Unauthorized');
    }

    const snapshot = await db.collection('restaurants')
        .where('franchiseId', '==', franchiseId)
        .where('status', '==', 'active') // Soft delete support
        .get();

    return { restaurants: snapshot.docs.map(d => d.data()) };
});

export const updateRestaurant = functions.https.onCall(async (data: any, context: CallableContext) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');

    const { id, fiscalName, cif, address, franchiseId, email, phone, notes } = data;
    if (!id || !fiscalName || !cif || !address || !franchiseId) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
    }

    const isAuthorized = context.auth.token.role === 'admin' ||
        context.auth.uid.toLowerCase() === franchiseId.toLowerCase();

    if (!isAuthorized) {
        throw new functions.https.HttpsError('permission-denied', 'Unauthorized');
    }

    try {
        await db.collection('restaurants').doc(id).update({
            fiscalName,
            cif: cif.toUpperCase(),
            email: email || undefined,
            phone: phone || undefined,
            notes: notes || undefined,
            address,
            updatedAt: Timestamp.now()
        });
        return { success: true };
    } catch (error: any) {
        throw new functions.https.HttpsError('internal', error.message);
    }
});

export const deleteRestaurant = functions.https.onCall(async (data: any, context: CallableContext) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');

    const { id, franchiseId } = data;
    if (!id || !franchiseId) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
    }

    // Role-based auth
    const isAuthorized = context.auth.token.role === 'admin' ||
        context.auth.uid.toLowerCase() === franchiseId.toLowerCase();

    if (!isAuthorized) {
        throw new functions.https.HttpsError('permission-denied', 'Unauthorized');
    }

    try {
        // Soft delete
        await db.collection('restaurants').doc(id).update({
            status: 'deleted',
            updatedAt: Timestamp.now()
        });
        return { success: true };
    } catch (error: any) {
        throw new functions.https.HttpsError('internal', error.message);
    }
});


// --- FRANCHISE MANAGEMENT (ADMIN) ---

export const getFranchises = functions.https.onCall(async (data: any, context: CallableContext) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');

    // Admin only
    if (context.auth.token.role !== 'admin') {
        throw new functions.https.HttpsError('permission-denied', 'Only admin can list franchises for invoicing');
    }

    try {
        // Try getting from 'franchises' collection first
        const snapshot = await db.collection('franchises')
            .where('status', '==', 'active')
            .get();

        if (!snapshot.empty) {
            return { franchises: snapshot.docs.map(d => ({ id: d.id, ...d.data() })) };
        }

        // Fallback to 'users' with role 'franchise'
        const usersSnapshot = await db.collection('users')
            .where('role', '==', 'franchise')
            .where('status', '==', 'active')
            .get();

        return { franchises: usersSnapshot.docs.map(d => ({ id: d.id, ...d.data() })) };
    } catch (error: any) {
        throw new functions.https.HttpsError('internal', error.message);
    }
});


// --- INVOICING ENGINE ---

export const generateInvoice = functions.https.onCall(async (data: CreateInvoiceRequest & { customerCollection?: string }, context: CallableContext) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');

    const { franchiseId, restaurantId, customerId, customerCollection, period, items } = data;

    // Normalize customer ID
    const targetCustomerId = customerId || restaurantId;
    const targetCollection = customerCollection || 'restaurants';

    // 1. Validations
    // Case-insensitive comparison for UID/franchiseId
    const isAuthorized = context.auth.token.role === 'admin' ||
        context.auth.uid.toLowerCase() === franchiseId.toLowerCase();

    if (!isAuthorized) {
        throw new functions.https.HttpsError('permission-denied', 'Only franchise owner can issue invoices');
    }

    if (!items || items.length === 0) {
        throw new functions.https.HttpsError('invalid-argument', 'Invoice must have items');
    }

    try {
        // 2. Data Fetching
        const [franchiseDocSnap, customerSnap] = await Promise.all([
            db.collection('franchises').doc(franchiseId).get(),
            db.collection(targetCollection).doc(targetCustomerId!).get()
        ]);

        // Fallback for Issuer Data (handle slugs and case-sensitivity)
        let issuerData = franchiseDocSnap.exists ? franchiseDocSnap.data() : undefined;

        if (!issuerData) {
            // Try direct UID lookup in users
            const userSnap = await db.collection('users').doc(franchiseId).get();
            if (userSnap.exists && userSnap.data()?.role === 'franchise') {
                issuerData = userSnap.data();
            }
        }

        if (!issuerData) {
            // Try searching by franchiseId field (slug) - this is crucial for the "Issuer not found" bug
            const usersRef = db.collection('users');
            const querySnap = await usersRef
                .where('role', '==', 'franchise')
                .where('franchiseId', '==', franchiseId)
                .limit(1)
                .get();

            if (!querySnap.empty) {
                issuerData = querySnap.docs[0].data();
            }
        }

        // Final secondary check: if it's uppercase/lowercase mismatch in the slug field
        if (!issuerData && franchiseId === franchiseId.toUpperCase()) {
            const querySnap = await db.collection('users')
                .where('role', '==', 'franchise')
                .where('franchiseId', '==', franchiseId.toLowerCase())
                .limit(1)
                .get();
            if (!querySnap.empty) issuerData = querySnap.docs[0].data();
        }

        if (!issuerData) {
            console.error(`[Invoicing] Failed to find issuer for franchiseId: ${franchiseId}`);
            throw new functions.https.HttpsError('not-found', 'Franchise/Issuer not found');
        }

        if (!customerSnap.exists) throw new functions.https.HttpsError('not-found', 'Customer not found');

        const customerData = customerSnap.data();

        // 3. Totals Calculation
        let subtotal = 0;
        let taxAmount = 0;

        const lines: InvoiceLine[] = items.map(item => {
            const lineTotal = item.quantity * item.unitPrice;
            const lineTax = lineTotal * (item.taxRate / 100);

            subtotal += lineTotal;
            taxAmount += lineTax;

            return {
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                taxRate: item.taxRate,
                amount: lineTotal,
                taxAmount: lineTax,
                discountRate: 0,
                total: lineTotal + lineTax
            };
        });

        const total = subtotal + taxAmount;

        // 4. Invoice Number Generation
        const year = new Date().getFullYear();
        const countSnap = await db.collection('invoices')
            .where('franchiseId', '==', franchiseId)
            .where('issueDate', '>=', `${year}-01-01`)
            .where('issueDate', '<=', `${year}-12-31`)
            .count()
            .get();

        const sequence = countSnap.data().count + 1;
        const numberString = `INV-${year}-${sequence.toString().padStart(4, '0')}`;

        // 5. Create Invoice Document
        const invoiceRef = db.collection('invoices').doc();

        const invoice: Invoice = {
            id: invoiceRef.id,
            series: `INV-${year}`,
            number: sequence,
            fullNumber: numberString,
            franchiseId, // Issuer
            restaurantId: targetCollection === 'restaurants' ? targetCustomerId : undefined,
            customerId: targetCustomerId!,
            customerCollection: targetCollection as 'restaurants' | 'franchises',
            type: 'standard',

            // Snapshots
            customerSnapshot: {
                id: targetCustomerId!,
                fiscalName: customerData?.fiscalName || customerData?.displayName || customerData?.email || 'Unknown Client',
                cif: customerData?.cif || customerData?.nif || 'N/A',
                address: typeof customerData?.address === 'object' ?
                    `${customerData.address.street || ''}, ${customerData.address.city || ''}` :
                    (customerData?.address || '')
            },
            issuerSnapshot: {
                id: franchiseId,
                fiscalName: issuerData?.billingName || issuerData?.displayName || 'Unknown',
                cif: issuerData?.cif || 'Unknown',
                address: typeof issuerData?.address === 'object' ?
                    `${issuerData.address.street || ''}, ${issuerData.address.city || ''}` :
                    (issuerData?.address || '')
            },

            periodStart: Timestamp.fromDate(new Date(period.start)),
            periodEnd: Timestamp.fromDate(new Date(period.end)),

            issueDate: Timestamp.now(),
            dueDate: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
            status: 'issued',
            lines,
            subtotal,
            taxes: [{ rate: 21, amount: taxAmount }],
            total,
            createdBy: context.auth.uid,
            createdAt: Timestamp.now()
        };

        await invoiceRef.set(invoice);

        return { success: true, invoiceId: invoice.id, number: invoice.fullNumber };

    } catch (error: any) {
        console.error("Invoice Generation Error:", error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});

export const getInvoices = functions.https.onCall(async (data: any, context: CallableContext) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');

    const { franchiseId } = data;
    if (!franchiseId) throw new functions.https.HttpsError('invalid-argument', 'Missing franchiseId');

    // Case-insensitive comparison for UID/franchiseId
    const isAuthorized = context.auth.token.role === 'admin' ||
        context.auth.uid.toLowerCase() === franchiseId.toLowerCase();

    if (!isAuthorized) {
        throw new functions.https.HttpsError('permission-denied', 'Unauthorized');
    }

    try {
        const snapshot = await db.collection('invoices')
            .where('franchiseId', '==', franchiseId)
            .orderBy('createdAt', 'desc')
            .limit(50)
            .get();

        return { invoices: snapshot.docs.map(d => d.data()) };
    } catch (error: any) {
        console.error("Error fetching invoices:", error);
        throw new functions.https.HttpsError('internal', error.message || 'Error fetching invoices');
    }
});
