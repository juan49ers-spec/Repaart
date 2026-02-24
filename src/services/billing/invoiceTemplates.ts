/**
 * Invoice Templates System
 * 
 * Sistema de plantillas profesionales para facturas inspirado en Invoify
 * Múltiples estilos visuales disponibles
 */

import jsPDF from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import type { Invoice } from '../../types/invoicing';

export type InvoiceTemplate = 'modern' | 'classic' | 'minimal' | 'corporate';

type JsPDFWithAutoTable = jsPDF & { lastAutoTable?: { finalY: number } };

export interface TemplateOptions {
    template?: InvoiceTemplate;
    lang?: 'es' | 'en';
    includeLogo?: boolean;
    logoUrl?: string;
    showPaymentInfo?: boolean;
    accentColor?: string;
    primaryColor?: string;
}

// Utility functions
const formatDate = (date: unknown, lang: 'es' | 'en' = 'es'): string => {
    if (!date) return '-';

    let d: Date;
    if (date instanceof Date) d = date;
    else if (typeof date === 'object' && date !== null && 'toDate' in date && typeof (date as { toDate: () => Date }).toDate === 'function') d = (date as { toDate: () => Date }).toDate();
    else if (typeof date === 'object' && date !== null && 'seconds' in date) d = new Date((date as { seconds: number }).seconds * 1000);
    else if (typeof date === 'object' && date !== null && '_seconds' in date) d = new Date((date as { _seconds: number })._seconds * 1000);
    else d = new Date(date as string | number);

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

const safeText = (text: unknown, fallback: string = ''): string => {
    if (text === null || text === undefined) return fallback;
    if (typeof text === 'string') return text;
    return String(text);
};

// Color utilities
const hexToRgb = (hex: string): [number, number, number] => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
    ] : [34, 197, 94]; // Default emerald
};

