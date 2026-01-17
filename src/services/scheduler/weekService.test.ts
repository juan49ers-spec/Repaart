import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WeekService } from './weekService';
import { WeekDataSchema, toFranchiseId, toWeekId } from '../../schemas/scheduler';
import { doc, getDoc, setDoc } from 'firebase/firestore'; // Mocked below

// --- Mocks ---
vi.mock('firebase/firestore', () => ({
    getFirestore: vi.fn(),
    doc: vi.fn().mockReturnValue('mock-ref'),
    getDoc: vi.fn(),
    setDoc: vi.fn(),
    onSnapshot: vi.fn(),
    collection: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    serverTimestamp: vi.fn(),
}));

vi.mock('../../lib/firebase', () => ({
    db: {}
}));

vi.spyOn(console, 'error').mockImplementation(() => { });

describe('Scheduler Module', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    // 1. Zod Schema Validation Tests
    describe('Zod Schemas', () => {
        it('should validate a correct WeekData object', () => {
            const validData = {
                id: '2025_01',
                startDate: '2025-01-01',
                status: 'draft',
                metrics: { totalHours: 0, activeRiders: 0, motosInUse: 0 },
                shifts: []
            };
            const result = WeekDataSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should fail with invalid date format', () => {
            const invalidData = {
                id: '2025_01',
                startDate: '01-01-2025', // Wrong format
                status: 'draft',
                metrics: { totalHours: 0, activeRiders: 0, motosInUse: 0 },
                shifts: []
            };
            const result = WeekDataSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toContain('Invalid date format');
            }
        });

        it('should enforce default values', () => {
            const minimalData = {
                id: '2025_01',
                startDate: '2025-01-01',
                metrics: {} // Missing properties should get defaults
            };
            const result = WeekDataSchema.safeParse(minimalData);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.status).toBe('draft');
                expect(result.data.shifts).toEqual([]);
                expect(result.data.metrics.totalHours).toBe(0);
            }
        });
    });

    // 2. WeekService Logic Tests
    describe('WeekService', () => {

        describe('getWeekId', () => {
            it('should correctly calculate ISO week for regular date', () => {
                const date = new Date('2025-01-08T12:00:00Z');
                // 8 Jan 2025 is in Week 2
                expect(WeekService.getWeekId(date)).toBe('2025_02');
            });

            it('should handle year boundary correctly (late Dec)', () => {
                const date = new Date('2025-12-31T12:00:00Z');
                // Dec 31 2025 is Wednesday -> Week 53 of 2025
                expect(WeekService.getWeekId(date)).toBe('2026_01');
            });

            it('should handle year boundary correctly (early Jan)', () => {
                const date = new Date('2026-01-01T12:00:00Z');
                // Jan 1 2026 is Thursday -> Week 1 of 2026
                expect(WeekService.getWeekId(date)).toBe('2026_01');
            });
        });

        describe('getWeek', () => {
            it('should return validated data when document exists', async () => {
                const mockData = {
                    id: '2025_40',
                    startDate: '2025-10-01',
                    status: 'draft',
                    metrics: { totalHours: 10, activeRiders: 1, motosInUse: 1 },
                    shifts: []
                };

                (getDoc as any).mockResolvedValue({
                    exists: () => true,
                    data: () => mockData
                });

                const result = await WeekService.getWeek(toFranchiseId('f1'), toWeekId('2025_40'));
                expect(result).toEqual(mockData);
                expect(doc).toHaveBeenCalledWith(expect.anything(), 'franchises', 'f1', 'weeks', '2025_40');
            });

            it('should return null if document does not exist', async () => {
                (getDoc as any).mockResolvedValue({
                    exists: () => false
                });

                const result = await WeekService.getWeek(toFranchiseId('f1'), toWeekId('2025_99'));
                expect(result).toBeNull();
            });

            it('should throw if data is invalid (Zod validation)', async () => {
                const corruptData = {
                    id: '2025_40',
                    startDate: 'bad-date-format', // Invalid format triggers Zod error
                    metrics: { totalHours: 0 }
                };
                (getDoc as any).mockResolvedValue({
                    exists: () => true,
                    data: () => corruptData
                });

                await expect(WeekService.getWeek(toFranchiseId('f1'), toWeekId('2025_40')))
                    .rejects
                    .toThrow(); // ZodError
            });
        });

        describe('initWeek', () => {
            it('should create new week if not exists', async () => {
                (getDoc as any).mockResolvedValue({ exists: () => false });

                const fid = toFranchiseId('f1');
                const wid = toWeekId('2025_42');
                const start = '2025-10-13';

                const result = await WeekService.initWeek(fid, wid, start);

                expect(setDoc).toHaveBeenCalledWith(
                    expect.anything(),
                    expect.objectContaining({
                        id: wid,
                        startDate: start,
                        status: 'draft'
                    })
                );
                expect(result?.id).toBe(wid);
            });

            it('should validation fail if trying to init with bad date', async () => {
                (getDoc as any).mockResolvedValue({ exists: () => false });

                // Zod schema expects YYYY-MM-DD
                const badDate = 'bad-date';

                await expect(WeekService.initWeek(toFranchiseId('f1'), toWeekId('2025_42'), badDate))
                    .rejects
                    .toThrow(); // ZodError inside initWeek before save
            });
        });
    });
});
