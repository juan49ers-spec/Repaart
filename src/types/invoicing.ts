
export interface FranchiseRestaurant {
    id: string;
    franchiseId: string;
    fiscalName: string;
    cif: string;
    address: {
        street: string;
        city: string;
        zipCode: string;
        province: string;
        country: string;
    };
    status: 'active' | 'inactive';
}

export interface InvoiceLine {
    description: string;
    quantity: number;
    unitPrice: number;
    discountRate?: number;
    taxRate: number;
    amount: number;       // Net amount
    taxAmount: number;    // Tax amount
    total: number;        // Gross amount
}

export interface InvoiceDTO {
    id: string;
    franchiseId: string;
    restaurantId?: string;
    customerId: string;
    customerCollection: 'restaurants' | 'franchises';

    series: string;
    number: number;
    fullNumber: string;

    type: 'standard' | 'credit_note';

    issueDate: { _seconds: number, _nanoseconds: number };
    dueDate: { _seconds: number, _nanoseconds: number };

    customerSnapshot: {
        id: string;
        fiscalName: string; // or displayName
        cif?: string;
        address?: any;
        email?: string;
    };

    lines: InvoiceLine[];
    subtotal: number;
    taxes: { rate: number, amount: number }[];
    total: number;

    status: 'draft' | 'issued' | 'paid' | 'cancelled';
    pdfUrl?: string;
}

export interface CreateInvoiceRequest {
    franchiseId: string;
    restaurantId?: string;
    customerId: string;
    customerCollection?: 'restaurants' | 'franchises';
    period: {
        start: string;
        end: string;
    };
    items: {
        description: string;
        quantity: number;
        unitPrice: number;
        taxRate: number;
    }[];
}
