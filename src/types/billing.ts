import { Timestamp } from 'firebase/firestore';

export type AdminInvoiceDocumentStatus = 'draft' | 'issued' | 'void' | 'deleted';
export type AdminInvoicePaymentStatus = 'unpaid' | 'partially_paid' | 'paid' | 'overdue';
export type Currency = 'EUR';
export type AdminInvoiceItemCategory = 'royalty' | 'consulting' | 'marketing' | 'other';

export interface AdminInvoiceItem {
  id: string;
  category: AdminInvoiceItemCategory;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number; // e.g., 0, 10, 21
  subtotal: number;
  taxAmount: number;
  total: number;
  periodStart?: Timestamp | null;
  periodEnd?: Timestamp | null;
}

export interface CustomerSnapshot {
  legalName: string;
  taxId?: string;
  billingEmail?: string;
  address?: {
    line1?: string;
    city?: string;
    postalCode?: string;
    country?: string;
  };
}

export interface AdminInvoice {
  id?: string;
  invoiceNumber?: string; // Generated on transition to 'issued'

  franchiseId: string;
  franchiseName: string;

  // Immutability: Customer snapshot at time of issue
  customerSnapshot: CustomerSnapshot;

  currency: Currency;

  issueDate?: Timestamp | null; // Null while draft
  dueDate: Timestamp | null;

  items: AdminInvoiceItem[];

  // Totals (sum of rounded lines)
  subtotal: number;
  taxAmount: number;
  total: number;

  // Payment Tracking
  amountPaid: number;
  balanceDue: number;

  documentStatus: AdminInvoiceDocumentStatus;
  paymentStatus: AdminInvoicePaymentStatus;

  notes?: string;

  // Audit
  createdAt: Timestamp | null;
  createdBy: string;
  updatedAt: Timestamp | null;
  updatedBy: string;

  issuedAt?: Timestamp | null;
  issuedBy?: string;

  paidAt?: Timestamp | null;
  lastPaymentAt?: Timestamp | null;

  voidedAt?: Timestamp | null;
  voidedBy?: string;
  voidReason?: string;

  // Trazabilidad de duplicación
  duplicatedFrom?: string;
}