// Template: Modern (Clean, professional with accent colors)
const generateModernTemplate = (
    doc: jsPDF,
    invoice: Invoice,
    options: TemplateOptions
): void => {
    const { lang = 'es', primaryColor = '#10B981' } = options;
    const [r, g, b] = hexToRgb(primaryColor);
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let y = margin;

    // Header background
    doc.setFillColor(249, 250, 251);
    doc.rect(0, 0, pageWidth, 80, 'F');

    // Company info (left)
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 41, 55);
    doc.text(safeText(invoice.issuerSnapshot?.fiscalName, 'REPAART'), margin, 25);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);
    let companyY = 32;

    if (invoice.issuerSnapshot?.cif) {
        doc.text(`${lang === 'es' ? 'CIF' : 'VAT'}: ${safeText(invoice.issuerSnapshot.cif)}`, margin, companyY);
        companyY += 5;
    }
    if (invoice.issuerSnapshot?.address?.street) {
        doc.text(safeText(invoice.issuerSnapshot.address.street), margin, companyY);
        companyY += 5;
    }
    if (invoice.issuerSnapshot?.address?.city) {
        const zip = safeText(invoice.issuerSnapshot.address.zipCode, '');
        doc.text(`${zip} ${safeText(invoice.issuerSnapshot.address.city)}`, margin, companyY);
        companyY += 5;
    }
    if (invoice.issuerSnapshot?.email) {
        doc.text(invoice.issuerSnapshot.email, margin, companyY);
    }

    // Invoice details (right)
    const rightX = pageWidth - margin - 80;
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(r, g, b);
    doc.text(lang === 'es' ? 'FACTURA' : 'INVOICE', rightX, 30);

    doc.setFontSize(11);
    doc.setTextColor(31, 41, 55);
    doc.text(safeText(invoice.fullNumber), rightX, 40);

    doc.setFontSize(9);
    doc.setTextColor(107, 114, 128);
    doc.text(`${lang === 'es' ? 'Fecha' : 'Date'}: ${formatDate(invoice.issueDate, lang)}`, rightX, 50);
    if (invoice.dueDate) {
        doc.text(`${lang === 'es' ? 'Vencimiento' : 'Due Date'}: ${formatDate(invoice.dueDate, lang)}`, rightX, 57);
    }

    // Client section
    y = 95;
    doc.setFillColor(r, g, b);
    doc.rect(margin, y, 3, 15, 'F');

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 41, 55);
    doc.text(lang === 'es' ? 'FACTURAR A' : 'BILL TO', margin + 8, y + 10);

    y += 20;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(safeText(invoice.customerSnapshot?.fiscalName, 'Cliente'), margin, y);

    y += 6;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);

    if (invoice.customerSnapshot?.cif) {
        doc.text(`${lang === 'es' ? 'CIF' : 'VAT'}: ${safeText(invoice.customerSnapshot.cif)}`, margin, y);
        y += 5;
    }
    if (invoice.customerSnapshot?.address?.street) {
        doc.text(safeText(invoice.customerSnapshot.address.street), margin, y);
        y += 5;
    }
    if (invoice.customerSnapshot?.address?.city) {
        const zip = safeText(invoice.customerSnapshot.address.zipCode, '');
        doc.text(`${zip} ${safeText(invoice.customerSnapshot.address.city)}`, margin, y);
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

    autoTable(doc, {
        startY: y,
        head: [[
            lang === 'es' ? 'Descripción' : 'Description',
            lang === 'es' ? 'Cant.' : 'Qty',
            lang === 'es' ? 'Precio' : 'Price',
            'IVA',
            lang === 'es' ? 'Total' : 'Total'
        ]],
        body: tableData,
        theme: 'plain',
        headStyles: {
            fillColor: [r, g, b],
            textColor: 255,
            fontSize: 9,
            fontStyle: 'bold',
            halign: 'left'
        },
        bodyStyles: {
            fontSize: 9,
            textColor: 55,
            cellPadding: 5
        },
        alternateRowStyles: {
            fillColor: [249, 250, 251]
        },
        columnStyles: {
            0: { cellWidth: 70 },
            1: { cellWidth: 20, halign: 'center' },
            2: { cellWidth: 30, halign: 'right' },
            3: { cellWidth: 25, halign: 'center' },
            4: { cellWidth: 30, halign: 'right' }
        }
    });

    y = (doc as JsPDFWithAutoTable).lastAutoTable?.finalY ? (doc as JsPDFWithAutoTable).lastAutoTable!.finalY + 15 : y + 50;

    // Totals section
    const totalsX = pageWidth - margin - 80;

    // Box for totals
    doc.setFillColor(249, 250, 251);
    doc.roundedRect(totalsX - 10, y - 5, 90, 50, 3, 3, 'F');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);

    doc.text(`${lang === 'es' ? 'Subtotal' : 'Subtotal'}:`, totalsX, y);
    doc.text(formatCurrency(invoice.subtotal || 0, lang), totalsX + 70, y, { align: 'right' });
    y += 8;

    if (invoice.taxBreakdown?.length) {
        invoice.taxBreakdown.forEach((tax: { taxRate: number, taxAmount: number }) => {
            doc.text(`IVA (${(tax.taxRate * 100).toFixed(0)}%):`, totalsX, y);
            doc.text(formatCurrency(tax.taxAmount || 0, lang), totalsX + 70, y, { align: 'right' });
            y += 8;
        });
    }

    y += 3;
    doc.setDrawColor(r, g, b);
    doc.line(totalsX, y, totalsX + 70, y);
    y += 8;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(r, g, b);
    doc.text(`${lang === 'es' ? 'TOTAL' : 'TOTAL'}:`, totalsX, y);
    doc.text(formatCurrency(invoice.total || 0, lang), totalsX + 70, y, { align: 'right' });

    // Footer
    const footerY = doc.internal.pageSize.getHeight() - 15;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(156, 163, 175);
    doc.text(
        `${invoice.issuerSnapshot?.fiscalName || 'REPAART'} | ${invoice.fullNumber}`,
        pageWidth / 2,
        footerY,
        { align: 'center' }
    );
};

