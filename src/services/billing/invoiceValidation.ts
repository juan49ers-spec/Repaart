/**
 * Invoice Validation Schema
 * 
 * Validación robusta de facturas usando Zod
 * Inspirado en Invoify - estricto y completo
 */

import { z } from 'zod';

// Address Schema
const AddressSchema = z.object({
    street: z.string().min(1, 'La calle es obligatoria'),
    city: z.string().min(1, 'La ciudad es obligatoria'),
    zipCode: z.string().min(1, 'El código postal es obligatorio'),
    province: z.string().optional(),
    country: z.string().default('España')
});

// Customer/Issuer Snapshot Schema
const EntitySnapshotSchema = z.object({
    id: z.string().optional(),
    fiscalName: z.string().min(1, 'El nombre fiscal es obligatorio'),
    cif: z.string().min(1, 'El CIF/NIF es obligatorio'),
    address: AddressSchema.optional(),
    email: z.string().email('Email inválido').optional(),
    phone: z.string().optional()
});

// Invoice Line Schema
const InvoiceLineSchema = z.object({
    id: z.string().optional(),
    description: z.string().min(1, 'La descripción es obligatoria'),
    quantity: z.number().min(1, 'La cantidad debe ser al menos 1'),
    unitPrice: z.number().min(0, 'El precio no puede ser negativo'),
    discountRate: z.number().min(0).max(100).optional().default(0),
    taxRate: z.number().min(0).max(1, 'La tasa de IVA debe ser entre 0 y 1'),
    amount: z.number().min(0),
    taxAmount: z.number().min(0),
    total: z.number().min(0),
    logisticsRange: z.string().optional(),
    units: z.number().optional()
});

// Tax Breakdown Schema
const TaxBreakdownSchema = z.object({
    taxRate: z.number().min(0).max(1),
    taxableBase: z.number().min(0),
    taxAmount: z.number().min(0)
});

// Logistics Range Schema
const LogisticsRangeSchema = z.object({
    id: z.string(),
    name: z.string(),
    minKm: z.number(),
    maxKm: z.number(),
    pricePerUnit: z.number().min(0),
    units: z.number().min(0),
    subtotal: z.number().min(0)
});

// Logistics Data Schema
const LogisticsDataSchema = z.object({
    period: z.object({
        start: z.union([z.date(), z.any()]), // Firestore Timestamp
        end: z.union([z.date(), z.any()])
    }),
    ranges: z.array(LogisticsRangeSchema),
    totalUnits: z.number().min(0),
    totalKm: z.number().min(0).optional()
});

// Main Invoice Schema
export const InvoiceSchema = z.object({
    // Primary Keys
    id: z.string().optional(), // Optional for new invoices
    franchiseId: z.string().min(1, 'El ID de franquicia es obligatorio'),
    
    // Invoice Identification
    series: z.string().min(1, 'La serie es obligatoria'),
    number: z.number().int().min(1).optional(), // Auto-generated on issue
    fullNumber: z.string().optional(), // Auto-generated on issue
    
    // Status
    type: z.enum(['STANDARD', 'RECTIFICATIVE']).default('STANDARD'),
    status: z.enum(['DRAFT', 'ISSUED', 'RECTIFIED']).default('DRAFT'),
    paymentStatus: z.enum(['PENDING', 'PARTIAL', 'PAID']).default('PENDING'),
    
    // Entities
    customerId: z.string().min(1, 'El cliente es obligatorio'),
    customerType: z.enum(['FRANCHISE', 'RESTAURANT']),
    customerSnapshot: EntitySnapshotSchema,
    issuerSnapshot: EntitySnapshotSchema,
    
    // Dates
    issueDate: z.union([z.date(), z.any()]), // Firestore Timestamp or Date
    dueDate: z.union([z.date(), z.any()]),
    issuedAt: z.union([z.date(), z.any()]).optional(),
    rectifiedAt: z.union([z.date(), z.any()]).optional(),
    
    // Financial Data
    lines: z.array(InvoiceLineSchema).min(1, 'Debe haber al menos una línea'),
    subtotal: z.number().min(0),
    taxBreakdown: z.array(TaxBreakdownSchema),
    total: z.number().min(0),
    remainingAmount: z.number().min(0).default(0),
    
    // Payment Tracking
    paymentReceiptIds: z.array(z.string()).optional(),
    totalPaid: z.number().min(0).default(0),
    
    // Audit
    createdAt: z.union([z.date(), z.any()]).optional(),
    updatedAt: z.union([z.date(), z.any()]).optional(),
    createdBy: z.string().optional(),
    
    // Document
    pdfUrl: z.string().optional(),
    
    // Logistics
    logisticsData: LogisticsDataSchema.optional(),
    
    // Rectification
    originalInvoiceId: z.string().optional(),
    rectifyingInvoiceIds: z.array(z.string()).optional()
});

