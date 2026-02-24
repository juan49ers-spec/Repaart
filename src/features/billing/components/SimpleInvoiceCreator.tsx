/**
 * Simple Invoice Creator
 * 
 * Formulario simplificado para crear facturas de forma rápida e intuitiva.
 * Usa las tarifas configuradas en la zona "Tarifas".
 */

import React, { useState, useEffect } from 'react';
import {
    Card,
    Button,
    Select,
    DatePicker,
    Input,
    InputNumber,
    Space,
    Typography,
    Divider,
    message,
    Row,
    Col,
    Popconfirm
} from 'antd';
import {
    Plus,
    Trash2,
    Save,
    X,
    Truck,
    FileText,
    Settings2
} from 'lucide-react';
import { getBillingErrorMessage } from '../utils/errorMessages';
import { billingController } from '../../../services/billing';
import { useInvoicing } from '../../../hooks/useInvoicing';
import { CreateRestaurantModal } from '../../invoicing/components/CreateRestaurantModal';
import type { CreateInvoiceRequest } from '../../../types/invoicing';
import type { InvoiceLine } from '../../../types/invoicing';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface Props {
    franchiseId: string;
    onClose: () => void;
    onSuccess: (invoiceId: string) => void;
}

export const SimpleInvoiceCreator: React.FC<Props> = ({
    franchiseId,
    onClose,
    onSuccess
}) => {
    const { getRestaurants } = useInvoicing();
    
    // Estados del formulario
    const [loading, setLoading] = useState(false);
    const [customers, setCustomers] = useState<any[]>([]);
    const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
    const [isInitializing, setIsInitializing] = useState(true);
    const [isCreateCustomerModalOpen, setIsCreateCustomerModalOpen] = useState(false);
    
    // Tarifas configuradas
    const [rates, setRates] = useState<any[]>([]);
    
    // Datos de la factura
    const [customerId, setCustomerId] = useState<string>('');
    const [issueDate, setIssueDate] = useState<dayjs.Dayjs>(dayjs());
    const [dueDate, setDueDate] = useState<dayjs.Dayjs>(dayjs().add(30, 'days'));
    
    // Líneas de la factura
    const [lines, setLines] = useState<InvoiceLine[]>([]);
    
    // Cargar clientes y tarifas al inicio
    useEffect(() => {
        const initializeData = async () => {
            setIsInitializing(true);
            try {
                await Promise.all([loadCustomers(), loadRates()]);
            } catch (error) {
                console.error('[SimpleInvoiceCreator] Error initializing:', error);
            } finally {
                setIsInitializing(false);
            }
        };
        
        initializeData();
    }, [franchiseId]);
    
    // Cargar tarifas de la franquicia
    const loadRates = async () => {
        try {
            console.log('[SimpleInvoiceCreator] Loading rates for franchiseId:', franchiseId);
            const { getDoc, doc } = await import('firebase/firestore');
            const { db } = await import('../../../lib/firebase');
            
            // Intentar cargar desde users collection primero
            const userDocRef = doc(db, 'users', franchiseId);
            console.log('[SimpleInvoiceCreator] Fetching user doc:', userDocRef.path);
            const userDocSnap = await getDoc(userDocRef);
            
            console.log('[SimpleInvoiceCreator] User doc exists:', userDocSnap.exists());
            console.log('[SimpleInvoiceCreator] User doc data:', userDocSnap.data());
            
            // Intentar cargar desde logisticsRates (nuevo formato)
            if (userDocSnap.exists() && userDocSnap.data()?.logisticsRates) {
                const ratesData = userDocSnap.data().logisticsRates;
                console.log('[SimpleInvoiceCreator] Found logisticsRates in users:', ratesData);
                setRates(Array.isArray(ratesData) ? ratesData : []);
            } else if (userDocSnap.exists() && userDocSnap.data()?.rates) {
                // Fallback a rates (formato antiguo)
                const ratesData = userDocSnap.data().rates;
                console.log('[SimpleInvoiceCreator] Found legacy rates in users:', ratesData);
                
                // Convertir formato legacy { "0-4": 6 } a array
                const ratesArray = Object.entries(ratesData).map(([range, price], idx) => {
                    const [min, max] = range.split('-').map(Number);
                    return {
                        id: `rate_${idx}`,
                        min: min || 0,
                        max: max || 0,
                        price: Number(price) || 0,
                        name: range
                    };
                }).sort((a, b) => a.min - b.min);
                
                setRates(ratesArray);
            } else {
                // Fallback a franchises collection
                console.log('[SimpleInvoiceCreator] Trying franchises collection...');
                const franchiseDocRef = doc(db, 'franchises', franchiseId);
                const franchiseDocSnap = await getDoc(franchiseDocRef);
                
                console.log('[SimpleInvoiceCreator] Franchise doc exists:', franchiseDocSnap.exists());
                
                if (franchiseDocSnap.exists() && franchiseDocSnap.data()?.logisticsRates) {
                    const ratesData = franchiseDocSnap.data().logisticsRates;
                    console.log('[SimpleInvoiceCreator] Found logisticsRates in franchises:', ratesData);
                    setRates(Array.isArray(ratesData) ? ratesData : []);
                } else if (franchiseDocSnap.exists() && franchiseDocSnap.data()?.rates) {
                    const ratesData = franchiseDocSnap.data().rates;
                    console.log('[SimpleInvoiceCreator] Found legacy rates in franchises:', ratesData);
                    
                    const ratesArray = Object.entries(ratesData).map(([range, price], idx) => {
                        const [min, max] = range.split('-').map(Number);
                        return {
                            id: `rate_${idx}`,
                            min: min || 0,
                            max: max || 0,
                            price: Number(price) || 0,
                            name: range
                        };
                    }).sort((a, b) => a.min - b.min);
                    
                    setRates(ratesArray);
                } else {
                    console.log('[SimpleInvoiceCreator] No rates found');
                    setRates([]);
                }
            }
        } catch (error) {
            console.error('[SimpleInvoiceCreator] Error loading rates:', error);
            setRates([]);
        }
    };

    const loadCustomers = async () => {
        try {
            setIsLoadingCustomers(true);
            const restaurants = await getRestaurants(franchiseId);
            setCustomers(restaurants || []);
        } catch (error) {
            console.error('[SimpleInvoiceCreator] Error loading customers:', error);
            message.error('Error al cargar clientes');
        } finally {
            setIsLoadingCustomers(false);
        }
    };

    // Añadir línea vacía
    const addLine = (type?: 'logistics' | 'service') => {
        const newLine: InvoiceLine = {
            id: `line_${Date.now()}`,
            description: type === 'logistics' ? 'Servicio de logística' : '',
            quantity: 1,
            unitPrice: 0,
            taxRate: 0.21,
            amount: 0,
            taxAmount: 0,
            total: 0
        };
        setLines([...lines, newLine]);
    };

    // Actualizar línea
    const updateLine = (id: string, field: keyof InvoiceLine, value: any) => {
        setLines(lines.map(line => {
            if (line.id === id) {
                const updated = { ...line, [field]: value };
                if (field === 'quantity' || field === 'unitPrice' || field === 'taxRate') {
                    updated.amount = (updated.quantity || 0) * (updated.unitPrice || 0);
                    updated.taxAmount = updated.amount * (updated.taxRate || 0);
                    updated.total = updated.amount + updated.taxAmount;
                }
                return updated;
            }
            return line;
        }));
    };

    // Eliminar línea
    const removeLine = (id: string) => {
        setLines(lines.filter(l => l.id !== id));
    };

    // Calcular totales
    const totals = React.useMemo(() => {
        const subtotal = lines.reduce((sum, line) => sum + line.amount, 0);
        const totalTax = lines.reduce((sum, line) => sum + line.taxAmount, 0);
        const total = subtotal + totalTax;
        return { subtotal, totalTax, total };
    }, [lines]);

    // Crear factura
    const handleCreateInvoice = async () => {
        if (!customerId) {
            message.error('Selecciona un cliente');
            return;
        }
        
        if (lines.length === 0) {
            message.error('Agrega al menos una línea a la factura');
            return;
        }

        try {
            setLoading(true);

            const request: CreateInvoiceRequest = {
                franchiseId,
                customerId,
                customerType: 'RESTAURANT',
                issueDate: issueDate.toISOString(),
                dueDate: dueDate.toISOString(),
                template: 'modern', // Default template
                items: lines.map(l => ({
                    description: l.description,
                    quantity: l.quantity,
                    unitPrice: l.unitPrice,
                    taxRate: l.taxRate
                }))
            };

            const result = await billingController.createInvoice(request, 'current-user');

            if (result.success) {
                message.success('Factura creada correctamente');
                onSuccess((result.data as any).id || 'success');
            } else {
                // Mostrar mensaje de error amigable en español
                const errorInfo = getBillingErrorMessage(result.error);
                
                message.error({
                    content: (
                        <div>
                            <div className="font-bold">{errorInfo.title}</div>
                            <div className="text-sm mt-1">{errorInfo.message}</div>
                            {errorInfo.suggestion && (
                                <div className="text-xs text-blue-600 mt-2">💡 {errorInfo.suggestion}</div>
                            )}
                        </div>
                    ),
                    duration: 6
                });
            }
        } catch (error: any) {
            console.error('Error creating invoice:', error);
            message.error({
                content: (
                    <div>
                        <div className="font-bold">Error al crear la factura</div>
                        <div className="text-sm mt-1">{error?.message || 'Error inesperado'}</div>
                    </div>
                ),
                duration: 5
            });
        } finally {
            setLoading(false);
        }
    };

    const customerOptions = customers.map((c: any) => ({
        label: `${c.fiscalName} (${c.cif})`,
        value: c.id
    }));

    return (
        <div className="h-full flex flex-col">
            {/* Loading state */}
            {isInitializing && (
                <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 z-10 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
                        <Text type="secondary">Cargando datos...</Text>
                    </div>
                </div>
            )}
            
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-700">
                <div>
                    <Title level={4} className="!mb-0">Nueva Factura</Title>
                    <Text type="secondary" className="text-sm">Completa los datos para emitir la factura</Text>
                </div>
                <Button
                    type="text"
                    icon={<X size={20} />}
                    onClick={onClose}
                >
                    Cancelar
                </Button>
            </div>

            <div className="flex-1 overflow-auto py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Columna Izquierda - Datos Generales */}
                    <div className="lg:col-span-1 space-y-4">
                        <Card title="Datos del Cliente" size="small">
                            <div className="space-y-3">
                                <div>
                                    <Text type="secondary" className="text-xs mb-1 block">Cliente *</Text>
                                    <div className="flex gap-2">
                                        <Select
                                            className="w-full"
                                            placeholder="Seleccionar cliente"
                                            value={customerId || undefined}
                                            onChange={setCustomerId}
                                            loading={isLoadingCustomers}
                                            options={customerOptions}
                                            showSearch
                                            filterOption={(input, option) =>
                                                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                            }
                                        />
                                        <Button
                                            icon={<Plus size={16} />}
                                            onClick={() => setIsCreateCustomerModalOpen(true)}
                                            title="Nuevo cliente"
                                        />
                                    </div>
                                </div>

                                {customerId && (
                                    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded text-sm">
                                        {(() => {
                                            const customer = customers.find(c => c.id === customerId);
                                            return customer ? (
                                                <div className="space-y-1">
                                                    <div className="font-medium">{customer.fiscalName}</div>
                                                    <div className="text-slate-500">CIF: {customer.cif}</div>
                                                    {customer.address && (
                                                        <div className="text-slate-500">
                                                            {customer.address.street}, {customer.address.city}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : null;
                                        })()}
                                    </div>
                                )}
                            </div>
                        </Card>

                        <Card title="Fechas" size="small">
                            <div className="space-y-3">
                                <div>
                                    <Text type="secondary" className="text-xs mb-1 block">Fecha de emisión *</Text>
                                    <DatePicker
                                        className="w-full"
                                        value={issueDate}
                                        onChange={(date) => {
                                            if (date) {
                                                setIssueDate(date);
                                                // Auto-update due date to 30 days later
                                                setDueDate(date.add(30, 'days'));
                                            }
                                        }}
                                        format="DD/MM/YYYY"
                                    />
                                </div>
                                
                                <div>
                                    <Text type="secondary" className="text-xs mb-1 block">Fecha de vencimiento *</Text>
                                    <DatePicker
                                        className="w-full"
                                        value={dueDate}
                                        onChange={(date) => date && setDueDate(date)}
                                        format="DD/MM/YYYY"
                                    />
                                </div>
                            </div>
                        </Card>

                        <Card title="Resumen" size="small" className="bg-slate-50 dark:bg-slate-800">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <Text>Subtotal:</Text>
                                    <Text strong>{totals.subtotal.toFixed(2)} €</Text>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <Text>IVA (21%):</Text>
                                    <Text>{totals.totalTax.toFixed(2)} €</Text>
                                </div>
                                <Divider className="my-2" />
                                <div className="flex justify-between">
                                    <Text strong className="text-lg">TOTAL:</Text>
                                    <Text strong className="text-lg text-indigo-600">{totals.total.toFixed(2)} €</Text>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Columna Derecha - Líneas de Factura */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Mensaje si no hay tarifas */}
                        {rates.length === 0 && (
                            <Card size="small" className="bg-amber-50 dark:bg-amber-900/20 border-amber-200">
                                <div className="flex items-start gap-3">
                                    <Settings2 className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <Text strong className="text-amber-800">No hay tarifas configuradas</Text>
                                        <br />
                                        <Text type="secondary" className="text-sm">
                                            Ve a la pestaña <strong>Tarifas</strong> para configurar los precios por distancia.
                                            Así podrás seleccionarlos rápidamente al crear facturas.
                                        </Text>
                                    </div>
                                </div>
                            </Card>
                        )}
                        
                        <Card 
                            title={
                                <div className="flex items-center justify-between">
                                    <span>Conceptos de Factura</span>
                                    <Space>
                                        <Button
                                            type="dashed"
                                            icon={<Truck size={16} />}
                                            onClick={() => addLine('logistics')}
                                        >
                                            Línea de logística
                                        </Button>
                                        <Button
                                            type="dashed"
                                            icon={<Plus size={16} />}
                                            onClick={() => addLine('service')}
                                        >
                                            Otro concepto
                                        </Button>
                                    </Space>
                                </div>
                            }
                            size="small"
                        >
                            {lines.length === 0 ? (
                                <div className="text-center py-12 bg-slate-50 dark:bg-slate-800 rounded">
                                    <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                    <Text type="secondary">No hay líneas en la factura</Text>
                                    <br />
                                    <Text type="secondary" className="text-sm">
                                        Agrega conceptos usando los botones de arriba
                                    </Text>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {lines.map((line) => (
                                        <div 
                                            key={line.id} 
                                            className="border border-slate-200 dark:border-slate-700 rounded-lg p-4"
                                        >
                                            <Row gutter={[16, 16]}>
                                                {/* Selector de Tarifa */}
                                                {rates.length > 0 && (
                                                    <Col span={24}>
                                                        <Text type="secondary" className="text-xs block mb-1">
                                                            Tarifa configurada (opcional)
                                                        </Text>
                                                        <Select
                                                            className="w-full"
                                                            placeholder="Seleccionar tarifa..."
                                                            allowClear
                                                            onChange={(value) => {
                                                                if (value) {
                                                                    // value es el índice de la tarifa seleccionada
                                                                    const rateIndex = parseInt(value as string);
                                                                    const selectedRate = rates[rateIndex];
                                                                    if (selectedRate) {
                                                                        const price = Number(selectedRate.price) || 0;
                                                                        updateLine(line.id, 'description', `Servicio logístico ${selectedRate.min}-${selectedRate.max}km (${price.toFixed(2)}€)`);
                                                                        updateLine(line.id, 'unitPrice', price);
                                                                        message.success(`Tarifa aplicada: ${selectedRate.min}-${selectedRate.max}km - ${price.toFixed(2)}€`);
                                                                    }
                                                                }
                                                            }}
                                                            options={rates.map((rate: any, idx: number) => ({
                                                                label: `${rate.min}-${rate.max}km: ${Number(rate.price).toFixed(2)}€`,
                                                                value: idx.toString()
                                                            }))}
                                                        />
                                                    </Col>
                                                )}
                                                
                                                <Col span={12}>
                                                    <Text type="secondary" className="text-xs block mb-1">
                                                        Concepto
                                                    </Text>
                                                    <Input
                                                        placeholder="Descripción del servicio"
                                                        value={line.description}
                                                        onChange={(e) => updateLine(line.id, 'description', e.target.value)}
                                                    />
                                                </Col>
                                                
                                                <Col span={4}>
                                                    <Text type="secondary" className="text-xs block mb-1">
                                                        Cantidad
                                                    </Text>
                                                    <InputNumber
                                                        className="w-full"
                                                        min={0}
                                                        value={line.quantity}
                                                        onChange={(val) => updateLine(line.id, 'quantity', val || 0)}
                                                    />
                                                </Col>
                                                
                                                <Col span={4}>
                                                    <Text type="secondary" className="text-xs block mb-1">
                                                        Precio (€)
                                                    </Text>
                                                    <InputNumber
                                                        className="w-full"
                                                        min={0}
                                                        precision={2}
                                                        value={line.unitPrice}
                                                        onChange={(val) => updateLine(line.id, 'unitPrice', val || 0)}
                                                    />
                                                </Col>
                                                
                                                <Col span={3}>
                                                    <Text type="secondary" className="text-xs block mb-1">
                                                        Total
                                                    </Text>
                                                    <div className="text-lg font-semibold text-indigo-600">
                                                        {line.total.toFixed(2)} €
                                                    </div>
                                                </Col>
                                                
                                                <Col span={1}>
                                                    <Popconfirm
                                                        title="¿Eliminar esta línea?"
                                                        onConfirm={() => removeLine(line.id)}
                                                        okText="Eliminar"
                                                        okButtonProps={{ danger: true }}
                                                    >
                                                        <Button
                                                            type="text"
                                                            danger
                                                            icon={<Trash2 size={16} />}
                                                        />
                                                    </Popconfirm>
                                                </Col>
                                            </Row>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>
                    </div>
                </div>
            </div>

            {/* Footer - Botón Crear */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
                <Button
                    size="large"
                    onClick={onClose}
                >
                    Cancelar
                </Button>
                <Button
                    type="primary"
                    size="large"
                    icon={<Save size={18} />}
                    loading={loading}
                    onClick={handleCreateInvoice}
                    className="bg-indigo-600 hover:bg-indigo-700"
                    disabled={!customerId || lines.length === 0}
                >
                    Crear Factura
                </Button>
            </div>

            {/* Modal Crear Cliente */}
            <CreateRestaurantModal
                isOpen={isCreateCustomerModalOpen}
                onClose={() => setIsCreateCustomerModalOpen(false)}
                onSuccess={() => {
                    loadCustomers();
                    setIsCreateCustomerModalOpen(false);
                }}
                franchiseId={franchiseId}
            />
        </div>
    );
};

export default SimpleInvoiceCreator;
