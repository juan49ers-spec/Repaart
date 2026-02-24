/**
 * @fileoverview useFinancialDataLoad Hook
 * 
 * Responsible for loading all financial data needed for the Financial Closure workflow.
 * This is the orchestration layer that coordinates data fetching from multiple services.
 * 
 * ## Architecture Flow
 * 
 * 1. **Financial Record** - Existing closure data from `financial_summaries` collection
 * 2. **Yearly Data** - Accumulated YTD data for previous months of the current year
 * 3. **Invoiced Income** - Fetched from `invoiceEngine.getInvoicedIncomeForMonth()`
 *    This includes subtotal, total, and orders breakdown by distance ranges
 * 4. **Shifts** - Operative hours calculated from shift data
 * 5. **Logistics Rates** - Current pricing configuration for the franchise
 * 
 * ## Invoice Reconciliation Flow
 * 
 * The invoiced income data is the key for auto-populating the closure:
 * - Searches invoices by franchiseId (with robust ID resolution)
 * - Filters by status: ISSUED and date range
 * - Extracts orders detail from: logisticsData.ranges OR invoice lines
 * - Falls back to order reconstruction from orders_history if needed
 * - Maps invoice data to UI distance ranges (0-4km, 4-5km, etc.)
 * 
 * @see invoiceEngine.ts for the core invoice processing logic
 */

import { useState, useEffect } from 'react';
import { FinancialRecord } from '../types';
import { MonthlyData } from '../../../../types/finance';
import { financeService } from '../../../../services/financeService';
import { invoiceEngine } from '../../../../services/billing/invoiceEngine';
import { shiftService } from '../../../../services/shiftService';
import { userService } from '../../../../services/userService';
import { LogisticsRate } from '../../../../types/franchise';

interface Props {
    franchiseId: string;
    month: string;
    initialData?: Partial<FinancialRecord>;
    user: { uid?: string; role?: string } | null;
}

/**
 * Hook to load all financial data for a monthly closure
 * 
 * @param franchiseId - The franchise identifier (can be slug, UID, or name)
 * @param month - Month in YYYY-MM format
 * @param initialData - Optional pre-loaded data to avoid refetching
 * @param user - Current user context for permission checks
 * 
 * @returns Object containing:
 *   - loading: Boolean indicating if data is being fetched
 *   - logisticsRates: Current pricing rates for distance ranges
 *   - record: Existing financial closure record (null if new)
 *   - prevMonthsYtd: Year-to-date accumulated profit
 *   - invoicedIncome: Data from invoices including subtotal and orders breakdown
 *   - operativeHours: Total operative hours from shifts
 *   - calculatedRiderExpenses: Estimated payroll and social security costs
 */
