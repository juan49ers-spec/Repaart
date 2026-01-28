import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financeService } from '../services/financeService';
import { calculateMonthlyRevenue, calculateExpenses, analyzeFinancialHealth, DEFAULT_MONTH_DATA, type MonthlyData, type FinancialReport, type FinancialAnalysis } from '../lib/finance';
import { useAuth } from '../context/AuthContext';
import { logAction, AUDIT_ACTIONS } from '../lib/audit';

interface FranchiseFinanceParams {
    franchiseId?: string;
    month?: string; // YYYY-MM
    tariffs?: any;
}

export interface FranchiseFinanceHook {
    rawData: MonthlyData;
    trendData: any[]; // Specific Trend type could be added later
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
    error: Error | null;
    updateFinance: (data: Partial<MonthlyData>) => Promise<void>;
    isSaving: boolean;
    refetch: () => void;
}

export const useFranchiseFinance = ({ franchiseId, month, tariffs }: FranchiseFinanceParams): FranchiseFinanceHook => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const queryKey = ['franchise-finance', franchiseId, month];

    // 1. FETCH DATA
    const { data: rawData, isLoading, isFetching, error, refetch } = useQuery({
        queryKey,
        queryFn: async () => {
            if (!franchiseId || !month) return DEFAULT_MONTH_DATA;
            const data = await financeService.getFinancialData(franchiseId, month);

            // Filter out deleted records (Consistency enhancement)
            if (data?.status === 'deleted') {
                return DEFAULT_MONTH_DATA;
            }

            return data || DEFAULT_MONTH_DATA;
        },
        enabled: !!user && !!franchiseId && !!month && user.role !== 'rider',
        staleTime: 1000 * 60 * 5, // 5 Minutes Stale Time (Reduces flickering)
        refetchOnWindowFocus: true,
    });

    // 2. CALCULATE DERIVED STATE
    // Combine Accounting & Operational logic
    const currentData = (rawData || DEFAULT_MONTH_DATA) as MonthlyData;

    // A. Operational Data (From useFinancialPulse)
    const operations = {
        totalOperationalHours: Number(currentData.totalOperationalHours || 0),
        totalShiftsCount: Number(currentData.totalShiftsCount || 0),
        // Add other operational fields here as needed
    };

    // B. Accounting Data (From useDashboardData)
    const revenue = calculateMonthlyRevenue(currentData, tariffs);
    const orders = Number(currentData.orders || 0);

    // Calculate expenses breakdown and taxes
    const report = calculateExpenses(revenue, orders, currentData);

    // AI/Algo Analysis
    const analysis = analyzeFinancialHealth(report.breakdown, revenue);

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
            queryClient.setQueryData(queryKey, (old: any) => ({ ...old, ...newData }));
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
        isFetching,
        error,

        // Actions
        updateFinance: saveMutation.mutateAsync,
        isSaving: saveMutation.isPending,
        refetch // Expose refetch
    };
};
