/**
 * PDF Generator Service - Server Side
 * 
 * Generates immutable PDF documents for invoices with template support
 */

import jsPDF from 'jspdf';
import 'jspdf-autotable';
import type { Invoice } from './types';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: any;
  }
}

interface InvoicePdfOptions {
  template?: 'modern' | 'classic' | 'minimal' | 'corporate';
  lang?: 'es' | 'en';
  includeLogo?: boolean;
  logoUrl?: string;
  showPaymentInfo?: boolean;
}

const formatDate = (date: any, lang: 'es' | 'en' = 'es'): string => {
  if (!date) return '-';
  
  let d: Date;
  if (date instanceof Date) d = date;
  else if (typeof date.toDate === 'function') d = date.toDate();
  else if (date.seconds) d = new Date(date.seconds * 1000);
  else if (date._seconds) d = new Date(date._seconds * 1000);
  else d = new Date(date);
  
  return d.toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const formatCurrency = (amount: number, lang: 'es' | 'en' = 'es'): string => {
  return new Intl.NumberFormat(lang === 'es' ? 'es-ES' : 'en-US', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount || 0);
};

const safeText = (text: any, fallback: string = ''): string => {
  if (text === null || text === undefined) return fallback;
  if (typeof text === 'string') return text;
  return String(text);
};

// Modern template
const generateModernTemplate = (doc: jsPDF, invoice: Invoice, options: InvoicePdfOptions): void => {
  const { lang = 'es' } = options;
  const primaryColor = [16, 185, 129]; // Emerald-500
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = margin;

  // Header background
  doc.setFillColor(249, 250, 251);
  doc.rect(0, 0, pageWidth, 80, 'F');

  // Company info
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(31, 41, 55);
  doc.text(safeText(invoice.issuerSnapshot?.fiscalName, 'REPAART'), margin, options.includeLogo ? 50 : 25);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);
  let companyY = options.includeLogo ? 57 : 32;
  
  if (invoice.issuerSnapshot?.cif) {
    doc.text(`CIF: ${safeText(invoice.issuerSnapshot.cif)}`, margin, companyY);
    companyY += 5;
  }

  // Invoice title
  const rightX = pageWidth - margin - 80;
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(lang === 'es' ? 'FACTURA' : 'INVOICE', rightX, 30);
  
  doc.setFontSize(11);
  doc.setTextColor(31, 41, 55);
  doc.text(safeText(invoice.fullNumber), rightX, 40);
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  doc.text(`${lang === 'es' ? 'Fecha' : 'Date'}: ${formatDate(invoice.issueDate, lang)}`, rightX, 50);

  // Customer
  y = 95;
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(margin, y, 3, 15, 'F');
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(31, 41, 55);
  doc.text(lang === 'es' ? 'FACTURAR A' : 'BILL TO', margin + 8, y + 10);

  y += 20;
  doc.setFontSize(10);
  doc.text(safeText(invoice.customerSnapshot?.fiscalName, 'Cliente'), margin, y);
  y += 6;
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  if (invoice.customerSnapshot?.cif) {
    doc.text(`CIF: ${safeText(invoice.customerSnapshot.cif)}`, margin, y);
  }

  // Table
  y += 20;
  const tableData = (invoice.lines || []).map(line => [
    safeText(line.description, '-'),
    String(line.quantity || 0),
    formatCurrency(line.unitPrice || 0, lang),
    `${((line.taxRate || 0) * 100).toFixed(0)}%`,
    formatCurrency(line.total || 0, lang)
  ]);

  doc.autoTable({
    startY: y,
    head: [[lang === 'es' ? 'Descripción' : 'Description', lang === 'es' ? 'Cant.' : 'Qty', lang === 'es' ? 'Precio' : 'Price', 'IVA', lang === 'es' ? 'Total' : 'Total']],
    body: tableData,
    theme: 'plain',
    headStyles: {
      fillColor: primaryColor,
      textColor: 255,
      fontSize: 9,
      fontStyle: 'bold'
    },
    bodyStyles: { fontSize: 9 },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 30, halign: 'right' },
      3: { cellWidth: 25, halign: 'center' },
      4: { cellWidth: 30, halign: 'right' }
    }
  });

  y = doc.lastAutoTable.finalY + 15;

  // Totals
  const totalsX = pageWidth - margin - 80;
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(totalsX - 10, y - 5, 90, 50, 3, 3, 'F');
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);
  doc.text(`${lang === 'es' ? 'Subtotal' : 'Subtotal'}:`, totalsX, y);
  doc.text(formatCurrency(invoice.subtotal || 0, lang), totalsX + 70, y, { align: 'right' });
  y += 8;
  
  if (invoice.taxBreakdown?.length) {
    invoice.taxBreakdown.forEach(tax => {
      doc.text(`IVA (${(tax.taxRate * 100).toFixed(0)}%):`, totalsX, y);
      doc.text(formatCurrency(tax.taxAmount || 0, lang), totalsX + 70, y, { align: 'right' });
      y += 8;
    });
  }
  
  y += 3;
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.line(totalsX, y, totalsX + 70, y);
  y += 8;
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(`${lang === 'es' ? 'TOTAL' : 'TOTAL'}:`, totalsX, y);
  doc.text(formatCurrency(invoice.total || 0, lang), totalsX + 70, y, { align: 'right' });

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 15;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(156, 163, 175);
  doc.text(`${invoice.issuerSnapshot?.fiscalName || 'REPAART'} | ${invoice.fullNumber}`, pageWidth / 2, footerY, { align: 'center' });
};

