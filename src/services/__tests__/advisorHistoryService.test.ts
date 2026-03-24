import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/firebase', () => ({
  db: {}
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  arrayUnion: vi.fn((...args) => args),
}));

import { advisorHistoryService } from '../advisorHistoryService';
import { doc, getDoc, setDoc, arrayUnion } from 'firebase/firestore';

describe('advisorHistoryService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (doc as ReturnType<typeof vi.fn>).mockReturnValue({ id: 'mock-doc-ref' });
  });

  describe('load', () => {
    it('returns messages array when document exists', async () => {
      const messages = [
        { role: 'user', text: 'hola', timestamp: '2026-03-24T10:00:00Z' },
        { role: 'model', text: 'hola!', timestamp: '2026-03-24T10:00:01Z' },
      ];
      (getDoc as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ messages }),
      });

      const result = await advisorHistoryService.load('user123', 'franchise');
      expect(result).toEqual(messages);
    });

    it('returns empty array when document does not exist', async () => {
      (getDoc as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        exists: () => false,
      });

      const result = await advisorHistoryService.load('user123', 'franchise');
      expect(result).toEqual([]);
    });

    it('returns empty array on error (silent fail)', async () => {
      (getDoc as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Firestore offline'));
      const result = await advisorHistoryService.load('user123', 'franchise');
      expect(result).toEqual([]);
    });

    it('uses riderAdvisorHistory path for rider type', async () => {
      const { doc } = await import('firebase/firestore');
      (getDoc as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ exists: () => false });

      await advisorHistoryService.load('user123', 'rider');
      expect(doc).toHaveBeenCalledWith(expect.anything(), 'users', 'user123', 'riderAdvisorHistory');
    });

    it('uses advisorHistory path for franchise type', async () => {
      const { doc } = await import('firebase/firestore');
      (getDoc as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ exists: () => false });

      await advisorHistoryService.load('user123', 'franchise');
      expect(doc).toHaveBeenCalledWith(expect.anything(), 'users', 'user123', 'advisorHistory');
    });
  });

  describe('append', () => {
    it('calls setDoc with arrayUnion for each message', async () => {
      (setDoc as ReturnType<typeof vi.fn>).mockResolvedValueOnce(undefined);
      const msgs = [{ role: 'user' as const, text: 'test', timestamp: '2026-03-24T10:00:00Z' }];

      await advisorHistoryService.append('user123', 'franchise', msgs);
      expect(setDoc).toHaveBeenCalledWith(
        expect.anything(),
        { messages: arrayUnion(...msgs) },
        { merge: true }
      );
    });

    it('fails silently on Firestore error', async () => {
      (setDoc as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('network'));
      await expect(
        advisorHistoryService.append('user123', 'franchise', [])
      ).resolves.toBeUndefined();
    });
  });
});
