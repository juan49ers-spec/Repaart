/**
 * Billing Wizard Component
 * 
 * A professional, step-by-step assistant for generating invoices.
 * Integrates with logistics data and allows manual adjustments.
 */

import React, { useState, useEffect } from 'react';
import {
    Layout,
    Steps,
    Button,
    Card,
    Select,
    DatePicker,
    Table,
    InputNumber,
    Input,
    Space,
    Typography,
    Divider,
    message,
    Alert
} from 'antd';
import {
    ChevronLeft,
    ChevronRight,
    Save,
    Plus,
    Trash2,
    User,
    Calendar,
    FileText,
    Truck,
    Settings2
} from 'lucide-react';
import { billingController, logisticsBillingEngine } from '../../../services/billing';
import { formatMoney } from '../../../lib/finance';
import { useInvoicing } from '../../../hooks/useInvoicing';
import { CreateRestaurantModal } from '../../invoicing/components/CreateRestaurantModal';
import type { CreateInvoiceRequest } from '../../../types/invoicing';
import dayjs from 'dayjs';

const { Content } = Layout;
const { Title, Text } = Typography;

interface Props {
    franchiseId: string;
    onClose: () => void;
    onSuccess: (invoiceId: string) => void;
}

interface WizardLineItem {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
    amount: number;
    taxAmount: number;
    total: number;
    isManual?: boolean;
}

