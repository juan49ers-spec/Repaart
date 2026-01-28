import { useState, useEffect, useCallback } from 'react';
import { doc, updateDoc, onSnapshot, increment } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../context/AuthContext';

export interface RiderGamification {
    userId: string;
    points: number;
    level: number;
    experience: number;
    experienceToNextLevel: number;
    achievementsUnlocked: string[];
    badges: string[];
    totalShifts: number;
    streakDays: number;
    currentStreak: number;
}

export interface AchievementRule {
    id: string;
    title: string;
    description: string;
    condition: (stats: RiderGamification) => boolean;
    points: number;
    badge?: string;
}

const LEVELS = [
    { level: 1, required: 0, title: 'Novato', color: '#94a3b8' },
    { level: 2, required: 100, title: 'Aprendiz', color: '#3b82f6' },
    { level: 3, required: 500, title: 'Hábil', color: '#8b5cf6' },
    { level: 4, required: 2000, title: 'Experto', color: '#d946ef' },
    { level: 5, required: 10000, title: 'Maestro', color: '#f59e0b' },
    { level: 6, required: 50000, title: 'Leyenda', color: '#f97316' },
];

const ACHIEVEMENTS: AchievementRule[] = [
    {
        id: 'first_shift',
        title: 'Primer Turno',
        description: 'Completa tu primer turno',
        condition: (stats) => stats.totalShifts >= 1,
        points: 50,
    },
    {
        id: 'ten_shifts',
        title: 'Diez Turnos',
        description: 'Completa 10 turnos',
        condition: (stats) => stats.totalShifts >= 10,
        points: 100,
    },
    {
        id: 'fifty_shifts',
        title: 'Medio Camino',
        description: 'Completa 50 turnos',
        condition: (stats) => stats.totalShifts >= 50,
        points: 500,
    },
    {
        id: 'hundred_shifts',
        title: 'Centurión',
        description: 'Completa 100 turnos',
        condition: (stats) => stats.totalShifts >= 100,
        points: 1000,
        badge: 'centurion',
    },
    {
        id: 'streak_7',
        title: 'Una Semana',
        description: 'Completa turnos por 7 días consecutivos',
        condition: (stats) => stats.currentStreak >= 7,
        points: 200,
    },
    {
        id: 'streak_30',
        title: 'Un Mes',
        description: 'Completa turnos por 30 días consecutivos',
        condition: (stats) => stats.currentStreak >= 30,
        points: 1000,
        badge: 'monthly_warrior',
    },
    {
        id: 'level_2',
        title: 'Nivel 2',
        description: 'Alcanza el nivel 2',
        condition: (stats) => stats.level >= 2,
        points: 0,
    },
    {
        id: 'level_3',
        title: 'Nivel 3',
        description: 'Alcanza el nivel 3',
        condition: (stats) => stats.level >= 3,
        points: 0,
    },
    {
        id: 'level_4',
        title: 'Nivel 4',
        description: 'Alcanza el nivel 4',
        condition: (stats) => stats.level >= 4,
        points: 0,
    },
    {
        id: 'level_5',
        title: 'Nivel 5',
        description: 'Alcanza el nivel 5',
        condition: (stats) => stats.level >= 5,
        points: 0,
    },
];

