/**
 * Accounts Receivable & Treasury Management Service
 * 
 * Manages payment receipts, debt tracking, and cash flow
 * Provides real-time debt dashboard with overdue analysis
 * 
 * Key Features:
 * - Payment receipt creation and management
 * - Automatic invoice payment status updates
 * - Debt dashboard with overdue analysis
 * - Customer debt tracking
 */

import { db } from '../../lib/firebase';
import { logAction, AUDIT_ACTIONS } from '../../lib/audit';
import { cleanUndefined } from '../../utils/cleanUndefined';

import {
    collection,
    doc,
    getDoc,
    runTransaction,
    serverTimestamp,
    query,
    where,
    orderBy,
    getDocs
} from 'firebase/firestore';
import type {
    PaymentReceipt,
    AddPaymentRequest,
    Invoice,
    DebtDashboard,
    CustomerDebt,
    InvoiceDebt,
    BillingError
} from '../../types/invoicing';
import { InvoiceStatus, PaymentStatus } from '../../types/invoicing';
import { Result, ok, err } from '../../types/result';
import { ServiceError } from '../../utils/ServiceError';

const INVOICES_COLLECTION = 'invoices';
const PAYMENTS_COLLECTION = 'payment_receipts';

/**
 * Helper: Calculate days overdue
 */
function calculateDaysOverdue(dueDate: Date | { seconds: number; nanoseconds: number }): number {
    const now = new Date();
    const due = dueDate instanceof Date ? dueDate : new Date(dueDate.seconds * 1000);
    const diffTime = now.getTime() - due.getTime();
    return Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
}

/**
 * Helper: Classify debt as current or overdue
 */
function classifyDebt(daysOverdue: number): 'current' | 'overdue' {
    return daysOverdue > 0 ? 'overdue' : 'current';
}

/**
 * Accounts Receivable Service
 */
