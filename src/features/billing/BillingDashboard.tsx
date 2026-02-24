/**
 * Billing Dashboard Component - Reorganizado en 3 secciones:
 * 
 * 1. CLIENTES: Gestión completa de clientes (restaurantes)
 *    - Crear, editar, ver y eliminar clientes
 *    - Base de datos de clientes para facturación
 * 
 * 2. TARIFAS: Configuración de precios
 *    - Tarifas por distancia (km)
 *    - Configuración personalizada
 * 
 * 3. FACTURAS: Emisión y gestión completa
 *    - Crear facturas
 *    - Lista y estado de facturas
 *    - Deudas y cobros
 *    - Impuestos y cierres fiscales
 *
 * Features:
 * - Flujo claro: Clientes → Tarifas → Facturas
 * - Integración completa con backend
 * - Responsive design
 */

import React, { useState, useEffect } from 'react';
import { Plus, Users, Settings2, FileText, TrendingDown, Database, Building2, Target } from 'lucide-react';
import { Tabs, Button, Modal, Card, Form, Input, message } from 'antd';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { CustomersManager } from './components/CustomersManager';
import { InvoiceListView } from './components/InvoiceListView';
import { DebtDashboardView } from './components/DebtDashboardView';
import { TaxVaultPanel } from './components/TaxVaultPanel';
import { SimpleInvoiceCreator } from './components/SimpleInvoiceCreator';
import FranchiseRateConfigurator from '../franchise/FranchiseRateConfigurator';
import BillingWorkflowGuide from '../franchise/components/BillingWorkflowGuide';
import { invoiceEngine } from '../../services/billing';
import './BillingDashboard.css';

interface Props {
    franchiseId: string;
}

