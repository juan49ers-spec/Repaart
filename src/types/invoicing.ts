/**
 * Billing & Treasury Domain Types for Repaart v3.0
 * Architecture: Immutable, Server-Side, ACID-compliant, European Regulatory Compliance
 */

import type { Timestamp } from 'firebase/firestore';

// =============================================================================
// ENUMS & CONSTANTS
// =============================================================================

export enum InvoiceStatus {
    DRAFT = 'DRAFT',           // Editable, deletable
    ISSUED = 'ISSUED',         // Immutable, read-only, legal serial number generated
    RECTIFIED = 'RECTIFIED'    // Annulled, linked to rectifying invoice
}

export enum PaymentStatus {
    PENDING = 'PENDING',       // No payments received
    PARTIAL = 'PARTIAL',       // Partial payments received
    PAID = 'PAID'              // Fully paid
}

export enum InvoiceType {
    STANDARD = 'STANDARD',
    RECTIFICATIVE = 'RECTIFICATIVE'
}

export enum TaxRate {
    GENERAL = 0.21,           // 21% IVA - General logistics services
    REDUCED = 0.10,           // 10% IVA - Reduced rate
    SUPER_REDUCED = 0.04,     // 4% IVA - Super reduced
    EXEMPT = 0.00             // 0% IVA - Exempt
}

export enum TaxType {
    IVA_REPERCUTIDO = 'IVA_REPERCUTIDO',
    IVA_RETENCION = 'IVA_RETENCION',
    IRPF_RESERVA = 'IRPF_RESERVA'
}

// =============================================================================
// CORE ENTITIES
// =============================================================================

export interface Invoice {
    // Primary Keys
    id: string;
    franchiseId: string;
    
    // Invoice Identification (Immutable after ISSUED)
    series: string;                    // e.g., "2026-A", "R-2026-A"
    number: number;                    // Sequential number within series
    fullNumber: string;                // "2026-A/1234"
    type: InvoiceType;
    template?: 'modern' | 'classic' | 'minimal' | 'corporate';  // PDF template to use
    status: InvoiceStatus;
    paymentStatus: PaymentStatus;
    
    // Customer Information (Snapshot at issuance time)
    customerId: string;
    customerType: 'FRANCHISE' | 'RESTAURANT';
    customerSnapshot: CustomerSnapshot;
    
    // Issuer Information (Snapshot at issuance time)
    issuerSnapshot: IssuerSnapshot;
    
    // Dates
    issueDate: Date | Timestamp;
    dueDate: Date | Timestamp;
    issuedAt?: Date | Timestamp;       // When transitioned to ISSUED
    rectifiedAt?: Date | Timestamp;    // When transitioned to RECTIFIED
    
    // Rectification
    originalInvoiceId?: string;        // For rectifying invoices
    rectifyingInvoiceIds?: string[];   // For original invoices
    
    // Financial Data (Immutable after ISSUED)
    lines: InvoiceLine[];
    subtotal: number;                  // Sum of line amounts
    taxBreakdown: TaxBreakdown[];      // Multiple tax rates possible
    total: number;                     // Final total including taxes
    remainingAmount: number;           // Amount pending payment
    
    // Document (Generated server-side only)
    pdfUrl?: string;                   // URL to immutable PDF storage
    
    // Payment Tracking
    paymentReceiptIds?: string[];      // Linked payment receipts
    totalPaid: number;                 // Sum of all linked payments
    
    // Audit Trail
    createdAt: Date | Timestamp;
    updatedAt: Date | Timestamp;
    createdBy?: string;
    
    // Logistics Specific (for range-based billing)
    logisticsData?: LogisticsBillingData;
}

export interface CustomerSnapshot {
    id: string;
    fiscalName: string;
    cif?: string;
    address?: {
        street: string;
        city: string;
        zipCode: string;
        province: string;
        country: string;
    };
    email?: string;
    phone?: string;
}