// Classic template
const generateClassicTemplate = (doc: jsPDF, invoice: Invoice, options: InvoicePdfOptions): void => {
  const { lang = 'es' } = options;
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = margin;

  // Double border
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.rect(margin, 10, pageWidth - 40, 25);
  doc.setLineWidth(0.2);
  doc.rect(margin + 2, 12, pageWidth - 44, 21);

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(safeText(invoice.issuerSnapshot?.fiscalName, 'REPAART'), pageWidth / 2, 22, { align: 'center' });
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const info = [];
  if (invoice.issuerSnapshot?.cif) info.push(`CIF: ${invoice.issuerSnapshot.cif}`);
  if (invoice.issuerSnapshot?.address?.street) info.push(invoice.issuerSnapshot.address.street);
  doc.text(info.join(' | '), pageWidth / 2, 28, { align: 'center' });

  y = 45;

  // Invoice box
  doc.setFillColor(240, 240, 240);
  doc.rect(pageWidth - margin - 70, y, 70, 25, 'F');
  doc.setDrawColor(0);
  doc.rect(pageWidth - margin - 70, y, 70, 25);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(lang === 'es' ? 'FACTURA' : 'INVOICE', pageWidth - margin - 35, y + 10, { align: 'center' });
  doc.setFontSize(10);
  doc.text(safeText(invoice.fullNumber), pageWidth - margin - 35, y + 20, { align: 'center' });

  y += 35;
  doc.setFontSize(9);
  doc.text(`${lang === 'es' ? 'Fecha:' : 'Date:'} ${formatDate(invoice.issueDate, lang)}`, pageWidth - margin - 70, y);

  // Customer
  y += 20;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(lang === 'es' ? 'CLIENTE:' : 'CUSTOMER:', margin, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(safeText(invoice.customerSnapshot?.fiscalName), margin, y);

  // Table
  y += 15;
  const tableData = (invoice.lines || []).map(line => [
    safeText(line.description, '-'),
    String(line.quantity || 0),
    formatCurrency(line.unitPrice || 0, lang),
    `${((line.taxRate || 0) * 100).toFixed(0)}%`,
    formatCurrency(line.total || 0, lang)
  ]);

  doc.autoTable({
    startY: y,
    head: [[lang === 'es' ? 'Concepto' : 'Item', lang === 'es' ? 'Cant.' : 'Qty', lang === 'es' ? 'Precio Unit.' : 'Unit Price', lang === 'es' ? 'Impuesto' : 'Tax', lang === 'es' ? 'Importe' : 'Amount']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [80, 80, 80],
      textColor: 255,
      fontSize: 9,
      fontStyle: 'bold'
    },
    bodyStyles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 30, halign: 'right' },
      3: { cellWidth: 25, halign: 'center' },
      4: { cellWidth: 30, halign: 'right' }
    }
  });

  y = doc.lastAutoTable.finalY + 15;

  // Totals
  const totalsX = pageWidth - margin - 70;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`${lang === 'es' ? 'Base Imponible:' : 'Subtotal:'}`, totalsX, y);
  doc.text(formatCurrency(invoice.subtotal || 0, lang), totalsX + 70, y, { align: 'right' });
  y += 6;
  
  if (invoice.taxBreakdown?.length) {
    invoice.taxBreakdown.forEach(tax => {
      doc.text(`${lang === 'es' ? 'IVA' : 'VAT'} (${(tax.taxRate * 100).toFixed(0)}%):`, totalsX, y);
      doc.text(formatCurrency(tax.taxAmount || 0, lang), totalsX + 70, y, { align: 'right' });
      y += 6;
    });
  }
  
  y += 3;
  doc.setLineWidth(0.3);
  doc.line(totalsX, y, totalsX + 70, y);
  y += 6;
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`${lang === 'es' ? 'TOTAL FACTURA' : 'INVOICE TOTAL'}:`, totalsX, y);
  doc.text(formatCurrency(invoice.total || 0, lang), totalsX + 70, y, { align: 'right' });
};

