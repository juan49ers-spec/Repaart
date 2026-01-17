import { describe, it, expect } from 'vitest';
import { calculateRevenue, calculateMonthlyRevenue, calculateExpenses } from './finance';
import type { MonthlyData } from '../types/finance';

describe('Financial Logic', () => {
    describe('calculateRevenue', () => {
        it('should calculate correct revenue for NEW tariff', () => {
            // 0-4km = 5.50
            expect(calculateRevenue(3, 'NEW')).toBe(5.50);
            expect(calculateRevenue(4, 'NEW')).toBe(5.50);

            // 4-5km = 6.50
            expect(calculateRevenue(4.1, 'NEW')).toBe(6.50);

            // >7km = 8.50
            expect(calculateRevenue(10, 'NEW')).toBe(8.50);
        });

        it('should handle zero or negative distances', () => {
            expect(calculateRevenue(0, 'NEW')).toBe(5.50); // Assuming min distance falls in bucket 1? 
            // Wait, logic says: if (dist <= 4) return ...[0-4]. 
            // So 0 <= 4. Correct.
            expect(calculateRevenue(-1, 'NEW')).toBe(0);
        });
    });

    describe('calculateMonthlyRevenue', () => {
        it('should perform legacy calculation based on orders', () => {
            const data: MonthlyData = {
                franchiseId: 'test',
                month: '2024-01',
                ordersNew0To4: 10,
                ordersNew4To5: 5,
                ordersNew5To6: 0,
                ordersNew6To7: 0,
                ordersNewGt7: 0,
                ordersOld0To35: 0,
                ordersOldGt35: 0
            };

            // 10 * 5.50 = 55
            // 5 * 6.50 = 32.50
            // Total = 87.50
            expect(calculateMonthlyRevenue(data)).toBe(87.50);
        });

        it('should prioritize stored revenue if available', () => {
            const data: MonthlyData = {
                franchiseId: 'test',
                month: '2024-01',
                revenue: 1000,
                ordersNew0To4: 10 // Should be ignored
            };
            expect(calculateMonthlyRevenue(data)).toBe(1000);
        });
    });

    describe('calculateExpenses', () => {
        it('should calculate basic profit and margin correctly', () => {
            const revenue = 1000;
            const orderCount = 100; // avg ticket 10
            const inputs: MonthlyData = {
                franchiseId: 'test',
                month: '2024-01',
                salaries: 400,
                gasoline: 50,
                rentingCost: 100, // custom field check
                motoCount: 1, // should be ignored if rentingCost provided?
                royaltyPercent: 5
                // appFlyder omitted -> defaults to 0.35 * orders = 35
            };

            const result = calculateExpenses(revenue, orderCount, inputs);

            // Fixed Costs:
            // Salaries: 400
            // Renting: 100
            // Total Fixed: 500 (ignoring others defaulted to 0)

            // Variable Costs:
            // Gasoline: 50
            // Flyder: 100 * 0.35 = 35
            // Royalty: 5% of 1000 = 50
            // Total Variable: 50 + 35 + 50 = 135

            // Total Expenses = 635
            // Net Profit = 1000 - 635 = 365

            expect(result.fixed.salaries).toBe(400);
            expect(result.fixed.renting).toBe(100);
            expect(result.variable.flyderFee).toBe(35);
            expect(result.variable.royalty).toBe(50);
            expect(result.totalExpenses).toBe(635);
            expect(result.netProfit).toBe(365);
            expect(result.metrics.profitMargin).toBeCloseTo(36.5);
        });
    });
});
