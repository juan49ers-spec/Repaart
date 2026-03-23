import React, { useState, useEffect, useCallback } from 'react';
import { X, FileText, Eye, CheckCircle, AlertTriangle, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { invoicePdfGenerator } from '../../../../services/billing';
import type { AdminInvoice, AdminInvoiceItem } from '../../../../types/billing';
import type { Invoice, IssuerSnapshot, InvoiceLine, CustomerSnapshot } from '../../../../types/invoicing';

interface AdminInvoicePreviewModalProps {
    invoice: AdminInvoice | null;
    isOpen: boolean;
    onClose: () => void;
}

const templates = [
    { id: 'modern', name: 'Modern', description: 'Diseño limpio y profesional con toques de color' },
    { id: 'classic', name: 'Classic', description: 'Estilo tradicional, legible y sobrio' },
    { id: 'minimal', name: 'Minimal', description: 'Enfoque en contenido, sin distracciones visuales' },
    { id: 'corporate', name: 'Corporate', description: 'Estructura rígida ideal para grandes empresas' }
];

export const AdminInvoicePreviewModal: React.FC<AdminInvoicePreviewModalProps> = ({
    invoice,
    isOpen,
    onClose
}) => {
    const [selectedTemplate, setSelectedTemplate] = useState<'modern' | 'classic' | 'minimal' | 'corporate'>('modern');
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    // Helper to map AdminInvoice to Invoice type
    const mapToInvoice = useCallback((adminInv: AdminInvoice): Invoice => {
        const lines: InvoiceLine[] = adminInv.items.map((item: AdminInvoiceItem) => ({
            id: item.id,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxRate: (item.taxRate || 21) / 100,
            amount: item.subtotal || (item.quantity * item.unitPrice),
            taxAmount: item.taxAmount || ((item.quantity * item.unitPrice) * 0.21),
            total: item.total || ((item.quantity * item.unitPrice) * 1.21)
        }));

        const issuer: IssuerSnapshot = {
            id: 'repaart-global',
            fiscalName: 'REPAART LOGISTICS SOLUTIONS S.L.',
            cif: 'B12345678',
            address: {
                street: 'Avenida de la Innovación, 42',
                city: 'Madrid',
                zipCode: '28001',
                province: 'Madrid',
                country: 'España'
            },
            email: 'administracion@repaart.com',
            phone: '+34 900 100 200'
        };

        const customer: CustomerSnapshot = {
            id: adminInv.franchiseId,
            fiscalName: adminInv.customerSnapshot.legalName,
            cif: adminInv.customerSnapshot.taxId || '',
            email: adminInv.customerSnapshot.billingEmail || '',
            address: typeof adminInv.customerSnapshot.address === 'string' 
                ? { street: adminInv.customerSnapshot.address, city: '', zipCode: '', province: '', country: '' }
                : { 
                    street: adminInv.customerSnapshot.address?.line1 || '', 
                    city: adminInv.customerSnapshot.address?.city || '',
                    zipCode: adminInv.customerSnapshot.address?.postalCode || '',
                    province: '',
                    country: adminInv.customerSnapshot.address?.country || 'España'
                }
        };

        return {
            id: adminInv.id || 'preview',
            franchiseId: adminInv.franchiseId,
            series: adminInv.invoiceNumber?.split('/')[0] || 'DRAFT',
            number: parseInt(adminInv.invoiceNumber?.split('/')[1] || '0'),
            fullNumber: adminInv.invoiceNumber || 'PREVIEW-DRAFT',
            type: 'STANDARD',
            status: 'DRAFT',
            paymentStatus: 'PENDING',
            customerId: adminInv.franchiseId,
            customerType: 'FRANCHISE',
            customerSnapshot: customer,
            issuerSnapshot: issuer,
            issueDate: new Date(),
            dueDate: new Date(),
            lines,
            subtotal: adminInv.subtotal,
            taxBreakdown: [{
                taxRate: 0.21,
                taxableBase: adminInv.subtotal,
                taxAmount: adminInv.taxAmount
            }],
            total: adminInv.total,
            remainingAmount: adminInv.total,
            totalPaid: 0,
            createdAt: new Date(),
            updatedAt: new Date()
        } as unknown as Invoice;
    }, []);

    // Generate PDF Preview
    const generatePreview = useCallback(() => {
        if (!invoice) return;
        
        setIsGenerating(true);
        try {
            const mappedInvoice = mapToInvoice(invoice);
            
            const pdfBuffer = invoicePdfGenerator.generateInvoicePdf(mappedInvoice, {
                template: selectedTemplate,
                lang: 'es',
                showPaymentInfo: true
            });

            const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            
            setPdfUrl(prevUrl => {
                if (prevUrl) {
                    URL.revokeObjectURL(prevUrl);
                }
                return url;
            });
        } catch (error) {
            console.error('[AdminInvoicePreview] Error generating preview:', error);
        } finally {
            setIsGenerating(false);
        }
    }, [invoice, selectedTemplate, mapToInvoice]);

    // Generate PDF Preview on dependency change
    useEffect(() => {
        if (isOpen && invoice) {
            generatePreview();
        }
    }, [isOpen, invoice, selectedTemplate, generatePreview]);

    // Cleanup URL
    useEffect(() => {
        return () => {
            if (pdfUrl) {
                URL.revokeObjectURL(pdfUrl);
            }
        };
    }, [pdfUrl]);

    if (!isOpen || !invoice) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
                />

                {/* Modal Container */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-6xl max-h-full overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center">
                                <FileText className="w-6 h-6 text-indigo-500" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                    Vista Previa Reglativa
                                </h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                    {invoice.invoiceNumber || 'Borrador'} • {invoice.customerSnapshot.legalName}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => {
                                    if (pdfUrl) {
                                        const link = document.createElement('a');
                                        link.href = pdfUrl;
                                        link.download = `Factura_${invoice.invoiceNumber || 'Borrador'}.pdf`;
                                        link.click();
                                    }
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors"
                            >
                                <Download className="w-4 h-4" />
                                Descargar PDF
                            </button>
                            <button
                                onClick={onClose}
                                title="Cerrar"
                                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>
                    </div>

                    {/* Main Work Area */}
                    <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                        {/* Sidebar: Template Selector */}
                        <div className="w-full md:w-80 bg-slate-50 dark:bg-slate-900/50 border-r border-slate-100 dark:border-slate-800 p-6 overflow-y-auto">
                            <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">
                                Configuración de Plantilla
                            </h3>
                            <div className="space-y-3">
                                {templates.map((template) => (
                                    <button
                                        key={template.id}
                                        onClick={() => setSelectedTemplate(template.id as 'modern' | 'classic' | 'minimal' | 'corporate')}
                                        className={`w-full p-4 rounded-2xl text-left border-2 transition-all ${
                                            selectedTemplate === template.id
                                                ? 'bg-white dark:bg-slate-800 border-indigo-500 shadow-md transform scale-[1.02]'
                                                : 'bg-transparent border-transparent hover:bg-white dark:hover:bg-slate-800/50 grayscale opacity-60'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm font-black text-slate-900 dark:text-white uppercase">
                                                {template.name}
                                            </span>
                                            {selectedTemplate === template.id && (
                                                <CheckCircle className="w-4 h-4 text-indigo-500" />
                                            )}
                                        </div>
                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed italic">
                                            {template.description}
                                        </p>
                                    </button>
                                ))}
                            </div>

                            <div className="mt-8 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                                <div className="flex gap-2 text-amber-600 mb-1">
                                    <AlertTriangle className="w-4 h-4 shrink-0" />
                                    <span className="text-[10px] font-black uppercase tracking-tight">Nota Administrativa</span>
                                </div>
                                <p className="text-[10px] text-amber-700/80 dark:text-amber-400/80 font-medium leading-relaxed">
                                    Esta vista previa utiliza datos fiscales reales. Asegúrese de que el diseño cumple con la normativa de su región.
                                </p>
                            </div>
                        </div>

                        {/* Preview Area */}
                        <div className="flex-1 bg-slate-200 dark:bg-slate-950 p-6 md:p-10 overflow-y-auto flex items-center justify-center relative">
                            {isGenerating ? (
                                <div className="flex flex-col items-center gap-4">
                                    <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                                    <span className="text-xs font-black text-slate-500 uppercase tracking-widest animate-pulse">
                                        Renderizando Factura...
                                    </span>
                                </div>
                            ) : pdfUrl ? (
                                <iframe
                                    src={`${pdfUrl}#toolbar=0&navpanes=0`}
                                    className="w-full max-w-4xl h-full min-h-[600px] shadow-2xl rounded-sm bg-white"
                                    title="Invoice Preview"
                                />
                            ) : (
                                <div className="flex flex-col items-center gap-4 text-slate-400">
                                    <Eye className="w-12 h-12 opacity-20" />
                                    <span className="text-xs font-bold uppercase tracking-widest">
                                        No se pudo generar la vista previa
                                    </span>
                                </div>
                            )}

                            {/* Floating Controls Overlay */}
                            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/20 dark:border-slate-800 shadow-xl flex items-center gap-6">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">
                                        Sincronizado
                                    </span>
                                </div>
                                <div className="w-px h-4 bg-slate-200 dark:bg-slate-800" />
                                <div className="flex items-center gap-4">
                                    <button 
                                        onClick={generatePreview}
                                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                        title="Recargar vista previa"
                                    >
                                        <Eye className="w-4 h-4 text-slate-400" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
