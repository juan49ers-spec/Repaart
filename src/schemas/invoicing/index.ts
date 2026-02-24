/**
 * Zod Validation Schemas for Billing & Treasury Module
 * Provides runtime type validation and coercion for all DTOs
 */

import { z } from 'zod';

// =============================================================================
// ENUMS
// =============================================================================

export const InvoiceStatusSchema = z.enum(['DRAFT', 'ISSUED', 'RECTIFIED']);
export const PaymentStatusSchema = z.enum(['PENDING', 'PARTIAL', 'PAID']);
export const InvoiceTypeSchema = z.enum(['STANDARD', 'RECTIFICATIVE']);
export const TaxRateSchema = z.number().min(0).max(1);
export const TaxTypeSchema = z.enum(['IVA_REPERCUTIDO', 'IVA_RETENCION', 'IRPF_RESERVA']);
export const PaymentMethodSchema = z.enum(['TRANSFER', 'CASH', 'CARD', 'DIRECT_DEBIT', 'OTHER']);
export const CustomerTypeSchema = z.enum(['FRANCHISE', 'RESTAURANT']);

// =============================================================================
// COMMON SCHEMAS
// =============================================================================

export const CustomerSnapshotSchema = z.object({
    id: z.string().min(1),
    fiscalName: z.string().min(1),
    cif: z.string().optional(),
    address: z.object({
        street: z.string().min(1),
        city: z.string().min(1),
        zipCode: z.string().min(1),
        province: z.string().min(1),
        country: z.string().min(1),
    }).optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
});

export const IssuerSnapshotSchema = z.object({
    id: z.string().min(1),
    fiscalName: z.string().min(1),
    cif: z.string().min(1),
    address: z.object({
        street: z.string().min(1),
        city: z.string().min(1),
        zipCode: z.string().min(1),
        province: z.string().min(1),
        country: z.string().min(1),
    }),
    email: z.string().email(),
    phone: z.string().optional(),
});

// =============================================================================
// REQUEST SCHEMAS
// =============================================================================

export const CreateInvoiceRequestSchema = z.object({
    franchiseId: z.string().min(1, 'Franchise ID is required'),
    customerId: z.string().min(1, 'Customer ID is required'),
    customerType: CustomerTypeSchema,
    issueDate: z.string().datetime().optional(),
    dueDate: z.string().datetime().optional(),
    items: z.array(z.object({
        description: z.string().min(1, 'Description is required'),
        quantity: z.number().positive('Quantity must be positive'),
        unitPrice: z.number().nonnegative('Unit price must be non-negative'),
        taxRate: z.number().min(0).max(1),
        discountRate: z.number().min(0).max(1).optional(),
        logisticsRange: z.string().optional(),
    })).min(1, 'At least one item is required'),
    logisticsData: z.object({
        period: z.object({
            start: z.string().datetime(),
            end: z.string().datetime(),
        }),
        ranges: z.array(z.object({
            id: z.string(),
            name: z.string(),
            minKm: z.number(),
            maxKm: z.number(),
            pricePerUnit: z.number().nonnegative(),
            units: z.number().nonnegative(),
            subtotal: z.number().nonnegative(),
        })),
        totalUnits: z.number().nonnegative(),
        totalKm: z.number().nonnegative().optional(),
    }).optional(),
    notes: z.string().optional(),
});

export const IssueInvoiceRequestSchema = z.object({
    invoiceId: z.string().min(1, 'Invoice ID is required'),
    issuedBy: z.string().min(1, 'Issuer user ID is required'),
});

export const RectifyInvoiceRequestSchema = z.object({
    invoiceId: z.string().min(1, 'Invoice ID is required'),
    reason: z.string().min(1, 'Reason is required'),
    rectifiedBy: z.string().min(1, 'User ID is required'),
});

export const AddPaymentRequestSchema = z.object({
    invoiceId: z.string().min(1, 'Invoice ID is required'),
    amount: z.number().positive('Amount must be positive'),
    paymentMethod: PaymentMethodSchema,
    paymentDate: z.string().datetime().optional(),
    reference: z.string().optional(),
    notes: z.string().optional(),
});

