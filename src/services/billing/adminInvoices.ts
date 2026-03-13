import { db } from '../../lib/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  getDoc,
  serverTimestamp, 
  runTransaction,
  Timestamp
} from 'firebase/firestore';
import type { AdminInvoice, AdminInvoiceItem, CustomerSnapshot, AdminInvoicePaymentStatus } from '../../types/billing';
import { calculateInvoiceTotals, calculateLineMetadata } from './calculations';
import { Result, ok, err } from '../../types/result';
import { ServiceError } from '../../utils/ServiceError';

const COLLECTION = 'admin_invoices';
const COUNTER_DOC = 'admin_counters/admin_invoices_sequence';

export const adminInvoicesService = {

  /**
   * Crea un borrador de factura (Draft).
   */
  createDraftInvoice: async (
    franchiseId: string,
    franchiseName: string,
    adminUid: string,
    customerSnapshot: CustomerSnapshot,
    dueDate: Date
  ): Promise<Result<string, Error>> => {
    try {
      const docRef = doc(collection(db, COLLECTION));
      
      const newInvoice: AdminInvoice = {
        id: docRef.id,
        franchiseId,
        franchiseName,
        customerSnapshot,
        currency: 'EUR',
        dueDate: Timestamp.fromDate(dueDate),
        items: [],
        subtotal: 0,
        taxAmount: 0,
        total: 0,
        amountPaid: 0,
        balanceDue: 0,
        documentStatus: 'draft',
        paymentStatus: 'unpaid',
        createdAt: serverTimestamp() as Timestamp,
        createdBy: adminUid,
        updatedAt: serverTimestamp() as Timestamp,
        updatedBy: adminUid,
      };

      await setDoc(docRef, newInvoice);
      return ok(docRef.id);
    } catch (error: unknown) {
      console.error("Error creating draft invoice:", error);
      return err(new ServiceError('createDraftInvoice', { cause: error }));
    }
  },

  /**
   * Actualiza las líneas y recalcula de forma estricta los totales en el servidor/cliente.
   */
  updateDraftItems: async (
    invoiceId: string, 
    items: AdminInvoiceItem[],
    adminUid: string
  ): Promise<Result<void, Error>> => {
    try {
      const invoiceRef = doc(db, COLLECTION, invoiceId);
      
      // Sanitizar líneas
      const sanitizedItems = items.map(item => {
        const metas = calculateLineMetadata(item.quantity, item.unitPrice, item.taxRate);
        return { ...item, ...metas };
      });

      const totals = calculateInvoiceTotals(sanitizedItems);

      const updates: Partial<AdminInvoice> = {
        items: sanitizedItems,
        subtotal: totals.subtotal,
        taxAmount: totals.taxAmount,
        total: totals.total,
        balanceDue: totals.total, // Because paymentStatus should be unpaid right now
        updatedAt: serverTimestamp() as Timestamp,
        updatedBy: adminUid,
      };

      await updateDoc(invoiceRef, updates as Record<string, unknown>);
      return ok(undefined);
    } catch (error: unknown) {
      return err(new ServiceError('updateDraftItems', { cause: error }));
    }
  },

  /**
   * Emite la factura:
   * 1. Comprueba que sea draft
   * 2. Asigna número correlativo de manera atómica (Transacción)
   * 3. Fija estado 'issued' y congela campos
   */
  issueInvoice: async (invoiceId: string, adminUid: string): Promise<Result<string, Error>> => {
    try {
      const invoiceRef = doc(db, COLLECTION, invoiceId);
      const counterRef = doc(db, COUNTER_DOC);
      let assignedInvoiceNumber = '';

      await runTransaction(db, async (transaction) => {
        const invoiceSnap = await transaction.get(invoiceRef);
        if (!invoiceSnap.exists()) {
          throw new Error("Invoice does not exist!");
        }

        const invoice = invoiceSnap.data() as AdminInvoice;
        if (invoice.documentStatus !== 'draft') {
          throw new Error("Only draft invoices can be issued.");
        }
        if (invoice.total <= 0) {
          throw new Error("Invoice total must be greater than zero.");
        }

        // Get Counter
        const counterSnap = await transaction.get(counterRef);
        let nextSeqNumber = 1;
        if (counterSnap.exists()) {
          nextSeqNumber = (counterSnap.data().seq || 0) + 1;
        }

        const year = new Date().getFullYear();
        // Format: REP-YYYY-000XXX
        assignedInvoiceNumber = `REP-${year}-${String(nextSeqNumber).padStart(6, '0')}`;

        // Updates Sequence
        transaction.set(counterRef, { seq: nextSeqNumber }, { merge: true });

        // Updates Invoice
        transaction.update(invoiceRef, {
          documentStatus: 'issued',
          invoiceNumber: assignedInvoiceNumber,
          issueDate: serverTimestamp(),
          issuedAt: serverTimestamp(),
          issuedBy: adminUid,
          updatedAt: serverTimestamp(),
          updatedBy: adminUid,
        });
      });

      return ok(assignedInvoiceNumber);
    } catch (error: unknown) {
      console.error("Issue Transaction failed: ", error);
      return err(new ServiceError('issueInvoice', { cause: error }));
    }
  },

  /**
   * Registra un pago y actualiza el estado (paid, partially_paid).
   */
  registerPayment: async (
    invoiceId: string, 
    amount: number, 
    adminUid: string
  ): Promise<Result<void, Error>> => {
    try {
      if (amount <= 0) return err(new Error("Amount must be positive"));

      const invoiceRef = doc(db, COLLECTION, invoiceId);
      
      await runTransaction(db, async (transaction) => {
        const invoiceSnap = await transaction.get(invoiceRef);
        if (!invoiceSnap.exists()) throw new Error("Invoice does not exist");
        
        const invoice = invoiceSnap.data() as AdminInvoice;
        
        if (invoice.documentStatus !== 'issued') {
          throw new Error("Can only pay issued invoices.");
        }

        const newAmountPaid = invoice.amountPaid + amount;
        const newBalanceDue = invoice.total - newAmountPaid;

        if (newBalanceDue < 0) {
          throw new Error("Payment exceeds invoice total.");
        }

        let newStatus: AdminInvoicePaymentStatus = 'partially_paid';
        if (newBalanceDue === 0) {
          newStatus = 'paid';
        }

        const updates: Partial<AdminInvoice> = {
          amountPaid: newAmountPaid,
          balanceDue: newBalanceDue,
          paymentStatus: newStatus,
          lastPaymentAt: serverTimestamp() as Timestamp,
          updatedAt: serverTimestamp() as Timestamp,
          updatedBy: adminUid
        };

        if (newStatus === 'paid') {
          updates.paidAt = serverTimestamp() as Timestamp;
        }

        transaction.update(invoiceRef, updates as Record<string, unknown>);
      });

      return ok(undefined);
    } catch (error: unknown) {
      return err(new ServiceError('registerPayment', { cause: error }));
    }
  },

  /**
   * Anula una factura emitida (Void). Nunca hard-delete.
   */
  voidInvoice: async (
    invoiceId: string, 
    reason: string, 
    adminUid: string
  ): Promise<Result<void, Error>> => {
    try {
      const invoiceRef = doc(db, COLLECTION, invoiceId);
      
      const updates: Partial<AdminInvoice> = {
        documentStatus: 'void',
        voidedAt: serverTimestamp() as Timestamp,
        voidedBy: adminUid,
        voidReason: reason,
        updatedAt: serverTimestamp() as Timestamp,
        updatedBy: adminUid
      };

      await updateDoc(invoiceRef, updates as Record<string, unknown>);
      return ok(undefined);
    } catch (error: unknown) {
       return err(new ServiceError('voidInvoice', { cause: error }));
    }
  },

  /**
   * Elimina físicamente un borrador. Solo funciona en estado 'draft'.
   */
  deleteDraftInvoice: async (
    invoiceId: string,
    adminUid: string
  ): Promise<Result<void, Error>> => {
    try {
      const invoiceRef = doc(db, COLLECTION, invoiceId);
      const snap = await getDoc(invoiceRef);

      if (!snap.exists()) {
        return err(new Error('La factura no existe.'));
      }

      const invoice = snap.data() as AdminInvoice;
      if (invoice.documentStatus !== 'draft') {
        return err(new Error('Solo se pueden eliminar borradores. Las facturas emitidas deben anularse.'));
      }

      await deleteDoc(invoiceRef);
      console.info(`[Billing] Draft ${invoiceId} deleted by ${adminUid}`);
      return ok(undefined);
    } catch (error: unknown) {
      return err(new ServiceError('deleteDraftInvoice', { cause: error }));
    }
  },

  /**
   * Actualiza datos generales de un borrador (destinatario, fecha, notas).
   */
  updateDraftDetails: async (
    invoiceId: string,
    updates: {
      customerSnapshot?: CustomerSnapshot;
      dueDate?: Date;
      franchiseId?: string;
      franchiseName?: string;
      notes?: string;
    },
    adminUid: string
  ): Promise<Result<void, Error>> => {
    try {
      const invoiceRef = doc(db, COLLECTION, invoiceId);
      const snap = await getDoc(invoiceRef);

      if (!snap.exists()) {
        return err(new Error('La factura no existe.'));
      }

      const invoice = snap.data() as AdminInvoice;
      if (invoice.documentStatus !== 'draft') {
        return err(new Error('Solo se pueden editar borradores.'));
      }

      const firestoreUpdates: Record<string, unknown> = {
        updatedAt: serverTimestamp(),
        updatedBy: adminUid,
      };

      if (updates.customerSnapshot) firestoreUpdates.customerSnapshot = updates.customerSnapshot;
      if (updates.dueDate) firestoreUpdates.dueDate = Timestamp.fromDate(updates.dueDate);
      if (updates.franchiseId) firestoreUpdates.franchiseId = updates.franchiseId;
      if (updates.franchiseName) firestoreUpdates.franchiseName = updates.franchiseName;
      if (updates.notes !== undefined) firestoreUpdates.notes = updates.notes;

      await updateDoc(invoiceRef, firestoreUpdates);
      return ok(undefined);
    } catch (error: unknown) {
      return err(new ServiceError('updateDraftDetails', { cause: error }));
    }
  },

  /**
   * Duplica cualquier factura existente como nuevo borrador.
   * Copia líneas y datos de cliente, reinicia pagos a cero.
   */
  duplicateInvoice: async (
    sourceInvoiceId: string,
    adminUid: string
  ): Promise<Result<string, Error>> => {
    try {
      const sourceRef = doc(db, COLLECTION, sourceInvoiceId);
      const sourceSnap = await getDoc(sourceRef);

      if (!sourceSnap.exists()) {
        return err(new Error('La factura origen no existe.'));
      }

      const source = sourceSnap.data() as AdminInvoice;
      const newRef = doc(collection(db, COLLECTION));

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);

      const newInvoice: AdminInvoice = {
        id: newRef.id,
        franchiseId: source.franchiseId,
        franchiseName: source.franchiseName,
        customerSnapshot: { ...source.customerSnapshot },
        currency: source.currency,
        dueDate: Timestamp.fromDate(dueDate),
        items: source.items.map(item => ({ ...item, id: crypto.randomUUID() })),
        subtotal: source.subtotal,
        taxAmount: source.taxAmount,
        total: source.total,
        amountPaid: 0,
        balanceDue: source.total,
        documentStatus: 'draft',
        paymentStatus: 'unpaid',
        notes: source.notes ? `[Duplicada de ${source.invoiceNumber || sourceInvoiceId}] ${source.notes}` : `Duplicada de ${source.invoiceNumber || sourceInvoiceId}`,
        duplicatedFrom: sourceInvoiceId,
        createdAt: serverTimestamp() as Timestamp,
        createdBy: adminUid,
        updatedAt: serverTimestamp() as Timestamp,
        updatedBy: adminUid,
      };

      await setDoc(newRef, newInvoice);
      return ok(newRef.id);
    } catch (error: unknown) {
      return err(new ServiceError('duplicateInvoice', { cause: error }));
    }
  }
};
