/**
 * Logistics Billing Engine
 * 
 * Calculates billing based on Repaart's defined distance ranges (0-4km, 4-5km, etc.)
 * Supports multiple tax rates for mixed invoice types
 * 
 * Key Features:
 * - Dynamic concept injection based on logistics ranges
 * - Multiple tax base calculations
 * - Automatic line generation from delivery data
 * - Integration with FranchiseNetworkService for rate configuration
 */

import { db } from '../../lib/firebase';
import {
    collection,
    doc,
    getDoc,
    query,
    where,
    getDocs,
    orderBy
} from 'firebase/firestore';
import type {
    LogisticsRate,
    LogisticsRange,
    InvoiceLine,
    BillingCalculationResult,
    BillingError,
    CalculateBillingRequest
} from '../../types/invoicing';
import { Result, ok, err } from '../../types/result';
import { ServiceError } from '../../utils/ServiceError';

/**
 * Default logistics rates (can be overridden by franchise configuration)
 */
const DEFAULT_LOGISTICS_RATES: LogisticsRate[] = [
    { id: 'range_0_4', name: '0-4km', minKm: 0, maxKm: 4, pricePerUnit: 2.50 },
    { id: 'range_4_5', name: '4-5km', minKm: 4, maxKm: 5, pricePerUnit: 3.00 },
    { id: 'range_5_6', name: '5-6km', minKm: 5, maxKm: 6, pricePerUnit: 3.50 },
    { id: 'range_6_7', name: '6-7km', minKm: 6, maxKm: 7, pricePerUnit: 4.00 },
    { id: 'range_gt_7', name: '>7km', minKm: 7, maxKm: Infinity, pricePerUnit: 4.50 },
    { id: 'range_old_0_35', name: 'Old 0-35min', minKm: 0, maxKm: 35, pricePerUnit: 1.80 },
    { id: 'range_old_gt_35', name: 'Old >35min', minKm: 35, maxKm: Infinity, pricePerUnit: 2.30 }
];

/**
 * Calculate billing based on logistics data
 */
