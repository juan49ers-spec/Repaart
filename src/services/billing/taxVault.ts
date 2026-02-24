/**
 * Tax Vault & Fiscal Bridge Service
 * 
 * Observes invoice issuance events and automatically updates tax buckets
 * Manages monthly closing with database-level locks
 * Ensures immutable fiscal records for European regulatory compliance
 * 
 * Key Features:
 * - Automatic tax aggregation on invoice issuance
 * - Monthly closing wizard with database locks
 * - Immutable sum of invoices and expenses
 * - No manual income entry allowed after closing
 */

import { db } from '../../lib/firebase';
import {
    collection,
    doc,
    getDoc,
    runTransaction,
    serverTimestamp,
    query,
    where,
    getDocs,
    arrayUnion,
    increment
} from 'firebase/firestore';
import type {
    TaxVaultEntry,
    MonthlyCloseRequest,
    MonthlyCloseResult,
    Invoice,
    BillingError
} from '../../types/invoicing';
import { InvoiceStatus } from '../../types/invoicing';
import { Result, ok, err } from '../../types/result';
import { ServiceError } from '../../utils/ServiceError';

const TAX_VAULT_COLLECTION = 'tax_vault';
const INVOICES_COLLECTION = 'invoices';
const FINANCIAL_RECORDS_COLLECTION = 'financial_records';

/**
 * Helper: Extract period from date (YYYY-MM format)
 */
