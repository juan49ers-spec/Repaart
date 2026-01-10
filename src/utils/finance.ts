/**
 * Safe Financial Utilities (TypeScript Version)
 * Pure functions with zero side effects.
 * Designed to withstand invalid inputs without crashing.
 */

export interface DeltaResult {
    value: number;
    isPositive: boolean;
    changed: boolean;
}

export interface ZoneStat {
    name: string;
    count: number;
    revenue: number;
    percentage: number;
}

export interface LogisticsSnapshotItem {
    rateId?: string;
    rateName: string;
    count: string | number;
    total: string | number;
}

export interface FinanceEntry {
    logisticsSnapshot?: LogisticsSnapshotItem[];
    [key: string]: any;
}

/**
 * Formats a number as EUR currency.
 * Returns empty string for invalid inputs (null, undefined, NaN).
 */
export const formatCurrency = (value: string | number | null | undefined): string => {
    if (value === '' || value === null || value === undefined) return '';

    // Safety check: parse if string (handles commas)
    let num = value;
    if (typeof value === 'string') {
        num = parseFloat(value.replace(',', '.'));
    }

    if (typeof num === 'number' && isNaN(num)) return '';

    try {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
            useGrouping: true, // Explicitly enforce grouping
        }).format(num as number);
    } catch {
        return ''; // Fail safe
    }
};

/**
 * Evaluates a simple math expression string safely.
 * e.g. "=50*12" -> 600
 */
export const evaluateFormula = (expression: string): number => {
    if (!expression || typeof expression !== 'string') return 0;

    // 1. Clean: Allow only digits, operators (+-*/), parens, dots, commas
    // Remove '=' if present at start
    const clean = expression.replace(/^=/, '').replace(',', '.').replace(/[^0-9+\-*/().]/g, '');

    if (!clean.trim()) return 0;

    // Safety: Prevent infinite loops or heavy calc, though unlikely in regex sanitized string
    // Safety: Check for div by zero
    if (/\/0(?![.0-9])/.test(clean)) throw new Error("División por cero");

    try {
        // eslint-disable-next-line no-new-func
        const result = new Function(`return ${clean}`)();

        if (!isFinite(result) || isNaN(result as number)) throw new Error("Resultado inválido");
        return result as number;
    } catch {
        throw new Error("Fórmula inválida");
    }
};

/**
 * Calculates the delta between two numbers.
 */
export const calculateDelta = (current: number | null | undefined, previous: number | null | undefined): DeltaResult => {
    // If either is incomplete, no delta
    if (current === null || current === undefined || previous === null || previous === undefined) {
        return { value: 0, isPositive: false, changed: false };
    }

    const diff = current - previous;
    return {
        value: diff,
        isPositive: diff > 0,
        changed: Math.abs(diff) > 0.001 // Floating point epsilon
    };
};

/**
 * Aggregates logistics snapshot data from multiple finance entries.
 * Returns a sortable array of zone performance stats.
 */
export const calculateLogisticsIntelligence = (entries: FinanceEntry[]): ZoneStat[] => {
    if (!Array.isArray(entries)) return [];

    const zoneStats: Record<string, { name: string; count: number; revenue: number }> = {};

    entries.forEach(entry => {
        // Handle "Snapshot" data if available, otherwise ignore or handle legacy
        const breakdown = entry.logisticsSnapshot || [];

        breakdown.forEach(item => {
            // Use ID as unique key, fallback to name (though name might change, ID is safe)
            // If we have "Ghost Zones" (resurrected), they will have an ID.
            const key = item.rateId || item.rateName;

            if (!zoneStats[key]) {
                zoneStats[key] = {
                    name: item.rateName, // Keep the most recent name encountered
                    count: 0,
                    revenue: 0
                };
            }

            zoneStats[key].count += (typeof item.count === 'string' ? parseFloat(item.count) : item.count) || 0;
            zoneStats[key].revenue += (typeof item.total === 'string' ? parseFloat(item.total) : item.total) || 0;
        });
    });

    // Calculate total for percentage
    const totalRevenue = Object.values(zoneStats).reduce((acc, curr) => acc + curr.revenue, 0);

    // Convert to array and enrich with percentage
    return Object.values(zoneStats)
        .map(stat => ({
            ...stat,
            percentage: totalRevenue > 0 ? (stat.revenue / totalRevenue) * 100 : 0
        }))
        .sort((a, b) => b.revenue - a.revenue);
};
