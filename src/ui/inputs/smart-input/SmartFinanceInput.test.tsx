import { describe, it, expect } from 'vitest';
// @ts-ignore
import { evaluateFormula, formatCurrency } from '../SmartFinanceInput';

describe('SmartFinanceInput - evaluateFormula', () => {
    describe('Basic Arithmetic', () => {
        it('should evaluate simple addition', () => {
            expect(evaluateFormula('10+5')).toBe(15);
        });

        it('should evaluate simple subtraction', () => {
            expect(evaluateFormula('20-8')).toBe(12);
        });

        it('should evaluate simple multiplication', () => {
            expect(evaluateFormula('50*12')).toBe(600);
        });

        it('should evaluate simple division', () => {
            expect(evaluateFormula('100/4')).toBe(25);
        });
    });

    describe('Complex Expressions', () => {
        it('should handle parentheses', () => {
            expect(evaluateFormula('(10+5)*2')).toBe(30);
        });

        it('should handle order of operations', () => {
            expect(evaluateFormula('10+5*2')).toBe(20);
        });

        it('should handle decimal numbers', () => {
            expect(evaluateFormula('10.5+5.25')).toBe(15.75);
        });

        it('should handle commas as decimal separators', () => {
            expect(evaluateFormula('10,5+5,25')).toBe(15.75);
        });

        it('should handle nested parentheses', () => {
            expect(evaluateFormula('((10+5)*2)-10')).toBe(20);
        });
    });

    describe('Error Handling', () => {
        it('should throw error on division by zero', () => {
            expect(() => evaluateFormula('10/0')).toThrow('División por cero');
        });

        it('should throw error on empty formula', () => {
            expect(() => evaluateFormula('')).toThrow('Fórmula vacía');
        });

        it('should throw error on invalid characters', () => {
            expect(() => evaluateFormula('10+abc')).toThrow('Sintaxis incorrecta');
        });

        it('should sanitize dangerous code', () => {
            expect(() => evaluateFormula('alert("hack")')).toThrow();
        });

        it('should reject function calls', () => {
            expect(() => evaluateFormula('Math.random()')).toThrow();
        });

        it('should handle invalid syntax gracefully', () => {
            expect(() => evaluateFormula('10++')).toThrow('Sintaxis incorrecta');
        });
    });

    describe('Edge Cases', () => {
        it('should handle very large numbers', () => {
            expect(evaluateFormula('999999*999999')).toBe(999998000001);
        });

        it('should handle very small decimals', () => {
            expect(evaluateFormula('0.01+0.02')).toBeCloseTo(0.03, 2);
        });

        it('should handle negative results', () => {
            expect(evaluateFormula('10-20')).toBe(-10);
        });

        it('should handle whitespace', () => {
            expect(evaluateFormula('  10 + 5  ')).toBe(15);
        });
    });

    describe('Real-World Finance Scenarios', () => {
        it('should calculate monthly revenue (tariff * quantity)', () => {
            expect(evaluateFormula('5.50*100')).toBe(550);
        });

        it('should calculate profit margin percentage', () => {
            const result = evaluateFormula('(15000-12000)/15000*100');
            expect(result).toBeCloseTo(20, 1);
        });

        it('should calculate IVA addition (21%)', () => {
            expect(evaluateFormula('1000*1.21')).toBe(1210);
        });

        it('should sum multiple cost categories', () => {
            expect(evaluateFormula('5000+3000+2000+1500')).toBe(11500);
        });
    });

    describe('Performance & Security', () => {
        it('should handle long expressions without hanging', () => {
            const longExpr = Array(100).fill('1').join('+');
            expect(evaluateFormula(longExpr)).toBe(100);
        });

        it('should reject XSS attempts', () => {
            expect(() => evaluateFormula('<script>alert(1)</script>')).toThrow();
        });

        it('should reject code injection', () => {
            expect(() => evaluateFormula('1; window.location="evil.com"')).toThrow();
        });
    });
});

describe('SmartFinanceInput - formatCurrency', () => {
    it('should format integers correctly', () => {
        expect(formatCurrency(1000)).toBe('1.000,00 €');
    });

    it('should format decimals correctly', () => {
        expect(formatCurrency(1234.56)).toBe('1.234,56 €');
    });

    it('should handle zero', () => {
        expect(formatCurrency(0)).toBe('0,00 €');
    });

    it('should handle negative numbers', () => {
        expect(formatCurrency(-500)).toBe('-500,00 €');
    });

    it('should handle empty/null/undefined', () => {
        expect(formatCurrency(null)).toBe('');
        expect(formatCurrency(undefined)).toBe('');
        expect(formatCurrency('')).toBe('');
    });
});
