import React, { useState } from 'react';
import { useFranchiseNetwork } from '../../../../hooks/useFranchiseNetwork';
import { 
  Building2, 
  Store as StoreIcon, 
  Users, 
  ChevronRight, 
  MapPin,
  Phone,
  Mail,
  Activity,
  Clock,
  Package,
  Star,
  ArrowLeft,
  RefreshCw,
  TrendingUp,
  Calendar,
  Bike
} from 'lucide-react';
import { cn } from '../../../../lib/utils';

/**
 * Admin Network Dashboard
 * 
 * Vista jerarquica completa para administradores:
 * Franquicias -> Restaurantes -> Riders
 */
const AdminNetworkDashboard: React.FC = () => {
  const {
    franchises,
    selectedFranchise,
    stores,
    selectedStore,
    riders,
    selectedRider,
    loading,
    error,
    selectFranchise,
    selectStore,
    selectRider,
    refresh
  } = useFranchiseNetwork();

  const [viewMode, setViewMode] = useState<'list' | 'franchise' | 'store' | 'rider'>('list');

  // Helper para obtener icono de vehiculo
  const getVehicleIcon = (type?: string) => {
    switch (type) {
      case 'moto': return Bike;
      case 'bike': return Bike;
      case 'car': return Activity;
      default: return Activity;
    }
  };

  // Renderizar lista de franquicias
  const renderFranchisesList = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-7 h-7 text-ruby-600" />
            Red de Franquicias
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {franchises.length} franquicias en la red
          </p>
        </div>
        <button
          onClick={refresh}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          title="Refrescar"
        >
          <RefreshCw className={cn("w-4 h-4 text-slate-600", loading && "animate-spin")} />
          <span className="text-sm font-medium text-slate-600">Refrescar</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {franchises.map((franchise) => (
          <div
            key={franchise.id}
            onClick={() => {
              selectFranchise(franchise.id);
              setViewMode('franchise');
            }}
            className="glass-card p-6 rounded-2xl cursor-pointer hover:shadow-xl transition-all duration-300 group border border-transparent hover:border-ruby-200 dark:hover:border-ruby-800"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-ruby-500 to-ruby-600 rounded-xl shadow-lg shadow-ruby-500/20">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <span className={cn(
                "px-3 py-1 rounded-full text-xs font-semibold",
                franchise.status === 'active' && "bg-emerald-100 text-emerald-700 dark:bg-emerald-600/20 dark:text-emerald-400",
                franchise.status === 'inactive' && "bg-slate-100 text-slate-700 dark:bg-slate-600/20 dark:text-slate-400",
                franchise.status === 'pending' && "bg-amber-100 text-amber-700 dark:bg-amber-600/20 dark:text-amber-400"
              )}>
                {franchise.status === 'active' ? 'Activa' : franchise.status === 'inactive' ? 'Inactiva' : 'Pendiente'}
              </span>
            </div>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{franchise.name}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{franchise.code}</p>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 mb-1">
                  <StoreIcon className="w-4 h-4 text-blue-500" />
                  <span className="text-xs font-medium">Restaurantes</span>
                </div>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{franchise.metadata?.totalStores || 0}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 mb-1">
                  <Users className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-medium">Riders</span>
                </div>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{franchise.metadata?.totalRiders || 0}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {franchise.location || 'Sin ubicacion'}
                </span>
                <div className="flex items-center text-ruby-600 font-semibold text-sm group-hover:translate-x-1 transition-transform">
                  Ver detalles <ChevronRight className="w-4 h-4 ml-1" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Renderizar detalle de franquicia
  const renderFranchiseDetail = () => {
    if (!selectedFranchise) return null;

    return (
      <div className="space-y-6">
        {/* Header con breadcrumb */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              setViewMode('list');
              refresh();
            }}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-1">
              <span>Red de Franquicias</span>
              <ChevronRight className="w-4 h-4" />
              <span className="text-ruby-600 font-medium">Franquicia</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{selectedFranchise.name}</h2>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="glass-card p-5 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-600/20 rounded-lg">
                <StoreIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Restaurantes</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stores.length}</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-5 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-600/20 rounded-lg">
                <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Riders Totales</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{riders.length}</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-5 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-600/20 rounded-lg">
                <Activity className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Estado</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white capitalize">{selectedFranchise.status}</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-5 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-600/20 rounded-lg">
                <Calendar className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Desde</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">
                  {selectedFranchise.createdAt?.toDate?.().toLocaleDateString('es-ES') || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        {(selectedFranchise.managerName || selectedFranchise.managerEmail || selectedFranchise.phone) && (
          <div className="glass-card p-5 rounded-xl">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-ruby-600" />
              Informacion de Contacto
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {selectedFranchise.managerName && (
                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                  <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    <Users className="w-4 h-4" />
                  </div>
                  <span>{selectedFranchise.managerName}</span>
                </div>
              )}
              {selectedFranchise.managerEmail && (
                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                  <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    <Mail className="w-4 h-4" />
                  </div>
                  <span className="truncate">{selectedFranchise.managerEmail}</span>
                </div>
              )}
              {selectedFranchise.phone && (
                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                  <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    <Phone className="w-4 h-4" />
                  </div>
                  <span>{selectedFranchise.phone}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Lista de Restaurantes */}
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <StoreIcon className="w-6 h-6 text-blue-600" />
            Restaurantes ({stores.length})
          </h3>
          
          {stores.length === 0 ? (
            <div className="text-center py-12 glass-card rounded-xl">
              <StoreIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400">No hay restaurantes registrados</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stores.map((store) => (
                <div
                  key={store.id}
                  onClick={() => {
                    selectStore(store.id);
                    setViewMode('store');
                  }}
                  className="glass-card p-5 rounded-xl cursor-pointer hover:shadow-lg transition-all group border border-transparent hover:border-blue-200 dark:hover:border-blue-800"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-600/20 rounded-lg">
                      <StoreIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium",
                      store.status === 'active' && "bg-emerald-100 text-emerald-700",
                      store.status === 'inactive' && "bg-slate-100 text-slate-700",
                      store.status === 'pending' && "bg-amber-100 text-amber-700"
                    )}>
                      {store.status}
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-900 dark:text-white mb-1">{store.name}</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">{store.code}</p>

                  {store.address && (
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-2">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span className="truncate">{store.address}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400">
                      <Users className="w-4 h-4" />
                      <span>{store.metadata?.totalRiders || 0} riders</span>
                    </div>
                    {store.platform && (
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-xs capitalize">
                        {store.platform}
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex items-center text-blue-600 font-semibold text-sm group-hover:translate-x-1 transition-transform">
                    Ver riders <ChevronRight className="w-4 h-4 ml-1" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Renderizar detalle de tienda
  const renderStoreDetail = () => {
    if (!selectedStore) return null;

    return (
      <div className="space-y-6">
        {/* Header con breadcrumb */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              setViewMode('franchise');
              if (selectedFranchise) {
                selectFranchise(selectedFranchise.id);
              }
            }}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-1">
              <span>Red</span>
              <ChevronRight className="w-4 h-4" />
              <span>{selectedFranchise?.name}</span>
              <ChevronRight className="w-4 h-4" />
              <span className="text-blue-600 font-medium">Restaurante</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{selectedStore.name}</h2>
          </div>
        </div>

        {/* Store Info Card */}
        <div className="glass-card p-6 rounded-xl">
          <div className="flex items-start gap-6">
            <div className="p-4 bg-blue-100 dark:bg-blue-600/20 rounded-2xl">
              <StoreIcon className="w-10 h-10 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{selectedStore.name}</h3>
                <span className={cn(
                  "px-3 py-1 rounded-full text-sm font-medium",
                  selectedStore.status === 'active' && "bg-emerald-100 text-emerald-700",
                  selectedStore.status === 'inactive' && "bg-slate-100 text-slate-700",
                  selectedStore.status === 'pending' && "bg-amber-100 text-amber-700"
                )}>
                  {selectedStore.status}
                </span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 mb-4">{selectedStore.code}</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {selectedStore.address && (
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <MapPin className="w-5 h-5 text-ruby-600" />
                    <span>{selectedStore.address}</span>
                  </div>
                )}
                {selectedStore.phone && (
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <Phone className="w-5 h-5 text-ruby-600" />
                    <span>{selectedStore.phone}</span>
                  </div>
                )}
                {selectedStore.email && (
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <Mail className="w-5 h-5 text-ruby-600" />
                    <span className="truncate">{selectedStore.email}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-card p-5 rounded-xl text-center">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-600/20 rounded-xl w-fit mx-auto mb-3">
              <Users className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Riders</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{riders.length}</p>
          </div>

          <div className="glass-card p-5 rounded-xl text-center">
            <div className="p-3 bg-blue-100 dark:bg-blue-600/20 rounded-xl w-fit mx-auto mb-3">
              <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Plataforma</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white capitalize">{selectedStore.platform || 'N/A'}</p>
          </div>

          <div className="glass-card p-5 rounded-xl text-center">
            <div className="p-3 bg-purple-100 dark:bg-purple-600/20 rounded-xl w-fit mx-auto mb-3">
              <Calendar className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Desde</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">
              {selectedStore.createdAt?.toDate?.().toLocaleDateString('es-ES') || 'N/A'}
            </p>
          </div>
        </div>

        {/* Lista de Riders */}
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-600" />
            Riders ({riders.length})
          </h3>

          {riders.length === 0 ? (
            <div className="text-center py-12 glass-card rounded-xl">
              <Users className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400">No hay riders registrados</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {riders.map((rider) => {
                const VehicleIcon = getVehicleIcon(rider.vehicleType);
                return (
                  <div
                    key={rider.id}
                    onClick={() => {
                      selectRider(rider.id);
                      setViewMode('rider');
                    }}
                    className="glass-card p-5 rounded-xl cursor-pointer hover:shadow-lg transition-all group border border-transparent hover:border-emerald-200 dark:hover:border-emerald-800"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-emerald-100 dark:bg-emerald-600/20 rounded-xl">
                        <Users className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <span className={cn(
                        "px-2 py-1 rounded-full text-xs font-medium",
                        rider.status === 'active' && "bg-emerald-100 text-emerald-700",
                        rider.status === 'inactive' && "bg-slate-100 text-slate-700",
                        rider.status === 'on_leave' && "bg-amber-100 text-amber-700"
                      )}>
                        {rider.status === 'active' ? 'Activo' : rider.status === 'inactive' ? 'Inactivo' : 'De baja'}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 dark:text-white mb-1">{rider.name}</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-3 truncate">{rider.email}</p>

                    {rider.vehicleType && (
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-2">
                        <VehicleIcon className="w-4 h-4" />
                        <span className="capitalize">{rider.vehicleType}</span>
                        {rider.vehiclePlate && (
                          <span className="text-slate-400">({rider.vehiclePlate})</span>
                        )}
                      </div>
                    )}

                    {rider.metrics && (
                      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 text-slate-500 dark:text-slate-400">
                            <Clock className="w-3 h-3" />
                          </div>
                          <p className="text-xs text-slate-500">Horas</p>
                          <p className="font-semibold text-slate-900 dark:text-white">{rider.metrics.totalHours || 0}</p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 text-slate-500 dark:text-slate-400">
                            <Package className="w-3 h-3" />
                          </div>
                          <p className="text-xs text-slate-500">Pedidos</p>
                          <p className="font-semibold text-slate-900 dark:text-white">{rider.metrics.totalOrders || 0}</p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 text-slate-500 dark:text-slate-400">
                            <Star className="w-3 h-3" />
                          </div>
                          <p className="text-xs text-slate-500">Rating</p>
                          <p className="font-semibold text-slate-900 dark:text-white">{rider.metrics.rating || '-'}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Renderizar detalle de rider
  const renderRiderDetail = () => {
    if (!selectedRider) return null;

    const VehicleIcon = getVehicleIcon(selectedRider.vehicleType);

    return (
      <div className="space-y-6">
        {/* Header con breadcrumb */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              setViewMode('store');
              if (selectedStore) {
                selectStore(selectedStore.id);
              }
            }}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-1">
              <span>Red</span>
              <ChevronRight className="w-4 h-4" />
              <span>{selectedFranchise?.name}</span>
              <ChevronRight className="w-4 h-4" />
              <span>{selectedStore?.name}</span>
              <ChevronRight className="w-4 h-4" />
              <span className="text-emerald-600 font-medium">Rider</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{selectedRider.name}</h2>
          </div>
        </div>

        {/* Rider Info Card */}
        <div className="glass-card p-6 rounded-xl">
          <div className="flex items-start gap-6">
            <div className="p-5 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl shadow-lg shadow-emerald-500/20">
              <Users className="w-12 h-12 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{selectedRider.name}</h3>
                <span className={cn(
                  "px-3 py-1 rounded-full text-sm font-medium",
                  selectedRider.status === 'active' && "bg-emerald-100 text-emerald-700",
                  selectedRider.status === 'inactive' && "bg-slate-100 text-slate-700",
                  selectedRider.status === 'on_leave' && "bg-amber-100 text-amber-700"
                )}>
                  {selectedRider.status === 'active' ? 'Activo' : selectedRider.status === 'inactive' ? 'Inactivo' : 'De baja'}
                </span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 mb-4">{selectedRider.email}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                  <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    <Mail className="w-4 h-4" />
                  </div>
                  <span>{selectedRider.email}</span>
                </div>
                {selectedRider.phone && (
                  <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                    <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                      <Phone className="w-4 h-4" />
                    </div>
                    <span>{selectedRider.phone}</span>
                  </div>
                )}
                {selectedRider.vehicleType && (
                  <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                    <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                      <VehicleIcon className="w-4 h-4" />
                    </div>
                    <span className="capitalize">
                      {selectedRider.vehicleType}
                      {selectedRider.vehiclePlate && ` (${selectedRider.vehiclePlate})`}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                  <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <span>
                    Desde: {selectedRider.createdAt?.toDate?.().toLocaleDateString('es-ES') || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Metrics */}
        {selectedRider.metrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-card p-5 rounded-xl text-center">
              <div className="p-3 bg-blue-100 dark:bg-blue-600/20 rounded-xl w-fit mx-auto mb-3">
                <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Total Turnos</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{selectedRider.metrics.totalShifts || 0}</p>
            </div>

            <div className="glass-card p-5 rounded-xl text-center">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-600/20 rounded-xl w-fit mx-auto mb-3">
                <Clock className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Horas</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{selectedRider.metrics.totalHours || 0}</p>
            </div>

            <div className="glass-card p-5 rounded-xl text-center">
              <div className="p-3 bg-purple-100 dark:bg-purple-600/20 rounded-xl w-fit mx-auto mb-3">
                <Package className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Pedidos</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{selectedRider.metrics.totalOrders || 0}</p>
            </div>

            <div className="glass-card p-5 rounded-xl text-center">
              <div className="p-3 bg-amber-100 dark:bg-amber-600/20 rounded-xl w-fit mx-auto mb-3">
                <Star className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Rating</p>
              <div className="flex items-center justify-center gap-1">
                <p className="text-3xl font-bold text-slate-900 dark:text-white">{selectedRider.metrics.rating || '-'}</p>
                {selectedRider.metrics.rating && <Star className="w-5 h-5 text-amber-500 fill-amber-500" />}
              </div>
            </div>
          </div>
        )}

        {/* Performance Chart Placeholder */}
        <div className="glass-card p-6 rounded-xl">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-ruby-600" />
            Rendimiento
          </h3>
          <div className="h-48 flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 rounded-lg">
            <p className="text-slate-400">Grafico de rendimiento (proximamente)</p>
          </div>
        </div>

        {/* Actions */}
        <div className="glass-card p-6 rounded-xl">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Acciones</h3>
          <div className="flex flex-wrap gap-3">
            <button className="px-4 py-2 bg-ruby-600 text-white rounded-lg hover:bg-ruby-700 transition-colors font-medium">
              Ver Historial
            </button>
            <button className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors font-medium">
              Editar Perfil
            </button>
            <button className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors font-medium">
              Ver Nomina
            </button>
            <button className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors font-medium">
              Asignar Turno
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading && viewMode === 'list') {
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
        <button onClick={refresh} className="px-4 py-2 bg-ruby-600 text-white rounded-lg hover:bg-ruby-700 transition-colors">
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="p-5 md:p-8 space-y-6 max-w-7xl mx-auto">
      {viewMode === 'list' && renderFranchisesList()}
      {viewMode === 'franchise' && renderFranchiseDetail()}
      {viewMode === 'store' && renderStoreDetail()}
      {viewMode === 'rider' && renderRiderDetail()}
    </div>
  );
};

export default AdminNetworkDashboard;
