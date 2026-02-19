import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useInvoicing, FranchiseRestaurant } from '../../../hooks/useInvoicing';
import { X, Save, FileText, Plus, Trash2, Building, Store } from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    restaurants: FranchiseRestaurant[];
}

interface FormDataItem {
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
}

export const CreateInvoiceModal: React.FC<Props> = ({ isOpen, onClose, onSuccess, restaurants }) => {
    const { user } = useAuth();
    const { generateInvoice, getFranchises } = useInvoicing();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [franchises, setFranchises] = useState<any[]>([]); // To store fetched franchises

    // Determine default customer type based on role
    const [customerType, setCustomerType] = useState<'restaurant' | 'franchise'>('restaurant');

    const loadFranchises = useCallback(async () => {
        try {
            const data = await getFranchises();
            setFranchises(data || []);
        } catch (err) {
            console.error("Error loading franchises:", err);
            setError("Error al cargar las franquicias");
        }
    }, [getFranchises]);

    useEffect(() => {
        if (isOpen && user?.role === 'admin') {
            setCustomerType('franchise'); // Keep this logic
            loadFranchises();
        } else if (isOpen && user?.role !== 'admin') {
            setCustomerType('restaurant'); // Keep this logic for non-admin users
        }
        // When modal closes, reset customerType to default for next open
        if (!isOpen) {
            setCustomerType('restaurant');
        }
    }, [isOpen, user, loadFranchises]);


    const [formData, setFormData] = useState({
        customerId: '',
        periodStart: new Date().toISOString().slice(0, 10), // YYYY-MM-DD
        periodEnd: new Date().toISOString().slice(0, 10),
        items: [] as FormDataItem[]
    });

    const addItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, { description: 'Servicio de Reparto', quantity: 1, unitPrice: 0, taxRate: 21 }]
        });
    };

    const removeItem = (index: number) => {
        const newItems = formData.items.filter((_, i) => i !== index);
        setFormData({ ...formData, items: newItems });
    };

    const updateItem = <K extends keyof FormDataItem>(index: number, field: K, value: FormDataItem[K]) => {
        const newItems = [...formData.items];
        newItems[index][field] = value;
        setFormData({ ...formData, items: newItems });
    };

    const calculateTotals = () => {
        const subtotal = formData.items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);

        // Calculate taxes by rate
        const taxesByRate = formData.items.reduce((acc, item) => {
            const base = item.quantity * item.unitPrice;
            const tax = base * (item.taxRate / 100);
            if (!acc[item.taxRate]) {
                acc[item.taxRate] = { base: 0, amount: 0 };
            }
            acc[item.taxRate].base += base;
            acc[item.taxRate].amount += tax;
            return acc;
        }, {} as Record<number, { base: number, amount: number }>);

        const totalTax = Object.values(taxesByRate).reduce((acc, t) => acc + t.amount, 0);

        return { subtotal, taxesByRate, totalTax, total: subtotal + totalTax };
    };

    const totals = calculateTotals();

    const setPeriod = (type: 'current_month' | 'last_month') => {
        const now = new Date();
        let start, end;

        if (type === 'current_month') {
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        } else {
            start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            end = new Date(now.getFullYear(), now.getMonth(), 0);
        }

        // Adjust for timezone offset to get YYYY-MM-DD correctly
        const formatDate = (d: Date) => {
            const offset = d.getTimezoneOffset();
            const date = new Date(d.getTime() - (offset * 60 * 1000));
            return date.toISOString().split('T')[0];
        };

        setFormData(prev => ({
            ...prev,
            periodStart: formatDate(start),
            periodEnd: formatDate(end)
        }));
    };

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (!user?.franchiseId && user?.role !== 'admin') {
                throw new Error('No tienes permiso o franquicia asignada');
            }

            // Fixed: Provide fallback for potential undefined customerId when type is not generic
            const targetCustomerId = formData.customerId || '';

            await generateInvoice({
                franchiseId: user?.franchiseId || user?.uid || '',
                restaurantId: customerType === 'restaurant' ? targetCustomerId : undefined, // Backward compat
                customerId: targetCustomerId,
                customerCollection: customerType === 'franchise' ? 'franchises' : 'restaurants',
                period: {
                    start: new Date(formData.periodStart).toISOString(),
                    end: new Date(formData.periodEnd).toISOString()
                },
                items: formData.items
            });

            onSuccess();
            onClose();
        } catch (err: unknown) { // Changed 'any' to 'unknown'
            setError((err as Error).message || 'Error al generar factura'); // Type assertion for error message
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                        <FileText className="w-6 h-6 text-blue-600" />
                        Nueva Factura
                        {user?.role === 'admin' && (
                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                                Modo Admin
                            </span>
                        )}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-500"
                        aria-label="Cerrar modal"
                        title="Cerrar"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Customer Selection & Period */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            {user?.role === 'admin' && (
                                <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg">
                                    <button
                                        type="button"
                                        onClick={() => setCustomerType('franchise')}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${customerType === 'franchise'
                                            ? 'bg-white dark:bg-slate-800 shadow text-blue-600'
                                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                            }`}
                                    >
                                        <Building className="w-4 h-4" />
                                        Franquicia
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setCustomerType('restaurant')}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${customerType === 'restaurant'
                                            ? 'bg-white dark:bg-slate-800 shadow text-emerald-600'
                                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                            }`}
                                    >
                                        <Store className="w-4 h-4" />
                                        Restaurante
                                    </button>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                                    {customerType === 'franchise' ? 'Cliente (Franquicia)' : 'Cliente (Restaurante)'}
                                </label>
                                <select
                                    required
                                    aria-label="Seleccionar Cliente"
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                                    value={formData.customerId}
                                    onChange={e => setFormData({ ...formData, customerId: e.target.value })}
                                >
                                    <option value="">-- Seleccionar --</option>
                                    {customerType === 'franchise' ? (
                                        franchises.map(f => (
                                            <option key={f.id} value={f.id}>{f.displayName || f.email}</option>
                                        ))
                                    ) : (
                                        restaurants.map(r => (
                                            <option key={r.id} value={r.id}>{r.fiscalName}</option>
                                        ))
                                    )}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-end">
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Periodo de Facturación</label>
                                <div className="flex gap-2 text-xs">
                                    <button type="button" onClick={() => setPeriod('last_month')} className="text-blue-600 hover:underline">Mes Pasado</button>
                                    <span className="text-slate-300">|</span>
                                    <button type="button" onClick={() => setPeriod('current_month')} className="text-blue-600 hover:underline">Este Mes</button>
                                </div>
                            </div>

                            <div className="flex gap-2 items-center">
                                <input
                                    required
                                    type="date"
                                    aria-label="Fecha inicio periodo"
                                    className="flex-1 px-3 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                    value={formData.periodStart}
                                    onChange={e => setFormData({ ...formData, periodStart: e.target.value })}
                                />
                                <span className="text-slate-400">→</span>
                                <input
                                    required
                                    type="date"
                                    aria-label="Fecha fin periodo"
                                    className="flex-1 px-3 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                    value={formData.periodEnd}
                                    onChange={e => setFormData({ ...formData, periodEnd: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Lines */}
                    <div className="bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-100/50 dark:bg-slate-800/50">
                            <h3 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 text-sm uppercase tracking-wide">
                                Conceptos
                            </h3>
                            <button type="button" onClick={addItem} className="text-blue-600 hover:text-blue-700 text-sm font-bold flex items-center gap-1 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-3 py-1.5 rounded-lg transition-colors">
                                <Plus className="w-4 h-4" /> Añadir Línea
                            </button>
                        </div>

                        <div className="p-4 space-y-3">
                            <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400 px-2 mb-2">
                                <div className="col-span-6">DESCRIPCIÓN</div>
                                <div className="col-span-2 text-right">CANTIDAD</div>
                                <div className="col-span-2 text-right">PRECIO UNITARIO</div>
                                <div className="col-span-1 text-right">IVA</div>
                                <div className="col-span-1"></div>
                            </div>

                            {formData.items.map((item, idx) => (
                                <div key={idx} className="grid grid-cols-12 gap-4 items-center group">
                                    <div className="col-span-6">
                                        <input
                                            type="text"
                                            required
                                            aria-label="Descripción del concepto"
                                            placeholder="Descripción del servicio..."
                                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                                            value={item.description}
                                            onChange={e => updateItem(idx, 'description', e.target.value)}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            step="0.01"
                                            aria-label="Cantidad"
                                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-right focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                                            value={item.quantity}
                                            onChange={e => updateItem(idx, 'quantity', parseFloat(e.target.value))}
                                        />
                                    </div>
                                    <div className="col-span-2 relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">€</span>
                                        <input
                                            type="number"
                                            required
                                            step="0.01"
                                            aria-label="Precio unitario"
                                            className="w-full pl-6 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-right focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                                            value={item.unitPrice}
                                            onChange={e => updateItem(idx, 'unitPrice', parseFloat(e.target.value))}
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <select
                                            aria-label="Tipo de IVA"
                                            className="w-full px-1 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-right focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={item.taxRate}
                                            onChange={e => updateItem(idx, 'taxRate', parseFloat(e.target.value))}
                                        >
                                            <option value="21">21%</option>
                                            <option value="10">10%</option>
                                            <option value="4">4%</option>
                                            <option value="0">0%</option>
                                        </select>
                                    </div>
                                    <div className="col-span-1 flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => removeItem(idx)}
                                            aria-label="Eliminar línea"
                                            className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Advanced Totals */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-slate-200 dark:border-slate-700 pt-6">
                        {/* Tax Breakdown */}
                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 text-sm">
                            <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-3 text-xs uppercase tracking-wide">Desglose de Impuestos</h4>
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs text-slate-500 border-b border-slate-200 dark:border-slate-700 pb-1">
                                    <span>Tipo</span>
                                    <span>Base</span>
                                    <span>Cuota</span>
                                </div>
                                {Object.entries(totals.taxesByRate).map(([rate, { base, amount }]) => (
                                    <div key={rate} className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                                        <span className="font-medium bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-xs">{rate}% IVA</span>
                                        <span className="font-mono">{base.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</span>
                                        <span className="font-mono text-slate-500">{amount.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</span>
                                    </div>
                                ))}
                                {Object.keys(totals.taxesByRate).length === 0 && (
                                    <p className="text-slate-400 italic text-xs py-2 text-center">Añade conceptos para ver desglose</p>
                                )}
                            </div>
                        </div>

                        {/* Grand Totals */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                                <span className="text-sm">Subtotal (Base Imponible)</span>
                                <span className="font-medium font-mono text-lg">{totals.subtotal.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                                <span className="text-sm">Impuestos Totales</span>
                                <span className="font-medium font-mono text-lg">{totals.totalTax.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</span>
                            </div>
                            <div className="flex justify-between items-center pt-4 border-t-2 border-slate-200 dark:border-slate-700">
                                <span className="font-bold text-xl text-slate-900 dark:text-white">Total Factura</span>
                                <span className="font-bold font-mono text-3xl text-blue-600 dark:text-blue-400">
                                    {totals.total.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                </span>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2 text-sm animate-in slide-in-from-bottom-2">
                            <FileText className="w-4 h-4" />
                            {error}
                        </div>
                    )}
                </form>

                <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3 filter backdrop-blur-sm">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 rounded-lg font-medium transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all transform hover:scale-105"
                    >
                        {loading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                            <><Save className="w-4 h-4" /> Emitir Factura</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
