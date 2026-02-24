/**
 * Cloud Functions for Billing Module
 * 
 * Server-side functions for invoice PDF generation and storage
 * Deploy to Firebase Functions
 */

import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import { invoicePdfGenerator } from './pdfGenerator';
import type { Invoice } from './types';

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();
const storage = admin.storage();
const bucket = storage.bucket();

/**
 * Generate Invoice PDF
 * 
 * Triggered when an invoice is issued
 * Generates PDF server-side and stores in Firebase Storage
 * Updates invoice with PDF URL
 * 
 * @region europe-west1 (for GDPR compliance)
 */
export const generateInvoicePdf = functions
    .region('europe-west1')
    .firestore.document('invoices/{invoiceId}')
    .onUpdate(async (change, context) => {
        const invoiceId = context.params.invoiceId;
        const newData = change.after.data();
        const previousData = change.before.data();

        // Only process when status changes to ISSUED
        if (newData.status === 'ISSUED' && previousData.status === 'DRAFT') {
            try {
                // Get complete invoice data
                const invoice: Invoice = {
                    id: invoiceId,
                    ...newData
                } as any;

                // Generate PDF with selected template
                const pdfBuffer = invoicePdfGenerator.generateInvoicePdf(invoice, {
                    template: invoice.template || 'modern',  // Use stored template or default
                    lang: 'es',
                    includeLogo: true,
                    logoUrl: 'https://your-domain.com/logo.png', // Configure this
                    showPaymentInfo: true
                });

                // Upload to Firebase Storage
                const fileName = `invoices/${invoice.franchiseId}/${invoice.period || 'unknown'}/${invoice.fullNumber}.pdf`;
                const file = bucket.file(fileName);

                await file.save(Buffer.from(pdfBuffer), {
                    contentType: 'application/pdf',
                    metadata: {
                        contentType: 'application/pdf',
                        invoiceId,
                        franchiseId: invoice.franchiseId,
                        invoiceNumber: invoice.fullNumber,
                        generatedAt: new Date().toISOString()
                    }
                });

                // Make file publicly readable (or use signed URLs for privacy)
                await file.makePublic();

                // Get public URL
                const pdfUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

                // Update invoice with PDF URL
                await change.after.ref.update({
                    pdfUrl,
                    pdfGeneratedAt: admin.firestore.FieldValue.serverTimestamp(),
                    pdf_storage_path: fileName
                });

                console.log(`PDF generated for invoice ${invoice.fullNumber}: ${pdfUrl}`);

                return null;
            } catch (error) {
                console.error('Error generating invoice PDF:', error);
                // Log error but don't fail the transaction
                // Invoice is already ISSUED, just PDF failed
                return null;
            }
        }

        return null;
    });

/**
 * Generate Rectifying Invoice PDF
 * 
 * Triggered when a rectifying invoice is created
 * Generates PDF with reference to original invoice
 * 
 * @region europe-west1
 */
export const generateRectificationPdf = functions
    .region('europe-west1')
    .firestore.document('invoices/{invoiceId}')
    .onCreate(async (snap, context) => {
        const invoice = snap.data();

        // Only process rectifying invoices
        if (invoice.type === 'RECTIFICATIVE' && invoice.status === 'ISSUED') {
            try {
                const originalInvoiceId = invoice.originalInvoiceId;

                if (!originalInvoiceId) {
                    console.error('Rectifying invoice missing originalInvoiceId');
                    return null;
                }

                // Get original invoice
                const originalInvoiceSnap = await db.collection('invoices').doc(originalInvoiceId).get();

                if (!originalInvoiceSnap.exists) {
                    console.error('Original invoice not found:', originalInvoiceId);
                    return null;
                }

                const originalInvoice = originalInvoiceSnap.data() as Invoice;

                // Generate rectification PDF
                const pdfBuffer = invoicePdfGenerator.generateRectificationPdf(
                    invoice as Invoice,
                    originalInvoice,
                    invoice.rectificationReason || 'Rectificación',
                    {
                        lang: 'es',
                        includeLogo: true,
                        showPaymentInfo: true
                    }
                );

                // Upload to Firebase Storage
                const fileName = `invoices/${invoice.franchiseId}/${invoice.period || 'unknown'}/${invoice.fullNumber}.pdf`;
                const file = bucket.file(fileName);

                await file.save(Buffer.from(pdfBuffer), {
                    contentType: 'application/pdf',
                    metadata: {
                        contentType: 'application/pdf',
                        invoiceId: context.params.invoiceId,
                        originalInvoiceId,
                        franchiseId: invoice.franchiseId,
                        invoiceNumber: invoice.fullNumber,
                        type: 'RECTIFICATIVE',
                        generatedAt: new Date().toISOString()
                    }
                });

                await file.makePublic();

                const pdfUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

                // Update invoice with PDF URL
                await snap.ref.update({
                    pdfUrl,
                    pdfGeneratedAt: admin.firestore.FieldValue.serverTimestamp(),
                    pdf_storage_path: fileName
                });

                console.log(`Rectification PDF generated for ${invoice.fullNumber}: ${pdfUrl}`);

                return null;
            } catch (error) {
                console.error('Error generating rectification PDF:', error);
                return null;
            }
        }

        return null;
    });

