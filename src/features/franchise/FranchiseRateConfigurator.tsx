import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Save, DollarSign, AlertCircle, Plus, Trash2 } from 'lucide-react';

interface FranchiseRate {
    range: string;  // "0-4", "4-8", etc.
    price: number;  // SIN IVA
}

interface FranchiseRateConfiguratorProps {
    franchiseId: string;
    onClose?: () => void;
}

const DEFAULT_RATES: FranchiseRate[] = [
    { range: "0-4", price: 15 },
    { range: "4-8", price: 20 },
    { range: "8-12", price: 25 },
    { range: "12+", price: 30 }
];

const FranchiseRateConfigurator: React.FC<FranchiseRateConfiguratorProps> = ({ franchiseId, onClose }) => {
    const [rates, setRates] = useState<FranchiseRate[]>(DEFAULT_RATES);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load rates from Firestore
    useEffect(() => {
        const loadRates = async () => {
            try {
                const docRef = doc(db, 'users', franchiseId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists() && docSnap.data().rates) {
                    // Convert object to array format
                    const ratesData = docSnap.data().rates;
                    const ratesArray: FranchiseRate[] = Object.entries(ratesData).map(([range, price]) => ({
                        range,
                        price: typeof price === 'number' ? price : 0
                    }));
                    setRates(ratesArray);
                } else {
                    // Use defaults
                    setRates(DEFAULT_RATES);
                }
            } catch (err) {
                console.error("Error loading rates:", err);
                setError("Error al cargar las tarifas. Usando valores por defecto.");
                setRates(DEFAULT_RATES);
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
        if (rates.length > 1) {
            setRates(rates.filter((_, i) => i !== index));
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);

        try {
            // Validate: no empty ranges, positive prices
            const validRates = rates.filter(r => r.range.trim() !== '' && r.price > 0);

            if (validRates.length === 0) {
                setError("Debes tener al menos una tarifa válida (rango y precio > 0)");
                setSaving(false);
                return;
            }

            // Convert array to object for Firestore
            const ratesObject: Record<string, number> = {};
            validRates.forEach(r => {
                ratesObject[r.range] = r.price;
            });

            // Save to Firestore
            await setDoc(doc(db, 'users', franchiseId), {
                rates: ratesObject,
                ratesUpdatedAt: new Date()
            }, { merge: true });

            if (onClose) {
                onClose();
            } else {
                alert("Tarifas guardadas correctamente");
            }
        } catch (err) {
            console.error("Error saving rates:", err);
            setError("Error al guardar. Verifica tu conexión e inténtalo de nuevo.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="p-8 text-center text-slate-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4" />
                Cargando tarifas...
            </div>
        );
    }

    return (
        <div className="bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden">
            {/* Header */}
            <div className="bg-slate-900/80 backdrop-blur-sm p-6 border-b border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-500/20 rounded-xl">
                        <DollarSign className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-white">Configuración de Tarifas</h3>
                        <p className="text-sm text-slate-400 mt-0.5">Precios SIN IVA por tramo de distancia</p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-6">
                {error && (
                    <div className="mb-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 p-4 rounded-xl text-sm flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Info */}
                <div className="mb-6 bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
                    <p className="text-sm text-blue-400 leading-relaxed">
                        💡 <strong>Importante:</strong> Estas tarifas son SIN IVA. El IVA se calculará automáticamente después.
                    </p>
                </div>

                {/* Rates List */}
                <div className="space-y-3">
                    {rates.map((rate, index) => (
                        <div key={index} className="flex items-center gap-3 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 group hover:border-blue-500/50 transition-all">
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                                    Rango de Km
                                </label>
                                <input
                                    type="text"
                                    value={rate.range}
                                    onChange={(e) => handleChange(index, 'range', e.target.value)}
                                    placeholder="Ej: 0-4, 4-8, 12+"
                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                />
                            </div>

                            <div className="w-32">
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                                    Precio (€)
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.50"
                                        value={rate.price || ''}
                                        onChange={(e) => handleChange(index, 'price', e.target.value)}
                                        placeholder="0.00"
                                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-right pr-8"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 font-semibold pointer-events-none">
                                        €
                                    </span>
                                </div>
                            </div>

                            {rates.length > 1 && (
                                <button
                                    onClick={() => handleRemove(index)}
                                    className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100 mt-6"
                                    title="Eliminar tarifa"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                {/* Add Button */}
                <button
                    onClick={handleAdd}
                    className="mt-4 w-full py-3 border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-xl text-slate-400 hover:text-blue-400 font-bold text-sm transition-all flex items-center justify-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Añadir Tarifa
                </button>

                {/* Actions */}
                <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-slate-800">
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 text-slate-400 hover:bg-slate-800 rounded-lg transition-colors font-bold"
                        >
                            Cancelar
                        </button>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-md disabled:opacity-50 transition-all flex items-center gap-2"
                    >
                        {saving ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                                Guardando...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                Guardar Tarifas
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FranchiseRateConfigurator;
