import { useState, useEffect, useCallback, useMemo } from 'react';
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
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

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
      unsubscribe();
    };
  }, [franchiseId, date, refreshKey]);

  const refresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  // Memoizar cálculos para evitar recálculos innecesarios
  const memoizedWorkedHours = useMemo(() => workedHours, [JSON.stringify(workedHours)]);
  const memoizedMetrics = useMemo(() => metrics, [JSON.stringify(metrics)]);

  return {
    shifts,
    workedHours: memoizedWorkedHours,
    metrics: memoizedMetrics,
    loading,
    error,
    refresh
  };
}

export default useTimeControl;
