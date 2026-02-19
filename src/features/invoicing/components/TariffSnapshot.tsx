
import React, { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { MapPin } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters';

interface Props {
    franchiseId: string;
    onConfigure: () => void;
}

interface Rate {
    range: string;
    price: number;
}

export const TariffSnapshot: React.FC<Props> = ({ franchiseId, onConfigure }) => {
    const [rates, setRates] = useState<Rate[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadRates = async () => {
            try {
                const docRef = doc(db, 'franchises', franchiseId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists() && docSnap.data().rates) {
                    const ratesData = docSnap.data().rates;
                    const ratesArray = Object.entries(ratesData).map(([range, price]) => ({
                        range,
                        price: Number(price)
                    })).sort((a, b) => parseInt(a.range) - parseInt(b.range));
                    setRates(ratesArray);
                }
            } catch (error) {
                console.error("Error loading rates snapshot", error);
            } finally {
                setLoading(false);
            }
        };

        if (franchiseId) loadRates();
    }, [franchiseId]);

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-emerald-500" />
                    Tarifas Activas
                </h3>
                <button
                    onClick={onConfigure}
                    className="text-sm text-emerald-600 font-bold hover:underline"
                >
                    Configurar
                </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-10 bg-slate-100 dark:bg-slate-700 rounded-lg animate-pulse" />
                        ))}
                    </div>
                ) : rates.length > 0 ? (
                    rates.map((rate, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-100 dark:border-slate-700">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-500 border border-slate-200 dark:border-slate-600">
                                    {idx + 1}
                                </div>
                                <span className="font-medium text-slate-700 dark:text-slate-300">{rate.range} km</span>
                            </div>
                            <span className="font-bold text-emerald-600">{formatCurrency(rate.price)}</span>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-8 text-slate-400">
                        <p>No hay tarifas configuradas</p>
                    </div>
                )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-400 text-center">
                Tarifas aplicadas automáticamente por distancia
            </div>
        </div>
    );
};