function extractPeriod(date: Date | { seconds: number; nanoseconds: number }): string {
    const d = date instanceof Date ? date : new Date(date.seconds * 1000);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Helper: Generate Tax Vault entry ID
 */
function generateTaxVaultId(franchiseId: string, period: string): string {
    return `${franchiseId}_${period}`;
}

/**
 * Tax Vault Observer Service
 * 
 * Listens to invoice issuance events and updates tax buckets
 * This service would typically be triggered by Firestore Cloud Functions
 * or called manually after invoice issuance
 */
export const taxVaultObserver = {
    /**
     * Handle invoice issuance event
     * Adds invoice amounts to the corresponding tax vault entry
     * 
     * @param invoiceId - ID of the issued invoice
     */
    onInvoiceIssued: async (
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

            // Only process ISSUED invoices
            if (invoice.status !== InvoiceStatus.ISSUED) {
                return ok(undefined); // No-op for non-issued invoices
            }

            // Extract period from invoice issue date
            const period = extractPeriod(invoice.issueDate);
            const taxVaultId = generateTaxVaultId(invoice.franchiseId, period);
            const taxVaultRef = doc(db, TAX_VAULT_COLLECTION, taxVaultId);

            await runTransaction(db, async (transaction) => {
                const taxVaultSnap = await transaction.get(taxVaultRef);

                if (taxVaultSnap.exists()) {
                    const taxVault = taxVaultSnap.data() as TaxVaultEntry;

                    // Check if month is already closed
                    if (taxVault.isLocked) {
                        throw new Error('TAX_VAULT_LOCKED');
                    }

                    // Update existing tax vault entry
                    const totals = taxVaultObserver._calculateInvoiceTotals(invoice);

                    transaction.update(taxVaultRef, {
                        ivaRepercutido: increment(totals.ivaRepercutido),
                        invoiceIds: arrayUnion(invoiceId),
                        updatedAt: serverTimestamp(),
                        updated_at: serverTimestamp()
                    });
                } else {
                    // Create new tax vault entry
                    const totals = taxVaultObserver._calculateInvoiceTotals(invoice);

                    const newTaxVault: TaxVaultEntry = {
                        id: taxVaultId,
                        franchiseId: invoice.franchiseId,
                        period,
                        ivaRepercutido: totals.ivaRepercutido,
                        ivaSoportado: 0,
                        irpfReserva: 0,
                        isLocked: false,
                        invoiceIds: [invoiceId],
                        expenseRecordIds: [],
                        createdAt: serverTimestamp() as any,
                        updatedAt: serverTimestamp() as any
                    } as any;

                    transaction.set(taxVaultRef, newTaxVault);
                }
            });

            return ok(undefined);
        } catch (error: any) {
            const sError = new ServiceError('onInvoiceIssued', { cause: error });
            console.error('Error processing invoice issuance:', sError);

            if (error.message === 'TAX_VAULT_LOCKED') {
                return err({
                    type: 'TAX_VAULT_LOCKED',
                    period: extractPeriod(new Date()),
                    franchiseId: ''
                });
            }

            return err({
                type: 'UNKNOWN_ERROR',
                message: error.message || 'Failed to process invoice issuance',
                cause: error
            });
        }
    },

    /**
     * Calculate tax totals from an invoice
     * 
     * @param invoice - Invoice to calculate totals from
     * @returns Object with tax totals
     * @private
     */
    _calculateInvoiceTotals: (invoice: Invoice): {
        ivaRepercutido: number;
        ivaSoportado: number;
        irpfReserva: number;
    } => {
        const ivaRepercutido = invoice.taxBreakdown.reduce(
            (sum, tax) => sum + tax.taxAmount,
            0
        );

        // For now, we assume all invoices are for logistics services (21% IVA)
        // This should be enhanced to handle different tax types based on invoice lines
        return {
            ivaRepercutido,
            ivaSoportado: 0,
            irpfReserva: 0
        };
    },

    /**
     * Handle expense record creation event
     * Adds expense amounts to the corresponding tax vault entry
     * 
     * @param franchiseId - Franchise ID
     * @param recordId - Financial record ID
     * @param recordDate - Record date
     * @param ivaSoportado - Input VAT amount (if applicable)
     */
    onExpenseCreated: async (
        franchiseId: string,
        recordId: string,
        recordDate: Date,
        ivaSoportado: number = 0
    ): Promise<Result<void, BillingError>> => {
        try {
            const period = extractPeriod(recordDate);
            const taxVaultId = generateTaxVaultId(franchiseId, period);
            const taxVaultRef = doc(db, TAX_VAULT_COLLECTION, taxVaultId);

            await runTransaction(db, async (transaction) => {
                const taxVaultSnap = await transaction.get(taxVaultRef);

                if (taxVaultSnap.exists()) {
                    const taxVault = taxVaultSnap.data() as TaxVaultEntry;

                    // Check if month is already closed
                    if (taxVault.isLocked) {
                        throw new Error('TAX_VAULT_LOCKED');
                    }

                    transaction.update(taxVaultRef, {
                        ivaSoportado: taxVault.ivaSoportado + ivaSoportado,
                        expenseRecordIds: [...(taxVault.expenseRecordIds || []), recordId],
                        updatedAt: serverTimestamp(),
                        updated_at: serverTimestamp()
                    });
                } else {
                    // Create new tax vault entry
                    const newTaxVault: TaxVaultEntry = {
                        id: taxVaultId,
                        franchiseId,
                        period,
                        ivaRepercutido: 0,
                        ivaSoportado,
                        irpfReserva: 0,
                        isLocked: false,
                        invoiceIds: [],
                        expenseRecordIds: [recordId],
                        createdAt: serverTimestamp() as any,
                        updatedAt: serverTimestamp() as any
                    } as any;

                    transaction.set(taxVaultRef, newTaxVault);
                }
            });

            return ok(undefined);
        } catch (error: any) {
            const sError = new ServiceError('onExpenseCreated', { cause: error });
            console.error('Error processing expense creation:', sError);

            if (error.message === 'TAX_VAULT_LOCKED') {
                return err({
                    type: 'TAX_VAULT_LOCKED',
                    period: extractPeriod(recordDate),
                    franchiseId
                });
            }

            return err({
                type: 'UNKNOWN_ERROR',
                message: error.message || 'Failed to process expense creation',
                cause: error
            });
        }
    }
};

/**
 * Monthly Close Wizard Service
 * 
 * Manages the monthly closing process with database-level locks
 * Calculates immutable sums of invoices and expenses
 */
