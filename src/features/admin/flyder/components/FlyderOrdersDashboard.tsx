import React, { useState } from 'react';
import { useFlyderData } from '../../../../hooks/useFlyderData';
import {
  Package,
  RefreshCw,
  Filter,
  ChevronDown,
  ChevronRight,
  Search,
  X,
  MapPin,
  Phone,
  Clock,
  CreditCard,
  Box,
  AlertCircle
} from 'lucide-react';
import { cn } from '../../../../lib/utils';

const FlyderOrdersDashboard: React.FC = () => {
  const { orders, stats, loading, error, refresh } = useFlyderData();
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set());

  const formatDate = (dateValue: any): string => {
    if (!dateValue) return '-';
    
    // Options for Spanish timezone (Europe/Madrid)
    const dateOptions: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Madrid'
    };
    
    // If it's a Date object (check with duck typing)
    if (typeof dateValue === 'object' && dateValue !== null) {
      // Check if it has Date methods
      if (typeof (dateValue as any).toISOString === 'function') {
        try {
          const date = dateValue as Date;
          if (isNaN(date.getTime())) {
            return String(dateValue);
          }
          return date.toLocaleString('es-ES', dateOptions);
        } catch (error) {
          return String(dateValue);
        }
      }
      // It's an object but not a Date
      return JSON.stringify(dateValue);
    }
    
    // If it's already a string that looks like a date, parse and format it
    if (typeof dateValue === 'string') {
      try {
        // Parse the string as UTC and convert to Spanish timezone
        const date = new Date(dateValue + 'Z'); // Append 'Z' to treat as UTC
        if (isNaN(date.getTime())) {
          return dateValue; // Return original string if parsing fails
        }
        return date.toLocaleString('es-ES', dateOptions);
      } catch (error) {
        return dateValue;
      }
    }
    
    // For any other type, convert to string
    return String(dateValue);
  };

  const formatCustomerName = (order: any): string => {
    if (order.customer_name) {
      return String(order.customer_name);
    }
    
    // Try alternative fields: phone or address
    const parts: string[] = [];
    
    if (order.customer_phone) {
      parts.push(`📱 ${String(order.customer_phone)}`);
    }
    
    if (order.customer_addr_street) {
      const street = String(order.customer_addr_street || '');
      const number = String(order.customer_addr_no || '');
      const city = String(order.customer_addr_city || '');
      
      const address = `${street} ${number}`.trim();
      if (address) {
        parts.push(`📍 ${address}${city ? `, ${city}` : ''}`);
      }
    }
    
    if (parts.length > 0) {
      return parts.join(' | ');
    }
    
    return 'Sin datos';
  };

  const toggleOrderExpansion = (orderId: number) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const renderExpandedDetails = (order: any) => {
    // Helper function to safely convert any value to string
    const safeString = (value: any): string => {
      if (value === null || value === undefined) return '';
      if (typeof value === 'object') {
        try {
          return JSON.stringify(value);
        } catch {
          return String(value);
        }
      }
      return String(value);
    };

    const fields = [
      { label: 'SKU', value: order.sku, icon: <Package className="w-4 h-4" /> },
      { label: 'Store', value: order.store_name, icon: <Box className="w-4 h-4" /> },
      { label: 'Franquicia', value: order.franchise_name, icon: <MapPin className="w-4 h-4" /> },
      { label: 'Teléfono', value: order.customer_phone, icon: <Phone className="w-4 h-4" /> },
      { label: 'Método pago', value: order.payment_method, icon: <CreditCard className="w-4 h-4" /> },
      { label: 'Distancia', value: order.distance ? `${order.distance}m` : null, icon: <MapPin className="w-4 h-4" /> },
      { label: 'Duración', value: order.duration ? `${order.duration}s` : null, icon: <Clock className="w-4 h-4" /> },
      { label: 'Tamaño', value: order.size, icon: <Box className="w-4 h-4" /> },
      { label: 'Urgente', value: order.urgent ? 'Sí' : 'No', icon: <AlertCircle className="w-4 h-4" /> },
      { label: 'Frío', value: order.cold ? 'Sí' : 'No', icon: <Box className="w-4 h-4" /> },
      { label: 'Comentarios', value: order.comments, icon: null },
      { label: 'Detalles', value: order.details, icon: null },
      { label: 'ID Externo', value: order.ext_order_id, icon: null },
      { label: 'SKU Externo', value: order.ext_order_sku, icon: null },
      { label: 'Nº Pedido', value: order.order_number, icon: null },
      { label: 'Source', value: order.source, icon: null },
      { label: 'Cancelado por', value: order.cancelled_by, icon: null },
      { label: 'Razón cancel', value: order.cancel_reason, icon: null },
      { label: 'Detalles cancel', value: order.cancel_details, icon: null },
      { label: 'Intentos', value: order.assignment_attempts, icon: null },
    ];

    const addressFields = [
      { label: 'Calle', value: order.customer_addr_street },
      { label: 'Número', value: order.customer_addr_no },
      { label: 'Piso', value: order.customer_addr_floor },
      { label: 'Puerta', value: order.customer_addr_door },
      { label: 'CP', value: order.customer_addr_postal_code },
      { label: 'Provincia', value: order.customer_addr_prov },
      { label: 'Ciudad', value: order.customer_addr_city },
      { label: 'Otros', value: order.customer_addr_other },
    ];

    const hasAddress = addressFields.some(f => f.value);
    const lat = order.customer_latitude;
    const lng = order.customer_longitude;

    return (
      <td colSpan={6} className="px-4 py-4 bg-slate-50 dark:bg-slate-800/50">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Información general */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Package className="w-4 h-4" />
              Información del Pedido
            </h4>
            <div className="space-y-1.5">
              {fields.filter(f => f.value !== undefined && f.value !== null && f.value !== '').map(field => (
                <div key={field.label} className="flex items-start gap-2 text-sm">
                  {field.icon && <span className="text-slate-400 mt-0.5">{field.icon}</span>}
                  <span className="text-slate-600 dark:text-slate-400 min-w-[100px]">{field.label}:</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100 break-all">
                    {safeString(field.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Dirección completa */}
          {(hasAddress || (lat && lng)) && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Dirección de Entrega
              </h4>
              <div className="space-y-1.5">
                {addressFields.filter(f => f.value).map(field => (
                  <div key={field.label} className="flex items-start gap-2 text-sm">
                    <span className="text-slate-600 dark:text-slate-400 min-w-[100px]">{field.label}:</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      {safeString(field.value)}
                    </span>
                  </div>
                ))}
                {lat && lng && (
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-slate-600 dark:text-slate-400 min-w-[100px]">Coords:</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100 font-mono text-xs">
                      {safeString(lat)}, {safeString(lng)}
                    </span>
                  </div>
                )}
                {order.customer_place_id && (
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-slate-600 dark:text-slate-400 min-w-[100px]">Place ID:</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100 text-xs break-all">
                      {safeString(order.customer_place_id)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Fechas y estados */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Fechas y Estados
            </h4>
            <div className="space-y-1.5">
              <div className="flex items-start gap-2 text-sm">
                <span className="text-slate-600 dark:text-slate-400 min-w-[100px]">Creado:</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {formatDate(order.created_at)}
                </span>
              </div>
              {order.updated_at && (
                <div className="flex items-start gap-2 text-sm">
                  <span className="text-slate-600 dark:text-slate-400 min-w-[100px]">Actualizado:</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {formatDate(order.updated_at)}
                  </span>
                </div>
              )}
              {order.ready_time && (
                <div className="flex items-start gap-2 text-sm">
                  <span className="text-slate-600 dark:text-slate-400 min-w-[100px]">Listo:</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {formatDate(order.ready_time)}
                  </span>
                </div>
              )}
              {order.ready_to_pick_up_time && (
                <div className="flex items-start gap-2 text-sm">
                  <span className="text-slate-600 dark:text-slate-400 min-w-[100px]">Recogida:</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {formatDate(order.ready_to_pick_up_time)}
                  </span>
                </div>
              )}
              {order.ext_order_timestamp && (
                <div className="flex items-start gap-2 text-sm">
                  <span className="text-slate-600 dark:text-slate-400 min-w-[100px]">Ext. Timestamp:</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {formatDate(order.ext_order_timestamp)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </td>
    );
  };

  const filteredOrders = orders.filter(order => {
    try {
      // Log first order to debug
      if (order === orders[0]) {
        console.log('[FlyderOrdersDashboard] First order data:', JSON.stringify(order, null, 2));
        console.log('[FlyderOrdersDashboard] Order keys:', Object.keys(order));
        console.log('[FlyderOrdersDashboard] created_at type:', typeof order.created_at);
        console.log('[FlyderOrdersDashboard] created_at value:', order.created_at);
        console.log('[FlyderOrdersDashboard] created_at instanceof Date:', (order.created_at as any) instanceof Date);
        
        // Log each field type
        Object.keys(order).forEach(key => {
          const value = (order as any)[key];
          const type = typeof value;
          if (type === 'object' && value !== null) {
            console.log(`[FlyderOrdersDashboard] ${key}:`, type, '→', JSON.stringify(value).substring(0, 100));
          } else {
            console.log(`[FlyderOrdersDashboard] ${key}:`, type, '→', value);
          }
        });
      }

      const matchesSearch =
        !searchTerm ||
        String(order.id || '').includes(searchTerm) ||
        String(order.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(order.rider_name || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = !statusFilter || order.status === statusFilter;

      return matchesSearch && matchesStatus;
    } catch (error) {
      console.error('[FlyderOrdersDashboard] Error filtering order:', error, order);
      return false;
    }
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
            <ChevronDown className={cn("w-4 h-4 transition-transform", showFilters && "rotate-180")} />
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
            <p className="text-2xl font-bold">€{Number(stats.total_revenue || 0).toFixed(0)}</p>
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
                  const isExpanded = expandedOrders.has(order.id);
                  
                  return (
                    <React.Fragment key={order.id}>
                      <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer" onClick={() => toggleOrderExpansion(order.id)}>
                        <td className="px-4 py-3 text-sm font-mono">
                          <div className="flex items-center gap-2">
                            <ChevronRight 
                              className={cn(
                                "w-4 h-4 transition-transform text-slate-400",
                                isExpanded && "rotate-90"
                              )} 
                            />
                            #{String(order.id || '')}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                          {formatDate(order.created_at)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className="font-medium">{formatCustomerName(order)}</span>
                        </td>
                        <td className="px-4 py-3 text-sm">{String(order.rider_name || '-')}</td>
                        <td className="px-4 py-3">
                          <span className={cn("px-2 py-1 rounded-full text-xs font-medium", statusConfig.color)}>
                            {statusConfig.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold">
                          €{Number(order.total || 0).toFixed(2)}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          {renderExpandedDetails(order)}
                        </tr>
                      )}
                    </React.Fragment>
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