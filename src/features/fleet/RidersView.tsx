import React, { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
import { useFleetStore, Rider } from '../../store/useFleetStore';
import { Table, Column } from '../../ui/data-display/Table';
import { Button } from '../../ui/primitives/Button';
import { Drawer } from '../../ui/overlays/Drawer';
import { RiderForm } from './components/RiderForm';
import { Card } from '../../ui/primitives/Card';

interface RidersViewProps {
    franchiseId?: string;
}

export const RidersView: React.FC<RidersViewProps> = ({ franchiseId }) => {
    const { riders, isLoading, fetchRiders, deleteRider } = useFleetStore();
    // ...

    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [selectedRider, setSelectedRider] = useState<Rider | null>(null);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchRiders(franchiseId);
    }, [fetchRiders, franchiseId]);

    const handleCreate = () => {
        setSelectedRider(null);
        setIsDrawerOpen(true);
    };

    const handleEdit = (rider: Rider) => {
        setSelectedRider(rider);
        setIsDrawerOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm('¿Estás seguro de eliminar este rider?')) {
            await deleteRider(id);
        }
    };

    const handleCloseDrawer = () => {
        setIsDrawerOpen(false);
        setSelectedRider(null);
    };

    const filteredRiders = riders.filter(r =>
        r.fullName.toLowerCase().includes(search.toLowerCase()) ||
        r.email.toLowerCase().includes(search.toLowerCase())
    );

    const columns: Column<Rider>[] = [
        {
            header: 'Rider',
            cell: (rider) => (
                <div>
                    <div className="font-medium text-slate-900 dark:text-white">{rider.fullName}</div>
                    <div className="text-xs text-slate-500">{rider.email}</div>
                </div>
            )
        },
        {
            header: 'Estado',
            cell: (rider) => {
                const statusColors: Record<string, string> = {
                    active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                    inactive: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
                    on_route: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                    maintenance: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
                    deleted: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                };
                const labels: Record<string, string> = {
                    active: 'Activo',
                    inactive: 'Inactivo',
                    on_route: 'En Ruta',
                    maintenance: 'Mantenimiento',
                    deleted: 'Eliminado'
                };
                return (
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[rider.status] || statusColors.inactive}`}>
                        {labels[rider.status] || rider.status}
                    </span>
                );
            }
        },
        {
            header: 'Teléfono',
            accessorKey: 'phone',
            className: 'text-slate-500'
        },
        {
            header: 'Eficiencia',
            cell: (rider) => (
                <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${rider.metrics.efficiency}%` }}
                        />
                    </div>
                    <span className="text-xs font-medium">{rider.metrics.efficiency}%</span>
                </div>
            )
        },
        {
            header: 'Franchise ID',
            cell: (rider) => (
                <div className="text-xs text-red-600 font-mono">
                    {rider.franchiseId || 'MISSING'}
                </div>
            )
        },
        {
            header: 'Acciones',
            className: 'text-right',
            cell: (rider) => (
                <div className="flex justify-end gap-2">
                    <button
                        onClick={(e) => { e.stopPropagation(); handleEdit(rider); }}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-blue-500 transition-colors"
                    >
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(rider.id); }}
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
            {/* Header / KPI Area could go here */}

            <Card className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                    />
                </div>
                <Button onClick={handleCreate} icon={<Plus className="w-4 h-4" />}>
                    Nuevo Rider
                </Button>
            </Card>

            <Table
                data={filteredRiders}
                columns={columns}
                isLoading={isLoading}
                onRowClick={handleEdit}
                emptyMessage={search ? "No se encontraron riders con esa búsqueda" : "No hay riders registrados"}
            />

            <Drawer
                isOpen={isDrawerOpen}
                onClose={handleCloseDrawer}
                title={selectedRider ? 'Editar Rider' : 'Nuevo Rider'}
                description={selectedRider ? 'Modifica los datos del rider seleccionado' : 'Registra un nuevo miembro en la flota'}
            >
                <RiderForm
                    franchiseId={franchiseId}
                    onSuccess={handleCloseDrawer}
                    onCancel={handleCloseDrawer}
                    initialData={selectedRider ? {
                        ...selectedRider,
                        contractHours: selectedRider.contractHours || 40
                    } as any : undefined}
                />
            </Drawer>
        </div>
    );
};

export default RidersView;