// Create Invoice Request Schema (for validation before creation)
export const CreateInvoiceRequestSchema = z.object({
    franchiseId: z.string().min(1, 'El ID de franquicia es obligatorio'),
    customerId: z.string().min(1, 'El cliente es obligatorio'),
    customerType: z.enum(['FRANCHISE', 'RESTAURANT']),
    issueDate: z.union([z.date(), z.string()]).transform(val => 
        typeof val === 'string' ? new Date(val) : val
    ),
    dueDate: z.union([z.date(), z.string()]).transform(val => 
        typeof val === 'string' ? new Date(val) : val
    ),
    items: z.array(z.object({
        description: z.string().min(1, 'La descripción es obligatoria'),
        quantity: z.number().min(1, 'La cantidad debe ser al menos 1'),
        unitPrice: z.number().min(0, 'El precio no puede ser negativo'),
        taxRate: z.number().min(0).max(1),
        discountRate: z.number().min(0).max(100).optional(),
        logisticsRange: z.string().optional()
    })).min(1, 'Debe haber al menos un item'),
    logisticsData: LogisticsDataSchema.optional(),
    notes: z.string().optional()
});

// Update Invoice Schema (for drafts only)
export const UpdateInvoiceSchema = z.object({
    customerId: z.string().optional(),
    customerSnapshot: EntitySnapshotSchema.optional(),
    issueDate: z.union([z.date(), z.string()]).optional(),
    dueDate: z.union([z.date(), z.string()]).optional(),
    items: z.array(z.object({
        description: z.string(),
        quantity: z.number(),
        unitPrice: z.number(),
        taxRate: z.number(),
        discountRate: z.number().optional(),
        logisticsRange: z.string().optional()
    })).optional(),
    logisticsData: LogisticsDataSchema.optional(),
    notes: z.string().optional()
});

// Issue Invoice Schema
export const IssueInvoiceSchema = z.object({
    invoiceId: z.string().min(1, 'El ID de factura es obligatorio'),
    issuedBy: z.string().min(1, 'El usuario que emite es obligatorio')
});

// Add Payment Schema
export const AddPaymentSchema = z.object({
    invoiceId: z.string().min(1, 'El ID de factura es obligatorio'),
    amount: z.number().positive('El importe debe ser positivo'),
    paymentMethod: z.enum(['TRANSFER', 'CASH', 'CARD', 'DIRECT_DEBIT', 'OTHER']),
    paymentDate: z.union([z.date(), z.string()]).transform(val => 
        typeof val === 'string' ? new Date(val) : val
    ),
    reference: z.string().optional(),
    notes: z.string().optional()
});

// Validation Functions
export const validateInvoice = (data: unknown) => {
    return InvoiceSchema.safeParse(data);
};

export const validateCreateRequest = (data: unknown) => {
    return CreateInvoiceRequestSchema.safeParse(data);
};

export const validateUpdateRequest = (data: unknown) => {
    return UpdateInvoiceSchema.safeParse(data);
};

export const validateIssueRequest = (data: unknown) => {
    return IssueInvoiceSchema.safeParse(data);
};

export const validatePayment = (data: unknown) => {
    return AddPaymentSchema.safeParse(data);
};

// Type exports
export type InvoiceValidation = z.infer<typeof InvoiceSchema>;
export type CreateInvoiceRequest = z.infer<typeof CreateInvoiceRequestSchema>;
export type UpdateInvoiceRequest = z.infer<typeof UpdateInvoiceSchema>;
export type IssueInvoiceRequest = z.infer<typeof IssueInvoiceSchema>;
export type AddPaymentRequest = z.infer<typeof AddPaymentSchema>;

// Custom validation helper
export const calculateInvoiceTotals = (lines: any[]) => {
    const subtotal = lines.reduce((sum, line) => sum + (line.amount || 0), 0);
    
    // Group taxes by rate
    const taxMap = new Map();
    lines.forEach(line => {
        const rate = line.taxRate || 0;
        const taxAmount = line.taxAmount || 0;
        if (taxMap.has(rate)) {
            const existing = taxMap.get(rate);
            existing.taxableBase += line.amount;
            existing.taxAmount += taxAmount;
        } else {
            taxMap.set(rate, {
                taxRate: rate,
                taxableBase: line.amount,
                taxAmount: taxAmount
            });
        }
    });
    
    const taxBreakdown = Array.from(taxMap.values());
    const totalTax = taxBreakdown.reduce((sum, tax) => sum + tax.taxAmount, 0);
    const total = subtotal + totalTax;
    
    return { subtotal, taxBreakdown, total };
};

// Validate invoice totals match
export const validateInvoiceTotals = (invoice: any): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    const { subtotal, taxBreakdown, total } = calculateInvoiceTotals(invoice.lines || []);
    
    // Check subtotal
    if (Math.abs(subtotal - invoice.subtotal) > 0.01) {
        errors.push(`Subtotal incorrecto: calculado ${subtotal.toFixed(2)}, recibido ${invoice.subtotal.toFixed(2)}`);
    }
    
    // Check total
    if (Math.abs(total - invoice.total) > 0.01) {
        errors.push(`Total incorrecto: calculado ${total.toFixed(2)}, recibido ${invoice.total.toFixed(2)}`);
    }
    
    // Check tax breakdown
    if (invoice.taxBreakdown?.length !== taxBreakdown.length) {
        errors.push('El desglose de impuestos no coincide');
    }
    
    return { valid: errors.length === 0, errors };
};

export default {
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
};
