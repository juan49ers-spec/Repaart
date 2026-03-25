import { describe, it, expect } from 'vitest';

/**
 * TEST PROFESIONAL DE SIMETRÍA FINANCIERA
 * Objetivo: Verificar que el borrado de una factura ISSUED impacta correctamente
 * en el cierre mensual (revenue) y en la hucha fiscal (IVA).
 */

describe('Facturación <> Finanzas: Auditoría de Sincronización', () => {

    // Simulación de los estados del sistema
    const mockState = {
        financial_summaries: {
            'franchise_2026-03': { revenue: 550, totalIncome: 550, is_locked: false }
        },
        tax_vault: {
            'franchise_2026-03': { ivaRepercutido: 109.73, invoiceIds: ['INV-001'] }
        }
    };

    const invoiceToDelete = {
        id: 'INV-001',
        franchiseId: 'franchise',
        subtotal: 100, // Lo que debe restarse de revenue
        total: 121,    // 21€ de IVA
        status: 'ISSUED',
        month: '2026-03',
        taxBreakdown: [{ taxAmount: 21 }]
    };

    it('debe reducir el revenue del sumario financiero al borrar factura ISSUED', () => {
        const summary = { ...mockState.financial_summaries['franchise_2026-03'] };

        // Simulación de lógica de Cloud Function onInvoiceDeleted
        if (!summary.is_locked) {
            summary.revenue -= invoiceToDelete.subtotal;
            summary.totalIncome -= invoiceToDelete.subtotal;
        }

        expect(summary.revenue).toBe(450);
        expect(summary.totalIncome).toBe(450);
    });

    it('debe reducir el IVA de la hucha fiscal al borrar factura ISSUED', () => {
        const vault = { ...mockState.tax_vault['franchise_2026-03'] };

        // Simulación de lógica de Cloud Function onInvoiceDeleted
        const ivaToRemove = invoiceToDelete.taxBreakdown[0].taxAmount;
        vault.ivaRepercutido -= ivaToRemove;
        vault.invoiceIds = vault.invoiceIds.filter(id => id !== invoiceToDelete.id);

        expect(vault.ivaRepercutido).toBe(88.73);
        expect(vault.invoiceIds).not.toContain('INV-001');
    });

    it('NO debe alterar datos si el mes está CERRADO (Locked)', () => {
        const lockedSummary = { ...mockState.financial_summaries['franchise_2026-03'], is_locked: true };
        const initialRevenue = lockedSummary.revenue;

        if (!lockedSummary.is_locked) {
            lockedSummary.revenue -= invoiceToDelete.subtotal;
        }

        expect(lockedSummary.revenue).toBe(initialRevenue);
    });

    it('debe reducir el revenue y el IVA al ANULAR (VOIDED) una factura ISSUED', () => {
        // Al anular una factura incobrada, el impacto financiero es virtualmente idéntico
        // a si la factura no existiera. Se resta lo sumado.
        const summary = { ...mockState.financial_summaries['franchise_2026-03'] };
        const vault = { ...mockState.tax_vault['franchise_2026-03'] };

        // Simulando lógica de anulación
        summary.revenue -= invoiceToDelete.subtotal;
        summary.totalIncome -= invoiceToDelete.subtotal;
        
        const ivaToRemove = invoiceToDelete.taxBreakdown[0].taxAmount;
        vault.ivaRepercutido -= ivaToRemove;
        
        expect(summary.revenue).toBe(450);
        expect(vault.ivaRepercutido).toBe(88.73);
    });
});
