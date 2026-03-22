/**
 * Lógica de negocio pura para cálculos financieros del Centro de Control.
 * Agnóstica de React — testeable de forma aislada.
 */
import { OrderCounts, ExpenseData, REAL_DIST_FACTORS, FinancialRecord } from '../types';
import { LogisticsRate } from '../../../../types/franchise';

// --- Normalización de nombres de rango de distancia ---

export const normalizeRangeName = (s: string): string =>
    s.toLowerCase().replace(/\s/g, '').replace(/,/g, '.').replace('.1-', '-');

// --- Estimación de Km totales ---

export const estimateTotalKm = (orders: OrderCounts, rates: LogisticsRate[]): number => {
    if (!rates || rates.length === 0) {
        const km0_4 = (orders['0-4 km'] || 0) * REAL_DIST_FACTORS.range_0_4;
        const km4_5 = (orders['4-5 km'] || 0) * REAL_DIST_FACTORS.range_4_5;
        const km5_6 = (orders['5-6 km'] || 0) * REAL_DIST_FACTORS.range_5_7;
        const km6_7 = (orders['6-7 km'] || 0) * REAL_DIST_FACTORS.range_5_7;
        const kmGt7 = (orders['>7 km'] || 0) * REAL_DIST_FACTORS.range_7_plus;
        return km0_4 + km4_5 + km5_6 + km6_7 + kmGt7;
    }

    let totalKm = 0;
    Object.entries(orders).forEach(([range, count]) => {
        const rate = rates.find(r => r.name === range || `${r.min}-${r.max} km` === range);
        if (rate) {
            const avgDist = (rate.min + rate.max) / 2;
            totalKm += count * avgDist;
        }
    });
    return totalKm;
};

// --- Cálculo de stats financieras ---

export interface FinancialStats {
    totalExpenses: number;
    profit: number;
    fixedCosts: number;
    variableCosts: number;
    royaltyAmount: number;
    totalOrders: number;
    estimatedKm: number;
}

export const calculateStats = (
    totalIncome: number,
    expenses: ExpenseData,
    orders: OrderCounts,
    logisticsRates: LogisticsRate[]
): FinancialStats => {
    const rentingTotal = (expenses.renting?.count ?? 0) * (expenses.renting?.pricePerUnit ?? 0);
    const royaltyAmount = totalIncome * ((expenses.royaltyPercent || 5) / 100);

    const fixedCosts =
        (expenses.payroll ?? 0) + (expenses.socialSecurity ?? 0) + (expenses.quota ?? 0) +
        (expenses.insurance ?? 0) + (expenses.agencyFee ?? 0) + (expenses.prlFee ?? 0) +
        (expenses.accountingFee ?? 0) + (expenses.professionalServices ?? 0) +
        (expenses.appFlyder ?? 0) + (expenses.marketing ?? 0) + (expenses.repaartServices ?? 0);

    const variableCosts =
        (expenses.fuel ?? 0) + (expenses.repairs ?? 0) + rentingTotal +
        (expenses.incidents ?? 0) + (expenses.other ?? 0) + royaltyAmount;

    const totalExpenses = fixedCosts + variableCosts;
    const profit = totalIncome - totalExpenses;
    const totalOrders = Object.values(orders).reduce((sum, count) => sum + count, 0);
    const estimatedKm = estimateTotalKm(orders, logisticsRates);

    return { totalExpenses, profit, fixedCosts, variableCosts, royaltyAmount, totalOrders, estimatedKm };
};

// --- Cálculo de ingresos a partir de pedidos y tarifas ---

export const calculateIncomeFromOrders = (orders: OrderCounts, rates: LogisticsRate[]): number => {
    let calculatedIncome = 0;
    Object.entries(orders).forEach(([range, count]) => {
        const normRange = normalizeRangeName(range);
        const rate = rates.find(r =>
            normalizeRangeName(r.name || '') === normRange ||
            normalizeRangeName(`${r.min}-${r.max} km`) === normRange
        );
        if (rate && typeof rate.price === 'number') calculatedIncome += count * rate.price;
    });
    return calculatedIncome;
};

// --- Mapeo de datos de facturación a OrderCounts ---

