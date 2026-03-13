import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adminInvoicesService } from '../adminInvoices';
import * as firestore from 'firebase/firestore';

// Mock de Firebase Firestore
vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual('firebase/firestore');
  return {
    ...actual as any,
    doc: vi.fn(),
    getDoc: vi.fn(),
    updateDoc: vi.fn(),
    deleteDoc: vi.fn(),
    addDoc: vi.fn(),
    setDoc: vi.fn(),
    collection: vi.fn(),
    serverTimestamp: vi.fn(() => 'mock-timestamp'),
    Timestamp: {
      fromDate: vi.fn((date) => ({ toDate: () => date }))
    }
  };
});

// Mock de la base de datos
vi.mock('../../../lib/firebase', () => ({
  db: {}
}));

describe('adminInvoicesService - New Features', () => {
  const mockAdminUid = 'admin-123';
  const mockInvoiceId = 'inv-456';

  beforeEach(() => {
    vi.clearAllMocks();
    // Default return for doc
    vi.mocked(firestore.doc).mockReturnValue({ id: mockInvoiceId } as any);
  });

  describe('deleteDraftInvoice', () => {
    it('should delete a draft invoice successfully', async () => {
      const mockSnap = {
        exists: () => true,
        data: () => ({ documentStatus: 'draft' })
      };
      
      vi.mocked(firestore.getDoc).mockResolvedValue(mockSnap as any);
      vi.mocked(firestore.deleteDoc).mockResolvedValue(undefined);

      const result = await adminInvoicesService.deleteDraftInvoice(mockInvoiceId, mockAdminUid);

      expect(result.success).toBe(true);
      expect(firestore.deleteDoc).toHaveBeenCalled();
    });

    it('should return error if invoice is not draft', async () => {
      const mockSnap = {
        exists: () => true,
        data: () => ({ documentStatus: 'issued' })
      };
      
      vi.mocked(firestore.getDoc).mockResolvedValue(mockSnap as any);

      const result = await adminInvoicesService.deleteDraftInvoice(mockInvoiceId, mockAdminUid);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Solo se pueden eliminar borradores');
      }
    });
  });

  describe('updateDraftDetails', () => {
    it('should update draft details successfully', async () => {
      const mockSnap = {
        exists: () => true,
        data: () => ({ documentStatus: 'draft' })
      };
      
      vi.mocked(firestore.getDoc).mockResolvedValue(mockSnap as any);
      vi.mocked(firestore.updateDoc).mockResolvedValue(undefined);

      const updates = { notes: 'Updated notes' };
      const result = await adminInvoicesService.updateDraftDetails(mockInvoiceId, updates, mockAdminUid);

      expect(result.success).toBe(true);
      expect(firestore.updateDoc).toHaveBeenCalledWith(
        expect.anything(), 
        expect.objectContaining({
          notes: 'Updated notes',
          updatedAt: 'mock-timestamp'
        })
      );
    });

    it('should return error if updating a non-draft invoice', async () => {
      const mockSnap = {
        exists: () => true,
        data: () => ({ documentStatus: 'issued' })
      };
      
      vi.mocked(firestore.getDoc).mockResolvedValue(mockSnap as any);

      const result = await adminInvoicesService.updateDraftDetails(mockInvoiceId, {}, mockAdminUid);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Solo se pueden editar borradores');
      }
    });
  });

  describe('duplicateInvoice', () => {
    it('should duplicate an invoice as a new draft', async () => {
      const sourceInvoice = {
        documentStatus: 'issued',
        customerSnapshot: { name: 'Client A' },
        items: [{ description: 'Test', amount: 100 }],
        franchiseId: 'fran1',
        franchiseName: 'Franchise 1',
        total: 100
      };

      const mockSnap = {
        exists: () => true,
        data: () => sourceInvoice
      };
      
      vi.mocked(firestore.getDoc).mockResolvedValue(mockSnap as any);
      // Mock for the new ref
      vi.mocked(firestore.doc)
        .mockReturnValueOnce({ id: mockInvoiceId } as any) // for sourceRef
        .mockReturnValueOnce({ id: 'new-inv-789' } as any); // for newRef
        
      vi.mocked(firestore.setDoc).mockResolvedValue(undefined);

      const result = await adminInvoicesService.duplicateInvoice(mockInvoiceId, mockAdminUid);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('new-inv-789');
      }
      expect(firestore.setDoc).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'new-inv-789' }),
        expect.objectContaining({
          documentStatus: 'draft',
          duplicatedFrom: mockInvoiceId,
          amountPaid: 0,
          balanceDue: 100
        })
      );
    });
  });

  describe('voidInvoice (improvement verification)', () => {
    it('should void an invoice with reason and audit info', async () => {
      const mockSnap = {
        exists: () => true,
        data: () => ({ documentStatus: 'issued' })
      };
      
      vi.mocked(firestore.getDoc).mockResolvedValue(mockSnap as any);
      vi.mocked(firestore.updateDoc).mockResolvedValue(undefined);

      const result = await adminInvoicesService.voidInvoice(mockInvoiceId, 'Error in data', mockAdminUid);

      expect(result.success).toBe(true);
      expect(firestore.updateDoc).toHaveBeenCalledWith(
        expect.objectContaining({ id: mockInvoiceId }),
        expect.objectContaining({
          documentStatus: 'void',
          voidReason: 'Error in data',
          voidedBy: mockAdminUid,
          voidedAt: 'mock-timestamp'
        })
      );
    });
  });
});
