// =====================================================
// TYPES & INTERFACES
// =====================================================

export type TariffType = 'NEW' | 'OLD';

export interface TariffConfig {
    NEW: {
        '0-4': number;
        '4-5': number;
        '5-6': number;
        '6-7': number;
        '>7': number;
    };
    OLD: {
        '0-3.5': number;
        '>3.5': number;
    };
}

export interface MonthlyData {
    revenue?: number;
    orders?: number;
    ordersNew0To4?: number;
    ordersNew4To5?: number;
    ordersNew5To6?: number;
    ordersNew6To7?: number;
    ordersNewGt7?: number;
    ordersOld0To35?: number;
    ordersOldGt35?: number;
    contractedRiders?: number;
    totalHours?: number;
    totalKm?: number;
    motoCount?: number;
    salaries?: number;
    insurance?: number;
    services?: number;
    agencyFee?: number;
    prlFee?: number;
    accountingFee?: number;
    gasoline?: number;
    gasolinePrice?: number;
    repairs?: number;
    marketing?: number;
    incidents?: number;
    otherExpenses?: number;
    appFlyder?: number; // Manual override for franchise fee
    quota?: number;
    royaltyPercent?: number;
    irpfPercent?: number;
    // Operational Metrics
    totalOperationalHours?: number;
    totalShiftsCount?: number;
    // Explicit Aggregates
    totalIncome?: number;
    totalExpenses?: number;
    expenses?: number;
    grossIncome?: number;
    profit?: number;
    // Status Fields
    status?: 'pending' | 'draft' | 'submitted' | 'approved' | 'locked' | 'unlock_requested';
    is_locked?: boolean;
    breakdown?: Record<string, number>;
}

export interface BreakdownItem {
    name: string;
    value: number;
    type: 'fixed' | 'variable';
}

export interface TaxInfo {
    ivaRepercutido: number;
    ivaSoportado: number;
    ivaAPagar: number;
    irpfPercent?: number;  // Made optional to match ExpenseData
    irpfPago: number;
    netProfitPostTax: number;
    // UI Helpers (Legacy compatibility)
    netProfit: number;
    margin: number;
    totalReserve: number;
    vat: {
        toPay: number;
    };
}

export interface Metrics {
    avgTicket: number;
    costPerOrder: number;
    breakEvenOrders: number | 'N/A';
    profitMargin: number;
    activeRiders: number;
    productivity: number;
    revenuePerHour: number;
    costPerHour: number;
    profitPerRider: number;
    totalKm: number;
    revenuePerKm: number;
    costPerKm: number;
    dropDensity: number;
    safetyMargin: number;
    laborRatio: number;
    incidentRatio: number;
    marketingSpend: number;
    incidentCost: number;
}

export interface FinancialReport {
    fixed: {
        salaries: number;
        renting: number;
        insurance: number;
        services: number;
        quota: number;
        other: number;
        total: number;
    };
    variable: {
        gasoline: number;
        repairs: number;
        flyderFee: number;
        royalty: number;
        total: number;
    };
    totalExpenses: number;
    netProfit: number;
    taxes: TaxInfo;
    metrics: Metrics;
    breakdown: BreakdownItem[];
    // Legacy support fields (for ViewSwitcher)
    revenue?: number;
    orders?: number;
}

export interface FinancialAlert {
    id: string;
    type: 'PROFIT' | 'COSTS';
    severity: 'critical' | 'warning';
    title: string;
    value: string;
    target: string;
    gapValue?: number;
    expenseName?: string;
    description: string;
    details: {
        diagnosis: string;
        impact: string;
        breakdown?: Array<{
            label: string;
            value: number;
            percentage: number;
        }>;
        actions: Array<{
            title: string;
            desc: string;
        }>;
    };
}

export interface FinancialAnalysis {
    kpi: {
        revenue: number;
        expenses: number;
        margin: number;
        status: 'healthy' | 'warning' | 'critical';
    };
    alerts: FinancialAlert[];
}

// Normalized expense for analysis
interface NormalizedExpense {
    amount: number;
    category: string;
}

// Input expense (flexible format)
export interface ExpenseInput {
    amount?: number;
    value?: number;
    cost?: number;
    category?: string;
    name?: string;
}

// =====================================================
// CONSTANTS
// =====================================================

export const TARIFFS: TariffConfig = {
    NEW: {
        '0-4': 5.50,
        '4-5': 6.50,
        '5-6': 7.50,
        '6-7': 8.50,
        '>7': 8.50
    },
    OLD: {
        '0-3.5': 5.50,
        '>3.5': 7.50
    }
};

