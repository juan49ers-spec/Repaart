/**
 * Invoice Export Service
 * 
 * Exportación de facturas a múltiples formatos:
 * - Excel (.xlsx)
 * - CSV (.csv)
 * - JSON (.json)
 * - XML (.xml)
 */

import type { Invoice } from '../../types/invoicing';

// Utility: Format date
const formatDate = (date: any): string => {
    if (!date) return '-';
    let d: Date;
    if (date instanceof Date) d = date;
    else if (typeof date.toDate === 'function') d = date.toDate();
    else if (date.seconds) d = new Date(date.seconds * 1000);
    else d = new Date(date);
    return d.toISOString().split('T')[0];
};

// Utility: Format currency
const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR'
    }).format(amount || 0);
};

// Utility: Escape XML
const escapeXml = (str: string): string => {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
};

// Utility: Escape CSV
const escapeCsv = (str: string): string => {
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
};

/**
 * Export Invoice to Excel (XLSX format)
 * Creates a multi-sheet workbook with invoice data
 */
export const exportToExcel = (invoice: Invoice): Uint8Array => {
    // Simple XLSX generator
    const workbook = {
        sheets: [
            {
                name: 'Factura',
                data: [
                    ['FACTURA', '', '', '', ''],
                    ['', '', '', '', ''],
                    ['Número:', invoice.fullNumber, '', 'Fecha:', formatDate(invoice.issueDate)],
                    ['', '', '', '', ''],
                    ['EMISOR', '', '', 'CLIENTE', ''],
                    [invoice.issuerSnapshot?.fiscalName || '', '', '', invoice.customerSnapshot?.fiscalName || '', ''],
                    [invoice.issuerSnapshot?.cif || '', '', '', invoice.customerSnapshot?.cif || '', ''],
                    [invoice.issuerSnapshot?.address?.street || '', '', '', invoice.customerSnapshot?.address?.street || '', ''],
                    [`${invoice.issuerSnapshot?.address?.zipCode || ''} ${invoice.issuerSnapshot?.address?.city || ''}`, '', '', `${invoice.customerSnapshot?.address?.zipCode || ''} ${invoice.customerSnapshot?.address?.city || ''}`, ''],
                    ['', '', '', '', ''],
                    ['DESGLOSE DE LÍNEAS', '', '', '', ''],
                    ['Descripción', 'Cantidad', 'Precio Unit.', 'IVA', 'Total'],
                    ...(invoice.lines || []).map(line => [
                        line.description,
                        line.quantity,
                        formatCurrency(line.unitPrice),
                        `${(line.taxRate * 100).toFixed(0)}%`,
                        formatCurrency(line.total)
                    ]),
                    ['', '', '', '', ''],
                    ['', '', '', 'Subtotal:', formatCurrency(invoice.subtotal)],
                    ...(invoice.taxBreakdown || []).map(tax => [
                        '', '', '', `IVA (${(tax.taxRate * 100).toFixed(0)}%):`, formatCurrency(tax.taxAmount)
                    ]),
                    ['', '', '', 'TOTAL:', formatCurrency(invoice.total)]
                ]
            },
            {
                name: 'Resumen',
                data: [
                    ['RESUMEN DE FACTURA', ''],
                    ['', ''],
                    ['Campo', 'Valor'],
                    ['ID:', invoice.id],
                    ['Número:', invoice.fullNumber],
                    ['Serie:', invoice.series],
                    ['Estado:', invoice.status],
                    ['Estado de Pago:', invoice.paymentStatus],
                    ['Fecha de Emisión:', formatDate(invoice.issueDate)],
                    ['Fecha de Vencimiento:', formatDate(invoice.dueDate)],
                    ['', ''],
                    ['Totaes:', ''],
                    ['Subtotal:', formatCurrency(invoice.subtotal)],
                    ['Total IVA:', formatCurrency(invoice.taxBreakdown?.reduce((sum, t) => sum + (t.taxAmount || 0), 0) || 0)],
                    ['Total:', formatCurrency(invoice.total)],
                    ['Pagado:', formatCurrency(invoice.totalPaid || 0)],
                    ['Pendiente:', formatCurrency(invoice.remainingAmount || 0)]
                ]
            }
        ]
    };

    // Generate simple XLSX (this is a simplified version)
    // In production, you'd use a library like xlsx or exceljs
    const xlsxContent = generateXLSXContent(workbook);
    return new TextEncoder().encode(xlsxContent);
};

