import { db } from '../../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import type { TrendItem, MonthlyData } from '../../types/finance';

interface TrendAccumulator {
    income: number;
    expenses: number;
    date: Date;
    orders: number;
    totalHours: number;
    logisticsIncome: number;
    breakdown: Record<string, number>;
}

/**
 * DASHBOARD: Obtener tendencia financiera de los últimos X meses
 * Agrega los datos en el cliente (Client-Side Aggregation)
 */
export const getFinancialTrend = async (
    franchiseId: string | null,
    monthsBack: number = 6,
    baseDate?: string | Date
): Promise<TrendItem[]> => {
    // Early return if no franchiseId provided or if the user is a rider
    if (!franchiseId) return [];

    try {
        const monthlyStats = new Map<string, TrendAccumulator>();
        const referenceDate = baseDate
            ? (typeof baseDate === 'string' ? new Date(baseDate + '-01') : baseDate)
            : new Date();

        const summaryKeys: string[] = [];

        for (let i = monthsBack; i >= 0; i--) {
            const d = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - i, 1);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            monthlyStats.set(key, {
                income: 0,
                expenses: 0,
                date: d,
                orders: 0,
                totalHours: 0,
                logisticsIncome: 0,
                breakdown: {}
            });
            summaryKeys.push(key);
        }

        const constraints: any[] = [where('month', 'in', summaryKeys)];

        if (monthsBack > 9) {
            constraints.length = 0;
            const startKey = summaryKeys[0];
            constraints.push(where('month', '>=', startKey));
        }

        if (franchiseId) {
            constraints.push(where('franchiseId', '==', franchiseId));
        }

        const q = query(
            collection(db, 'financial_summaries'),
            ...constraints
        );

        const snapshot = await getDocs(q);

        snapshot.docs.forEach(docSnap => {
            const data = docSnap.data() as MonthlyData;
            if (!data.month) return;

            if (monthlyStats.has(data.month)) {
                const current = monthlyStats.get(data.month)!;
                const anyData = data as any;
                const income = data.totalIncome || data.revenue || anyData.summary?.grossIncome || anyData.grossIncome || 0;
                const expense = data.totalExpenses || data.expenses || anyData.summary?.totalExpenses || 0;
                const orders = Number(anyData.orders || 0);
                const totalHours = Number(anyData.totalHours || 0);

                current.income += Number(income);
                current.expenses += Number(expense);
                current.orders += orders;
                current.totalHours += totalHours;

                if (anyData.breakdown) {
                    Object.entries(anyData.breakdown).forEach(([key, val]) => {
                        current.breakdown[key] = (current.breakdown[key] || 0) + Number(val || 0);
                    });
                }

                if (anyData.logisticsIncome) {
                    current.logisticsIncome = (current.logisticsIncome || 0) + Number(anyData.logisticsIncome);
                }
            }
        });

        const result: TrendItem[] = Array.from(monthlyStats.entries()).map(([monthKey, stat]) => {
            const monthName = stat.date.toLocaleDateString('es-ES', { month: 'short' });

            return {
                name: monthName.charAt(0).toUpperCase() + monthName.slice(1),
                month: monthKey,
                income: stat.income,
                revenue: stat.income,
                expenses: stat.expenses,
                profit: stat.income - stat.expenses,
                orders: stat.orders || 0,
                totalHours: stat.totalHours || 0,
                logisticsIncome: stat.logisticsIncome || 0,
                breakdown: stat.breakdown || {},
                fullDate: stat.date.toISOString()
            };
        });

        return result;
    } catch (error) {
        console.error("Error calculating financial trend:", error);
        return [];
    }
};