export const mapInvoicedDataToOrders = (
    ordersDetail: Record<string, number>,
    activeRangeNames: string[]
): OrderCounts => {
    const mappedOrders: OrderCounts = {};
    activeRangeNames.forEach(r => mappedOrders[r] = 0);

    Object.entries(ordersDetail).forEach(([invKey, count]) => {
        const normInv = normalizeRangeName(invKey);
        const match = activeRangeNames.find(r => normalizeRangeName(r) === normInv);
        if (match) {
            mappedOrders[match] = (mappedOrders[match] || 0) + count;
        } else {
            mappedOrders[invKey] = count;
        }
    });

    return mappedOrders;
};

// --- Mapeo de FinancialRecord a ExpenseData ---

export const mapRecordToExpenses = (data: FinancialRecord, defaultRoyalty: number = 5): ExpenseData => ({
    payroll: data.salaries || 0,
    quota: data.quota || 0,
    insurance: data.insurance || 0,
    fuel: data.gasoline || 0,
    repairs: data.repairs || 0,
    renting: {
        count: data.motoCount || 0,
        pricePerUnit: (data.motoCount && Number.isFinite(Number(data.rentingCost)))
            ? Number(data.rentingCost) / data.motoCount
            : 159
    },
    agencyFee: data.agencyFee || 0,
    prlFee: data.prlFee || 0,
    accountingFee: data.accountingFee || 0,
    professionalServices: data.services || 0,
    appFlyder: data.appFlyder || 0,
    marketing: data.marketing || 0,
    incidents: data.incidents || 0,
    other: data.otherExpenses || 0,
    royaltyPercent: data.royaltyPercent ?? defaultRoyalty,
    irpfPercent: data.irpfPercent ?? 20,
    repaartServices: data.repaartServices || 0,
    socialSecurity: data.socialSecurity || 0
});

// --- Reconstrucción de OrderCounts desde FinancialRecord (legacy) ---

export const mapRecordToOrders = (data: FinancialRecord): OrderCounts => {
    if (data.ordersDetail) return { ...data.ordersDetail };

    const orders: OrderCounts = {};
    if (data.ordersNew0To4) orders['0-4 km'] = data.ordersNew0To4;
    if (data.ordersNew4To5) orders['4-5 km'] = data.ordersNew4To5;
    if (data.ordersNew5To6) orders['5-6 km'] = data.ordersNew5To6;
    if (data.ordersNew6To7) orders['6-7 km'] = data.ordersNew6To7;
    if (data.ordersNewGt7) orders['>7 km'] = data.ordersNewGt7;
    return orders;
};

// --- Preparar payload de persistencia ---

export const buildPersistencePayload = (params: {
    month: string;
    totalIncome: number;
    totalHours: number;
    expenses: ExpenseData;
    orders: OrderCounts;
    cancelledOrders: number;
    status: FinancialRecord['status'];
    shouldLock: boolean;
    reportTotalExpenses: number;
    reportNetProfitPostTax: number;
    totalOrders: number;
}): Partial<FinancialRecord> => {
    const { month, totalIncome, totalHours, expenses, orders, cancelledOrders, status, shouldLock, reportTotalExpenses, reportNetProfitPostTax, totalOrders } = params;

    return {
        month,
        totalHours,
        totalIncome,
        revenue: totalIncome,
        grossIncome: totalIncome,
        salaries: expenses.payroll,
        socialSecurity: expenses.socialSecurity,
        quota: expenses.quota,
        insurance: expenses.insurance,
        gasoline: expenses.fuel,
        repairs: expenses.repairs,
        motoCount: expenses.renting?.count ?? 0,
        rentingCost: (expenses.renting?.count ?? 0) * (expenses.renting?.pricePerUnit ?? 0),
        agencyFee: expenses.agencyFee,
        prlFee: expenses.prlFee,
        accountingFee: expenses.accountingFee,
        services: expenses.professionalServices,
        appFlyder: expenses.appFlyder,
        marketing: expenses.marketing,
        incidents: expenses.incidents,
        otherExpenses: expenses.other,
        repaartServices: expenses.repaartServices,
        totalExpenses: reportTotalExpenses,
        profit: reportNetProfitPostTax,
        orders: totalOrders,
        ordersDetail: orders,
        cancelledOrders,
        status: (shouldLock ? 'approved' : status) as FinancialRecord['status'],
        is_locked: shouldLock,
        isLocked: shouldLock,
        royaltyPercent: expenses.royaltyPercent,
        irpfPercent: expenses.irpfPercent,
        updatedAt: new Date().toISOString()
    };
};