export const DEFAULT_MONTH_DATA: MonthlyData = {
    revenue: 0,
    orders: 0,
    ordersNew0To4: 0,
    ordersNew4To5: 0,
    ordersNew5To6: 0,
    ordersNew6To7: 0,
    ordersNewGt7: 0,
    ordersOld0To35: 0,
    ordersOldGt35: 0,
    contractedRiders: 0,
    totalHours: 0,
    motoCount: 0,
    salaries: 0,
    insurance: 0,
    services: 0,
    agencyFee: 0,
    prlFee: 0,
    accountingFee: 0,
    gasoline: 0,
    gasolinePrice: 0,
    repairs: 0,
    marketing: 0,
    incidents: 0,
    otherExpenses: 0,
    quota: 0,
    royaltyPercent: 5,
    irpfPercent: 20
};

const THRESHOLDS = {
    MARGIN_WARNING: 15.0, // %
    MARGIN_CRITICAL: 5.0, // %
    COST_CONCENTRATION_RISK: 0.35, // 35%
} as const;

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Safely parses a value to float, handling nulls, undefined, and Spanish comma decimals.
 */
const safeFloat = (val: string | number | null | undefined): number => {
    if (val === null || val === undefined) return 0;
    if (typeof val === 'number') return val;

    // Handle Spanish format (1.234,56 -> 1234.56 or 12,56 -> 12.56)
    let strVal = String(val).trim();
    if (strVal === '') return 0;

    // Replace comma with dot after removing possible thousand dots
    strVal = strVal.replace(/\./g, '').replace(',', '.');

    const parsed = parseFloat(strVal);
    if (isNaN(parsed)) return 0;
    return parsed;
};

// =====================================================
// EXPORTED FUNCTIONS
// =====================================================

/**
 * Calculates raw revenue based on distance and tariff rules.
 */
export const calculateRevenue = (
    distance: number | string,
    tariffType: TariffType = 'NEW',
    tariffs: TariffConfig = TARIFFS
): number => {
    const dist = parseFloat(String(distance));
    if (isNaN(dist) || dist < 0) return 0;

    const RULES = tariffs || TARIFFS;

    if (tariffType === 'NEW') {
        if (dist <= 4) return RULES.NEW?.['0-4'] || 0;
        if (dist <= 5) return RULES.NEW?.['4-5'] || 0;
        if (dist <= 6) return RULES.NEW?.['5-6'] || 0;
        if (dist <= 7) return RULES.NEW?.['6-7'] || 0;
        return RULES.NEW?.['>7'] || 0;
    } else if (tariffType === 'OLD') {
        if (dist <= 3.5) return RULES.OLD?.['0-3.5'] || 0;
        return RULES.OLD?.['>3.5'] || 0;
    }
    return 0;
};

/**
 * Helper to calculate total revenue from a monthly data object (Firestore)
 */
export const calculateMonthlyRevenue = (
    data: MonthlyData | null | undefined,
    tariffs: TariffConfig = TARIFFS
): number => {
    if (!data) return 0;

    // 1. Prefer explicit stored revenue (Source of Truth from Manual Entry)
    // SUPPORT LEGACY/NESTED DATA: Check data.revenue, data.totalIncome, OR data.summary.grossIncome
    const storedRevenue = parseFloat(String(data.revenue || data.totalIncome || (data as any).summary?.grossIncome || 0));
    if (storedRevenue > 0) return storedRevenue;

    // 2. Fallback to calculation from orders (Legacy / Logistics only)
    const r = (d: number | undefined) => parseFloat(String(d)) || 0;

    const RULES = tariffs || TARIFFS;

    // New Tariff
    const revNew =
        r(data.ordersNew0To4) * (RULES.NEW?.['0-4'] || 0) +
        r(data.ordersNew4To5) * (RULES.NEW?.['4-5'] || 0) +
        r(data.ordersNew5To6) * (RULES.NEW?.['5-6'] || 0) +
        r(data.ordersNew6To7) * (RULES.NEW?.['6-7'] || 0) +
        r(data.ordersNewGt7) * (RULES.NEW?.['>7'] || 0);

    // Old Tariff
    const revOld =
        r(data.ordersOld0To35) * (RULES.OLD?.['0-3.5'] || 0) +
        r(data.ordersOldGt35) * (RULES.OLD?.['>3.5'] || 0);

    return revNew + revOld;
};

/**
 * Standard Spanish Money Format (1.234,56)
 */
export const formatMoney = (amount: number | string | null | undefined, decimals = 2): string => {
    const val = safeFloat(amount);
    return new Intl.NumberFormat('es-ES', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
        useGrouping: true
    }).format(val);
};

