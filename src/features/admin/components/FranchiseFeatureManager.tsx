import { useState, useEffect, type FC } from 'react';
import { db } from '../../../lib/firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { Shield, Check, X, Loader } from 'lucide-react';

type PackType = 'basic' | 'premium';

interface Features {
    downloads?: boolean;
    [key: string]: boolean | undefined;
}

interface Franchise {
    id: string;
    name?: string;
    email: string;
    pack?: PackType;
    features?: Features;
}

/**
 * FranchiseFeatureManager - Panel para gestionar features por franquicia
 */
const FranchiseFeatureManager: FC = () => {
    const [franchises, setFranchises] = useState<Franchise[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [saving, setSaving] = useState<string | null>(null);

    useEffect(() => {
        fetchFranchises();
    }, []);

    const fetchFranchises = async (): Promise<void> => {
        try {
            const querySnapshot = await getDocs(collection(db, 'franchises'));
            const franchisesData: Franchise[] = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Franchise));
            setFranchises(franchisesData);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching franchises:', error);
            setLoading(false);
        }
    };

    const toggleFeature = async (franchiseId: string, featureName: string): Promise<void> => {
        setSaving(franchiseId);

        const franchise = franchises.find(f => f.id === franchiseId);
        if (!franchise) return;

        const currentFeatures = franchise.features || {};
        const newFeatures: Features = {
            ...currentFeatures,
            [featureName]: !currentFeatures[featureName]
        };

        try {
            await updateDoc(doc(db, 'franchises', franchiseId), {
                features: newFeatures
            });

            // Actualizar estado local
            setFranchises(franchises.map(f =>
                f.id === franchiseId
                    ? { ...f, features: newFeatures }
                    : f
            ));
        } catch (error) {
            console.error('Error updating features:', error);
        } finally {
            setSaving(null);
        }
    };

    const applyPackDefaults = async (franchiseId: string): Promise<void> => {
        setSaving(franchiseId);

        const franchise = franchises.find(f => f.id === franchiseId);
        if (!franchise) return;

        const pack: PackType = franchise.pack || 'basic';

        const defaultFeatures: Record<PackType, Features> = {
            basic: {
                downloads: false
            },
            premium: {
                downloads: true
            }
        };

        const features = defaultFeatures[pack] || defaultFeatures.basic;

        try {
            await updateDoc(doc(db, 'franchises', franchiseId), {
                features
            });

            setFranchises(franchises.map(f =>
                f.id === franchiseId
                    ? { ...f, features }
                    : f
            ));
        } catch (error) {
            console.error('Error applying pack defaults:', error);
        } finally {
            setSaving(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <Shield className="w-8 h-8 text-blue-600" />
                    <h1 className="text-h1 text-primary">Gestión de Permisos</h1>
                </div>
                <p className="text-secondary">
                    Activa o desactiva features por franquicia según su pack
                </p>
            </div>

            {/* Legend */}
            <div className="surface-raised rounded-xl p-4 mb-6 border border-slate-200">
                <div className="flex flex-wrap gap-6 text-body-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-500" />
                        <span className="text-secondary">Pack Premium</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-slate-400" />
                        <span className="text-secondary">Pack Basic</span>
                    </div>
                </div>
            </div>

            {/* Franchises Table */}
            <div className="surface-raised rounded-xl elevation-md border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="text-left p-4 text-caption text-tertiary font-bold">Franquicia</th>
                                <th className="text-left p-4 text-caption text-tertiary font-bold">Pack</th>

                                <th className="text-center p-4 text-caption text-tertiary font-bold">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {franchises.map((franchise) => {
                                const features = franchise.features || {};
                                const isSaving = saving === franchise.id;

                                return (
                                    <tr key={franchise.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                                        <td className="p-4">
                                            <div>
                                                <p className="font-bold text-primary">{franchise.name || franchise.email}</p>
                                                <p className="text-body-sm text-tertiary">{franchise.email}</p>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-caption font-bold ${franchise.pack === 'premium'
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : 'bg-slate-100 text-slate-600'
                                                }`}>
                                                <div className={`w-2 h-2 rounded-full ${franchise.pack === 'premium' ? 'bg-emerald-500' : 'bg-slate-400'
                                                    }`} />
                                                {(franchise.pack || 'basic').toUpperCase()}
                                            </span>
                                        </td>

                                        {/* Downloads Toggle */}
                                        <td className="p-4 text-center">
                                            <button
                                                onClick={() => toggleFeature(franchise.id, 'downloads')}
                                                disabled={isSaving}
                                                className={`inline-flex items-center justify-center w-10 h-10 rounded-full transition-all ${features.downloads
                                                    ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'
                                                    : 'bg-red-100 text-red-600 hover:bg-red-200'
                                                    } disabled:opacity-50`}
                                            >
                                                {features.downloads ? <Check size={20} /> : <X size={20} />}
                                            </button>
                                        </td>

                                        {/* Actions */}
                                        <td className="p-4 text-center">
                                            <button
                                                onClick={() => applyPackDefaults(franchise.id)}
                                                disabled={isSaving}
                                                className="px-4 py-2 text-body-sm font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                                            >
                                                {isSaving ? 'Guardando...' : 'Reset Pack'}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {franchises.length === 0 && (
                    <div className="p-12 text-center text-tertiary">
                        <Shield className="w-16 h-16 mx-auto mb-4 opacity-30" />
                        <p className="text-h3">No hay franquicias registradas</p>
                        <p className="text-body-sm mt-2">Las franquicias aparecerán aquí cuando se registren</p>
                    </div>
                )}
            </div>

            {/* Help Section */}
            <div className="mt-6 surface-sunken rounded-xl p-6 border border-slate-200">
                <h3 className="text-h3 text-primary mb-3">ℹ️ Información</h3>
                <ul className="space-y-2 text-body-sm text-secondary">
                    <li>• <strong>Pack Basic</strong>: Sin features activadas por defecto (admin decide)</li>
                    <li>• <strong>Pack Premium</strong>: Todas las features activadas por defecto</li>
                    <li>• Puedes activar/desactivar individualmente cada feature</li>
                    <li>• &quot;Reset Pack&quot; restaura las features según el pack asignado</li>
                </ul>
            </div>
        </div>
    );
};

export default FranchiseFeatureManager;
