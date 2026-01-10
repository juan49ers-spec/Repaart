import { useState, useEffect, useCallback } from 'react';
import { WeekService } from '../services/scheduler/weekService';
import { UserService } from '../services/users/userService';
import { FleetService } from '../services/fleet/fleetService';
import {
    WeekData,
    Shift,
    toFranchiseId,
    toWeekId
} from '../schemas/scheduler';

// Helper exported for WeeklyScheduler (and now uses strict types if possible, or string for compat)
export const getWeekIdFromDate = (date: Date): string => {
    return WeekService.getWeekId(date); // Reuse logic from service to allow string return for UI compat

};

export type { Shift, WeekData }; // Re-export for components that consumed it from here

export interface Rider {
    id: string;
    fullName: string;
    role: string;
    status: string;
}

export interface Moto {
    id: string;
    licensePlate: string;
    model: string;
}

export const useWeeklySchedule = (franchiseIdString: string | null, _readOnly: boolean = false, externalDate?: Date) => {
    // STATE
    const [internalDate, setInternalDate] = useState<Date>(new Date());
    const currentDate = externalDate || internalDate;

    const [weekData, setWeekData] = useState<WeekData | null>(null);
    const [riders, setRiders] = useState<Rider[]>([]);
    const [motos, setMotos] = useState<Moto[]>([]);
    const [loading, setLoading] = useState(true);

    // Derived properties
    const currentWeekIdString = getWeekIdFromDate(currentDate);

    // NAVIGATION
    const navigateWeek = useCallback((direction: number) => {
        if (externalDate) {
            console.warn("Attempting to navigate internally controlled week while externalDate is provided.");
        }
        setInternalDate(prev => {
            const newDate = new Date(prev);
            newDate.setDate(prev.getDate() + (direction * 7));
            return newDate;
        });
    }, [externalDate]);

    // FETCH / SUBSCRIPTION
    useEffect(() => {
        if (!franchiseIdString) {
            setLoading(false);
            return;
        }

        setLoading(true);

        // Convert to Branded Types for Service
        const fid = toFranchiseId(franchiseIdString);
        const wid = toWeekId(currentWeekIdString);

        // 1. Subscribe using WeekService
        const unsubscribe = WeekService.subscribeToWeek(franchiseIdString, currentWeekIdString, (data) => {
            if (data) {
                setWeekData(data);
            } else {
                // Initialize if not exists
                const startDate = currentDate.toISOString().split('T')[0];
                WeekService.initWeek(fid, wid, startDate).then((initial) => {
                    setWeekData(initial || null);
                });
            }
            setLoading(false);
        });

        // 2. Riders (via UserService) - Filter by role AND active status
        const unsubscribeRiders = UserService.subscribeToUsers(toFranchiseId(franchiseIdString), undefined, (users) => {
            const drivers = users
                .filter(u => (u.role === 'driver' || u.role === 'staff') && u.status === 'active') // Only active riders
                .map(u => ({
                    ...u,
                    fullName: u.displayName || 'Sin Nombre' // UI compat
                } as unknown as Rider));
            setRiders(drivers);
        });

        // 3. Motos (via FleetService)
        const unsubscribeMotos = FleetService.subscribeToMotos(toFranchiseId(franchiseIdString), (domainMotos) => {
            // Adapt Domain Moto (plate) to UI Moto (licensePlate)
            const uiMotos = domainMotos.map(dm => ({
                ...dm,
                licensePlate: dm.plate // UI compatibility
            }));
            setMotos(uiMotos as unknown as Moto[]);
        });

        return () => {
            unsubscribe();
            unsubscribeRiders();
            unsubscribeMotos();
        };
    }, [franchiseIdString, currentWeekIdString, currentDate]);

    // ACTIONS
    const saveWeek = async (fidStr: string, widStr: string, data: any) => {
        // Validation boundary: input is primitive string, internal is Branded
        const fid = toFranchiseId(fidStr);
        const wid = toWeekId(widStr);
        return await WeekService.saveWeek(fid, wid, data);
    };

    const updateWeekData = (newData: WeekData) => setWeekData(newData);

    return {
        weekData,
        riders,
        motos,
        loading,
        currentDate,
        referenceDate: currentDate,
        navigateWeek,
        saveWeek,
        updateWeekData,
        refresh: () => { },
        currentWeekId: currentWeekIdString
    };
};

