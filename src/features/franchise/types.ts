export interface OrderCounts {
    [rateName: string]: number;
}

export interface RentingData {
    count: number;
    pricePerUnit: number;
}

export interface ExpenseData {
    // NO IVA
    payroll: number;    // Nominas y autonomo
    insurance: number;  // Seguros RC

    // SI IVA
    fuel: number;
    repairs: number;     // Reparaciones

    // Servicios Profesionales (Desglosados)
    agencyFee: number;      // Gestoría
    prlFee: number;         // PRL
    accountingFee: number;  // Servicios Financieros
    professionalServices: number; // Otros servicios prof. (Consultoría)

    renting: RentingData;

    // Operativos
    appFlyder: number;
    marketing: number;
    incidents: number;   // Mermas
    other: number;

    // New: Royalty
    royaltyPercent?: number; // Optional until migrated
    irpfPercent?: number;    // NEW: IRPF for net calculation

    // Fixed
    quota: number;       // Cuota Autónomo
}

export interface TaxData {
    vat: {
        charged: number;
        paid: number;
        toPay: number;
    };
    irpf: {
        amount: number;
    };
    totalReserve: number;
}

export interface SummaryData {
    grossProfit: number;
    netProfit: number;
    margin: number;
}

export interface SimpleFinanceData {
    month: string;
    orders: OrderCounts;
    expenses: ExpenseData;
    taxes?: TaxData;
    summary?: SummaryData;
    status: 'draft' | 'completed';
    revenue?: number; // Added for compatibility
    totalExpenses?: number; // Added for compatibility
    grossIncome?: number; // Added for compatibility
}