export const useFinancialDataLoad = ({ franchiseId, month, initialData, user }: Props) => {
    const [loading, setLoading] = useState(true);
    const [record, setRecord] = useState<FinancialRecord | null>(null);
    const [logisticsRates, setLogisticsRates] = useState<LogisticsRate[]>([]);
    const [prevMonthsYtd, setPrevMonthsYtd] = useState(0);
    const [invoicedIncome, setInvoicedIncome] = useState({
        subtotal: 0,
        total: 0,
        ordersDetail: {} as Record<string, number>
    });
    const [operativeHours, setOperativeHours] = useState(0);
    const [calculatedRiderExpenses, setCalculatedRiderExpenses] = useState({ payroll: 0, socialSecurity: 0 });

    useEffect(() => {
        async function loadData() {
            if (!franchiseId || !month) return;
            try {
                setLoading(true);
                // Parse current year and month index from "YYYY-MM" string (e.g., "2026-01")
                const [yearStr, monthStr] = month.split('-');
                const currentYear = parseInt(yearStr);
                const currentMonthIndex = parseInt(monthStr) - 1; // 0-based index

                // Calculate date range for current month
                const startDate = new Date(currentYear, currentMonthIndex, 1);
                const endDate = new Date(currentYear, currentMonthIndex + 1, 0, 23, 59, 59);

                // Improved Resilient Fetching
                const [data, yearlyData, monthInvoiced, monthShifts] = await Promise.all([
                    (async () => {
                        try {
                            return initialData || await financeService.getFinancialData(franchiseId, month) as FinancialRecord;
                        } catch (e: any) {
                            console.error('[FinanceLoad] Failed to load main record:', e.message);
                            return null;
                        }
                    })(),
                    (async () => {
                        try {
                            return await financeService.getFinancialYearlyData(franchiseId, currentYear);
                        } catch (e: any) {
                            console.error('[FinanceLoad] Failed to load yearly data:', e.message);
                            return [];
                        }
                    })(),
                    (async () => {
                        try {
                            return await invoiceEngine.getInvoicedIncomeForMonth(franchiseId, month);
                        } catch (e: any) {
                            console.error('[FinanceLoad] Failed to load invoiced income:', e.message);
                            return { subtotal: 0, total: 0, ordersDetail: {} };
                        }
                    })(),
                    (async () => {
                        try {
                            return await shiftService.getShiftsInRange(franchiseId, startDate, endDate);
                        } catch (e: any) {
                            console.error('[FinanceLoad] Failed to load shifts:', e.message);
                            return [];
                        }
                    })()
                ]);

                if (data) setRecord(data);
                if (monthInvoiced) setInvoicedIncome(monthInvoiced);

                // Calculate operative hours from shifts
                let totalMin = 0;
                monthShifts.forEach((shift: any) => {
                    const start = new Date(shift.startAt);
                    const end = new Date(shift.endAt);
                    const diffMs = end.getTime() - start.getTime();
                    if (diffMs > 0) totalMin += diffMs / (1000 * 60);
                });
                const hours = Math.round((totalMin / 60) * 100) / 100;
                setOperativeHours(hours);

                // Simple heuristic for payroll (this could be refined with actual rider rates)
                // Assuming average 10€/h for simulation if not explicitly set
                const estimPayroll = hours * 8.5; // Base estimate
                const estimSS = estimPayroll * 0.32; // SS estimate
                setCalculatedRiderExpenses({
                    payroll: Math.round(estimPayroll * 100) / 100,
                    socialSecurity: Math.round(estimSS * 100) / 100
                });

                let calculatedYtd = 0;

                if (Array.isArray(yearlyData)) {
                    yearlyData.forEach((r: MonthlyData) => {
                        let recordMonthIndex = -1;
                        let recordYear = -1;

                        if (r.month && typeof r.month === 'string' && r.month.includes('-')) {
                            const parts = r.month.split('-');
                            recordYear = parseInt(parts[0]);
                            recordMonthIndex = parseInt(parts[1]) - 1;
                        } else if ((r as any).date) {
                            try {
                                const dVal = (r as any).date;
                                const d = dVal.toDate ? dVal.toDate() : new Date(dVal);
                                recordYear = d.getFullYear();
                                recordMonthIndex = d.getMonth();
                            } catch (e) { console.warn("Date parse error", e); }
                        } else if ((r as any).id && typeof (r as any).id === 'string') {
                            const parts = ((r as any).id as string).split('_');
                            const potentialDate = parts[parts.length - 1];
                            if (potentialDate && potentialDate.match(/^\d{4}-\d{2}$/)) {
                                const dParts = potentialDate.split('-');
                                if (dParts) recordYear = parseInt(dParts[0]);
                                if (dParts) recordMonthIndex = parseInt(dParts[1]) - 1;
                            }
                        }

                        if (recordYear !== currentYear) return;

                        if (recordMonthIndex >= 0 && recordMonthIndex < currentMonthIndex) {
                            let val = 0;
                            if (typeof r.netResultAfterAmortization === 'number') val = r.netResultAfterAmortization;
                            else if (typeof r.profit === 'number') val = r.profit;
                            else val = (Number(r.revenue || r.totalIncome || 0) - Number(r.expenses || r.totalExpenses || 0));

                            calculatedYtd += val;
                        }
                    });
                }

                setPrevMonthsYtd(calculatedYtd);

                let profile;
                if (user?.role === 'franchise' && user?.uid) profile = await userService.getUserProfile(user.uid);
                else profile = await userService.getUserByFranchiseId(franchiseId);

                if (profile && profile.logisticsRates) setLogisticsRates(profile.logisticsRates);
                if (data) setRecord(data as FinancialRecord);

            } catch (err) {
                console.error("Error loading data", err);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [franchiseId, month, initialData, user?.role, user?.uid]);

    return {
        loading,
        logisticsRates,
        record,
        prevMonthsYtd,
        invoicedIncome,
        operativeHours,
        calculatedRiderExpenses
    };
};