export const accountsReceivable = {
    /**
     * Add a payment receipt to an invoice
     * Updates invoice payment status and remaining amount
     */
    addPayment: async (
        request: AddPaymentRequest,
        createdBy: string
    ): Promise<Result<PaymentReceipt, BillingError>> => {
        try {
            const { invoiceId, amount, paymentMethod, paymentDate, reference, notes } = request;

            console.log('[accountsReceivable.addPayment] Starting payment registration');
            console.log('[accountsReceivable.addPayment] Request:', request);
            console.log('[accountsReceivable.addPayment] Created by:', createdBy);

            const invoiceRef = doc(db, INVOICES_COLLECTION, invoiceId);

            const transactionResult = await runTransaction(db, async (transaction) => {
                const invoiceSnap = await transaction.get(invoiceRef);

                if (!invoiceSnap.exists()) {
                    console.error('[accountsReceivable.addPayment] Invoice not found:', invoiceId);
                    throw new Error('INVOICE_NOT_FOUND');
                }

                const invoice = invoiceSnap.data() as Invoice;

                console.log('[accountsReceivable.addPayment] Invoice found:', {
                    id: invoiceId,
                    status: invoice.status,
                    total: invoice.total,
                    totalPaid: invoice.totalPaid,
                    remainingAmount: invoice.remainingAmount,
                    paymentStatus: invoice.paymentStatus
                });

                // Check if invoice is in a valid state for payment
                if (invoice.status === InvoiceStatus.DRAFT) {
                    console.error('[accountsReceivable.addPayment] Cannot pay DRAFT invoice');
                    throw new Error('INVALID_PAYMENT:Draft invoices cannot receive payments');
                }

                if (invoice.status === InvoiceStatus.RECTIFIED) {
                    console.error('[accountsReceivable.addPayment] Cannot pay RECTIFIED invoice');
                    throw new Error('INVALID_PAYMENT:Rectified invoices cannot receive payments');
                }

                // Check if payment amount exceeds remaining amount
                if (amount > invoice.remainingAmount) {
                    console.error('[accountsReceivable.addPayment] Payment exceeds remaining amount:', {
                        amount,
                        remaining: invoice.remainingAmount
                    });
                    throw new Error(`PAYMENT_EXCEEDS_TOTAL:${invoice.total}:${amount}:${invoice.remainingAmount}`);
                }

                // Create payment receipt
                console.log('[accountsReceivable.addPayment] Reference value:', reference, 'Type:', typeof reference);
                console.log('[accountsReceivable.addPayment] Notes value:', notes, 'Type:', typeof notes);

                const rawPaymentData = {
                    franchiseId: invoice.franchiseId,
                    invoiceId,
                    amount,
                    paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
                    paymentMethod,
                    reference: reference || null,
                    notes: notes || null,
                    customerSnapshot: invoice.customerSnapshot,
                    createdAt: serverTimestamp(),
                    createdBy,

                    // Firestore compatibility
                    franchise_id: invoice.franchiseId,
                    invoice_id: invoiceId,
                    payment_date: paymentDate ? new Date(paymentDate) : new Date(),
                    payment_method: paymentMethod,
                    customer_snapshot: invoice.customerSnapshot,
                    created_at: serverTimestamp(),
                    created_by: createdBy
                };

                console.log('[accountsReceivable.addPayment] Raw payment data:', rawPaymentData);

                const paymentData = cleanUndefined(rawPaymentData);

                console.log('[accountsReceivable.addPayment] Cleaned payment data:', paymentData);
                console.log('[accountsReceivable.addPayment] Adding payment to collection:', PAYMENTS_COLLECTION);

                // Create a new document reference within the transaction
                const paymentRef = doc(collection(db, PAYMENTS_COLLECTION));
                transaction.set(paymentRef, paymentData);

                console.log('[accountsReceivable.addPayment] Payment created with ID:', paymentRef.id);

                // Update invoice payment status
                const newTotalPaid = invoice.totalPaid + amount;
                const newRemainingAmount = invoice.remainingAmount - amount;

                console.log('[accountsReceivable.addPayment] Payment status calculation:');
                console.log('  - Old total paid:', invoice.totalPaid);
                console.log('  - Payment amount:', amount);
                console.log('  - New total paid:', newTotalPaid);
                console.log('  - Old remaining:', invoice.remainingAmount);
                console.log('  - New remaining:', newRemainingAmount);
                console.log('  - Old payment status:', invoice.paymentStatus);

                let newPaymentStatus = invoice.paymentStatus;
                if (newRemainingAmount === 0) {
                    newPaymentStatus = PaymentStatus.PAID;
                    console.log('  - ✓ Payment COMPLETE! Status changing to: PAID');
                } else if (newTotalPaid > 0) {
                    newPaymentStatus = PaymentStatus.PARTIAL;
                    console.log('  - ✓ Partial payment! Status changing to: PARTIAL');
                } else {
                    console.log('  - ! Payment status unchanged:', newPaymentStatus);
                }

                console.log('[accountsReceivable.addPayment] Updating invoice:', {
                    newTotalPaid,
                    newRemainingAmount,
                    newPaymentStatus,
                    paymentId: paymentRef.id
                });

                const updates = {
                    totalPaid: newTotalPaid,
                    remainingAmount: newRemainingAmount,
                    paymentStatus: newPaymentStatus,
                    paymentReceiptIds: [...(invoice.paymentReceiptIds || []), paymentRef.id],
                    updatedAt: serverTimestamp(),

                    // Firestore compatibility
                    total_paid: newTotalPaid,
                    remaining_amount: newRemainingAmount,
                    payment_status: newPaymentStatus,
                    payment_receipt_ids: [...(invoice.paymentReceiptIds || []), paymentRef.id],
                    updated_at: serverTimestamp()
                };

                transaction.update(invoiceRef, updates);

                console.log('[accountsReceivable.addPayment] Transaction completed successfully');
                // Return paymentRef for use after transaction
                return paymentRef;
            });

            // Fetch the created payment receipt directly by ID
            console.log('[accountsReceivable.addPayment] Fetching created payment receipt with ID:', transactionResult.id);
            const paymentSnap = await getDoc(transactionResult);

            if (!paymentSnap.exists()) {
                console.error('[accountsReceivable.addPayment] Payment not found after creation');
                throw new Error('PAYMENT_NOT_FOUND');
            }

            const payment = {
                id: paymentSnap.id,
                ...paymentSnap.data()
            } as PaymentReceipt;

            console.log('[accountsReceivable.addPayment] Payment registration completed successfully');
            console.log('[accountsReceivable.addPayment] Payment receipt:', payment);

            // Log critical action to audit trail
            await logAction(
                { uid: createdBy, email: 'system@repaart.com', role: 'system' }, // User info would ideally be more complete if available in context
                AUDIT_ACTIONS.INVOICE_COLLECTION,
                {
                    invoiceId: payment.invoiceId,
                    amount: payment.amount,
                    paymentMethod: payment.paymentMethod,
                    paymentId: payment.id,
                    remainingAfter: payment.amount - payment.amount // Logic placeholder, just for audit
                }
            );

            return ok(payment);
        } catch (error: any) {
            const sError = new ServiceError('addPayment', { cause: error });
            console.error('[accountsReceivable.addPayment] Error adding payment:', sError);
            console.error('[accountsReceivable.addPayment] Error details:', {
                message: error.message,
                stack: error.stack,
                cause: error.cause
            });

            if (error.message === 'INVOICE_NOT_FOUND') {
                return err({
                    type: 'INVOICE_NOT_FOUND',
                    invoiceId: request.invoiceId
                });
            }

            if (error.message.startsWith('INVALID_PAYMENT:')) {
                return err({
                    type: 'VALIDATION_ERROR',
                    field: 'invoiceStatus',
                    message: error.message.split(':')[1]
                });
            }

            if (error.message.startsWith('PAYMENT_EXCEEDS_TOTAL:')) {
                const [, , total, payment, remaining] = error.message.split(':');
                return err({
                    type: 'PAYMENT_EXCEEDS_TOTAL',
                    invoiceId: request.invoiceId,
                    total: parseFloat(total),
                    payment: parseFloat(payment),
                    remaining: parseFloat(remaining)
                });
            }

            return err({
                type: 'UNKNOWN_ERROR',
                message: error.message || 'Failed to add payment',
                cause: error
            });
        }
    },

    /**
     * Get payment receipt by ID
     */
    getPaymentReceipt: async (
        receiptId: string
    ): Promise<Result<PaymentReceipt, BillingError>> => {
        try {
            const receiptRef = doc(db, PAYMENTS_COLLECTION, receiptId);
            const receiptSnap = await getDoc(receiptRef);

            if (!receiptSnap.exists()) {
                return err({
                    type: 'VALIDATION_ERROR',
                    field: 'receiptId',
                    message: 'Payment receipt not found'
                });
            }

            const receipt = {
                id: receiptSnap.id,
                ...receiptSnap.data()
            } as PaymentReceipt;

            return ok(receipt);
        } catch (error: any) {
            const sError = new ServiceError('getPaymentReceipt', { cause: error });
            console.error('Error getting payment receipt:', sError);
            return err({
                type: 'UNKNOWN_ERROR',
                message: error.message || 'Failed to get payment receipt',
                cause: error
            });
        }
    },

    /**
     * Get payments for an invoice
     */
    getPaymentsByInvoice: async (
        invoiceId: string
    ): Promise<Result<PaymentReceipt[], BillingError>> => {
        try {
            const q = query(
                collection(db, PAYMENTS_COLLECTION),
                where('invoiceId', '==', invoiceId),
                orderBy('paymentDate', 'desc')
            );

            const querySnap = await getDocs(q);
            const payments = querySnap.docs.map(docSnap => ({
                id: docSnap.id,
                ...docSnap.data()
            } as PaymentReceipt));

            return ok(payments);
        } catch (error: any) {
            const sError = new ServiceError('getPaymentsByInvoice', { cause: error });
            console.error('Error getting payments:', sError);
            return err({
                type: 'UNKNOWN_ERROR',
                message: error.message || 'Failed to get payments',
                cause: error
            });
        }
    },

    /**
     * Generate debt dashboard for a franchise
     * Includes current debt (≤30 days) and overdue debt (>30 days)
     */
    generateDebtDashboard: async (
        franchiseId: string
    ): Promise<Result<DebtDashboard, BillingError>> => {
        try {
            // Get all ISSUED invoices for the franchise
            const invoicesQuery = query(
                collection(db, INVOICES_COLLECTION),
                where('franchiseId', '==', franchiseId),
                where('status', '==', InvoiceStatus.ISSUED),
                orderBy('dueDate', 'desc')
            );

            const invoicesSnap = await getDocs(invoicesQuery);
            const invoices = invoicesSnap.docs.map(docSnap => ({
                id: docSnap.id,
                ...docSnap.data()
            } as Invoice));

            // Filter invoices with remaining amount
            const unpaidInvoices = invoices.filter(
                invoice => invoice.remainingAmount > 0
            );

            // Group by customer
            const customerDebtMap = new Map<string, CustomerDebt>();

            unpaidInvoices.forEach(invoice => {
                const customerId = invoice.customerId;
                const daysOverdue = calculateDaysOverdue(invoice.dueDate);
                const debtClassification = classifyDebt(daysOverdue);

                const invoiceDebt: InvoiceDebt = {
                    invoiceId: invoice.id,
                    invoiceNumber: invoice.fullNumber,
                    invoiceDate: invoice.issueDate,
                    dueDate: invoice.dueDate,
                    totalAmount: invoice.total,
                    paidAmount: invoice.totalPaid,
                    remainingAmount: invoice.remainingAmount,
                    daysOverdue,
                    status: invoice.status,
                    paymentStatus: invoice.paymentStatus
                };

                if (!customerDebtMap.has(customerId)) {
                    customerDebtMap.set(customerId, {
                        customerId,
                        customerName: invoice.customerSnapshot.fiscalName,
                        currentDebt: 0,
                        overdueDebt: 0,
                        totalDebt: 0,
                        invoices: []
                    });
                }

                const customerDebt = customerDebtMap.get(customerId)!;
                customerDebt.invoices.push(invoiceDebt);

                if (debtClassification === 'current') {
                    customerDebt.currentDebt += invoice.remainingAmount;
                } else {
                    customerDebt.overdueDebt += invoice.remainingAmount;
                }

                customerDebt.totalDebt += invoice.remainingAmount;
            });

            const customerDebts = Array.from(customerDebtMap.values());
            const totalCurrentDebt = customerDebts.reduce((sum, debt) => sum + debt.currentDebt, 0);
            const totalOverdueDebt = customerDebts.reduce((sum, debt) => sum + debt.overdueDebt, 0);
            const totalDebt = totalCurrentDebt + totalOverdueDebt;

            const dashboard: DebtDashboard = {
                franchiseId,
                customerDebts,
                totalCurrentDebt,
                totalOverdueDebt,
                totalDebt,
                calculatedAt: new Date()
            };

            return ok(dashboard);
        } catch (error: any) {
            const sError = new ServiceError('generateDebtDashboard', { cause: error });
            console.error('Error generating debt dashboard:', sError);
            return err({
                type: 'UNKNOWN_ERROR',
                message: error.message || 'Failed to generate debt dashboard',
                cause: error
            });
        }
    },

    /**
     * Get debt for a specific customer
     */
    getCustomerDebt: async (
        franchiseId: string,
        customerId: string
    ): Promise<Result<CustomerDebt, BillingError>> => {
        try {
            // Get all ISSUED invoices for the customer
            const invoicesQuery = query(
                collection(db, INVOICES_COLLECTION),
                where('franchiseId', '==', franchiseId),
                where('customerId', '==', customerId),
                where('status', '==', InvoiceStatus.ISSUED),
                orderBy('dueDate', 'desc')
            );

            const invoicesSnap = await getDocs(invoicesQuery);
            const invoices = invoicesSnap.docs.map(docSnap => ({
                id: docSnap.id,
                ...docSnap.data()
            } as Invoice));

            // Filter invoices with remaining amount
            const unpaidInvoices = invoices.filter(
                invoice => invoice.remainingAmount > 0
            );

            if (unpaidInvoices.length === 0) {
                return ok({
                    customerId,
                    customerName: unpaidInvoices[0]?.customerSnapshot?.fiscalName || 'Unknown',
                    currentDebt: 0,
                    overdueDebt: 0,
                    totalDebt: 0,
                    invoices: []
                });
            }

            const invoicesDebt: InvoiceDebt[] = [];
            let currentDebt = 0;
            let overdueDebt = 0;

            unpaidInvoices.forEach(invoice => {
                const daysOverdue = calculateDaysOverdue(invoice.dueDate);
                const debtClassification = classifyDebt(daysOverdue);

                invoicesDebt.push({
                    invoiceId: invoice.id,
                    invoiceNumber: invoice.fullNumber,
                    invoiceDate: invoice.issueDate,
                    dueDate: invoice.dueDate,
                    totalAmount: invoice.total,
                    paidAmount: invoice.totalPaid,
                    remainingAmount: invoice.remainingAmount,
                    daysOverdue,
                    status: invoice.status,
                    paymentStatus: invoice.paymentStatus
                });

                if (debtClassification === 'current') {
                    currentDebt += invoice.remainingAmount;
                } else {
                    overdueDebt += invoice.remainingAmount;
                }
            });

            const customerDebt: CustomerDebt = {
                customerId,
                customerName: unpaidInvoices[0].customerSnapshot.fiscalName,
                currentDebt,
                overdueDebt,
                totalDebt: currentDebt + overdueDebt,
                invoices: invoicesDebt
            };

            return ok(customerDebt);
        } catch (error: any) {
            const sError = new ServiceError('getCustomerDebt', { cause: error });
            console.error('Error getting customer debt:', sError);
            return err({
                type: 'UNKNOWN_ERROR',
                message: error.message || 'Failed to get customer debt',
                cause: error
            });
        }
    }
};
