import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

// =====================================================
// TYPES & INTERFACES
// =====================================================

export type PackType = 'basic' | 'premium' | 'admin';

export interface Features {
    downloads: boolean;
    ai_coach: boolean;
    simulations: boolean;
    [key: string]: boolean; // Allow additional feature flags
}

export interface UseFeatureAccessReturn {
    hasAccess: (featureName: string) => boolean;
    features: Features | null;
    pack: PackType | null;
    loading: boolean;
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Features por defecto según tipo de pack
 */
const getDefaultFeaturesByPack = (packType: PackType): Features => {
    const packs: Record<PackType, Features> = {
        basic: {
            downloads: false,
            ai_coach: false,
            simulations: false
        },
        premium: {
            downloads: true,
            ai_coach: true,
            simulations: true
        },
        admin: {
            downloads: true,
            ai_coach: true,
            simulations: true
        }
    };

    return packs[packType] || packs.basic;
};

// =====================================================
// HOOK
// =====================================================

/**
 * Hook para verificar acceso a features según permisos de franquicia
 */
export const useFeatureAccess = (): UseFeatureAccessReturn => {
    const { user, isAdmin, loading: authLoading } = useAuth();
    const [features, setFeatures] = useState<Features | null>(null);
    const [pack, setPack] = useState<PackType | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            setLoading(false);
            return;
        }

        const fetchUserFeatures = async () => {
            try {
                // ✅ Usar el check real de Admin del contexto (basado en Custom Claims/Config)
                if (isAdmin) {
                    setFeatures({
                        downloads: true,
                        ai_coach: true,
                        simulations: true
                    });
                    setPack('admin');
                    setLoading(false);
                    return;
                }

                // Buscar datos de franquicia
                // Use user.uid as primary franchise identifier
                const franchiseIdToFetch = user.uid;
                const franchiseDoc = await getDoc(doc(db, 'franchises', franchiseIdToFetch));

                if (franchiseDoc.exists()) {
                    const data = franchiseDoc.data();

                    // Si tiene features definidas, usarlas
                    if (data.features) {
                        setFeatures(data.features as Features);
                    } else {
                        // Crear features por defecto según pack
                        const packType = (data.pack as PackType) || 'basic';
                        const defaultFeatures = getDefaultFeaturesByPack(packType);
                        setFeatures(defaultFeatures);
                    }

                    setPack((data.pack as PackType) || 'basic');
                } else {
                    // Usuario sin franquicia registrada - asignar básico
                    const defaultFeatures = getDefaultFeaturesByPack('basic');
                    setFeatures(defaultFeatures);
                    setPack('basic');
                }

                setLoading(false);
            } catch (error) {
                console.error('Error fetching user features:', error);
                // En caso de error, dar acceso básico
                setFeatures(getDefaultFeaturesByPack('basic'));
                setPack('basic');
                setLoading(false);
            }
        };

        fetchUserFeatures();
    }, [user, isAdmin, authLoading]);

    /**
     * Verifica si el usuario tiene acceso a una feature específica
     */
    const hasAccess = (featureName: string): boolean => {
        if (loading) return false;
        if (!features) return false;
        return features[featureName] === true;
    };

    return {
        hasAccess,
        features,
        pack,
        loading
    };
};
