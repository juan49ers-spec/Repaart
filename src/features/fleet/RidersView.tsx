
import React, { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Trash2, LayoutGrid, List as ListIcon, User, Phone, Mail, FileText, TrendingUp, ShieldCheck, MapPin } from 'lucide-react';
import { useFleetStore, Rider } from '../../store/useFleetStore';
import { Table, Column } from '../../components/ui/data-display/Table';
import { Button } from '../../components/ui/primitives/Button';
import { Drawer } from '../../components/ui/overlays/Drawer';
import { RiderForm } from './components/RiderForm';
import { cn } from '../../lib/utils';
import { getRiderInitials, getRiderColor } from '../../utils/colorPalette';

interface RidersViewProps {
    franchiseId?: string;
}

export const RidersView: React.FC<RidersViewProps> = ({ franchiseId }) => {
    const { riders, isLoading, fetchRiders, deleteRider } = useFleetStore();
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
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

    const handleDelete = async (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
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

    // --- LIST COLUMNS ---
    const columns: Column<Rider>[] = [
        {
            header: 'Rider',
            cell: (rider) => (
                <div className="flex items-center gap-3">
                    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm", getRiderColor(rider.id).bg)}>
                        {getRiderInitials(rider.fullName)}
                    </div>
                    <div>
                        <div className="font-bold text-slate-800 dark:text-gray-100">{rider.fullName}</div>
                        <div className="text-[10px] text-slate-500">{rider.email}</div>
                    </div>
                </div>
            )
        },
        {
            header: 'Estado',
            cell: (rider) => {
                const statusStyles: Record<string, string> = {
                    active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
                    inactive: 'bg-slate-100 text-slate-600 border-slate-200',
                    on_route: 'bg-blue-100 text-blue-700 border-blue-200',
                    maintenance: 'bg-amber-100 text-amber-700 border-amber-200',
                    deleted: 'bg-rose-100 text-rose-700 border-rose-200',
                };
                return (
                    <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border", statusStyles[rider.status] || statusStyles.inactive)}>
                        {rider.status.replace('_', ' ')}
                    </span>
                );
            }
        },
        {
            header: 'Contacto',
            cell: (rider) => (
                <div className="flex flex-col text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {rider.phone}</span>
                </div>
            )
        },
        {
            header: 'Eficiencia',
            cell: (rider) => (
                <div className="w-24">
                    <div className="flex justify-between text-[10px] mb-1 font-medium">
                        <span>Score</span>
                        <span className={rider.metrics.efficiency > 90 ? 'text-emerald-600' : 'text-slate-600'}>{rider.metrics.efficiency}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full", rider.metrics.efficiency > 90 ? "bg-emerald-500" : "bg-blue-500")} style={{ width: `${rider.metrics.efficiency}% ` }} />
                    </div>
                </div>
            )
        },
        {
            header: 'Acciones',
            className: 'text-right',
            cell: (rider) => (
                <div className="flex justify-end gap-1">
                    <button onClick={(e) => { e.stopPropagation(); handleEdit(rider); }} className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-indigo-600"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={(e) => handleDelete(rider.id, e)} className="p-1.5 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
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
                        placeholder="Buscar rider..."
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
                    <Button onClick={handleCreate} icon={<Plus className="w-4 h-4" />} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/30">
                        Nuevo Rider
                    </Button>
                </div>
            </div>

            {/* CONTENT */}
            <div className="flex-1 overflow-y-auto min-h-0 pr-1">
                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-pulse">
                        {[1, 2, 3, 4, 5, 6].map(n => <div key={n} className="h-48 bg-slate-200 rounded-xl" />)}
                    </div>
                ) : filteredRiders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                        <User className="w-12 h-12 mb-2 opacity-20" />
                        <p className="font-medium">No se encontraron riders</p>
                    </div>
                ) : viewMode === 'list' ? (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <Table
                            data={filteredRiders}
                            columns={columns}
                            isLoading={false}
                            onRowClick={handleEdit}
                        />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                        {filteredRiders.map(rider => (
                            <div
                                key={rider.id}
                                onClick={() => handleEdit(rider)}
                                className="group relative bg-white hover:bg-indigo-50/30 border border-slate-200 hover:border-indigo-200 rounded-2xl p-4 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer overflow-hidden"
                            >
                                {/* HEADER */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold text-white shadow-md transform group-hover:scale-105 transition-transform", getRiderColor(rider.id).bg)}>
                                            {getRiderInitials(rider.fullName)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 leading-tight group-hover:text-indigo-700 transition-colors">{rider.fullName}</h3>
                                            <span className={cn("inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded mt-1",
                                                rider.status === 'active' ? "bg-emerald-100 text-emerald-700" :
                                                    rider.status === 'on_route' ? "bg-blue-100 text-blue-700" :
                                                        "bg-slate-100 text-slate-500"
                                            )}>
                                                {rider.status === 'active' && <ShieldCheck className="w-3 h-3" />}
                                                {rider.status === 'on_route' && <MapPin className="w-3 h-3" />}
                                                {rider.status.replace('_', ' ')}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* INFO GRID */}
                                <div className="grid grid-cols-2 gap-2 mb-4">
                                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                                        <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                                            <TrendingUp className="w-3 h-3" />
                                            <span className="text-[10px] font-bold uppercase">Ranking</span>
                                        </div>
                                        <span className="text-sm font-bold text-slate-700">Top 15%</span>
                                    </div>
                                    <div className={cn("p-2 rounded-lg border", (rider.contractHours ?? 0) > 30 ? "bg-indigo-50 border-indigo-100" : "bg-slate-50 border-slate-100")}>
                                        <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                                            <FileText className="w-3 h-3" />
                                            <span className="text-[10px] font-bold uppercase">Contrato</span>
                                        </div>
                                        <span className={cn("text-sm font-bold", (rider.contractHours ?? 0) > 30 ? "text-indigo-700" : "text-slate-700")}>{rider.contractHours ?? 0}h</span>
                                    </div>
                                </div>

                                {/* METRICS */}
                                <div className="space-y-2 mb-4">
                                    <div>
                                        <div className="flex justify-between text-[10px] mb-1 font-medium text-slate-500">
                                            <span>Eficiencia Operativa</span>
                                            <span className="text-slate-900">{rider.metrics.efficiency}%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <div className={cn("h-full rounded-full transition-all duration-1000 ease-out", rider.metrics.efficiency >= 90 ? "bg-emerald-500" : "bg-amber-500")} style={{ width: `${rider.metrics.efficiency}% ` }} />
                                        </div>
                                    </div>
                                </div>

                                {/* FOOTER CONTACT */}
                                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-1 hover:text-indigo-600 transition-colors" title={rider.phone}>
                                            <Phone className="w-3.5 h-3.5" />
                                        </div>
                                        <div className="flex items-center gap-1 hover:text-indigo-600 transition-colors" title={rider.email}>
                                            <Mail className="w-3.5 h-3.5" />
                                        </div>
                                    </div>
                                    {rider.franchiseId && <span className="font-mono text-[9px] opacity-50">{rider.franchiseId.substring(0, 4)}...</span>}
                                </div>

                                {/* HOVER ACTIONS */}
                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                                    <button onClick={(e) => { e.stopPropagation(); handleEdit(rider); }} className="p-1.5 bg-white text-slate-400 hover:text-indigo-600 rounded-lg shadow-sm border border-slate-200">
                                        <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button onClick={(e) => handleDelete(rider.id, e)} className="p-1.5 bg-white text-slate-400 hover:text-rose-600 rounded-lg shadow-sm border border-slate-200">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

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
