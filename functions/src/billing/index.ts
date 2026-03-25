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
    .onWrite(async (change, context) => {
        const newData = change.after.exists ? change.after.data() : null;
        const previousData = change.before.exists ? change.before.data() : null;

        if (!newData) return null; // Deletion is handled by onInvoiceDeleted

        const isNowValid = newData.status === 'ISSUED' || newData.status === 'RECTIFIED';
        const wasValid = previousData && (previousData.status === 'ISSUED' || previousData.status === 'RECTIFIED');

        // Case 1: Transitioned from invalid to valid (e.g. DRAFT to ISSUED, or newly created as ISSUED/RECTIFIED)
        const isNewlyAdded = isNowValid && !wasValid;
        
        // Case 2: Transitioned from valid to invalid (e.g. ISSUED to VOIDED)
        const isNewlyRemoved = !isNowValid && wasValid;

        if (!isNewlyAdded && !isNewlyRemoved) {
            return null; // Status didn't change relevance for Tax Vault
        }

        try {
            // Extract period from issue date
            const targetData = isNewlyAdded ? newData : previousData;
            if (!targetData) return null; // Should not happen

            const issueDate = targetData.issueDate?.toDate
                ? targetData.issueDate.toDate()
                : new Date(targetData.issueDate._seconds * 1000);

            const period = `${issueDate.getFullYear()}-${String(issueDate.getMonth() + 1).padStart(2, '0')}`;
            const taxVaultId = `${targetData.franchiseId}_${period}`;
            const taxVaultRef = db.collection('tax_vault').doc(taxVaultId);

            await db.runTransaction(async (transaction) => {
                const taxVaultSnap = await transaction.get(taxVaultRef);

                // Calculate tax totals
                let ivaRepercutido = 0;
                targetData.taxBreakdown?.forEach((tax: any) => {
                    ivaRepercutido += tax.taxAmount || 0;
                });

                if (isNewlyRemoved) {
                    // Reverse the addition (subtract)
                    ivaRepercutido = -ivaRepercutido;
                }

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
                        invoiceIds: isNewlyAdded 
                            ? admin.firestore.FieldValue.arrayUnion(context.params.invoiceId)
                            : admin.firestore.FieldValue.arrayRemove(context.params.invoiceId),
                        updatedAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                } else if (isNewlyAdded) {
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

            console.log(`Invoice ${isNewlyAdded ? 'added to' : 'removed from'} tax vault: ${taxVaultId}`);
            return null;
        } catch (error) {
            console.error('Error syncing invoice to tax vault:', error);
            return null;
        }
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

        // 1. Cleanup Tax Vault if invoice was ISSUED or RECTIFIED
        if (invoice.status === 'ISSUED' || invoice.status === 'RECTIFIED') {
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

            // 1.2 Update Financial Summary if it exists
            try {
                // Same period calculated for tax vault
                const issueDate = invoice.issueDate?.toDate
                    ? invoice.issueDate.toDate()
                    : new Date(invoice.issueDate._seconds * 1000);
                const period = `${issueDate.getFullYear()}-${String(issueDate.getMonth() + 1).padStart(2, '0')}`;

                const summaryId = `${invoice.franchiseId}_${period}`;
                const summaryRef = db.collection('financial_summaries').doc(summaryId);

                await db.runTransaction(async (transaction) => {
                    const summarySnap = await transaction.get(summaryRef);
                    if (summarySnap.exists) {
                        const summary = summarySnap.data();

                        // Only update if not locked/approved
                        if (summary?.status === 'approved' || summary?.isLocked || summary?.is_locked) {
                            console.warn(`[onInvoiceDeleted] Cannot update summary: month ${period} is locked/approved`);
                            return;
                        }

                        // Subtract invoice subtotal from revenue
                        const subtotal = invoice.subtotal || 0;

                        // We update all revenue aliases to keep consistency
                        transaction.update(summaryRef, {
                            revenue: admin.firestore.FieldValue.increment(-subtotal),
                            totalIncome: admin.firestore.FieldValue.increment(-subtotal),
                            grossIncome: admin.firestore.FieldValue.increment(-subtotal),
                            updatedAt: admin.firestore.FieldValue.serverTimestamp()
                        });

                        console.log(`[onInvoiceDeleted] Updated financial summary ${summaryId}: subtracted ${subtotal} revenue`);
                    }
                });
            } catch (error) {
                console.error('[onInvoiceDeleted] Error updating financial summary:', error);
            }
        }

        // 2. Delete related payment receipts
        try {
            const paymentsSnapshot = await db.collection('payment_receipts')
                .where('invoiceId', '==', invoiceId)
                .get();

            if (!paymentsSnapshot.empty) {
                const batch = db.batch();
                paymentsSnapshot.docs.forEach(doc => {
                    batch.delete(doc.ref);
                });
                await batch.commit();
                console.log(`[onInvoiceDeleted] Deleted ${paymentsSnapshot.size} related payment receipts for invoice ${invoiceId}`);
            }
        } catch (error) {
            console.error('[onInvoiceDeleted] Error deleting related payment receipts:', error);
        }

        // 3. Create Audit Log
        try {
            await db.collection('audit_logs').add({
                action: 'INVOICE_DELETE',
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                details: {
                    invoiceId: invoiceId,
                    invoiceNumber: invoice.fullNumber,
                    franchiseId: invoice.franchiseId,
                    customerName: invoice.customerSnapshot?.fiscalName || 'Cliente',
                    totalAmount: invoice.total || 0,
                    statusWas: invoice.status,
                    deletedAt: new Date().toISOString(),
                    reason: (invoice as any).deletionReason || 'Automatic cleanup/Manual deletion'
                },
                actorId: 'system-trigger',
                actorRole: 'system',
                userAgent: 'Cloud Function: onInvoiceDeleted'
            });
        } catch (error) {
            console.error('[onInvoiceDeleted] Error creating audit log:', error);
        }

        // 4. Cleanup Storage PDF
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
 * Pre-aggregate Billing Stats
 * 
 * Trigger: Every write to invoices/{invoiceId}
 * Recalculates billing_stats/{franchiseId} with totals, counts by status,
 * aging buckets, and tax summaries. Eliminates expensive client-side O(n) calculations.
 * 
 * @region europe-west1
 */
export const preAggregateBillingStats = functions
    .region('europe-west1')
    .firestore.document('invoices/{invoiceId}')
    .onWrite(async (change, context) => {
        const data = change.after.exists ? change.after.data() : change.before.data();
        if (!data) return null;

        const franchiseId = data.franchiseId;
        if (!franchiseId) return null;

        try {
            // Fetch ALL invoices for this franchise (only active statuses)
            const invoicesSnap = await db.collection('invoices')
                .where('franchiseId', '==', franchiseId)
                .get();

            const now = new Date();
            let totalIssued = 0;
            let totalPaid = 0;
            let totalPending = 0;
            let totalOverdue = 0;
            let countIssued = 0;
            let countPaid = 0;
            let countPending = 0;
            let countOverdue = 0;
            let countVoided = 0;
            let countRectified = 0;
            let ivaRepercutido = 0;
            const aging = { current: 0, d30: 0, d60: 0, d90: 0, d90plus: 0 };

            invoicesSnap.docs.forEach(docSnap => {
                const inv = docSnap.data();
                const status = inv.status;
                const payStatus = inv.paymentStatus;
                const total = inv.total || 0;

                if (status === 'VOIDED' || status === 'DELETED') {
                    if (status === 'VOIDED') countVoided++;
                    return; // No cuentan en métricas financieras
                }

                if (status === 'RECTIFIED') {
                    countRectified++;
                    return; // La rectificativa ya está contada por separado
                }

                if (status === 'ISSUED' || status === 'PAID') {
                    countIssued++;
                    totalIssued += total;

                    // Acumular IVA solo de emitidas/pagadas
                    (inv.taxBreakdown || []).forEach((tax: { taxAmount?: number }) => {
                        ivaRepercutido += tax.taxAmount || 0;
                    });

                    if (payStatus === 'PAID') {
                        countPaid++;
                        totalPaid += total;
                    } else if (payStatus === 'PENDING' || payStatus === 'PARTIAL') {
                        const remaining = total - (inv.paidAmount || 0);
                        totalPending += remaining;
                        countPending++;

                        // Aging bucket
                        const dueDate = inv.dueDate?.toDate
                            ? inv.dueDate.toDate()
                            : inv.dueDate?._seconds
                                ? new Date(inv.dueDate._seconds * 1000)
                                : null;

                        if (dueDate && dueDate < now) {
                            countOverdue++;
                            totalOverdue += remaining;

                            const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
                            if (daysOverdue <= 30) aging.d30 += remaining;
                            else if (daysOverdue <= 60) aging.d60 += remaining;
                            else if (daysOverdue <= 90) aging.d90 += remaining;
                            else aging.d90plus += remaining;
                        } else {
                            aging.current += remaining;
                        }
                    }
                }
            });

            // Write pre-aggregated stats
            const statsRef = db.collection('billing_stats').doc(franchiseId);
            await statsRef.set({
                franchiseId,
                totalIssued,
                totalPaid,
                totalPending,
                totalOverdue,
                countIssued,
                countPaid,
                countPending,
                countOverdue,
                countVoided,
                countRectified,
                ivaRepercutido,
                aging,
                lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
                triggerInvoiceId: context.params.invoiceId
            }, { merge: true });

            console.log(`[preAggregateBillingStats] Updated stats for franchise ${franchiseId}`);
            return null;
        } catch (error) {
            console.error('[preAggregateBillingStats] Error:', error);
            return null;
        }
    });

/**
 * Automated Dunning Process
 * 
 * Scheduled function that sends escalating notifications for overdue invoices:
 * - 7 días vencida → Recordatorio amable
 * - 15 días vencida → Aviso urgente
 * - 30 días vencida → Último aviso + notificación admin
 * - 60+ días vencida → Escalamiento a contabilidad
 * 
 * Runs daily at 9 AM Madrid time
 * @region europe-west1
 */
export const dunningProcess = functions
    .region('europe-west1')
    .pubsub.schedule('0 9 * * *')
    .timeZone('Europe/Madrid')
    .onRun(async () => {
        const now = new Date();

        try {
            // Facturas emitidas con pago pendiente o parcial
            const snapshot = await db.collection('invoices')
                .where('status', '==', 'ISSUED')
                .where('paymentStatus', 'in', ['PENDING', 'PARTIAL'])
                .get();

            if (snapshot.empty) {
                console.log('[dunningProcess] No overdue invoices found');
                return null;
            }

            const batch = db.batch();
            let notificationsCreated = 0;

            for (const docSnap of snapshot.docs) {
                const invoice = docSnap.data();
                const dueDate = invoice.dueDate?.toDate
                    ? invoice.dueDate.toDate()
                    : invoice.dueDate?._seconds
                        ? new Date(invoice.dueDate._seconds * 1000)
                        : null;

                if (!dueDate || dueDate >= now) continue; // No vencida

                const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
                const lastDunningLevel = invoice.dunningLevel || 0;

                let dunningLevel = 0;
                let severity: 'info' | 'warning' | 'error' | 'critical' = 'info';
                let message = '';

                if (daysOverdue >= 60 && lastDunningLevel < 4) {
                    dunningLevel = 4;
                    severity = 'critical';
                    message = `ESCALAMIENTO: Factura ${invoice.fullNumber} vencida hace ${daysOverdue} días. Importe pendiente: ${(invoice.total - (invoice.paidAmount || 0)).toFixed(2)}€. Requiere intervención de contabilidad.`;
                } else if (daysOverdue >= 30 && lastDunningLevel < 3) {
                    dunningLevel = 3;
                    severity = 'error';
                    message = `ÚLTIMO AVISO: Factura ${invoice.fullNumber} vencida hace ${daysOverdue} días. Importe: ${(invoice.total - (invoice.paidAmount || 0)).toFixed(2)}€.`;
                } else if (daysOverdue >= 15 && lastDunningLevel < 2) {
                    dunningLevel = 2;
                    severity = 'warning';
                    message = `Aviso urgente: Factura ${invoice.fullNumber} vencida hace ${daysOverdue} días.`;
                } else if (daysOverdue >= 7 && lastDunningLevel < 1) {
                    dunningLevel = 1;
                    severity = 'info';
                    message = `Recordatorio: La factura ${invoice.fullNumber} está vencida desde hace ${daysOverdue} días.`;
                } else {
                    continue; // Ya se envió la notificación de este nivel
                }

                // Crear notificación para la franquicia
                const notifRef = db.collection('notifications').doc();
                batch.set(notifRef, {
                    userId: invoice.franchiseId,
                    type: 'DUNNING',
                    severity,
                    title: dunningLevel >= 3 ? '⚠️ Factura vencida - Acción requerida' : '📋 Recordatorio de pago',
                    message,
                    metadata: {
                        invoiceId: docSnap.id,
                        invoiceNumber: invoice.fullNumber,
                        daysOverdue,
                        dunningLevel,
                        amountDue: invoice.total - (invoice.paidAmount || 0)
                    },
                    read: false,
                    createdAt: admin.firestore.FieldValue.serverTimestamp()
                });

                // Actualizar nivel de dunning en la factura
                batch.update(docSnap.ref, {
                    dunningLevel,
                    lastDunningAt: admin.firestore.FieldValue.serverTimestamp()
                });

                notificationsCreated++;

                // Si es nivel 3+, notificar también a admins
                if (dunningLevel >= 3) {
                    const adminsSnap = await db.collection('users')
                        .where('role', '==', 'admin')
                        .where('status', '==', 'active')
                        .get();

                    for (const adminDoc of adminsSnap.docs) {
                        const adminNotifRef = db.collection('notifications').doc();
                        batch.set(adminNotifRef, {
                            userId: adminDoc.id,
                            type: 'DUNNING_ADMIN',
                            severity: 'error',
                            title: `🚨 Factura impagada: ${invoice.fullNumber}`,
                            message: `Franquicia ${invoice.franchiseId}: ${message}`,
                            metadata: {
                                invoiceId: docSnap.id,
                                franchiseId: invoice.franchiseId,
                                daysOverdue,
                                dunningLevel
                            },
                            read: false,
                            createdAt: admin.firestore.FieldValue.serverTimestamp()
                        });
                    }
                }
            }

            if (notificationsCreated > 0) {
                await batch.commit();
            }

            console.log(`[dunningProcess] Created ${notificationsCreated} dunning notifications`);
            return null;
        } catch (error) {
            console.error('[dunningProcess] Error:', error);
            return null;
        }
    });