// Minimal template
const generateMinimalTemplate = (doc: jsPDF, invoice: Invoice, options: InvoicePdfOptions): void => {
  const { lang = 'es' } = options;
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 25;
  let y = margin;

  // Ultra minimal header
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(safeText(invoice.issuerSnapshot?.fiscalName, 'REPAART'), margin, y);
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(128);
  y += 5;
  if (invoice.issuerSnapshot?.cif) {
    doc.text(invoice.issuerSnapshot.cif, margin, y);
    y += 5;
  }

  // Right side
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  doc.text(safeText(invoice.fullNumber), pageWidth - margin, margin + 10, { align: 'right' });

  doc.setFontSize(9);
  doc.setTextColor(128);
  doc.text(formatDate(invoice.issueDate, lang), pageWidth - margin, margin + 18, { align: 'right' });

  // Separator
  y = 60;
  doc.setDrawColor(200);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);

  // Customer
  y += 15;
  doc.setFontSize(9);
  doc.setTextColor(128);
  doc.text(lang === 'es' ? 'Facturado a:' : 'Billed to:', margin, y);
  y += 8;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  doc.text(safeText(invoice.customerSnapshot?.fiscalName, 'Cliente'), margin, y);

  // Simple table
  y += 25;
  const tableData = (invoice.lines || []).map(line => [
    safeText(line.description, '-'),
    formatCurrency(line.total || 0, lang)
  ]);

  doc.autoTable({
    startY: y,
    head: [[lang === 'es' ? 'Descripción' : 'Description', lang === 'es' ? 'Importe' : 'Amount']],
    body: tableData,
    theme: 'plain',
    headStyles: {
      fontSize: 9,
      fontStyle: 'bold',
      textColor: 128,
      lineColor: 200,
      lineWidth: 0.5
    },
    bodyStyles: { fontSize: 10, textColor: 0 },
    columnStyles: {
      0: { cellWidth: 120 },
      1: { cellWidth: 40, halign: 'right' }
    }
  });

  y = doc.lastAutoTable.finalY + 20;

  // Minimal totals
  doc.setFontSize(9);
  doc.setTextColor(128);
  doc.text(`${lang === 'es' ? 'Subtotal' : 'Subtotal'} ${formatCurrency(invoice.subtotal || 0, lang)}`, pageWidth - margin, y, { align: 'right' });
  y += 6;
  
  if (invoice.taxBreakdown?.length) {
    invoice.taxBreakdown.forEach(tax => {
      doc.text(`IVA ${formatCurrency(tax.taxAmount || 0, lang)}`, pageWidth - margin, y, { align: 'right' });
      y += 6;
    });
  }
  
  y += 5;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  doc.text(`${lang === 'es' ? 'Total' : 'Total'} ${formatCurrency(invoice.total || 0, lang)}`, pageWidth - margin, y, { align: 'right' });
};

