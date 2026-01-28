import { useState, useEffect } from 'react';
import { doc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../context/AuthContext';

export interface AvailabilitySlot {
    morning: boolean;
    afternoon: boolean;
    evening: boolean;
}

export interface AvailabilitySlot {
    morning: boolean;
    afternoon: boolean;
    evening: boolean;
}

export interface UserPreferences {
    userId: string;
    availability: 'available' | 'busy';
    weeklyGoalHours: number;
    preferredShiftTypes: ('day' | 'night')[];
    weeklyAvailability: {
        monday: AvailabilitySlot;
        tuesday: AvailabilitySlot;
        wednesday: AvailabilitySlot;
        thursday: AvailabilitySlot;
        friday: AvailabilitySlot;
        saturday: AvailabilitySlot;
        sunday: AvailabilitySlot;
    };
    notifications: {
        email: boolean;
        push: boolean;
        newShift: boolean;
        changes: boolean;
        weeklySummary: boolean;
        summaryFrequency: 'daily' | 'weekly';
    };
}

export type DayOfWeek = keyof UserPreferences['weeklyAvailability'];
export type PeriodOfDay = keyof AvailabilitySlot;

const defaultAvailability: AvailabilitySlot = {
    morning: false,
    afternoon: false,
    evening: false,
};

const defaultPreferences: Omit<UserPreferences, 'userId'> = {
    availability: 'available',
    weeklyGoalHours: 40,
    preferredShiftTypes: ['day', 'night'],
    weeklyAvailability: {
        monday: defaultAvailability,
        tuesday: defaultAvailability,
        wednesday: defaultAvailability,
        thursday: defaultAvailability,
        friday: defaultAvailability,
        saturday: defaultAvailability,
        sunday: defaultAvailability,
    },
    notifications: {
        email: false,
        push: true,
        newShift: true,
        changes: true,
        weeklySummary: true,
        summaryFrequency: 'weekly',
    },
};

export const useRiderPreferences = () => {
    const { user } = useAuth();
    const [preferences, setPreferences] = useState<UserPreferences | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user?.uid) {
            setLoading(false);
            return;
        }

        const preferencesRef = doc(db, 'user_preferences', user.uid);

        const unsubscribe = onSnapshot(
            preferencesRef,
            (docSnapshot) => {
                if (docSnapshot.exists()) {
                    setPreferences({ userId: user.uid, ...docSnapshot.data() } as UserPreferences);
                } else {
                    setPreferences({ userId: user.uid, ...defaultPreferences });
                }
                setLoading(false);
            },
            (err) => {
                console.error('Error fetching preferences:', err);
                setError('Error al cargar preferencias');
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [user?.uid]);

    const updatePreferences = async (updates: Partial<UserPreferences>) => {
        if (!user?.uid) {
            console.error('No user logged in');
            return;
        }

        try {
            const preferencesRef = doc(db, 'user_preferences', user.uid);

            if (preferences) {
                await updateDoc(preferencesRef, updates);
            } else {
                await setDoc(preferencesRef, { userId: user.uid, ...defaultPreferences, ...updates });
            }

            setPreferences((prev) => prev ? { ...prev, ...updates } : null);
        } catch (err) {
            console.error('Error updating preferences:', err);
            setError('Error al actualizar preferencias');
        }
    };

    const updateNotificationPreference = async (
        key: keyof UserPreferences['notifications'],
        value: boolean | 'daily' | 'weekly'
    ) => {
        const currentNotifications = preferences?.notifications || defaultPreferences.notifications;
        await updatePreferences({
            notifications: {
                ...currentNotifications,
                [key]: value,
            },
        });
    };

    const updateAvailabilitySlot = async (
        day: keyof UserPreferences['weeklyAvailability'],
        period: keyof AvailabilitySlot,
        enabled: boolean
    ) => {
        const currentWeeklyAvailability = preferences?.weeklyAvailability || defaultPreferences.weeklyAvailability;
        await updatePreferences({
            weeklyAvailability: {
                ...currentWeeklyAvailability,
                [day]: {
                    ...currentWeeklyAvailability[day],
                    [period]: enabled,
                },
            },
        });
    };

    const toggleAvailabilitySlot = async (
        day: keyof UserPreferences['weeklyAvailability'],
        period: keyof AvailabilitySlot
    ) => {
        const currentSlot = preferences?.weeklyAvailability?.[day] || defaultAvailability;
        await updateAvailabilitySlot(day, period, !currentSlot[period]);
    };

    const updateWeeklyGoal = async (hours: number) => {
        await updatePreferences({ weeklyGoalHours: hours });
    };

    const toggleAvailability = async () => {
        const currentAvailability = preferences?.availability || defaultPreferences.availability;
        await updatePreferences({
            availability: currentAvailability === 'available' ? 'busy' : 'available',
        });
    };

    return {
        preferences,
        loading,
        error,
        updatePreferences,
        updateNotificationPreference,
        updateAvailabilitySlot,
        toggleAvailabilitySlot,
        updateWeeklyGoal,
        toggleAvailability,
    };
};