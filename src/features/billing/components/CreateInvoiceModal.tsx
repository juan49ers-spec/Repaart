/**
 * Create Invoice Modal Component
 * 
 * Modal for creating new invoices with dynamic line items,
 * logistics billing calculation, and real-time totals.
 * 
 * Features:
 * - Customer selection
 * - Dynamic line items (add/remove)
 * - Logistics billing integration
 * - Real-time totals calculation
 * - PDF preview (optional)
 */

import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, FileText, Calculator } from 'lucide-react';
import { Modal, Form, Select, Input, InputNumber, Button, DatePicker, Table, Card, Row, Col, Alert, message } from 'antd';
import { billingController } from '../../../services/billing';
import type { CreateInvoiceRequest } from '../../../types/invoicing';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (invoiceId: string) => void;
    franchiseId: string;
}

interface InvoiceLineItem {
    key: string;
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
    amount: number;
    taxAmount: number;
    total: number;
    logisticsRange?: string;
}

export const CreateInvoiceModal: React.FC<Props> = ({
    isOpen,
    onClose,
    onSuccess,
    franchiseId
}) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [lines, setLines] = useState<InvoiceLineItem[]>([
        {
            key: '1',
            description: '',
            quantity: 1,
            unitPrice: 0,
            taxRate: 0.21,
            amount: 0,
            taxAmount: 0,
            total: 0
        }
    ]);
    
    const [totals, setTotals] = useState({
        subtotal: 0,
        totalTax: 0,
        total: 0
    });
    
    // Recalculate totals when lines change
    useEffect(() => {
        const subtotal = lines.reduce((sum, line) => sum + line.amount, 0);
        const totalTax = lines.reduce((sum, line) => sum + line.taxAmount, 0);
        const total = subtotal + totalTax;
        
        setTotals({ subtotal, totalTax, total });
    }, [lines]);
    
    // Update line when fields change
    const updateLine = (key: string, field: string, value: any) => {
        setLines(prevLines => prevLines.map(line => {
            if (line.key === key) {
                const updated = { ...line, [field]: value };
                
                // Recalculate line totals
                updated.amount = updated.quantity * updated.unitPrice;
                updated.taxAmount = updated.amount * updated.taxRate;
                updated.total = updated.amount + updated.taxAmount;
                
                return updated;
            }
            return line;
        }));
    };
    
    // Add new line
    const addLine = () => {
        const newKey = String(Date.now());
        setLines(prevLines => [
            ...prevLines,
            {
                key: newKey,
                description: '',
                quantity: 1,
                unitPrice: 0,
                taxRate: 0.21,
                amount: 0,
                taxAmount: 0,
                total: 0
            }
        ]);
    };
    
    // Remove line
    const removeLine = (key: string) => {
        if (lines.length === 1) {
            message.warning('Debe haber al menos una línea');
            return;
        }
        setLines(prevLines => prevLines.filter(line => line.key !== key));
    };
    
    // Handle form submission
    const handleSubmit = async () => {
        try {
            setLoading(true);
            
            // Validate form
            const values = await form.validateFields();
            
            // Validate lines
            const validLines = lines.filter(line => 
                line.description.trim() !== '' && 
                line.quantity > 0 && 
                line.unitPrice >= 0
            );
            
            if (validLines.length === 0) {
                message.error('Debe haber al menos una línea válida');
                setLoading(false);
                return;
            }
            
            // Create invoice request
            const request: CreateInvoiceRequest = {
                franchiseId,
                customerId: values.customerId,
                customerType: values.customerType,
                issueDate: values.issueDate ? values.issueDate.toISOString() : new Date().toISOString(),
                dueDate: values.dueDate ? values.dueDate.toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                template: values.template || 'modern',
                items: validLines.map(line => ({
                    description: line.description,
                    quantity: line.quantity,
                    unitPrice: line.unitPrice,
                    taxRate: line.taxRate
                }))
            };
            
            // Call billing controller
            const result = await billingController.createInvoice(request, 'current_user');
            
            if (result.success) {
                message.success('Factura creada correctamente');
                form.resetFields();
                setLines([
                    {
                        key: '1',
                        description: '',
                        quantity: 1,
                        unitPrice: 0,
                        taxRate: 0.21,
                        amount: 0,
                        taxAmount: 0,
                        total: 0
                    }
                ]);
                onSuccess(result.data);
                onClose();
            } else {
                message.error(`Error: ${result.error.type}`);
            }
        } catch (error: any) {
            message.error(`Error al crear factura: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };
    
    // Tax rate options
    const taxRateOptions = [
        { label: '21% IVA General', value: 0.21 },
        { label: '10% IVA Reducido', value: 0.10 },
        { label: '4% IVA Super Reducido', value: 0.04 },
        { label: '0% Exento', value: 0.00 }
    ];
    
    // Columns for line items table
    const columns = [
        {
            title: 'Descripción',
            dataIndex: 'description',
            key: 'description',
            width: '30%',
            render: (text: string, record: InvoiceLineItem) => (
                <Input
                    value={text}
                    placeholder="Descripción del servicio"
                    onChange={(e) => updateLine(record.key, 'description', e.target.value)}
                />
            )
        },
        {
            title: 'Cantidad',
            dataIndex: 'quantity',
            key: 'quantity',
            width: '10%',
            render: (value: number, record: InvoiceLineItem) => (
                <InputNumber
                    min={0}
                    precision={0}
                    value={value}
                    onChange={(val) => updateLine(record.key, 'quantity', val || 0)}
                />
            )
        },
        {
            title: 'Precio Unit.',
            dataIndex: 'unitPrice',
            key: 'unitPrice',
            width: '12%',
            render: (value: number, record: InvoiceLineItem) => (
                <InputNumber
                    min={0}
                    precision={2}
                    prefix="€"
                    value={value}
                    onChange={(val) => updateLine(record.key, 'unitPrice', val || 0)}
                />
            )
        },
        {
            title: 'IVA',
            dataIndex: 'taxRate',
            key: 'taxRate',
            width: '15%',
            render: (value: number, record: InvoiceLineItem) => (
                <Select
                    value={value}
                    options={taxRateOptions}
                    onChange={(val) => updateLine(record.key, 'taxRate', val!)}
                />
            )
        },
        {
            title: 'Importe',
            dataIndex: 'total',
            key: 'total',
            width: '12%',
            render: (value: number) => (
                <span>€{value.toFixed(2)}</span>
            )
        },
        {
            title: 'Acciones',
            key: 'actions',
            width: '8%',
            render: (_: any, record: InvoiceLineItem) => (
                <Button
                    type="text"
                    danger
                    icon={<Trash2 size={16} />}
                    onClick={() => removeLine(record.key)}
                />
            )
        }
    ];
    
    return (
        <Modal
            title={
                <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    <span>Nueva Factura</span>
                </div>
            }
            open={isOpen}
            onCancel={onClose}
            width={1000}
            footer={[
                <Button key="cancel" onClick={onClose}>
                    Cancelar
                </Button>,
                <Button
                    key="submit"
                    type="primary"
                    icon={<Save />}
                    loading={loading}
                    onClick={handleSubmit}
                >
                    Crear Factura
                </Button>
            ]}
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
            >
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            label="Cliente"
                            name="customerId"
                            rules={[{ required: true, message: 'Selecciona un cliente' }]}
                        >
                            <Select
                                placeholder="Seleccionar cliente"
                                showSearch
                                optionFilterProp="children"
                            >
                                <Select.Option value="customer_1">Restaurant XYZ</Select.Option>
                                <Select.Option value="customer_2">Restaurant ABC</Select.Option>
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            label="Tipo de Cliente"
                            name="customerType"
                            initialValue="RESTAURANT"
                            rules={[{ required: true, message: 'Selecciona el tipo' }]}
                        >
                            <Select>
                                <Select.Option value="RESTAURANT">Restaurante</Select.Option>
                                <Select.Option value="FRANCHISE">Franquicia</Select.Option>
                            </Select>
                        </Form.Item>
                    </Col>
                </Row>
                
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            label="Fecha de Emisión"
                            name="issueDate"
                        >
                            <DatePicker 
                                style={{ width: '100%' }}
                                format="DD/MM/YYYY"
                                placeholder="Seleccionar fecha"
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            label="Fecha de Vencimiento"
                            name="dueDate"
                        >
                            <DatePicker 
                                style={{ width: '100%' }}
                                format="DD/MM/YYYY"
                                placeholder="Seleccionar fecha"
                            />
                        </Form.Item>
                    </Col>
                </Row>
                
                <Row gutter={16} className="mt-4">
                    <Col span={24}>
                        <Form.Item
                            label="Plantilla de PDF"
                            name="template"
                            initialValue="modern"
                        >
                            <Select>
                                <Select.Option value="modern">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                                        Moderna - Diseño limpio con acentos de color
                                    </div>
                                </Select.Option>
                                <Select.Option value="classic">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-slate-600"></div>
                                        Clásica - Formato tradicional con bordes
                                    </div>
                                </Select.Option>
                                <Select.Option value="minimal">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                                        Minimalista - Ultra limpio sin decoración
                                    </div>
                                </Select.Option>
                                <Select.Option value="corporate">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                                        Corporativa - Estilo profesional con branding
                                    </div>
                                </Select.Option>
                            </Select>
                        </Form.Item>
                    </Col>
                </Row>
                
                <Card 
                    title="Líneas de Factura" 
                    extra={
                        <Button 
                            type="primary" 
                            icon={<Plus />}
                            onClick={addLine}
                            size="small"
                        >
                            Añadir Línea
                        </Button>
                    }
                    className="mt-4"
                >
                    <Table
                        columns={columns}
                        dataSource={lines}
                        pagination={false}
                        size="small"
                        rowKey="key"
                    />
                </Card>
                
                <Card 
                    title={<div className="flex items-center gap-2"><Calculator className="w-4 h-4" /> Totales</div>}
                    className="mt-4"
                >
                    <Row gutter={16}>
                        <Col span={8}>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Subtotal:</span>
                                <span className="font-semibold">€{totals.subtotal.toFixed(2)}</span>
                            </div>
                        </Col>
                        <Col span={8}>
                            <div className="flex justify-between">
                                <span className="text-gray-600">IVA:</span>
                                <span className="font-semibold">€{totals.totalTax.toFixed(2)}</span>
                            </div>
                        </Col>
                        <Col span={8}>
                            <div className="flex justify-between text-lg">
                                <span className="font-semibold">TOTAL:</span>
                                <span className="font-bold text-blue-600">€{totals.total.toFixed(2)}</span>
                            </div>
                        </Col>
                    </Row>
                </Card>
                
                <Alert
                    message="Información"
                    description="La factura se creará en estado BORRADOR y podrás emitirla después. Una vez emitida, será inmutable."
                    type="info"
                    showIcon
                    className="mt-4"
                />
            </Form>
        </Modal>
    );
};

export default CreateInvoiceModal;
