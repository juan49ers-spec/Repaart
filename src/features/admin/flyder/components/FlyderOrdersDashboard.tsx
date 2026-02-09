import React, { useState } from 'react';
import { useFlyderData } from '../../../../hooks/useFlyderData';
import {
  Package,
  RefreshCw,
  Filter,
  ChevronDown,
  ChevronUp,
  Search,
  X
} from 'lucide-react';
import { cn } from '../../../../lib/utils';

const FlyderOrdersDashboard: React.FC = () => {
  const { orders, stats, loading, error, refresh } = useFlyderData();
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      !searchTerm ||
      order.id?.toString().includes(searchTerm) ||
      order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.rider_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = !statusFilter || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed':
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

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={() => refresh()}
            className="px-4 py-2 bg-ruby-600 text-white rounded-lg hover:bg-ruby-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
              <Package className="w-6 h-6 text-white" />
            </div>
            Pedidos Flyder (MySQL)
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Conexión directa a base de datos • {filteredOrders.length} pedidos
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all",
              showFilters
                ? "bg-blue-100 text-blue-700 dark:bg-blue-600/20 dark:text-blue-400"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            )}
          >
            <Filter className="w-4 h-4" />
            Filtros
            {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          <button
            onClick={refresh}
            disabled={loading}
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn("w-5 h-5 text-slate-600", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="glass-card p-4 rounded-xl border-l-4 border-blue-500">
            <p className="text-xs text-slate-500 uppercase">Total (24h)</p>
            <p className="text-2xl font-bold">{stats.total_orders}</p>
          </div>

          <div className="glass-card p-4 rounded-xl border-l-4 border-emerald-500">
            <p className="text-xs text-slate-500 uppercase">Completados</p>
            <p className="text-2xl font-bold">{stats.completed}</p>
            <p className="text-xs text-emerald-600">
              {stats.total_orders > 0 ? ((stats.completed / stats.total_orders) * 100).toFixed(1) : 0}%
            </p>
          </div>

          <div className="glass-card p-4 rounded-xl border-l-4 border-amber-500">
            <p className="text-xs text-slate-500 uppercase">Pendientes</p>
            <p className="text-2xl font-bold">{stats.pending}</p>
          </div>

          <div className="glass-card p-4 rounded-xl border-l-4 border-red-500">
            <p className="text-xs text-slate-500 uppercase">Cancelados</p>
            <p className="text-2xl font-bold">{stats.cancelled}</p>
          </div>

          <div className="glass-card p-4 rounded-xl border-l-4 border-purple-500">
            <p className="text-xs text-slate-500 uppercase">Revenue (24h)</p>
            <p className="text-2xl font-bold">€{stats.total_revenue?.toFixed(0) || '0'}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="glass-card p-6 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Filter className="w-5 h-5 text-blue-600" />
              Filtros
            </h3>
            <button
              onClick={() => {
                setStatusFilter('');
                setSearchTerm('');
              }}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Limpiar
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Estado</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                <option value="">Todos</option>
                <option value="completed">Completado</option>
                <option value="cancelled">Cancelado</option>
                <option value="in_progress">En Progreso</option>
                <option value="pending">Pendiente</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar por ID, cliente, rider..."
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

      {/* Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Cliente</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Rider</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                    No hay pedidos
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const statusConfig = getStatusConfig(order.status);
                  return (
                    <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3 text-sm font-mono">#{order.id}</td>
                      <td className="px-4 py-3 text-sm">
                        {order.created_at ? new Date(order.created_at).toLocaleString('es-ES') : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm">{order.customer_name || '-'}</td>
                      <td className="px-4 py-3 text-sm">{order.rider_name || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={cn("px-2 py-1 rounded-full text-xs font-medium", statusConfig.color)}>
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold">
                        €{order.total?.toFixed(2) || '0.00'}
                      </td>
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

export default FlyderOrdersDashboard;