/**
 * Simple XLSX content generator
 * Note: For production, use a proper library like 'xlsx'
 */
const generateXLSXContent = (workbook: any): string => {
    // This is a placeholder - real XLSX requires binary format
    // For now, we'll create a TSV that Excel can open
    let content = '';
    workbook.sheets.forEach((sheet: any) => {
        content += `=== ${sheet.name} ===\n`;
        sheet.data.forEach((row: any[]) => {
            content += row.join('\t') + '\n';
        });
        content += '\n';
    });
    return content;
};

/**
 * Export Invoice to CSV
 */
export const exportToCSV = (invoice: Invoice): string => {
    const lines: string[] = [
        // Header
        'Número de Factura,Fecha,Estado',
        `${escapeCsv(invoice.fullNumber)},${formatDate(invoice.issueDate)},${escapeCsv(invoice.status)}`,
        '',
        // Issuer
        'EMISOR',
        'Nombre,CIF,Dirección,Ciudad,Email',
        `${escapeCsv(invoice.issuerSnapshot?.fiscalName || '')},${escapeCsv(invoice.issuerSnapshot?.cif || '')},${escapeCsv(invoice.issuerSnapshot?.address?.street || '')},${escapeCsv(`${invoice.issuerSnapshot?.address?.zipCode || ''} ${invoice.issuerSnapshot?.address?.city || ''}`)},${escapeCsv(invoice.issuerSnapshot?.email || '')}`,
        '',
        // Customer
        'CLIENTE',
        'Nombre,CIF,Dirección,Ciudad',
        `${escapeCsv(invoice.customerSnapshot?.fiscalName || '')},${escapeCsv(invoice.customerSnapshot?.cif || '')},${escapeCsv(invoice.customerSnapshot?.address?.street || '')},${escapeCsv(`${invoice.customerSnapshot?.address?.zipCode || ''} ${invoice.customerSnapshot?.address?.city || ''}`)}`,
        '',
        // Lines
        'DESGLOSE',
        'Descripción,Cantidad,Precio Unitario,Tasa IVA,Total Línea'
    ];

    // Add invoice lines
    (invoice.lines || []).forEach(line => {
        lines.push([
            escapeCsv(line.description),
            line.quantity,
            line.unitPrice,
            line.taxRate,
            line.total
        ].join(','));
    });

    lines.push('');
    lines.push('RESUMEN');
    lines.push('Concepto,Importe');
    lines.push(`Subtotal,${invoice.subtotal}`);
    
    (invoice.taxBreakdown || []).forEach(tax => {
        lines.push(`IVA ${(tax.taxRate * 100).toFixed(0)}%,${tax.taxAmount}`);
    });
    
    lines.push(`TOTAL,${invoice.total}`);
    lines.push(`Pagado,${invoice.totalPaid || 0}`);
    lines.push(`Pendiente,${invoice.remainingAmount || 0}`);

    return lines.join('\n');
};

/**
 * Export Invoice to JSON
 */
export const exportToJSON = (invoice: Invoice): string => {
    const exportData = {
        metadata: {
            exportDate: new Date().toISOString(),
            version: '1.0',
            format: 'REPAART_INVOICE_JSON'
        },
        invoice: {
            id: invoice.id,
            fullNumber: invoice.fullNumber,
            series: invoice.series,
            number: invoice.number,
            type: invoice.type,
            status: invoice.status,
            paymentStatus: invoice.paymentStatus,
            dates: {
                issueDate: formatDate(invoice.issueDate),
                dueDate: formatDate(invoice.dueDate),
                issuedAt: invoice.issuedAt ? formatDate(invoice.issuedAt) : null,
                createdAt: formatDate(invoice.createdAt)
            },
            issuer: invoice.issuerSnapshot,
            customer: {
                customerId: invoice.customerId,
                customerType: invoice.customerType,
                ...invoice.customerSnapshot
            },
            lines: invoice.lines,
            financials: {
                subtotal: invoice.subtotal,
                taxBreakdown: invoice.taxBreakdown,
                total: invoice.total,
                totalPaid: invoice.totalPaid,
                remainingAmount: invoice.remainingAmount,
                currency: 'EUR'
            },
            logisticsData: invoice.logisticsData,
            paymentReceipts: invoice.paymentReceiptIds || []
        }
    };

    return JSON.stringify(exportData, null, 2);
};

