
import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useInvoicing } from '../../../hooks/useInvoicing';
import { X, Save, Building, MapPin } from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const CreateRestaurantModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
    const { user } = useAuth();
    const { createRestaurant } = useInvoicing();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        fiscalName: '',
        cif: '',
        address: {
            street: '',
            city: '',
            zipCode: '',
            province: '',
            country: 'ES'
        }
    });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (!user?.franchiseId && user?.role !== 'admin') {
                throw new Error('No tienes permiso o franquicia asignada');
            }

            await createRestaurant({
                franchiseId: user.franchiseId || user.uid,
                fiscalName: formData.fiscalName,
                cif: formData.cif,
                address: formData.address,
                status: 'active'
            });

            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Error al crear restaurante');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Building className="w-5 h-5 text-blue-600" />
                        Nuevo Restaurante
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full"
                        aria-label="Cerrar modal"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Razón Social</label>
                            <input
                                required
                                type="text"
                                aria-label="Razón Social"
                                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Ej: Restaurante Pepe S.L."
                                value={formData.fiscalName}
                                onChange={e => setFormData({ ...formData, fiscalName: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">CIF / NIF</label>
                            <input
                                required
                                type="text"
                                aria-label="CIF o NIF"
                                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="B-12345678"
                                value={formData.cif}
                                onChange={e => setFormData({ ...formData, cif: e.target.value })}
                            />
                        </div>

                        <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                            <span className="text-xs font-bold uppercase text-slate-400 mb-2 block flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> Dirección Fiscal
                            </span>
                            <div className="space-y-3">
                                <input
                                    required
                                    type="text"
                                    aria-label="Calle, Número, Piso"
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 outline-none block"
                                    placeholder="Calle, Número, Piso"
                                    value={formData.address.street}
                                    onChange={e => setFormData({ ...formData, address: { ...formData.address, street: e.target.value } })}
                                />
                                <div className="grid grid-cols-2 gap-3">
                                    <input
                                        required
                                        type="text"
                                        aria-label="Ciudad"
                                        className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="Ciudad"
                                        value={formData.address.city}
                                        onChange={e => setFormData({ ...formData, address: { ...formData.address, city: e.target.value } })}
                                    />
                                    <input
                                        required
                                        type="text"
                                        aria-label="Código Postal"
                                        className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="C.P."
                                        value={formData.address.zipCode}
                                        onChange={e => setFormData({ ...formData, address: { ...formData.address, zipCode: e.target.value } })}
                                    />
                                </div>
                                <input
                                    required
                                    type="text"
                                    aria-label="Provincia"
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Provincia"
                                    value={formData.address.province}
                                    onChange={e => setFormData({ ...formData, address: { ...formData.address, province: e.target.value } })}
                                />
                            </div>
                        </div>
                    </div>

                    {error && <p className="text-red-500 text-sm bg-red-50 p-2 rounded">{error}</p>}

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 rounded-lg font-medium"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2 shadow-lg shadow-blue-500/20"
                        >
                            {loading ? 'Guardando...' : <><Save className="w-4 h-4" /> Guardar Restaurante</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
