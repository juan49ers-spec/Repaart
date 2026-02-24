/**
 * Billing & Treasury Module Index
 *
 * Central exports for the billing module
 * Enhanced with Invoify-inspired features:
 * - Multiple PDF templates
 * - Multi-format export (Excel, CSV, JSON, XML)
 * - Robust Zod validation
 */

// Core Services
export { invoiceEngine } from './invoiceEngine';
export { logisticsBillingEngine } from './logisticsBillingEngine';
export { accountsReceivable } from './accountsReceivable';
export { taxVaultObserver, monthlyCloseWizard } from './taxVault';

// PDF Generation - Enhanced with Templates
export { invoicePdfGenerator } from './pdfGenerator';
export {
    generateInvoiceWithTemplate,
    generateModernTemplate,
    generateClassicTemplate,
    generateMinimalTemplate,
    generateCorporateTemplate
} from './invoiceTemplates';
export type { InvoiceTemplate, TemplateOptions } from './invoiceTemplates';

// Export Service - Multi-format export
export {
    exportToExcel,
    exportToCSV,
    exportToJSON,
    exportToXML,
    exportInvoice,
    downloadExport
} from './invoiceExport';

// Validation Service - Zod schemas
export {
    InvoiceSchema,
    CreateInvoiceRequestSchema,
    UpdateInvoiceSchema,
    IssueInvoiceSchema,
    AddPaymentSchema,
    validateInvoice,
    validateCreateRequest,
    validateUpdateRequest,
    validateIssueRequest,
    validatePayment,
    calculateInvoiceTotals,
    validateInvoiceTotals
} from './invoiceValidation';
export type {
    InvoiceValidation,
    CreateInvoiceRequest,
    UpdateInvoiceRequest,
    IssueInvoiceRequest,
    AddPaymentRequest
} from './invoiceValidation';

// Controllers
export { billingController, billingRouteHandlers } from './controllers/billingController';