/**
 * Calculates complete financial report including profit, taxes, and metrics.
 */
export const calculateExpenses = (
    revenue: number,
    orderCount: number,
    inputs: Partial<MonthlyData> = {}
): FinancialReport => {
    // 1. Costs WITHOUT IVA
    const salaries = safeFloat(inputs.salaries);
    const insurance = safeFloat(inputs.insurance);
    const quota = safeFloat(inputs.quota);

    // 2. Costs WITH IVA (Base)
    const motoCount = safeFloat(inputs.motoCount);

    // FIXED: Use stored rentingCost if available, otherwise calculate with standard rate
    // This allows SimpleFinanceWizard to save custom renting prices
    const rentingBase = safeFloat((inputs as any).rentingCost) || (motoCount * 154);

    // Detailed Professional Services
    const agencyFeeBase = safeFloat(inputs.agencyFee);
    const prlFeeBase = safeFloat(inputs.prlFee);
    const accountingFeeBase = safeFloat(inputs.accountingFee);

    const totalProfServicesBase = agencyFeeBase + prlFeeBase + accountingFeeBase;

    const gasolineBase = safeFloat(inputs.gasoline);
    const gasolinePrice = safeFloat(inputs.gasolinePrice);

    const otherExpensesBase = safeFloat(inputs.otherExpenses) + safeFloat(inputs.marketing) + safeFloat(inputs.incidents);
    const repairsBase = safeFloat(inputs.repairs);

    // Specific tracking
    const marketing = safeFloat(inputs.marketing);
    const incidents = safeFloat(inputs.incidents);

    // Variable Costs
    // Use manual input if available, otherwise fallback to 0.35 * orders
    const flyderFeeBase = inputs.appFlyder !== undefined
        ? safeFloat(inputs.appFlyder)
        : orderCount * 0.35;

    const royaltyPercent = safeFloat(inputs.royaltyPercent);
    const royaltyBase = revenue * (royaltyPercent / 100);

    // Total Base Expenses (P&L View)
    const totalFixedCostsBase = salaries + rentingBase + insurance + totalProfServicesBase + quota + otherExpensesBase;
    const totalVariableCostsBase = flyderFeeBase + royaltyBase + gasolineBase + repairsBase;

    const calculatedTotalExpenses = totalFixedCostsBase + totalVariableCostsBase;

    // Explicit Total Override (if manual entry > calculated sum)
    // This allows manual "Total Expenses" entry without breakdown to work
    // SUPPORT LEGACY/NESTED DATA: Check inputs.totalExpenses, inputs.expenses, OR inputs.summary.totalExpenses
    const storedTotalExpenses = safeFloat(inputs.totalExpenses || inputs.expenses || (inputs as any).summary?.totalExpenses);
    const totalExpensesBase = Math.max(calculatedTotalExpenses, storedTotalExpenses);

    const netProfitPreTax = revenue - totalExpensesBase;

    // --- TAX ESTIMATION ---
    const ivaPercent = 0.21;
    const taxableExpensesBase = rentingBase + totalProfServicesBase + gasolineBase + repairsBase + flyderFeeBase + royaltyBase + otherExpensesBase;
    const ivaSoportado = taxableExpensesBase * ivaPercent;
    const ivaRepercutido = revenue * ivaPercent;
    const ivaAPagar = ivaRepercutido - ivaSoportado;

    const irpfPercent = safeFloat(inputs.irpfPercent) || 20;
    const irpfPago = netProfitPreTax > 0 ? netProfitPreTax * (irpfPercent / 100) : 0;

    const netProfitPostTax = netProfitPreTax - irpfPago;

    // --- METRICS ---
    const activeRiders = safeFloat(inputs.contractedRiders) + 1; // +1 Manager

    const totalHours = safeFloat(inputs.totalHours);

    // Logistics Metrics (Automated Calculation)
    let totalKm = 0;
    if (gasolinePrice > 0) {
        const litersConsumed = gasolineBase / gasolinePrice;
        totalKm = litersConsumed * 35; // Yamaha Liberty 125 factor
    } else {
        totalKm = safeFloat(inputs.totalKm);
    }
    totalKm = Math.round(Math.max(0, totalKm));

    let breakEvenOrders: number | 'N/A' = 'N/A';
    const avgTicket = orderCount > 0 ? revenue / orderCount : 0;
    const variableCostPerOrder = orderCount > 0 ? totalVariableCostsBase / orderCount : 0;
    const contributionMargin = avgTicket - variableCostPerOrder;

    if (contributionMargin > 0) {
        breakEvenOrders = Math.ceil(totalFixedCostsBase / contributionMargin);
    }

    let safetyMargin = 0;
    if (typeof breakEvenOrders === 'number' && orderCount > 0) {
        safetyMargin = ((orderCount - breakEvenOrders) / orderCount) * 100;
    }

    // --- POWER METRICS ---
    const laborRatio = revenue > 0 ? (salaries / revenue) * 100 : 0;
    const incidentRatio = revenue > 0 ? (incidents / revenue) * 100 : 0;

    return {
        fixed: {
            salaries,
            renting: rentingBase,
            insurance,
            services: totalProfServicesBase,
            quota,
            other: otherExpensesBase,
            total: totalFixedCostsBase
        },
        variable: {
            gasoline: gasolineBase,
            repairs: repairsBase,
            flyderFee: flyderFeeBase,
            royalty: royaltyBase,
            total: totalVariableCostsBase
        },
        totalExpenses: totalExpensesBase,
        netProfit: netProfitPreTax,
        taxes: {
            ivaRepercutido,
            ivaSoportado,
            ivaAPagar,
            irpfPercent,
            irpfPago,
            netProfitPostTax,
            // UI Helper Population
            netProfit: netProfitPreTax,
            margin: revenue > 0 ? (netProfitPreTax / revenue) * 100 : 0,
            totalReserve: ivaAPagar + irpfPago,
            vat: {
                toPay: ivaAPagar
            }
        },
        metrics: {
            avgTicket,
            costPerOrder: orderCount > 0 ? totalExpensesBase / orderCount : 0,
            breakEvenOrders,
            profitMargin: revenue > 0 ? (netProfitPreTax / revenue) * 100 : 0,
            activeRiders,
            productivity: totalHours > 0 ? orderCount / totalHours : 0,
            revenuePerHour: totalHours > 0 ? revenue / totalHours : 0,
            costPerHour: totalHours > 0 ? totalExpensesBase / totalHours : 0,
            profitPerRider: activeRiders > 0 ? netProfitPreTax / activeRiders : 0,
            totalKm,
            revenuePerKm: totalKm > 0 ? revenue / totalKm : 0,
            costPerKm: totalKm > 0 ? totalExpensesBase / totalKm : 0,
            dropDensity: totalKm > 0 ? (orderCount / totalKm) * 100 : 0,
            safetyMargin,
            laborRatio,
            incidentRatio,
            marketingSpend: marketing,
            incidentCost: incidents
        },
        breakdown: [
            { name: 'Salarios', value: salaries, type: 'fixed' },
            { name: 'Renting Motos', value: rentingBase, type: 'fixed' },
            { name: 'Seguros', value: insurance, type: 'fixed' },

            { name: 'Gestoría', value: agencyFeeBase, type: 'fixed' },
            { name: 'PRL', value: prlFeeBase, type: 'fixed' },
            { name: 'App Flyder', value: accountingFeeBase, type: 'fixed' },
            { name: 'Cuota Autónomo', value: quota, type: 'fixed' },
            { name: 'Marketing', value: marketing, type: 'fixed' },
            { name: 'Mermas', value: incidents, type: 'fixed' },
            { name: 'Otros Costes', value: safeFloat(inputs.otherExpenses), type: 'fixed' },
            { name: 'Gasolina', value: gasolineBase, type: 'variable' },
            { name: 'Reparaciones', value: repairsBase, type: 'variable' },
            { name: 'Servicios Financieros Repaart', value: flyderFeeBase, type: 'variable' },
            { name: 'Royalty', value: royaltyBase, type: 'variable' },
        ]
    };
};

