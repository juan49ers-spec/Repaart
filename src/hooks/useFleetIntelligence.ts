import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  flyderIntegrationService, 
  FleetIntelligenceReport,
  RiderPerformance,
  HourlyDemand,
  FranchiseCoverage,
  FleetAlert
} from '../services/flyderIntegrationService';

interface UseFleetIntelligenceReturn {
  report: FleetIntelligenceReport | null;
  topPerformers: RiderPerformance[];
  hourlyDemand: HourlyDemand[];
  franchiseCoverage: FranchiseCoverage[];
  alerts: FleetAlert[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

/**
 * Hook para Fleet Intelligence - Admin Flyder
 * 
 * Proporciona análisis avanzado de la flota:
 * - Rendimiento de riders
 * - Demanda por hora
 * - Cobertura por franquicia
 * - Alertas de operación
 * 
 * Usage:
 * ```typescript
 * const { report, topPerformers, alerts, loading } = useFleetIntelligence('franchise123', '2026-01-31');
 * ```
 */
export function useFleetIntelligence(
  franchiseId?: string,
  date: string = new Date().toISOString().split('T')[0]
): UseFleetIntelligenceReturn {
  const [report, setReport] = useState<FleetIntelligenceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError(null);

    // Iniciar sincronización en tiempo real
    const unsubscribe = flyderIntegrationService.syncShiftsRealtime(
      franchiseId || '',
      date,
      (shifts) => {
        try {
          const newReport = flyderIntegrationService.generateFleetIntelligenceReport(
            shifts,
            franchiseId
          );
          setReport(newReport);
          setLoading(false);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Error generando reporte');
          setLoading(false);
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [franchiseId, date, refreshKey]);

  const refresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  // Memoizar datos para evitar recálculos
  const memoizedData = useMemo(() => {
    if (!report) {
      return {
        topPerformers: [],
        hourlyDemand: [],
        franchiseCoverage: [],
        alerts: []
      };
    }

    return {
      topPerformers: report.topPerformers,
      hourlyDemand: report.hourlyDemand,
      franchiseCoverage: report.franchiseCoverage,
      alerts: report.alerts
    };
  }, [report]);

  return {
    report,
    topPerformers: memoizedData.topPerformers,
    hourlyDemand: memoizedData.hourlyDemand,
    franchiseCoverage: memoizedData.franchiseCoverage,
    alerts: memoizedData.alerts,
    loading,
    error,
    refresh
  };
}

export default useFleetIntelligence;
