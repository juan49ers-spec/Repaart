import { useState, useEffect, useCallback } from 'react';
import { WeekService } from '../services/scheduler/weekService';
import { UserService } from '../services/users/userService';
import { FleetService } from '../services/fleetService';
import { shiftService } from '../services/shiftService';
import {
    WeekData,
    Shift,
    toFranchiseId,
    toWeekId
} from '../schemas/scheduler';
import { toLocalDateString, getStartOfWeek } from '../utils/dateUtils';

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
    contractHours?: number;
}

export interface Moto {
    id: string;
    licensePlate: string;
    model: string;
}

export const useWeeklySchedule = (franchiseIdString: string | null, _readOnly: boolean = false, externalDate?: Date) => {
    // STATE
    // Initialize strictly to the Monday of the current week to ensure alignment
    const [internalDate, setInternalDate] = useState<Date>(() => {
        const d = new Date();
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
        return new Date(d.setDate(diff));
    });
    const currentDate = externalDate || internalDate;

    const [weekData, setWeekData] = useState<WeekData | null>(null);
    const [riders, setRiders] = useState<Rider[]>([]);
    const [motos, setMotos] = useState<Moto[]>([]);
    const [loading, setLoading] = useState(true);

    // Derived properties
    // Ensure we always get the ISO Week ID for the MONDAY of the week
    const currentWeekIdString = getWeekIdFromDate(new Date(getStartOfWeek(currentDate)));

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

        if (!weekData || weekData.id !== currentWeekIdString) {
            setLoading(true);
        }

        // Convert to Branded Types for Service
        const fid = toFranchiseId(franchiseIdString);
        const wid = toWeekId(currentWeekIdString);

        // 1. Subscribe using WeekService (Metadata & Legacy)
        const unsubscribeWeek = WeekService.subscribeToWeek(franchiseIdString, currentWeekIdString, (data) => {
            if (data) {
                setWeekData(prev => {
                    if (prev && prev.id === currentWeekIdString) {
                        return { ...prev, ...data };
                    }
                    return data;
                });
            } else {
                // Initialize if not exists
                const startDate = toLocalDateString(getStartOfWeek(currentDate));
                WeekService.initWeek(fid, wid, startDate).then((initial) => {
                    if (initial) setWeekData(initial);
                });
            }
            if (data) setLoading(false); // Only unset loading if we have data, else wait for init
        });

        // 1.5 Subsrcibe to Real Shifts (Source of Truth: work_shifts collection)
        const startOfWeekString = getStartOfWeek(currentDate);

        // Parse "YYYY-MM-DD" safely to local midnight Date object
        const [y, m, d] = startOfWeekString.split('-').map(Number);
        const startOfWeekDate = new Date(y, m - 1, d, 0, 0, 0, 0);

        const endOfWeekDate = new Date(startOfWeekDate);
        endOfWeekDate.setDate(endOfWeekDate.getDate() + 6);
        endOfWeekDate.setHours(23, 59, 59, 999);

        const unsubscribeShifts = shiftService.subscribeToWeekShifts(
            franchiseIdString,
            startOfWeekDate,
            endOfWeekDate,
            (realShifts) => {
                setWeekData(prev => {
                    if (!prev) return null;
                    return {
                        ...prev,
                        shifts: realShifts // Override legacy shifts with real ones
                    };
                });
            }
        );

        // 2. Riders (via FleetService - Source of Truth for Riders)
        const unsubscribeRiders = FleetService.subscribeToRiders(franchiseIdString, (fleetRiders) => {
            const schedulerRiders = fleetRiders
                .filter(r => r.status === 'active')
                .map(r => ({
                    id: r.id,
                    fullName: r.fullName,
                    role: 'rider', // Fleet service riders are always riders
                    status: r.status,
                    contractHours: r.contractHours || 40 // Default to 40 if missing
                }));
            setRiders(schedulerRiders);
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
            unsubscribeWeek();
            unsubscribeShifts();
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

