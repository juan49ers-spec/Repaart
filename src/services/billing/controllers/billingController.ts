/**
 * Billing & Treasury Controller
 * 
 * Main controller that orchestrates all billing operations
 * Provides a unified API for the billing module
 * 
 * This controller would typically be called from:
 * - React components (client-side)
 * - Firebase Cloud Functions (server-side)
 * - Admin tools
 */

import { invoiceEngine } from '../invoiceEngine';
import { logisticsBillingEngine } from '../logisticsBillingEngine';
import { accountsReceivable } from '../accountsReceivable';
import { taxVaultObserver, monthlyCloseWizard } from '../taxVault';
import { validateCreateRequest } from '../invoiceValidation';
import type {
    CreateInvoiceRequest,
    IssueInvoiceRequest,
    RectifyInvoiceRequest,
    AddPaymentRequest,
    CalculateBillingRequest,
    MonthlyCloseRequest,
    Invoice,
    PaymentReceipt,
    BillingCalculationResult,
    DebtDashboard,
    MonthlyCloseResult,
    BillingError
} from '../../../types/invoicing';
import type { Result } from '../../../types/result';

/**
 * Billing Controller
 * 
 * Main API for the billing module
 */
export const billingController = {
    // ==================== INVOICE MANAGEMENT ====================

    /**
     * Create a new draft invoice
     * 
     * @param request - Invoice creation request
     * @param userId - User ID creating the invoice
     * @returns Invoice ID or error
     */
    createInvoice: async (
        request: CreateInvoiceRequest,
        userId: string
    ): Promise<Result<string, BillingError>> => {
        // Validate request before processing
        const validation = validateCreateRequest(request);
        if (!validation.success) {
            const zodError = validation.error;
            const firstIssue = zodError.issues[0];
            return {
                success: false,
                error: {
                    type: 'VALIDATION_ERROR',
                    field: (firstIssue.path?.[0] as string) || 'unknown',
                    message: firstIssue.message || 'Error de validación'
                }
            };
        }

        return invoiceEngine.createDraft(request, userId);
    },

    /**
     * Issue a draft invoice
     * 
     * @param request - Invoice issuance request
     * @returns Issued invoice or error
     */
    issueInvoice: async (
        request: IssueInvoiceRequest
    ): Promise<Result<Invoice, BillingError>> => {
        const result = await invoiceEngine.issueInvoice(request);
        
        if (result.success) {
            // Trigger tax vault observer
            await taxVaultObserver.onInvoiceIssued(request.invoiceId);
        }
        
        return result;
    },

    /**
     * Rectify an issued invoice
     * 
     * @param request - Rectification request
     * @returns Original and rectifying invoices or error
     */
    rectifyInvoice: async (
        request: RectifyInvoiceRequest
    ): Promise<Result<{ original: Invoice; rectifying: Invoice }, BillingError>> => {
        return invoiceEngine.rectifyInvoice(request);
    },

    /**
     * Update a draft invoice
     * 
     * @param invoiceId - Invoice ID
     * @param updates - Partial invoice updates
     * @returns Success or error
     */
    updateInvoice: async (
        invoiceId: string,
        updates: Partial<Invoice>
    ): Promise<Result<void, BillingError>> => {
        return invoiceEngine.updateDraft(invoiceId, updates);
    },

    /**
     * Delete a draft invoice
     * 
     * @param invoiceId - Invoice ID
     * @returns Success or error
     */
    deleteInvoice: async (
        invoiceId: string
    ): Promise<Result<void, BillingError>> => {
        return invoiceEngine.deleteDraft(invoiceId);
    },

    /**
     * Get invoice by ID
     * 
     * @param invoiceId - Invoice ID
     * @returns Invoice or error
     */
    getInvoice: async (
        invoiceId: string
    ): Promise<Result<Invoice, BillingError>> => {
        return invoiceEngine.getInvoice(invoiceId);
    },

    /**
     * Get invoices for a franchise
     * 
     * @param franchiseId - Franchise ID
     * @param status - Optional status filter
     * @returns Array of invoices or error
     */
    getInvoices: async (
        franchiseId: string,
        status?: 'DRAFT' | 'ISSUED' | 'RECTIFIED'
    ): Promise<Result<Invoice[], BillingError>> => {
        return invoiceEngine.getInvoicesByFranchise(franchiseId, status as any);
    },

    // ==================== BILLING CALCULATION ====================

    /**
     * Calculate billing based on logistics data
     * 
     * @param request - Billing calculation request
     * @returns Billing calculation result or error
     */
    calculateBilling: async (
        request: CalculateBillingRequest
    ): Promise<Result<BillingCalculationResult, BillingError>> => {
        return logisticsBillingEngine.calculateBilling(request);
    },

    // ==================== PAYMENT MANAGEMENT ====================

    /**
     * Add a payment to an invoice
     * 
     * @param request - Payment request
     * @param userId - User ID adding the payment
     * @returns Payment receipt or error
     */
    addPayment: async (
        request: AddPaymentRequest,
        userId: string
    ): Promise<Result<PaymentReceipt, BillingError>> => {
        return accountsReceivable.addPayment(request, userId);
    },

    /**
     * Get payment receipt by ID
     * 
     * @param receiptId - Payment receipt ID
     * @returns Payment receipt or error
     */
    getPaymentReceipt: async (
        receiptId: string
    ): Promise<Result<PaymentReceipt, BillingError>> => {
        return accountsReceivable.getPaymentReceipt(receiptId);
    },

    /**
     * Get payments for an invoice
     * 
     * @param invoiceId - Invoice ID
     * @returns Array of payment receipts or error
     */
    getInvoicePayments: async (
        invoiceId: string
    ): Promise<Result<PaymentReceipt[], BillingError>> => {
        return accountsReceivable.getPaymentsByInvoice(invoiceId);
    },

    // ==================== DEBT & TREASURY ====================

    /**
     * Generate debt dashboard for a franchise
     * 
     * @param franchiseId - Franchise ID
     * @returns Debt dashboard or error
     */
    getDebtDashboard: async (
        franchiseId: string
    ): Promise<Result<DebtDashboard, BillingError>> => {
        return accountsReceivable.generateDebtDashboard(franchiseId);
    },

    /**
     * Get debt for a specific customer
     * 
     * @param franchiseId - Franchise ID
     * @param customerId - Customer ID
     * @returns Customer debt or error
     */
    getCustomerDebt: async (
        franchiseId: string,
        customerId: string
    ): Promise<Result<any, BillingError>> => {
        return accountsReceivable.getCustomerDebt(franchiseId, customerId);
    },

    // ==================== TAX VAULT & MONTHLY CLOSE ====================

    /**
     * Execute monthly close for a franchise
     * 
     * @param request - Monthly close request
     * @returns Monthly close result or error
     */
    executeMonthlyClose: async (
        request: MonthlyCloseRequest
    ): Promise<Result<MonthlyCloseResult, BillingError>> => {
        return monthlyCloseWizard.executeMonthlyClose(request);
    },

    /**
     * Get tax vault entry for a franchise and period
     * 
     * @param franchiseId - Franchise ID
     * @param period - Period (YYYY-MM format)
     * @returns Tax vault entry or error
     */
    getTaxVaultEntry: async (
        franchiseId: string,
        period: string
    ): Promise<Result<any, BillingError>> => {
        return monthlyCloseWizard.getTaxVaultEntry(franchiseId, period);
    },

    /**
     * Request to unlock a closed month
     * 
     * @param franchiseId - Franchise ID
     * @param period - Period to unlock (YYYY-MM format)
     * @param userId - User ID requesting the unlock
     * @param reason - Reason for unlock
     * @returns Success or error
     */
    requestMonthUnlock: async (
        franchiseId: string,
        period: string,
        userId: string,
        reason: string
    ): Promise<Result<void, BillingError>> => {
        return monthlyCloseWizard.requestMonthUnlock(franchiseId, period, userId, reason);
    }
};

