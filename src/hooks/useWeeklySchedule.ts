import { useState, useEffect, useCallback } from 'react';
import { WeekService } from '../services/scheduler/weekService';
import { FleetService } from '../services/fleetService';
import { shiftService } from '../services/shiftService';
import {
    WeekData,
    Shift,
    toFranchiseId,
    toWeekId
} from '../schemas/scheduler';
import { toLocalDateString, getStartOfWeek } from '../utils/dateUtils';

// Helper exported for WeeklyScheduler
export const getWeekIdFromDate = (date: Date): string => {
    return WeekService.getWeekId(date);
};

export type { Shift, WeekData };

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
    // 🔥 PROBE: TOP LEVEL HOOK FIRE 🔥
    console.log('[useWeeklySchedule] Executing for franchise:', franchiseIdString);

    // STATE
    // Initialize strictly to the Monday of the current week to ensure alignment
    const [internalDate, setInternalDate] = useState<Date>(() => {
        const d = new Date();
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
        return new Date(d.setDate(diff));
    });
    const currentDate = externalDate || internalDate;

    // 🔥 DUAL STATE PATTERN: Metadata from WeekService vs Shifts from ShiftService 🔥
    const [docData, setDocData] = useState<WeekData | null>(null);
    const [liveShifts, setLiveShifts] = useState<Shift[] | null>(null);

    // Combined State
    const [weekData, setWeekData] = useState<WeekData | null>(null);

    const [riders, setRiders] = useState<Rider[]>([]);
    const [motos, setMotos] = useState<Moto[]>([]);
    const [loading, setLoading] = useState(true);

    // Derived properties
    const currentWeekIdString = getWeekIdFromDate(new Date(getStartOfWeek(currentDate)));

    // NAVIGATION
    const navigateWeek = useCallback((direction: number) => {
        if (externalDate) {
            console.warn("[useWeeklySchedule] Attempting to navigate internally while externalDate is provided.");
        }
        setInternalDate(prev => {
            const newDate = new Date(prev);
            newDate.setDate(prev.getDate() + (direction * 7));
            return newDate;
        });
    }, [externalDate]);


    // State management and loading synchronization
    const [prevFranchiseId, setPrevFranchiseId] = useState(franchiseIdString);
    const [prevWeekId, setPrevWeekId] = useState(currentWeekIdString);

    if (franchiseIdString !== prevFranchiseId || currentWeekIdString !== prevWeekId) {
        setPrevFranchiseId(franchiseIdString);
        setPrevWeekId(currentWeekIdString);
        setLoading(!!franchiseIdString); // If no franchise, not loading. If franchise, start loading.
        setDocData(null);
        setLiveShifts(null);
    }
    // Sync weekData whenever docData or liveShifts change
    const [prevDocData, setPrevDocData] = useState<WeekData | null>(null);
    const [prevLiveShifts, setPrevLiveShifts] = useState<Shift[] | null>(null);

    if (docData !== prevDocData || liveShifts !== prevLiveShifts) {
        setPrevDocData(docData);
        setPrevLiveShifts(liveShifts);

        if (docData && liveShifts) {
            // Priority: Live Shifts from collection. If empty but docData has shifts, it might be legacy
            const effectiveShifts = (liveShifts.length > 0) ? liveShifts : (docData.shifts || []);
            setWeekData({ ...docData, shifts: effectiveShifts });
        } else if (docData) {
            setWeekData(docData);
        } else if (weekData !== null) {
            setWeekData(null);
        }
    }
    // Subscription Effect
    useEffect(() => {
        if (!franchiseIdString) {
            return;
        }

        const fid = toFranchiseId(franchiseIdString);
        const wid = toWeekId(currentWeekIdString);

        console.log(`[useWeeklySchedule] Subscribing to Week: ${wid} for Franchise: ${fid}`);

        // 1. Subscribe using WeekService (Metadata & Legacy)
        const unsubscribeWeek = WeekService.subscribeToWeek(franchiseIdString, currentWeekIdString, (data) => {
            if (data) {
                setDocData(data);
                setLoading(false);
            } else {
                // Initialize if not exists
                const startDate = toLocalDateString(getStartOfWeek(currentDate));
                WeekService.initWeek(fid, wid, startDate).then((initial) => {
                    if (initial) setDocData(initial);
                    setLoading(false);
                }).catch(err => {
                    console.error("[useWeeklySchedule] Error initializing week:", err);
                    setLoading(false);
                });
            }
        });

        // 1.5 Subscribe to Real Shifts (Source of Truth)
        const startOfWeekString = getStartOfWeek(currentDate);
        const [y, m, d] = startOfWeekString.split('-').map(Number);
        const startOfWeekDate = new Date(y, m - 1, d, 0, 0, 0, 0);

        const searchStart = new Date(startOfWeekDate);
        searchStart.setDate(searchStart.getDate() - 1);
        const searchEnd = new Date(startOfWeekDate);
        searchEnd.setDate(searchEnd.getDate() + 8);

        const unsubscribeShifts = shiftService.subscribeToWeekShifts(
            franchiseIdString,
            searchStart,
            searchEnd,
            (shifts) => {
                setLiveShifts(shifts || []);
                setLoading(false);
            }
        );

        // 2. Riders
        const unsubscribeRiders = FleetService.subscribeToRiders(franchiseIdString, (fleetRiders) => {
            const schedulerRiders = fleetRiders
                .filter(r => r.status === 'active' || r.status === 'on_route')
                .map(r => ({
                    id: r.id,
                    fullName: r.fullName,
                    role: 'rider',
                    status: r.status,
                    contractHours: r.contractHours || 40
                }));
            setRiders(schedulerRiders);
            // Don't set loading false here alone as we need the grid structure mostly from Week doc or Shifts
        });

        // 3. Motos
        const unsubscribeMotos = FleetService.subscribeToMotos(fid, (domainMotos) => {
            const uiMotos = domainMotos.map(dm => ({
                ...dm,
                licensePlate: dm.plate
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
    const saveWeek = async (fidStr: string, widStr: string, data: Partial<WeekData>) => {
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