export const logisticsBillingEngine = {
    /**
     * Calculate billing for a customer based on delivery data
     * 
     * @param request - Billing calculation request
     * @returns Billing calculation result with lines, tax breakdown, and totals
     */
    calculateBilling: async (
        request: CalculateBillingRequest
    ): Promise<Result<BillingCalculationResult, BillingError>> => {
        try {
            const {
                franchiseId,
                customerId,
                customerType,
                period,
                logisticsRates
            } = request;
            
            // Get logistics rates (use provided rates or fetch from franchise config)
            const rates = logisticsRates.length > 0 
                ? logisticsRates 
                : await logisticsBillingEngine._fetchFranchiseRates(franchiseId);
            
            // Fetch delivery data for the period
            const deliveryData = await logisticsBillingEngine._fetchDeliveryData(
                franchiseId,
                customerId,
                customerType,
                period
            );
            
            if (!deliveryData || deliveryData.length === 0) {
                return err({
                    type: 'INSUFFICIENT_LOGISTICS_DATA',
                    message: 'No delivery data found for the specified period'
                });
            }
            
            // Group deliveries by range
            const rangeGroups = logisticsBillingEngine._groupDeliveriesByRange(deliveryData, rates);
            
            // Generate invoice lines from range groups
            const lines: InvoiceLine[] = rangeGroups
                .filter(group => group.units > 0) // Only include ranges with deliveries
                .map((group, index) => {
                    const amount = group.units * group.pricePerUnit;
                    const taxRate = 0.21; // Default 21% IVA for logistics services
                    const taxAmount = amount * taxRate;
                    const total = amount + taxAmount;
                    
                    return {
                        id: `logistics_line_${Date.now()}_${index}`,
                        description: `Servicio de logística - Rango ${group.name}`,
                        quantity: group.units,
                        unitPrice: group.pricePerUnit,
                        taxRate,
                        amount,
                        taxAmount,
                        total,
                        logisticsRange: group.id,
                        units: group.units
                    };
                });
            
            // Calculate totals
            const subtotal = lines.reduce((sum, line) => sum + line.amount, 0);
            const totalTax = lines.reduce((sum, line) => sum + line.taxAmount, 0);
            const total = subtotal + totalTax;
            
            // Calculate tax breakdown (grouped by tax rate)
            const taxBreakdownMap = new Map<number, { taxableBase: number; taxAmount: number }>();
            
            lines.forEach(line => {
                const existing = taxBreakdownMap.get(line.taxRate) || { taxableBase: 0, taxAmount: 0 };
                taxBreakdownMap.set(line.taxRate, {
                    taxableBase: existing.taxableBase + line.amount,
                    taxAmount: existing.taxAmount + line.taxAmount
                });
            });
            
            const taxBreakdown = Array.from(taxBreakdownMap.entries()).map(([taxRate, data]) => ({
                taxRate,
                taxableBase: data.taxableBase,
                taxAmount: data.taxAmount
            }));
            
            return ok({
                lines,
                subtotal,
                taxBreakdown,
                total
            });
        } catch (error: any) {
            const sError = new ServiceError('calculateBilling', { cause: error });
            console.error('Error calculating logistics billing:', sError);
            return err({
                type: 'UNKNOWN_ERROR',
                message: error.message || 'Failed to calculate logistics billing',
                cause: error
            });
        }
    },

    /**
     * Generate logistics data object for invoice
     * 
     * @param period - Billing period
     * @param rangeGroups - Grouped delivery data
     * @returns Logistics billing data for invoice
     */
    generateLogisticsData: (
        period: { start: Date; end: Date },
        rangeGroups: LogisticsRange[]
    ): {
        period: { start: Date; end: Date };
        ranges: LogisticsRange[];
        totalUnits: number;
    } => {
        const totalUnits = rangeGroups.reduce((sum, group) => sum + group.units, 0);
        
        return {
            period,
            ranges: rangeGroups,
            totalUnits
        };
    },

    /**
     * Fetch franchise-specific logistics rates
     * 
     * @param franchiseId - Franchise ID
     * @returns Array of logistics rates
     * @private
     */
    _fetchFranchiseRates: async (
        franchiseId: string
    ): Promise<LogisticsRate[]> => {
        try {
            // Try to fetch custom rates from franchise configuration
            const franchiseRef = doc(db, 'franchises', franchiseId);
            const franchiseSnap = await getDoc(franchiseRef);
            
            if (franchiseSnap.exists()) {
                const franchiseData = franchiseSnap.data();
                const customRates = franchiseData.logisticsRates;
                
                if (customRates && Array.isArray(customRates) && customRates.length > 0) {
                    return customRates;
                }
            }
            
            // Return default rates if no custom configuration found
            return DEFAULT_LOGISTICS_RATES;
        } catch (error) {
            console.warn('Error fetching franchise rates, using defaults:', error);
            return DEFAULT_LOGISTICS_RATES;
        }
    },

    /**
     * Fetch delivery data for a customer and period
     * 
     * @param franchiseId - Franchise ID
     * @param customerId - Customer ID
     * @param customerType - Customer type (FRANCHISE or RESTAURANT)
     * @param period - Billing period
     * @returns Array of delivery data
     * @private
     */
    _fetchDeliveryData: async (
        franchiseId: string,
        customerId: string,
        customerType: 'FRANCHISE' | 'RESTAURANT',
        period: { start: string; end: string }
    ): Promise<any[]> => {
        try {
            const startDate = new Date(period.start);
            const endDate = new Date(period.end);
            
            // Determine collection based on customer type
            // For now, we'll query a hypothetical 'orders' collection
            // This should be adapted to match Repaart's actual data structure
            let q = query(
                collection(db, 'orders'),
                where('franchiseId', '==', franchiseId),
                where('createdAt', '>=', startDate),
                where('createdAt', '<=', endDate),
                orderBy('createdAt', 'desc')
            );
            
            if (customerType === 'RESTAURANT') {
                q = query(
                    collection(db, 'orders'),
                    where('franchiseId', '==', franchiseId),
                    where('restaurantId', '==', customerId),
                    where('createdAt', '>=', startDate),
                    where('createdAt', '<=', endDate),
                    orderBy('createdAt', 'desc')
                );
            }
            
            const querySnap = await getDocs(q);
            const orders = querySnap.docs.map(docSnap => docSnap.data());
            
            return orders;
        } catch (error) {
            console.error('Error fetching delivery data:', error);
            return [];
        }
    },

    /**
     * Group deliveries by logistics range
     * 
     * @param deliveryData - Array of delivery/order data
     * @param rates - Array of logistics rates
     * @returns Array of grouped ranges with units
     * @private
     */
    _groupDeliveriesByRange: (
        deliveryData: any[],
        rates: LogisticsRate[]
    ): LogisticsRange[] => {
        // Initialize range groups
        const rangeMap = new Map<string, LogisticsRange>();
        
        rates.forEach(rate => {
            rangeMap.set(rate.id, {
                ...rate,
                units: 0,
                subtotal: 0
            });
        });
        
        // Group deliveries by range
        deliveryData.forEach(delivery => {
            const distance = delivery.distance || 0;
            const isNewDelivery = delivery.isNew !== false; // Assume new unless explicitly marked as old
            
            // Find matching range
            const matchingRate = rates.find(rate => {
                if (isNewDelivery) {
                    return distance >= rate.minKm && distance < rate.maxKm;
                } else {
                    // Special handling for old deliveries (time-based)
                    const duration = delivery.duration || 0;
                    if (rate.id === 'range_old_0_35') {
                        return duration < 35;
                    } else if (rate.id === 'range_old_gt_35') {
                        return duration >= 35;
                    }
                    return false;
                }
            });
            
            if (matchingRate) {
                const range = rangeMap.get(matchingRate.id);
                if (range) {
                    range.units += 1;
                    range.subtotal += range.pricePerUnit;
                }
            }
        });
        
        return Array.from(rangeMap.values());
    },

    /**
     * Calculate mixed billing (logistics + other services)
     * 
     * @param logisticsResult - Logistics billing calculation
     * @param additionalLines - Additional invoice lines with potentially different tax rates
     * @returns Combined billing calculation result
     */
    calculateMixedBilling: (
        logisticsResult: BillingCalculationResult,
        additionalLines: InvoiceLine[]
    ): BillingCalculationResult => {
        const allLines = [...logisticsResult.lines, ...additionalLines];
        
        const subtotal = allLines.reduce((sum, line) => sum + line.amount, 0);
        const totalTax = allLines.reduce((sum, line) => sum + line.taxAmount, 0);
        const total = subtotal + totalTax;
        
        // Calculate tax breakdown for all lines
        const taxBreakdownMap = new Map<number, { taxableBase: number; taxAmount: number }>();
        
        allLines.forEach(line => {
            const existing = taxBreakdownMap.get(line.taxRate) || { taxableBase: 0, taxAmount: 0 };
            taxBreakdownMap.set(line.taxRate, {
                taxableBase: existing.taxableBase + line.amount,
                taxAmount: existing.taxAmount + line.taxAmount
            });
        });
        
        const taxBreakdown = Array.from(taxBreakdownMap.entries()).map(([taxRate, data]) => ({
            taxRate,
            taxableBase: data.taxableBase,
            taxAmount: data.taxAmount
        }));
        
        return {
            lines: allLines,
            subtotal,
            taxBreakdown,
            total
        };
    }
};
