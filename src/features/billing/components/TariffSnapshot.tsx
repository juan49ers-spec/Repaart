
import React, { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { MapPin } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters';
import { LogisticsRate } from '../../../types/franchise';

interface Props {
    franchiseId: string;
    onConfigure: () => void;
}

export const TariffSnapshot: React.FC<Props> = ({ franchiseId, onConfigure }) => {
    const [rates, setRates] = useState<LogisticsRate[]>([]);
    const [loading, setLoading] = useState(() => !!franchiseId);

    useEffect(() => {
        if (!franchiseId) {
            return;
        }

        const unsubscribe = onSnapshot(doc(db, 'users', franchiseId), (docSnap) => {
            if (docSnap.exists() && docSnap.data().logisticsRates) {
                const loadedRates = docSnap.data().logisticsRates as LogisticsRate[];
                setRates(loadedRates);
            } else {
                setRates([]);
            }
            setLoading(false);
        }, (error) => {
            console.error("Error listening to rates:", error);
            setLoading(false);
        });

        return () => unsubscribe();
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
                        <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-emerald-200 dark:hover:border-emerald-500/30 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-500 border border-slate-200 dark:border-slate-600">
                                    {idx + 1}
                                </div>
                                <span className="font-medium text-slate-700 dark:text-slate-300">
                                    {rate.name || `${rate.min}-${rate.max} km`}
                                </span>
                            </div>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(rate.price)}</span>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-8 text-slate-400">
                        <MapPin className="w-10 h-10 mx-auto mb-2 opacity-50" />
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