export const useRiderGamification = () => {
    const { user } = useAuth();
    const [gamification, setGamification] = useState<RiderGamification | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.uid) {
            setLoading(false);
            return;
        }

        const gamificationRef = doc(db, 'rider_gamification', user.uid);

        const unsubscribe = onSnapshot(gamificationRef, (docSnapshot) => {
            if (docSnapshot.exists()) {
                const data = docSnapshot.data() as RiderGamification;
                setGamification(data);
            } else {
                setGamification({
                    userId: user.uid,
                    points: 0,
                    level: 1,
                    experience: 0,
                    experienceToNextLevel: 100,
                    achievementsUnlocked: [],
                    badges: [],
                    totalShifts: 0,
                    streakDays: 0,
                    currentStreak: 0,
                });
            }
            setLoading(false);
        }, (error) => {
            console.error('Error loading gamification:', error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user?.uid]);

    const addPoints = useCallback(async (points: number) => {
        if (!user?.uid || !gamification) return;

        try {
            await updateDoc(doc(db, 'rider_gamification', user.uid), {
                points: increment(points),
                experience: increment(points),
            });

            setGamification(prev => prev ? {
                ...prev,
                points: prev.points + points,
                experience: prev.experience + points,
            } : null);
        } catch (error) {
            console.error('Error adding points:', error);
        }
    }, [user?.uid, gamification]);

    const incrementShifts = useCallback(async () => {
        if (!user?.uid || !gamification) return;

        try {
            await updateDoc(doc(db, 'rider_gamification', user.uid), {
                totalShifts: increment(1),
            });

            setGamification(prev => prev ? {
                ...prev,
                totalShifts: prev.totalShifts + 1,
            } : null);
        } catch (error) {
            console.error('Error incrementing shifts:', error);
        }
    }, [user?.uid, gamification]);

    const updateStreak = useCallback(async (workedToday: boolean) => {
        if (!user?.uid || !gamification) return;

        try {
            const updates: Record<string, unknown> = {};

            if (workedToday) {
                updates.currentStreak = increment(1);
                updates.streakDays = increment(1);
            } else {
                updates.currentStreak = 0;
            }

            await updateDoc(doc(db, 'rider_gamification', user.uid), updates);
        } catch (error) {
            console.error('Error updating streak:', error);
        }
    }, [user?.uid]);

    const getCurrentLevel = useCallback(() => {
        return LEVELS.find(l => l.level === gamification?.level) || LEVELS[0];
    }, [gamification?.level]);

    const getNextLevel = useCallback(() => {
        const currentLevelIndex = LEVELS.findIndex(l => l.level === gamification?.level);
        return LEVELS[currentLevelIndex + 1];
    }, [gamification?.level]);

    const getProgressToNextLevel = useCallback(() => {
        const next = getNextLevel();
        if (!next || !gamification) return 0;

        const currentLevelExp = LEVELS.find(l => l.level === gamification.level)?.required || 0;
        const expNeeded = next.required - currentLevelExp;

        if (expNeeded <= 0) return 0;

        return ((gamification.experience - currentLevelExp) / expNeeded) * 100;
    }, [gamification, getNextLevel]);



    const checkLevelUp = useCallback(async () => {
        if (!user?.uid || !gamification) return;

        const currentLevelIndex = LEVELS.findIndex(l => l.level === gamification.level);
        const nextLevel = LEVELS[currentLevelIndex + 1];

        if (nextLevel && gamification.experience >= nextLevel.required) {
            try {
                await updateDoc(doc(db, 'rider_gamification', user.uid), {
                    level: nextLevel.level,
                });

                setGamification(prev => prev ? {
                    ...prev,
                    level: nextLevel.level,
                } : null);
            } catch (error) {
                console.error('Error updating level:', error);
            }
        }
    }, [user?.uid, gamification]);

    useEffect(() => {
        if (gamification) {
            checkLevelUp();
        }
    }, [gamification, checkLevelUp]);

    const checkAchievements = useCallback(() => {
        if (!gamification) return;

        const unlocked = ACHIEVEMENTS.filter(achievement =>
            !gamification.achievementsUnlocked.includes(achievement.id) &&
            achievement.condition(gamification)
        );

        if (unlocked.length > 0) {
            const newUnlockedIds = unlocked.map(a => a.id);
            const totalPointsToAdd = unlocked.reduce((acc, a) => acc + a.points, 0);
            const newBadges = unlocked.map(a => a.badge).filter((b): b is string => !!b);

            updateDoc(doc(db, 'rider_gamification', gamification.userId), {
                achievementsUnlocked: [...gamification.achievementsUnlocked, ...newUnlockedIds],
                badges: newBadges,
                points: increment(totalPointsToAdd),
            });

            setGamification(prev => prev ? {
                ...prev,
                achievementsUnlocked: [...prev.achievementsUnlocked, ...newUnlockedIds],
                badges: newBadges,
                points: prev.points + totalPointsToAdd,
            } : null);
        }
    }, [gamification]);

    useEffect(() => {
        if (gamification) {
            checkAchievements();
        }
    }, [gamification, checkAchievements]);

    return {
        gamification,
        loading,
        unlockedAchievements: ACHIEVEMENTS.filter(a => gamification?.achievementsUnlocked.includes(a.id) || false),
        addPoints,
        incrementShifts,
        updateStreak,
        getCurrentLevel,
        getNextLevel,
        getProgressToNextLevel,
        LEVELS,
        ACHIEVEMENTS,
    };
};