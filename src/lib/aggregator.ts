// Basic interfaces for Aggregation
// These usually should be imported from types/finance.ts but defining here/compatible logic for now

interface BreakdownItem {
    name: string;
    value: number;
    type?: string;
    // ...
}

interface FinancialReport {
    revenue: number;
    orders: number;
    profit: number;
    expenses: number;
    taxes: {
        ivaRepercutido: number;
        ivaSoportado: number;
        ivaAPagar: number;
        irpfPago: number;
        netProfitPostTax: number;
        irpfPercent?: number;
    };
    metrics: {
        totalKm: number;
        revenuePerHour: number;
        productivity: number;
        marketingSpend: number;
        incidentCost: number;
        [key: string]: number;
    };
    breakdown: BreakdownItem[];
}

export const aggregateReports = (reports: FinancialReport[]) => {
    if (!reports || reports.length === 0) return null;

    let totalRevenue = 0;
    let totalOrders = 0;
    let totalNetProfit = 0;
    let totalExpenses = 0;

    // Taxes
    let totalIvaRepercutido = 0;
    let totalIvaSoportado = 0;
    let totalIvaAPagar = 0;
    let totalIrpfPago = 0;
    let totalNetProfitPostTax = 0;

    // Power Metrics / Logistics Sums help
    let totalKm = 0;
    let totalHours = 0;

    let totalMarketing = 0;
    let totalIncidents = 0;

    // Breakdown map
    const breakdownMap: Record<string, BreakdownItem> = {};

    reports.forEach(r => {
        if (!r) return;
        totalRevenue += r.revenue || 0;
        totalOrders += r.orders || 0;
        totalNetProfit += r.profit || 0;
        totalExpenses += r.expenses || 0;

        totalIvaRepercutido += r.taxes.ivaRepercutido || 0;
        totalIvaSoportado += r.taxes.ivaSoportado || 0;
        totalIvaAPagar += r.taxes.ivaAPagar || 0;
        totalIrpfPago += r.taxes.irpfPago || 0;
        totalNetProfitPostTax += r.taxes.netProfitPostTax || 0;

        // Metrics sums
        totalKm += r.metrics.totalKm || 0;
        // Approximation of hours if not present explicitly
        if (r.metrics.revenuePerHour > 0) {
            totalHours += (r.revenue / r.metrics.revenuePerHour);
        } else if (r.metrics.productivity > 0 && r.orders > 0) {
            totalHours += (r.orders / r.metrics.productivity);
        }

        totalMarketing += r.metrics.marketingSpend || 0;
        totalIncidents += r.metrics.incidentCost || 0;

        // Sum Breakdown
        r.breakdown.forEach(item => {
            if (!breakdownMap[item.name]) {
                breakdownMap[item.name] = { ...item, value: 0 };
            }
            breakdownMap[item.name].value += item.value;
        });
    });

    // Recalculate Average Metrics
    const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const costPerOrder = totalOrders > 0 ? totalExpenses / totalOrders : 0;
    const profitMargin = totalRevenue > 0 ? (totalNetProfit / totalRevenue) * 100 : 0;

    // Logistics
    const revenuePerKm = totalKm > 0 ? totalRevenue / totalKm : 0;
    const costPerKm = totalKm > 0 ? totalExpenses / totalKm : 0;
    const dropDensity = totalKm > 0 ? (totalOrders / totalKm) * 100 : 0;

    // Power
    const laborRatio = totalRevenue > 0 ? ((breakdownMap['Salarios']?.value || 0) / totalRevenue) * 100 : 0;
    const incidentRatio = totalRevenue > 0 ? (totalIncidents / totalRevenue) * 100 : 0;

    // Safety Margin (Re-calc based on aggregated Fixed Costs)
    let totalFixedLineItems = 0;
    Object.values(breakdownMap).forEach(item => {
        if (item.type === 'fixed') totalFixedLineItems += item.value;
    });

    // Break-even orders
    let breakEvenOrders: number | "N/A" = "N/A";
    let safetyMargin = 0;
    // Variable Cost per Order
    const totalVariable = totalExpenses - totalFixedLineItems;
    const variableCostPerOrder = totalOrders > 0 ? totalVariable / totalOrders : 0;
    const contributionMargin = avgTicket - variableCostPerOrder;

    if (contributionMargin > 0) {
        breakEvenOrders = Math.ceil(totalFixedLineItems / contributionMargin);
        if (typeof breakEvenOrders === 'number' && totalOrders > 0) {
            safetyMargin = ((totalOrders - breakEvenOrders) / totalOrders) * 100;
        }
    }

    return {
        revenue: totalRevenue,
        orders: totalOrders,
        profit: totalNetProfit,
        expenses: totalExpenses,
        taxes: {
            ivaRepercutido: totalIvaRepercutido,
            ivaSoportado: totalIvaSoportado,
            ivaAPagar: totalIvaAPagar,
            irpfPago: totalIrpfPago,
            netProfitPostTax: totalNetProfitPostTax,
            irpfPercent: 20 // Dummy for aggregate
        },
        metrics: {
            avgTicket,
            costPerOrder,
            breakEvenOrders,
            profitMargin,
            activeRiders: 0, // Not easily aggregatable without fetching inputs
            productivity: totalHours > 0 ? totalOrders / totalHours : 0,
            revenuePerHour: totalHours > 0 ? totalRevenue / totalHours : 0,
            costPerHour: totalHours > 0 ? totalExpenses / totalHours : 0,
            totalKm,
            revenuePerKm,
            costPerKm,
            dropDensity,
            safetyMargin,
            laborRatio,
            incidentRatio,
            marketingSpend: totalMarketing,
            incidentCost: totalIncidents
        },
        breakdown: Object.values(breakdownMap).sort((a, b) => b.value - a.value)
    };
};
