import { describe, it, expect } from 'vitest';
import { ComplianceService } from './complianceService';

describe('ComplianceService', () => {
    describe('validateShiftRules', () => {
        const calculateIssues = ComplianceService.validateShiftRules;

        it('should detect critical overlap', () => {
            const existing = [{
                startAt: '2024-01-01T10:00:00',
                endAt: '2024-01-01T14:00:00',
                riderId: 'r1'
            }];

            // Overlapping proposed shift (12:00 - 16:00)
            const proposed = {
                startAt: '2024-01-01T12:00:00',
                endAt: '2024-01-01T16:00:00',
                riderId: 'r1'
            };

            const issues = calculateIssues(proposed, existing);
            expect(issues).toHaveLength(1);
            expect(issues[0].type).toBe('overlap');
            expect(issues[0].severity).toBe('critical');
        });

        it('should detect daily limit violation (>9h)', () => {
            const existing = [{
                startAt: '2024-01-01T08:00:00',
                endAt: '2024-01-01T16:00:00', // 8 hours
                riderId: 'r1'
            }];

            // New shift 18:00 - 20:00 (2 hours) -> Total 10h
            const proposed = {
                startAt: '2024-01-01T18:00:00',
                endAt: '2024-01-01T20:00:00',
                riderId: 'r1'
            };

            const issues = calculateIssues(proposed, existing);
            const limitIssue = issues.find(i => i.type === 'daily_limit');

            expect(limitIssue).toBeDefined();
            expect(limitIssue?.severity).toBe('warning');
            expect(limitIssue?.message).toContain('10h > 9h');
        });

        it('should check rest period between days (<12h)', () => {
            // Shift ends late previous day
            const existing = [{
                startAt: '2024-01-01T14:00:00',
                endAt: '2024-01-01T23:00:00', // Ends 23:00
                riderId: 'r1'
            }];

            // Starts early next day (08:00) -> 9 hours rest (Violation)
            const proposed = {
                startAt: '2024-01-02T08:00:00',
                endAt: '2024-01-02T12:00:00',
                riderId: 'r1'
            };

            const issues = calculateIssues(proposed, existing);
            const restIssue = issues.find(i => i.type === 'rest');

            expect(restIssue).toBeDefined();
            expect(restIssue?.severity).toBe('warning');
            expect(restIssue?.message).toContain('9h');
        });

        it('should allow split shifts on the same day (ignore 12h rule)', () => {
            // Shift 10:00-14:00
            const existing = [{
                startAt: '2024-01-01T10:00:00',
                endAt: '2024-01-01T14:00:00',
                riderId: 'r1'
            }];

            // Shift 20:00-22:00 (Same day, 6h gap) -> Allowed
            const proposed = {
                startAt: '2024-01-01T20:00:00',
                endAt: '2024-01-01T22:00:00',
                riderId: 'r1'
            };

            const issues = calculateIssues(proposed, existing);
            // Should NOT have rest issue
            expect(issues.find(i => i.type === 'rest')).toBeUndefined();
            // Should NOT have daily limit (4+2 = 6h < 9h)
            expect(issues.find(i => i.type === 'daily_limit')).toBeUndefined();
            // Should NOT overlap
            expect(issues.find(i => i.type === 'overlap')).toBeUndefined();

            expect(issues).toHaveLength(0);
        });

        it('should correctly handle object identity for rest check', () => {
            // The code sorts [...existing, proposed]. 
            // If identity check (s === proposed) fails, it might find wrong index.
            // But since we pass the object 'proposed' directly, it should work.
            const existing = [{
                startAt: '2024-01-01T10:00:00',
                endAt: '2024-01-01T14:00:00',
                riderId: 'r1'
            }];
            const proposed = {
                startAt: '2024-01-01T20:00:00',
                endAt: '2024-01-01T22:00:00',
                riderId: 'r1'
            };

            const issues = calculateIssues(proposed, existing);
            expect(issues).toHaveLength(0);
        });
    });
});