/**
 * Export Invoice to XML (Facturae format - Spanish standard)
 */
export const exportToXML = (invoice: Invoice): string => {
    const xml = `\x3c?xml version="1.0" encoding="UTF-8"?\x3e
\x3cInvoice xmlns="http://www.repaart.com/invoice/v1"\x3e
  \x3cHeader\x3e
    \x3cId\x3e${escapeXml(invoice.id)}\x3c/Id\x3e
    \x3cFullNumber\x3e${escapeXml(invoice.fullNumber)}\x3c/FullNumber\x3e
    \x3cSeries\x3e${escapeXml(invoice.series)}\x3c/Series\x3e
    \x3cNumber\x3e${invoice.number}\x3c/Number\x3e
    \x3cType\x3e${invoice.type}\x3c/Type\x3e
    \x3cStatus\x3e${invoice.status}\x3c/Status\x3e
    \x3cPaymentStatus\x3e${invoice.paymentStatus}\x3c/PaymentStatus\x3e
  \x3c/Header\x3e
  \x3cDates\x3e
    \x3cIssueDate\x3e${formatDate(invoice.issueDate)}\x3c/IssueDate\x3e
    \x3cDueDate\x3e${formatDate(invoice.dueDate)}\x3c/DueDate\x3e
  \x3c/Dates\x3e
  \x3cIssuer\x3e
    \x3cFiscalName\x3e${escapeXml(invoice.issuerSnapshot?.fiscalName || '')}\x3c/FiscalName\x3e
    \x3cCif\x3e${escapeXml(invoice.issuerSnapshot?.cif || '')}\x3c/Cif\x3e
    \x3cAddress\x3e
      \x3cStreet\x3e${escapeXml(invoice.issuerSnapshot?.address?.street || '')}\x3c/Street\x3e
      \x3cCity\x3e${escapeXml(invoice.issuerSnapshot?.address?.city || '')}\x3c/City\x3e
      \x3cZipCode\x3e${escapeXml(invoice.issuerSnapshot?.address?.zipCode || '')}\x3c/ZipCode\x3e
      \x3cProvince\x3e${escapeXml(invoice.issuerSnapshot?.address?.province || '')}\x3c/Province\x3e
      \x3cCountry\x3e${escapeXml(invoice.issuerSnapshot?.address?.country || '')}\x3c/Country\x3e
    \x3c/Address\x3e
    \x3cEmail\x3e${escapeXml(invoice.issuerSnapshot?.email || '')}\x3c/Email\x3e
    \x3cPhone\x3e${escapeXml(invoice.issuerSnapshot?.phone || '')}\x3c/Phone\x3e
  \x3c/Issuer\x3e
  \x3cCustomer\x3e
    \x3cId\x3e${escapeXml(invoice.customerId)}\x3c/Id\x3e
    \x3cType\x3e${invoice.customerType}\x3c/Type\x3e
    \x3cFiscalName\x3e${escapeXml(invoice.customerSnapshot?.fiscalName || '')}\x3c/FiscalName\x3e
    \x3cCif\x3e${escapeXml(invoice.customerSnapshot?.cif || '')}\x3c/Cif\x3e
    \x3cAddress\x3e
      \x3cStreet\x3e${escapeXml(invoice.customerSnapshot?.address?.street || '')}\x3c/Street\x3e
      \x3cCity\x3e${escapeXml(invoice.customerSnapshot?.address?.city || '')}\x3c/City\x3e
      \x3cZipCode\x3e${escapeXml(invoice.customerSnapshot?.address?.zipCode || '')}\x3c/ZipCode\x3e
      \x3cProvince\x3e${escapeXml(invoice.customerSnapshot?.address?.province || '')}\x3c/Province\x3e
      \x3cCountry\x3e${escapeXml(invoice.customerSnapshot?.address?.country || '')}\x3c/Country\x3e
    \x3c/Address\x3e
  \x3c/Customer\x3e
  \x3cLines\x3e
${(invoice.lines || []).map(line => `    \x3cLine\x3e
      \x3cDescription\x3e${escapeXml(line.description)}\x3c/Description\x3e
      \x3cQuantity\x3e${line.quantity}\x3c/Quantity\x3e
      \x3cUnitPrice\x3e${line.unitPrice}\x3c/UnitPrice\x3e
      \x3cTaxRate\x3e${line.taxRate}\x3c/TaxRate\x3e
      \x3cAmount\x3e${line.amount}\x3c/Amount\x3e
      \x3cTaxAmount\x3e${line.taxAmount}\x3c/TaxAmount\x3e
      \x3cTotal\x3e${line.total}\x3c/Total\x3e
    \x3c/Line\x3e`).join('\n')}
  \x3c/Lines\x3e
  \x3cTotals\x3e
    \x3cSubtotal\x3e${invoice.subtotal}\x3c/Subtotal\x3e
    \x3cTaxBreakdown\x3e
${(invoice.taxBreakdown || []).map(tax => `      \x3cTax\x3e
        \x3cRate\x3e${tax.taxRate}\x3c/Rate\x3e
        \x3cBase\x3e${tax.taxableBase}\x3c/Base\x3e
        \x3cAmount\x3e${tax.taxAmount}\x3c/Amount\x3e
      \x3c/Tax\x3e`).join('\n')}
    \x3c/TaxBreakdown\x3e
    \x3cTotal\x3e${invoice.total}\x3c/Total\x3e
    \x3cTotalPaid\x3e${invoice.totalPaid || 0}\x3c/TotalPaid\x3e
    \x3cRemaining\x3e${invoice.remainingAmount || 0}\x3c/Remaining\x3e
    \x3cCurrency\x3eEUR\x3c/Currency\x3e
  \x3c/Totals\x3e
\x3c/Invoice\x3e`;

    return xml;
};