export const BillingDashboard: React.FC<Props> = ({ franchiseId }) => {
    const [activeTab, setActiveTab] = useState('customers');
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [isFranchiseModalOpen, setIsFranchiseModalOpen] = useState(false);
    const [showGuide, setShowGuide] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [loading, setLoading] = useState(true);
    const [companyForm] = Form.useForm();

    // Datos de la empresa
    const [companyData, setCompanyData] = useState<{
        legalName: string;
        cif: string;
        address: string;
        zipCode: string;
        city: string;
        province: string;
    } | null>(null);

    // Sincronizar formulario solo cuando el modal esté abierto para evitar advertencias de "Instance not connected"
    useEffect(() => {
        if (isFranchiseModalOpen && companyData) {
            companyForm.setFieldsValue(companyData);
        }
    }, [isFranchiseModalOpen, companyData, companyForm]);

    // Cargar datos de la empresa (solo datos, sin tocar el form directamente aquí)
    useEffect(() => {
        const loadCompanyData = async () => {
            if (!franchiseId) return;

            try {
                const userDocRef = doc(db, 'users', franchiseId); // Original path
                const userDocSnap = await getDoc(userDocRef);

                if (userDocSnap.exists()) {
                    const data = userDocSnap.data();
                    const companyInfo = {
                        legalName: data.legalName || data.fiscalName || data.businessName || data.displayName || '',
                        cif: data.cif || data.vatNumber || data.taxId || '',
                        address: data.address || '',
                        zipCode: data.zipCode || data.address?.zipCode || '',
                        city: data.city || data.address?.city || '',
                        province: data.province || data.address?.province || ''
                    };
                    setCompanyData(companyInfo);
                }
            } catch (error) {
                console.error('[BillingDashboard] Error loading company data:', error);
            }
        };

        loadCompanyData();
    }, [franchiseId]);

    const handleCreateInvoice = () => {
        // Verificar si hay datos de empresa
        if (!companyData?.legalName || !companyData?.cif) {
            message.error({
                content: 'Debes configurar los datos de tu empresa antes de crear facturas. Haz clic en "Datos Franquicia".',
                duration: 5
            });
            return;
        }
        setIsWizardOpen(true);
    };

    const handleSaveCompanyData = async (values: {
        legalName: string;
        cif: string;
        address: string;
        zipCode: string;
        city: string;
        province: string;
    }) => {
        try {
            setLoading(true);
            const userDocRef = doc(db, 'users', franchiseId);

            await setDoc(userDocRef, {
                legalName: values.legalName,
                cif: values.cif,
                address: values.address,
                zipCode: values.zipCode,
                city: values.city,
                province: values.province,
                updatedAt: serverTimestamp()
            }, { merge: true });

            setCompanyData(values);
            message.success('Datos de la empresa guardados correctamente');
            setIsFranchiseModalOpen(false);
        } catch (error) {
            console.error('[BillingDashboard] Error saving company data:', error);
            message.error('Error al guardar los datos');
        } finally {
            setLoading(false);
        }
    };

    const refreshInvoices = React.useCallback(async () => {
        setLoading(true);
        await invoiceEngine.getInvoicesByFranchise(franchiseId);
        setLoading(false);
    }, [franchiseId]);

    React.useEffect(() => {
        refreshInvoices();
    }, [refreshInvoices, refreshTrigger]);

    const tabItems = [
        {
            key: 'customers',
            label: (
                <span className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Clientes
                </span>
            ),
            children: (
                <div className="animate-in slide-in-from-bottom-4 duration-300">
                    <div className="mb-6">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                            Gestión de Clientes
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Administra tus clientes (restaurantes y locales). Crea, edita y gestiona la información de contacto y fiscal.
                        </p>
                    </div>
                    <CustomersManager franchiseId={franchiseId} />
                </div>
            )
        },
        {
            key: 'tariffs',
            label: (
                <span className="flex items-center gap-2">
                    <Settings2 className="w-4 h-4" />
                    Tarifas
                </span>
            ),
            children: (
                <div className="animate-in slide-in-from-bottom-4 duration-300">
                    <div className="mb-6">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                            Configuración de Tarifas
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Define los precios por kilómetro para el cálculo automático de facturas logísticas.
                        </p>
                    </div>
                    <FranchiseRateConfigurator franchiseId={franchiseId} />
                </div>
            )
        },
        {
            key: 'invoices',
            label: (
                <span className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Facturas
                </span>
            ),
            children: (
                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
                    {/* 1. Widget de Facturación - Prioridad 1 (Fundamental) */}
                    <Card
                        className="shadow-sm border-slate-200 dark:border-slate-800"
                        title={
                            <div className="flex items-center gap-2 py-1">
                                <FileText className="w-5 h-5 text-indigo-500" />
                                <span className="text-sm font-bold uppercase tracking-wider">Listado de Facturación</span>
                            </div>
                        }
                    >
                        <InvoiceListView
                            franchiseId={franchiseId}
                            refreshTrigger={refreshTrigger}
                            onRefresh={() => setRefreshTrigger(prev => prev + 1)}
                        />
                    </Card>

                    {/* 2. Widget de Gestión de Deudas - Prioridad 2 (Recatado) */}
                    <Card
                        size="small"
                        className="shadow-sm border-slate-200 dark:border-slate-800"
                        title={
                            <div className="flex items-center gap-2 py-0.5">
                                <TrendingDown className="w-4 h-4 text-red-400" />
                                <span className="text-xs font-semibold uppercase tracking-tight text-slate-500">Gestión de Deudas e Impagos</span>
                            </div>
                        }
                    >
                        <DebtDashboardView franchiseId={franchiseId} refreshTrigger={refreshTrigger} />
                    </Card>

                    {/* 3. Widget de Impuestos y Cierres - Prioridad 3 (Recatado) */}
                    <Card
                        size="small"
                        className="shadow-sm border-slate-200 dark:border-slate-800"
                        title={
                            <div className="flex items-center gap-2 py-0.5">
                                <Database className="w-4 h-4 text-emerald-400" />
                                <span className="text-xs font-semibold uppercase tracking-tight text-slate-500">Caja Fuerte Fiscal y Cierres</span>
                            </div>
                        }
                    >
                        <TaxVaultPanel franchiseId={franchiseId} refreshTrigger={refreshTrigger} />
                    </Card>
                </div>
            )
        }
    ];

    return (
        <div className="pt-2">
            {/* Tabs - 3 Secciones Principales */}
            <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                items={tabItems}
                className="billing-tabs"
                type="card"
                size="large"
                tabBarExtraContent={
                    <div className="flex items-center gap-2">
                        <Button
                            type="default"
                            size="middle"
                            icon={<Building2 size={16} />}
                            onClick={() => setIsFranchiseModalOpen(true)}
                            className="h-9 px-4 flex items-center gap-2"
                        >
                            <span className="font-bold text-xs">Datos Franquicia</span>
                        </Button>
                        <Button
                            type="default"
                            size="middle"
                            icon={<Target size={16} className="text-ruby-600" />}
                            onClick={() => setShowGuide(true)}
                            className="h-9 px-4 flex items-center gap-2 border-ruby-100 hover:border-ruby-200 hover:bg-ruby-50/50"
                        >
                            <span className="font-bold text-xs text-ruby-600">Guía</span>
                        </Button>
                        <Button
                            type="primary"
                            icon={<Plus size={20} strokeWidth={2.5} />}
                            onClick={handleCreateInvoice}
                            className="bg-emerald-600 hover:bg-emerald-500 border-none h-11 px-6 flex items-center gap-2 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.4)] hover:shadow-[0_0_20px_rgba(16,185,129,0.6)] hover:scale-105 transition-all duration-300 animate-pulse-emerald relative z-10"
                        >
                            <span className="font-bold text-sm tracking-wide uppercase">Nueva Factura</span>
                        </Button>
                    </div>
                }
            />

            {/* Modal del Creador de Facturas */}
            <Modal
                open={isWizardOpen}
                onCancel={() => setIsWizardOpen(false)}
                footer={null}
                width={{ xs: '98%', sm: '95%', md: '90%', lg: 1000 }}
                centered
                className="invoice-creator-modal"
                destroyOnHidden
                style={{ maxWidth: '95vw', top: 20 }}
                styles={{ body: { height: 'calc(90vh - 100px)', padding: 0 } }}
            >
                <SimpleInvoiceCreator
                    franchiseId={franchiseId}
                    onClose={() => setIsWizardOpen(false)}
                    onSuccess={() => {
                        setRefreshTrigger(prev => prev + 1);
                        setIsWizardOpen(false);
                    }}
                />
            </Modal>

            {/* Modal de Datos de Franquicia */}
            <Modal
                title={
                    <div className="flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-indigo-600" />
                        <span>Datos de la Empresa</span>
                    </div>
                }
                open={isFranchiseModalOpen}
                onCancel={() => setIsFranchiseModalOpen(false)}
                footer={null}
                width={600}
                centered
            >
                <div className="py-4">
                    <p className="text-slate-500 mb-6 text-sm">
                        Estos datos aparecerán como emisor en todas tus facturas. Es obligatorio completarlos antes de crear facturas.
                    </p>

                    <Form
                        form={companyForm}
                        layout="vertical"
                        onFinish={handleSaveCompanyData}
                        autoComplete="off"
                    >
                        <Form.Item
                            label="Nombre / Razón Social"
                            name="legalName"
                            rules={[{ required: true, message: 'El nombre es obligatorio' }]}
                        >
                            <Input placeholder="Ej: Repaart Logistics S.L." />
                        </Form.Item>

                        <Form.Item
                            label="DNI / CIF"
                            name="cif"
                            rules={[{ required: true, message: 'El CIF es obligatorio' }]}
                        >
                            <Input placeholder="Ej: B12345678" />
                        </Form.Item>

                        <Form.Item
                            label="Dirección"
                            name="address"
                            rules={[{ required: true, message: 'La dirección es obligatoria' }]}
                        >
                            <Input placeholder="Ej: Calle Mayor 123" />
                        </Form.Item>

                        <div className="grid grid-cols-3 gap-4">
                            <Form.Item
                                label="Código Postal"
                                name="zipCode"
                                rules={[{ required: true, message: 'Requerido' }]}
                            >
                                <Input placeholder="Ej: 28001" />
                            </Form.Item>

                            <Form.Item
                                label="Ciudad"
                                name="city"
                                rules={[{ required: true, message: 'Requerido' }]}
                                className="col-span-2"
                            >
                                <Input placeholder="Ej: Madrid" />
                            </Form.Item>
                        </div>

                        <Form.Item
                            label="Provincia"
                            name="province"
                            rules={[{ required: true, message: 'La provincia es obligatoria' }]}
                        >
                            <Input placeholder="Ej: Madrid" />
                        </Form.Item>

                        <div className="flex justify-end gap-3 mt-6">
                            <Button onClick={() => setIsFranchiseModalOpen(false)}>
                                Cancelar
                            </Button>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={loading}
                                className="bg-indigo-600 hover:bg-indigo-700"
                            >
                                Guardar Datos
                            </Button>
                        </div>
                    </Form>
                </div>
            </Modal>

            {/* Guía Interactiva de Facturación */}
            <BillingWorkflowGuide
                isOpen={showGuide}
                onClose={() => setShowGuide(false)}
                onNavigate={(tabKey) => {
                    setActiveTab(tabKey);
                    setShowGuide(false);
                }}
            />
        </div>
    );
};

export default BillingDashboard;
