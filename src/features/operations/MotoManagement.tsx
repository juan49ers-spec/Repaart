import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
    Plus, Edit2, Trash2, Search, Truck,
    Wrench, CheckCircle, Shield, FileText, X
} from 'lucide-react';
import { FleetService } from '../../services/fleetService';
import { Moto, CreateMotoInput } from '../../schemas/fleet';
import { toFranchiseId } from '../../schemas/scheduler';

interface MotoFormData extends CreateMotoInput { }

interface MotoManagementProps {
    franchiseId: string;
    readOnly?: boolean;
}

const MotoManagement: React.FC<MotoManagementProps> = ({ franchiseId, readOnly = false }) => {
    const [motos, setMotos] = useState<Moto[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMoto, setEditingMoto] = useState<Moto | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const { register, handleSubmit, reset, formState: { errors } } = useForm<MotoFormData>();

    const loadMotos = React.useCallback(() => {
        if (!franchiseId) return;
        setLoading(true);
        // Using Realtime subscription from FleetService
        return FleetService.subscribeToMotos(toFranchiseId(franchiseId), (data) => {
            setMotos(data);
            setLoading(false);
        });
    }, [franchiseId]);

    useEffect(() => {
        const unsubscribe = loadMotos();
        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [loadMotos]);

    const onSubmit = async (data: MotoFormData) => {
        if (!franchiseId) {
            alert("Error: No hay ID de franquicia asignado. Recarga la página.");
            return;
        }
        try {
            const payload = {
                ...data,
                nextRevisionKm: Number(data.nextRevisionKm),
                currentKm: Number(data.currentKm),
                // franchiseId is injected by Service for creates, optional for updates
            };

            if (editingMoto) {
                await FleetService.updateMoto(editingMoto.id, payload);
            } else {
                await FleetService.createMoto(toFranchiseId(franchiseId), {
                    ...payload,
                    status: 'active'
                });
            }
            setIsModalOpen(false);
            reset();
            setEditingMoto(null);
            // Auto-refresh via subscription

        } catch (error: any) {
            console.error("Error saving moto:", error);
            alert("Error al guardar: " + error.message);
        }
    };

    const handleEdit = (moto: Moto) => {
        setEditingMoto(moto);
        reset({
            plate: moto.plate,
            brand: moto.brand,
            model: moto.model,
            vin: moto.vin || '',
            currentKm: moto.currentKm,
            nextRevisionKm: moto.nextRevisionKm,
            status: moto.status,
            insuranceExpiry: moto.insuranceExpiry || ''
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de desactivar esta moto?')) return;
        try {
            await FleetService.updateMoto(id, { status: 'deleted' });
        } catch (error) {
            console.error("Error deleting moto:", error);
        }
    };

    // Quick Action: Toggle Repair/Active
    const toggleStatus = async (moto: Moto, e: React.MouseEvent) => {
        e.stopPropagation();
        const newStatus: Moto['status'] = moto.status === 'maintenance' ? 'active' : 'maintenance';
        try {
            await FleetService.updateMoto(moto.id, { status: newStatus });
        } catch (error) {
            console.error("Error toggling status", error);
        }
    };

    const filteredMotos = motos.filter(m =>
        m.plate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.vin?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusConfig = (status: Moto['status']) => {
        switch (status) {
            case 'active': return {
                icon: CheckCircle,
                text: 'OPERATIVA',
                classes: 'bg-emerald-50 text-emerald-700 border-emerald-200'
            };
            case 'maintenance': return {
                icon: Wrench,
                text: 'EN TALLER',
                classes: 'bg-amber-50 text-amber-700 border-amber-200'
            };
            case 'deleted': return {
                icon: Trash2,
                text: 'ELIMINADA',
                classes: 'bg-slate-100 text-slate-500 border-slate-200'
            };
            default: return {
                icon: Truck,
                text: 'DESCONOCIDO',
                classes: 'bg-slate-100 text-slate-500 border-slate-200'
            };
        }
    };

    const getMaintenanceColor = (current: number, max: number) => {
        const percentage = (current / max) * 100;
        if (percentage > 90) return 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]';
        if (percentage > 75) return 'bg-amber-500';
        return 'bg-emerald-500';
    };

    return (
        <div className="space-y-6 animate-fade-in h-full flex flex-col font-sans">
            {/* --- HEADER --- */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 p-1">
                <div className="relative w-full md:w-72 group">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Buscar por matrícula, modelo o VIN..."
                        className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {!readOnly && (
                    <button
                        onClick={() => {
                            setEditingMoto(null);
                            reset({
                                plate: '', brand: '', model: '', vin: '',
                                currentKm: 0, nextRevisionKm: 5000, status: 'active'
                            });
                            setIsModalOpen(true);
                        }}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98]"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Nueva Moto</span>
                    </button>
                )}
            </div>

            {/* --- GRID DE ACTIVOS --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 pb-20">
                {loading ? (
                    [1, 2, 3].map(i => <div key={i} className="h-64 bg-slate-50 rounded-2xl animate-pulse border border-slate-200" />)
                ) : filteredMotos.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-400 opacity-80">
                        <Truck className="w-16 h-16 mb-4 text-slate-300" />
                        <p>No se encontraron motos en la flota.</p>
                    </div>
                ) : (
                    filteredMotos.map(moto => {
                        const statusConfig = getStatusConfig(moto.status);
                        const StatusIcon = statusConfig.icon;
                        const maintenancePct = Math.min((moto.currentKm / moto.nextRevisionKm) * 100, 100);

                        return (
                            <div key={moto.id} className="group bg-white border border-slate-200 hover:border-blue-300 rounded-2xl overflow-hidden transition-all hover:shadow-xl hover:shadow-slate-200/50 flex flex-col">
                                {/* Card Header */}
                                <div className="p-5 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-bold text-slate-800 text-xl font-mono tracking-wider">
                                                {moto.plate}
                                            </h3>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wide flex items-center gap-1.5 ${statusConfig.classes}`}>
                                                <StatusIcon className="w-3 h-3" />
                                                {statusConfig.text}
                                            </span>
                                        </div>
                                        <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">
                                            {moto.brand} <span className="text-slate-300">|</span> {moto.model}
                                        </p>
                                    </div>

                                    {!readOnly && (
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleEdit(moto)} aria-label="Editar moto" className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-blue-600 transition-colors">
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Card Body */}
                                <div className="p-5 flex-1 space-y-4">
                                    {/* Mantenimiento */}
                                    <div>
                                        <div className="flex justify-between text-xs mb-2">
                                            <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                                                <Wrench className="w-3.5 h-3.5 text-slate-400" />
                                                Estado de Revisión
                                            </span>
                                            <span className="text-slate-700 font-mono font-bold">
                                                {moto.currentKm.toLocaleString()} <span className="text-slate-300">/</span> {moto.nextRevisionKm.toLocaleString()} km
                                            </span>
                                        </div>
                                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                                            <div
                                                className={`h-full rounded-full transition-all duration-500 ${getMaintenanceColor(moto.currentKm, moto.nextRevisionKm)}`}
                                                style={{ width: `${maintenancePct}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Detalles Técnicos */}
                                    <div className="grid grid-cols-2 gap-3 pt-2">
                                        <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                                            <p className="text-[10px] text-slate-400 uppercase font-bold mb-1 flex items-center gap-1">
                                                <FileText className="w-3 h-3" /> VIN
                                            </p>
                                            <p className="text-xs text-slate-600 font-mono truncate font-medium" title={moto.vin || 'N/A'}>
                                                {moto.vin || '---'}
                                            </p>
                                        </div>
                                        <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                                            <p className="text-[10px] text-slate-400 uppercase font-bold mb-1 flex items-center gap-1">
                                                <Shield className="w-3 h-3" /> Seguro
                                            </p>
                                            <p className={`text-xs font-mono font-medium ${moto.insuranceExpiry && new Date(moto.insuranceExpiry) < new Date() ? 'text-red-500' : 'text-slate-600'
                                                }`}>
                                                {moto.insuranceExpiry ? new Date(moto.insuranceExpiry).toLocaleDateString() : '---'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Actions Footer */}
                                {!readOnly && (
                                    <div className="p-3 bg-slate-50 border-t border-slate-100 flex gap-2">
                                        {(moto.status === 'maintenance' || moto.status === 'deleted') ? (
                                            <button
                                                onClick={(e) => toggleStatus(moto, e)}
                                                className="flex-1 py-2 rounded-lg bg-white hover:bg-emerald-50 text-emerald-600 border border-slate-200 hover:border-emerald-200 text-xs font-bold uppercase tracking-wide transition-all flex items-center justify-center gap-2 shadow-sm"
                                            >
                                                <CheckCircle className="w-3.5 h-3.5" /> Marcar Operativa
                                            </button>
                                        ) : (
                                            <button
                                                onClick={(e) => toggleStatus(moto, e)}
                                                className="flex-1 py-2 rounded-lg bg-white hover:bg-amber-50 text-slate-500 hover:text-amber-600 border border-slate-200 hover:border-amber-200 text-xs font-bold uppercase tracking-wide transition-all flex items-center justify-center gap-2 shadow-sm"
                                            >
                                                <Wrench className="w-3.5 h-3.5" /> Enviar a Taller
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* --- MODAL "EXECUTIVE" --- */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-slate-100 bg-slate-50/80 rounded-t-2xl flex justify-between items-center cursor-move">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                    {editingMoto ? <Edit2 className="w-5 h-5 text-blue-600" /> : <Plus className="w-5 h-5 text-blue-600" />}
                                    {editingMoto ? 'Editar Activo' : 'Registrar Nueva Moto'}
                                </h2>
                                <p className="text-sm text-slate-500 mt-1">Completa la ficha técnica del vehículo.</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} aria-label="Cerrar modal" className="text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-100 rounded-lg">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 space-y-6">

                            {/* Sección Identificación */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-2 border-b border-blue-100 pb-2">
                                    <Truck className="w-4 h-4" /> Identificación
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700">Matrícula</label>
                                        <input
                                            {...register('plate', { required: 'Requerido' })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono uppercase transition-all shadow-sm"
                                            placeholder="0000 XXX"
                                        />
                                        {errors.plate && <span className="text-red-500 text-xs font-semibold">{errors.plate.message}</span>}
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700">VIN (Bastidor)</label>
                                        <input
                                            {...register('vin')}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono uppercase transition-all shadow-sm"
                                            placeholder="XXXXXXXXXXXXXXXXX"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700">Marca</label>
                                        <input
                                            {...register('brand', { required: 'Requerido' })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                                            placeholder="Honda..."
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700">Modelo</label>
                                        <input
                                            {...register('model', { required: 'Requerido' })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                                            placeholder="PCX 125..."
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Sección Estado & Seguro */}
                            <div className="space-y-4 pt-2">
                                <h3 className="text-xs font-bold text-amber-600 uppercase tracking-wider flex items-center gap-2 border-b border-amber-100 pb-2">
                                    <Wrench className="w-4 h-4" /> Mantenimiento & Legal
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700">Km Actuales</label>
                                        <input
                                            {...register('currentKm', { required: true, min: 0 })}
                                            type="number"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-slate-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-mono transition-all shadow-sm"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700">Próxima Revisión</label>
                                        <input
                                            {...register('nextRevisionKm', { required: true, min: 0 })}
                                            type="number"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-slate-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-mono transition-all shadow-sm"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700">Vencimiento Seguro</label>
                                        <input
                                            {...register('insuranceExpiry')}
                                            type="date"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700">Estado Actual</label>
                                        <select
                                            {...register('status')}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                                        >
                                            <option value="active">Operativa</option>
                                            <option value="maintenance">Revisión Pendiente / Taller</option>
                                            <option value="deleted">Desactivada</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Footer Buttons */}
                            <div className="flex gap-3 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-4 py-3 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-xl font-medium transition-colors shadow-sm"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98]"
                                >
                                    {editingMoto ? 'Guardar Cambios' : 'Registrar Moto'}
                                </button>
                            </div>

                            {editingMoto && (
                                <div className="pt-2 flex justify-center">
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(editingMoto.id)}
                                        className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity font-medium"
                                    >
                                        <Trash2 className="w-3 h-3" /> Desactivar permanentemente este activo
                                    </button>
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MotoManagement;
