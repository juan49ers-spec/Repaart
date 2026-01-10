import { describe, it, expect } from 'vitest';
import { analyzeFinancialHealth, formatCurrency, calculateMonthlyRevenue, calculateExpenses, TARIFFS } from './finance';

// Mock helper
const mockExpenses = (value: number, name = 'General') => [{ name, value }];

describe('Financial Core Engine', () => {

    // --- 1. REVENUE CALCULATION ---
    describe('calculateMonthlyRevenue', () => {
        const mockData = {
            ordersNew0To4: 10,  // x 5.50 = 55
            ordersNew4To5: 5,   // x 6.50 = 32.5
            ordersNew5To6: 2,   // x 7.50 = 15
            ordersNew6To7: 1,   // x 8.50 = 8.5
            ordersNewGt7: 1     // x 8.50 = 8.5
            // Total New: 119.5
        };

        it('should calculate revenue correctly with default tariffs', () => {
            const revenue = calculateMonthlyRevenue(mockData);
            expect(revenue).toBe(119.5);
        });

        it('should respond to custom tariffs (Reactivity check)', () => {
            const customTariffs = JSON.parse(JSON.stringify(TARIFFS));
            // Increase base rate
            // @ts-ignore - Dynamic property access for test
            customTariffs.NEW['0-4'] = 10.00;

            const revenue = calculateMonthlyRevenue(mockData, customTariffs);
            // 10 orders * 10.00 = 100
            // + remaining (32.5 + 15 + 8.5 + 8.5 = 64.5)
            // Total = 164.5
            expect(revenue).toBe(164.5);
        });

        it('should handle zero or missing data gracefully', () => {
            expect(calculateMonthlyRevenue(null)).toBe(0);
            expect(calculateMonthlyRevenue({})).toBe(0);
        });
    });

    // --- 2. EXPENSE & REPORT CALCULATION ---
    describe('calculateExpenses', () => {
        const revenue = 1000;
        const orders = 100;
        const inputs = {
            salaries: 400,
            motoCount: 2, // 2 * 154 = 308
            gasoline: 50,
            incidents: 10,
            royaltyPercent: 5
        };

        it('should calculate accurate Profit & Loss report', () => {
            const report = calculateExpenses(revenue, orders, inputs);

            // Fixed Costs
            expect(report.fixed.salaries).toBe(400);
            expect(report.fixed.renting).toBe(308); // 2 * 154

            // Variable Costs
            // Flyder Fee: 100 orders * 0.35 = 35
            // Royalty: 1000 * 5% = 50
            // Gasoline: 50
            expect(report.variable.flyderFee).toBe(35);
            expect(report.variable.royalty).toBe(50);
            expect(report.variable.gasoline).toBe(50);

            // Totals
            // const totalVariable = 35 + 50 + 50; // 135
            // const totalFixed = 400 + 308 + 10; // 718 (Incidents go to Fixed/Other by default or explicit mapping?)
            // Looking at code: incidents are added to otherExpensesBase in Fixed.
            // otherExpensesBase = safeFloat(other) + safeFloat(marketing) + safeFloat(incidents)

            expect(report.fixed.other).toBe(10);

            // const totalExpenses = totalFixed + totalVariable; // 718 + 135 = 853
            expect(report.totalExpenses).toBe(853);

            // Net Profit
            expect(report.netProfit).toBe(147); // 1000 - 853
        });
    });

    // --- 3. HEALTH ANALYSIS (CFO Brain) ---
    describe('analyzeFinancialHealth', () => {
        // 1. HAPPY PATH
        it('debe reportar estado SALUDABLE si el margen es > 15%', () => {
            const expenses = [
                { name: 'A', value: 200 },
                { name: 'B', value: 200 },
                { name: 'C', value: 200 },
                { name: 'D', value: 200 }
            ]; // Total 800
            const revenue = 1000; // 20% margin
            const result = analyzeFinancialHealth(expenses, revenue);

            expect(result.kpi.status).toBe('healthy');
            expect(result.alerts).toHaveLength(0);
            expect(result.kpi.margin).toBe(20);
        });

        // 2. CRITICAL MARGIN
        it('debe lanzar alerta CRÍTICA si el margen es < 5%', () => {
            const expenses = mockExpenses(960); // 40 profit on 1000 = 4%
            const revenue = 1000;
            const result = analyzeFinancialHealth(expenses, revenue);

            expect(result.kpi.status).toBe('critical');
            const alert = result.alerts.find(a => a.id === 'margin_risk');
            expect(alert).toBeDefined();
            expect(alert?.severity).toBe('critical');
        });

        // 3. WARNING MARGIN
        it('debe lanzar ADVERTENCIA si el margen está entre 5% y 15%', () => {
            const expenses = mockExpenses(900); // 100 profit on 1000 = 10%
            const revenue = 1000;
            const result = analyzeFinancialHealth(expenses, revenue);

            expect(result.kpi.status).toBe('warning');
            const alert = result.alerts.find(a => a.id === 'margin_risk');
            expect(alert).toBeDefined();
            expect(alert?.severity).toBe('warning');
        });

        // 4. COST CONCENTRATION (PARETO)
        it('debe detectar RIESGO DE CONCENTRACIÓN si un gasto es > 35% del total', () => {
            const expenses = [
                { name: 'Alquiler', value: 400 }, // 40%
                { name: 'Luz', value: 100 },
                { name: 'Nómina', value: 500 }
            ];
            // Total 1000. Revenue 2000. Healthy margin, but concentration risk.
            const result = analyzeFinancialHealth(expenses, 2000);

            const alert = result.alerts.find(a => a.id === 'concentration_risk');
            expect(alert).toBeDefined();
            expect(alert?.title).toContain('Dependencia');
        });

        // 5. EDGE CASES
        it('debe manejar ingresos CERO sin romper la app', () => {
            const result = analyzeFinancialHealth([], 0);
            expect(result.kpi.margin).toBe(0);
            expect(result.kpi.status).toBe('healthy');
        });

        it('debe manejar inputs corruptos (null/undefined)', () => {
            // @ts-ignore - Testing legacy JS behavior
            const result = analyzeFinancialHealth(null, undefined);
            expect(result.kpi.expenses).toBe(0);
            expect(result.alerts).toEqual([]);
        });
    });

    describe('formatCurrency', () => {
        it('formatCurrency debe formatear correctamente', () => {
            const val = formatCurrency(1234);
            expect(val).toMatch(/1.*234/);
        });
    });
});
