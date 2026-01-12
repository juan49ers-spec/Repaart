import { describe, it, expect } from 'vitest';
import {
    calculateExpenses,
    formatMoney,
    calculateRevenue,
    DEFAULT_MONTH_DATA
} from './finance';

describe('Financial Core Audit (Blinding Logic)', () => {

    describe('Case A: Absolute Zero (Inactivity)', () => {
        it('should yield zero profit and zero expenses when everything is zero', () => {
            const report = calculateExpenses(0, 0, DEFAULT_MONTH_DATA);

            expect(report.totalExpenses).toBe(0);
            expect(report.netProfit).toBe(0);
            expect(report.taxes.irpfPago).toBe(0);
            expect(report.taxes.ivaAPagar).toBe(0);
            expect(report.taxes.netProfitPostTax).toBe(0);
        });
    });

    describe('Case B: Real-World Scenario (10k Revenue)', () => {
        /**
         * Manual Calculation:
         * Revenue: 10,000
         * Expenses (Salaries): 5,000
         * Royalty (5% of 10,000): 500
         * Total Expenses: 5,500
         * Net Profit (Pre-tax): 4,500
         * IRPF (20% of 4,500): 900
         * Net Profit (Post-Tax): 3,600
         */
        it('should calculate net profit accurately for a 10k revenue / 5k salary case (with royalties)', () => {
            const inputs = {
                ...DEFAULT_MONTH_DATA,
                salaries: 5000,
                irpfPercent: 20
            };

            const report = calculateExpenses(10000, 0, inputs);

            expect(report.totalExpenses).toBe(5500);
            expect(report.netProfit).toBe(4500);
            expect(report.taxes.irpfPago).toBe(900);
            expect(report.taxes.netProfitPostTax).toBe(3600);
        });
    });

    describe('Case C: Decimal Precision (Floating Point Safety)', () => {
        it('should handle typical floating point issues (0.1 + 0.2) correctly', () => {
            const inputs = {
                ...DEFAULT_MONTH_DATA,
                salaries: 10.1,
                marketing: 20.2,
                royaltyPercent: 0
            };

            const report = calculateExpenses(100, 0, inputs);

            // 10.1 (salaries) + 20.2 (marketing) = 30.3
            // Net Profit: 100 - 30.3 = 69.7
            expect(report.totalExpenses).toBeCloseTo(30.3, 5);
            expect(report.netProfit).toBeCloseTo(69.7, 5);
        });
    });

    describe('Case D: Formatting (es-ES Compliance)', () => {
        const normalize = (s: string) => s.replace(/\u00a0/g, ' ').replace(/\u2212/g, '-');

        it('should format thousands and decimals correctly according to Spanish standards', () => {
            expect(normalize(formatMoney(1000.5))).toBe('1.000,50');
            expect(normalize(formatMoney(1234567.89))).toBe('1.234.567,89');
            expect(normalize(formatMoney(0))).toBe('0,00');
        });

        it('should handle negative numbers in Spanish format', () => {
            expect(normalize(formatMoney(-500))).toBe('-500,00');
        });
    });

    describe('Edge Cases: Reliability', () => {
        it('should handle null or undefined inputs gracefully by returning 0', () => {
            expect(formatMoney(null)).toBe('0,00');
            expect(formatMoney(undefined)).toBe('0,00');

            const revenue = calculateRevenue('invalid' as any);
            expect(revenue).toBe(0);
        });

        it('should cap productivity calculation to avoid Infinity when hours are zero', () => {
            const report = calculateExpenses(100, 10, { ...DEFAULT_MONTH_DATA, totalHours: 0 });
            expect(report.metrics.productivity).toBe(0);
            expect(isFinite(report.metrics.revenuePerHour)).toBe(true);
        });
    });
});
