import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import React, { useMemo } from 'react';
import { financeService } from '../services/financeService';
import { calculateMonthlyRevenue, calculateExpenses, analyzeFinancialHealth, DEFAULT_MONTH_DATA, type MonthlyData, type FinancialReport, type FinancialAnalysis, type TariffConfig } from '../lib/finance';
import type { TrendItem } from '../types/finance';
import { useAuth } from '../context/AuthContext';
import { logAction, AUDIT_ACTIONS } from '../lib/audit';

interface FranchiseFinanceParams {
    franchiseId?: string;
    month?: string; // YYYY-MM
    tariffs?: TariffConfig;
}

export interface FranchiseFinanceHook {
    rawData: MonthlyData;
    trendData: TrendItem[];
    operations: {
        totalOperationalHours: number;
        totalShiftsCount: number;
    };
    accounting: {
        revenue: number;
        orders: number;
        report: FinancialReport;
    };
    analysis: FinancialAnalysis;
    loading: boolean;
    isFetching: boolean;
    isRealTime: boolean;
    error: Error | null;
    updateFinance: (data: Partial<MonthlyData>) => Promise<void>;
    isSaving: boolean;
}

export const useFranchiseFinance = ({ franchiseId, month, tariffs }: FranchiseFinanceParams): FranchiseFinanceHook => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const queryKey = ['franchise-finance', franchiseId, month];

    // 1. REAL-TIME DATA SYNC
    // Instead of useQuery, we use a subscription effect for the active month
    const [rawData, setRawData] = React.useState<MonthlyData>(DEFAULT_MONTH_DATA);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState<Error | null>(null);

    React.useEffect(() => {
        if (!franchiseId || !month || !user || user.role === 'rider') {
            setRawData(DEFAULT_MONTH_DATA);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);

        const unsubscribe = financeService.subscribeToFinancialData(
            franchiseId,
            month,
            (data) => {
                // Filter out deleted records
                if (data?.status === 'deleted') {
                    setRawData(DEFAULT_MONTH_DATA);
                } else {
                    setRawData(data || DEFAULT_MONTH_DATA);
                }
                setIsLoading(false);
                setError(null);
            },
            (err) => {
                console.error("Real-time sync error:", err);
                setError(err);
                setIsLoading(false);
            }
        );

        return () => unsubscribe();
    }, [franchiseId, month, user]);

    // 2. CALCULATE DERIVED STATE
    // Combine Accounting & Operational logic
    const currentData = rawData;

    // A. Operational Data (From useFinancialPulse)
    const operations = useMemo(() => ({
        totalOperationalHours: Number(currentData.totalOperationalHours || 0),
        totalShiftsCount: Number(currentData.totalShiftsCount || 0),
        // Add other operational fields here as needed
    }), [currentData]);

    // B. Accounting Data (From useDashboardData)
    const revenue = useMemo(() => calculateMonthlyRevenue(currentData, tariffs), [currentData, tariffs]);
    const orders = useMemo(() => Number(currentData.orders || 0), [currentData]);

    // Calculate expenses breakdown and taxes
    const report = useMemo(() => calculateExpenses(revenue, orders, currentData), [revenue, orders, currentData]);

    // AI/Algo Analysis
    const analysis = useMemo(() => analyzeFinancialHealth(report.breakdown, revenue), [report.breakdown, revenue]);

    // 3. FETCH TREND DATA (Updated to be month-relative and fetch 12 months for YTD support)
    const { data: trendData } = useQuery({
        queryKey: ['franchise-trend', franchiseId, month],
        queryFn: async () => {
            if (!franchiseId) return [];
            // Fetch 12 months back from the selected month to ensure full year coverage
            return financeService.getFinancialTrend(franchiseId, 12, month);
        },
        enabled: !!franchiseId && user?.role !== 'rider',
        staleTime: 1000 * 60 * 10 // 10 minutes
    });

    // 4. MUTATIONS (Save/Update)
    const saveMutation = useMutation({
        mutationFn: async (newData: Partial<MonthlyData>) => {
            if (!franchiseId || !month) throw new Error("Missing Context");
            await financeService.updateFinancialData(franchiseId, month, newData);
            if (user) {
                await logAction(user, AUDIT_ACTIONS.MONTHLY_DATA_EDITED, { month, context: 'useFranchiseFinance' });
            }
        },
        onMutate: async (newData) => {
            await queryClient.cancelQueries({ queryKey });
            const previousData = queryClient.getQueryData(queryKey);
            queryClient.setQueryData(queryKey, (old: MonthlyData | undefined) => ({ ...(old ?? DEFAULT_MONTH_DATA), ...newData }));
            return { previousData };
        },
        onError: (_err, _newData, context) => {
            if (context?.previousData) {
                queryClient.setQueryData(queryKey, context.previousData);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey });
            queryClient.invalidateQueries({ queryKey: ['franchise-trend', franchiseId] });
        },
    });

    return {
        // Raw Data
        rawData: currentData,
        trendData: trendData || [],

        // derived Domains
        operations,
        accounting: {
            revenue,
            orders,
            report, // Contains breakdown, taxes, ROI
        },

        // Insights
        analysis,

        // Meta
        loading: isLoading,
        isFetching: isLoading, // Compatible alias
        isRealTime: true, // Indicator for UI
        error,

        // Actions
        updateFinance: saveMutation.mutateAsync,
        isSaving: saveMutation.isPending
    };
};