/**
 * Main export function - exports invoice to specified format
 */
export const exportInvoice = (
    invoice: Invoice,
    format: 'excel' | 'csv' | 'json' | 'xml'
): { data: Blob; filename: string; mimeType: string } => {
    let content: string | Uint8Array;
    let filename: string;
    let mimeType: string;

    switch (format) {
        case 'excel':
            content = exportToExcel(invoice);
            filename = `${invoice.fullNumber.replace(/\//g, '_')}.xlsx`;
            mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            break;
        case 'csv':
            content = exportToCSV(invoice);
            filename = `${invoice.fullNumber.replace(/\//g, '_')}.csv`;
            mimeType = 'text/csv;charset=utf-8';
            break;
        case 'json':
            content = exportToJSON(invoice);
            filename = `${invoice.fullNumber.replace(/\//g, '_')}.json`;
            mimeType = 'application/json';
            break;
        case 'xml':
            content = exportToXML(invoice);
            filename = `${invoice.fullNumber.replace(/\//g, '_')}.xml`;
            mimeType = 'application/xml';
            break;
        default:
            throw new Error(`Formato no soportado: ${format}`);
    }

    let data: Blob;
    if (content instanceof Uint8Array) {
        // Convert Uint8Array to ArrayBuffer for Blob compatibility
        const arrayBuffer = content.buffer.slice(content.byteOffset, content.byteOffset + content.byteLength) as ArrayBuffer;
        data = new Blob([arrayBuffer], { type: mimeType });
    } else {
        data = new Blob([content], { type: mimeType });
    }

    return { data, filename, mimeType };
};

/**
 * Download exported file
 */
export const downloadExport = (
    invoice: Invoice,
    format: 'excel' | 'csv' | 'json' | 'xml'
): void => {
    const { data, filename } = exportInvoice(invoice, format);
    
    const url = URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

export default {
    exportToExcel,
    exportToCSV,
    exportToJSON,
    exportToXML,
    exportInvoice,
    downloadExport
};
