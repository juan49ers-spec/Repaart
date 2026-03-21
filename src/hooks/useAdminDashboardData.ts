import { useQuery, useQueryClient } from '@tanstack/react-query';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { financeService } from '../services/financeService';
import { franchiseService } from '../services/franchiseService';
import { isOk } from '../types/result';

// ── Query Key ─────────────────────────────────────────────────────────────────

export const adminDashboardQueryKey = (month: string) =>
    ['admin-dashboard', month] as const;

// ── Query Function ────────────────────────────────────────────────────────────

async function fetchAdminDashboardData(selectedMonth: string) {
    const targetMonth = selectedMonth || new Date().toISOString().slice(0, 7);

    // 1. Franchises + 2. Financial summaries + 3. Trend (parallel)
    const [franchiseResult, summariesSnap, realTrend] = await Promise.all([
        franchiseService.getAllFranchises(),
        getDocs(
            query(
                collection(db, 'financial_summaries'),
                where('month', '==', targetMonth)
            )
        ),
        financeService.getFinancialTrend(null, 6),
    ]);

    // Build financial summary map
    const financialMap = new Map<string, any>();
    summariesSnap.forEach(doc => {
        const data = doc.data();
        if (data.franchiseId) {
            financialMap.set(String(data.franchiseId).trim(), data);
        }
    });

    // Enrich franchises with revenue
    const franchises = isOk(franchiseResult)
        ? franchiseResult.data.map(f => {
              const cleanId = String(f.id).trim();
              const summary = financialMap.get(cleanId);
              return {
                  ...f,
                  uid: f.id,
                  active: f.status === 'active' || f.status === 'warning',
                  revenue: summary ? (summary.revenue || summary.totalIncome || 0) : 0,
              };
          })
        : [];

    // Map trend income → revenue for chart compatibility
    const trendData = realTrend.map(item => ({ ...item, revenue: item.income }));

    // KPIs for the selected month
    const selectedMonthData = realTrend.find(item => {
        try {
            const dateValue = item.month || item.fullDate;
            if (!dateValue) return false;
            if (typeof dateValue === 'string' && /^\d{4}-\d{2}$/.test(dateValue)) {
                return dateValue === selectedMonth;
            }
            return new Date(dateValue).toISOString().slice(0, 7) === selectedMonth;
        } catch {
            return false;
        }
    }) ?? realTrend[realTrend.length - 1];

    const totalRevenue  = selectedMonthData?.income   ?? 0;
    const totalExpenses = selectedMonthData?.expenses ?? 0;
    const totalProfit   = totalRevenue - totalExpenses;
    const margin        = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    const stats = {
        totalRevenue,
        totalProfit,
        margin,
        franchiseCount: franchises.filter(f => f.active).length,
    };

    return { stats, trendData, franchises };
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export const useAdminDashboardData = (selectedMonth: string) => {
    const queryClient = useQueryClient();

    const { data, isLoading, isFetching, error, refetch } = useQuery({
        queryKey: adminDashboardQueryKey(selectedMonth),
        queryFn: () => fetchAdminDashboardData(selectedMonth),
        staleTime: 2 * 60 * 1000, // 2 min — dashboards don't need sub-second freshness
    });

    return {
        stats:     data?.stats     ?? { totalRevenue: 0, totalProfit: 0, margin: 0, franchiseCount: 0 },
        trendData: data?.trendData ?? [],
        franchises:data?.franchises ?? [],
        loading:   isLoading,
        isFetching,
        error:     error ? (error as Error).message : null,
        refresh:   () => queryClient.invalidateQueries({ queryKey: adminDashboardQueryKey(selectedMonth) }),
    };
};
