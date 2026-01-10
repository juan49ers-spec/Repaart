import { useState, useEffect, type FC, type ChangeEvent } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { TARIFFS as DEFAULT_TARIFFS } from '../../../lib/finance';
import { Save, RefreshCw, AlertCircle } from 'lucide-react';

interface TariffSection {
    [key: string]: number;
}

interface Tariffs {
    NEW: TariffSection;
    OLD: TariffSection;
}

interface TariffEditorProps {
    onClose?: () => void;
}

const TariffEditor: FC<TariffEditorProps> = ({ onClose }) => {
    const [tariffs, setTariffs] = useState<Tariffs | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [saving, setSaving] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Load Tariffs
    useEffect(() => {
        const loadTariffs = async (): Promise<void> => {
            try {
                const docRef = doc(db, 'config', 'tariffs');
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setTariffs(docSnap.data() as Tariffs);
                } else {
                    // Initialize with defaults if not found
                    setTariffs(DEFAULT_TARIFFS);
                }
            } catch (err) {
                console.error("Error loading tariffs:", err);
                setError("Ocurrió un error al cargar las tarifas.");
                // Fallback to defaults to show something
                setTariffs(DEFAULT_TARIFFS);
            } finally {
                setLoading(false);
            }
        };

        loadTariffs();
    }, []);

    const handleChange = (section: keyof Tariffs, key: string, value: string): void => {
        setTariffs(prev => prev ? ({
            ...prev,
            [section]: {
                ...prev[section],
                [key]: parseFloat(value) || 0
            }
        }) : null);
    };

    const handleSave = async (): Promise<void> => {
        if (!tariffs) return;

        setSaving(true);
        setError(null);
        try {
            await setDoc(doc(db, 'config', 'tariffs'), tariffs);
            // Optional: User feedback or just close
            if (onClose) onClose();
            else alert("Tarifas guardadas correctamente. Los cambios se aplicarán al recargar.");
        } catch (err) {
            console.error("Error saving tariffs:", err);
            setError("Error al guardar en la nube.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Cargando configuración...</div>;
    if (!tariffs) return <div className="p-8 text-center text-slate-500">Error: No se pudieron cargar las tarifas.</div>;

    return (
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 p-4 flex justify-between items-center text-white">
                <h3 className="font-bold flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" /> Configuración de Tarifas
                </h3>
            </div>

            <div className="p-6">
                {error && (
                    <div className="mb-4 bg-rose-50 text-rose-600 p-3 rounded-lg text-sm flex items-center">
                        <AlertCircle className="w-4 h-4 mr-2" /> {error}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* NEW TARIFFS */}
                    <div>
                        <h4 className="font-bold text-slate-800 mb-4 border-b pb-2">Tarifa &quot;Nueva&quot; (Por tramos)</h4>
                        <div className="space-y-4">
                            {Object.entries(tariffs.NEW || {}).map(([range, price]) => (
                                <div key={range} className="flex items-center justify-between">
                                    <label className="text-sm font-medium text-slate-600">Km {range}</label>
                                    <div className="relative w-32">
                                        <input
                                            type="number"
                                            step="0.10"
                                            value={price}
                                            onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange('NEW', range, e.target.value)}
                                            className="w-full pl-6 pr-3 py-1.5 text-right border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                        <span className="absolute left-2 top-1.5 text-slate-400 text-sm">€</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* OLD TARIFFS */}
                    <div>
                        <h4 className="font-bold text-slate-800 mb-4 border-b pb-2">Tarifa &quot;Antigua&quot;</h4>
                        <div className="space-y-4">
                            {Object.entries(tariffs.OLD || {}).map(([range, price]) => (
                                <div key={range} className="flex items-center justify-between">
                                    <label className="text-sm font-medium text-slate-600">Km {range}</label>
                                    <div className="relative w-32">
                                        <input
                                            type="number"
                                            step="0.10"
                                            value={price}
                                            onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange('OLD', range, e.target.value)}
                                            className="w-full pl-6 pr-3 py-1.5 text-right border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                        <span className="absolute left-2 top-1.5 text-slate-400 text-sm">€</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-slate-100">
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg transition"
                        >
                            Cancelar
                        </button>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        {saving ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TariffEditor;