// --- FORECASTING UTILS ---

/**
 * Simple Linear Regression: y = mx + b
 */
export const calculateTrend = (
    data: Array<Record<string, number | undefined>>,
    key: string,
    periodsToForecast = 3
): number[] => {
    const n = data.length;
    if (n < 2) return [];

    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    data.forEach((d, i) => {
        sumX += i;
        sumY += (d[key] || 0);
        sumXY += i * (d[key] || 0);
        sumXX += i * i;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return Array.from({ length: periodsToForecast }, (_, i) => {
        const nextIndex = n + i;
        const val = slope * nextIndex + intercept;
        return Math.max(0, val);
    });
};

/**
 * Project current month's metric to end of month (e.g. Day 15 -> Day 30)
 */
export const projectMonthEnd = (currentValue: number): number => {
    const now = new Date();
    const currentDay = now.getDate();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

    if (currentDay === 0) return currentValue;

    // Formula: (Current / Day) * TotalDays
    // Conservative factor (0.95) to avoid over-optimism
    const projection = (currentValue / currentDay) * lastDay * 0.95;

    return Math.max(currentValue, projection);
};

// --- ENTERPRISE FINANCIAL ANALYSIS ---

const currencyFormatter = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
});

export const formatCurrency = (amount: number | null | undefined): string => {
    return currencyFormatter.format(amount || 0);
};

