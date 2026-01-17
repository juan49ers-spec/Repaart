import { describe, it, expect, vi, beforeEach } from 'vitest';
import { notificationService, NotificationType } from './notificationService';

// Mock Firebase
vi.mock('../lib/firebase', () => ({
    db: {}
}));

vi.mock('firebase/firestore', async (importOriginal) => {
    const actual = await importOriginal<typeof import('firebase/firestore')>();
    return {
        ...actual,
        collection: vi.fn(() => ({ type: 'collection' })),
        addDoc: vi.fn(),
        doc: vi.fn(() => ({ id: 'mock-doc' })),
        updateDoc: vi.fn(),
        serverTimestamp: () => 'MOCK_TIMESTAMP',
    };
});

import { addDoc } from 'firebase/firestore';

describe('NotificationService', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('notify (Admin)', () => {
        it('should send admin notification with correct payload', async () => {
            (addDoc as any).mockResolvedValue({ id: 'notif-id' });

            const type: NotificationType = 'ALERT';
            const data = {
                title: 'Test Alert',
                message: 'Something happened',
                metadata: { foo: 'bar' }
            };

            await notificationService.notify(type, 'f1', 'Franchise 1', data);

            expect(addDoc).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    type: 'ALERT',
                    franchiseId: 'f1',
                    metadata: { foo: 'bar' },
                    createdAt: 'MOCK_TIMESTAMP'
                })
            );
        });
    });

    describe('notifyRiderAction', () => {
        it('should notify franchise about rider action', async () => {
            await notificationService.notifyRiderAction('f1', 'r1', {
                type: 'incident',
                title: 'Crash',
                message: 'Rider crashed'
            });

            expect(addDoc).toHaveBeenCalledWith(
                expect.anything(), // collection reference
                expect.objectContaining({
                    userId: 'f1',
                    riderId: 'r1',
                    type: 'incident',
                    title: 'Crash',
                    createdAt: 'MOCK_TIMESTAMP'
                })
            );
        });
    });
});
