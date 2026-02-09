/**
 * Flyder Integration Service
 * 
 * Integración con API de Flyder para sincronización de turnos
 * en tiempo real.
 * 
 * Modo: Solo lectura
 * Frecuencia: Real-time via Firestore listeners
 */

import { db } from '../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  Timestamp
} from 'firebase/firestore';

// Configuración API Flyder - Usar variables de entorno
// Las credenciales se configuran en:
// - Desarrollo: .env.local
// - Producción: GitHub Secrets
//
// Variables requeridas:
// VITE_FLYDER_API_HOST=api.flyder.app
// VITE_FLYDER_DATABASE=flyder_prod
// VITE_FLYDER_USER=repaart_dashboard
// VITE_FLYDER_PASSWORD=<token_seguro>

// Interfaces
export interface FlyderShift {
  id: string;
  riderId: string;
  riderName: string;
  franchiseId: string;
  startAt: Timestamp;
  endAt: Timestamp;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  type: string;
  motoId: string | null;
  motoPlate: string;
  source: 'flyder';
  lastSync: Timestamp;
}

export interface WorkedHoursReport {
  riderId: string;
  riderName: string;
  totalHours: number;
  shiftsCount: number;
  date: string;
}

export interface FleetMetrics {
  totalRiders: number;
  activeRiders: number;
  avgHoursPerRider: number;
  totalShifts: number;
  completedShifts: number;
}

// Nuevas interfaces para Fleet Intelligence
export interface RiderPerformance {
  riderId: string;
  riderName: string;
  shiftsCount: number;
  totalHours: number;
  avgShiftDuration: number;
  onTimeRate: number; // % de llegadas puntuales
  efficiency: number; // horas / turnos
}

export interface HourlyDemand {
  hour: number;
  activeRiders: number;
  avgShifts: number;
  demandLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface FranchiseCoverage {
  franchiseId: string;
  totalRiders: number;
  activeNow: number;
  coverageScore: number; // 0-100
  saturationRisk: boolean;
}

// Interfaces para Facturación
export interface FranchiseBillingConfig {
  franchiseId: string;
  hourlyRateGross: number; // Tarifa bruta por hora (incluye SS)
  kmRate: number; // Tarifa por km recorrido
  irpfRate: number; // % retención IRPF (ej: 15)
  otherDeductions?: number; // Otras deducciones fijas
}

export interface OrderData {
  id: string;
  riderId: string;
  distance: number; // km
  status: 'finished' | 'cancelled' | 'in_progress';
  finishedAt?: Timestamp;
  amount: number;
}

export interface RiderMonthlyBilling {
  riderId: string;
  riderName: string;
  month: string;
  year: number;
  
  // Horas
  totalHours: number;
  hourlyRateGross: number;
  hoursGrossAmount: number;
  
  // Pedidos
  totalOrders: number;
  totalDistance: number;
  kmRate: number;
  ordersGrossAmount: number;
  
  // Totales
  grossTotal: number;
  socialSecurity: number; // Gasto SS (calculado sobre bruto)
  irpfDeduction: number;
  otherDeductions: number;
  netTotal: number; // Líquido a percibir
}

export interface MonthlyClosure {
  month: string;
  year: number;
  franchiseId: string;
  riders: RiderMonthlyBilling[];
  summary: {
    totalRiders: number;
    totalHours: number;
    totalOrders: number;
    totalDistance: number;
    totalGross: number;
    totalNet: number;
  };
  generatedAt: Timestamp;
  status: 'draft' | 'confirmed' | 'paid';
}

export interface FleetIntelligenceReport {
  date: string;
  overallMetrics: FleetMetrics;
  topPerformers: RiderPerformance[];
  hourlyDemand: HourlyDemand[];
  franchiseCoverage: FranchiseCoverage[];
  alerts: FleetAlert[];
}

export interface FleetAlert {
  type: 'saturation' | 'understaffed' | 'overtime' | 'no_show';
  severity: 'low' | 'medium' | 'high' | 'critical';
  franchiseId?: string;
  riderId?: string;
  message: string;
  timestamp: Timestamp;
}

class FlyderIntegrationService {
  private unsubscribeListeners: Map<string, Function> = new Map();

