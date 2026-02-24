
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useInvoicing } from '../../../hooks/useInvoicing';
import { X, Save, Building, MapPin, Mail, Phone, AlertCircle, CheckCircle } from 'lucide-react';
import { message } from 'antd';
import { validateSpanishFiscalId, formatFiscalId } from '../../../utils/spanishFiscalValidation';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    restaurant?: any;
    franchiseId?: string;
}

export const CreateRestaurantModal: React.FC<Props> = ({ isOpen, onClose, onSuccess, restaurant, franchiseId: propFranchiseId }) => {
    const { user } = useAuth();
    const { createRestaurant, updateRestaurant } = useInvoicing();
    
    const franchiseId = propFranchiseId || user?.franchiseId || user?.uid;

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [cifValidation, setCifValidation] = useState<{ isValid: boolean; message: string } | null>(null);

    const [formData, setFormData] = useState({
        fiscalName: '',
        cif: '',
        email: '',
        phone: '',
        address: {
            street: '',
            city: '',
            zipCode: '',
            province: '',
            country: 'ES'
        },
        notes: ''
    });

    useEffect(() => {
        if (restaurant) {
            setFormData({
                fiscalName: restaurant.fiscalName || '',
                cif: restaurant.cif || '',
                email: restaurant.email || '',
                phone: restaurant.phone || '',
                address: {
                    street: restaurant.address?.street || '',
                    city: restaurant.address?.city || '',
                    zipCode: restaurant.address?.zipCode || '',
                    province: restaurant.address?.province || '',
                    country: restaurant.address?.country || 'ES'
                },
                notes: restaurant.notes || ''
            });
            if (restaurant.cif) {
                const result = validateSpanishFiscalId(restaurant.cif);
                setCifValidation({ isValid: result.isValid, message: result.error || 'Formato válido' });
            }
        } else {
            setFormData({
                fiscalName: '',
                cif: '',
                email: '',
                phone: '',
                address: {
                    street: '',
                    city: '',
                    zipCode: '',
                    province: '',
                    country: 'ES'
                },
                notes: ''
            });
            setCifValidation(null);
        }
    }, [restaurant, isOpen]);

    if (!isOpen) return null;

    const isEditing = !!restaurant;

    const handleCifChange = (value: string) => {
        const upperValue = value.toUpperCase();
        setFormData({ ...formData, cif: upperValue });
        
        if (upperValue.length >= 8) {
            const result = validateSpanishFiscalId(upperValue);
            setCifValidation({ isValid: result.isValid, message: result.error || `${result.type} válido` });
        } else {
            setCifValidation(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (!franchiseId && user?.role !== 'admin') {
                throw new Error('No tienes permiso o franquicia asignada');
            }

            const cifResult = validateSpanishFiscalId(formData.cif);
            if (!cifResult.isValid) {
                throw new Error(cifResult.error || 'CIF/NIF inválido');
            }

            const payload = {
                fiscalName: formData.fiscalName.trim(),
                cif: cifResult.normalizedValue,
                email: formData.email.trim() || undefined,
                phone: formData.phone.trim() || undefined,
                notes: formData.notes.trim() || undefined,
                address: {
                    street: formData.address.street.trim(),
                    city: formData.address.city.trim(),
                    zipCode: formData.address.zipCode.trim(),
                    province: formData.address.province.trim(),
                    country: formData.address.country
                },
                franchiseId: franchiseId || '',
                status: 'active'
            };

            if (isEditing) {
                await updateRestaurant({
                    ...payload,
                    id: restaurant.id
                });
            } else {
                await createRestaurant(payload);
            }

            message.success(isEditing ? 'Cliente actualizado correctamente' : 'Cliente creado correctamente');
            onSuccess();
            onClose();
        } catch (err: any) {
            let errorMessage = 'Error al guardar cliente';
            
            if (err.code === 'permission-denied') {
                errorMessage = 'No tienes permisos para crear clientes';
            } else if (err.code === 'invalid-argument') {
                errorMessage = 'Datos inválidos. Verifica todos los campos';
            } else if (err.code === 'unauthenticated') {
                errorMessage = 'Debes iniciar sesión nuevamente';
            } else if (err.message) {
                errorMessage = err.message;
            }
            
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-200 dark:border-slate-700 max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center flex-shrink-0">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                        <Building className={`w-5 h-5 ${isEditing ? 'text-emerald-500' : 'text-blue-600'}`} />
                        {isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                        aria-label="Cerrar modal"
                    >
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Razón Social *</label>
                            <input
                                required
                                type="text"
                                aria-label="Razón Social"
                                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                placeholder="Ej: Restaurante Pepe S.L."
                                value={formData.fiscalName}
                                onChange={e => setFormData({ ...formData, fiscalName: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">CIF / NIF *</label>
                            <div className="relative">
                                <input
                                    required
                                    type="text"
                                    aria-label="CIF o NIF"
                                    className={`w-full px-4 py-2 rounded-lg border ${
                                        cifValidation 
                                            ? cifValidation.isValid 
                                                ? 'border-green-500 focus:ring-green-500' 
                                                : 'border-red-500 focus:ring-red-500'
                                            : 'border-slate-300 dark:border-slate-600 focus:ring-emerald-500'
                                    } bg-white dark:bg-slate-700 outline-none transition-all`}
                                    placeholder="B-12345678"
                                    value={formData.cif}
                                    onChange={e => handleCifChange(e.target.value)}
                                    onBlur={() => {
                                        if (formData.cif && cifValidation?.isValid) {
                                            setFormData({ ...formData, cif: formatFiscalId(formData.cif) });
                                        }
                                    }}
                                />
                                {cifValidation && (
                                    <div className={`absolute right-3 top-1/2 -translate-y-1/2 ${cifValidation.isValid ? 'text-green-500' : 'text-red-500'}`}>
                                        {cifValidation.isValid ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                                    </div>
                                )}
                            </div>
                            {cifValidation && (
                                <p className={`text-xs mt-1 ${cifValidation.isValid ? 'text-green-600' : 'text-red-500'}`}>
                                    {cifValidation.message}
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    <Mail className="w-3 h-3 inline mr-1" />
                                    Email
                                </label>
                                <input
                                    type="email"
                                    aria-label="Email"
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                    placeholder="facturacion@empresa.com"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    <Phone className="w-3 h-3 inline mr-1" />
                                    Teléfono
                                </label>
                                <input
                                    type="tel"
                                    aria-label="Teléfono"
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                    placeholder="+34 912 345 678"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
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
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none block transition-all"
                                    placeholder="Calle, Número, Piso"
                                    value={formData.address.street}
                                    onChange={e => setFormData({ ...formData, address: { ...formData.address, street: e.target.value } })}
                                />
                                <div className="grid grid-cols-2 gap-3">
                                    <input
                                        required
                                        type="text"
                                        aria-label="Ciudad"
                                        className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                        placeholder="Ciudad"
                                        value={formData.address.city}
                                        onChange={e => setFormData({ ...formData, address: { ...formData.address, city: e.target.value } })}
                                    />
                                    <input
                                        required
                                        type="text"
                                        aria-label="Código Postal"
                                        className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                        placeholder="C.P."
                                        value={formData.address.zipCode}
                                        onChange={e => setFormData({ ...formData, address: { ...formData.address, zipCode: e.target.value } })}
                                    />
                                </div>
                                <input
                                    required
                                    type="text"
                                    aria-label="Provincia"
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                    placeholder="Provincia"
                                    value={formData.address.province}
                                    onChange={e => setFormData({ ...formData, address: { ...formData.address, province: e.target.value } })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Notas</label>
                            <textarea
                                aria-label="Notas"
                                rows={2}
                                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none transition-all resize-none"
                                placeholder="Observaciones sobre el cliente..."
                                value={formData.notes}
                                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            />
                        </div>
                    </div>

                    {error && <p className="text-red-500 text-sm bg-red-50 p-2 rounded border border-red-100">{error}</p>}

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 rounded-lg font-medium transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading || (cifValidation !== null && !cifValidation.isValid)}
                            className={`px-6 py-2 ${isEditing ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-lg font-medium flex items-center gap-2 shadow-lg transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {loading ? 'Guardando...' : (
                                <>
                                    <Save className="w-4 h-4" />
                                    {isEditing ? 'Actualizar Cliente' : 'Guardar Cliente'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
