/**
 * Immutable Invoice Engine (Server-Side)
 * 
 * Core service for creating, issuing, and managing invoices with strict immutability guarantees.
 * All PDF generation happens server-side. Once ISSUED, invoices become read-only.
 * 
 * Key Features:
 * - Immutable invoices after ISSUED status
 * - Server-side PDF generation
 * - Legal serial number generation
 * - Rectification workflow
 * - ACID-compliant transactions
 */

import { db } from '../../lib/firebase';
import { logAction, AUDIT_ACTIONS } from '../../lib/audit';
import { cleanUndefined } from '../../utils/cleanUndefined';
import {
    collection,
    doc,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    runTransaction,
    serverTimestamp,
    query,
    where,
    orderBy,
    getDocs,
    limit,
    QuerySnapshot,
    DocumentData,
    Timestamp
} from 'firebase/firestore';
import type {
    Invoice,
    CreateInvoiceRequest,
    IssueInvoiceRequest,
    RectifyInvoiceRequest,
    BillingError,
    CustomerSnapshot,
    IssuerSnapshot,
    InvoiceLine,
    TaxBreakdown
} from '../../types/invoicing';
import { InvoiceType, PaymentStatus, InvoiceStatus } from '../../types/invoicing';
import { Result, ok, err } from '../../types/result';
import { ServiceError } from '../../utils/ServiceError';
import { ordersHistoryService } from '../ordersHistoryService';

const INVOICES_COLLECTION = 'invoices';
const INVOICE_COUNTERS_COLLECTION = 'invoice_counters';

/**
 * Helper: Calculate tax breakdown from invoice lines
 */
function calculateTaxBreakdown(lines: InvoiceLine[]): TaxBreakdown[] {
    const taxMap = new Map<number, { base: number; tax: number }>();

    lines.forEach(line => {
        const existing = taxMap.get(line.taxRate) || { base: 0, tax: 0 };
        taxMap.set(line.taxRate, {
            base: existing.base + line.amount,
            tax: existing.tax + line.taxAmount
        });
    });

    return Array.from(taxMap.entries()).map(([taxRate, { base, tax }]) => ({
        taxRate,
        taxableBase: base,
        taxAmount: tax
    }));
}

/**
 * Helper: Calculate invoice totals
 */
function calculateTotals(lines: InvoiceLine[]) {
    const subtotal = lines.reduce((sum, line) => sum + line.amount, 0);
    const totalTax = lines.reduce((sum, line) => sum + line.taxAmount, 0);
    const total = subtotal + totalTax;

    return { subtotal, totalTax, total };
}

/**
 * Helper: Generate full invoice number
 */
function generateFullNumber(series: string, number: number): string {
    // Format: YYYY/0001 or R-YYYY/0001
    return `${series}/${String(number).padStart(4, '0')}`;
}

/**
 * Immutable Invoice Engine Service
 */
