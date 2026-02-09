import { describe, it, expect } from 'vitest';
import { flyderIntegrationService } from '../flyderIntegrationService';
import { Timestamp } from 'firebase/firestore';

describe('Fleet Intelligence Features', () => {
  const mockShifts = [
    {
      id: 'shift1',
      riderId: 'rider1',
      riderName: 'Juan Pérez',
      franchiseId: 'franchise1',
      startAt: Timestamp.fromDate(new Date('2026-01-31T08:00:00')),
      endAt: Timestamp.fromDate(new Date('2026-01-31T16:00:00')),
      status: 'completed' as const,
      type: 'standard',
      motoId: null,
      motoPlate: 'ABC123',
      source: 'flyder' as const,
      lastSync: Timestamp.now()
    },
    {
      id: 'shift2',
      riderId: 'rider1',
      riderName: 'Juan Pérez',
      franchiseId: 'franchise1',
      startAt: Timestamp.fromDate(new Date('2026-01-31T18:00:00')),
      endAt: Timestamp.fromDate(new Date('2026-01-31T22:00:00')),
      status: 'completed' as const,
      type: 'standard',
      motoId: null,
      motoPlate: 'ABC123',
      source: 'flyder' as const,
      lastSync: Timestamp.now()
    },
    {
      id: 'shift3',
      riderId: 'rider2',
      riderName: 'María García',
      franchiseId: 'franchise1',
      startAt: Timestamp.fromDate(new Date('2026-01-31T09:00:00')),
      endAt: Timestamp.fromDate(new Date('2026-01-31T17:00:00')),
      status: 'active' as const,
      type: 'standard',
      motoId: null,
      motoPlate: 'DEF456',
      source: 'flyder' as const,
      lastSync: Timestamp.now()
    },
    {
      id: 'shift4',
      riderId: 'rider3',
      riderName: 'Carlos López',
      franchiseId: 'franchise2',
      startAt: Timestamp.fromDate(new Date('2026-01-31T10:00:00')),
      endAt: Timestamp.fromDate(new Date('2026-01-31T18:00:00')),
      status: 'completed' as const,
      type: 'standard',
      motoId: null,
      motoPlate: 'GHI789',
      source: 'flyder' as const,
      lastSync: Timestamp.now()
    }
  ];

  describe('calculateRiderPerformance', () => {
    it('should calculate performance metrics for each rider', () => {
      const performance = flyderIntegrationService.calculateRiderPerformance(mockShifts);
      
      expect(performance).toHaveLength(3);
      
      // Rider 1: 2 turnos, 12 horas totales
      const rider1 = performance.find(p => p.riderId === 'rider1');
      expect(rider1).toBeDefined();
      expect(rider1?.shiftsCount).toBe(2);
      expect(rider1?.totalHours).toBe(12);
      expect(rider1?.avgShiftDuration).toBe(6);
      expect(rider1?.efficiency).toBe(6);
    });

    it('should sort by efficiency descending', () => {
      const performance = flyderIntegrationService.calculateRiderPerformance(mockShifts);
      
      // Verificar que está ordenado por eficiencia
      for (let i = 0; i < performance.length - 1; i++) {
        expect(performance[i].efficiency).toBeGreaterThanOrEqual(performance[i + 1].efficiency);
      }
    });
  });

  describe('analyzeHourlyDemand', () => {
    it('should return 24 hours of data', () => {
      const demand = flyderIntegrationService.analyzeHourlyDemand(mockShifts);
      
      expect(demand).toHaveLength(24);
    });

    it('should calculate active riders per hour', () => {
      const demand = flyderIntegrationService.analyzeHourlyDemand(mockShifts);
      
      // A las 10:00 debería haber actividad
      const hour10 = demand.find(d => d.hour === 10);
      expect(hour10).toBeDefined();
      expect(hour10?.activeRiders).toBeGreaterThan(0);
    });

    it('should assign demand levels correctly', () => {
      const demand = flyderIntegrationService.analyzeHourlyDemand(mockShifts);
      
      // Verificar que todos tienen un nivel válido
      demand.forEach(d => {
        expect(['low', 'medium', 'high', 'critical']).toContain(d.demandLevel);
      });
    });
  });

  describe('calculateFranchiseCoverage', () => {
    it('should calculate coverage for each franchise', () => {
      const coverage = flyderIntegrationService.calculateFranchiseCoverage(mockShifts);
      
      expect(coverage.length).toBeGreaterThan(0);
      
      // Verificar estructura
      coverage.forEach(fc => {
        expect(fc).toHaveProperty('franchiseId');
        expect(fc).toHaveProperty('totalRiders');
        expect(fc).toHaveProperty('activeNow');
        expect(fc).toHaveProperty('coverageScore');
        expect(fc).toHaveProperty('saturationRisk');
        expect(typeof fc.coverageScore).toBe('number');
        expect(typeof fc.saturationRisk).toBe('boolean');
      });
    });

    it('should detect saturation risk when coverage is high', () => {
      // Crear shifts donde todos los riders estén activos
      const saturatedShifts = mockShifts.map(s => ({
        ...s,
        status: 'active' as const
      }));
      
      const coverage = flyderIntegrationService.calculateFranchiseCoverage(saturatedShifts);
      
      // Al menos una franquicia debería tener riesgo de saturación
      const hasSaturation = coverage.some(fc => fc.saturationRisk);
      expect(hasSaturation).toBe(true);
    });
  });

  describe('generateFleetIntelligenceReport', () => {
    it('should generate complete report', () => {
      const report = flyderIntegrationService.generateFleetIntelligenceReport(mockShifts);
      
      expect(report).toHaveProperty('date');
      expect(report).toHaveProperty('overallMetrics');
      expect(report).toHaveProperty('topPerformers');
      expect(report).toHaveProperty('hourlyDemand');
      expect(report).toHaveProperty('franchiseCoverage');
      expect(report).toHaveProperty('alerts');
    });

    it('should filter by franchise when specified', () => {
      const report = flyderIntegrationService.generateFleetIntelligenceReport(
        mockShifts,
        'franchise1'
      );
      
      // Solo debería incluir datos de franchise1
      expect(report.franchiseCoverage.length).toBe(1);
      expect(report.franchiseCoverage[0].franchiseId).toBe('franchise1');
    });

    it('should generate alerts for critical situations', () => {
      const report = flyderIntegrationService.generateFleetIntelligenceReport(mockShifts);
      
      // Verificar que alerts es un array
      expect(Array.isArray(report.alerts)).toBe(true);
      
      // Las alertas deberían tener la estructura correcta
      report.alerts.forEach(alert => {
        expect(alert).toHaveProperty('type');
        expect(alert).toHaveProperty('severity');
        expect(alert).toHaveProperty('message');
        expect(alert).toHaveProperty('timestamp');
      });
    });
  });
});