/**
 * Type-safe API route handlers
 * 
 * These handlers can be used with Firebase Cloud Functions or any backend framework
 */
export const billingRouteHandlers = {
    /**
     * POST /invoices
     * Create a new draft invoice
     */
    createInvoice: async (req: any, res: any) => {
        try {
            const { franchiseId, customerId, customerType, items } = req.body;
            const userId = req.user?.uid;
            
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            
            const request: CreateInvoiceRequest = {
                franchiseId,
                customerId,
                customerType,
                issueDate: req.body.issueDate,
                dueDate: req.body.dueDate,
                items,
                logisticsData: req.body.logisticsData
            };
            
            const result = await billingController.createInvoice(request, userId);
            
            if (result.success) {
                res.status(201).json({ invoiceId: result.data });
            } else {
                res.status(400).json({ error: result.error });
            }
        } catch (error) {
            console.error('Error in createInvoice route:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    /**
     * POST /invoices/:id/issue
     * Issue a draft invoice
     */
    issueInvoice: async (req: any, res: any) => {
        try {
            const { id } = req.params;
            const userId = req.user?.uid;
            
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            
            const request: IssueInvoiceRequest = {
                invoiceId: id,
                issuedBy: userId
            };
            
            const result = await billingController.issueInvoice(request);
            
            if (result.success) {
                res.status(200).json(result.data);
            } else {
                res.status(400).json({ error: result.error });
            }
        } catch (error) {
            console.error('Error in issueInvoice route:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    /**
     * POST /invoices/:id/rectify
     * Rectify an issued invoice
     */
    rectifyInvoice: async (req: any, res: any) => {
        try {
            const { id } = req.params;
            const { reason } = req.body;
            const userId = req.user?.uid;
            
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            
            const request: RectifyInvoiceRequest = {
                invoiceId: id,
                reason,
                rectifiedBy: userId
            };
            
            const result = await billingController.rectifyInvoice(request);
            
            if (result.success) {
                res.status(200).json(result.data);
            } else {
                res.status(400).json({ error: result.error });
            }
        } catch (error) {
            console.error('Error in rectifyInvoice route:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    /**
     * GET /invoices/:id
     * Get invoice by ID
     */
    getInvoice: async (req: any, res: any) => {
        try {
            const { id } = req.params;
            
            const result = await billingController.getInvoice(id);
            
            if (result.success) {
                res.status(200).json(result.data);
            } else {
                res.status(400).json({ error: result.error });
            }
        } catch (error) {
            console.error('Error in getInvoice route:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    /**
     * GET /invoices
     * Get invoices for a franchise
     */
    getInvoices: async (req: any, res: any) => {
        try {
            const { franchiseId, status } = req.query;
            
            const result = await billingController.getInvoices(franchiseId, status);
            
            if (result.success) {
                res.status(200).json(result.data);
            } else {
                res.status(400).json({ error: result.error });
            }
        } catch (error) {
            console.error('Error in getInvoices route:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    /**
     * POST /payments
     * Add a payment to an invoice
     */
    addPayment: async (req: any, res: any) => {
        try {
            const { invoiceId, amount, paymentMethod, paymentDate, reference, notes } = req.body;
            const userId = req.user?.uid;
            
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            
            const request: AddPaymentRequest = {
                invoiceId,
                amount,
                paymentMethod,
                paymentDate,
                reference,
                notes
            };
            
            const result = await billingController.addPayment(request, userId);
            
            if (result.success) {
                res.status(201).json(result.data);
            } else {
                res.status(400).json({ error: result.error });
            }
        } catch (error) {
            console.error('Error in addPayment route:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    /**
     * GET /debt/dashboard
     * Get debt dashboard for a franchise
     */
    getDebtDashboard: async (req: any, res: any) => {
        try {
            const { franchiseId } = req.query;
            
            const result = await billingController.getDebtDashboard(franchiseId);
            
            if (result.success) {
                res.status(200).json(result.data);
            } else {
                res.status(400).json({ error: result.error });
            }
        } catch (error) {
            console.error('Error in getDebtDashboard route:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    /**
     * POST /billing/calculate
     * Calculate billing based on logistics data
     */
    calculateBilling: async (req: any, res: any) => {
        try {
            const { franchiseId, customerId, customerType, period, logisticsRates } = req.body;
            
            const request: CalculateBillingRequest = {
                franchiseId,
                customerId,
                customerType,
                period,
                logisticsRates
            };
            
            const result = await billingController.calculateBilling(request);
            
            if (result.success) {
                res.status(200).json(result.data);
            } else {
                res.status(400).json({ error: result.error });
            }
        } catch (error) {
            console.error('Error in calculateBilling route:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    /**
     * POST /tax-vault/monthly-close
     * Execute monthly close for a franchise
     */
    executeMonthlyClose: async (req: any, res: any) => {
        try {
            const { franchiseId, period } = req.body;
            const userId = req.user?.uid;
            
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            
            const request: MonthlyCloseRequest = {
                franchiseId,
                period,
                requestedBy: userId
            };
            
            const result = await billingController.executeMonthlyClose(request);
            
            if (result.success) {
                res.status(200).json(result.data);
            } else {
                res.status(400).json({ error: result.error });
            }
        } catch (error) {
            console.error('Error in executeMonthlyClose route:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};
