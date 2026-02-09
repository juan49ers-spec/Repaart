import { useState, useEffect } from 'react';
import { financeService } from '../../../../services/financeService';
import { userService } from '../../../../services/userService';
import { FinancialRecord, LogisticsRate } from '../types';

interface UseFinancialDataLoadParams {
    franchiseId: string;
    month: string;
    initialData?: Partial<FinancialRecord>;
    user: any; // Using any for AuthContext user to avoid circular deps or complex mocks for now
}

export const useFinancialDataLoad = ({ franchiseId, month, initialData, user }: UseFinancialDataLoadParams) => {
    const [loading, setLoading] = useState(true);
    const [logisticsRates, setLogisticsRates] = useState<LogisticsRate[]>([]);
    const [record, setRecord] = useState<FinancialRecord | null>(null);
    const [prevMonthsYtd, setPrevMonthsYtd] = useState(0);

    useEffect(() => {
        async function loadData() {
            if (!franchiseId || !month) return;
            try {
                setLoading(true);
                // Parse current year and month index from "YYYY-MM" string (e.g., "2026-01")
                const [yearStr, monthStr] = month.split('-');
                const currentYear = parseInt(yearStr);
                const currentMonthIndex = parseInt(monthStr) - 1; // 0-based index

                const [data, yearlyData] = await Promise.all([
                    initialData || await financeService.getFinancialData(franchiseId, month) as FinancialRecord,
                    financeService.getFinancialYearlyData(franchiseId, currentYear)
                ]);

                let calculatedYtd = 0;

                if (Array.isArray(yearlyData)) {
                    console.log(`[useFinancialDataLoad] Calculating YTD for ${currentYear} up to month index ${currentMonthIndex}`);
                    yearlyData.forEach((r: any) => {
                        let recordMonthIndex = -1;
                        let recordYear = -1;

                        if (r.month && typeof r.month === 'string' && r.month.includes('-')) {
                            const parts = r.month.split('-');
                            recordYear = parseInt(parts[0]);
                            recordMonthIndex = parseInt(parts[1]) - 1;
                        } else if (r.date) {
                            try {
                                const d = r.date.toDate ? r.date.toDate() : new Date(r.date);
                                recordYear = d.getFullYear();
                                recordMonthIndex = d.getMonth();
                            } catch (e) { console.warn("Date parse error", e); }
                        } else if (r.id && typeof r.id === 'string') {
                            const parts = r.id.split('_');
                            const potentialDate = parts[parts.length - 1];
                            if (potentialDate && potentialDate.match(/^\d{4}-\d{2}$/)) {
                                const dParts = potentialDate.split('-');
                                recordYear = parseInt(dParts[0]);
                                recordMonthIndex = parseInt(dParts[1]) - 1;
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
                console.log(`[useFinancialDataLoad] Total Previous YTD: ${calculatedYtd}`);

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

    return { loading, logisticsRates, record, prevMonthsYtd };
};
