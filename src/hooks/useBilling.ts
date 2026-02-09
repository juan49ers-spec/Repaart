import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  flyderIntegrationService,
  FranchiseBillingConfig,
  RiderMonthlyBilling,
  MonthlyClosure,
  FlyderShift,
  OrderData
} from '../services/flyderIntegrationService';
import { db } from '../lib/firebase';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';

interface UseBillingReturn {
  config: FranchiseBillingConfig | null;
  closure: MonthlyClosure | null;
  riders: RiderMonthlyBilling[];
  loading: boolean;
  error: string | null;
  saveConfig: (config: FranchiseBillingConfig) => Promise<void>;
  generateClosure: () => void;
  refresh: () => void;
}

/**
 * Hook para Facturación Automatizada - Admin Flyder
 * 
 * Proporciona gestión de facturación mensual:
 * - Configuración de tarifas por franquicia
 * - Cálculo automático de nóminas
 * - Cierres mensuales
 * 
 * Usage:
 * ```typescript
 * const { config, closure, riders, loading, saveConfig, generateClosure } = 
 *   useBilling('franchise123', '2026-01');
 * ```
 */
export function useBilling(
  franchiseId?: string,
  month: string = new Date().toISOString().slice(0, 7) // YYYY-MM
): UseBillingReturn {
  const [config, setConfig] = useState<FranchiseBillingConfig | null>(null);
  const [closure, setClosure] = useState<MonthlyClosure | null>(null);
  const [shifts, setShifts] = useState<FlyderShift[]>([]);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Cargar configuración de facturación
  useEffect(() => {
    if (!franchiseId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const configRef = doc(db, 'billing_configs', franchiseId);
    
    const unsubscribe = onSnapshot(
      configRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setConfig(docSnap.data() as FranchiseBillingConfig);
        } else {
          // Configuración por defecto
          setConfig({
            franchiseId,
            hourlyRateGross: 12.50,
            kmRate: 0.50,
            irpfRate: 15,
            otherDeductions: 0
          });
        }
        setLoading(false);
      },
      (err) => {
        setError(err instanceof Error ? err.message : 'Error cargando configuración');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [franchiseId]);

  // Sincronizar turnos y pedidos
  useEffect(() => {
    if (!franchiseId || !config) return;

    setLoading(true);

    // Calcular fechas del mes
    const startDate = `${month}-01`;
    const endDate = new Date(`${month}-01`);
    endDate.setMonth(endDate.getMonth() + 1);
    endDate.setDate(0); // Último día del mes
    const endDateStr = endDate.toISOString().split('T')[0];

    // Sincronizar turnos
    const unsubscribeShifts = flyderIntegrationService.syncShiftsRealtime(
      franchiseId,
      startDate,
      (newShifts) => {
        setShifts(newShifts);
      }
    );

    // Sincronizar pedidos desde Flyder
    const unsubscribeOrders = flyderIntegrationService.syncOrdersRealtime(
      franchiseId,
      startDate,
      endDateStr,
      (newOrders) => {
        setOrders(newOrders);
        setLoading(false);
      }
    );

    return () => {
      unsubscribeShifts();
      unsubscribeOrders();
    };
  }, [franchiseId, month, config, refreshKey]);

  // Guardar configuración
  const saveConfig = useCallback(async (newConfig: FranchiseBillingConfig) => {
    if (!franchiseId) return;

    try {
      const configRef = doc(db, 'billing_configs', franchiseId);
      await setDoc(configRef, newConfig);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error guardando configuración');
      throw err;
    }
  }, [franchiseId]);

  // Generar cierre mensual
  const generateClosure = useCallback(() => {
    if (!franchiseId || !config) return;

    try {
      const newClosure = flyderIntegrationService.generateMonthlyClosure(
        franchiseId,
        month,
        shifts,
        orders,
        config
      );
      setClosure(newClosure);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error generando cierre');
    }
  }, [franchiseId, month, shifts, orders, config]);

  // Refrescar datos
  const refresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  // Memoizar riders
  const riders = useMemo(() => {
    return closure?.riders || [];
  }, [closure]);

  return {
    config,
    closure,
    riders,
    loading,
    error,
    saveConfig,
    generateClosure,
    refresh
  };
}

export default useBilling;