export interface IssuerSnapshot {
    id: string;
    fiscalName: string;
    cif: string;
    address: {
        street: string;
        city: string;
        zipCode: string;
        province: string;
        country: string;
    };
    email: string;
    phone?: string;
}

export interface InvoiceLine {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    discountRate?: number;
    taxRate: number;                   // Decimal (0.21 for 21%)
    amount: number;                    // Net amount (quantity * unitPrice - discount)
    taxAmount: number;                 // amount * taxRate
    total: number;                     // amount + taxAmount
    
    // Logistics specific
    logisticsRange?: string;           // e.g., "0-4km", "4-5km"
    units?: number;                    // Number of units in this range
}

export interface TaxBreakdown {
    taxRate: number;                   // 0.21, 0.10, etc.
    taxableBase: number;               // Sum of amounts with this rate
    taxAmount: number;                 // taxableBase * taxRate
}

// =============================================================================
// PAYMENT & TREASURY
// =============================================================================

export interface PaymentReceipt {
    id: string;
    franchiseId: string;
    invoiceId: string;
    
    // Payment Details
    amount: number;
    paymentDate: Date | Timestamp;
    paymentMethod: 'TRANSFER' | 'CASH' | 'CARD' | 'DIRECT_DEBIT' | 'OTHER';
    
    // Reference
    reference?: string;                // Bank transfer reference, receipt number, etc.
    notes?: string;
    
    // Customer Information (Snapshot)
    customerSnapshot: CustomerSnapshot;
    
    // Audit Trail
    createdAt: Date | Timestamp;
    createdBy?: string;
    verifiedAt?: Date | Timestamp;
    verifiedBy?: string;
    
    // Document evidence
    documentUrl?: string;              // Optional proof of payment
}

export interface DebtDashboard {
    franchiseId: string;
    customerDebts: CustomerDebt[];
    totalCurrentDebt: number;          // Debt <= 30 days
    totalOverdueDebt: number;          // Debt > 30 days
    totalDebt: number;
    calculatedAt: Date | Timestamp;
}

export interface CustomerDebt {
    customerId: string;
    customerName: string;
    currentDebt: number;               // Debt <= 30 days
    overdueDebt: number;               // Debt > 30 days
    totalDebt: number;
    invoices: InvoiceDebt[];
}

export interface InvoiceDebt {
    invoiceId: string;
    invoiceNumber: string;
    invoiceDate: Date | Timestamp;
    dueDate: Date | Timestamp;
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
    daysOverdue: number;
    status: InvoiceStatus;
    paymentStatus: PaymentStatus;
}

// =============================================================================
// LOGISTICS BILLING ENGINE
// =============================================================================

export interface LogisticsBillingData {
    period: {
        start: Date | Timestamp;
        end: Date | Timestamp;
    };
    ranges: LogisticsRange[];
    totalUnits: number;
    totalKm?: number;
}

export interface LogisticsRange {
    id: string;
    name: string;                      // e.g., "0-4km", "4-5km"
    minKm: number;
    maxKm: number;
    pricePerUnit: number;
    units: number;                     // Number of deliveries/orders in this range
    subtotal: number;                  // units * pricePerUnit
}

export interface BillingCalculationResult {
    lines: InvoiceLine[];
    subtotal: number;
    taxBreakdown: TaxBreakdown[];
    total: number;
}

// =============================================================================
// TAX VAULT & FISCAL BRIDGE
// =============================================================================

export interface TaxVaultEntry {
    id: string;
    franchiseId: string;
    period: string;                    // YYYY-MM format
    
    // Tax Buckets
    ivaRepercutido: number;            // Output VAT (charged on invoices)
    ivaSoportado: number;              // Input VAT (paid on expenses)
    irpfReserva: number;               // IRPF reserve
    
    // Locked Monthly Close
    isLocked: boolean;
    lockedAt?: Date | Timestamp;
    lockedBy?: string;
    
