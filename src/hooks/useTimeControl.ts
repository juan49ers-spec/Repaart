import { useState, useEffect, useCallback } from 'react';
import { flyderIntegrationService, FlyderShift, WorkedHoursReport, FleetMetrics } from '../services/flyderIntegrationService';

interface UseTimeControlReturn {
  shifts: FlyderShift[];
  workedHours: WorkedHoursReport[];
  metrics: FleetMetrics | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

/**
 * Hook para Control Horario - Admin Flyder
 * 
 * Sincroniza turnos en tiempo real y calcula métricas
 * 
 * Usage:
 * ```typescript
 * const { shifts, workedHours, metrics, loading } = useTimeControl('franchise123', '2026-01-31');
 * ```
 */
export function useTimeControl(
  franchiseId: string,
  date: string
): UseTimeControlReturn {
  const [shifts, setShifts] = useState<FlyderShift[]>([]);
  const [workedHours, setWorkedHours] = useState<WorkedHoursReport[]>([]);
  const [metrics, setMetrics] = useState<FleetMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!franchiseId || !date) {
      const timeoutId = setTimeout(() => setLoading(false), 0);
      return () => clearTimeout(timeoutId);
    }

    const loadingTimeout = setTimeout(() => {
      setLoading(true);
      setError(null);
    }, 0);

    // Iniciar sincronización en tiempo real
    const unsubscribe = flyderIntegrationService.syncShiftsRealtime(
      franchiseId,
      date,
      (updatedShifts) => {
        setShifts(updatedShifts);

        // Calcular horas trabajadas
        const hours = flyderIntegrationService.calculateWorkedHours(updatedShifts);
        setWorkedHours(hours);

        // Calcular métricas
        const fleetMetrics = flyderIntegrationService.getFleetMetrics(updatedShifts);
        setMetrics(fleetMetrics);

        setLoading(false);
      }
    );

    return () => {
      clearTimeout(loadingTimeout);
      unsubscribe();
    };
  }, [franchiseId, date, refreshKey]);

  const refresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  return {
    shifts,
    workedHours,
    metrics,
    loading,
    error,
    refresh
  };
}

export default useTimeControl;
