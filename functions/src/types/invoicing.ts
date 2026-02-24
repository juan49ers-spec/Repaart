
import { Timestamp } from 'firebase-admin/firestore';

export interface Franchise {
    id: string;
    name: string;
    code: string; // "FR01"
    fiscalName: string;
    cif: string;
    address: string;
}

export interface Restaurant {
    id: string;
    franchiseId: string;

    fiscalName: string;
    cif: string;
    email?: string;
    phone?: string;
    address: {
        street: string;
        city: string;
        zipCode: string;
        province: string;
        country: string;
    };

    status: 'active' | 'inactive';
    tariffId?: string;
    notes?: string;

    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface Tariff {
    id: string;
    franchiseId: string;
    name: string;
    isDefault: boolean;
    tranches: TariffTranche[];
    active: boolean;
}

export interface TariffTranche {
    minKm: number;
    maxKm: number;
    basePrice: number;
}

export interface Invoice {
    id: string;
    franchiseId: string;
    restaurantId?: string; // Optional (legacy)
    customerId: string;    // Generic
    customerCollection: 'restaurants' | 'franchises';

    // Sequential Numbering
    series: string;        // "F-2026-FR01"
    number: number;        // 1001
    fullNumber: string;    // "F-2026-FR01-1001"

    type: 'standard' | 'credit_note';
    originalInvoiceId?: string;

    // Dates
    issueDate: Timestamp;
    dueDate: Timestamp;
    periodStart: Timestamp;
    periodEnd: Timestamp;

    // Snapshots (Immutable)
    customerSnapshot: {
        id: string;
        fiscalName: string;
        cif: string;
        address: string; // Formatted
    };
    issuerSnapshot: {
        id: string;
        fiscalName: string;
        cif: string;
        address: string;
    };

    // Lines
    lines: InvoiceLine[];

    // Totales
    subtotal: number;
    taxes: {
        rate: number; // 21
        amount: number;
    }[];
    total: number;

    status: 'draft' | 'issued' | 'paid' | 'cancelled';
    pdfUrl?: string;

    createdBy: string;
    createdAt: Timestamp;
}

export interface InvoiceLine {
    description: string;
    quantity: number;
    unitPrice: number;
    discountRate?: number; // 0-100
    taxRate: number;      // 21
    amount: number;       // Net amount (q * p * (1-d))
    taxAmount: number;    // Tax amount
    total: number;        // Gross amount (amount + tax)
}

// DTOs for API
export interface CreateInvoiceRequest {
    franchiseId: string;
    restaurantId?: string; // Optional for backward compatibility
    customerId: string; // Generic customer ID
    customerCollection?: 'restaurants' | 'franchises'; // Target collection
    period: {
        start: string; // ISO Date
        end: string;   // ISO Date
    };
    items: {
        description: string;
        quantity: number;
        unitPrice: number;
        taxRate: number;
    }[];
}