export const invoiceEngine = {
    /**
     * Create a new DRAFT invoice
     * Draft invoices are editable and can be deleted
     */
    createDraft: async (
        request: CreateInvoiceRequest,
        createdBy: string
    ): Promise<Result<string, BillingError>> => {
        try {
            const {
                franchiseId,
                customerId,
                customerType,
                issueDate,
                dueDate,
                items,
                logisticsData
            } = request;

            // Validate customer exists and get snapshot
            const customerRef = doc(db, customerType === 'FRANCHISE' ? 'franchises' : 'restaurants', customerId);
            const customerSnap = await getDoc(customerRef);

            if (!customerSnap.exists()) {
                return err({
                    type: 'VALIDATION_ERROR',
                    field: 'customerId',
                    message: `Customer not found in ${customerType}`
                });
            }

            const customerData = customerSnap.data();
            const customerSnapshot: CustomerSnapshot = {
                id: customerId,
                fiscalName: customerData.fiscalName || customerData.displayName || customerData.name || 'Sin nombre',
                cif: customerData.cif || customerData.vatNumber || 'N/A',
                address: customerData.address || {
                    street: '',
                    city: '',
                    zipCode: '',
                    province: '',
                    country: 'ES'
                },
                email: customerData.email || '',
                phone: customerData.phone || ''
            };

            // Check for duplicate invoices (same customer + same month/year)
            const issueDateObj = issueDate ? new Date(issueDate) : new Date();
            const month = issueDateObj.getMonth();
            const year = issueDateObj.getFullYear();

            // Calculate start and end of month
            const monthStart = new Date(year, month, 1);
            const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);

            const existingInvoicesQuery = query(
                collection(db, INVOICES_COLLECTION),
                where('franchiseId', '==', franchiseId),
                where('customerId', '==', customerId),
                where('status', 'in', ['DRAFT', 'ISSUED']),
                where('issueDate', '>=', monthStart),
                where('issueDate', '<=', monthEnd),
                limit(1)
            );

            const existingInvoicesSnap = await getDocs(existingInvoicesQuery);

            if (!existingInvoicesSnap.empty) {
                const existingInvoice = existingInvoicesSnap.docs[0].data();
                console.warn('[invoiceEngine] Duplicate invoice detected:', {
                    customerId,
                    month: month + 1,
                    year,
                    existingInvoiceNumber: existingInvoice.fullNumber
                });

                return err({
                    type: 'DUPLICATE_INVOICE',
                    franchiseId,
                    customerId,
                    period: `${month + 1}/${year}`,
                    existingInvoiceNumber: existingInvoice.fullNumber
                });
            }

            interface FranchiseData {
                legalName?: string;
                fiscalName?: string;
                businessName?: string;
                displayName?: string;
                name?: string;
                cif?: string;
                vatNumber?: string;
                taxId?: string;
                phone?: string;
                phoneNumber?: string;
                mobile?: string;
                contactPhone?: string;
                address?: string | {
                    street?: string;
                    city?: string;
                    zipCode?: string;
                    province?: string;
                    country?: string;
                };
                city?: string;
                zipCode?: string;
                province?: string;
                country?: string;
                location?: string;
                email?: string;
                operationalEmail?: string;
                role?: string;
            }

            // Get franchise issuer data (Robust lookup: Doc ID, Field lookup, and Case-insensitivity)
            let franchiseData: FranchiseData | null = null;
            let finalIssuerId = franchiseId;

            // 1. Try direct document lookup in 'franchises'
            const franchiseRef = doc(db, 'franchises', franchiseId);
            const franchiseSnap = await getDoc(franchiseRef);

            if (franchiseSnap.exists()) {
                const rawData = franchiseSnap.data() as FranchiseData;
                // Only use franchises doc if it has meaningful company data
                const hasCompanyData = rawData.legalName || rawData.fiscalName || rawData.displayName || rawData.businessName || rawData.name;
                if (hasCompanyData) {
                    franchiseData = rawData;
                }
            }

            if (!franchiseData) {
                // 2. Try direct document lookup in 'users'
                const userRef = doc(db, 'users', franchiseId);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists() && userSnap.data()?.role === 'franchise') {
                    franchiseData = userSnap.data() as FranchiseData;
                }
            }

            if (!franchiseData) {
                // 3. Try searching by franchiseId field (slug) - Crucial for historical consistency
                const usersRef = collection(db, 'users');
                const q = query(
                    usersRef,
                    where('role', '==', 'franchise'),
                    where('franchiseId', '==', franchiseId),
                    limit(1)
                );
                const querySnap = await getDocs(q);

                if (!querySnap.empty) {
                    franchiseData = querySnap.docs[0].data() as FranchiseData;
                    finalIssuerId = querySnap.docs[0].id; // Use actual UID
                }
            }

            // 4. Final fallback: case-insensitive slug lookup
            if (!franchiseData && franchiseId === franchiseId.toUpperCase()) {
                const q = query(
                    collection(db, 'users'),
                    where('role', '==', 'franchise'),
                    where('franchiseId', '==', franchiseId.toLowerCase()),
                    limit(1)
                );
                const querySnap = await getDocs(q);
                if (!querySnap.empty) {
                    franchiseData = querySnap.docs[0].data() as FranchiseData;
                    finalIssuerId = querySnap.docs[0].id;
                }
            }

            if (!franchiseData) {
                console.error(`[invoiceEngine] Failed to find issuer for franchiseId: ${franchiseId}`);
                return err({
                    type: 'VALIDATION_ERROR',
                    field: 'franchiseId',
                    message: `Franchise/Issuer not found for ID: ${franchiseId}`
                });
            }

            // DEBUG: Ver qué datos tiene el usuario
            console.log('[invoiceEngine] Franchise data fields:', Object.keys(franchiseData));
            console.log('[invoiceEngine] legalName:', franchiseData.legalName);
            console.log('[invoiceEngine] fiscalName:', franchiseData.fiscalName);
            console.log('[invoiceEngine] displayName:', franchiseData.displayName);
            console.log('[invoiceEngine] name:', franchiseData.name);
            console.log('[invoiceEngine] cif:', franchiseData.cif);
            console.log('[invoiceEngine] phone:', franchiseData.phone);
            console.log('[invoiceEngine] phoneNumber:', franchiseData.phoneNumber);
            console.log('[invoiceEngine] address:', franchiseData.address);

            // Razón Social (legalName tiene prioridad, luego fiscalName, displayName, businessName, name)
            const fiscalName = (franchiseData.legalName ||
                franchiseData.fiscalName ||
                franchiseData.businessName ||
                franchiseData.displayName ||
                franchiseData.name) as string;

            // Si no hay razón social o está marcada como pendiente, bloquear
            if (!fiscalName || fiscalName.trim() === '' || fiscalName.includes('CONFIGURAR') || fiscalName.includes('PENDIENTE')) {
                console.error('[invoiceEngine] ERROR: No fiscalName found in franchise data');
                console.error('[invoiceEngine] Available fields:', Object.keys(franchiseData));
                console.error('[invoiceEngine] Please configure company data in Configuración > Empresa');
                throw new Error('COMPANY_DATA_MISSING:fiscalName');
            }

            // CIF/NIF (sin fallback - es obligatorio)
            const cif = (franchiseData.cif || franchiseData.vatNumber || franchiseData.taxId) as string;
            if (!cif || cif.trim() === '' || cif === 'PENDIENTE' || cif === 'B00000000') {
                console.error('[invoiceEngine] ERROR: No CIF found in franchise data');
                throw new Error('COMPANY_DATA_MISSING:cif');
            }

            // Teléfono (es obligatorio para facturas)
            const phone = (franchiseData.phone || franchiseData.phoneNumber || franchiseData.mobile || franchiseData.contactPhone) as string;
            if (!phone || phone.trim() === '' || phone === 'PENDIENTE' || phone === '000000000') {
                console.error('[invoiceEngine] ERROR: No phone found in franchise data');
                throw new Error('COMPANY_DATA_MISSING:phone');
            }

            // Dirección completa (con fallback)
            let addressStr = '';
            if (franchiseData.address) {
                if (typeof franchiseData.address === 'string') {
                    addressStr = franchiseData.address;
                } else if (franchiseData.address && typeof franchiseData.address === 'object' && 'street' in franchiseData.address) {
                    addressStr = franchiseData.address.street || '';
                }
            }
            // Si no hay dirección, usar ciudad o fallback
            if (!addressStr || addressStr.trim() === '') {
                addressStr = (franchiseData.city || franchiseData.location || 'Sin dirección') as string;
                console.warn('[invoiceEngine] No address found, using fallback:', addressStr);
            }

            // Construir issuerSnapshot con datos validados
            // Manejar address que puede ser string u objeto
            let addressObj;
            if (franchiseData.address && typeof franchiseData.address === 'object' && 'street' in franchiseData.address) {
                addressObj = {
                    street: franchiseData.address.street || addressStr,
                    city: franchiseData.address.city || franchiseData.city || 'N/A',
                    zipCode: franchiseData.address.zipCode || franchiseData.zipCode || 'N/A',
                    province: franchiseData.address.province || franchiseData.province || 'N/A',
                    country: franchiseData.address.country || franchiseData.country || 'España'
                };
            } else {
                addressObj = {
                    street: addressStr,
                    city: franchiseData.city || 'N/A',
                    zipCode: franchiseData.zipCode || 'N/A',
                    province: franchiseData.province || 'N/A',
                    country: franchiseData.country || 'España'
                };
            }

            const issuerSnapshot: IssuerSnapshot = {
                id: finalIssuerId,
                fiscalName: fiscalName,
                cif: cif,
                address: addressObj,
                email: (franchiseData.email || franchiseData.operationalEmail || '') as string,
                phone: phone
            };

            // Calculate lines and totals
            const lines: InvoiceLine[] = items.map((item, index) => {
                const discountAmount = item.discountRate ? item.unitPrice * item.quantity * item.discountRate : 0;
                const amount = (item.unitPrice * item.quantity) - discountAmount;
                const taxAmount = amount * item.taxRate;
                const total = amount + taxAmount;

                return {
                    id: `line_${Date.now()}_${index}`,
                    description: item.description,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    discountRate: item.discountRate,
                    taxRate: item.taxRate,
                    amount,
                    taxAmount,
                    total,
                    logisticsRange: item.logisticsRange
                };
            });

            const { subtotal, total } = calculateTotals(lines);
            const taxBreakdown = calculateTaxBreakdown(lines);

            // Generate draft invoice number (temporary)
            const draftNumber = `DRAFT_${Date.now()}`;

            const invoiceData = {
                franchiseId,
                customerId,
                customerType,
                series: 'DRAFT',
                number: 0,
                fullNumber: draftNumber,
                type: InvoiceType.STANDARD,
                template: request.template || 'modern',  // PDF template selection
                status: 'DRAFT',
                paymentStatus: 'PENDING',
                customerSnapshot: cleanUndefined(customerSnapshot),
                issuerSnapshot: cleanUndefined(issuerSnapshot),
                issueDate: issueDate ? new Date(issueDate) : new Date(),
                dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                lines: cleanUndefined(lines),
                subtotal,
                taxBreakdown: cleanUndefined(taxBreakdown),
                total,
                remainingAmount: total,
                totalPaid: 0,
                logisticsData: logisticsData || null,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                createdBy,

                // Firestore compatibility
                franchise_id: franchiseId,
                customer_id: customerId,
                customer_type: customerType,
                payment_status: 'PENDING',
                remaining_amount: total,
                total_paid: 0,
                created_at: serverTimestamp(),
                updated_at: serverTimestamp(),
                created_by: createdBy
            };

            const docRef = await addDoc(collection(db, INVOICES_COLLECTION), cleanUndefined(invoiceData));

            return ok(docRef.id);
        } catch (error: unknown) {
            const sError = new ServiceError('createDraft', { cause: error });
            console.error('Error creating draft invoice:', sError);
            const errObj = error as Error; // Type assertion for error object
            return err({
                type: 'UNKNOWN_ERROR',
                message: errObj.message || 'Failed to create draft invoice',
                cause: error
            });
        }
    },

    /**
     * Issue a DRAFT invoice
     * Transition to ISSUED status, generate legal number, and create PDF
     * This operation is ATOMIC and irreversible
     */
    issueInvoice: async (
        request: IssueInvoiceRequest
    ): Promise<Result<Invoice, BillingError>> => {
        try {
            const { invoiceId } = request;

            const invoiceRef = doc(db, INVOICES_COLLECTION, invoiceId);

            await runTransaction(db, async (transaction) => {
                const invoiceSnap = await transaction.get(invoiceRef);

                if (!invoiceSnap.exists()) {
                    throw new Error('INVOICE_NOT_FOUND');
                }

                const invoice = invoiceSnap.data() as Invoice;

                if (invoice.status !== 'DRAFT') {
                    throw new Error(`INVOICE_NOT_DRAFT:${invoice.status}`);
                }

                // Determine series based on current year
                const currentYear = new Date().getFullYear();
                const series = `${currentYear}`; // Year-based series (e.g., "2026")

                // Check if ANY invoices exist for this year and franchise BEFORE transaction
                // This ensures we start from 0001 for first invoice of the year
                const invoicesRef = collection(db, INVOICES_COLLECTION);
                const existingInvoicesQuery = query(
                    invoicesRef,
                    where('franchiseId', '==', invoice.franchiseId),
                    where('series', '==', series),
                    where('status', 'in', ['ISSUED', 'RECTIFIED']),
                    orderBy('number', 'desc'),
                    limit(1)
                );
                const existingSnap = await getDocs(existingInvoicesQuery);

                let nextNumber = 1;
                if (!existingSnap.empty) {
                    // Invoices exist for this year - continue sequence
                    const lastInvoice = existingSnap.docs[0].data();
                    nextNumber = (lastInvoice.number || 0) + 1;
                } else {
                    // First invoice of the year - start from 0001
                    nextNumber = 1;
                }

                const fullNumber = generateFullNumber(series, nextNumber);

                // Update invoice to ISSUED
                const updates = {
                    status: 'ISSUED',
                    series,
                    number: nextNumber,
                    fullNumber,
                    issuedAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),

                    // Firestore compatibility
                    issued_at: serverTimestamp(),
                    updated_at: serverTimestamp()
                };

                transaction.update(invoiceRef, updates);

                // Update/create counter for tracking
                const counterRef = doc(db, INVOICE_COUNTERS_COLLECTION, `${invoice.franchiseId}_${series}`);
                transaction.set(counterRef, {
                    franchiseId: invoice.franchiseId,
                    series,
                    lastNumber: nextNumber,
                    firstInvoiceOfYear: existingSnap.empty,
                    updatedAt: serverTimestamp(),
                    updated_at: serverTimestamp()
                }, { merge: true });

                // NOTE: PDF generation is handled automatically by Cloud Function
                // 'generateInvoicePdf' triggers on invoice.status change to ISSUED
            });

            // Fetch updated invoice
            const updatedInvoiceSnap = await getDoc(invoiceRef);
            const updatedInvoice = {
                id: updatedInvoiceSnap.id,
                ...updatedInvoiceSnap.data()
            } as Invoice;

            // NOTE: TaxVault sync is handled automatically by Cloud Function
            // 'syncInvoiceToTaxVault' triggers on invoice.status change to ISSUED

            return ok(updatedInvoice);
        } catch (error: unknown) {
            const sError = new ServiceError('issueInvoice', { cause: error });
            console.error('Error issuing invoice:', sError);
            const errObj = error as Error; // Type assertion for error object

            if (errObj.message === 'INVOICE_NOT_FOUND') {
                return err({
                    type: 'INVOICE_NOT_FOUND',
                    invoiceId: request.invoiceId
                });
            }

            if (errObj.message.startsWith('INVOICE_NOT_DRAFT:')) {
                const currentStatus = errObj.message.split(':')[1] as InvoiceStatus;
                return err({
                    type: 'INVOICE_NOT_DRAFT',
                    invoiceId: request.invoiceId,
                    currentStatus
                });
            }

            return err({
                type: 'UNKNOWN_ERROR',
                message: errObj.message || 'Failed to issue invoice',
                cause: error
            });
        }
    },

    /**
     * Rectify an ISSUED invoice
     * Creates a new rectifying invoice and updates the original to RECTIFIED
     */
    rectifyInvoice: async (
        request: RectifyInvoiceRequest
    ): Promise<Result<{ original: Invoice; rectifying: Invoice }, BillingError>> => {
        try {
            const { invoiceId, reason, rectifiedBy } = request;

            const originalInvoiceRef = doc(db, INVOICES_COLLECTION, invoiceId);

            await runTransaction(db, async (transaction) => {
                const originalSnap = await transaction.get(originalInvoiceRef);

                if (!originalSnap.exists()) {
                    throw new Error('INVOICE_NOT_FOUND');
                }

                const original = originalSnap.data() as Invoice;

                if (original.status !== 'ISSUED') {
                    throw new Error(`INVALID_RECTIFICATION:Invoice must be ISSUED`);
                }

                if (original.rectifyingInvoiceIds && original.rectifyingInvoiceIds.length > 0) {
                    throw new Error('INVOICE_ALREADY_RECTIFIED');
                }

                // Create rectifying invoice
                const currentYear = new Date().getFullYear();
                const rectSeries = `R-${currentYear}`; // Series for rectifying invoices

                // Get next number for rectifying series
                const counterRef = doc(db, INVOICE_COUNTERS_COLLECTION, `${original.franchiseId}_${rectSeries}`);
                const counterSnap = await transaction.get(counterRef);

                let nextNumber = 1;
                if (counterSnap.exists()) {
                    nextNumber = (counterSnap.data()?.lastNumber || 0) + 1;
                }

                const rectFullNumber = generateFullNumber(rectSeries, nextNumber);

                // Create rectifying lines (negative amounts)
                const rectLines: InvoiceLine[] = original.lines.map((line, index) => ({
                    ...line,
                    id: `rect_line_${Date.now()}_${index}`,
                    amount: -line.amount,
                    taxAmount: -line.taxAmount,
                    total: -line.total
                }));

                const { subtotal, total } = calculateTotals(rectLines);
                const taxBreakdown = calculateTaxBreakdown(rectLines);

                const rectifyingData = {
                    franchiseId: original.franchiseId,
                    customerId: original.customerId,
                    customerType: original.customerType,
                    series: rectSeries,
                    number: nextNumber,
                    fullNumber: rectFullNumber,
                    type: InvoiceType.RECTIFICATIVE,
                    status: 'ISSUED',
                    paymentStatus: 'PENDING',
                    customerSnapshot: original.customerSnapshot,
                    issuerSnapshot: original.issuerSnapshot,
                    issueDate: new Date(),
                    dueDate: original.dueDate,
                    originalInvoiceId: invoiceId,
                    rectificationReason: reason,
                    lines: rectLines,
                    subtotal,
                    taxBreakdown,
                    total,
                    remainingAmount: -total, // Negative, so this represents a credit
                    totalPaid: 0,
                    issuedAt: serverTimestamp(),
                    rectifiedAt: serverTimestamp(),
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                    createdBy: rectifiedBy,

                    // Firestore compatibility
                    original_invoice_id: invoiceId,
                    rectification_reason: reason,
                    remaining_amount: -total,
                    total_paid: 0,
                    issued_at: serverTimestamp(),
                    rectified_at: serverTimestamp(),
                    created_at: serverTimestamp(),
                    updated_at: serverTimestamp(),
                    created_by: rectifiedBy
                };

                const rectifyingRef = await addDoc(collection(db, INVOICES_COLLECTION), rectifyingData);

                // Update original invoice
                transaction.update(originalInvoiceRef, {
                    status: 'RECTIFIED',
                    rectifyingInvoiceIds: [rectifyingRef.id],
                    rectifiedAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),

                    // Firestore compatibility
                    rectifying_invoice_ids: [rectifyingRef.id],
                    rectified_at: serverTimestamp(),
                    updated_at: serverTimestamp()
                });

                // Update counter
                transaction.set(counterRef, {
                    franchiseId: original.franchiseId,
                    series: rectSeries,
                    lastNumber: nextNumber,
                    updatedAt: serverTimestamp(),
                    updated_at: serverTimestamp()
                }, { merge: true });
            });

            // Fetch updated invoices
            const originalSnap = await getDoc(originalInvoiceRef);
            const original = { id: originalSnap.id, ...originalSnap.data() } as Invoice;

            // Fetch rectifying invoice
            const rectifyingQuery = query(
                collection(db, INVOICES_COLLECTION),
                where('originalInvoiceId', '==', invoiceId)
            );
            const rectifyingSnap = await getDocs(rectifyingQuery);
            const rectifying = {
                id: rectifyingSnap.docs[0].id,
                ...rectifyingSnap.docs[0].data()
            } as Invoice;

            return ok({ original, rectifying });
        } catch (error: unknown) {
            const sError = new ServiceError('rectifyInvoice', { cause: error });
            console.error('Error rectifying invoice:', sError);
            const errObj = error as Error; // Type assertion for error object

            if (errObj.message === 'INVOICE_NOT_FOUND') {
                return err({
                    type: 'INVOICE_NOT_FOUND',
                    invoiceId: request.invoiceId
                });
            }

            if (errObj.message === 'INVOICE_ALREADY_RECTIFIED') {
                return err({
                    type: 'INVOICE_ALREADY_RECTIFIED',
                    invoiceId: request.invoiceId
                });
            }

            if (errObj.message.startsWith('INVALID_RECTIFICATION:')) {
                return err({
                    type: 'INVALID_RECTIFICATION',
                    originalInvoiceId: request.invoiceId,
                    reason: errObj.message.split(':')[1]
                });
            }

            return err({
                type: 'UNKNOWN_ERROR',
                message: errObj.message || 'Failed to rectify invoice',
                cause: error
            });
        }
    },

    /**
     * Update a DRAFT invoice
     * Only DRAFT invoices can be edited
     */
    updateDraft: async (
        invoiceId: string,
        updates: Partial<Invoice>
    ): Promise<Result<void, BillingError>> => {
        try {
            const invoiceRef = doc(db, INVOICES_COLLECTION, invoiceId);
            const invoiceSnap = await getDoc(invoiceRef);

            if (!invoiceSnap.exists()) {
                return err({
                    type: 'INVOICE_NOT_FOUND',
                    invoiceId
                });
            }

            const invoice = invoiceSnap.data() as Invoice;

            if (invoice.status !== 'DRAFT') {
                return err({
                    type: 'INVOICE_NOT_DRAFT',
                    invoiceId,
                    currentStatus: invoice.status
                });
            }

            // Recalculate totals if lines are updated
            if (updates.lines) {
                const { subtotal, total } = calculateTotals(updates.lines);
                const taxBreakdown = calculateTaxBreakdown(updates.lines);

                updates.subtotal = subtotal;
                updates.total = total;
                updates.taxBreakdown = taxBreakdown;
                updates.remainingAmount = total - (updates.totalPaid || 0);
            }

            await updateDoc(invoiceRef, {
                ...updates,
                updatedAt: serverTimestamp(),
                updated_at: serverTimestamp()
            });

            return ok(undefined);
        } catch (error: unknown) {
            const sError = new ServiceError('updateDraft', { cause: error });
            console.error('Error updating draft invoice:', sError);
            const errObj = error as Error; // Type assertion for error object
            return err({
                type: 'UNKNOWN_ERROR',
                message: errObj.message || 'Failed to update draft invoice',
                cause: error
            });
        }
    },

    /**
     * Delete a DRAFT invoice
     * Only DRAFT invoices can be deleted
     */
    deleteDraft: async (
        invoiceId: string
    ): Promise<Result<void, BillingError>> => {
        try {
            const invoiceRef = doc(db, INVOICES_COLLECTION, invoiceId);
            const invoiceSnap = await getDoc(invoiceRef);

            if (!invoiceSnap.exists()) {
                return err({
                    type: 'INVOICE_NOT_FOUND',
                    invoiceId
                });
            }

            const invoice = invoiceSnap.data() as Invoice;

            if (invoice.status !== 'DRAFT') {
                return err({
                    type: 'INVOICE_NOT_DRAFT',
                    invoiceId,
                    currentStatus: invoice.status
                });
            }

            // Delete related data in cascade
            // 1. Delete payment receipts
            const paymentsRef = collection(db, 'payment_receipts');
            const paymentsQuery = query(paymentsRef, where('invoiceId', '==', invoiceId));
            const paymentsSnap = await getDocs(paymentsQuery);

            if (!paymentsSnap.empty) {
                console.log(`[invoiceEngine] Deleting ${paymentsSnap.size} payment receipts for invoice ${invoiceId}`);
                const batch = paymentsSnap.docs.map(docSnap => deleteDoc(docSnap.ref));
                await Promise.all(batch);
            }

            // 2. Delete tax vault entries
            const taxVaultRef = collection(db, 'tax_vault');
            const taxVaultQuery = query(taxVaultRef, where('invoiceId', '==', invoiceId));
            const taxVaultSnap = await getDocs(taxVaultQuery);

            if (!taxVaultSnap.empty) {
                console.log(`[invoiceEngine] Deleting ${taxVaultSnap.size} tax vault entries for invoice ${invoiceId}`);
                const batch = taxVaultSnap.docs.map(docSnap => deleteDoc(docSnap.ref));
                await Promise.all(batch);
            }

            // 3. Finally delete the invoice
            await deleteDoc(invoiceRef);

            console.log(`[invoiceEngine] Invoice ${invoiceId} and all related data deleted successfully`);

            return ok(undefined);
        } catch (error: unknown) {
            const sError = new ServiceError('deleteDraft', { cause: error });
            console.error('Error deleting draft invoice:', sError);
            const errObj = error as Error; // Type assertion for error object
            return err({
                type: 'UNKNOWN_ERROR',
                message: errObj.message || 'Failed to delete draft invoice',
                cause: error
            });
        }
    },

    /**
     * Get invoice by ID
     */
    getInvoice: async (
        invoiceId: string
    ): Promise<Result<Invoice, BillingError>> => {
        try {
            const invoiceRef = doc(db, INVOICES_COLLECTION, invoiceId);
            const invoiceSnap = await getDoc(invoiceRef);

            if (!invoiceSnap.exists()) {
                return err({
                    type: 'INVOICE_NOT_FOUND',
                    invoiceId
                });
            }

            const invoice = {
                id: invoiceSnap.id,
                ...invoiceSnap.data()
            } as Invoice;

            return ok(invoice);
        } catch (error: unknown) {
            const sError = new ServiceError('getInvoice', { cause: error });
            console.error('Error getting invoice:', sError);
            const errObj = error as Error; // Type assertion for error object
            return err({
                type: 'UNKNOWN_ERROR',
                message: errObj.message || 'Failed to get invoice',
                cause: error
            });
        }
    },

    /**
     * Get invoices for a franchise
     */
    getInvoicesByFranchise: async (
        franchiseId: string,
        status?: InvoiceStatus
    ): Promise<Result<Invoice[], BillingError>> => {
        try {
            // Robust ID resolution: find all possible identifying strings for this franchise
            const possibleIds = new Set<string>([franchiseId]);

            // Try to find the user document to get slugs
            const usersRef = collection(db, 'users');
            let userDoc: Record<string, unknown> | null = null;

            // Try by UID
            const userSnap = await getDoc(doc(db, 'users', franchiseId));
            if (userSnap.exists()) {
                userDoc = userSnap.data();
            } else {
                // Try by slug
                const q = query(usersRef, where('franchiseId', '==', franchiseId), limit(1));
                const qs = await getDocs(q);
                if (!qs.empty) {
                    userDoc = qs.docs[0].data();
                    possibleIds.add(qs.docs[0].id); // Add UID
                } else if (franchiseId === franchiseId.toUpperCase()) {
                    // Try case-insensitive slug
                    const q2 = query(usersRef, where('franchiseId', '==', franchiseId.toLowerCase()), limit(1));
                    const qs2 = await getDocs(q2);
                    if (!qs2.empty) {
                        userDoc = qs2.docs[0].data();
                        possibleIds.add(qs2.docs[0].id); // Add UID
                    }
                }
            }

            if (userDoc?.franchiseId && typeof userDoc.franchiseId === 'string') {
                possibleIds.add(userDoc.franchiseId);
                possibleIds.add(userDoc.franchiseId.toUpperCase());
                possibleIds.add(userDoc.franchiseId.toLowerCase());
                possibleIds.add(userDoc.franchiseId.trim());
            }

            const ids = Array.from(possibleIds);
            const invoicesCollection = collection(db, INVOICES_COLLECTION);

            let q;
            if (ids.length === 1) {
                // Check in both fields for maximum robustness
                q = query(
                    invoicesCollection,
                    where('franchiseId', '==', ids[0]),
                    orderBy('issueDate', 'desc')
                );
            } else {
                q = query(
                    invoicesCollection,
                    where('franchiseId', 'in', ids),
                    orderBy('issueDate', 'desc')
                );
            }

            if (status) {
                if (ids.length === 1) {
                    q = query(
                        invoicesCollection,
                        where('franchiseId', '==', ids[0]),
                        where('status', '==', status),
                        orderBy('issueDate', 'desc')
                    );
                } else {
                    q = query(
                        invoicesCollection,
                        where('franchiseId', 'in', ids),
                        where('status', '==', status),
                        orderBy('issueDate', 'desc')
                    );
                }
            }

            const querySnap = await getDocs(q);
            const invoices = querySnap.docs.map(docSnap => ({
                id: docSnap.id,
                ...docSnap.data()
            } as Invoice));

            return ok(invoices);
        } catch (error: unknown) {
            const sError = new ServiceError('getInvoicesByFranchise', { cause: error });
            console.error('Error getting invoices:', sError);
            const errObj = error as Error;
            return err({
                type: 'UNKNOWN_ERROR',
                message: errObj.message || 'Failed to get invoices',
                cause: error
            });
        }
    },

    getInvoicesByCustomer: async (
        franchiseId: string,
        customerId: string
    ): Promise<Result<Invoice[], BillingError>> => {
        try {
            const possibleIds = new Set<string>([franchiseId]);
            const usersRef = collection(db, 'users');
            let userDoc: Record<string, unknown> | null = null;

            const userSnap = await getDoc(doc(db, 'users', franchiseId));
            if (userSnap.exists()) {
                userDoc = userSnap.data();
            } else {
                const q = query(usersRef, where('franchiseId', '==', franchiseId), limit(1));
                const qs = await getDocs(q);
                if (!qs.empty) {
                    userDoc = qs.docs[0].data();
                    possibleIds.add(qs.docs[0].id);
                }
            }

            if (userDoc?.franchiseId && typeof userDoc.franchiseId === 'string') {
                possibleIds.add(userDoc.franchiseId);
            }

            const ids = Array.from(possibleIds);
            const invoicesCollection = collection(db, INVOICES_COLLECTION);

            let q;
            if (ids.length === 1) {
                q = query(
                    invoicesCollection,
                    where('franchiseId', '==', ids[0]),
                    where('customerId', '==', customerId),
                    orderBy('issueDate', 'desc')
                );
            } else {
                q = query(
                    invoicesCollection,
                    where('franchiseId', 'in', ids),
                    where('customerId', '==', customerId),
                    orderBy('issueDate', 'desc')
                );
            }

            const querySnap = await getDocs(q);
            const invoices = querySnap.docs.map(docSnap => ({
                id: docSnap.id,
                ...docSnap.data()
            } as Invoice));

            return ok(invoices);
        } catch (error: unknown) {
            const sError = new ServiceError('getInvoicesByCustomer', { cause: error });
            console.error('Error getting customer invoices:', sError);
            const errObj = error as Error;
            return err({
                type: 'UNKNOWN_ERROR',
                message: errObj.message || 'Failed to get customer invoices',
                cause: error
            });
        }
    },

    getCustomerStats: async (
        franchiseId: string,
        customerId: string
    ): Promise<Result<{
        totalInvoiced: number;
        totalPaid: number;
        totalPending: number;
        invoiceCount: number;
        lastInvoiceDate?: Date;
    }, BillingError>> => {
        try {
            const result = await invoiceEngine.getInvoicesByCustomer(franchiseId, customerId);
            if (!result.success) return err(result.error);

            const invoices = result.data;
            let totalInvoiced = 0;
            let totalPaid = 0;
            let lastInvoiceDate: Date | undefined;

            for (const invoice of invoices) {
                if (invoice.status !== InvoiceStatus.RECTIFIED) {
                    totalInvoiced += invoice.total;
                    totalPaid += invoice.totalPaid || 0;
                    const issueDate = invoice.issueDate instanceof Timestamp
                        ? invoice.issueDate.toDate()
                        : new Date(invoice.issueDate as Date);
                    if (!lastInvoiceDate || issueDate > lastInvoiceDate) {
                        lastInvoiceDate = issueDate;
                    }
                }
            }

            return ok({
                totalInvoiced,
                totalPaid,
                totalPending: totalInvoiced - totalPaid,
                invoiceCount: invoices.length,
                lastInvoiceDate
            });
        } catch (error: unknown) {
            const errObj = error as Error;
            return err({
                type: 'UNKNOWN_ERROR',
                message: errObj.message || 'Failed to get customer stats',
                cause: error
            });
        }
    },

    /**
     * Get total invoiced income and orders breakdown for a specific month
     * 
     * ## Overview
     * This method is the core of the Financial Closure synchronization system.
     * It queries invoices from Firestore, extracts billing data, and returns
     * a structured breakdown suitable for auto-populating financial closures.
     * 
     * ## Data Extraction Strategy
     * 
     * The method attempts to extract order counts from invoices in this priority order:
     * 
     * 1. **logisticsData.ranges** (preferred): Structured data with range IDs and units
     *    Example: { id: "range_0_4", name: "0-4km", units: 200 }
     * 
     * 2. **Invoice lines with logisticsRange**: Line items with explicit range identifiers
     *    Example: { description: "Servicio 0-4km", logisticsRange: "0-4km", units: 200 }
     * 
     * 3. **Invoice lines with range in description**: Parses description text for range patterns
     *    Supported patterns:
     *    - "0-4km", "0 - 4 km", "4.1-5km"
     *    - "rango 0-4", "distancia 0-4"
     *    - ">7km", "mas de 7"
     * 
     * 4. **Reconstruction fallback**: If no order data found, queries orders_history
     *    to reconstruct counts from real delivered orders (requires Firestore index)
     * 
     * ## ID Resolution
     * 
     * The method implements robust franchise ID resolution to handle various ID formats:
     * - Direct document ID (UID)
     * - Franchise slug/name (case-insensitive)
     * - City name (title case variations)
     * - Multiple field mappings (franchiseId, uid, franchise_id)
     * 
     * ## Range Normalization
     * 
     * Extracted ranges are normalized to standard UI format:
     * - "0-4 km", "4-5 km", "5-6 km", "6-7 km", ">7 km"
     * 
     * Handles variations like "4.1-5", "0 - 4 km", "4-5km", etc.
     * 
     * @param franchiseId - Franchise identifier (slug, UID, or name)
     * @param month - Month in YYYY-MM format (e.g., "2026-02")
     * @returns Object with subtotal, total, and ordersDetail by range
     * @example
     * ```typescript
     * const result = await invoiceEngine.getInvoicedIncomeForMonth(
     *   "SMHPADJQMXWX4WHVKZWT9VWWP822", 
     *   "2026-02"
     * );
     * // Returns:
     * // {
     * //   subtotal: 1200,
     * //   total: 1452,
     * //   ordersDetail: { "0-4 km": 200 }
     * // }
     * ```
     * 
     * @see RevenueStep Component that displays the invoiced data
     * @see FinancialControlCenter for the auto-population logic
     * @see normalizeRangeKey function for range parsing patterns
     */
    getInvoicedIncomeForMonth: async (
        franchiseId: string,
        month: string // YYYY-MM
    ): Promise<{ subtotal: number; total: number; ordersDetail: Record<string, number>; error?: string }> => {
        const initialAcc = {
            subtotal: 0,
            total: 0,
            ordersDetail: {} as Record<string, number>
        };

        try {
            const [year, monthNum] = month.split('-').map(Number);
            const startDate = new Date(year, monthNum - 1, 1);
            const endDate = new Date(year, monthNum, 0, 23, 59, 59);

            // Log essential info for troubleshooting (can be disabled in production)
            console.log(`[invoiceEngine] Processing: franchiseId=${franchiseId}, month=${month}`);

            // Robust ID resolution
            const possibleIds = new Set<string>([franchiseId, franchiseId.toLowerCase(), franchiseId.toUpperCase()]);

            // 1. Try to get doc by index (slug or UID)
            const usersRef = collection(db, 'users');
            const userSnap = await getDoc(doc(db, 'users', franchiseId));

            if (userSnap.exists()) {
                const data = userSnap.data();
                possibleIds.add(userSnap.id);
                if (data.franchiseId) possibleIds.add(data.franchiseId as string);
                if (data.uid) possibleIds.add(data.uid as string);
            }

            // 2. Search for common matches in users (name, display name, city, etc)
            // This handles cases where 'benavente' is passed but the document ID is a UID
            const searchFields = ['franchiseId', 'name', 'displayName', 'city', 'uid'];
            const searchQueries = searchFields.map(field =>
                query(usersRef, where(field, '==', franchiseId))
            );
            // Also try title case / upper case for name/city
            const titleCase = franchiseId.charAt(0).toUpperCase() + franchiseId.slice(1).toLowerCase();
            searchQueries.push(query(usersRef, where('city', '==', titleCase)));
            searchQueries.push(query(usersRef, where('name', '==', titleCase)));

            const searchSnaps = await Promise.all(searchQueries.map(q => getDocs(q)));
            searchSnaps.forEach((qs) => {
                qs.docs.forEach(d => {
                    const data = d.data();
                    possibleIds.add(d.id);
                    if (typeof data.franchiseId === 'string') possibleIds.add(data.franchiseId);
                    if (typeof data.uid === 'string') possibleIds.add(data.uid);
                    if (typeof data.franchise_id === 'string') possibleIds.add(data.franchise_id);
                });
            });

            const ids = Array.from(possibleIds).filter(id => typeof id === 'string' && id.length > 0);
            const invoicesCollection = collection(db, INVOICES_COLLECTION);

            // Perform queries to support both franchiseId and franchise_id fields
            // Removed issueDate filters to avoid requiring composite indexes (filtering in memory instead)
            const queries = ids.map(id => [
                query(invoicesCollection, where('franchiseId', '==', id)),
                query(invoicesCollection, where('franchise_id', '==', id))
            ]).flat();

            const querySnaps = await Promise.all(queries.map(q => getDocs(q).catch((_e: Error) => {
                console.warn('[invoiceEngine] Query partially failed:', _e.message);
                return { docs: [] } as unknown as QuerySnapshot<DocumentData>;
            })));

            const rawDocs = querySnaps.flatMap((qs: QuerySnapshot<DocumentData>) => qs.docs || []);

            // Memory filter for status and date
            const allDocs = rawDocs.filter((d) => {
                const data = d.data();
                return data.status === 'ISSUED';
            });

            // Log invoice discovery for troubleshooting
            if (allDocs.length > 0) {
                console.log(`[invoiceEngine] Found ${allDocs.length} invoices:`,
                    allDocs.map((d) => ({
                        id: d.id,
                        number: (d.data() as Invoice).fullNumber,
                        subtotal: (d.data() as Invoice).subtotal
                    }))
                );
            }

            // Remove duplicates (by document ID) if any
            const uniqueDocsMap = new Map();
            allDocs.forEach((d) => uniqueDocsMap.set(d.id, d));
            const uniqueDocs = Array.from(uniqueDocsMap.values());

            // Range normalization map
            const rangeMapper: Record<string, string> = {
                'range_0_4': '0-4 km',
                'range_4_5': '4-5 km',
                'range_5_6': '5-6 km',
                'range_6_7': '6-7 km',
                'range_gt_7': '>7 km'
            };

            const finalIncome = uniqueDocs.reduce((acc, doc) => {
                const data = doc.data();

                // Memory filtering for date range
                const issueField = data.issueDate || data.issuedAt || data.issued_at;
                if (!issueField) {
                    console.log(`[invoiceEngine] Debug: Skipping invoice ${doc.id} - No issue date field found`);
                    return acc;
                }

                // Ultra-robust date parsing
                let issueDate: Date;
                try {
                    if (typeof issueField === 'object' && issueField !== null && 'toDate' in issueField && typeof (issueField as { toDate: () => Date }).toDate === 'function') {
                        issueDate = (issueField as { toDate: () => Date }).toDate();
                    } else if (typeof issueField === 'object' && issueField !== null && 'seconds' in issueField && typeof (issueField as { seconds: number }).seconds === 'number') {
                        issueDate = new Date((issueField as { seconds: number }).seconds * 1000);
                    } else if (typeof issueField === 'object' && issueField !== null && 'value' in issueField && (typeof (issueField as { value: string | number }).value === 'string' || typeof (issueField as { value: string | number }).value === 'number')) {
                        issueDate = new Date((issueField as { value: string | number }).value);
                    } else {
                        issueDate = new Date(issueField as string | number | Date);
                    }
                } catch {
                    console.error('[invoiceEngine] Failed to parse date for invoice:', doc.id, issueField);
                    return acc;
                }

                if (isNaN(issueDate.getTime())) {
                    console.error('[invoiceEngine] Invalid date result for invoice:', doc.id, issueField);
                    return acc;
                }

                if (issueDate < startDate || issueDate > endDate) {
                    console.log(`[invoiceEngine] Debug: Skipping invoice ${doc.id} (Date: ${issueDate.toISOString()} is outside range ${startDate.toISOString()} - ${endDate.toISOString()})`);
                    return acc;
                }

                console.log(`[invoiceEngine] Debug: ✅ MATCH found! Invoice ${doc.id} (${data.fullNumber}) - Subtotal: ${data.subtotal}`);

                const subtotal = Number(data.subtotal) || 0;
                const total = Number(data.total) || 0;

                // Extraction helper to normalize keys
                const normalizeRangeKey = (key: string): string | null => {
                    if (!key) return null;
                    const k = key.toLowerCase().replace(/\s/g, '');
                    if (k.includes('0-4')) return '0-4 km';
                    if (k.includes('4-5') || k.includes('4.1-5')) return '4-5 km';
                    if (k.includes('5-6') || k.includes('5.1-6')) return '5-6 km';
                    if (k.includes('6-7') || k.includes('6.1-7')) return '6-7 km';
                    if (k.includes('>7') || k.includes('masde7') || k.includes('gt7')) return '>7 km';

                    // If doesn't match standard, return null to allow fallback
                    return null;
                };

                // Aggregate orders from logisticsData if present
                if (data.logisticsData?.ranges) {
                    console.log(`[invoiceEngine] Debug: Extracting ranges for ${doc.id}:`, data.logisticsData.ranges);
                    data.logisticsData.ranges.forEach((r: { id: string; name: string; units: number }) => {
                        const uiKey = rangeMapper[r.id] || normalizeRangeKey(r.id) || normalizeRangeKey(r.name);
                        console.log(`[invoiceEngine] Debug:   Range ${r.id} -> ${uiKey} (${r.units} units)`);
                        if (uiKey) {
                            acc.ordersDetail[uiKey] = (acc.ordersDetail[uiKey] || 0) + (Number(r.units) || 0);
                        }
                    });
                } else if (data.lines) {
                    console.log(`[invoiceEngine] Debug: Extracting lines for ${doc.id}:`, data.lines);
                    data.lines.forEach((l: { logisticsRange?: string; description?: string; units?: number; quantity?: number }) => {
                        const rangeId = l.logisticsRange || '';
                        const description = l.description || '';

                        let uiKey = rangeMapper[rangeId] || normalizeRangeKey(rangeId);

                        // If no key from rangeId, try to extract from description
                        if (!uiKey && description) {
                            // Try multiple patterns: "0-4km", "0 - 4 km", "4.1-5km", etc.
                            const patterns = [
                                /(\d+(?:\.\d+)?)\s*-\s*(\d+)\s*km/i,  // 0-4km, 0 - 4 km, 4.1-5km
                                /(\d+(?:\.\d+)?)\s*-\s*(\d+)\s*kilometros/i,  // with full word
                                /rango\s+(\d+(?:\.\d+)?)\s*-\s*(\d+)/i,  // "rango 0-4"
                                /(>\s*7)\s*km/i,  // >7km
                                /mas\s+de\s*7/i,  // mas de 7
                                /distancia\s+(\d+(?:\.\d+)?)\s*-\s*(\d+)/i  // "distancia 0-4"
                            ];

                            for (const pattern of patterns) {
                                const match = description.match(pattern);
                                if (match) {
                                    // Reconstruct the range string and normalize
                                    const rangeStr = match[1] && match[2]
                                        ? `${match[1]}-${match[2]}km`
                                        : match[0];
                                    uiKey = normalizeRangeKey(rangeStr);
                                    if (uiKey) break;
                                }
                            }

                            // Last resort: try normalizeRangeKey on full description
                            if (!uiKey) {
                                uiKey = normalizeRangeKey(description);
                            }
                        }

                        console.log(`[invoiceEngine] Debug:   Line rangeId='${rangeId}' desc='${description}' -> uiKey='${uiKey}'`);

                        if (uiKey) {
                            acc.ordersDetail[uiKey] = (acc.ordersDetail[uiKey] || 0) + (Number(l.units || l.quantity) || 0);
                        } else {
                            // If we can't determine the range, put it in a special bucket
                            console.log(`[invoiceEngine] Debug:   Line couldn't be mapped to a range, putting in 'Otros'`);
                            acc.ordersDetail['Otros'] = (acc.ordersDetail['Otros'] || 0) + (Number(l.units || l.quantity) || 0);
                        }
                    });
                }

                return {
                    subtotal: acc.subtotal + subtotal,
                    total: acc.total + total,
                    ordersDetail: acc.ordersDetail
                };
            }, initialAcc);

            // --- RECONSTRUCTION FALLBACK ---
            const totalInvoicedOrders = (Object.values(finalIncome.ordersDetail) as number[]).reduce((sum: number, val: number) => sum + val, 0);

            // Smart threshold: if we have no order details at all, always reconstruct
            // Otherwise use a reasonable threshold (5€ per order is more realistic for logistics)
            const subtotalPerOrderThreshold = 5;
            const shouldReconstruct = finalIncome.subtotal > 0 && (
                totalInvoicedOrders === 0 || // No order data at all
                totalInvoicedOrders < (finalIncome.subtotal / subtotalPerOrderThreshold) // Suspiciously few orders
            );

            console.log(`[invoiceEngine] Reconstruction check: Subtotal=${finalIncome.subtotal}, Orders=${totalInvoicedOrders}, Threshold=${subtotalPerOrderThreshold}, ShouldReconstruct=${shouldReconstruct}`);

            if (shouldReconstruct) {
                console.log(`[invoiceEngine] Reconstruction: Triggering order breakdown fallback for ${franchiseId}`);
                console.log(`[invoiceEngine] Reconstruction: Date range ${startDate.toISOString()} - ${endDate.toISOString()}`);

                try {
                    const orders = await ordersHistoryService.getOrdersByDateRange(startDate, endDate, franchiseId);
                    console.log(`[invoiceEngine] Reconstruction: Fetched ${orders.length} real orders for reconciliation`);

                    if (orders.length === 0) {
                        console.warn(`[invoiceEngine] Reconstruction: No orders found in date range for franchise ${franchiseId}`);
                    }

                    orders.forEach(order => {
                        if (order.status !== 'finished') {
                            console.log(`[invoiceEngine] Reconstruction: Skipping order ${order.id} - status=${order.status}`);
                            return;
                        }

                        const distance = Number(order.distance) || 0;
                        let uiKey = '';
                        if (distance <= 4) uiKey = '0-4 km';
                        else if (distance <= 5) uiKey = '4-5 km';
                        else if (distance <= 6) uiKey = '5-6 km';
                        else if (distance <= 7) uiKey = '6-7 km';
                        else uiKey = '>7 km';

                        finalIncome.ordersDetail[uiKey] = (finalIncome.ordersDetail[uiKey] || 0) + 1;
                        console.log(`[invoiceEngine] Reconstruction: Order ${order.id} - Distance=${distance}km -> ${uiKey}`);
                    });

                    const reconstructedTotal = (Object.values(finalIncome.ordersDetail) as number[]).reduce((sum: number, val: number) => sum + val, 0);
                    console.log(`[invoiceEngine] Reconstruction result: ${reconstructedTotal} orders mapped to ranges`);

                    // Log final distribution
                    console.log(`[invoiceEngine] Final orders distribution:`, finalIncome.ordersDetail);
                } catch (reproError) {
                    console.error('[invoiceEngine] Reconciliation fallback failed:', reproError);
                }
            } else {
                console.log(`[invoiceEngine] Reconstruction: Not needed - orders=${totalInvoicedOrders}, subtotal=${finalIncome.subtotal}`);
            }

            return finalIncome;
        } catch (error: unknown) {
            console.error('[invoiceEngine] Critical error calculating monthly invoiced income:', error);
            const errObj = error as Error;
            // Return initialAcc instead of {} to avoid crashing the UI (keeps the Facturado: 0 badges visible)
            return {
                ...initialAcc,
                error: errObj.message
            };
        }
    },

    /**
     * Delete ANY invoice (including ISSUED and RECTIFIED)
     * ⚠️ DANGER: This should ONLY be used for development/testing
     * Legal invoices should NEVER be deleted, use rectification instead
     */
    deleteInvoiceForced: async (
        invoiceId: string,
        confirmDangerous: boolean = false
    ): Promise<Result<void, BillingError>> => {
        try {
            if (!confirmDangerous) {
                return err({
                    type: 'VALIDATION_ERROR',
                    field: 'confirmDangerous',
                    message: 'Must confirm dangerous operation'
                });
            }

            console.warn('[invoiceEngine] ⚠️ DANGER: Force deleting invoice:', invoiceId);

            const invoiceRef = doc(db, INVOICES_COLLECTION, invoiceId);
            const invoiceSnap = await getDoc(invoiceRef);

            if (!invoiceSnap.exists()) {
                return err({
                    type: 'VALIDATION_ERROR',
                    field: 'invoiceId',
                    message: 'Invoice not found'
                });
            }

            const invoice = invoiceSnap.data() as Invoice;

            console.warn('[invoiceEngine] Deleting invoice and all related data:', {
                id: invoiceId,
                number: invoice.fullNumber,
                status: invoice.status,
                type: invoice.type,
                WARNING: 'This is a LEGAL DOCUMENT being deleted!'
            });

            // Delete related data in cascade
            // 1. Delete payment receipts
            const paymentsRef = collection(db, 'payment_receipts');
            const paymentsQuery = query(paymentsRef, where('invoiceId', '==', invoiceId));
            const paymentsSnap = await getDocs(paymentsQuery);

            if (!paymentsSnap.empty) {
                console.warn(`[invoiceEngine] Deleting ${paymentsSnap.size} payment receipts for invoice ${invoiceId}`);
                const batch = paymentsSnap.docs.map(docSnap => deleteDoc(docSnap.ref));
                await Promise.all(batch);
            }

            // 2. Delete tax vault entries
            const taxVaultRef = collection(db, 'tax_vault');
            const taxVaultQuery = query(taxVaultRef, where('invoiceId', '==', invoiceId));
            const taxVaultSnap = await getDocs(taxVaultQuery);

            if (!taxVaultSnap.empty) {
                console.warn(`[invoiceEngine] Deleting ${taxVaultSnap.size} tax vault entries for invoice ${invoiceId}`);
                const batch = taxVaultSnap.docs.map(docSnap => deleteDoc(docSnap.ref));
                await Promise.all(batch);
            }

            // 3. Finally delete the invoice
            await deleteDoc(invoiceRef);

            console.log(`[invoiceEngine] Invoice ${invoiceId} and all related data deleted successfully (forced)`);

            // Log critical action to audit trail
            await logAction(
                { uid: 'admin_forced', email: 'admin@repaart.com', role: 'admin' }, // Simplified as we are in service layer
                AUDIT_ACTIONS.INVOICE_DELETE,
                {
                    invoiceId,
                    number: invoice.fullNumber,
                    status: invoice.status,
                    total: invoice.total,
                    reason: 'Forced deletion by administrator'
                }
            );

            return ok(undefined);
        } catch (error: unknown) {
            const sError = new ServiceError('deleteInvoiceForced', { cause: error });
            console.error('[invoiceEngine] Error force deleting invoice:', sError);
            const errObj = error as Error;

            return err({
                type: 'UNKNOWN_ERROR',
                message: errObj.message || 'Failed to delete invoice',
                cause: error
            });
        }
    },

    /**
     * Update payment status of an invoice (manual override)
     * Use this when you need to manually change the payment status
     */
    updateInvoicePaymentStatus: async (
        invoiceId: string,
        newPaymentStatus: PaymentStatus
    ): Promise<Result<Invoice, BillingError>> => {
        try {
            console.log('[invoiceEngine] Updating payment status:', { invoiceId, newPaymentStatus });

            const invoiceRef = doc(db, INVOICES_COLLECTION, invoiceId);
            const invoiceSnap = await getDoc(invoiceRef);

            if (!invoiceSnap.exists()) {
                return err({
                    type: 'VALIDATION_ERROR',
                    field: 'invoiceId',
                    message: 'Invoice not found'
                });
            }

            const invoice = invoiceSnap.data() as Invoice;

            console.log('[invoiceEngine] Current invoice state:', {
                status: invoice.status,
                currentPaymentStatus: invoice.paymentStatus,
                total: invoice.total,
                totalPaid: invoice.totalPaid,
                remainingAmount: invoice.remainingAmount
            });

            // Calculate new amounts based on status
            let newTotalPaid = invoice.totalPaid;
            let newRemainingAmount = invoice.remainingAmount;

            if (newPaymentStatus === 'PAID') {
                newTotalPaid = invoice.total;
                newRemainingAmount = 0;
            } else if (newPaymentStatus === 'PARTIAL') {
                if (invoice.paymentStatus === 'PENDING') {
                    newTotalPaid = invoice.total * 0.5; // Default to 50% if unknown
                    newRemainingAmount = invoice.total - newTotalPaid;
                }
                // If already PARTIAL, keep current values
            } else if (newPaymentStatus === 'PENDING') {
                newTotalPaid = 0;
                newRemainingAmount = invoice.total;
            }

            const updates = {
                paymentStatus: newPaymentStatus,
                totalPaid: newTotalPaid,
                remainingAmount: newRemainingAmount,
                updatedAt: serverTimestamp(),

                // Firestore compatibility
                payment_status: newPaymentStatus,
                total_paid: newTotalPaid,
                remaining_amount: newRemainingAmount,
                updated_at: serverTimestamp()
            };

            console.log('[invoiceEngine] Updating invoice with:', updates);

            await updateDoc(invoiceRef, updates);

            // Fetch updated invoice
            const updatedSnap = await getDoc(invoiceRef);
            const updatedInvoice = {
                id: updatedSnap.id,
                ...updatedSnap.data()
            } as Invoice;

            console.log('[invoiceEngine] Payment status updated successfully:', {
                oldStatus: invoice.paymentStatus,
                newStatus: newPaymentStatus,
                newTotalPaid,
                newRemainingAmount
            });

            return ok(updatedInvoice);
        } catch (error: unknown) {
            const sError = new ServiceError('updateInvoicePaymentStatus', { cause: error });
            console.error('[invoiceEngine] Error updating payment status:', sError);
            const errObj = error as Error;

            return err({
                type: 'UNKNOWN_ERROR',
                message: errObj.message || 'Failed to update payment status',
                cause: error
            });
        }
    }
};
