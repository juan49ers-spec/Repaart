import React, { useState, useEffect } from 'react';
import { X, FileText, Eye, CheckCircle, AlertTriangle, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { invoicePdfGenerator } from '../../../services/billing';
import type { Invoice, IssuerSnapshot } from '../../../types/invoicing';

interface InvoicePreviewModalProps {
    invoice: Invoice | null;
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    onTemplateChange?: (template: string) => void;
}

const templates = [
    { id: 'modern', name: 'Moderna', description: 'Diseño limpio con acentos de color', color: 'bg-emerald-500' },
    { id: 'classic', name: 'Clásica', description: 'Formato tradicional con bordes', color: 'bg-slate-600' },
    { id: 'minimal', name: 'Minimalista', description: 'Ultra limpio sin decoración', color: 'bg-gray-400' },
    { id: 'corporate', name: 'Corporativa', description: 'Estilo profesional con branding', color: 'bg-blue-600' },
];

export const InvoicePreviewModal: React.FC<InvoicePreviewModalProps> = ({
    invoice,
    isOpen,
    onClose,
    onConfirm,
    onTemplateChange
}) => {
    const [selectedTemplate, setSelectedTemplate] = useState<string>(invoice?.template || 'modern');
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [activeTab, setActiveTab] = useState<'preview' | 'details'>('preview');
    const [freshIssuerData, setFreshIssuerData] = useState<IssuerSnapshot | null>(null);
    const [isLoadingIssuer, setIsLoadingIssuer] = useState(false);

    // Cargar datos frescos del emisor cuando se abre el modal
    useEffect(() => {
        if (isOpen && invoice?.franchiseId) {
            loadFreshIssuerData();
        }
    }, [isOpen, invoice?.franchiseId]);

    // Cargar datos actualizados de la empresa desde Firestore
    const loadFreshIssuerData = async () => {
        if (!invoice?.franchiseId) return;
        
        setIsLoadingIssuer(true);
        try {
            const userDocRef = doc(db, 'users', invoice.franchiseId);
            const userDocSnap = await getDoc(userDocRef);
            
            if (userDocSnap.exists()) {
                const data = userDocSnap.data();
                
                // Construir issuerSnapshot con datos frescos
                const issuerData: IssuerSnapshot = {
                    id: invoice.franchiseId,
                    fiscalName: data.legalName || data.fiscalName || data.businessName || data.displayName || invoice.issuerSnapshot?.fiscalName || 'Sin nombre',
                    cif: data.cif || data.vatNumber || data.taxId || invoice.issuerSnapshot?.cif || 'N/A',
                    address: {
                        street: data.address || data.street || invoice.issuerSnapshot?.address?.street || 'N/A',
                        city: data.city || invoice.issuerSnapshot?.address?.city || 'N/A',
                        zipCode: data.zipCode || data.postalCode || invoice.issuerSnapshot?.address?.zipCode || 'N/A',
                        province: data.province || invoice.issuerSnapshot?.address?.province || 'N/A',
                        country: data.country || invoice.issuerSnapshot?.address?.country || 'España'
                    },
                    email: data.email || invoice.issuerSnapshot?.email || '',
                    phone: data.phone || data.phoneNumber || data.mobile || invoice.issuerSnapshot?.phone || ''
                };
                
                setFreshIssuerData(issuerData);
                console.log('[InvoicePreview] Fresh issuer data loaded:', issuerData);
            } else {
                console.warn('[InvoicePreview] No user document found for franchiseId:', invoice.franchiseId);
                setFreshIssuerData(null);
            }
        } catch (error) {
            console.error('[InvoicePreview] Error loading fresh issuer data:', error);
            setFreshIssuerData(null);
        } finally {
            setIsLoadingIssuer(false);
        }
    };

    // Generar PDF cuando cambia la plantilla o se abre el modal
    useEffect(() => {
        if (isOpen && invoice && !isLoadingIssuer) {
            generatePreview();
        }
    }, [isOpen, invoice, selectedTemplate, freshIssuerData, isLoadingIssuer]);

    // Limpiar URL cuando se cierra
    useEffect(() => {
        if (!isOpen && pdfUrl) {
            URL.revokeObjectURL(pdfUrl);
            setPdfUrl(null);
        }
    }, [isOpen, pdfUrl]);

    const generatePreview = () => {
        if (!invoice) return;
        
        setIsGenerating(true);
        try {
            // Usar datos frescos del emisor si están disponibles, si no usar los del invoice
            const issuerSnapshot = freshIssuerData || invoice.issuerSnapshot || {
                id: invoice.franchiseId,
                fiscalName: 'Sin nombre',
                cif: 'N/A',
                address: { street: 'N/A', city: 'N/A', zipCode: 'N/A', province: 'N/A', country: 'España' },
                email: '',
                phone: ''
            };
            
            // Asegurar que el invoice tiene los datos mínimos necesarios
            const invoiceWithDefaults = {
                ...invoice,
                // Usar datos frescos del emisor
                issuerSnapshot,
                // Asegurar que customerSnapshot tiene datos
                customerSnapshot: invoice.customerSnapshot || {
                    fiscalName: 'Sin nombre',
                    cif: 'N/A',
                    address: { street: 'N/A', city: 'N/A', zipCode: 'N/A', province: 'N/A', country: 'España' }
                },
                // Asegurar que lines es un array
                lines: invoice.lines || [],
                // Asegurar valores numéricos
                subtotal: invoice.subtotal || 0,
                total: invoice.total || 0,
                taxBreakdown: invoice.taxBreakdown || []
            };

            console.log('[InvoicePreview] Generating PDF with template:', selectedTemplate);
            console.log('[InvoicePreview] Invoice data:', invoiceWithDefaults);

            // Generar PDF con la plantilla seleccionada
            const pdfBuffer = invoicePdfGenerator.generateInvoicePdf(invoiceWithDefaults, {
                template: selectedTemplate as 'modern' | 'classic' | 'minimal' | 'corporate',
                lang: 'es',
                showPaymentInfo: true
            });

            // Crear URL para preview
            const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            
            if (pdfUrl) {
                URL.revokeObjectURL(pdfUrl);
            }
            
            setPdfUrl(url);
            console.log('[InvoicePreview] PDF generated successfully');
        } catch (error) {
            console.error('[InvoicePreview] Error generando preview:', error);
            // Mostrar error en consola para debugging
            if (error instanceof Error) {
                console.error('[InvoicePreview] Error details:', error.message);
                console.error('[InvoicePreview] Error stack:', error.stack);
            }
        } finally {
            setIsGenerating(false);
        }
    };

    const handleTemplateChange = (templateId: string) => {
        setSelectedTemplate(templateId);
        if (onTemplateChange) {
            onTemplateChange(templateId);
        }
    };

    const handleDownload = () => {
        if (!pdfUrl || !invoice) return;
        
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = `${invoice.fullNumber}_preview.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (!isOpen || !invoice) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        className="bg-white dark:bg-slate-900 w-full max-w-6xl h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                                    <Eye className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Vista Previa de Factura</h2>
                                    <p className="text-sm text-slate-500">{invoice.fullNumber}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleDownload}
                                    disabled={!pdfUrl || isGenerating}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                                >
                                    <Download className="w-4 h-4" />
                                    Descargar
                                </button>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                >
                                    <X className="w-5 h-5 text-slate-500" />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 flex overflow-hidden">
                            {/* Left Panel - Controls */}
                            <div className="w-80 border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-6 overflow-y-auto">
                                {/* Tabs */}
                                <div className="flex gap-2 mb-6">
                                    <button
                                        onClick={() => setActiveTab('preview')}
                                        className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                                            activeTab === 'preview'
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                                        }`}
                                    >
                                        Vista Previa
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('details')}
                                        className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                                            activeTab === 'details'
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                                        }`}
                                    >
                                        Detalles
                                    </button>
                                </div>

                                {activeTab === 'preview' ? (
                                    <>
                                        {/* Template Selector */}
                                        <div className="mb-6">
                                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                                                Plantilla de PDF
                                            </label>
                                            <div className="space-y-2">
                                                {templates.map((template) => (
                                                    <button
                                                        key={template.id}
                                                        onClick={() => handleTemplateChange(template.id)}
                                                        className={`w-full p-3 rounded-xl border-2 transition-all text-left ${
                                                            selectedTemplate === template.id
                                                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                                                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-4 h-4 rounded-full ${template.color}`}></div>
                                                            <div>
                                                                <div className="font-medium text-slate-900 dark:text-white text-sm">
                                                                    {template.name}
                                                                </div>
                                                                <div className="text-xs text-slate-500">
                                                                    {template.description}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Quick Actions */}
                                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                                            <div className="flex items-start gap-3">
                                                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                                                        Revisar antes de emitir
                                                    </p>
                                                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                                                        Verifique que todos los datos sean correctos. Una vez emitida, la factura no podrá modificarse.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        {/* Invoice Details */}
                                        <div className="space-y-4">
                                            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                                                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Emisor</h3>
                                                <div className="space-y-1 text-sm">
                                                    <p className="font-medium text-slate-900 dark:text-white">
                                                        {freshIssuerData?.fiscalName || invoice.issuerSnapshot?.fiscalName}
                                                    </p>
                                                    <p className="text-slate-500">
                                                        CIF: {freshIssuerData?.cif || invoice.issuerSnapshot?.cif}
                                                    </p>
                                                    <p className="text-slate-500">
                                                        {freshIssuerData?.phone || invoice.issuerSnapshot?.phone}
                                                    </p>
                                                    {freshIssuerData && (
                                                        <p className="text-xs text-emerald-600 mt-2">
                                                            ✓ Datos actualizados
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                                                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Cliente</h3>
                                                <div className="space-y-1 text-sm">
                                                    <p className="font-medium text-slate-900 dark:text-white">{invoice.customerSnapshot?.fiscalName}</p>
                                                    <p className="text-slate-500">CIF: {invoice.customerSnapshot?.cif}</p>
                                                </div>
                                            </div>

                                            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                                                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Totales</h3>
                                                <div className="space-y-2 text-sm">
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-500">Subtotal</span>
                                                        <span className="text-slate-900 dark:text-white">{invoice.subtotal?.toFixed(2)}€</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-500">IVA</span>
                                                        <span className="text-slate-900 dark:text-white">{(invoice.total - invoice.subtotal)?.toFixed(2)}€</span>
                                                    </div>
                                                    <div className="border-t border-slate-200 dark:border-slate-700 pt-2 flex justify-between font-semibold">
                                                        <span className="text-slate-900 dark:text-white">Total</span>
                                                        <span className="text-indigo-600 dark:text-indigo-400">{invoice.total?.toFixed(2)}€</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* Action Buttons */}
                                <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
                                    <button
                                        onClick={onConfirm}
                                        disabled={isGenerating}
                                        className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                                    >
                                        <CheckCircle className="w-5 h-5" />
                                        {isGenerating ? 'Generando...' : 'Confirmar y Emitir'}
                                    </button>
                                    
                                    <button
                                        onClick={onClose}
                                        className="w-full mt-2 py-3 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>

                            {/* Right Panel - PDF Preview */}
                            <div className="flex-1 bg-slate-100 dark:bg-slate-950 p-6 overflow-hidden">
                                {isGenerating ? (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <div className="text-center">
                                            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                            <p className="text-slate-600 dark:text-slate-400">Generando PDF...</p>
                                        </div>
                                    </div>
                                ) : pdfUrl ? (
                                    <div className="w-full h-full bg-white rounded-xl shadow-lg overflow-hidden">
                                        <iframe
                                            src={pdfUrl}
                                            className="w-full h-full border-0"
                                            title="Vista previa de factura"
                                        />
                                    </div>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <div className="text-center text-slate-400">
                                            <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                            <p>No se pudo generar la vista previa</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default InvoicePreviewModal;
