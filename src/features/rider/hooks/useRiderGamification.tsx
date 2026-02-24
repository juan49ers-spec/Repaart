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
    const userId = user?.uid;
    const [gamification, setGamification] = useState<RiderGamification | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) {
            const timeoutId = setTimeout(() => {
                setLoading(false);
                setGamification(null);
            }, 0);
            return () => clearTimeout(timeoutId);
        }

        const gamificationRef = doc(db, 'rider_gamification', userId);

        const unsubscribe = onSnapshot(gamificationRef, (docSnapshot) => {
            if (docSnapshot.exists()) {
                const data = docSnapshot.data() as RiderGamification;
                setGamification(data);
            } else {
                setGamification({
                    userId: userId,
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
    }, [userId]);

    const addPoints = useCallback(async (points: number) => {
        if (!userId) return;

        try {
            await updateDoc(doc(db, 'rider_gamification', userId), {
                points: increment(points),
                experience: increment(points),
            });
        } catch (error) {
            console.error('Error adding points:', error);
        }
    }, [userId]);

    const incrementShifts = useCallback(async () => {
        if (!userId) return;

        try {
            await updateDoc(doc(db, 'rider_gamification', userId), {
                totalShifts: increment(1),
            });
        } catch (error) {
            console.error('Error incrementing shifts:', error);
        }
    }, [userId]);

    const updateStreak = useCallback(async (workedToday: boolean) => {
        if (!userId) return;

        try {
            const updates: Record<string, unknown> = {};

            if (workedToday) {
                updates.currentStreak = increment(1);
                updates.streakDays = increment(1);
            } else {
                updates.currentStreak = 0;
            }

            await updateDoc(doc(db, 'rider_gamification', userId), updates);
        } catch (error) {
            console.error('Error updating streak:', error);
        }
    }, [userId]);

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

    // Check for level ups and achievements
    useEffect(() => {
        if (!userId || !gamification) return;

        const checkUpdates = async () => {
            // Check Level Up
            const currentLevelIndex = LEVELS.findIndex(l => l.level === gamification.level);
            const nextLevel = LEVELS[currentLevelIndex + 1];

            if (nextLevel && gamification.experience >= nextLevel.required) {
                try {
                    await updateDoc(doc(db, 'rider_gamification', userId), {
                        level: nextLevel.level,
                    });
                } catch (error) {
                    console.error('Error updating level:', error);
                }
            }

            // Check Achievements
            const unlocked = ACHIEVEMENTS.filter(achievement =>
                !gamification.achievementsUnlocked.includes(achievement.id) &&
                achievement.condition(gamification)
            );

            if (unlocked.length > 0) {
                const newUnlockedIds = unlocked.map(a => a.id);
                const totalPointsToAdd = unlocked.reduce((acc, a) => acc + a.points, 0);
                const newBadges = unlocked.map(a => a.badge).filter((b): b is string => !!b);

                try {
                    await updateDoc(doc(db, 'rider_gamification', userId), {
                        achievementsUnlocked: [...gamification.achievementsUnlocked, ...newUnlockedIds],
                        badges: [...gamification.badges, ...newBadges],
                        points: increment(totalPointsToAdd),
                    });
                } catch (error) {
                    console.error('Error unlocking achievements:', error);
                }
            }
        };

        checkUpdates();
    }, [gamification, userId]);

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