/**
 * Sync Invoice to Tax Vault
 * 
 * Triggered when an invoice is issued
 * Automatically adds invoice amounts to the corresponding tax vault entry
 * 
 * @region europe-west1
 */
export const syncInvoiceToTaxVault = functions
    .region('europe-west1')
    .firestore.document('invoices/{invoiceId}')
    .onUpdate(async (change, context) => {
        const newData = change.after.data();
        const previousData = change.before.data();

        // Only process when status changes to ISSUED
        if (newData.status === 'ISSUED' && previousData.status === 'DRAFT') {
            try {
                // Extract period from issue date
                const issueDate = newData.issueDate?.toDate
                    ? newData.issueDate.toDate()
                    : new Date(newData.issueDate._seconds * 1000);

                const period = `${issueDate.getFullYear()}-${String(issueDate.getMonth() + 1).padStart(2, '0')}`;
                const taxVaultId = `${newData.franchiseId}_${period}`;
                const taxVaultRef = db.collection('tax_vault').doc(taxVaultId);

                await db.runTransaction(async (transaction) => {
                    const taxVaultSnap = await transaction.get(taxVaultRef);

                    // Calculate tax totals
                    let ivaRepercutido = 0;
                    newData.taxBreakdown?.forEach((tax: any) => {
                        ivaRepercutido += tax.taxAmount || 0;
                    });

                    if (taxVaultSnap.exists) {
                        const taxVault = taxVaultSnap.data();

                        // Check if month is locked
                        if (taxVault?.isLocked) {
                            console.warn(`Tax vault locked for period ${period}`);
                            return;
                        }

                        // Update existing entry
                        transaction.update(taxVaultRef, {
                            ivaRepercutido: admin.firestore.FieldValue.increment(ivaRepercutido),
                            invoiceIds: admin.firestore.FieldValue.arrayUnion(context.params.invoiceId),
                            updatedAt: admin.firestore.FieldValue.serverTimestamp()
                        });
                    } else {
                        // Create new entry
                        transaction.set(taxVaultRef, {
                            id: taxVaultId,
                            franchiseId: newData.franchiseId,
                            period,
                            ivaRepercutido,
                            ivaSoportado: 0,
                            irpfReserva: 0,
                            isLocked: false,
                            invoiceIds: [context.params.invoiceId],
                            expenseRecordIds: [],
                            createdAt: admin.firestore.FieldValue.serverTimestamp(),
                            updatedAt: admin.firestore.FieldValue.serverTimestamp()
                        });
                    }
                });

                console.log(`Invoice synced to tax vault: ${taxVaultId}`);
                return null;
            } catch (error) {
                console.error('Error syncing invoice to tax vault:', error);
                return null;
            }
        }

        return null;
    });

/**
 * Cleanup Tax Vault and Storage on Invoice Deletion
 * 
 * Triggered when an invoice is deleted (forced or draft)
 * 1. Removes amount from Tax Vault if it was ISSUED
 * 2. Deletes PDF from Storage if it exists
 */
