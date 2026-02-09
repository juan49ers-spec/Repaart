import { useEffect } from 'react';
import { useWeeklySchedule } from '../../../hooks/useWeeklySchedule';
import { useFleetStore } from '../../../store/useFleetStore';
import { useVehicleStore } from '../../../store/useVehicleStore';

export const useSchedulerData = (
    franchiseId: string,
    selectedDate: Date,
    readOnly?: boolean
) => {
    const { riders: rosterRiders, fetchRiders } = useFleetStore();
    const { vehicles, fetchVehicles } = useVehicleStore();
    const { weekData, loading, motos, riders: scheduleRiders } = useWeeklySchedule(franchiseId, readOnly, selectedDate);

    useEffect(() => {
        if (franchiseId) {
            fetchRiders(franchiseId);
            fetchVehicles(franchiseId);
        }
    }, [franchiseId, fetchRiders, fetchVehicles]);

    return {
        rosterRiders,
        vehicles,
        weekData,
        loading,
        motos,
        scheduleRiders
    };
};
