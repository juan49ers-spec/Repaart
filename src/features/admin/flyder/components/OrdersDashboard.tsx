import React, { useState, useMemo } from 'react';
import { useOrdersHistory } from '../../../../hooks/useOrdersHistory';
import { useFranchiseNetwork } from '../../../../hooks/useFranchiseNetwork';
import { Order } from '../../../../services/ordersHistoryService';
import { 
  Package, 
  Filter,
  Search,
  Download,
  RefreshCw,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { subDays, startOfDay, endOfDay } from 'date-fns';

const AdminOrdersHistory: React.FC = () => {
  const { orders, summary, loading, error, filters, setFilters, refresh } = useOrdersHistory();
  const { franchises } = useFranchiseNetwork();
  
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [datePreset, setDatePreset] = useState<'today' | 'week' | 'month'>('week');

  const filteredOrders = useMemo(() => {
    if (!searchTerm) return orders;
    const term = searchTerm.toLowerCase();
    return orders.filter(order => 
      order.id.toLowerCase().includes(term) ||
      order.riderName?.toLowerCase().includes(term) ||
      order.riderId.toLowerCase().includes(term) ||
      order.franchiseName?.toLowerCase().includes(term) ||
      order.franchiseId.toLowerCase().includes(term)
    );
  }, [orders, searchTerm]);

  const applyDatePreset = (preset: typeof datePreset) => {
    setDatePreset(preset);
    const now = new Date();
    let start: Date | undefined;
    let end: Date | undefined = endOfDay(now);

    switch (preset) {
      case 'today':
        start = startOfDay(now);
        break;
      case 'week':
        start = startOfDay(subDays(now, 7));
        break;
      case 'month':
        start = startOfDay(subDays(now, 30));
        break;
    }

    setFilters({ ...filters, startDate: start, endDate: end });
  };

  const exportToCSV = () => {
    const headers = ['ID Pedido', 'Fecha', 'Rider', 'Franquicia', 'Distancia (km)', 'Estado', 'Monto'];
    const rows = filteredOrders.map(order => [
      order.id,
      order.createdAt?.toDate?.().toLocaleString('es-ES') || '',
      order.riderName || order.riderId,
      order.franchiseName || order.franchiseId,
      order.distance?.toFixed(2) || '0',
      order.status,
      order.amount?.toFixed(2) || '0'
    ]);
    
    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(row => row.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pedidos_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const getStatusConfig = (status: Order['status']) => {
    switch (status) {
      case 'finished':
        return { label: 'Completado', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-600/20 dark:text-emerald-400' };
      case 'cancelled':
        return { label: 'Cancelado', color: 'bg-red-100 text-red-700 dark:bg-red-600/20 dark:text-red-400' };
      case 'in_progress':
        return { label: 'En Progreso', color: 'bg-blue-100 text-blue-700 dark:bg-blue-600/20 dark:text-blue-400' };
      default:
        return { label: 'Pendiente', color: 'bg-amber-100 text-amber-700 dark:bg-amber-600/20 dark:text-amber-400' };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ruby-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
        <button onClick={refresh} className="px-4 py-2 bg-ruby-600 text-white rounded-lg">
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="p-5 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-ruby-500 to-ruby-600 rounded-xl shadow-lg">
              <Package className="w-6 h-6 text-white" />
            </div>
            Historial de Pedidos
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {filteredOrders.length} pedidos • Actualizado {new Date().toLocaleTimeString('es-ES')}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all",
              showFilters 
                ? "bg-ruby-100 text-ruby-700 dark:bg-ruby-600/20 dark:text-ruby-400" 
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            )}
          >
            <Filter className="w-4 h-4" />
            Filtros
            {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-100 dark:bg-emerald-600/20 text-emerald-700 dark:text-emerald-400 rounded-lg font-medium"
          >
            <Download className="w-4 h-4" />
            Exportar
          </button>
          
          <button
            onClick={refresh}
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors"
          >
            <RefreshCw className={cn("w-5 h-5 text-slate-600", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="glass-card p-4 rounded-xl border-l-4 border-blue-500">
            <p className="text-xs text-slate-500 uppercase">Total</p>
            <p className="text-2xl font-bold">{summary.totalOrders}</p>
          </div>
          
          <div className="glass-card p-4 rounded-xl border-l-4 border-emerald-500">
            <p className="text-xs text-slate-500 uppercase">Completados</p>
            <p className="text-2xl font-bold">{summary.finishedOrders}</p>
            <p className="text-xs text-emerald-600">{((summary.finishedOrders / summary.totalOrders) * 100).toFixed(1)}%</p>
          </div>
          
          <div className="glass-card p-4 rounded-xl border-l-4 border-red-500">
            <p className="text-xs text-slate-500 uppercase">Cancelados</p>
            <p className="text-2xl font-bold">{summary.cancelledOrders}</p>
          </div>
          
          <div className="glass-card p-4 rounded-xl border-l-4 border-purple-500">
            <p className="text-xs text-slate-500 uppercase">Distancia</p>
            <p className="text-2xl font-bold">{summary.totalDistance.toFixed(1)} km</p>
          </div>
          
          <div className="glass-card p-4 rounded-xl border-l-4 border-amber-500">
            <p className="text-xs text-slate-500 uppercase">Importe</p>
            <p className="text-2xl font-bold">€{summary.totalAmount.toFixed(0)}</p>
          </div>
          
          <div className="glass-card p-4 rounded-xl border-l-4 border-ruby-500">
            <p className="text-xs text-slate-500 uppercase">Tasa Exito</p>
            <p className="text-2xl font-bold">{((summary.finishedOrders / (summary.totalOrders || 1)) * 100).toFixed(1)}%</p>
          </div>
        </div>
      )}

      {showFilters && (
        <div className="glass-card p-6 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Filter className="w-5 h-5 text-ruby-600" />
              Filtros
            </h3>
            <button 
              onClick={() => {
                setFilters({});
                setSearchTerm('');
                applyDatePreset('week');
              }}
              className="text-sm text-ruby-600 hover:text-ruby-700 font-medium"
            >
              Limpiar
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Periodo</label>
              <div className="flex gap-2">
                {(['today', 'week', 'month'] as const).map((preset) => (
                  <button
                    key={preset}
                    onClick={() => applyDatePreset(preset)}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                      datePreset === preset
                        ? "bg-ruby-600 text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                    )}
                  >
                    {preset === 'today' && 'Hoy'}
                    {preset === 'week' && 'Semana'}
                    {preset === 'month' && 'Mes'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Franquicia</label>
              <select
                value={filters.franchiseId || ''}
                onChange={(e) => setFilters({ ...filters, franchiseId: e.target.value || undefined })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                <option value="">Todas</option>
                {franchises.map(franchise => (
                  <option key={franchise.id} value={franchise.id}>{franchise.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Estado</label>
              <select
                value={filters.status || ''}
                onChange={(e) => setFilters({ ...filters, status: e.target.value as Order['status'] || undefined })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                <option value="">Todos</option>
                <option value="finished">Completado</option>
                <option value="cancelled">Cancelado</option>
                <option value="in_progress">En Progreso</option>
                <option value="pending">Pendiente</option>
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar por ID, rider, franquicia..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-100"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        )}
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Rider</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Franquicia</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Distancia</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                    No hay pedidos
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const statusConfig = getStatusConfig(order.status);
                  return (
                    <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3 text-sm font-mono">#{order.id.slice(-8)}</td>
                      <td className="px-4 py-3 text-sm">
                        {order.createdAt?.toDate?.().toLocaleString('es-ES')}
                      </td>
                      <td className="px-4 py-3 text-sm">{order.riderName || order.riderId}</td>
                      <td className="px-4 py-3 text-sm">{order.franchiseName || order.franchiseId}</td>
                      <td className="px-4 py-3 text-sm">{order.distance?.toFixed(2)} km</td>
                      <td className="px-4 py-3">
                        <span className={cn("px-2 py-1 rounded-full text-xs font-medium", statusConfig.color)}>
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold">€{order.amount?.toFixed(2)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminOrdersHistory;
