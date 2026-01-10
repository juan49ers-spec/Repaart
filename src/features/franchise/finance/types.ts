export interface OrderCounts {
    [key: string]: number;
}

export interface ExpenseData {
    payroll: number;
    quota: number;
    insurance: number;
    fuel: number;
    repairs: number;
    renting: {
        count: number;
        pricePerUnit: number;
    };
    agencyFee: number;
    prlFee: number;
    accountingFee: number;
    professionalServices: number;
    appFlyder: number;
    marketing: number;
    incidents: number;
    other: number;
    royaltyPercent?: number;
    irpfPercent?: number;
}

export interface SimpleFinanceData {
    month: string;
    totalIncome: number;
    expenses: ExpenseData;
    profit: number;
}