export const BillingWizard: React.FC<Props> = ({
    franchiseId,
    onClose,
    onSuccess
}) => {
    const { getRestaurants } = useInvoicing();
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);

    // Selection State
    const [customerId, setCustomerId] = useState<string>('');
    const [customerType, setCustomerType] = useState<'RESTAURANT' | 'FRANCHISE'>('RESTAURANT');
    const [period, setPeriod] = useState<dayjs.Dayjs | null>(dayjs());

    // Data State
    const [lines, setLines] = useState<WizardLineItem[]>([]);
    const [isFetchingData, setIsFetchingData] = useState(false);

    // Clients State
    const [customers, setCustomers] = useState<any[]>([]);
    const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
    const [isCreateCustomerModalOpen, setIsCreateCustomerModalOpen] = useState(false);

    // Load customers on mount
    useEffect(() => {
        loadCustomers();
    }, [franchiseId]);

    const loadCustomers = async () => {
        try {
            setIsLoadingCustomers(true);
            const restaurants = await getRestaurants(franchiseId);
            setCustomers(restaurants);
        } catch (error) {
            console.error('Error loading customers:', error);
            message.error('Error al cargar clientes');
        } finally {
            setIsLoadingCustomers(false);
        }
    };

    // Totals
    const totals = React.useMemo(() => {
        const subtotal = lines.reduce((sum, l) => sum + l.amount, 0);
        const tax = lines.reduce((sum, l) => sum + l.taxAmount, 0);
        const total = subtotal + tax;
        return { subtotal, tax, total };
    }, [lines]);

    // Handle data fetch from logistics engine
    const handleFetchLogistics = async () => {
        if (!customerId || !period) return;

        try {
            setIsFetchingData(true);
            // const periodStr = period.format('YYYY-MM');

            // Mocking the call to logisticsBillingEngine for now
            // In a real scenario, this would use the service
            const result = await logisticsBillingEngine.calculateBilling({
                franchiseId,
                customerId,
                customerType,
                period: {
                    start: period.startOf('month').toISOString(),
                    end: period.endOf('month').toISOString()
                },
                logisticsRates: [] // Will use defaults/config
            });

            if (result.success) {
                const newLines: WizardLineItem[] = result.data.lines.map(line => ({
                    ...line,
                    isManual: false
                }));
                setLines(newLines);
                message.success('Datos de logística importados correctamente');
            } else {
                message.warning('No se encontraron datos de logística para este periodo. Puedes añadir líneas manualmente.');
                setLines([]);
            }
        } catch (error) {
            console.error('Error fetching logistics data:', error);
            message.error('Error al importar datos de logística');
        } finally {
            setIsFetchingData(false);
        }
    };

    // Add manual line
    const addManualLine = () => {
        const newLine: WizardLineItem = {
            id: `manual_${Date.now()}`,
            description: '',
            quantity: 1,
            unitPrice: 0,
            taxRate: 0.21,
            amount: 0,
            taxAmount: 0,
            total: 0,
            isManual: true
        };
        setLines([...lines, newLine]);
    };

    // Update line
    const updateLine = (id: string, field: string, value: string | number) => {
        setLines(prev => prev.map(line => {
            if (line.id === id) {
                const updated = { ...line, [field]: value };
                updated.amount = updated.quantity * updated.unitPrice;
                updated.taxAmount = updated.amount * updated.taxRate;
                updated.total = updated.amount + updated.taxAmount;
                return updated;
            }
            return line;
        }));
    };

    // Remove line
    const removeLine = (id: string) => {
        setLines(prev => prev.filter(l => l.id !== id));
    };

    // Finalize creation
    const handleCreateInvoice = async () => {
        try {
            setLoading(true);

            const request: CreateInvoiceRequest = {
                franchiseId,
                customerId,
                customerType,
                issueDate: new Date().toISOString(),
                dueDate: dayjs().add(30, 'day').toISOString(),
                items: lines.map(l => ({
                    description: l.description,
                    quantity: l.quantity,
                    unitPrice: l.unitPrice,
                    taxRate: l.taxRate
                }))
            };

            const result = await billingController.createInvoice(request, 'current_user');

            if (result.success) {
                message.success('Factura creada correctamente');
                onSuccess(result.data);
            } else {
                message.error('Error al crear la factura');
            }
        } catch (error) {
            console.error('Error creating invoice:', error);
            message.error('Error en el proceso de facturación');
        } finally {
            setLoading(false);
        }
    };

    // Render Steps
    const renderSelection = () => (
        <Space direction="vertical" size="large" className="w-full">
            <Card title={<div className="flex items-center gap-2"><User size={18} /> Cliente y Periodo</div>}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <Text strong>Cliente</Text>
                            <Button 
                                type="link" 
                                size="small" 
                                icon={<Plus size={14} />}
                                onClick={() => setIsCreateCustomerModalOpen(true)}
                            >
                                Nuevo Cliente
                            </Button>
                        </div>
                        <Select
                            className="w-full"
                            placeholder="Seleccionar cliente"
                            value={customerId}
                            onChange={setCustomerId}
                            loading={isLoadingCustomers}
                            options={customers.map((customer: any) => ({
                                label: `${customer.fiscalName} (${customer.cif})`,
                                value: customer.id
                            }))}
                            notFoundContent={
                                <div className="text-center py-4">
                                    <Text type="secondary">No hay clientes registrados</Text>
                                    <br />
                                    <Button 
                                        type="primary" 
                                        size="small" 
                                        className="mt-2"
                                        icon={<Plus size={14} />}
                                        onClick={() => setIsCreateCustomerModalOpen(true)}
                                    >
                                        Crear primer cliente
                                    </Button>
                                </div>
                            }
                        />
                    </div>
                    <div>
                        <Text strong className="block mb-2">Tipo</Text>
                        <Select
                            className="w-full"
                            value={customerType}
                            onChange={setCustomerType}
                            options={[
                                { label: 'Restaurante', value: 'RESTAURANT' },
                                { label: 'Franquicia', value: 'FRANCHISE' }
                            ]}
                        />
                    </div>
                    <div>
                        <Text strong className="block mb-2">Mes de Facturación</Text>
                        <DatePicker
                            className="w-full"
                            picker="month"
                            value={period}
                            onChange={setPeriod}
                        />
                    </div>
                </div>
            </Card>
            <Alert
                message="Importación Automática"
                description="Al avanzar al siguiente paso, el sistema buscará automáticamente todos los pedidos, kilómetros y servicios registrados para este cliente en el mes seleccionado."
                type="info"
                showIcon
            />
        </Space>
    );

    const renderDataImport = () => (
        <Space direction="vertical" size="large" className="w-full">
            <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <div>
                    <Title level={5} className="!mb-0">Conceptos de Facturación</Title>
                    <Text type="secondary">Revisa los datos importados o añade conceptos manuales</Text>
                </div>
                <Space>
                    <Button
                        icon={<Truck size={16} />}
                        onClick={handleFetchLogistics}
                        loading={isFetchingData}
                    >
                        Re-importar Logística
                    </Button>
                    <Button
                        type="primary"
                        icon={<Plus size={16} />}
                        onClick={addManualLine}
                    >
                        Concepto Manual
                    </Button>
                </Space>
            </div>

            <Table
                dataSource={lines}
                pagination={false}
                rowKey="id"
                className="professional-table"
                columns={[
                    {
                        title: 'Descripción',
                        dataIndex: 'description',
                        render: (text, record) => (
                            <Input
                                value={text}
                                placeholder="Ej: Servicio logística 0-4km"
                                onChange={e => updateLine(record.id, 'description', e.target.value)}
                                className={record.isManual ? 'border-blue-200' : ''}
                            />
                        )
                    },
                    {
                        title: 'Cantidad',
                        dataIndex: 'quantity',
                        width: 120,
                        render: (val, record) => (
                            <InputNumber
                                value={val}
                                min={0}
                                onChange={v => updateLine(record.id, 'quantity', v || 0)}
                                className="w-full"
                            />
                        )
                    },
                    {
                        title: 'Precio Unit.',
                        dataIndex: 'unitPrice',
                        width: 150,
                        render: (val, record) => (
                            <InputNumber
                                value={val}
                                min={0}
                                precision={2}
                                prefix="€"
                                onChange={v => updateLine(record.id, 'unitPrice', v || 0)}
                                className="w-full"
                            />
                        )
                    },
                    {
                        title: 'Total',
                        dataIndex: 'total',
                        width: 120,
                        align: 'right',
                        render: val => <Text strong>{formatMoney(val)}</Text>
                    },
                    {
                        title: '',
                        width: 50,
                        render: (_, record) => (
                            <Button
                                type="text"
                                danger
                                icon={<Trash2 size={16} />}
                                onClick={() => removeLine(record.id)}
                            />
                        )
                    }
                ]}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
                <Card title="Observaciones de Factura">
                    <Input.TextArea rows={4} placeholder="Estas notas aparecerán en el pie de la factura..." />
                </Card>
                <Card className="bg-slate-50 dark:bg-slate-800/50">
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <Text type="secondary">Subtotal</Text>
                            <Text strong>{formatMoney(totals.subtotal)}</Text>
                        </div>
                        <div className="flex justify-between">
                            <Text type="secondary">IVA (21%)</Text>
                            <Text strong>{formatMoney(totals.tax)}</Text>
                        </div>
                        <Divider className="my-2" />
                        <div className="flex justify-between">
                            <Title level={4} className="!mb-0 text-indigo-600">TOTAL</Title>
                            <Title level={4} className="!mb-0 text-indigo-600">{formatMoney(totals.total)}</Title>
                        </div>
                    </div>
                </Card>
            </div>
        </Space>
    );

    const renderReview = () => (
        <Card className="max-w-2xl mx-auto shadow-lg border-2 border-indigo-100">
            <div className="text-center mb-8">
                <FileText size={48} className="text-indigo-600 mx-auto mb-4" />
                <Title level={3}>Revisión Final</Title>
                <Text type="secondary">Confirma los datos antes de generar la factura borrador</Text>
            </div>

            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-slate-50 p-3 rounded-lg">
                        <Text type="secondary" className="block uppercase text-[10px] font-bold">Cliente</Text>
                        <Text strong>Restaurant XYZ (Benavente)</Text>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg">
                        <Text type="secondary" className="block uppercase text-[10px] font-bold">Periodo</Text>
                        <Text strong>{period?.format('MMMM YYYY')}</Text>
                    </div>
                </div>

                <Divider className="!my-2" />

                <div className="space-y-2">
                    <div className="flex justify-between text-base">
                        <Text>Líneas de servicio:</Text>
                        <Text strong>{lines.length}</Text>
                    </div>
                    <div className="flex justify-between text-lg text-indigo-600 font-bold">
                        <Text className="text-indigo-600">Total Factura:</Text>
                        <Text>{formatMoney(totals.total)}</Text>
                    </div>
                </div>

                <Alert
                    message="IMPORTANTE: Numeración Fiscal"
                    description="Esta factura recibirá el número correlativo correspondiente al año actual una vez sea emitida oficialmente."
                    type="warning"
                    showIcon
                />

                <Button
                    type="primary"
                    size="large"
                    block
                    icon={<Save />}
                    onClick={handleCreateInvoice}
                    loading={loading}
                >
                    Generar Factura Borrador
                </Button>
            </div>
        </Card>
    );

    const steps = [
        { title: 'Selección', icon: <Calendar size={18} />, content: renderSelection() },
        { title: 'Conceptos', icon: < Truck size={18} />, content: renderDataImport() },
        { title: 'Revisión', icon: <Settings2 size={18} />, content: renderReview() }
    ];

    return (
        <Layout className="bg-transparent">
            <Content className="p-0">
                <div className="max-w-[1200px] mx-auto px-6 py-8">
                    <div className="flex justify-between items-center mb-10">
                        <div>
                            <Title level={2} className="!mb-0">Asistente de Facturación</Title>
                            <Text type="secondary">Genera facturas profesionales basadas en actividad logística</Text>
                        </div>
                        <Button type="text" onClick={onClose} className="hover:bg-red-50 hover:text-red-500">Cerrar</Button>
                    </div>

                    <Steps
                        current={currentStep}
                        className="mb-12 professional-steps"
                        items={steps.map(s => ({ title: s.title, icon: s.icon }))}
                    />

                    <div className="min-h-[400px]">
                        {steps[currentStep].content}
                    </div>

                    <div className="flex justify-between mt-12 pt-6 border-t border-slate-200">
                        <Button
                            disabled={currentStep === 0}
                            onClick={() => setCurrentStep(prev => prev - 1)}
                            icon={<ChevronLeft size={16} />}
                            className="flex items-center"
                        >
                            Anterior
                        </Button>
                        {currentStep < steps.length - 1 && (
                            <Button
                                type="primary"
                                onClick={() => {
                                    if (currentStep === 0 && !customerId) {
                                        message.warning('Selecciona un cliente para continuar');
                                        return;
                                    }
                                    if (currentStep === 0) handleFetchLogistics();
                                    setCurrentStep(prev => prev + 1);
                                }}
                                icon={<ChevronRight size={16} />}
                                className="flex items-center flex-row-reverse"
                            >
                                Continuar
                            </Button>
                        )}
                    </div>
                </div>
            </Content>

            {/* Modal para crear nuevo cliente */}
            <CreateRestaurantModal
                isOpen={isCreateCustomerModalOpen}
                onClose={() => setIsCreateCustomerModalOpen(false)}
                onSuccess={() => {
                    loadCustomers();
                    setIsCreateCustomerModalOpen(false);
                }}
                franchiseId={franchiseId}
            />
        </Layout>
    );
};

export default BillingWizard;
