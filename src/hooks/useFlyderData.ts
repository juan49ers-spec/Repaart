import { useState, useEffect, useCallback } from 'react';
import { flyderService, FlyderOrder } from '../services/flyderService';

export interface FlyderStats {
  total_orders: number;
  completed: number;
  pending: number;
  cancelled: number;
  total_revenue: number;
}

export const useFlyderData = () => {
  const [orders, setOrders] = useState<FlyderOrder[]>([]);
  const [stats, setStats] = useState<FlyderStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async (params?: {
    limit?: number;
    offset?: number;
    franchiseId?: string;
    status?: string;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await flyderService.getOrders(params);
      setOrders(response.data);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar pedidos';
      setError(errorMessage);
      console.error('[useFlyderData] Error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const response = await flyderService.getStats();
      setStats(response.stats);
      return response.stats;
    } catch (err) {
      console.error('[useFlyderData] Error fetching stats:', err);
      throw err;
    }
  }, []);

  const refresh = useCallback(() => {
    return Promise.all([fetchOrders(), fetchStats()]);
  }, [fetchOrders, fetchStats]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    orders,
    stats,
    loading,
    error,
    fetchOrders,
    fetchStats,
    refresh
  };
};