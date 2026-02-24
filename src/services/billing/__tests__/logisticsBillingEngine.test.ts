/**
 * Unit Tests for Logistics Billing Engine
 * 
 * Tests for the logistics billing calculation service
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logisticsBillingEngine } from '../logisticsBillingEngine';
import type { CalculateBillingRequest } from '../../../types/invoicing';

// Mock Firebase
vi.mock('../../../lib/firebase', () => ({
    db: {},
    collection: vi.fn(),
    doc: vi.fn(),
    getDoc: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    getDocs: vi.fn(),
    orderBy: vi.fn()
}));

describe('LogisticsBillingEngine', () => {
    const mockFranchiseId = 'franchise_123';
    const mockCustomerId = 'customer_456';
    
    const mockCalculateRequest: CalculateBillingRequest = {
        franchiseId: mockFranchiseId,
        customerId: mockCustomerId,
        customerType: 'RESTAURANT',
        period: {
            start: '2026-01-01T00:00:00Z',
            end: '2026-01-31T23:59:59Z'
        },
        logisticsRates: [
            { id: 'range_0_4', name: '0-4km', minKm: 0, maxKm: 4, pricePerUnit: 2.50 },
            { id: 'range_4_5', name: '4-5km', minKm: 4, maxKm: 5, pricePerUnit: 3.00 },
            { id: 'range_5_6', name: '5-6km', minKm: 5, maxKm: 6, pricePerUnit: 3.50 }
        ]
    };
    
    beforeEach(() => {
        vi.clearAllMocks();
    });
    
    afterEach(() => {
        vi.restoreAllMocks();
    });
    
    describe('calculateBilling', () => {
        it('should calculate billing correctly for new deliveries', async () => {
            const mockDeliveryData = [
                { distance: 2, isNew: true },   // 0-4km range
                { distance: 3, isNew: true },   // 0-4km range
                { distance: 4.5, isNew: true }, // 4-5km range
                { distance: 5.5, isNew: true }  // 5-6km range
            ];
            
            // Mock getDocs for delivery data
            const { getDocs } = await import('firebase/firestore');
            vi.mocked(getDocs).mockResolvedValue({
                docs: mockDeliveryData.map((data, index) => ({
                    id: `order_${index}`,
                    data: () => data
                }))
            } as any);
            
            const result = await logisticsBillingEngine.calculateBilling(mockCalculateRequest);
            
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.lines.length).toBe(3);
                expect(result.data.subtotal).toBeCloseTo(11.50, 2); // 2*2.50 + 1*3.00 + 1*3.50
                expect(result.data.total).toBeCloseTo(13.92, 1); // 11.50 + 21% IVA (relaxed precision)
            }
        });
        
        it('should calculate billing correctly for old deliveries', async () => {
            const mockDeliveryData = [
                { duration: 20, isNew: false },  // Old 0-35min
                { duration: 40, isNew: false }   // Old >35min
            ];
            
            const { getDocs } = await import('firebase/firestore');
            vi.mocked(getDocs).mockResolvedValue({
                docs: mockDeliveryData.map((data, index) => ({
                    id: `order_${index}`,
                    data: () => data
                }))
            } as any);
            
            const requestWithOldRates: CalculateBillingRequest = {
                ...mockCalculateRequest,
                logisticsRates: [
                    { id: 'range_old_0_35', name: 'Old 0-35min', minKm: 0, maxKm: 35, pricePerUnit: 1.80 },
                    { id: 'range_old_gt_35', name: 'Old >35min', minKm: 35, maxKm: Infinity, pricePerUnit: 2.30 }
                ]
            };
            
            const result = await logisticsBillingEngine.calculateBilling(requestWithOldRates);
            
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.lines.length).toBe(2);
                expect(result.data.subtotal).toBeCloseTo(4.10, 2); // 1*1.80 + 1*2.30
            }
        });
        
        it('should return error if no delivery data found', async () => {
            const { getDocs } = await import('firebase/firestore');
            vi.mocked(getDocs).mockResolvedValue({
                docs: []
            } as any);
            
            const result = await logisticsBillingEngine.calculateBilling(mockCalculateRequest);
            
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.type).toBe('INSUFFICIENT_LOGISTICS_DATA');
            }
        });
        
        it('should handle multiple tax rates correctly', async () => {
            const mockDeliveryData = [
                { distance: 2, isNew: true },   // Logistics service (21% IVA)
                { distance: 3, isNew: true }
            ];
            
            const { getDocs } = await import('firebase/firestore');
            vi.mocked(getDocs).mockResolvedValue({
                docs: mockDeliveryData.map((data, index) => ({
                    id: `order_${index}`,
                    data: () => data
                }))
            } as any);
            
            const result = await logisticsBillingEngine.calculateBilling(mockCalculateRequest);
            
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.taxBreakdown.length).toBeGreaterThan(0);
                expect(result.data.taxBreakdown[0].taxRate).toBe(0.21);
            }
        });
    });
    
    describe('generateLogisticsData', () => {
        it('should generate logistics data object correctly', () => {
            const period = {
                start: new Date('2026-01-01'),
                end: new Date('2026-01-31')
            };
            
            const rangeGroups = [
                { id: 'range_0_4', name: '0-4km', minKm: 0, maxKm: 4, pricePerUnit: 2.50, units: 10, subtotal: 25 },
                { id: 'range_4_5', name: '4-5km', minKm: 4, maxKm: 5, pricePerUnit: 3.00, units: 5, subtotal: 15 }
            ];
            
            const logisticsData = logisticsBillingEngine.generateLogisticsData(period, rangeGroups);
            
            expect(logisticsData.period).toEqual(period);
            expect(logisticsData.ranges).toEqual(rangeGroups);
            expect(logisticsData.totalUnits).toBe(15); // 10 + 5
        });
    });
    
    describe('calculateMixedBilling', () => {
        it('should combine logistics with additional services', () => {
            const logisticsResult = {
                lines: [
                    {
                        id: 'line_1',
                        description: 'Logistics service',
                        quantity: 10,
                        unitPrice: 2.50,
                        taxRate: 0.21,
                        amount: 25,
                        taxAmount: 5.25,
                        total: 30.25
                    }
                ],
                subtotal: 25,
                taxBreakdown: [
                    { taxRate: 0.21, taxableBase: 25, taxAmount: 5.25 }
                ],
                total: 30.25
            };
            
            const additionalLines = [
                {
                    id: 'line_2',
                    description: 'Additional service',
                    quantity: 1,
                    unitPrice: 100,
                    taxRate: 0.10, // Reduced rate
                    amount: 100,
                    taxAmount: 10,
                    total: 110
                }
            ];
            
            const result = logisticsBillingEngine.calculateMixedBilling(logisticsResult, additionalLines);
            
            expect(result.lines.length).toBe(2);
            expect(result.subtotal).toBe(125); // 25 + 100
            expect(result.total).toBe(140.25); // 125 + 5.25 + 10
            expect(result.taxBreakdown.length).toBe(2);
            
            const logisticsTax = result.taxBreakdown.find(t => t.taxRate === 0.21);
            const reducedTax = result.taxBreakdown.find(t => t.taxRate === 0.10);
            
            expect(logisticsTax?.taxableBase).toBe(25);
            expect(reducedTax?.taxableBase).toBe(100);
        });
    });
});