/**
 * Financial Analysis Engine
 * Transforms raw data into actionable intelligence.
 */
export const analyzeFinancialHealth = (
    expenses: ExpenseInput[] = [],
    revenue = 0
): FinancialAnalysis => {
    const safeExpenses = Array.isArray(expenses) ? expenses : [];
    const safeRevenue = Number(revenue) || 0;

    // Normalize expenses
    const normalizedExpenses: NormalizedExpense[] = safeExpenses.map(e => ({
        amount: Number(e.amount ?? e.value ?? e.cost ?? 0),
        category: e.category ?? e.name ?? 'General'
    }));

    const totalExpenses = normalizedExpenses.reduce((acc, curr) => acc + curr.amount, 0);
    const netProfit = safeRevenue - totalExpenses;
    const profitMargin = safeRevenue > 0 ? (netProfit / safeRevenue) * 100 : 0;

    const alerts: FinancialAlert[] = [];

    // ANALYSIS 1: Margin Health
    if (safeRevenue > 0 && profitMargin < THRESHOLDS.MARGIN_WARNING) {
        const isCritical = profitMargin < THRESHOLDS.MARGIN_CRITICAL;
        const targetProfit = safeRevenue * (THRESHOLDS.MARGIN_WARNING / 100);
        const gap = targetProfit - netProfit;

        alerts.push({
            id: 'margin_risk',
            type: 'PROFIT',
            severity: isCritical ? 'critical' : 'warning',
            title: 'Margen Operativo Bajo',
            value: `${profitMargin.toFixed(1)}%`,
            target: `${THRESHOLDS.MARGIN_WARNING}%`,
            gapValue: gap,
            description: isCritical
                ? 'El negocio está en zona de supervivencia.'
                : 'Rentabilidad por debajo del estándar de la franquicia.',
            details: {
                diagnosis: 'Tus costos fijos absorben demasiada liquidez. El volumen de ventas actual no justifica la estructura de gastos.',
                impact: `Estás dejando de ganar ${formatCurrency(gap)} mensuales comparado con una operación saludable.`,
                actions: [
                    { title: 'Revisión de Precios', desc: 'Ajustar precios un 5% cubre el 60% de este hueco.' },
                    { title: 'Corte de Grasa', desc: 'Auditar servicios recurrentes (SaaS, Mantenimiento).' }
                ]
            }
        });
    }

    // ANALYSIS 2: Cost Concentration Risk (Pareto)
    const sortedExpenses = [...normalizedExpenses].sort((a, b) => b.amount - a.amount);

    if (sortedExpenses.length > 0) {
        const topExpense = sortedExpenses[0];
        const concentration = totalExpenses > 0 ? (topExpense.amount / totalExpenses) : 0;

        if (concentration > THRESHOLDS.COST_CONCENTRATION_RISK) {
            alerts.push({
                id: 'concentration_risk',
                type: 'COSTS',
                severity: 'warning',
                title: 'Dependencia de Proveedor',
                value: `${(concentration * 100).toFixed(0)}%`,
                target: '< 30%',
                expenseName: topExpense.category,
                description: `El rubro "${topExpense.category}" representa un riesgo estructural.`,
                details: {
                    diagnosis: `Tu operación es frágil ante cambios de precio en ${topExpense.category}. No tienes poder de negociación.`,
                    impact: `Una subida del 10% en este rubro reduciría tu utilidad en ${formatCurrency(topExpense.amount * 0.10)}.`,
                    breakdown: sortedExpenses.slice(0, 3).map(e => ({
                        label: e.category,
                        value: e.amount,
                        percentage: totalExpenses > 0 ? (e.amount / totalExpenses) * 100 : 0
                    })),
                    actions: [
                        { title: 'Diversificación', desc: 'Homologar un segundo proveedor antes de fin de mes.' },
                        { title: 'Compra por Volumen', desc: 'Negociar descuento por pago anticipado semestral.' }
                    ]
                }
            });
        }
    }

    return {
        kpi: {
            revenue: safeRevenue,
            expenses: totalExpenses,
            margin: profitMargin,
            status: alerts.length === 0 ? 'healthy' : (alerts.some(a => a.severity === 'critical') ? 'critical' : 'warning')
        },
        alerts
    };
};
