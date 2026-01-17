import React, { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Trash2, Bike, LayoutGrid, List as ListIcon, AlertTriangle, CheckCircle, Wrench, Gauge } from 'lucide-react';
import { useVehicleStore } from '../../../store/useVehicleStore';
import { Vehicle } from './schemas/VehicleSchema';
import { Table, Column } from '../../../ui/data-display/Table';
import { Button } from '../../../ui/primitives/Button';
import { Drawer } from '../../../ui/overlays/Drawer';
import { VehicleForm } from './components/VehicleForm';
import { useAuth } from '../../../context/AuthContext';
import { cn } from '../../../lib/utils';

export const VehiclesView: React.FC = () => {
    const { vehicles, isLoading, fetchVehicles, deleteVehicle } = useVehicleStore();
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
    const [search, setSearch] = useState('');

    const { user, impersonatedFranchiseId } = useAuth();
    // Use impersonatedFranchiseId when admin is viewing a franchise
    const franchiseId = impersonatedFranchiseId || user?.franchiseId || user?.uid || '';

    useEffect(() => {
        if (franchiseId) {
            fetchVehicles(franchiseId);
        }
    }, [fetchVehicles, franchiseId]);

    const handleCreate = () => {
        setSelectedVehicle(null);
        setIsDrawerOpen(true);
    };

    const handleEdit = (vehicle: Vehicle) => {
        setSelectedVehicle(vehicle);
        setIsDrawerOpen(true);
    };

    const handleDelete = async (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (confirm('¿Estás seguro de eliminar este vehículo?')) {
            await deleteVehicle(id);
        }
    };

    const handleCloseDrawer = () => {
        setIsDrawerOpen(false);
        setSelectedVehicle(null);
    };

    const filteredVehicles = vehicles.filter(v =>
        v.matricula.toLowerCase().includes(search.toLowerCase()) ||
        v.modelo.toLowerCase().includes(search.toLowerCase())
    );

    // --- LIST COLUMNS ---
    const columns: Column<Vehicle>[] = [
        {
            header: 'Vehículo',
            cell: (v) => (
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-indigo-600">
                        <Bike className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="font-bold text-slate-900 dark:text-white">{v.matricula}</div>
                        <div className="text-[10px] text-slate-500 uppercase">{v.modelo}</div>
                    </div>
                </div>
            )
        },
        {
            header: 'Estado',
            cell: (v) => {
                const statusStyles: Record<string, string> = {
                    activo: 'bg-emerald-100 text-emerald-700 border-emerald-200',
                    mantenimiento: 'bg-amber-100 text-amber-700 border-amber-200',
                    baja: 'bg-rose-100 text-rose-700 border-rose-200',
                };
                return (
                    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border", statusStyles[v.estado] || 'bg-slate-100 text-slate-700')}>
                        {v.estado.charAt(0).toUpperCase() + v.estado.slice(1)}
                    </span>
                );
            }
        },
        {
            header: 'Salud',
            cell: (v) => {
                const limit = v.proxima_revision_km || 5000;
                const current = v.km_actuales;
                const percentage = Math.min(100, Math.max(0, (current / limit) * 100));
                return (
                    <div className="w-24">
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className={cn("h-full rounded-full transition-all duration-500", percentage > 90 ? "bg-rose-500" : percentage > 70 ? "bg-amber-400" : "bg-emerald-500")} style={{ width: `${percentage}%` }} />
                        </div>
                    </div>
                );
            }
        },
        {
            header: 'Acciones',
            className: 'text-right',
            cell: (v) => (
                <div className="flex justify-end gap-1">
                    <button onClick={(e) => { e.stopPropagation(); handleEdit(v); }} className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-indigo-600"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={(e) => handleDelete(v.id!, e)} className="p-1.5 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6 h-full flex flex-col">
            {/* TOOLBAR */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm shrink-0">
                <div className="relative w-full sm:w-72 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Buscar matrícula..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all placeholder:text-slate-400"
                    />
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                    <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={cn("p-1.5 rounded-md transition-all", viewMode === 'grid' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600")}
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={cn("p-1.5 rounded-md transition-all", viewMode === 'list' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600")}
                        >
                            <ListIcon className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="h-6 w-px bg-slate-200 mx-1" />
                    <Button onClick={handleCreate} icon={<Plus className="w-4 h-4" />} className="bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-500/30">
                        Nueva Moto
                    </Button>
                </div>
            </div>

            {/* CONTENT */}
            <div className="flex-1 overflow-y-auto min-h-0 pr-1">
                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
                        {[1, 2, 3].map(n => <div key={n} className="h-40 bg-slate-200 rounded-xl" />)}
                    </div>
                ) : filteredVehicles.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                        <Bike className="w-12 h-12 mb-2 opacity-20" />
                        <p className="font-medium">No se encontraron vehículos</p>
                    </div>
                ) : viewMode === 'list' ? (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <Table
                            data={filteredVehicles}
                            columns={columns}
                            isLoading={false}
                            onRowClick={handleEdit}
                        />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                        {filteredVehicles.map(vehicle => {
                            const limit = vehicle.proxima_revision_km || 5000;
                            const current = vehicle.km_actuales;
                            const healthPct = Math.min(100, Math.max(0, (current / limit) * 100));
                            const isCritical = healthPct >= 100;

                            return (
                                <div
                                    key={vehicle.id}
                                    onClick={() => handleEdit(vehicle)}
                                    className="group relative bg-white hover:bg-indigo-50/30 border border-slate-200 hover:border-indigo-200 rounded-2xl p-4 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer overflow-hidden"
                                >
                                    {/* HEADER */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                                <Bike className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900 leading-tight text-lg">{vehicle.matricula}</h3>
                                                <div className="text-[10px] uppercase font-bold text-slate-400">{vehicle.modelo}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* STATUS BADGE */}
                                    <div className="mb-4">
                                        <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold w-full",
                                            vehicle.estado === 'active' ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                                                vehicle.estado === 'maintenance' ? "bg-amber-50 text-amber-700 border border-amber-100" :
                                                    "bg-rose-50 text-rose-700 border border-rose-100"
                                        )}>
                                            {vehicle.estado === 'active' && <CheckCircle className="w-3.5 h-3.5" />}
                                            {vehicle.estado === 'maintenance' && <Wrench className="w-3.5 h-3.5" />}
                                            {vehicle.estado === 'out_of_service' && <AlertTriangle className="w-3.5 h-3.5" />}
                                            <span className="capitalize flex-1">{vehicle.estado === 'out_of_service' ? 'baja' : vehicle.estado === 'maintenance' ? 'taller' : 'activo'}</span>
                                        </div>
                                    </div>

                                    {/* METRICS */}
                                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-1.5 text-slate-500">
                                                <Gauge className="w-3.5 h-3.5" />
                                                <span className="text-[10px] font-bold uppercase">Odómetro</span>
                                            </div>
                                            <span className="text-sm font-mono font-bold text-slate-700">{current.toLocaleString()} km</span>
                                        </div>

                                        <div className="space-y-1">
                                            <div className="flex justify-between text-[10px]">
                                                <span className="text-slate-400">Próx. Revisión</span>
                                                <span className={isCritical ? "text-rose-600 font-bold" : "text-slate-600"}>{limit.toLocaleString()} km</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-white rounded-full overflow-hidden border border-slate-100">
                                                <div
                                                    className={cn("h-full rounded-full transition-all", isCritical ? "bg-rose-500 animate-pulse" : healthPct > 80 ? "bg-amber-400" : "bg-emerald-500")}
                                                    style={{ width: `${healthPct}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* FOOTER */}
                                    <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                                        <span>Flota Propia</span>
                                    </div>

                                    {/* HOVER ACTIONS */}
                                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                                        <button onClick={(e) => { e.stopPropagation(); handleEdit(vehicle); }} className="p-1.5 bg-white text-slate-400 hover:text-indigo-600 rounded-lg shadow-sm border border-slate-200">
                                            <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                        <button onClick={(e) => handleDelete(vehicle.id!, e)} className="p-1.5 bg-white text-slate-400 hover:text-rose-600 rounded-lg shadow-sm border border-slate-200">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <Drawer
                isOpen={isDrawerOpen}
                onClose={handleCloseDrawer}
                title={selectedVehicle ? 'Editar Vehículo' : 'Nuevo Vehículo'}
                description={selectedVehicle ? 'Modifica los datos del vehículo' : 'Registra una nueva moto en la flota'}
            >
                <VehicleForm
                    onSuccess={handleCloseDrawer}
                    onCancel={handleCloseDrawer}
                    initialData={selectedVehicle ? { ...selectedVehicle, id: selectedVehicle.id! } : undefined}
                    franchiseId={franchiseId}
                />
            </Drawer>
        </div>
    );
};
