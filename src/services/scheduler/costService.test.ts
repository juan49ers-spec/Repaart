import { describe, it, expect } from 'vitest';
import { CostService, EST_HOURLY_BASE, SOCIAL_SECURITY_RATE } from './costService';

describe('CostService', () => {

    describe('calculateEstimatedCost', () => {
        it('should return zeros for empty shifts', () => {
            const result = CostService.calculateEstimatedCost([]);
            expect(result.totalHours).toBe(0);
            expect(result.baseCost).toBe(0);
            expect(result.socialSecurity).toBe(0);
            expect(result.totalCost).toBe(0);
            expect(result.ridersCount).toBe(0);
        });

        it('should calculate cost for a single 1-hour shift', () => {
            const shifts = [{
                startAt: '2026-01-01T10:00:00.000Z',
                endAt: '2026-01-01T11:00:00.000Z',
                riderId: 'r1'
            }];

            const result = CostService.calculateEstimatedCost(shifts);

            expect(result.totalHours).toBe(1);
            expect(result.baseCost).toBe(EST_HOURLY_BASE);
            expect(result.socialSecurity).toBe(EST_HOURLY_BASE * SOCIAL_SECURITY_RATE);
            expect(result.totalCost).toBe(result.baseCost + result.socialSecurity);
            expect(result.ridersCount).toBe(1);
        });

        it('should sum up multiple shifts correctly', () => {
            const shifts = [
                // 2 hours
                { startAt: '2026-01-01T10:00:00Z', endAt: '2026-01-01T12:00:00Z', riderId: 'r1' },
                // 30 mins
                { startAt: '2026-01-01T14:00:00Z', endAt: '2026-01-01T14:30:00Z', riderId: 'r2' }
            ];

            const result = CostService.calculateEstimatedCost(shifts);

            expect(result.totalHours).toBe(2.5);
            expect(result.baseCost).toBe(2.5 * EST_HOURLY_BASE);
            expect(result.ridersCount).toBe(2);
        });

        it('should handle custom hourly rate', () => {
            const shifts = [{
                startAt: '2026-01-01T10:00:00Z',
                endAt: '2026-01-01T11:00:00Z',
                riderId: 'r1'
            }];
            const customRate = 20;

            const result = CostService.calculateEstimatedCost(shifts, customRate);

            expect(result.baseCost).toBe(20);
        });

        it('should correctly count unique riders', () => {
            const shifts = [
                { startAt: '2026-01-01T10:00:00Z', endAt: '2026-01-01T11:00:00Z', riderId: 'r1' },
                { startAt: '2026-01-01T12:00:00Z', endAt: '2026-01-01T13:00:00Z', riderId: 'r1' }, // Same rider
                { startAt: '2026-01-01T14:00:00Z', endAt: '2026-01-01T15:00:00Z', riderId: 'r2' }, // Different rider
                { startAt: '2026-01-01T16:00:00Z', endAt: '2026-01-01T17:00:00Z', riderId: null } // No rider
            ];

            const result = CostService.calculateEstimatedCost(shifts);

            expect(result.ridersCount).toBe(2); // r1 and r2
        });

        it('should ignore negative duration or zero duration', () => {
            const shifts = [
                // 1 hour
                { startAt: '2026-01-01T10:00:00Z', endAt: '2026-01-01T11:00:00Z', riderId: 'r1' },
                // Negative (reversed timestamps)
                { startAt: '2026-01-01T10:00:00Z', endAt: '2026-01-01T09:00:00Z', riderId: 'r1' },
                // Zero
                { startAt: '2026-01-01T10:00:00Z', endAt: '2026-01-01T10:00:00Z', riderId: 'r1' }
            ];

            const result = CostService.calculateEstimatedCost(shifts);
            expect(result.totalHours).toBe(1);
        });
    });

    describe('formatCurrency', () => {
        it('should format numbers as EUR currency', () => {
            // Because Intl output depends on locale implementation (space vs non-breaking space), 
            // we often relax strict string equality or normalize spaces.
            // But let's check basic containment of symbol and value.
            const output = CostService.formatCurrency(1234.56);
            expect(output).toContain('€');
            expect(output).toContain('1'); // check parts
            expect(output).toContain('234');
        });
    });

});
