import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Save, DollarSign, AlertCircle, Plus, Trash2, MapPin, Info } from 'lucide-react';

interface FranchiseRate {
    range: string;  // "0-4", "4-8", etc.
    price: number;  // SIN IVA
}

interface FranchiseRateConfiguratorProps {
    franchiseId: string;
    onClose?: () => void;
}

const DEFAULT_RATES: FranchiseRate[] = [];

const FranchiseRateConfigurator: React.FC<FranchiseRateConfiguratorProps> = ({ franchiseId, onClose }) => {
    const [rates, setRates] = useState<FranchiseRate[]>(DEFAULT_RATES);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load rates from Firestore (franchises collection)
    useEffect(() => {
        const loadRates = async () => {
            try {
                const docRef = doc(db, 'franchises', franchiseId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists() && docSnap.data().rates) {
                    const ratesData = docSnap.data().rates;
                    const ratesArray: FranchiseRate[] = Object.entries(ratesData).map(([range, price]) => ({
                        range,
                        price: typeof price === 'number' ? price : 0
                    }))
                        .sort((a, b) => {
                            const numA = parseInt(a.range.split('-')[0]) || 0;
                            const numB = parseInt(b.range.split('-')[0]) || 0;
                            return numA - numB;
                        });
                    setRates(ratesArray);
                } else {
                    setRates([]);
                }
            } catch (err) {
                console.error("Error loading rates:", err);
                setError("Error al cargar las tarifas.");
            } finally {
                setLoading(false);
            }
        };

        if (franchiseId) {
            loadRates();
        }
    }, [franchiseId]);

    const handleChange = (index: number, field: keyof FranchiseRate, value: string) => {
        const newRates = [...rates];
        if (field === 'price') {
            newRates[index].price = parseFloat(value) || 0;
        } else {
            newRates[index].range = value;
        }
        setRates(newRates);
    };

    const handleAdd = () => {
        setRates([...rates, { range: "", price: 0 }]);
    };

    const handleRemove = (index: number) => {
        setRates(rates.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);

        try {
            const validRates = rates.filter(r => r.range.trim() !== '' && r.price > 0);
            const ratesObject: Record<string, number> = {};
            validRates.forEach(r => {
                ratesObject[r.range] = r.price;
            });

            await setDoc(doc(db, 'franchises', franchiseId), {
                rates: ratesObject,
                ratesUpdatedAt: new Date(),
            }, { merge: true });

            if (onClose) {
                onClose();
            }
        } catch (err) {
            console.error("Error saving rates:", err);
            setError("Error al guardar. Verifica tu conexión.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="p-12 text-center text-slate-400 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-4" />
                Cargando configuración...
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in duration-500">
            {/* Premium Header */}
            <div className="p-8 border-b border-slate-100 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-800/50">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-100 dark:bg-emerald-500/10 rounded-xl shadow-sm">
                            <DollarSign className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Estructura de Tarifas</h3>
                            <p className="text-slate-500 dark:text-slate-400 mt-1">Define los precios base por distancia para tu franquicia</p>
                        </div>
                    </div>
                    <button
                        onClick={handleAdd}
                        className="group bg-slate-900 hover:bg-slate-800 text-white dark:bg-emerald-600 dark:hover:bg-emerald-700 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-slate-900/10 dark:shadow-emerald-600/20 flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        Nueva Tarifa
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="p-8">
                {error && (
                    <div className="w-full mb-8 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 p-4 rounded-xl text-sm flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <span className="font-medium">{error}</span>
                    </div>
                )}

                {rates.length === 0 ? (
                    <div className="text-center py-16 px-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50/50 dark:bg-slate-800/50">
                        <div className="w-20 h-20 bg-white dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-slate-100 dark:border-slate-600">
                            <MapPin className="w-10 h-10 text-slate-300 dark:text-slate-500" />
                        </div>
                        <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Comienza a configurar tus precios</h4>
                        <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-8 text-lg">
                            Establece rangos de distancia (km) y sus precios correspondientes para automatizar la facturación.
                        </p>
                        <button
                            onClick={handleAdd}
                            className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2 mx-auto"
                        >
                            <Plus className="w-5 h-5" />
                            Crear Primera Tarifa
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Info Banner */}
                        <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
                            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-blue-800 dark:text-blue-300">
                                <span className="font-bold block mb-1">Mejor práctica</span>
                                Asegúrate de cubrir todos los rangos de distancia probables (ej: 0-3, 3-5, 5-8) para evitar envíos sin precio.
                            </div>
                        </div>

                        {/* List Layout */}
                        <div className="grid gap-4">
                            {rates.map((rate, index) => (
                                <div key={index} className="relative flex items-center gap-4 p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-500/30 group">
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-200 dark:bg-slate-700 rounded-l-xl group-hover:bg-emerald-500 transition-colors" />

                                    {/* Badge Index */}
                                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-500 dark:text-slate-400">
                                        #{index + 1}
                                    </div>

                                    {/* Range Input */}
                                    <div className="flex-1">
                                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">
                                            Rango de Distancia (KM)
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={rate.range}
                                                onChange={(e) => handleChange(index, 'range', e.target.value)}
                                                placeholder="ej: 0-3"
                                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg pl-10 pr-4 py-2.5 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all placeholder:font-normal"
                                            />
                                            <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                        </div>
                                    </div>

                                    {/* Price Input */}
                                    <div className="w-48">
                                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">
                                            Precio por Envío
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                step="0.10"
                                                min="0"
                                                value={rate.price || ''}
                                                onChange={(e) => handleChange(index, 'price', e.target.value)}
                                                placeholder="0.00"
                                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg pl-10 pr-4 py-2.5 text-lg font-bold text-emerald-700 dark:text-emerald-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all placeholder:font-normal text-right"
                                            />
                                            <DollarSign className="w-4 h-4 text-emerald-500 absolute left-3 top-1/2 -translate-y-1/2" />
                                            <span className="absolute right-12 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">EUR</span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-end self-end mb-1">
                                        <button
                                            onClick={() => handleRemove(index)}
                                            className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                            title="Eliminar tarifa"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Save Bar */}
                        <div className="flex justify-end pt-8 border-t border-slate-100 dark:border-slate-700 mt-8">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 disabled:opacity-70 disabled:cursor-not-allowed transition-all flex items-center gap-3 hover:-translate-y-0.5 active:translate-y-0"
                            >
                                {saving ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Guardando...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-5 h-5" />
                                        Guardar Configuración
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FranchiseRateConfigurator;
