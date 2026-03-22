import { useMemo } from 'react';
import type { FinancialReport } from '../lib/finance';

export interface TaxCalculations {
    ivaCollected: number; // IVA Repercutido (Sales)
    ivaDeductible: number; // IVA Soportado (Expenses)
    ivaPayable: number; // The difference
    irpfPayable: number; // IRPF Estimation
    totalTaxLiability: number; // Total to set aside
    safeToSpend: number; // Net Profit after Tax
}

export const useTaxCalculations = (report: FinancialReport | null, invoicedIva: number = 0): TaxCalculations => {
    return useMemo(() => {
        if (!report) {
            return {
                ivaCollected: 0,
                ivaDeductible: 0,
                ivaPayable: 0,
                irpfPayable: 0,
                totalTaxLiability: 0,
                safeToSpend: 0
            };
        }

        // To avoid double-counting the VAT from actual invoices (invoicedIva) that might
        // already be included inside the general 'revenue', we take the maximum between
        // the general 21% estimate over everything OR the explicit B2B invoices VAT.
        const ivaCollected = Math.max(report.taxes.ivaRepercutido || 0, invoicedIva);
        const ivaDeductible = report.taxes.ivaSoportado || 0;

        // Recalculate payable IVA with the consolidated input
        const ivaPayable = Math.max(0, ivaCollected - ivaDeductible);
        const irpfPayable = report.taxes.irpfPago || 0;

        const totalTaxLiability = ivaPayable + irpfPayable;
        const safeToSpend = report.netProfit - totalTaxLiability;

        return {
            ivaCollected,
            ivaDeductible,
            ivaPayable,
            irpfPayable,
            totalTaxLiability,
            safeToSpend
        };
    }, [report, invoicedIva]);
};