    // Audit Trail
    invoiceIds: string[];              // All invoices in this period
    expenseRecordIds?: string[];       // All expense records in this period
    
    createdAt: Date | Timestamp;
    updatedAt: Date | Timestamp;
}

export interface MonthlyCloseRequest {
    franchiseId: string;
    period: string;                    // YYYY-MM format
    requestedBy: string;
}

export interface MonthlyCloseResult {
    success: boolean;
    period: string;
    taxVaultEntry: TaxVaultEntry;
    summary: {
        totalInvoices: number;
        totalIncome: number;
        totalExpenses: number;
        totalTax: number;
    };
    closedAt: Date | Timestamp;
}

// =============================================================================
// REQUEST/RESPONSE DTOs
// =============================================================================

export interface CreateInvoiceRequest {
    franchiseId: string;
    customerId: string;
    customerType: 'FRANCHISE' | 'RESTAURANT';
    issueDate?: string;                // ISO date string
    dueDate?: string;                  // ISO date string
    items: {
        description: string;
        quantity: number;
        unitPrice: number;
        taxRate: number;
        discountRate?: number;
        logisticsRange?: string;
    }[];
    logisticsData?: LogisticsBillingData;
    template?: 'modern' | 'classic' | 'minimal' | 'corporate';  // PDF template selection
    notes?: string;
}

export interface IssueInvoiceRequest {
    invoiceId: string;
    issuedBy: string;
}

export interface RectifyInvoiceRequest {
    invoiceId: string;
    reason: string;
    rectifiedBy: string;
}

export interface AddPaymentRequest {
    invoiceId: string;
    amount: number;
    paymentMethod: 'TRANSFER' | 'CASH' | 'CARD' | 'DIRECT_DEBIT' | 'OTHER';
    paymentDate?: string;              // ISO date string
    reference?: string;
    notes?: string;
    documentFile?: File;
}

export interface CalculateBillingRequest {
    franchiseId: string;
    customerId: string;
    customerType: 'FRANCHISE' | 'RESTAURANT';
    period: {
        start: string;                 // ISO date string
        end: string;                   // ISO date string
    };
    logisticsRates: LogisticsRate[];
}

export interface LogisticsRate {
    id: string;
    name: string;
    minKm: number;
    maxKm: number;
    pricePerUnit: number;
}

// =============================================================================
// ERROR TYPES
// =============================================================================

export type BillingError =
    | { type: 'PERMISSION_DENIED'; franchiseId: string }
    | { type: 'VALIDATION_ERROR'; field: string; message: string }
    | { type: 'INVOICE_NOT_FOUND'; invoiceId: string }
    | { type: 'INVOICE_NOT_DRAFT'; invoiceId: string; currentStatus: InvoiceStatus }
    | { type: 'INVOICE_ALREADY_ISSUED'; invoiceId: string }
    | { type: 'INVOICE_ALREADY_RECTIFIED'; invoiceId: string }
    | { type: 'INVALID_RECTIFICATION'; originalInvoiceId: string; reason: string }
    | { type: 'DUPLICATE_INVOICE'; franchiseId: string; customerId: string; period: string; existingInvoiceNumber?: string }
    | { type: 'PAYMENT_EXCEEDS_TOTAL'; invoiceId: string; total: number; payment: number; remaining: number }
    | { type: 'TAX_VAULT_LOCKED'; period: string; franchiseId: string }
    | { type: 'MONTH_ALREADY_CLOSED'; period: string; franchiseId: string }
    | { type: 'INSUFFICIENT_LOGISTICS_DATA'; message: string }
    | { type: 'NETWORK_ERROR'; cause: Error }
    | { type: 'UNKNOWN_ERROR'; message: string; cause?: unknown };

// =============================================================================
// BACKWARD COMPATIBILITY
// =============================================================================
// Legacy type aliases for deprecated invoicing components
export type InvoiceDTO = Invoice;
export type FranchiseRestaurant = any;
