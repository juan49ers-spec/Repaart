import React, { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Trash2, Bike } from 'lucide-react';
import { useVehicleStore } from '../../../store/useVehicleStore';
import { Vehicle } from './schemas/VehicleSchema';
import { Table, Column } from '../../../ui/data-display/Table';
import { Button } from '../../../ui/primitives/Button';
import { Drawer } from '../../../ui/overlays/Drawer';
import { Card } from '../../../ui/primitives/Card';
import { VehicleForm } from './components/VehicleForm';
import { useAuth } from '../../../context/AuthContext'; // Assuming we have an auth hook to get franchiseId

export const VehiclesView: React.FC = () => {
    const { vehicles, isLoading, fetchVehicles, deleteVehicle } = useVehicleStore();
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
    const [search, setSearch] = useState('');

    // Auth context to get Franchise ID
    // If useAuth doesn't exist or doesn't provide it easily, we might fallback to localStorage or prop
    // Based on previous code in FleetManager, it used useAuth().user?.franchiseId
    const { user } = useAuth();
    const franchiseId = user?.franchiseId || user?.uid || ''; // Fallback

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

    const handleDelete = async (id: string) => {
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

    const columns: Column<Vehicle>[] = [
        {
            header: 'Vehículo',
            cell: (v) => (
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        <Bike className="w-5 h-5 text-slate-500" />
                    </div>
                    <div>
                        <div className="font-medium text-slate-900 dark:text-white">{v.matricula}</div>
                        <div className="text-xs text-slate-500">{v.modelo}</div>
                    </div>
                </div>
            )
        },
        {
            header: 'Estado',
            cell: (v) => {
                const statusColors: Record<string, string> = {
                    activo: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                    mantenimiento: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
                    baja: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                };
                return (
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[v.estado] || 'bg-slate-100 text-slate-700'}`}>
                        {v.estado.charAt(0).toUpperCase() + v.estado.slice(1)}
                    </span>
                );
            }
        },
        {
            header: 'Estado de Salud (KM)',
            accessorKey: 'km_actuales',
            cell: (v) => {
                const limit = v.proxima_revision_km || 5000;
                const current = v.km_actuales;
                const diff = limit - current;

                let statusColor = 'bg-green-500';
                let textColor = 'text-green-600 dark:text-green-400';
                let message = 'Saludable';

                if (current >= limit) {
                    statusColor = 'bg-red-500';
                    textColor = 'text-red-600 dark:text-red-400';
                    message = 'Revisión Vencida';
                } else if (diff <= 500) {
                    statusColor = 'bg-yellow-500';
                    textColor = 'text-yellow-600 dark:text-yellow-400';
                    message = 'Revisión Próxima';
                }

                const percentage = Math.min(100, Math.max(0, (current / limit) * 100));

                return (
                    <div className="w-full max-w-[140px]">
                        <div className="flex justify-between text-xs mb-1">
                            <span className="font-mono">{current.toLocaleString()}</span>
                            <span className={`font-medium ${textColor}`}>{message}</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full ${statusColor} transition-all duration-500`}
                                style={{ width: `${percentage}%` }}
                            />
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 text-right">
                            Meta: {limit.toLocaleString()}
                        </div>
                    </div>
                );
            }
        },
        {
            header: 'Próx. Revisión',
            accessorKey: 'proxima_revision_km',
            cell: (v) => <span className="text-slate-500">{(v.proxima_revision_km || 0).toLocaleString()} km</span>
        },
        {
            header: 'Acciones',
            className: 'text-right',
            cell: (v) => (
                <div className="flex justify-end gap-2">
                    <button
                        onClick={(e) => { e.stopPropagation(); handleEdit(v); }}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-blue-500 transition-colors"
                    >
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(v.id!); }}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <Card className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar matrícula o modelo..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                    />
                </div>
                <Button onClick={handleCreate} icon={<Plus className="w-4 h-4" />}>
                    Nuevo Vehículo
                </Button>
            </Card>

            <Table
                data={filteredVehicles}
                columns={columns}
                isLoading={isLoading}
                onRowClick={handleEdit}
                emptyMessage={search ? "No se encontraron vehículos" : "No hay vehículos registrados"}
            />

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