export const onInvoiceDeleted = functions
    .region('europe-west1')
    .firestore.document('invoices/{invoiceId}')
    .onDelete(async (snap, context) => {
        const invoice = snap.data() as Invoice;
        const invoiceId = context.params.invoiceId;

        console.log(`[onInvoiceDeleted] Processing deletion for invoice: ${invoice.fullNumber || invoiceId}`);

        // 1. Cleanup Tax Vault if invoice was ISSUED
        if (invoice.status === 'ISSUED') {
            try {
                // Determine period and taxVaultId
                const issueDate = invoice.issueDate?.toDate
                    ? invoice.issueDate.toDate()
                    : new Date(invoice.issueDate._seconds * 1000);

                const period = `${issueDate.getFullYear()}-${String(issueDate.getMonth() + 1).padStart(2, '0')}`;
                const taxVaultId = `${invoice.franchiseId}_${period}`;
                const taxVaultRef = db.collection('tax_vault').doc(taxVaultId);

                await db.runTransaction(async (transaction) => {
                    const taxVaultSnap = await transaction.get(taxVaultRef);

                    if (taxVaultSnap.exists) {
                        const taxVault = taxVaultSnap.data();

                        // Only update if not locked
                        if (taxVault?.isLocked) {
                            console.warn(`[onInvoiceDeleted] Cannot cleanup: tax vault locked for period ${period}`);
                            return;
                        }

                        // Calculate tax amount to subtract
                        let ivaRepercutidoToRemove = 0;
                        invoice.taxBreakdown?.forEach((tax: any) => {
                            ivaRepercutidoToRemove += tax.taxAmount || 0;
                        });

                        // Update entry
                        transaction.update(taxVaultRef, {
                            ivaRepercutido: admin.firestore.FieldValue.increment(-ivaRepercutidoToRemove),
                            invoiceIds: admin.firestore.FieldValue.arrayRemove(invoiceId),
                            updatedAt: admin.firestore.FieldValue.serverTimestamp()
                        });

                        console.log(`[onInvoiceDeleted] Subtracted ${ivaRepercutidoToRemove} from tax vault ${taxVaultId}`);
                    }
                });
            } catch (error) {
                console.error('[onInvoiceDeleted] Error cleaning up tax vault:', error);
            }
        }

        // 2. Cleanup Storage PDF
        if (invoice.pdf_storage_path) {
            try {
                const file = bucket.file(invoice.pdf_storage_path);
                const [exists] = await file.exists();

                if (exists) {
                    await file.delete();
                    console.log(`[onInvoiceDeleted] Deleted PDF from storage: ${invoice.pdf_storage_path}`);
                }
            } catch (error) {
                console.error('[onInvoiceDeleted] Error deleting PDF from storage:', error);
            }
        }

        return null;
    });

/**
 * Cleanup Deleted Draft Invoices
 * 
 * Scheduled function to delete old DRAFT invoices (older than 30 days)
 * Runs daily at 2 AM
 * 
 * @region europe-west1
 */
export const cleanupDraftInvoices = functions
    .region('europe-west1')
    .pubsub.schedule('0 2 * * *')
    .timeZone('Europe/Madrid')
    .onRun(async (context) => {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 30);

        try {
            const snapshot = await db.collection('invoices')
                .where('status', '==', 'DRAFT')
                .where('createdAt', '<', cutoffDate)
                .get();

            const batch = db.batch();
            snapshot.docs.forEach((doc) => {
                batch.delete(doc.ref);
            });

            await batch.commit();
            console.log(`Deleted ${snapshot.size} old draft invoices`);
            return null;
        } catch (error) {
            console.error('Error cleaning up draft invoices:', error);
            return null;
        }
    });

/**
 * Send Payment Reminders
 * 
 * Scheduled function to send payment reminders for overdue invoices
 * Runs daily at 9 AM
 * 
 * @region europe-west1
 */
export const sendPaymentReminders = functions
    .region('europe-west1')
    .pubsub.schedule('0 9 * * *')
    .timeZone('Europe/Madrid')
    .onRun(async (context) => {
        const today = new Date();
        const overdueThreshold = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

        try {
            const snapshot = await db.collection('invoices')
                .where('status', '==', 'ISSUED')
                .where('paymentStatus', 'in', ['PENDING', 'PARTIAL'])
                .where('dueDate', '<', overdueThreshold)
                .get();

            console.log(`Found ${snapshot.size} overdue invoices`);

            // Group by franchise
            const invoicesByFranchise = new Map<string, any[]>();
            snapshot.docs.forEach((doc) => {
                const invoice = doc.data();
                const franchiseId = invoice.franchiseId;

                if (!invoicesByFranchise.has(franchiseId)) {
                    invoicesByFranchise.set(franchiseId, []);
                }

                invoicesByFranchise.get(franchiseId)!.push({
                    id: doc.id,
                    ...invoice
                });
            });

            // Send reminders for each franchise
            for (const [franchiseId, invoices] of invoicesByFranchise.entries()) {
                // TODO: Send email notification
                console.log(`Payment reminder for franchise ${franchiseId}: ${invoices.length} overdue invoices`);

                // Example: Send email using Firebase Admin SDK or external service
                // await sendPaymentReminderEmail(franchiseId, invoices);
            }

            return null;
        } catch (error) {
            console.error('Error sending payment reminders:', error);
            return null;
        }
    });
