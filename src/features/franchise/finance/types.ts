export interface OrderCounts {
    [key: string]: number;
}

// Simplified finance data for AI analysis and summary views
export interface SimpleFinanceData {
    revenue: number;
    totalExpenses: number;
    netProfit: number;
    totalHours: number;
    month: string;
}

export interface ExpenseData {
    renting?: {
        count: number;
        pricePerUnit: number;
    };
    royaltyPercent?: number;
    advertising?: number;
    civLiability?: number;
    agencyFee?: number;
    prlFee?: number;
    accountingFee?: number;
    services?: number;
    appFlyder?: number;
    marketing?: number;
    incidents?: number;
    otherExpenses?: number;
    irpfPercent?: number;
    socialSecurity?: number;
    payroll?: number;
    insurance?: number;
    fuel?: number;
    repairs?: number;
    professionalServices?: number;
    other?: number;
    quota?: number;
    repaartServices?: number;
}

export interface FinancialRecord {
    revenue?: number;
    totalIncome?: number;
    totalHours?: number;
    cancelledOrders?: number;
    status?: 'pending' | 'draft' | 'submitted' | 'approved' | 'unlock_requested' | 'locked' | 'open';
    rejectionReason?: string;
    ordersDetail?: Record<string, number>;
    ordersNew0To4?: number;
    ordersNew4To5?: number;
    ordersNew5To6?: number;
    ordersNew6To7?: number;
    ordersNewGt7?: number;
    salaries?: number;
    quota?: number;
    insurance?: number;
    gasoline?: number;
    repairs?: number;
    motoCount?: number;
    rentingCost?: number;
    agencyFee?: number;
    prlFee?: number;
    accountingFee?: number;
    services?: number;
    appFlyder?: number;
    marketing?: number;
    incidents?: number;
    otherExpenses?: number;
    socialSecurity?: number;
    repaartServices?: number;
    royaltyPercent?: number;
    irpfPercent?: number;
}

export interface LogisticsRate {
    name?: string;
    min?: number;
    max?: number;
    price: number;
}

export const FRANCHISE_CONFIG = {
    packType: 'PREMIUM',
    entryFee: 3000,
    amortizationMonths: 12,
    laborCostHour: 11.64,
    targetPPH: 3.2,
    flyderFee: 0.35,
    hasAccounting: true,
    hasAnalytics: true
};

export const REAL_DIST_FACTORS = {
    range_0_4: 2.9,
    range_4_5: 8.0,
    range_5_7: 10.4,
    range_7_plus: 15.9
};