export const CalculateBillingRequestSchema = z.object({
    franchiseId: z.string().min(1, 'Franchise ID is required'),
    customerId: z.string().min(1, 'Customer ID is required'),
    customerType: CustomerTypeSchema,
    period: z.object({
        start: z.string().datetime('Start date must be a valid ISO date'),
        end: z.string().datetime('End date must be a valid ISO date'),
    }),
    logisticsRates: z.array(z.object({
        id: z.string(),
        name: z.string(),
        minKm: z.number(),
        maxKm: z.number(),
        pricePerUnit: z.number().nonnegative(),
    })).min(1, 'At least one logistics rate is required'),
});

export const MonthlyCloseRequestSchema = z.object({
    franchiseId: z.string().min(1, 'Franchise ID is required'),
    period: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Period must be in YYYY-MM format'),
    requestedBy: z.string().min(1, 'User ID is required'),
});

// =============================================================================
// RESPONSE SCHEMAS
// =============================================================================

export const InvoiceLineSchema = z.object({
    id: z.string(),
    description: z.string(),
    quantity: z.number().nonnegative(),
    unitPrice: z.number().nonnegative(),
    discountRate: z.number().min(0).max(1).optional(),
    taxRate: z.number().min(0).max(1),
    amount: z.number().nonnegative(),
    taxAmount: z.number().nonnegative(),
    total: z.number().nonnegative(),
    logisticsRange: z.string().optional(),
    units: z.number().optional(),
});

export const TaxBreakdownSchema = z.object({
    taxRate: z.number().min(0).max(1),
    taxableBase: z.number().nonnegative(),
    taxAmount: z.number().nonnegative(),
});

export const InvoiceSchema = z.object({
    id: z.string(),
    franchiseId: z.string(),
    series: z.string(),
    number: z.number().int().nonnegative(),
    fullNumber: z.string(),
    type: InvoiceTypeSchema,
    status: InvoiceStatusSchema,
    paymentStatus: PaymentStatusSchema,
    customerId: z.string(),
    customerType: CustomerTypeSchema,
    customerSnapshot: CustomerSnapshotSchema,
    issuerSnapshot: IssuerSnapshotSchema,
    issueDate: z.union([z.date(), z.any()]), // Timestamp from Firestore
    dueDate: z.union([z.date(), z.any()]),
    issuedAt: z.union([z.date(), z.any()]).optional(),
    rectifiedAt: z.union([z.date(), z.any()]).optional(),
    originalInvoiceId: z.string().optional(),
    rectifyingInvoiceIds: z.array(z.string()).optional(),
    lines: z.array(InvoiceLineSchema),
    subtotal: z.number().nonnegative(),
    taxBreakdown: z.array(TaxBreakdownSchema),
    total: z.number().nonnegative(),
    remainingAmount: z.number().nonnegative(),
    pdfUrl: z.string().url().optional(),
    paymentReceiptIds: z.array(z.string()).optional(),
    totalPaid: z.number().nonnegative(),
    createdAt: z.union([z.date(), z.any()]),
    updatedAt: z.union([z.date(), z.any()]),
    createdBy: z.string().optional(),
    logisticsData: z.object({
        period: z.object({
            start: z.union([z.date(), z.any()]),
            end: z.union([z.date(), z.any()]),
        }),
        ranges: z.array(z.object({
            id: z.string(),
            name: z.string(),
            minKm: z.number(),
            maxKm: z.number(),
            pricePerUnit: z.number().nonnegative(),
            units: z.number().nonnegative(),
            subtotal: z.number().nonnegative(),
        })),
        totalUnits: z.number().nonnegative(),
        totalKm: z.number().nonnegative().optional(),
    }).optional(),
});

