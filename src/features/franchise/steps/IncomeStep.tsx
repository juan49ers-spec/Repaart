import React, { useState, useEffect } from 'react';
import { Package, AlertCircle } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../context/AuthContext';
import { formatMoney } from '../../../lib/finance';

// =====================================================
// TYPES
// =====================================================

interface LogisticsRate {
    id?: string;
    name: string;   // "0-4 km", "4-8 km", etc. (Legacy or Generated)
    min?: number;   // New structure
    max?: number;   // New structure
    price: number;  // SIN IVA
}

import { OrderCounts } from '../types';

interface IncomeStepProps {
    data: OrderCounts;
    onChange: (data: OrderCounts) => void;
    total: number;
    franchiseId: string;
    onTotalChange: (total: number) => void;
}

// Tooltip component removed as it was unused

// =====================================================
// MAIN COMPONENT
// =====================================================

const IncomeStep: React.FC<IncomeStepProps> = ({
    data,
    onChange,
    franchiseId,
    onTotalChange
}) => {
    const { user } = useAuth();
    const [rates, setRates] = useState<LogisticsRate[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadRates = async () => {
            setLoading(true);
            setError(null);

            try {
                // DETERMINAR ID CORRECTO DEL DOCUMENTO DE USUARIO
                let targetId = franchiseId;

                // Si el usuario es franquicia, priorizamos su propio UID porque ahí es donde FranchiseProfile guarda los datos.
                if (user?.role === 'franchise' && user?.uid) {
                    targetId = user.uid;
                }

                if (!targetId) throw new Error("ID de franquicia no disponible");

                if (import.meta.env.DEV) {
                    console.log(`IncomeStep: Loading rates from users/${targetId}`);
                }
                const docRef = doc(db, 'users', targetId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const userData = docSnap.data();
                    const logisticsRates = userData.logisticsRates || [];
                    if (import.meta.env.DEV) {
                        console.log('IncomeStep: Loaded rates', logisticsRates.length);
                    }
                    setRates(logisticsRates);
                } else {
                    if (import.meta.env.DEV) {
                        console.warn(`IncomeStep: Doc ${targetId} not found`);
                    }
                    // Fallback para staff o discrepancias
                    if (targetId !== user?.uid && user?.uid) {
                        const fallbackSnap = await getDoc(doc(db, 'users', user.uid));
                        if (fallbackSnap.exists()) setRates(fallbackSnap.data().logisticsRates || []);
                    }
                }
            } catch (err: any) {
                console.error("Error loading rates:", err);
                if (err.code === 'permission-denied') {
                    setError("No tienes permisos para leer la configuración de tarifas.");
                } else {
                    setError("Error al cargar tarifas.");
                }
            } finally {
                setLoading(false);
            }
        };

        loadRates();
    }, [franchiseId]);

    const handleChange = (rateName: string, value: string) => {
        const numValue = value === '' ? 0 : parseInt(value) || 0;
        onChange({
            ...data,
            [rateName]: numValue
        });
    };

    const calculateTotal = () => {
        let totalIncome = 0;
        rates.forEach(rate => {
            const orders = data[rate.name] || 0;
            totalIncome += orders * rate.price;
        });
        return totalIncome;
    };

    // Effect to notify parent of total changes
    useEffect(() => {
        if (rates.length > 0 && onTotalChange) {
            const total = calculateTotal();
            onTotalChange(total);
        }
    }, [data, rates, onTotalChange]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                <span className="ml-3 text-slate-400">Cargando tarifas...</span>
            </div>
        );
    }

    if (error === "no-rates") {
        return (
            <div className="space-y-6">
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-500/10 rounded-2xl mb-4">
                        <AlertCircle className="w-8 h-8 text-amber-400" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-2">
                        No tienes tarifas configuradas
                    </h3>
                    <p className="text-slate-500 text-sm mb-6">
                        Antes de poder registrar ingresos, necesitas configurar tus tarifas por distancia.
                    </p>

                    <div className="max-w-md mx-auto bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                        <p className="text-sm text-blue-400 leading-relaxed">
                            <strong>¿Cómo configurar tarifas?</strong><br />
                            1. Ve a <strong>Configuración → Configuración Sede</strong><br />
                            2. Selecciona la pestaña <strong>"Logística y Zonas"</strong><br />
                            3. Añade tus tarifas por distancia (ej: 0-4 km = 15€)<br />
                            4. Guarda y vuelve aquí
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-4" />
                <p className="text-rose-400">{error}</p>
            </div>
        );
    }

    const calculatedTotal = calculateTotal();

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
            {/* Header / Summary */}
            <div className="flex gap-4">
                <div className="flex-1 bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-center shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-100">
                            <Package className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Ingresos</p>
                            <h3 className="text-2xl font-black text-slate-900 font-mono">
                                {formatMoney(calculatedTotal)}€
                            </h3>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Pedidos Totales</p>
                        <span className="bg-slate-100 border border-slate-200 text-slate-700 px-3 py-1 rounded-lg text-sm font-mono font-bold">
                            {Object.values(data).reduce((sum, val) => sum + val, 0)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Rates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rates.map((rate, index) => {
                    const orders = data[rate.name] || 0;

                    return (
                        <div key={index} className="bg-white p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-all group relative shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="flex flex-col">
                                        <label className="text-sm font-bold text-slate-700 block">
                                            {rate.min !== undefined && rate.max !== undefined
                                                ? `${rate.min} - ${rate.max} km`
                                                : rate.name}
                                        </label>
                                        <p className="text-[10px] text-slate-500 font-mono">
                                            Tarifa: <span className="text-slate-700 font-bold">{rate.price.toFixed(2)}€</span>
                                        </p>
                                    </div>
                                </div>
                                {orders > 0 && (
                                    <div className="text-right">
                                        <span className="text-xs text-emerald-600 font-bold font-mono">
                                            +{(orders * rate.price).toFixed(2)}€
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="relative">
                                <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={orders === 0 ? '' : orders}
                                    onChange={(e) => handleChange(rate.name, e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-3 pr-12 text-slate-900 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono text-lg font-bold placeholder-slate-400"
                                    placeholder="0"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                                    PEDS
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Help note */}
            <div className="max-w-2xl mx-auto text-center">
                <p className="text-[10px] text-slate-500">
                    <strong className="text-blue-400">Nota:</strong> Introduce el número de pedidos. El sistema calcula automáticamente los ingresos base (sin IVA).
                </p>
            </div>
        </div >
    );
};

export default IncomeStep;
