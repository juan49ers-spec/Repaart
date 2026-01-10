import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financeService } from '../services/financeService';
import { calculateMonthlyRevenue, calculateExpenses, analyzeFinancialHealth, DEFAULT_MONTH_DATA } from '../lib/finance';
import { useAuth } from '../context/AuthContext';
import { logAction, AUDIT_ACTIONS } from '../lib/audit';

interface FranchiseFinanceParams {
    franchiseId?: string;
    month?: string; // YYYY-MM
    tariffs?: any;
}

export const useFranchiseFinance = ({ franchiseId, month, tariffs }: FranchiseFinanceParams) => {
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
        enabled: !!user && !!franchiseId && !!month,
        staleTime: 1000 * 60 * 5, // 5 Minutes Stale Time (Reduces flickering)
        refetchOnWindowFocus: true,
    });

    // 2. CALCULATE DERIVED STATE
    // Combine Accounting & Operational logic
    const currentData = (rawData || DEFAULT_MONTH_DATA) as any;

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

    // 3. FETCH TREND DATA (New)
    const { data: trendData } = useQuery({
        queryKey: ['franchise-trend', franchiseId],
        queryFn: async () => {
            if (!franchiseId) return [];
            // Fetch last 6 months
            return financeService.getFinancialTrend(franchiseId, 6);
        },
        enabled: !!franchiseId,
        staleTime: 1000 * 60 * 10 // 10 minutes
    });

    // 4. MUTATIONS (Save/Update)
    const saveMutation = useMutation({
        mutationFn: async (newData: any) => {
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
