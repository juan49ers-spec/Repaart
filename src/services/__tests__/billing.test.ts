import { describe, it, expect } from 'vitest';
import { flyderIntegrationService } from '../flyderIntegrationService';
import { Timestamp } from 'firebase/firestore';

describe('Billing Features', () => {
  const mockConfig = {
    franchiseId: 'franchise1',
    hourlyRateGross: 12.50,
    kmRate: 0.50,
    irpfRate: 15,
    otherDeductions: 0
  };

  const mockShifts = [
    {
      id: 'shift1',
      riderId: 'rider1',
      riderName: 'Juan Pérez',
      franchiseId: 'franchise1',
      startAt: Timestamp.fromDate(new Date('2026-01-15T08:00:00')),
      endAt: Timestamp.fromDate(new Date('2026-01-15T16:00:00')),
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
      startAt: Timestamp.fromDate(new Date('2026-01-16T09:00:00')),
      endAt: Timestamp.fromDate(new Date('2026-01-16T17:00:00')),
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
      startAt: Timestamp.fromDate(new Date('2026-01-15T10:00:00')),
      endAt: Timestamp.fromDate(new Date('2026-01-15T18:00:00')),
      status: 'completed' as const,
      type: 'standard',
      motoId: null,
      motoPlate: 'DEF456',
      source: 'flyder' as const,
      lastSync: Timestamp.now()
    }
  ];

  const mockOrders = [
    {
      id: 'order1',
      riderId: 'rider1',
      distance: 5.2,
      status: 'finished' as const,
      finishedAt: Timestamp.fromDate(new Date('2026-01-15T12:00:00')),
      amount: 15.50
    },
    {
      id: 'order2',
      riderId: 'rider1',
      distance: 3.8,
      status: 'finished' as const,
      finishedAt: Timestamp.fromDate(new Date('2026-01-15T14:00:00')),
      amount: 12.00
    },
    {
      id: 'order3',
      riderId: 'rider2',
      distance: 7.5,
      status: 'finished' as const,
      finishedAt: Timestamp.fromDate(new Date('2026-01-15T16:00:00')),
      amount: 18.00
    },
    {
      id: 'order4',
      riderId: 'rider1',
      distance: 4.0,
      status: 'finished' as const,
      finishedAt: Timestamp.fromDate(new Date('2026-01-16T13:00:00')),
      amount: 14.00
    }
  ];

  describe('calculateRiderMonthlyBilling', () => {
    it('should calculate billing for a rider correctly', () => {
      const billing = flyderIntegrationService.calculateRiderMonthlyBilling(
        'rider1',
        'Juan Pérez',
        mockShifts,
        mockOrders,
        mockConfig
      );

      expect(billing.riderId).toBe('rider1');
      expect(billing.riderName).toBe('Juan Pérez');
      
      // Horas: 8h + 8h = 16h
      expect(billing.totalHours).toBe(16);
      
      // Pedidos: 3 pedidos
      expect(billing.totalOrders).toBe(3);
      
      // Distancia: 5.2 + 3.8 + 4.0 = 13km
      expect(billing.totalDistance).toBe(13);
      
      // Cálculos de facturación
      // Horas: 16h * 12.50€ = 200€
      expect(billing.hoursGrossAmount).toBe(200);
      
      // Pedidos: 13km * 0.50€ = 6.50€
      expect(billing.ordersGrossAmount).toBe(6.50);
      
      // Bruto total: 200 + 6.50 = 206.50€
      expect(billing.grossTotal).toBe(206.50);
      
      // SS: 206.50 * 0.3 = 61.95€
      expect(billing.socialSecurity).toBe(61.95);
      
      // IRPF: 206.50 * 0.15 = 30.975€
      expect(billing.irpfDeduction).toBe(30.98); // Redondeado
      
      // Neto: 206.50 - 61.95 - 30.975 = 113.575€ -> redondeado a 113.58€
      expect(billing.netTotal).toBe(113.58);
    });

    it('should handle rider with no orders', () => {
      const billing = flyderIntegrationService.calculateRiderMonthlyBilling(
        'rider3',
        'Carlos López',
        mockShifts,
        mockOrders,
        mockConfig
      );

      expect(billing.totalOrders).toBe(0);
      expect(billing.totalDistance).toBe(0);
      expect(billing.ordersGrossAmount).toBe(0);
    });

    it('should apply other deductions if configured', () => {
      const configWithDeductions = {
        ...mockConfig,
        otherDeductions: 20
      };

      const billing = flyderIntegrationService.calculateRiderMonthlyBilling(
        'rider1',
        'Juan Pérez',
        mockShifts,
        mockOrders,
        configWithDeductions
      );

      expect(billing.otherDeductions).toBe(20);
      // Neto debería ser menor por la deducción adicional
      expect(billing.netTotal).toBeLessThan(113.57);
    });
  });

  describe('generateMonthlyClosure', () => {
    it('should generate complete monthly closure', () => {
      const closure = flyderIntegrationService.generateMonthlyClosure(
        'franchise1',
        '2026-01',
        mockShifts,
        mockOrders,
        mockConfig
      );

      expect(closure.franchiseId).toBe('franchise1');
      expect(closure.month).toBe('2026-01');
      expect(closure.year).toBe(2026);
      expect(closure.status).toBe('draft');
      
      // Debería tener 2 riders
      expect(closure.riders).toHaveLength(2);
      
      // Verificar resumen
      expect(closure.summary).toHaveProperty('totalRiders');
      expect(closure.summary).toHaveProperty('totalHours');
      expect(closure.summary).toHaveProperty('totalOrders');
      expect(closure.summary).toHaveProperty('totalDistance');
      expect(closure.summary).toHaveProperty('totalGross');
      expect(closure.summary).toHaveProperty('totalNet');
      
      // Rider 1: 16h, Rider 2: 8h = 24h total
      expect(closure.summary.totalHours).toBe(24);
      
      // 4 pedidos totales
      expect(closure.summary.totalOrders).toBe(4);
      
      // El total bruto debe ser la suma de todos los riders
      const expectedGross = closure.riders.reduce((acc, r) => acc + r.grossTotal, 0);
      expect(closure.summary.totalGross).toBe(expectedGross);
      
      // El total neto debe ser la suma de todos los riders
      const expectedNet = closure.riders.reduce((acc, r) => acc + r.netTotal, 0);
      expect(closure.summary.totalNet).toBe(expectedNet);
    });

    it('should include generated timestamp', () => {
      const closure = flyderIntegrationService.generateMonthlyClosure(
        'franchise1',
        '2026-01',
        mockShifts,
        mockOrders,
        mockConfig
      );

      expect(closure.generatedAt).toBeDefined();
      expect(closure.generatedAt).toBeInstanceOf(Timestamp);
    });

    it('should handle empty shifts', () => {
      const closure = flyderIntegrationService.generateMonthlyClosure(
        'franchise1',
        '2026-01',
        [],
        [],
        mockConfig
      );

      expect(closure.riders).toHaveLength(0);
      expect(closure.summary.totalRiders).toBe(0);
      expect(closure.summary.totalHours).toBe(0);
      expect(closure.summary.totalGross).toBe(0);
      expect(closure.summary.totalNet).toBe(0);
    });
  });

  describe('Billing calculations accuracy', () => {
    it('should round all monetary values to 2 decimals', () => {
      const billing = flyderIntegrationService.calculateRiderMonthlyBilling(
        'rider1',
        'Juan Pérez',
        mockShifts,
        mockOrders,
        mockConfig
      );

      // Verificar que todos los valores monetarios tienen 2 decimales
      const monetaryFields = [
        'hoursGrossAmount',
        'ordersGrossAmount',
        'grossTotal',
        'socialSecurity',
        'irpfDeduction',
        'netTotal'
      ];

      monetaryFields.forEach(field => {
        const value = billing[field as keyof typeof billing] as number;
        const decimals = (value.toString().split('.')[1] || '').length;
        expect(decimals).toBeLessThanOrEqual(2);
      });
    });

    it('should calculate correct month and year', () => {
      const billing = flyderIntegrationService.calculateRiderMonthlyBilling(
        'rider1',
        'Juan Pérez',
        mockShifts,
        mockOrders,
        mockConfig
      );

      const currentDate = new Date();
      expect(billing.month).toBe(
        `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
      );
      expect(billing.year).toBe(currentDate.getFullYear());
    });
  });
});