export const PaymentReceiptSchema = z.object({
    id: z.string(),
    franchiseId: z.string(),
    invoiceId: z.string(),
    amount: z.number().positive(),
    paymentDate: z.union([z.date(), z.any()]),
    paymentMethod: PaymentMethodSchema,
    reference: z.string().optional(),
    notes: z.string().optional(),
    customerSnapshot: CustomerSnapshotSchema,
    createdAt: z.union([z.date(), z.any()]),
    createdBy: z.string().optional(),
    verifiedAt: z.union([z.date(), z.any()]).optional(),
    verifiedBy: z.string().optional(),
    documentUrl: z.string().url().optional(),
});

export const InvoiceDebtSchema = z.object({
    invoiceId: z.string(),
    invoiceNumber: z.string(),
    invoiceDate: z.union([z.date(), z.any()]),
    dueDate: z.union([z.date(), z.any()]),
    totalAmount: z.number().nonnegative(),
    paidAmount: z.number().nonnegative(),
    remainingAmount: z.number().nonnegative(),
    daysOverdue: z.number().int().nonnegative(),
    status: InvoiceStatusSchema,
    paymentStatus: PaymentStatusSchema,
});

export const CustomerDebtSchema = z.object({
    customerId: z.string(),
    customerName: z.string(),
    currentDebt: z.number().nonnegative(),
    overdueDebt: z.number().nonnegative(),
    totalDebt: z.number().nonnegative(),
    invoices: z.array(InvoiceDebtSchema),
});

export const DebtDashboardSchema = z.object({
    franchiseId: z.string(),
    customerDebts: z.array(CustomerDebtSchema),
    totalCurrentDebt: z.number().nonnegative(),
    totalOverdueDebt: z.number().nonnegative(),
    totalDebt: z.number().nonnegative(),
    calculatedAt: z.union([z.date(), z.any()]),
});

export const TaxVaultEntrySchema = z.object({
    id: z.string(),
    franchiseId: z.string(),
    period: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Period must be in YYYY-MM format'),
    ivaRepercutido: z.number(),
    ivaSoportado: z.number(),
    irpfReserva: z.number(),
    isLocked: z.boolean(),
    lockedAt: z.union([z.date(), z.any()]).optional(),
    lockedBy: z.string().optional(),
    invoiceIds: z.array(z.string()),
    expenseRecordIds: z.array(z.string()).optional(),
    createdAt: z.union([z.date(), z.any()]),
    updatedAt: z.union([z.date(), z.any()]),
});

export const MonthlyCloseResultSchema = z.object({
    success: z.boolean(),
    period: z.string(),
    taxVaultEntry: TaxVaultEntrySchema,
    summary: z.object({
        totalInvoices: z.number().int().nonnegative(),
        totalIncome: z.number(),
        totalExpenses: z.number(),
        totalTax: z.number(),
    }),
    closedAt: z.union([z.date(), z.any()]),
});

export const BillingCalculationResultSchema = z.object({
    lines: z.array(InvoiceLineSchema),
    subtotal: z.number().nonnegative(),
    taxBreakdown: z.array(TaxBreakdownSchema),
    total: z.number().nonnegative(),
});

// =============================================================================
// EXPORT TYPES
// =============================================================================

export type CreateInvoiceRequest = z.infer<typeof CreateInvoiceRequestSchema>;
export type IssueInvoiceRequest = z.infer<typeof IssueInvoiceRequestSchema>;
export type RectifyInvoiceRequest = z.infer<typeof RectifyInvoiceRequestSchema>;
export type AddPaymentRequest = z.infer<typeof AddPaymentRequestSchema>;
export type CalculateBillingRequest = z.infer<typeof CalculateBillingRequestSchema>;
export type MonthlyCloseRequest = z.infer<typeof MonthlyCloseRequestSchema>;
export type Invoice = z.infer<typeof InvoiceSchema>;
export type PaymentReceipt = z.infer<typeof PaymentReceiptSchema>;
export type DebtDashboard = z.infer<typeof DebtDashboardSchema>;
export type TaxVaultEntry = z.infer<typeof TaxVaultEntrySchema>;
export type MonthlyCloseResult = z.infer<typeof MonthlyCloseResultSchema>;
export type BillingCalculationResult = z.infer<typeof BillingCalculationResultSchema>;
