interface Metrics {
    totalKm: number;
    gasoline?: number;
    incidentCost: number;
    otherExpenses: number;
    laborRatio: number;
    orders: number;
    avgTicket: number;
    productivity: number;
    revenue: number;
}

interface FinancialData {
    metrics: Metrics;
}

interface Alert {
    type: 'CRITICAL' | 'WARNING';
    code: string;
    title: string;
    message: string;
    metric: string;
}

export const detectAnomalies = (franchise: FinancialData): Alert[] => {
    const alerts: Alert[] = [];
    const m = franchise.metrics;

    if (!m) return alerts;

    // 1. FUEL THEFT (ROBO DE GASOLINA)
    // Rule: Consumption > 5L/100km (Approx 3.5 is normal for these bikes)
    // We calculate L/100km implied: (GasolineCost / PricePerLiter) / (TotalKm / 100)
    // Simplified trigger: If CostPerKm > 0.10€ (Normal is ~0.05-0.07€) and GasPrice is normal (~1.6)
    // Or just check CostPerKm related to Gasoline

    // Let's use the explicit 'costPerKm' metric which is total expenses / km. 
    // We need isolation on gasoline. 
    // If we have access to specific gasoline cost and total km:
    if (m.totalKm > 100) { // Only check if significant distance
        const gasolineCostPerKm = m.gasoline ? (m.gasoline / m.totalKm) : 0;
        // Assuming 1.6€/L -> 0.08€/km = 5L/100km. 
        if (gasolineCostPerKm > 0.09) {
            alerts.push({
                type: 'CRITICAL',
                code: 'FUEL_THEFT',
                title: 'Posible Robo de Gasolina',
                message: `Consumo excesivo detectado (${(gasolineCostPerKm * 100 / 1.6).toFixed(1)}L/100km est). Revisar tarjetas de combustible.`,
                metric: `${(gasolineCostPerKm * 100).toFixed(0)}€/100km`
            });
        }
    }

    // 2. HIDDEN COSTS (COSTES OCULTOS)
    // Rule: 0 Incidents declared but "Other Expenses" > 500€
    // This suggests they are categorizing losses as generic expenses to hide them.
    if (m.incidentCost === 0 && m.otherExpenses > 500) {
        alerts.push({
            type: 'WARNING',
            code: 'HIDDEN_COSTS',
            title: 'Costes Ocultos',
            message: '0€ en Mermas pero gastos "Otros" elevados. Posible ocultación de incidencias.',
            metric: `Otros: ${m.otherExpenses}€`
        });
    }

    // 3. LABOR INFLATION (SOBRECOSTE LABORAL)
    // Rule: Labor Ratio > 70% (Industry avg ~55-60%)
    if (m.laborRatio > 70) {
        alerts.push({
            type: 'CRITICAL',
            code: 'LABOR_INFLATION',
            title: 'Sobrecoste Laboral Severo',
            message: 'Salarios consumen +70% de los ingresos. Revisar horas fantasma o exceso de plantilla.',
            metric: `${m.laborRatio.toFixed(1)}%`
        });
    }

    // 4. LOW TICKET (BAJO TICKET)
    // Rule: Avg Ticket < 8€ (Suspiciously low for delivery, maybe splitting orders?)
    if (m.orders > 50 && m.avgTicket < 10) {
        alerts.push({
            type: 'WARNING',
            code: 'LOW_TICKET',
            title: 'Ticket Medio Anormal',
            message: 'Ticket medio por debajo de 10€. Posible error de facturación o "pedidos fake" para inflar volumen.',
            metric: `${m.avgTicket.toFixed(2)}€`
        });
    }

    // 5. ZOMBIE RIDER
    // Rule: Productivity < 1.5 orders/hour (Riders standing still)
    if (m.productivity > 0 && m.productivity < 1.5) {
        alerts.push({
            type: 'WARNING',
            code: 'LOW_PROD',
            title: 'Baja Productividad',
            message: 'Menos de 1.5 pedidos/hora. Exceso de horas contratadas para el volumen actual.',
            metric: `${m.productivity.toFixed(1)} ped/h`
        });
    }

    return alerts;
};