// Corporate template
const generateCorporateTemplate = (doc: jsPDF, invoice: Invoice, options: InvoicePdfOptions): void => {
  const { lang = 'es' } = options;
  const primaryColor = [30, 64, 175]; // Blue-800
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = margin;

  // Full width header
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, 35, 'F');

  doc.setTextColor(255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(safeText(invoice.issuerSnapshot?.fiscalName, 'REPAART'), margin, 22);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`${lang === 'es' ? 'Factura' : 'Invoice'} ${safeText(invoice.fullNumber)}`, pageWidth - margin, 22, { align: 'right' });

  y = 50;
  doc.setTextColor(0);

  // Two columns
  const colWidth = (pageWidth - 40) / 2;

  // From
  doc.setFontSize(8);
  doc.setTextColor(128);
  doc.text(lang === 'es' ? 'DE:' : 'FROM:', margin, y);
  y += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  doc.text(safeText(invoice.issuerSnapshot?.fiscalName), margin, y);

  // To
  const rightX = margin + colWidth + 20;
  y = 50;
  doc.setTextColor(128);
  doc.text(lang === 'es' ? 'PARA:' : 'TO:', rightX, y);
  y += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  doc.text(safeText(invoice.customerSnapshot?.fiscalName), rightX, y);

  // Details bar
  y = 95;
  doc.setFillColor(245, 245, 245);
  doc.rect(margin, y, pageWidth - 40, 20, 'F');
  
  doc.setFontSize(8);
  doc.setTextColor(80);
  doc.text(`${lang === 'es' ? 'FECHA DE EMISIÓN' : 'ISSUE DATE'}:`, margin + 5, y + 8);
  doc.text(`${lang === 'es' ? 'FECHA DE VENCIMIENTO' : 'DUE DATE'}:`, margin + 100, y + 8);
  doc.text(`${lang === 'es' ? 'NÚMERO' : 'NUMBER'}:`, margin + 180, y + 8);
  
  doc.setFont('helvetica', 'bold');
  doc.text(formatDate(invoice.issueDate, lang), margin + 5, y + 16);
  doc.text(formatDate(invoice.dueDate, lang) || '-', margin + 100, y + 16);
  doc.text(safeText(invoice.fullNumber), margin + 180, y + 16);

  // Table
  y += 35;
  const tableData = (invoice.lines || []).map(line => [
    safeText(line.description, '-'),
    String(line.quantity || 0),
    formatCurrency(line.unitPrice || 0, lang),
    `${((line.taxRate || 0) * 100).toFixed(0)}%`,
    formatCurrency(line.total || 0, lang)
  ]);

  doc.autoTable({
    startY: y,
    head: [[lang === 'es' ? 'Descripción' : 'Description', lang === 'es' ? 'Cant.' : 'Qty', lang === 'es' ? 'Precio' : 'Price', 'IVA', lang === 'es' ? 'Total' : 'Total']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: primaryColor,
      textColor: 255,
      fontSize: 9,
      fontStyle: 'bold'
    },
    bodyStyles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 30, halign: 'right' },
      3: { cellWidth: 25, halign: 'center' },
      4: { cellWidth: 30, halign: 'right' }
    }
  });

  y = doc.lastAutoTable.finalY + 15;

  // Totals box
  const totalsX = pageWidth - margin - 90;
  doc.setFillColor(250, 250, 250);
  doc.rect(totalsX, y, 90, 45, 'F');
  doc.setDrawColor(200);
  doc.rect(totalsX, y, 90, 45);

  y += 8;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80);
  doc.text(`${lang === 'es' ? 'Subtotal' : 'Subtotal'}:`, totalsX + 5, y);
  doc.text(formatCurrency(invoice.subtotal || 0, lang), totalsX + 85, y, { align: 'right' });
  y += 8;
  
  if (invoice.taxBreakdown?.length) {
    invoice.taxBreakdown.forEach(tax => {
      doc.text(`${lang === 'es' ? 'IVA' : 'VAT'} (${(tax.taxRate * 100).toFixed(0)}%):`, totalsX + 5, y);
      doc.text(formatCurrency(tax.taxAmount || 0, lang), totalsX + 85, y, { align: 'right' });
      y += 8;
    });
  }
  
  doc.setDrawColor(200);
  doc.line(totalsX + 5, y, totalsX + 85, y);
  y += 8;
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(`${lang === 'es' ? 'TOTAL' : 'TOTAL'}:`, totalsX + 5, y);
  doc.text(formatCurrency(invoice.total || 0, lang), totalsX + 85, y, { align: 'right' });

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 20;
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, footerY - 5, pageWidth, 25, 'F');
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(255);
  doc.text(
    `${invoice.issuerSnapshot?.fiscalName || 'REPAART'} | ${invoice.issuerSnapshot?.email || ''} | ${invoice.issuerSnapshot?.phone || ''}`,
    pageWidth / 2,
    footerY + 5,
    { align: 'center' }
  );
};

// Main generator
export const invoicePdfGenerator = {
  generateInvoicePdf: (
    invoice: Invoice,
    options: InvoicePdfOptions = {}
  ): ArrayBuffer => {
    const { template = 'modern' } = options;
    const doc = new jsPDF();

    switch (template) {
      case 'classic':
        generateClassicTemplate(doc, invoice, options);
        break;
      case 'minimal':
        generateMinimalTemplate(doc, invoice, options);
        break;
      case 'corporate':
        generateCorporateTemplate(doc, invoice, options);
        break;
      case 'modern':
      default:
        generateModernTemplate(doc, invoice, options);
        break;
    }

    return doc.output('arraybuffer');
  },

  generateRectificationPdf: (
    invoice: Invoice,
    originalInvoice: Invoice,
    reason: string,
    options: InvoicePdfOptions = {}
  ): ArrayBuffer => {
    // For rectifications, use the same template as the original or default to modern
    const template = invoice.template || 'modern';
    const doc = new jsPDF();

    // Add rectification header
    doc.setFillColor(220, 38, 38); // Red header for rectification
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), 20, 'F');
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255);
    doc.text('FACTURA RECTIFICATIVA', doc.internal.pageSize.getWidth() / 2, 13, { align: 'center' });

    // Add reason note
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0);
    doc.text(`Motivo: ${reason}`, 20, 30);
    doc.text(`Factura original: ${originalInvoice.fullNumber}`, 20, 38);

    // Then generate the invoice content below
    switch (template) {
      case 'classic':
        generateClassicTemplate(doc, invoice, options);
        break;
      case 'minimal':
        generateMinimalTemplate(doc, invoice, options);
        break;
      case 'corporate':
        generateCorporateTemplate(doc, invoice, options);
        break;
      case 'modern':
      default:
        generateModernTemplate(doc, invoice, options);
        break;
    }

    return doc.output('arraybuffer');
  }
};

export default invoicePdfGenerator;
