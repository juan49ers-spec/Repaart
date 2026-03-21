/**
 * Billing Dashboard Component - Reorganizado en 4 secciones:
 * 
 * 1. CLIENTES: Gestión completa de clientes (restaurantes)
 * 2. TARIFAS: Configuración de precios por distancia
 * 3. FACTURAS: Emisión, gestión y KPIs de facturación
 * 4. DEUDA & FISCAL: Deudas, impagos, hucha fiscal y cierres
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Users, Settings2, FileText, AlertTriangle, Building2, Target, Shield } from 'lucide-react';
import { Tabs, Button, Modal, Badge } from 'antd';
import { CustomersManager } from './components/CustomersManager';
import { InvoiceListView } from './components/InvoiceListView';
import { InvoiceStatsCards } from './components/InvoiceStatsCards';
import { DebtDashboardView } from './components/DebtDashboardView';
import { TaxVaultPanel } from './components/TaxVaultPanel';
import { SimpleInvoiceCreator } from './components/SimpleInvoiceCreator';
import { CompanyDataModal } from './components/CompanyDataModal';
import { useCompanyData } from './hooks/useCompanyData';
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
    const [overdueCount, setOverdueCount] = useState(0);
    const [overdueAmount, setOverdueAmount] = useState(0);

    const { companyData, loading: companyLoading, saveCompanyData } = useCompanyData(franchiseId);

    // Calcular deuda vencida para el badge del tab
    const fetchOverdueData = useCallback(async () => {
        try {
            const result = await invoiceEngine.getInvoicesByFranchise(franchiseId);
            if (result.success) {
                const now = new Date();
                const overdue = result.data.filter(inv =>
                    inv.status === 'ISSUED' &&
                    inv.paymentStatus !== 'PAID' &&
                    inv.remainingAmount > 0 &&
                    inv.dueDate < now
                );
                setOverdueCount(overdue.length);
                setOverdueAmount(overdue.reduce((sum, inv) => sum + inv.remainingAmount, 0));
            }
        } catch (error) {
            console.error('Error fetching overdue data:', error);
        }
    }, [franchiseId]);

    useEffect(() => {
        fetchOverdueData();
    }, [fetchOverdueData, refreshTrigger]);

    const handleCreateInvoice = () => {
        setIsWizardOpen(true);
    };

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);

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
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
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
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
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
                <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-300">
                    {/* KPIs de Facturación — Mejora 4 */}
                    <InvoiceStatsCards franchiseId={franchiseId} refreshTrigger={refreshTrigger} />

                    {/* Banner de deuda vencida — Mejora 6 */}
                    {overdueCount > 0 && (
                        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                                    <AlertTriangle className="w-4 h-4 text-red-600" />
                                </div>
                                <div>
                                    <span className="text-sm font-semibold text-red-800">
                                        {overdueCount} factura{overdueCount > 1 ? 's' : ''} vencida{overdueCount > 1 ? 's' : ''}
                                    </span>
                                    <span className="text-sm text-red-600 ml-2">
                                        por {formatCurrency(overdueAmount)}
                                    </span>
                                </div>
                            </div>
                            <Button
                                size="small"
                                type="link"
                                className="text-red-600 font-semibold"
                                onClick={() => setActiveTab('debt')}
                            >
                                Ver Deuda →
                            </Button>
                        </div>
                    )}

                    {/* Lista de Facturas */}
                    <InvoiceListView
                        franchiseId={franchiseId}
                        refreshTrigger={refreshTrigger}
                        onRefresh={() => setRefreshTrigger(prev => prev + 1)}
                    />
                </div>
            )
        },
        {
            key: 'debt',
            label: (
                <span className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Deuda & Fiscal
                    {overdueCount > 0 && (
                        <Badge
                            count={overdueCount}
                            size="small"
                            className="ml-1 bg-red-500"
                        />
                    )}
                </span>
            ),
            children: (
                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
                    {/* Panel de Deudas */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-red-50/50 to-orange-50/50">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-red-500" />
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                                    Gestión de Deudas e Impagos
                                </span>
                                {overdueCount > 0 && (
                                    <span className="ml-auto text-xs font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                                        {overdueCount} vencida{overdueCount > 1 ? 's' : ''}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="p-4">
                            <DebtDashboardView franchiseId={franchiseId} refreshTrigger={refreshTrigger} />
                        </div>
                    </div>

                    {/* Panel Fiscal */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-emerald-50/50 to-teal-50/50">
                            <div className="flex items-center gap-2">
                                <Shield className="w-4 h-4 text-emerald-500" />
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                                    Caja Fuerte Fiscal y Cierres
                                </span>
                            </div>
                        </div>
                        <div className="p-4">
                            <TaxVaultPanel franchiseId={franchiseId} refreshTrigger={refreshTrigger} />
                        </div>
                    </div>
                </div>
            )
        }
    ];

    return (
        <div className="pt-2">
            {/* Action Buttons - Responsive row above tabs */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
                <Button
                    type="default"
                    size="middle"
                    icon={<Building2 size={16} />}
                    onClick={() => setIsFranchiseModalOpen(true)}
                    className="h-9 px-3 sm:px-4 flex items-center gap-2"
                >
                    <span className="font-bold text-xs hidden sm:inline">Datos Franquicia</span>
                </Button>
                <Button
                    type="default"
                    size="middle"
                    icon={<Target size={16} className="text-ruby-600" />}
                    onClick={() => setShowGuide(true)}
                    className="h-9 px-3 sm:px-4 flex items-center gap-2"
                >
                    <span className="font-bold text-xs text-ruby-600 hidden sm:inline">Guía</span>
                </Button>
                <Button
                    type="primary"
                    icon={<Plus size={18} strokeWidth={2.5} />}
                    onClick={handleCreateInvoice}
                    className="bg-emerald-600 hover:bg-emerald-500 border-none h-10 sm:h-11 px-4 sm:px-6 flex items-center gap-2 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.4)] hover:shadow-[0_0_20px_rgba(16,185,129,0.6)] hover:scale-105 transition-all duration-300 animate-pulse-emerald relative z-10 ml-auto"
                >
                    <span className="font-bold text-xs sm:text-sm tracking-wide uppercase">Nueva Factura</span>
                </Button>
            </div>

            <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                items={tabItems}
                className="billing-tabs"
                type="card"
                size="large"
            />

            {/* Modal del Creador de Facturas */}
            <Modal
                open={isWizardOpen}
                onCancel={() => setIsWizardOpen(false)}
                footer={null}
                width={{ xs: '98%', sm: '95%', md: '90%', lg: 1000 }}
                centered
                className="invoice-creator-modal max-w-[95vw] top-5"
                destroyOnHidden
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
            <CompanyDataModal
                isOpen={isFranchiseModalOpen}
                onClose={() => setIsFranchiseModalOpen(false)}
                companyData={companyData}
                onSave={saveCompanyData}
                loading={companyLoading}
            />

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
