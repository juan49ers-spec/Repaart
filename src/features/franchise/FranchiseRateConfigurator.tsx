import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Save, AlertCircle, Info, RotateCw } from 'lucide-react';
import { LogisticsRate } from '../../types/franchise';
import { LogisticsRatesEditor } from './components/LogisticsRatesEditor';
import { notificationService } from '../../services/notificationService';

interface FranchiseRateConfiguratorProps {
    franchiseId: string;
    onClose?: () => void;
}

const FranchiseRateConfigurator: React.FC<FranchiseRateConfiguratorProps> = ({ franchiseId, onClose }) => {
    const [rates, setRates] = useState<LogisticsRate[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [migratedFromLegacy, setMigratedFromLegacy] = useState(false);

    // Initial rates ref for diffing (smart notifications)
    const [initialRates, setInitialRates] = useState<LogisticsRate[]>([]);

    // Load rates from Firestore (users collection priorities, fallback to franchises)
    useEffect(() => {
        const loadRates = async () => {
            try {
                // 1. Try Modern Source (Users)
                const userDocRef = doc(db, 'users', franchiseId);
                const userDocSnap = await getDoc(userDocRef);

                if (userDocSnap.exists() && userDocSnap.data().logisticsRates && userDocSnap.data().logisticsRates.length > 0) {
                    const loadedRates = userDocSnap.data().logisticsRates as LogisticsRate[];
                    setRates(loadedRates);
                    setInitialRates(loadedRates);
                } else {
                    // 2. Fallback to Legacy Source (Franchises)
                    const franchiseDocRef = doc(db, 'franchises', franchiseId);
                    const franchiseDocSnap = await getDoc(franchiseDocRef);

                    if (franchiseDocSnap.exists() && franchiseDocSnap.data().rates) {
                        console.log("Migrating legacy rates...");
                        const ratesData = franchiseDocSnap.data().rates;
                        // Convert { "0-4": 3.5 } to LogisticsRate[]
                        const legacyRates: LogisticsRate[] = Object.entries(ratesData)
                            .map(([range, price]) => {
                                const [min, max] = range.split('-').map(Number);
                                return {
                                    min: min || 0,
                                    max: max || 0,
                                    price: Number(price) || 0,
                                    name: range
                                };
                            })
                            .sort((a, b) => a.min - b.min);

                        setRates(legacyRates);
                        setInitialRates([]); // Treat as new for notification purposes if saving
                        setMigratedFromLegacy(true);
                    } else {
                        setRates([]);
                        setInitialRates([]);
                    }
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

    const handleSave = async () => {
        setSaving(true);
        setError(null);

        try {
            // Clean rates before saving
            const cleanRates = rates.map(r => ({
                min: Number(r.min) || 0,
                max: Number(r.max) || 0,
                price: Number(r.price) || 0,
                name: r.name || `${r.min}-${r.max} km`
            }));

            // 1. Save to Modern Source (Users)
            await setDoc(doc(db, 'users', franchiseId), {
                logisticsRates: cleanRates,
                ratesUpdatedAt: new Date(),
            }, { merge: true });

            // 2. Smart Notification & Logging
            const ancientRates = initialRates;
            const newRates = cleanRates;

            if (JSON.stringify(newRates) !== JSON.stringify(ancientRates)) {

                // Calculate simple variance check
                let maxVariance = 0;
                const changeDetails: string[] = [];

                newRates.forEach(nr => {
                    const oldRate = ancientRates.find(ar => ar.name === nr.name || (ar.min === nr.min && ar.max === nr.max));
                    if (oldRate) {
                        const variance = oldRate.price > 0 ? Math.abs((nr.price - oldRate.price) / oldRate.price) * 100 : 100;
                        if (nr.price !== oldRate.price) {
                            changeDetails.push(`${nr.name}: ${oldRate.price}€ -> ${nr.price}€`);
                            if (variance > maxVariance) maxVariance = variance;
                        }
                    } else {
                        changeDetails.push(`Nueva: ${nr.name} (${nr.price}€)`);
                        maxVariance = 100;
                    }
                });

                // Only notify if there are actual changes
                if (changeDetails.length > 0) {
                    const isHighPriority = maxVariance > 20;
                    await notificationService.notify(
                        'RATE_CHANGE',
                        franchiseId, // Target (Self)
                        'Sistema de Tarifas',
                        {
                            title: isHighPriority ? '⚠️ Cambio de Tarifas Importante' : 'Tarifas Actualizadas',
                            message: `Se han actualizado las tarifas logísticas.\n${changeDetails.join('\n')}`,
                            priority: isHighPriority ? 'high' : 'normal',
                            metadata: {
                                migrated: migratedFromLegacy,
                                variance: maxVariance
                            }
                        }
                    );
                }
            }

            // Sync state
            setInitialRates(cleanRates);
            setMigratedFromLegacy(false);

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
            <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-800/50">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-100 dark:bg-emerald-500/10 rounded-xl shadow-sm">
                            <RotateCw className={`w-6 h-6 text-emerald-600 dark:text-emerald-400 ${migratedFromLegacy ? 'animate-spin' : ''}`} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                {migratedFromLegacy ? 'Migración Pendiente' : 'Estructura de Tarifas'}
                            </h3>
                            <p className="text-slate-500 dark:text-slate-400 mt-1">
                                {migratedFromLegacy
                                    ? 'Hemos detectado tarifas antiguas. Guarda para completar la migración.'
                                    : 'Gestiona los precios base por distancia para tu franquicia'
                                }
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-6 md:p-8 space-y-6">
                {error && (
                    <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 p-4 rounded-xl text-sm flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <span className="font-medium">{error}</span>
                    </div>
                )}

                {migratedFromLegacy && (
                    <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-800 dark:text-amber-400 p-4 rounded-xl text-sm flex items-start gap-3">
                        <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <div>
                            <span className="font-bold block mb-1">Actualización Necesaria</span>
                            Tus tarifas se han importado del sistema antiguo. Por favor, revísalas y pulsa &quot;Guardar&quot; para completar la actualización al nuevo formato &quot;Usuario-Céntrico&quot;.
                        </div>
                    </div>
                )}

                <LogisticsRatesEditor
                    rates={rates}
                    onChange={setRates}
                />

                {/* Info Banner */}
                <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-xl p-4 flex items-start gap-3 text-sm text-blue-800 dark:text-blue-300">
                    <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                        <span className="font-bold block mb-1">Sincronización Automática</span>
                        Cualquier cambio aquí se reflejará inmediatamente en el Perfil de Franquicia y en el cálculo de Income.
                    </div>
                </div>

                {/* Save Bar */}
                <div className="flex justify-end pt-6 border-t border-slate-100 dark:border-slate-700">
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
                                {migratedFromLegacy ? 'Guardar y Completar Migración' : 'Guardar Configuración'}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FranchiseRateConfigurator;
