import { describe, it, expect } from 'vitest';
import { flyderIntegrationService, FlyderShift } from '../flyderIntegrationService';
import { Timestamp } from 'firebase/firestore';

describe('FlyderIntegrationService', () => {
  const mockShifts: FlyderShift[] = [
    {
      id: 'shift1',
      riderId: 'rider1',
      riderName: 'Juan Pérez',
      franchiseId: 'franchise1',
      startAt: Timestamp.fromDate(new Date('2026-01-31T08:00:00')),
      endAt: Timestamp.fromDate(new Date('2026-01-31T16:00:00')),
      status: 'completed',
      type: 'standard',
      motoId: null,
      motoPlate: 'ABC123',
      source: 'flyder',
      lastSync: Timestamp.now()
    },
    {
      id: 'shift2',
      riderId: 'rider1',
      riderName: 'Juan Pérez',
      franchiseId: 'franchise1',
      startAt: Timestamp.fromDate(new Date('2026-01-31T18:00:00')),
      endAt: Timestamp.fromDate(new Date('2026-01-31T22:00:00')),
      status: 'completed',
      type: 'standard',
      motoId: null,
      motoPlate: 'ABC123',
      source: 'flyder',
      lastSync: Timestamp.now()
    },
    {
      id: 'shift3',
      riderId: 'rider2',
      riderName: 'María García',
      franchiseId: 'franchise1',
      startAt: Timestamp.fromDate(new Date('2026-01-31T09:00:00')),
      endAt: Timestamp.fromDate(new Date('2026-01-31T17:00:00')),
      status: 'active',
      type: 'standard',
      motoId: null,
      motoPlate: 'DEF456',
      source: 'flyder',
      lastSync: Timestamp.now()
    }
  ];

  describe('calculateWorkedHours', () => {
    it('should calculate total hours for each rider', () => {
      const reports = flyderIntegrationService.calculateWorkedHours(mockShifts);
      
      expect(reports).toHaveLength(2);
      
      const rider1 = reports.find(r => r.riderId === 'rider1');
      expect(rider1).toBeDefined();
      expect(rider1?.totalHours).toBe(12); // 8h + 4h
      expect(rider1?.shiftsCount).toBe(2);
      
      const rider2 = reports.find(r => r.riderId === 'rider2');
      expect(rider2).toBeDefined();
      expect(rider2?.totalHours).toBe(8);
      expect(rider2?.shiftsCount).toBe(1);
    });

    it('should only count completed and active shifts', () => {
      const cancelledShift: FlyderShift = {
        ...mockShifts[0],
        id: 'shift4',
        status: 'cancelled'
      };
      
      const reports = flyderIntegrationService.calculateWorkedHours([...mockShifts, cancelledShift]);
      
      const rider1 = reports.find(r => r.riderId === 'rider1');
      expect(rider1?.totalHours).toBe(12); // No cuenta el cancelado
    });

    it('should return empty array for empty input', () => {
      const reports = flyderIntegrationService.calculateWorkedHours([]);
      expect(reports).toHaveLength(0);
    });
  });

  describe('getFleetMetrics', () => {
    it('should calculate correct metrics', () => {
      const metrics = flyderIntegrationService.getFleetMetrics(mockShifts);
      
      expect(metrics.totalRiders).toBe(2);
      expect(metrics.activeRiders).toBe(1);
      expect(metrics.totalShifts).toBe(3);
      expect(metrics.completedShifts).toBe(2);
      expect(metrics.avgHoursPerRider).toBe(10); // (12 + 8) / 2
    });

    it('should handle empty shifts', () => {
      const metrics = flyderIntegrationService.getFleetMetrics([]);
      
      expect(metrics.totalRiders).toBe(0);
      expect(metrics.avgHoursPerRider).toBe(0);
    });
  });

  describe('detectIncidents', () => {
    it('should detect no-show incidents', () => {
      const lateShift: FlyderShift = {
        ...mockShifts[0],
        id: 'shift5',
        status: 'scheduled',
        startAt: Timestamp.fromDate(new Date(Date.now() - 30 * 60000)) // 30 min ago
      };
      
      const incidents = flyderIntegrationService.detectIncidents([lateShift]);
      
      expect(incidents).toHaveLength(1);
      expect(incidents[0].type).toBe('no_show');
      expect(incidents[0].riderId).toBe('rider1');
    });

    it('should not detect incidents for completed shifts', () => {
      const incidents = flyderIntegrationService.detectIncidents(mockShifts);
      expect(incidents).toHaveLength(0);
    });
  });

  describe('calculateBilling', () => {
    it('should calculate billing correctly', () => {
      const workedHours = [
        { riderId: 'rider1', riderName: 'Juan', totalHours: 8, shiftsCount: 1, date: '2026-01-31' },
        { riderId: 'rider2', riderName: 'María', totalHours: 6.5, shiftsCount: 1, date: '2026-01-31' }
      ];
      
      const billing = flyderIntegrationService.calculateBilling(workedHours, 10);
      
      expect(billing).toHaveLength(2);
      expect(billing[0].amount).toBe(80);
      expect(billing[1].amount).toBe(65);
    });
  });
});
