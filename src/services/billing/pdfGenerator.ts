/**
 * Enhanced PDF Generator Service
 * 
 * Servicio mejorado de generación de PDFs con soporte para múltiples plantillas
 * Integra el sistema de plantillas inspirado en Invoify
 */

import jsPDF from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import type { Invoice } from '../../types/invoicing';
import {
    generateInvoiceWithTemplate,
    InvoiceTemplate,
    TemplateOptions
} from './invoiceTemplates';

type InvoicePdfOptions = TemplateOptions;

/**
 * Enhanced PDF Generator Service
 */
export const invoicePdfGenerator = {
    /**
     * Generate PDF using new template system
     * 
     * @param invoice - Invoice data
     * @param options - PDF generation options including template
     * @returns PDF as ArrayBuffer
     */
    generateInvoicePdf: (
        invoice: Invoice,
        options: InvoicePdfOptions = {}
    ): ArrayBuffer => {
        // Use new template system by default
        return generateInvoiceWithTemplate(invoice, options);
    },

    /**
     * Generate PDF with specific template
     * 
     * @param invoice - Invoice data
     * @param template - Template name ('modern', 'classic', 'minimal', 'corporate')
     * @param options - Additional options
     * @returns PDF as ArrayBuffer
     */
    generateWithTemplate: (
        invoice: Invoice,
        template: InvoiceTemplate,
        options: Omit<InvoicePdfOptions, 'template'> = {}
    ): ArrayBuffer => {
        return generateInvoiceWithTemplate(invoice, { ...options, template });
    },

    /**
     * Get available templates
     * @returns Array of available template names
     */
    getAvailableTemplates: (): { id: InvoiceTemplate; name: string; description: string }[] => {
        return [
            {
                id: 'modern',
                name: 'Moderna',
                description: 'Diseño limpio con acentos de color y tipografía contemporánea'
            },
            {
                id: 'classic',
                name: 'Clásica',
                description: 'Formato tradicional con bordes y estilo formal'
            },
            {
                id: 'minimal',
                name: 'Minimalista',
                description: 'Diseño ultra limpio con mínimo decorativo'
            },
            {
                id: 'corporate',
                name: 'Corporativa',
                description: 'Estilo profesional con branding destacado'
            }
        ];
    },

    /**
     * Generate and download PDF
     * 
     * @param invoice - Invoice data
     * @param options - Generation options
     * @param filename - Optional filename override
     */
    downloadInvoicePdf: (
        invoice: Invoice,
        options: InvoicePdfOptions = {},
        filename?: string
    ): void => {
        const pdfBuffer = generateInvoiceWithTemplate(invoice, options);
        const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = filename || `${invoice.fullNumber.replace(/\//g, '_')}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    },

    /**
     * Preview PDF in new tab
     * 
     * @param invoice - Invoice data
     * @param options - Generation options
     */
    previewInvoicePdf: (
        invoice: Invoice,
        options: InvoicePdfOptions = {}
    ): void => {
        const pdfBuffer = generateInvoiceWithTemplate(invoice, options);
        const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
    },

    /**
     * Legacy support - generate PDF with old format
     * @deprecated Use generateInvoicePdf with template instead
     */
    generateInvoicePdfLegacy: (
        invoice: Invoice,
        options: { lang?: 'es' | 'en' } = {}
    ): ArrayBuffer => {
        const { lang = 'es' } = options;
        const doc = new jsPDF();

        // Legacy implementation (simplified version of original)
        const formatDate = (date: any): string => {
            if (!date) return '-';
            let d: Date;
            if (date instanceof Date) d = date;
            else if (typeof date.toDate === 'function') d = date.toDate();
            else if (date.seconds) d = new Date(date.seconds * 1000);
            else d = new Date(date);
            return d.toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US');
        };

        const formatCurrency = (amount: number): string => {
            return new Intl.NumberFormat(lang === 'es' ? 'es-ES' : 'en-US', {
                style: 'currency',
                currency: 'EUR'
            }).format(amount || 0);
        };

        const safeText = (text: any, fallback: string = ''): string => {
            if (text === null || text === undefined) return fallback;
            return String(text);
        };

        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 20;
        let y = margin;

        // Header
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(safeText(invoice.issuerSnapshot?.fiscalName, 'REPAART'), margin, y);
        y += 7;

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        if (invoice.issuerSnapshot?.cif) {
            doc.text(`CIF: ${safeText(invoice.issuerSnapshot.cif)}`, margin, y);
            y += 5;
        }

        // Invoice number
        const titleX = pageWidth - margin - 60;
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text(lang === 'es' ? 'FACTURA' : 'INVOICE', titleX, margin);
        doc.setFontSize(12);
        doc.text(safeText(invoice.fullNumber, 'N/A'), titleX, margin + 8);
        doc.setFontSize(9);
        doc.text(`${lang === 'es' ? 'Fecha' : 'Date'}: ${formatDate(invoice.issueDate)}`, titleX, margin + 16);

        y = Math.max(y, margin + 35);

        // Customer
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(lang === 'es' ? 'FACTURAR A:' : 'BILL TO:', margin, y);
        y += 7;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(safeText(invoice.customerSnapshot?.fiscalName, 'Cliente'), margin, y);
        y += 10;

        // Table
        const tableData = (invoice.lines || []).map(line => [
            safeText(line.description, '-'),
            (line.quantity || 0).toString(),
            formatCurrency(line.unitPrice || 0),
            `${((line.taxRate || 0) * 100).toFixed(0)}%`,
            formatCurrency(line.total || 0)
        ]);

        autoTable(doc, {
            startY: y,
            head: [[
                lang === 'es' ? 'Descripción' : 'Description',
                lang === 'es' ? 'Cantidad' : 'Quantity',
                lang === 'es' ? 'Precio' : 'Price',
                lang === 'es' ? 'IVA' : 'VAT',
                lang === 'es' ? 'Total' : 'Total'
            ]],
            body: tableData,
            theme: 'striped',
            headStyles: {
                fillColor: [34, 197, 94],
                textColor: 255,
                fontSize: 9,
                fontStyle: 'bold'
            },
            bodyStyles: { fontSize: 9 },
            columnStyles: {
                0: { cellWidth: 60 },
                1: { cellWidth: 25, halign: 'center' },
                2: { cellWidth: 30, halign: 'right' },
                3: { cellWidth: 20, halign: 'center' },
                4: { cellWidth: 30, halign: 'right' }
            }
        });

        y = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ? (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable!.finalY + 10 : y + 50;

        // Totals
        const totalsX = pageWidth - margin - 60;
        doc.setFontSize(9);
        doc.text(`${lang === 'es' ? 'Subtotal' : 'Subtotal'}:`, totalsX - 35, y);
        doc.text(formatCurrency(invoice.subtotal || 0), totalsX + 25, y, { align: 'right' });
        y += 5;

        if (invoice.taxBreakdown) {
            invoice.taxBreakdown.forEach((tax: any) => {
                doc.text(`IVA (${(tax.taxRate * 100).toFixed(0)}%):`, totalsX - 35, y);
                doc.text(formatCurrency(tax.taxAmount || 0), totalsX + 25, y, { align: 'right' });
                y += 5;
            });
        }

        y += 5;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(`${lang === 'es' ? 'TOTAL' : 'TOTAL'}:`, totalsX - 35, y);
        doc.text(formatCurrency(invoice.total || 0), totalsX + 25, y, { align: 'right' });

        return doc.output('arraybuffer');
    }
};

export default invoicePdfGenerator;