// Template: Classic (Traditional invoice format)
const generateClassicTemplate = (
    doc: jsPDF,
    invoice: Invoice,
    options: TemplateOptions
): void => {
    const { lang = 'es' } = options;
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let y = margin;

    // Double border header
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.rect(margin, 10, pageWidth - 40, 25);
    doc.setLineWidth(0.2);
    doc.rect(margin + 2, 12, pageWidth - 44, 21);

    // Company name centered
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(safeText(invoice.issuerSnapshot?.fiscalName, 'REPAART'), pageWidth / 2, 22, { align: 'center' });

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const companyInfo = [];
    if (invoice.issuerSnapshot?.cif) companyInfo.push(`CIF: ${invoice.issuerSnapshot.cif}`);
    if (invoice.issuerSnapshot?.address?.street) companyInfo.push(invoice.issuerSnapshot.address.street);
    if (invoice.issuerSnapshot?.address?.city) {
        companyInfo.push(`${invoice.issuerSnapshot.address.zipCode || ''} ${invoice.issuerSnapshot.address.city}`);
    }
    doc.text(companyInfo.join(' | '), pageWidth / 2, 28, { align: 'center' });

    y = 45;

    // Invoice title box
    doc.setFillColor(240, 240, 240);
    doc.rect(pageWidth - margin - 70, y, 70, 25, 'F');
    doc.setDrawColor(0);
    doc.rect(pageWidth - margin - 70, y, 70, 25);

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(lang === 'es' ? 'FACTURA' : 'INVOICE', pageWidth - margin - 35, y + 10, { align: 'center' });

    doc.setFontSize(10);
    doc.text(safeText(invoice.fullNumber), pageWidth - margin - 35, y + 20, { align: 'center' });

    // Dates
    y += 35;
    doc.setFontSize(9);
    doc.text(`${lang === 'es' ? 'Fecha:' : 'Date:'} ${formatDate(invoice.issueDate, lang)}`, pageWidth - margin - 70, y);
    if (invoice.dueDate) {
        doc.text(`${lang === 'es' ? 'Vencimiento:' : 'Due:'} ${formatDate(invoice.dueDate, lang)}`, pageWidth - margin - 70, y + 5);
    }

    // Customer
    y += 20;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(lang === 'es' ? 'CLIENTE:' : 'CUSTOMER:', margin, y);

    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(safeText(invoice.customerSnapshot?.fiscalName), margin, y);

    if (invoice.customerSnapshot?.cif) {
        y += 5;
        doc.text(`${lang === 'es' ? 'CIF/NIF:' : 'VAT:'} ${safeText(invoice.customerSnapshot.cif)}`, margin, y);
    }
    if (invoice.customerSnapshot?.address?.street) {
        y += 5;
        doc.text(safeText(invoice.customerSnapshot.address.street), margin, y);
    }

    // Table with classic borders
    y += 15;
    const tableData = (invoice.lines || []).map(line => [
        safeText(line.description, '-'),
        String(line.quantity || 0),
        formatCurrency(line.unitPrice || 0, lang),
        `${((line.taxRate || 0) * 100).toFixed(0)}%`,
        formatCurrency(line.total || 0, lang)
    ]);

    autoTable(doc, {
        startY: y,
        head: [[
            lang === 'es' ? 'Concepto' : 'Item',
            lang === 'es' ? 'Cant.' : 'Qty',
            lang === 'es' ? 'Precio Unit.' : 'Unit Price',
            lang === 'es' ? 'Impuesto' : 'Tax',
            lang === 'es' ? 'Importe' : 'Amount'
        ]],
        body: tableData,
        theme: 'grid',
        headStyles: {
            fillColor: [80, 80, 80],
            textColor: 255,
            fontSize: 9,
            fontStyle: 'bold'
        },
        bodyStyles: {
            fontSize: 9
        },
        columnStyles: {
            0: { cellWidth: 70 },
            1: { cellWidth: 20, halign: 'center' },
            2: { cellWidth: 30, halign: 'right' },
            3: { cellWidth: 25, halign: 'center' },
            4: { cellWidth: 30, halign: 'right' }
        }
    });

    y = (doc as JsPDFWithAutoTable).lastAutoTable?.finalY ? (doc as JsPDFWithAutoTable).lastAutoTable!.finalY + 15 : y + 50;

    // Totals with borders
    const totalsX = pageWidth - margin - 70;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`${lang === 'es' ? 'Base Imponible:' : 'Subtotal:'}`, totalsX, y);
    doc.text(formatCurrency(invoice.subtotal || 0, lang), totalsX + 70, y, { align: 'right' });
    y += 6;

    if (invoice.taxBreakdown?.length) {
        invoice.taxBreakdown.forEach((tax: { taxRate: number, taxAmount: number }) => {
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

    // Legal footer
    const footerY = doc.internal.pageSize.getHeight() - 20;
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(
        lang === 'es'
            ? 'Factura emitida conforme a la normativa vigente. Los datos se han obtenido de la información proporcionada por el cliente.'
            : 'Invoice issued in accordance with applicable regulations. Data obtained from customer provided information.',
        pageWidth / 2,
        footerY,
        { align: 'center', maxWidth: pageWidth - 40 }
    );
};

// Template: Minimal (Cleanest possible design)
const generateMinimalTemplate = (
    doc: jsPDF,
    invoice: Invoice,
    options: TemplateOptions
): void => {
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

    // Right side - invoice info
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text(safeText(invoice.fullNumber), pageWidth - margin, margin + 10, { align: 'right' });

    doc.setFontSize(9);
    doc.setTextColor(128);
    doc.text(formatDate(invoice.issueDate, lang), pageWidth - margin, margin + 18, { align: 'right' });

    // Separator line
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

    autoTable(doc, {
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
        bodyStyles: {
            fontSize: 10,
            textColor: 0
        },
        columnStyles: {
            0: { cellWidth: 120 },
            1: { cellWidth: 40, halign: 'right' }
        }
    });

    y = (doc as JsPDFWithAutoTable).lastAutoTable?.finalY ? (doc as JsPDFWithAutoTable).lastAutoTable!.finalY + 20 : y + 50;

    // Minimal totals
    doc.setFontSize(9);
    doc.setTextColor(128);
    doc.text(`${lang === 'es' ? 'Subtotal' : 'Subtotal'} ${formatCurrency(invoice.subtotal || 0, lang)}`, pageWidth - margin, y, { align: 'right' });
    y += 6;

    if (invoice.taxBreakdown?.length) {
        invoice.taxBreakdown.forEach((tax: { taxRate: number, taxAmount: number }) => {
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

// Template: Corporate (Professional with branding)
const generateCorporateTemplate = (
    doc: jsPDF,
    invoice: Invoice,
    options: TemplateOptions
): void => {
    const { lang = 'es', primaryColor = '#1E40AF' } = options;
    const [r, g, b] = hexToRgb(primaryColor);
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let y = margin;

    // Full width header with color
    doc.setFillColor(r, g, b);
    doc.rect(0, 0, pageWidth, 35, 'F');

    // White text on colored header
    doc.setTextColor(255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(safeText(invoice.issuerSnapshot?.fiscalName, 'REPAART'), margin, 22);

    // Invoice number on header
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`${lang === 'es' ? 'Factura' : 'Invoice'} ${safeText(invoice.fullNumber)}`, pageWidth - margin, 22, { align: 'right' });

    // White section
    y = 50;
    doc.setTextColor(0);

    // Two column layout
    const colWidth = (pageWidth - 40) / 2;

    // Left column - From
    doc.setFontSize(8);
    doc.setTextColor(128);
    doc.text(lang === 'es' ? 'DE:' : 'FROM:', margin, y);

    y += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text(safeText(invoice.issuerSnapshot?.fiscalName), margin, y);

    y += 6;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80);
    if (invoice.issuerSnapshot?.address?.street) {
        doc.text(invoice.issuerSnapshot.address.street, margin, y);
        y += 5;
    }
    if (invoice.issuerSnapshot?.address?.city) {
        doc.text(`${invoice.issuerSnapshot.address.zipCode || ''} ${invoice.issuerSnapshot.address.city}`, margin, y);
        y += 5;
    }
    if (invoice.issuerSnapshot?.email) {
        doc.text(invoice.issuerSnapshot.email, margin, y);
    }

    // Right column - To
    const rightX = margin + colWidth + 20;
    y = 50;

    doc.setTextColor(128);
    doc.text(lang === 'es' ? 'PARA:' : 'TO:', rightX, y);

    y += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text(safeText(invoice.customerSnapshot?.fiscalName), rightX, y);

    y += 6;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80);
    if (invoice.customerSnapshot?.address?.street) {
        doc.text(invoice.customerSnapshot.address.street, rightX, y);
        y += 5;
    }
    if (invoice.customerSnapshot?.address?.city) {
        doc.text(`${invoice.customerSnapshot.address.zipCode || ''} ${invoice.customerSnapshot.address.city}`, rightX, y);
    }

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

    autoTable(doc, {
        startY: y,
        head: [[
            lang === 'es' ? 'Descripción' : 'Description',
            lang === 'es' ? 'Cant.' : 'Qty',
            lang === 'es' ? 'Precio' : 'Price',
            'IVA',
            lang === 'es' ? 'Total' : 'Total'
        ]],
        body: tableData,
        theme: 'striped',
        headStyles: {
            fillColor: [r, g, b],
            textColor: 255,
            fontSize: 9,
            fontStyle: 'bold'
        },
        bodyStyles: {
            fontSize: 9
        },
        columnStyles: {
            0: { cellWidth: 70 },
            1: { cellWidth: 20, halign: 'center' },
            2: { cellWidth: 30, halign: 'right' },
            3: { cellWidth: 25, halign: 'center' },
            4: { cellWidth: 30, halign: 'right' }
        }
    });

    y = (doc as JsPDFWithAutoTable).lastAutoTable?.finalY ? (doc as JsPDFWithAutoTable).lastAutoTable!.finalY + 15 : y + 50;

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
        invoice.taxBreakdown.forEach((tax: { taxRate: number, taxAmount: number }) => {
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
    doc.setTextColor(r, g, b);
    doc.text(`${lang === 'es' ? 'TOTAL' : 'TOTAL'}:`, totalsX + 5, y);
    doc.text(formatCurrency(invoice.total || 0, lang), totalsX + 85, y, { align: 'right' });

    // Footer with color accent
    const footerY = doc.internal.pageSize.getHeight() - 20;
    doc.setFillColor(r, g, b);
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
    doc.text(
        lang === 'es' ? 'Documento generado electrónicamente' : 'Electronically generated document',
        pageWidth / 2,
        footerY + 12,
        { align: 'center' }
    );
};

// Main generator function
export const generateInvoiceWithTemplate = (
    invoice: Invoice,
    options: TemplateOptions = {}
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
};

// Export individual templates for flexibility
export {
    generateModernTemplate,
    generateClassicTemplate,
    generateMinimalTemplate,
    generateCorporateTemplate
};

export default generateInvoiceWithTemplate;
