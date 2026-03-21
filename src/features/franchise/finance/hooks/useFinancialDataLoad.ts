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

// Fallbacks de estimación salarial — se sobreescriben con los valores del perfil de franquicia
const DEFAULT_HOURLY_RATE = 8.5;     // €/h base si la franquicia no tiene tarifa configurada
const DEFAULT_SS_RATE = 0.32;        // 32% de cotización SS si la franquicia no tiene tasa configurada

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

                // Improved Resilient Fetching - Use real UID for franchise users to bypass slug resolution issues
                const targetId = (user?.role === 'franchise' && user?.uid) ? user.uid : franchiseId;

                const [data, yearlyData, monthInvoiced, monthShifts, profile] = await Promise.all([
                    (async () => {
                        try {
                            return initialData || await financeService.getFinancialData(targetId, month) as FinancialRecord;
                        } catch (e: unknown) {
                            console.error('[FinanceLoad] Failed to load main record:', e instanceof Error ? e.message : e);
                            return null;
                        }
                    })(),
                    (async () => {
                        try {
                            return await financeService.getFinancialYearlyData(targetId, currentYear);
                        } catch (e: unknown) {
                            console.error('[FinanceLoad] Failed to load yearly data:', e instanceof Error ? e.message : e);
                            return [];
                        }
                    })(),
                    (async () => {
                        try {
                            return await invoiceEngine.getInvoicedIncomeForMonth(targetId, month);
                        } catch (e: unknown) {
                            console.error('[FinanceLoad] Failed to load invoiced income:', e instanceof Error ? e.message : e);
                            return { subtotal: 0, total: 0, ordersDetail: {} };
                        }
                    })(),
                    (async () => {
                        try {
                            return await shiftService.getShiftsInRange(targetId, startDate, endDate);
                        } catch (e: unknown) {
                            console.error('[FinanceLoad] Failed to load shifts:', e instanceof Error ? e.message : e);
                            return [];
                        }
                    })(),
                    (async () => {
                        try {
                            return targetId === user?.uid
                                ? await userService.getUserProfile(targetId)
                                : await userService.getUserByFranchiseId(targetId);
                        } catch (e: unknown) {
                            console.error('[FinanceLoad] Failed to load franchise profile:', e instanceof Error ? e.message : e);
                            return null;
                        }
                    })()
                ]);

                if (data) setRecord(data);
                if (monthInvoiced) setInvoicedIncome(monthInvoiced);
                if (profile?.logisticsRates) setLogisticsRates(profile.logisticsRates);

                // Calculate operative hours from shifts
                let totalMin = 0;
                (monthShifts || []).forEach((shift: { startAt: string; endAt: string }) => {
                    const start = new Date(shift.startAt);
                    const end = new Date(shift.endAt);
                    const diffMs = end.getTime() - start.getTime();
                    if (diffMs > 0) totalMin += diffMs / (1000 * 60);
                });
                const hours = Math.round((totalMin / 60) * 100) / 100;
                setOperativeHours(hours);

                // Use franchise-configured rates if available, otherwise fall back to defaults
                const hourlyRate = profile?.riderHourlyRate ?? DEFAULT_HOURLY_RATE;
                const ssRate = profile?.socialSecurityRate ?? DEFAULT_SS_RATE;
                const estimPayroll = hours * hourlyRate;
                const estimSS = estimPayroll * ssRate;
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
                        } else if ((r as Record<string, unknown>).date) {
                            try {
                                const dVal = (r as Record<string, unknown>).date;
                                const d = (dVal && typeof dVal === 'object' && 'toDate' in dVal) ? (dVal as { toDate: () => Date }).toDate() : new Date(dVal as string);
                                recordYear = d.getFullYear();
                                recordMonthIndex = d.getMonth();
                            } catch (e) { console.warn("Date parse error", e); }
                        } else if ((r as Record<string, unknown>).id && typeof (r as Record<string, unknown>).id === 'string') {
                            const parts = ((r as Record<string, unknown>).id as string).split('_');
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
                            if (typeof r.profit === 'number') val = r.profit;
                            else val = (Number(r.revenue || r.totalIncome || 0) - Number(r.expenses || r.totalExpenses || 0));

                            calculatedYtd += val;
                        }
                    });
                }

                setPrevMonthsYtd(calculatedYtd);

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
