import { useState, useEffect, useCallback } from 'react';
import { financeService } from '../services/financeService';
// userService import removed as unused
import { franchiseService } from '../services/franchiseService';
import { isOk } from '../types/result';

// --- MOCK REMOVED: generateTrend se va a la basura ---

export const useAdminDashboardData = (selectedMonth: string) => {
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalProfit: 0,
        margin: 0,
        franchiseCount: 0
    });
    const [trendData, setTrendData] = useState<any[]>([]);
    const [franchises, setFranchises] = useState<any[]>([]);

    const [loading, setLoading] = useState(true);
    const [isFetching, setIsFetching] = useState(false); // Para revalidaciones silenciosas
    const [error, setError] = useState<string | null>(null);

    const loadDashboardData = useCallback(async () => {
        try {
            setIsFetching(true);
            setError(null);

            // 1. Cargar Franquicias (Entidades reales, no users)
            const franchiseResult = await franchiseService.getAllFranchises();


            if (franchiseResult.success) {

            } else {
                console.error('❌ Error cargando franquicias:', franchiseResult.error);
            }
            const franchiseList = isOk(franchiseResult) ? franchiseResult.data.map(f => ({
                ...f,
                uid: f.id, // Map ID to uid for FranchiseSelector compatibility
                active: f.status === 'active' || f.status === 'warning', // Weak mapping
            })) : [];

            setFranchises(franchiseList);

            // 2. Cargar Tendencia REAL (Últimos 6 meses)
            const realTrend = await financeService.getFinancialTrend(null, 6);
            // Map income to revenue for Chart compatibility
            const mappedTrend = realTrend.map(item => ({
                ...item,
                revenue: item.income
            }));
            setTrendData(mappedTrend);

            // 3. Calcular KPIs del MES SELECCIONADO (no acumulado)
            // Buscar datos específicos del mes seleccionado con matching robusto
            let selectedMonthData = realTrend.find(item => {
                try {
                    if (!item.month && !item.date) return false;
                    const dateValue = item.month || item.date;

                    // Si ya es formato YYYY-MM, comparar directamente
                    if (typeof dateValue === 'string' && dateValue.match(/^\d{4}-\d{2}$/)) {
                        return dateValue === selectedMonth;
                    }

                    // Sino, convertir a Date
                    const itemMonth = new Date(dateValue).toISOString().slice(0, 7);
                    return itemMonth === selectedMonth;
                } catch {
                    return false;
                }
            });

            // FALLBACK: Si no encontramos el mes exacto, usar el mes más reciente
            if (!selectedMonthData && realTrend.length > 0) {
                selectedMonthData = realTrend[realTrend.length - 1];
            }

            let totalRevenue = 0;
            let totalExpenses = 0;

            if (selectedMonthData) {
                totalRevenue = selectedMonthData.income || 0;
                totalExpenses = selectedMonthData.expenses || 0;
            }

            const totalProfit = totalRevenue - totalExpenses;
            const margin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

            setStats({
                totalRevenue,
                totalProfit,
                margin,
                franchiseCount: franchiseList.filter(f => f.active).length
            });

        } catch (err: any) {
            console.error("Dashboard Data Error:", err);
            setError(err.message || "Error cargando datos del dashboard");
        } finally {
            setLoading(false);
            setIsFetching(false);
        }
    }, [selectedMonth]); // Recargar si cambia el mes (si implementamos filtro por mes en getTrend)

    // Initial Load
    useEffect(() => {
        loadDashboardData();
    }, [loadDashboardData]);

    return {
        stats,
        trendData,
        franchises,
        loading,
        isFetching,
        error,
        refresh: loadDashboardData
    };
};
