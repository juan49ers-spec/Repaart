import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export type AnimationStyle = 'static' | 'pulse' | 'marquee' | 'wave' | 'glow';
export type BannerSize = 'compact' | 'normal' | 'large';

export interface BannerData {
    title: string;
    subtitle: string;
    linkUrl: string;
    linkText: string;
    isActive: boolean;
    bgColor: 'indigo' | 'emerald' | 'amber' | 'rose' | 'slate';
    // New animation options
    animationStyle: AnimationStyle;
    animationSpeed: 'slow' | 'normal' | 'fast';
    showParticles: boolean;
    bannerSize: BannerSize;
    showIcon: boolean;
    updatedAt?: string;
}

const DEFAULT_BANNER: BannerData = {
    title: 'Nuevo Marketplace',
    subtitle: 'Accede a servicios exclusivos para maximizar tu rentabilidad.',
    linkUrl: '/support',
    linkText: 'Ver Catálogo',
    isActive: true,
    bgColor: 'indigo',
    animationStyle: 'pulse',
    animationSpeed: 'normal',
    showParticles: true,
    bannerSize: 'normal',
    showIcon: true
};

export const useBanner = () => {
    const [banner, setBanner] = useState<BannerData>(DEFAULT_BANNER);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onSnapshot(
            doc(db, 'settings', 'banner'),
            (snapshot) => {
                if (snapshot.exists()) {
                    setBanner({ ...DEFAULT_BANNER, ...snapshot.data() } as BannerData);
                } else {
                    setBanner(DEFAULT_BANNER);
                }
                setLoading(false);
            },
            (error) => {
                console.error('Error loading banner:', error);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, []);

    return { banner, loading };
};
