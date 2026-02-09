import { useState, useEffect, useCallback } from 'react';
import { 
  ordersHistoryService, 
  Order, 
  OrdersFilter, 
  OrdersSummary 
} from '../services/ordersHistoryService';

interface UseOrdersHistoryReturn {
  orders: Order[];
  summary: OrdersSummary | null;
  loading: boolean;
  error: string | null;
  filters: OrdersFilter;
  setFilters: (filters: OrdersFilter) => void;
  refresh: () => void;
  loadMore: () => Promise<void>;
  hasMore: boolean;
}

/**
 * Hook para gestionar el historial de pedidos
 */
export function useOrdersHistory(initialFilters?: OrdersFilter): UseOrdersHistoryReturn {
  const [orders, setOrders] = useState<Order[]>([]);
  const [summary, setSummary] = useState<OrdersSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<OrdersFilter>(initialFilters || {});
  const [refreshKey, setRefreshKey] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [_page, _setPage] = useState(1);

  // Cargar pedidos cuando cambian los filtros o refreshKey
  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [ordersData, summaryData] = await Promise.all([
          ordersHistoryService.getOrders(filters, 100),
          ordersHistoryService.getOrdersSummary(filters)
        ]);

        setOrders(ordersData);
        setSummary(summaryData);
        setHasMore(ordersData.length === 100);
        _setPage(1);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error cargando pedidos');
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [filters, refreshKey]);

  // Refrescar datos
  const refresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  // Cargar más pedidos (paginación)
  const loadMore = useCallback(async () => {
    // Implementación básica - en producción usar cursor-based pagination
    console.log('Load more not implemented yet');
  }, []);

  return {
    orders,
    summary,
    loading,
    error,
    filters,
    setFilters,
    refresh,
    loadMore,
    hasMore
  };
}

export default useOrdersHistory;