  /**
   * Iniciar sincronización en tiempo real de turnos
   * Escucha cambios en work_shifts y los sincroniza con estado local
   */
  syncShiftsRealtime(
    franchiseId: string, 
    date: string,
    onUpdate: (shifts: FlyderShift[]) => void
  ): () => void {
    const q = query(
      collection(db, 'work_shifts'),
      where('franchiseId', '==', franchiseId),
      where('startAt', '>=', Timestamp.fromDate(new Date(date)))
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const shifts: FlyderShift[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        source: 'flyder',
        lastSync: Timestamp.now()
      })) as FlyderShift[];

      onUpdate(shifts);
    }, (error) => {
      console.error('Error syncing Flyder shifts:', error);
    });

    this.unsubscribeListeners.set(`${franchiseId}_${date}_shifts`, unsubscribe);
    return unsubscribe;
  }

  /**
   * Iniciar sincronización en tiempo real de pedidos
   * Escucha cambios en orders y los sincroniza con estado local
   */
  syncOrdersRealtime(
    franchiseId: string,
    startDate: string,
    endDate: string,
    onUpdate: (orders: OrderData[]) => void
  ): () => void {
    const q = query(
      collection(db, 'orders'),
      where('franchiseId', '==', franchiseId),
      where('createdAt', '>=', Timestamp.fromDate(new Date(startDate))),
      where('createdAt', '<=', Timestamp.fromDate(new Date(endDate + 'T23:59:59')))
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const orders: OrderData[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          riderId: data.riderId,
          distance: data.distance || 0,
          status: data.status || 'finished',
          finishedAt: data.finishedAt,
          amount: data.amount || 0
        };
      });

      onUpdate(orders);
    }, (error) => {
      console.error('Error syncing Flyder orders:', error);
    });

    this.unsubscribeListeners.set(`${franchiseId}_${startDate}_${endDate}_orders`, unsubscribe);
    return unsubscribe;
  }

  /**
   * Calcular horas trabajadas por rider en una fecha
   */
  calculateWorkedHours(shifts: FlyderShift[]): WorkedHoursReport[] {
    const reports = new Map<string, WorkedHoursReport>();

    shifts.forEach(shift => {
      if (shift.status === 'completed' || shift.status === 'active') {
        const start = shift.startAt.toDate();
        const end = shift.endAt.toDate();
        const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

        const existing = reports.get(shift.riderId);
        if (existing) {
          existing.totalHours += hours;
          existing.shiftsCount += 1;
        } else {
          reports.set(shift.riderId, {
            riderId: shift.riderId,
            riderName: shift.riderName,
            totalHours: hours,
            shiftsCount: 1,
            date: start.toISOString().split('T')[0]
          });
        }
      }
    });

    return Array.from(reports.values());
  }

  /**
   * Obtener métricas de flota para dashboard
   */
  getFleetMetrics(shifts: FlyderShift[]): FleetMetrics {
    const uniqueRiders = new Set(shifts.map(s => s.riderId));
    const activeRiders = shifts.filter(s => s.status === 'active').length;
    const completedShifts = shifts.filter(s => s.status === 'completed').length;
    
    const totalHours = shifts.reduce((acc, shift) => {
      if (shift.status === 'completed' || shift.status === 'active') {
        const hours = (shift.endAt.toDate().getTime() - shift.startAt.toDate().getTime()) / (1000 * 60 * 60);
        return acc + hours;
      }
      return acc;
    }, 0);

    return {
      totalRiders: uniqueRiders.size,
      activeRiders,
      avgHoursPerRider: uniqueRiders.size > 0 ? totalHours / uniqueRiders.size : 0,
      totalShifts: shifts.length,
      completedShifts
    };
  }

  /**
   * Detectar incidencias en turnos
   */
  detectIncidents(shifts: FlyderShift[]): Array<{
    riderId: string;
    riderName: string;
    type: 'late_arrival' | 'early_departure' | 'no_show';
    shiftId: string;
    scheduledStart: Date;
    actualStart?: Date;
  }> {
    const incidents: Array<{
      riderId: string;
      riderName: string;
      type: 'late_arrival' | 'early_departure' | 'no_show';
      shiftId: string;
      scheduledStart: Date;
      actualStart?: Date;
    }> = [];

    const now = new Date();

    shifts.forEach(shift => {
      const scheduledStart = shift.startAt.toDate();
      
      // No show: turno scheduled pero ya pasó la hora de inicio + 15 min
      if (shift.status === 'scheduled' && now > new Date(scheduledStart.getTime() + 15 * 60000)) {
        incidents.push({
          riderId: shift.riderId,
          riderName: shift.riderName,
          type: 'no_show',
          shiftId: shift.id,
          scheduledStart
        });
      }
    });

    return incidents;
  }

  /**
   * Calcular facturación basada en horas trabajadas
   */
  calculateBilling(
    workedHours: WorkedHoursReport[], 
    hourlyRate: number = 10
  ): Array<{
    riderId: string;
    riderName: string;
    hoursWorked: number;
    amount: number;
    shiftsCount: number;
  }> {
    return workedHours.map(report => ({
      riderId: report.riderId,
      riderName: report.riderName,
      hoursWorked: Math.round(report.totalHours * 100) / 100,
      amount: Math.round(report.totalHours * hourlyRate * 100) / 100,
      shiftsCount: report.shiftsCount
    }));
  }

  /**
   * Calcular rendimiento de riders (Fleet Intelligence)
   */
  calculateRiderPerformance(shifts: FlyderShift[]): RiderPerformance[] {
    const riderStats = new Map<string, {
      riderName: string;
      shifts: FlyderShift[];
      totalHours: number;
      onTimeCount: number;
    }>();

    shifts.forEach(shift => {
      if (shift.status === 'completed' || shift.status === 'active') {
        const existing = riderStats.get(shift.riderId);
        const hours = (shift.endAt.toDate().getTime() - shift.startAt.toDate().getTime()) / (1000 * 60 * 60);
        
        if (existing) {
          existing.shifts.push(shift);
          existing.totalHours += hours;
          // Simulación: rider puntual si el turno está completado
          if (shift.status === 'completed') existing.onTimeCount++;
        } else {
          riderStats.set(shift.riderId, {
            riderName: shift.riderName,
            shifts: [shift],
            totalHours: hours,
            onTimeCount: shift.status === 'completed' ? 1 : 0
          });
        }
      }
    });

    return Array.from(riderStats.entries()).map(([riderId, stats]) => ({
      riderId,
      riderName: stats.riderName,
      shiftsCount: stats.shifts.length,
      totalHours: Math.round(stats.totalHours * 100) / 100,
      avgShiftDuration: Math.round((stats.totalHours / stats.shifts.length) * 100) / 100,
      onTimeRate: Math.round((stats.onTimeCount / stats.shifts.length) * 100),
      efficiency: Math.round((stats.totalHours / stats.shifts.length) * 100) / 100
    })).sort((a, b) => b.efficiency - a.efficiency);
  }

  /**
   * Analizar demanda por hora (Fleet Intelligence)
   */
  analyzeHourlyDemand(shifts: FlyderShift[]): HourlyDemand[] {
    const hourlyStats = new Map<number, { activeRiders: Set<string>; shiftCount: number }>();

    // Inicializar todas las horas del día
    for (let i = 0; i < 24; i++) {
      hourlyStats.set(i, { activeRiders: new Set(), shiftCount: 0 });
    }

    shifts.forEach(shift => {
      const startHour = shift.startAt.toDate().getHours();
      const endHour = shift.endAt.toDate().getHours();

      for (let hour = startHour; hour <= endHour; hour++) {
        const stats = hourlyStats.get(hour);
        if (stats) {
          stats.activeRiders.add(shift.riderId);
          stats.shiftCount++;
        }
      }
    });

    return Array.from(hourlyStats.entries()).map(([hour, stats]) => {
      const avgShifts = stats.shiftCount / (shifts.length || 1);
      let demandLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
      
      if (avgShifts > 0.8) demandLevel = 'critical';
      else if (avgShifts > 0.5) demandLevel = 'high';
      else if (avgShifts > 0.2) demandLevel = 'medium';

      return {
        hour,
        activeRiders: stats.activeRiders.size,
        avgShifts: Math.round(avgShifts * 100) / 100,
        demandLevel
      };
    });
  }

  /**
   * Calcular cobertura por franquicia (Fleet Intelligence)
   */
  calculateFranchiseCoverage(shifts: FlyderShift[]): FranchiseCoverage[] {
    const franchiseStats = new Map<string, {
      totalRiders: Set<string>;
      activeNow: number;
      totalShifts: number;
    }>();

    const now = new Date();

    shifts.forEach(shift => {
      const existing = franchiseStats.get(shift.franchiseId);
      const isActiveNow = shift.status === 'active' || 
        (shift.status === 'scheduled' && shift.startAt.toDate() <= now && shift.endAt.toDate() >= now);

      if (existing) {
        existing.totalRiders.add(shift.riderId);
        if (isActiveNow) existing.activeNow++;
        existing.totalShifts++;
      } else {
        franchiseStats.set(shift.franchiseId, {
          totalRiders: new Set([shift.riderId]),
          activeNow: isActiveNow ? 1 : 0,
          totalShifts: 1
        });
      }
    });

    return Array.from(franchiseStats.entries()).map(([franchiseId, stats]) => {
      const coverageScore = Math.round((stats.activeNow / stats.totalRiders.size) * 100);
      const saturationRisk = coverageScore > 90; // Alerta si casi todos están ocupados

      return {
        franchiseId,
        totalRiders: stats.totalRiders.size,
        activeNow: stats.activeNow,
        coverageScore,
        saturationRisk
      };
    });
  }

  /**
   * Generar reporte completo de Fleet Intelligence
   */
  generateFleetIntelligenceReport(
    shifts: FlyderShift[],
    franchiseId?: string
  ): FleetIntelligenceReport {
    const filteredShifts = franchiseId 
      ? shifts.filter(s => s.franchiseId === franchiseId)
      : shifts;

    const overallMetrics = this.getFleetMetrics(filteredShifts);
    const topPerformers = this.calculateRiderPerformance(filteredShifts).slice(0, 10);
    const hourlyDemand = this.analyzeHourlyDemand(filteredShifts);
    const franchiseCoverage = this.calculateFranchiseCoverage(filteredShifts);

    // Generar alertas
    const alerts: FleetAlert[] = [];
    
    // Alerta de saturación
    franchiseCoverage.forEach(fc => {
      if (fc.saturationRisk) {
        alerts.push({
          type: 'saturation',
          severity: 'high',
          franchiseId: fc.franchiseId,
          message: `Franquicia ${fc.franchiseId} tiene ${fc.coverageScore}% de cobertura. Riesgo de saturación.`,
          timestamp: Timestamp.now()
        });
      }
    });

    // Alerta de understaffed
    hourlyDemand.forEach(hd => {
      if (hd.demandLevel === 'critical' && hd.activeRiders < 3) {
        alerts.push({
          type: 'understaffed',
          severity: 'critical',
          message: `Hora ${hd.hour}:00 - Demanda crítica con solo ${hd.activeRiders} riders activos`,
          timestamp: Timestamp.now()
        });
      }
    });

    return {
      date: new Date().toISOString().split('T')[0],
      overallMetrics,
      topPerformers,
      hourlyDemand,
      franchiseCoverage,
      alerts
    };
  }

  /**
   * Calcular facturación mensual completa de un rider
   */
  calculateRiderMonthlyBilling(
    riderId: string,
    riderName: string,
    shifts: FlyderShift[],
    orders: OrderData[],
    config: FranchiseBillingConfig
  ): RiderMonthlyBilling {
    // Calcular horas trabajadas
    const riderShifts = shifts.filter(s => s.riderId === riderId);
    const totalHours = riderShifts.reduce((acc, shift) => {
      if (shift.status === 'completed' || shift.status === 'active') {
        const hours = (shift.endAt.toDate().getTime() - shift.startAt.toDate().getTime()) / (1000 * 60 * 60);
        return acc + hours;
      }
      return acc;
    }, 0);

    // Calcular pedidos y distancia
    const riderOrders = orders.filter(o => o.riderId === riderId && o.status === 'finished');
    const totalOrders = riderOrders.length;
    const totalDistance = riderOrders.reduce((acc, order) => acc + order.distance, 0);

    // Cálculos de facturación
    const hoursGrossAmount = totalHours * config.hourlyRateGross;
    const ordersGrossAmount = totalDistance * config.kmRate;
    const grossTotal = hoursGrossAmount + ordersGrossAmount;

    // Deducciones
    const socialSecurity = grossTotal * 0.3; // 30% aproximado SS (patronal + obrera)
    const irpfDeduction = grossTotal * (config.irpfRate / 100);
    const otherDeductions = config.otherDeductions || 0;
    const totalDeductions = socialSecurity + irpfDeduction + otherDeductions;

    const netTotal = grossTotal - totalDeductions;

    return {
      riderId,
      riderName,
      month: new Date().toISOString().slice(0, 7), // YYYY-MM
      year: new Date().getFullYear(),
      totalHours: Math.round(totalHours * 100) / 100,
      hourlyRateGross: config.hourlyRateGross,
      hoursGrossAmount: Math.round(hoursGrossAmount * 100) / 100,
      totalOrders,
      totalDistance: Math.round(totalDistance * 100) / 100,
      kmRate: config.kmRate,
      ordersGrossAmount: Math.round(ordersGrossAmount * 100) / 100,
      grossTotal: Math.round(grossTotal * 100) / 100,
      socialSecurity: Math.round(socialSecurity * 100) / 100,
      irpfDeduction: Math.round(irpfDeduction * 100) / 100,
      otherDeductions,
      netTotal: Math.round(netTotal * 100) / 100
    };
  }

  /**
   * Generar cierre mensual de facturación
   */
  generateMonthlyClosure(
    franchiseId: string,
    month: string, // YYYY-MM
    shifts: FlyderShift[],
    orders: OrderData[],
    config: FranchiseBillingConfig
  ): MonthlyClosure {
    // Obtener riders únicos
    const uniqueRiders = new Map<string, string>(); // riderId -> riderName
    shifts.forEach(s => {
      if (!uniqueRiders.has(s.riderId)) {
        uniqueRiders.set(s.riderId, s.riderName);
      }
    });

    // Calcular facturación para cada rider
    const riders: RiderMonthlyBilling[] = [];
    uniqueRiders.forEach((riderName, riderId) => {
      const billing = this.calculateRiderMonthlyBilling(
        riderId,
        riderName,
        shifts,
        orders,
        config
      );
      riders.push(billing);
    });

    // Calcular resumen
    const summary = {
      totalRiders: riders.length,
      totalHours: riders.reduce((acc, r) => acc + r.totalHours, 0),
      totalOrders: riders.reduce((acc, r) => acc + r.totalOrders, 0),
      totalDistance: riders.reduce((acc, r) => acc + r.totalDistance, 0),
      totalGross: riders.reduce((acc, r) => acc + r.grossTotal, 0),
      totalNet: riders.reduce((acc, r) => acc + r.netTotal, 0)
    };

    return {
      month,
      year: parseInt(month.split('-')[0]),
      franchiseId,
      riders,
      summary: {
        totalRiders: summary.totalRiders,
        totalHours: Math.round(summary.totalHours * 100) / 100,
        totalOrders: summary.totalOrders,
        totalDistance: Math.round(summary.totalDistance * 100) / 100,
        totalGross: Math.round(summary.totalGross * 100) / 100,
        totalNet: Math.round(summary.totalNet * 100) / 100
      },
      generatedAt: Timestamp.now(),
      status: 'draft'
    };
  }

  /**
   * Limpiar listeners cuando el componente se desmonta
   */
  cleanup(): void {
    this.unsubscribeListeners.forEach(unsubscribe => unsubscribe());
    this.unsubscribeListeners.clear();
  }
}

export const flyderIntegrationService = new FlyderIntegrationService();
export default flyderIntegrationService;