export const monthlyCloseWizard = {
    /**
     * Execute monthly close for a franchise and period
     * 
     * @param request - Monthly close request
     * @returns Monthly close result with tax vault entry and summary
     */
    executeMonthlyClose: async (
        request: MonthlyCloseRequest
    ): Promise<Result<MonthlyCloseResult, BillingError>> => {
        try {
            const { franchiseId, period, requestedBy } = request;
            const taxVaultId = generateTaxVaultId(franchiseId, period);
            const taxVaultRef = doc(db, TAX_VAULT_COLLECTION, taxVaultId);

            let result: MonthlyCloseResult;

            await runTransaction(db, async (transaction) => {
                const taxVaultSnap = await transaction.get(taxVaultRef);

                if (taxVaultSnap.exists()) {
                    const taxVault = taxVaultSnap.data() as TaxVaultEntry;

                    if (taxVault.isLocked) {
                        throw new Error('MONTH_ALREADY_CLOSED');
                    }
                }

                // Calculate period bounds
                const [year, month] = period.split('-');
                const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
                const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);

                // Fetch all ISSUED invoices for the period
                const invoicesQuery = query(
                    collection(db, INVOICES_COLLECTION),
                    where('franchiseId', '==', franchiseId),
                    where('status', '==', InvoiceStatus.ISSUED),
                    where('issueDate', '>=', startDate),
                    where('issueDate', '<=', endDate)
                );
                const invoicesSnap = await getDocs(invoicesQuery);
                const invoices = invoicesSnap.docs.map(docSnap => ({
                    id: docSnap.id,
                    ...docSnap.data()
                } as Invoice));

                // Fetch all expense records for the period
                const expensesQuery = query(
                    collection(db, FINANCIAL_RECORDS_COLLECTION),
                    where('franchise_id', '==', franchiseId),
                    where('type', '==', 'expense'),
                    where('date', '>=', startDate),
                    where('date', '<=', endDate)
                );
                const expensesSnap = await getDocs(expensesQuery);
                const expenses = expensesSnap.docs.map(docSnap => docSnap.data());

                // Calculate totals
                let totalIncome = 0;
                let totalIvaRepercutido = 0;

                invoices.forEach(invoice => {
                    totalIncome += invoice.total;
                    totalIvaRepercutido += invoice.taxBreakdown.reduce(
                        (sum, tax) => sum + tax.taxAmount,
                        0
                    );
                });

                let totalExpenses = 0;
                let totalIvaSoportado = 0;

                expenses.forEach(expense => {
                    const amount = Number(expense.amount) || 0;
                    totalExpenses += amount;

                    // This is a simplified calculation
                    // In a real implementation, you would extract IVA from expense breakdown
                    if (expense.breakdown && expense.breakdown.iva) {
                        totalIvaSoportado += expense.breakdown.iva;
                    }
                });

                const totalTax = totalIvaRepercutido - totalIvaSoportado;

                // Create or update tax vault entry
                const taxVaultData: any = {
                    id: taxVaultId,
                    franchiseId,
                    period,
                    ivaRepercutido: totalIvaRepercutido,
                    ivaSoportado: totalIvaSoportado,
                    irpfReserva: 0, // This would be calculated from payroll data
                    isLocked: true,
                    lockedAt: serverTimestamp(),
                    lockedBy: requestedBy,
                    invoiceIds: invoices.map(inv => inv.id),
                    expenseRecordIds: expenses.map(exp => exp.id),
                    createdAt: taxVaultSnap.exists() ? (taxVaultSnap.data() as any).createdAt : serverTimestamp(),
                    updatedAt: serverTimestamp()
                };

                transaction.set(taxVaultRef, taxVaultData, { merge: true });

                result = {
                    success: true,
                    period,
                    taxVaultEntry: taxVaultData,
                    summary: {
                        totalInvoices: invoices.length,
                        totalIncome,
                        totalExpenses,
                        totalTax
                    },
                    closedAt: new Date()
                };
            });

            return ok(result!);
        } catch (error: any) {
            const sError = new ServiceError('executeMonthlyClose', { cause: error });
            console.error('Error executing monthly close:', sError);

            if (error.message === 'MONTH_ALREADY_CLOSED') {
                return err({
                    type: 'MONTH_ALREADY_CLOSED',
                    period: request.period,
                    franchiseId: request.franchiseId
                });
            }

            return err({
                type: 'UNKNOWN_ERROR',
                message: error.message || 'Failed to execute monthly close',
                cause: error
            });
        }
    },

    /**
     * Get tax vault entry for a franchise and period
     * 
     * @param franchiseId - Franchise ID
     * @param period - Period (YYYY-MM format)
     * @returns Tax vault entry
     */
    getTaxVaultEntry: async (
        franchiseId: string,
        period: string
    ): Promise<Result<TaxVaultEntry, BillingError>> => {
        try {
            const taxVaultId = generateTaxVaultId(franchiseId, period);
            const taxVaultRef = doc(db, TAX_VAULT_COLLECTION, taxVaultId);
            const taxVaultSnap = await getDoc(taxVaultRef);

            if (!taxVaultSnap.exists()) {
                return err({
                    type: 'NOT_FOUND',
                    franchiseId,
                    period
                } as any);
            }

            const taxVaultEntry = {
                id: taxVaultSnap.id,
                ...taxVaultSnap.data()
            } as TaxVaultEntry;

            return ok(taxVaultEntry);
        } catch (error: any) {
            const sError = new ServiceError('getTaxVaultEntry', { cause: error });
            console.error('Error getting tax vault entry:', sError);
            return err({
                type: 'UNKNOWN_ERROR',
                message: error.message || 'Failed to get tax vault entry',
                cause: error
            });
        }
    },

    /**
     * Request to unlock a closed month
     * This would typically require admin approval
     * 
     * @param franchiseId - Franchise ID
     * @param period - Period to unlock
     * @param requestedBy - User requesting the unlock
     * @param reason - Reason for unlock
     */
    requestMonthUnlock: async (
        franchiseId: string,
        period: string,
        requestedBy: string,
        reason: string
    ): Promise<Result<void, BillingError>> => {
        try {
            const taxVaultId = generateTaxVaultId(franchiseId, period);
            const taxVaultRef = doc(db, TAX_VAULT_COLLECTION, taxVaultId);
            const taxVaultSnap = await getDoc(taxVaultRef);

            if (!taxVaultSnap.exists()) {
                return err({
                    type: 'NOT_FOUND',
                    franchiseId,
                    period
                } as any);
            }

            const taxVault = taxVaultSnap.data() as TaxVaultEntry;

            if (!taxVault.isLocked) {
                return ok(undefined); // Already unlocked
            }

            // Create unlock request (this would typically go to an admin for approval)
            // For now, we'll just log the request
            console.info('Month unlock request:', {
                franchiseId,
                period,
                requestedBy,
                reason,
                timestamp: new Date()
            });

            // In a real implementation, you would:
            // 1. Create an unlock request document
            // 2. Notify admins
            // 3. Wait for approval
            // 4. Execute the unlock

            return ok(undefined);
        } catch (error: any) {
            const sError = new ServiceError('requestMonthUnlock', { cause: error });
            console.error('Error requesting month unlock:', sError);
            return err({
                type: 'UNKNOWN_ERROR',
                message: error.message || 'Failed to request month unlock',
                cause: error
            });
        }
    },

    /**
     * Recalculate all tax and total data for a specific period
     * Useful for fixing discrepancies after deletions or sync errors
     * 
     * @param franchiseId - Franchise ID
     * @param period - Period (YYYY-MM format)
     */
    recalculateMonthData: async (
        franchiseId: string,
        period: string
    ): Promise<Result<void, BillingError>> => {
        try {
            console.log(`[taxVault] Recalculating data for period: ${period} (franchise: ${franchiseId})`);

            const taxVaultId = generateTaxVaultId(franchiseId, period);
            const taxVaultRef = doc(db, TAX_VAULT_COLLECTION, taxVaultId);
            const taxVaultSnap = await getDoc(taxVaultRef);

            // 1. Check if month is locked
            if (taxVaultSnap.exists() && (taxVaultSnap.data() as TaxVaultEntry).isLocked) {
                return err({
                    type: 'TAX_VAULT_LOCKED',
                    period,
                    franchiseId
                });
            }

            // 2. Robust ID resolution: find all possible identifying strings for this franchise
            const possibleIds = new Set<string>([franchiseId]);

            // Try to get more IDs from the user document (slugs, etc.)
            const userSnap = await getDoc(doc(db, 'users', franchiseId));
            if (userSnap.exists()) {
                const data = userSnap.data();
                if (data?.franchiseId) {
                    possibleIds.add(data.franchiseId);
                    possibleIds.add(data.franchiseId.toUpperCase());
                    possibleIds.add(data.franchiseId.toLowerCase());
                    possibleIds.add(data.franchiseId.trim());
                }
            }

            const ids = Array.from(possibleIds);
            const [year, month] = period.split('-').map(Number);
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0, 23, 59, 59);

            const invoicesQuery = query(
                collection(db, INVOICES_COLLECTION),
                where('franchiseId', 'in', ids),
                where('status', '==', InvoiceStatus.ISSUED),
                where('issueDate', '>=', startDate),
                where('issueDate', '<=', endDate)
            );

            const invoicesSnap = await getDocs(invoicesQuery);
            const invoices = invoicesSnap.docs.map(d => ({ id: d.id, ...d.data() } as Invoice));

            console.log(`[taxVault] Found ${invoices.length} issued invoices using IDs: ${ids.join(', ')}`);

            console.log(`[taxVault] Found ${invoices.length} issued invoices for recalculation`);

            // 3. Fetch all expenses (to keep consistency)
            const expensesQuery = query(
                collection(db, FINANCIAL_RECORDS_COLLECTION),
                where('franchise_id', 'in', ids),
                where('type', '==', 'expense'),
                where('date', '>=', startDate),
                where('date', '<=', endDate)
            );
            const expensesSnap = await getDocs(expensesQuery);
            const expenses = expensesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

            // 4. Recalculate totals
            let totalIvaRepercutido = 0;
            invoices.forEach(inv => {
                totalIvaRepercutido += (inv.taxBreakdown || []).reduce((s, t) => s + (t.taxAmount || 0), 0);
            });

            let totalIvaSoportado = 0;
            expenses.forEach((exp: any) => {
                if (exp.breakdown?.iva) {
                    totalIvaSoportado += exp.breakdown.iva;
                }
            });

            // 5. Atomic update
            await runTransaction(db, async (transaction) => {
                transaction.set(taxVaultRef, {
                    id: taxVaultId,
                    franchiseId,
                    period,
                    ivaRepercutido: totalIvaRepercutido,
                    ivaSoportado: totalIvaSoportado,
                    irpfReserva: 0,
                    isLocked: false,
                    invoiceIds: invoices.map(inv => inv.id),
                    expenseRecordIds: expenses.map(exp => exp.id),
                    updatedAt: serverTimestamp(),
                    updated_at: serverTimestamp(),
                    // Preserve createdAt if exists
                    createdAt: taxVaultSnap.exists() ? (taxVaultSnap.data() as any).createdAt : serverTimestamp()
                }, { merge: true });
            });

            console.log(`[taxVault] Successfully recalculated period ${period}. New ivaRepercutido: ${totalIvaRepercutido}`);
            return ok(undefined);
        } catch (error: any) {
            const sError = new ServiceError('recalculateMonthData', { cause: error });
            console.error('[taxVault] Error recalculating data:', sError);
            return err({
                type: 'UNKNOWN_ERROR',
                message: error.message || 'Failed to recalculate tax data',
                cause: error
            });
        }
    }
};
