// Simplified Invoice types for Cloud Functions

export interface Address {
  street?: string;
  city?: string;
  zipCode?: string;
  province?: string;
  country?: string;
}

export interface CustomerSnapshot {
  fiscalName?: string;
  cif?: string;
  address?: Address;
  email?: string;
  phone?: string;
}

export interface IssuerSnapshot extends CustomerSnapshot {}

export interface InvoiceLine {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  total: number;
}

export interface TaxBreakdown {
  taxRate: number;
  taxAmount: number;
  baseAmount: number;
}

export type InvoiceType = 'STANDARD' | 'RECTIFICATIVE';
export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'RECTIFIED';
export type PaymentStatus = 'PENDING' | 'PARTIAL' | 'PAID';

export interface Invoice {
  id: string;
  franchiseId: string;
  series: string;
  number: number;
  fullNumber: string;
  type: InvoiceType;
  template?: 'modern' | 'classic' | 'minimal' | 'corporate';
  status: InvoiceStatus;
  paymentStatus: PaymentStatus;
  customerId: string;
  customerType: 'FRANCHISE' | 'RESTAURANT';
  customerSnapshot?: CustomerSnapshot;
  issuerSnapshot?: IssuerSnapshot;
  issueDate: any; // Firestore Timestamp or Date
  dueDate?: any;
  originalInvoiceId?: string;
  lines: InvoiceLine[];
  subtotal: number;
  taxBreakdown: TaxBreakdown[];
  total: number;
  remainingAmount?: number;
  totalPaid?: number;
  pdfUrl?: string;
  pdf_storage_path?: string;
  period?: string;
  rectificationReason?: string;
}
