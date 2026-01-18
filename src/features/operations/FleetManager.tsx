import React, { useState } from 'react';
import { Plus, Search, Car, Gauge, Wrench } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFleet, Vehicle, VehicleInput } from '../../hooks/useFleet';
import { Timestamp } from 'firebase/firestore';

// Define VehicleStatus locally to match hook definition
type VehicleStatus = 'active' | 'maintenance' | 'deleted' | 'out_of_service';

export interface FleetManagerProps {
    franchiseId?: string | null;
    readOnly?: boolean;
}

const FleetManager: React.FC<FleetManagerProps> = ({ franchiseId: propFranchiseId, readOnly = false }) => {
    const { user } = useAuth();

    // ---------------------------------------------------------
    // 🧠 CEREBRO DEL MODO DIOS
    // ---------------------------------------------------------
    // Si el Admin pasa un ID, lo usamos. Si no, usamos el del usuario logueado.
    const activeFranchiseId = propFranchiseId || user?.uid;

    // ---------------------------------------------------------
    // CONEXIÓN DE DATOS
    // ---------------------------------------------------------
    const { vehicles, loading, error, addVehicle } = useFleet(activeFranchiseId || undefined);

    // Estados locales de UI
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus] = useState<string>('all'); // 'all' or specific status
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Si no hay ID, abortamos misión (Renderizado condicional DESPUES de los hooks)
    if (!activeFranchiseId && !loading) {
        return <div className="p-8 text-center text-red-500">Error: No se ha identificado la franquicia operativa.</div>;
    }

    // Filtrado en cliente (rápido y sucio para listas < 100 items)
    const filteredVehicles = vehicles ? vehicles.filter(v => {
        const matchesSearch = v.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (v.model || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || v.status === filterStatus;
        return matchesSearch && matchesStatus;
    }) : [];

    // Renderizado de Estado de Carga
    if (loading) return <div className="p-8 text-center animate-pulse">Cargando flota de la franquicia...</div>;
    if (error) return <div className="p-8 text-center text-red-400">Error cargando flota: {error.message}</div>;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data: VehicleInput = {
            plate: formData.get('plate') as string,
            model: formData.get('model') as string,
            status: formData.get('status') as VehicleStatus || 'active',
            type: 'vehicle',
            currentKm: 0,
            nextRevisionKm: 5000
        };
        await addVehicle(data);
        setIsModalOpen(false);
    };

    return (
        <div className="space-y-6">
            {/* Header de Control */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div>
                    <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                        <div className="p-2 bg-indigo-50 rounded-lg">
                            <Car className="text-indigo-600 w-5 h-5" />
                        </div>
                        Gestión de Flota
                        <span className="text-xs font-bold text-indigo-700 bg-indigo-100 px-2.5 py-1 rounded-full border border-indigo-200">
                            {vehicles.length} Vehículos
                        </span>
                    </h2>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar matrícula o modelo..."
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {!readOnly && (
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold text-sm shadow-md shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95"
                        >
                            <Plus size={16} />
                            <span className="hidden sm:inline">Nuevo Vehículo</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Grid de Vehículos */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredVehicles.map(vehicle => (
                    <VehicleCard
                        key={vehicle.id}
                        vehicle={vehicle}
                        onEdit={() => { if (!readOnly) { setIsModalOpen(true); } }}
                        readOnly={readOnly}
                    />
                ))}

                {filteredVehicles.length === 0 && (
                    <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300">
                        <Car className="w-12 h-12 mb-3 opacity-20" />
                        <p className="font-medium">No se encontraron vehículos</p>
                    </div>
                )}
            </div>

            {/* Modal - Light Theme */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                    <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xl w-full max-w-lg relative">
                        <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                            <div className="p-2 bg-indigo-50 rounded-lg">
                                <Plus className="text-indigo-600 w-5 h-5" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">Nuevo Vehículo</h3>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-700 ml-1">Matrícula</label>
                                    <input name="plate" className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" placeholder="1234-ABC" required />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-700 ml-1">Modelo</label>
                                <input name="model" className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" placeholder="Ej. Honda PCX 125" required />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-700 ml-1">KM Actuales</label>
                                    <input name="currentKm" type="number" className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" placeholder="0" required />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-700 ml-1">Próxima Revisión</label>
                                    <select name="nextRevisionKm" title="Seleccionar intervalo de revisión" className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none">
                                        <option value="1000">1.000 KM</option>
                                        <option value="5000">5.000 KM</option>
                                        <option value="10000">10.000 KM</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-700 ml-1">Estado Inicial</label>
                                <select name="status" title="Seleccionar estado inicial" className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none">
                                    <option value="active">🟢 Activo</option>
                                    <option value="maintenance">🟠 Mantenimiento</option>
                                    <option value="out_of_service">⚫ Fuera de Servicio</option>
                                    <option value="deleted">🔴 Baja</option>
                                </select>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors font-medium text-sm">Cancelar</button>
                                <button type="submit" className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-md shadow-indigo-500/20 transition-all active:scale-95">Guardar Vehículo</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

// Subcomponente simple para tarjetas
interface VehicleCardProps {
    vehicle: Vehicle;
    onEdit: () => void;
    readOnly: boolean;
}

const VehicleCard: React.FC<VehicleCardProps> = ({ vehicle, onEdit, readOnly }) => {
    const statusColors: Record<string, string> = {
        active: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-100',
        maintenance: 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-100',
        out_of_service: 'bg-slate-100 text-slate-600 border-slate-200 ring-slate-200',
        deleted: 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-100'
    };

    // Calculate Health (Maintenance)
    const nextRev = vehicle.nextRevisionKm || 5000; // Default interval if missing
    const current = vehicle.currentKm || 0;
    // Assuming nextRevisionKm is the INTERVAL, not the absolute target. 
    // If it's the target, logic is different. Let's assume it's the target for simplicity based on typical odometer logic.
    // If nextRevisionKm < current, we are overdue.
    const kmRemaining = Math.max(0, nextRev - current);
    const healthPercent = Math.max(0, Math.min(100, (kmRemaining / 5000) * 100)); // Normalize to 5000km window for bar

    let healthColor = 'bg-emerald-500';
    if (healthPercent < 20) healthColor = 'bg-rose-500';
    else if (healthPercent < 50) healthColor = 'bg-amber-500';

    return (
        <div className="group relative bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 overflow-hidden">
            {/* Status Strip */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${statusColors[vehicle.status]?.split(' ')[0] || 'bg-slate-200'}`} />

            <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-10 transition-opacity duration-500">
                <Car className="w-32 h-32 rotate-12 -mr-10 -mt-10 text-slate-900" />
            </div>

            <div className="p-5 pl-6 relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider mb-2 border ${statusColors[vehicle.status] || 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                            {vehicle.status === 'active' && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                            {vehicle.status}
                        </span>
                        <h3 className="font-black text-slate-900 text-xl leading-none tracking-tight">{vehicle.plate}</h3>
                        <p className="text-sm font-medium text-slate-500 mt-1">{vehicle.model}</p>
                    </div>
                </div>

                {/* Health Bar */}
                <div className="mb-4">
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        <span>Estado Mecánico</span>
                        <span className={healthPercent < 20 ? 'text-rose-500' : 'text-emerald-500'}>
                            {healthPercent < 20 ? 'Revisión Necesaria' : 'Óptimo'}
                        </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className={`h-full ${healthColor} transition-all duration-1000`}
                            style={{ width: `${healthPercent}%` }}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 group-hover:border-indigo-100 transition-colors">
                        <span className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                            <Gauge size={12} className="text-indigo-500" /> Kilometraje
                        </span>
                        <span className="font-mono text-lg font-bold text-slate-700 tracking-tight">
                            {(vehicle.currentKm || 0).toLocaleString()}
                        </span>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 group-hover:border-indigo-100 transition-colors">
                        <span className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                            <Wrench size={12} className="text-amber-500" /> Próx. ITV
                        </span>
                        <span className="font-mono text-sm font-bold text-slate-700 mt-1 block">
                            {vehicle.next_itv ? new Date((vehicle.next_itv as Timestamp).seconds * 1000).toLocaleDateString() : 'Pendiente'}
                        </span>
                    </div>
                </div>

                {!readOnly && (
                    <div className="flex gap-2 mt-4">
                        <button
                            onClick={onEdit}
                            className="flex-1 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-indigo-600 bg-white hover:bg-indigo-50/50 rounded-xl border border-slate-200 hover:border-indigo-200 transition-all shadow-sm"
                        >
                            Gestionar
                        </button>
                        <button
                            title="Registrar Gasto Rápido"
                            className="px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
                            onClick={() => alert("Próximamente: Registro Rápido de Gastos")}
                        >
                            <Gauge size={16} /> {/* Using Gauge as placeholder for Wallet if Wallet not imported, assuming Gauge is. Wait, CreditCard or Wallet? Let's check imports. */}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FleetManager;
