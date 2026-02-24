/**
 * Integration Tests for Billing Module
 * 
 * Simple verification tests to ensure all components are correctly implemented
 */

import { describe, it, expect } from 'vitest';

describe('Billing Module - Integration Tests', () => {
    
    describe('Module Imports', () => {
        it('should import types module without errors', async () => {
            const typesModule = await import('../../../types/invoicing');
            expect(typesModule).toBeDefined();
        });
        
        it('should import schemas module without errors', async () => {
            const schemasModule = await import('../../../schemas/invoicing/index');
            expect(schemasModule).toBeDefined();
        });
        
        it('should import billing services without errors', async () => {
            const billingModule = await import('../index');
            expect(billingModule).toBeDefined();
        });
    });
    
    describe('Service Existence', () => {
        it('should have invoiceEngine exported', async () => {
            const { invoiceEngine } = await import('../invoiceEngine');
            expect(invoiceEngine).toBeDefined();
            expect(typeof invoiceEngine.createDraft).toBe('function');
            expect(typeof invoiceEngine.issueInvoice).toBe('function');
            expect(typeof invoiceEngine.rectifyInvoice).toBe('function');
        });
        
        it('should have logisticsBillingEngine exported', async () => {
            const { logisticsBillingEngine } = await import('../logisticsBillingEngine');
            expect(logisticsBillingEngine).toBeDefined();
            expect(typeof logisticsBillingEngine.calculateBilling).toBe('function');
        });
        
        it('should have accountsReceivable exported', async () => {
            const { accountsReceivable } = await import('../accountsReceivable');
            expect(accountsReceivable).toBeDefined();
            expect(typeof accountsReceivable.addPayment).toBe('function');
            expect(typeof accountsReceivable.generateDebtDashboard).toBe('function');
        });
        
        it('should have taxVault services exported', async () => {
            const { taxVaultObserver, monthlyCloseWizard } = await import('../taxVault');
            expect(taxVaultObserver).toBeDefined();
            expect(monthlyCloseWizard).toBeDefined();
        });
        
        it('should have invoicePdfGenerator exported', async () => {
            const { invoicePdfGenerator } = await import('../pdfGenerator');
            expect(invoicePdfGenerator).toBeDefined();
            expect(typeof invoicePdfGenerator.generateInvoicePdf).toBe('function');
        });
        
        it('should have billingController exported', async () => {
            const { billingController } = await import('../controllers/billingController');
            expect(billingController).toBeDefined();
            expect(typeof billingController.createInvoice).toBe('function');
            expect(typeof billingController.issueInvoice).toBe('function');
            expect(typeof billingController.addPayment).toBe('function');
        });
    });
    
    describe('Enum Values', () => {
        it('should have correct InvoiceStatus enum values', async () => {
            const { InvoiceStatus } = await import('../../../types/invoicing');
            
            expect(InvoiceStatus.DRAFT).toBe('DRAFT');
            expect(InvoiceStatus.ISSUED).toBe('ISSUED');
            expect(InvoiceStatus.RECTIFIED).toBe('RECTIFIED');
        });
        
        it('should have correct PaymentStatus enum values', async () => {
            const { PaymentStatus } = await import('../../../types/invoicing');
            
            expect(PaymentStatus.PENDING).toBe('PENDING');
            expect(PaymentStatus.PARTIAL).toBe('PARTIAL');
            expect(PaymentStatus.PAID).toBe('PAID');
        });
        
        it('should have correct TaxRate enum values', async () => {
            const { TaxRate } = await import('../../../types/invoicing');
            
            expect(TaxRate.GENERAL).toBe(0.21);    // 21%
            expect(TaxRate.REDUCED).toBe(0.10);    // 10%
            expect(TaxRate.SUPER_REDUCED).toBe(0.04); // 4%
            expect(TaxRate.EXEMPT).toBe(0.00);      // 0%
        });
    });
    
    describe('Schema Validation', () => {
        it('should validate correct CreateInvoiceRequest', async () => {
            const { CreateInvoiceRequestSchema } = await import('../../../schemas/invoicing/index');
            
            const validRequest = {
                franchiseId: 'franchise_123',
                customerId: 'customer_456',
                customerType: 'RESTAURANT',
                items: [
                    {
                        description: 'Test Service',
                        quantity: 1,
                        unitPrice: 100,
                        taxRate: 0.21
                    }
                ]
            };
            
            const result = CreateInvoiceRequestSchema.safeParse(validRequest);
            expect(result.success).toBe(true);
        });
        
        it('should reject invalid CreateInvoiceRequest', async () => {
            const { CreateInvoiceRequestSchema } = await import('../../../schemas/invoicing/index');
            
            const invalidRequest = {
                franchiseId: '',
                customerId: 'customer_456',
                customerType: 'RESTAURANT',
                items: []
            };
            
            const result = CreateInvoiceRequestSchema.safeParse(invalidRequest);
            expect(result.success).toBe(false);
        });
        
        it('should validate correct AddPaymentRequest', async () => {
            const { AddPaymentRequestSchema } = await import('../../../schemas/invoicing/index');
            
            const validRequest = {
                invoiceId: 'invoice_123',
                amount: 100,
                paymentMethod: 'TRANSFER'
            };
            
            const result = AddPaymentRequestSchema.safeParse(validRequest);
            expect(result.success).toBe(true);
        });
        
        it('should reject invalid AddPaymentRequest', async () => {
            const { AddPaymentRequestSchema } = await import('../../../schemas/invoicing/index');
            
            const invalidRequest = {
                invoiceId: 'invoice_123',
                amount: -100,
                paymentMethod: 'TRANSFER'
            };
            
            const result = AddPaymentRequestSchema.safeParse(invalidRequest);
            expect(result.success).toBe(false);
        });
    });
    
    describe('Module Structure', () => {
        it('should export all expected services', async () => {
            const billingModule = await import('../index');
            
            const expectedExports = [
                'invoiceEngine',
                'logisticsBillingEngine',
                'accountsReceivable',
                'taxVaultObserver',
                'monthlyCloseWizard',
                'invoicePdfGenerator',
                'billingController',
                'billingRouteHandlers'
            ];
            
            expectedExports.forEach((exportName: string) => {
                expect((billingModule as any)[exportName]).toBeDefined();
            });
        });
    });
});
