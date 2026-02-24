/**
 * Payment Modal Component
 *
 * Modal for recording client PAYMENTS on invoices with support for:
 * - Partial payments
 * - Multiple payment methods
 * - Payment date tracking
 * - Automatic invoice status updates
 *
 * Features:
 * - Validates payment amount doesn't exceed remaining
 * - Supports multiple payment methods (transfer, cash, card, etc.)
 * - Real-time remaining amount calculation
 * - Payment reference tracking
 * 
 * FLUJO DE PAGO:
 * 1. Factura emitida → Estado: PENDIENTE DE PAGO
 * 2. Cliente paga → Registramos PAGO
 * 3. Si pago completo → Estado: PAGADA
 * 4. Si pago parcial → Estado: PAGO PARCIAL
 */

import React, { useState, useEffect } from 'react';
import { CreditCard, DollarSign, Save } from 'lucide-react';
import { Modal, Form, Input, InputNumber, Button, Select, DatePicker, Alert, Row, Col, Statistic, message } from 'antd';
import { billingController } from '../../../services/billing';
import type { AddPaymentRequest, Invoice } from '../../../types/invoicing';
import { formatCurrency } from '../../../utils/formatters';
import dayjs from 'dayjs';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    invoice: Invoice;
}

interface PaymentMethod {
    value: string;
    label: string;
    icon?: string;
}

export const PaymentModal: React.FC<Props> = ({
    isOpen,
    onClose,
    onSuccess,
    invoice
}) => {
    const isRectification = invoice.status === 'RECTIFIED';
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState(0);

    const remainingAmount = invoice.remainingAmount;
    const totalPaid = invoice.totalPaid;
    const total = invoice.total;

    useEffect(() => {
        if (isOpen) {
            form.resetFields();
            form.setFieldValue('amount', remainingAmount);
            setPaymentAmount(remainingAmount);
        }
    }, [isOpen, form, remainingAmount]);

    const paymentMethods: PaymentMethod[] = [
        { value: 'TRANSFER', label: 'Transferencia Bancaria' },
        { value: 'CASH', label: 'Efectivo' },
        { value: 'CARD', label: 'Tarjeta Crédito/Débito' },
        { value: 'BIZUM', label: 'Bizum' },
        { value: 'CHECK', label: 'Cheque' },
        { value: 'OTHER', label: 'Otros' }
    ];

    const handleAmountChange = (value: number | null) => {
        const amount = value || 0;
        setPaymentAmount(amount);

        if (amount > remainingAmount) {
            message.warning(`El pago no puede exceder el saldo pendiente (${formatCurrency(remainingAmount)})`);
        }
    };

    const handleSubmit = async () => {
        try {
            setLoading(true);

            const values = await form.validateFields();

            console.log('[PaymentModal] Starting payment registration');
            console.log('[PaymentModal] Invoice:', invoice.id, invoice.fullNumber);
            console.log('[PaymentModal] Payment amount:', paymentAmount);
            console.log('[PaymentModal] Remaining amount:', remainingAmount);
            console.log('[PaymentModal] Total paid before:', totalPaid);
            console.log('[PaymentModal] Form values:', values);

            if (paymentAmount <= 0) {
                message.error('El importe debe ser mayor a 0');
                setLoading(false);
                return;
            }

            if (paymentAmount > remainingAmount) {
                message.error(`El pago excede el saldo pendiente (${formatCurrency(remainingAmount)})`);
                setLoading(false);
                return;
            }

            const request: AddPaymentRequest = {
                invoiceId: invoice.id,
                amount: paymentAmount,
                paymentDate: values.paymentDate ? values.paymentDate.toISOString() : new Date().toISOString(),
                paymentMethod: values.paymentMethod,
                reference: values.reference || null,
                notes: values.notes || null
            };

            console.log(`[PaymentModal] Starting ${isRectification ? 'refund' : 'payment'} registration`);
            console.log('[PaymentModal] Invoice:', invoice.id, invoice.fullNumber);
            console.log('[PaymentModal] Is rectification:', isRectification);
            console.log('[PaymentModal] Amount:', paymentAmount);
            console.log('[PaymentModal] Remaining amount:', remainingAmount);
            console.log('[PaymentModal] Form values:', values);
            console.log('[PaymentModal] Request:', request);

            const result = await billingController.addPayment(request, 'current_user');

            console.log('[PaymentModal] Payment result:', result);
            console.log('[PaymentModal] Result success:', result.success);

            if (result.success) {
                const willComplete = (totalPaid + paymentAmount) >= total;

                console.log('[PaymentModal] Transaction successful!');
                console.log('[PaymentModal] Will complete payment:', willComplete);
                console.log('[PaymentModal] New total paid:', totalPaid + paymentAmount);
                console.log('[PaymentModal] New remaining:', remainingAmount - paymentAmount);

                message.success(
                    willComplete
                        ? (isRectification
                            ? '¡Devolución registrada! Factura totalmente pagada'
                            : '¡Cobro registrado! Factura totalmente cobrada')
                        : `${isRectification ? 'Devolución' : 'Cobro'} registrado. Restante: ${formatCurrency(remainingAmount - paymentAmount)}`
                );

                form.resetFields();
                setPaymentAmount(0);
                onSuccess();
                onClose();
            } else {
                console.error('[PaymentModal] Transaction failed:', result.error);
                message.error(`Error: ${result.error.type}`);
            }
        } catch (error: any) {
            console.error(`[PaymentModal] Exception during ${isRectification ? 'refund' : 'payment'}:`, error);
            message.error(`Error al registrar ${isRectification ? 'devolución' : 'pago'}: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title={
                <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-green-600" />
                    <span>
                        {isRectification ? 'Registrar Devolución' : 'Registrar Cobro'} - {invoice.fullNumber}
                    </span>
                </div>
            }
            open={isOpen}
            onCancel={onClose}
            width={700}
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
                    disabled={paymentAmount <= 0 || paymentAmount > remainingAmount}
                >
                    {isRectification ? 'Registrar Devolución' : 'Registrar Cobro'}
                </Button>
            ]}
        >
            <div className="mb-4">
                <Row gutter={16}>
                    <Col span={8}>
                        <Statistic
                            title="Total Factura"
                            value={total}
                            precision={2}
                            prefix="€"
                            styles={{ content: { color: '#1890ff', fontSize: '14px' } }}
                        />
                    </Col>
                    <Col span={8}>
                        <Statistic
                            title={isRectification ? 'Pagado' : 'Cobrado'}
                            value={totalPaid}
                            precision={2}
                            prefix="€"
                            styles={{ content: { color: '#52c41a', fontSize: '14px' } }}
                        />
                    </Col>
                    <Col span={8}>
                        <Statistic
                            title="Pendiente"
                            value={remainingAmount}
                            precision={2}
                            prefix="€"
                            styles={{
                                content: {
                                    color: remainingAmount > 0 ? '#ff4d4f' : '#52c41a',
                                    fontSize: '14px',
                                    fontWeight: remainingAmount > 0 ? 'bold' : 'normal'
                                }
                            }}
                        />
                    </Col>
                </Row>
            </div>

            {remainingAmount > 0 && (
                <Alert
                    title={`Pendiente de ${isRectification ? 'devolución' : 'cobro'}: ${formatCurrency(remainingAmount)}`}
                    type="warning"
                    showIcon
                    className="mb-4"
                />
            )}

            {remainingAmount === 0 && (
                <Alert
                    title={`Esta factura ya está completamente ${isRectification ? 'pagada' : 'cobrada'}`}
                    type="success"
                    showIcon
                    className="mb-4"
                />
            )}

            <Form
                form={form}
                layout="vertical"
                initialValues={{
                    paymentDate: dayjs(),
                    paymentMethod: 'TRANSFER'
                }}
            >
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            label={`Fecha de ${isRectification ? 'Devolución' : 'Cobro'}`}
                            name="paymentDate"
                            rules={[{ required: true, message: 'Required' }]}
                        >
                            <DatePicker
                                style={{ width: '100%' }}
                                format="DD/MM/YYYY"
                                placeholder="Seleccionar fecha"
                                disabledDate={(current) => current && current > dayjs().endOf('day')}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            label={`Método de ${isRectification ? 'Devolución' : 'Cobro'}`}
                            name="paymentMethod"
                            rules={[{ required: true, message: 'Selecciona método' }]}
                        >
                            <Select>
                                {paymentMethods.map(method => (
                                    <Select.Option key={method.value} value={method.value}>
                                        {method.label}
                                    </Select.Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>
                </Row>

                <Form.Item
                    label={
                        <span className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4" />
                            {isRectification ? 'Importe a Devolver' : 'Importe a Cobrar'}
                        </span>
                    }
                    name="amount"
                    rules={[{ required: true, message: 'Ingresa el importe' }]}
                >
                    <InputNumber
                        min={0.01}
                        max={remainingAmount}
                        precision={2}
                        prefix="€"
                        style={{ width: '100%' }}
                        placeholder="0.00"
                        onChange={handleAmountChange}
                    />
                </Form.Item>

                {paymentAmount > 0 && (
                    <Alert
                        title={
                            <div>
                                <p className="mb-1">
                                    <strong>Cobro:</strong> {formatCurrency(paymentAmount)}
                                </p>
                                <p className="mb-0">
                                    <strong>Restará pendiente:</strong> {formatCurrency(remainingAmount - paymentAmount)}
                                </p>
                                {(totalPaid + paymentAmount) >= total && (
                                    <p className="text-green-600 font-semibold mt-2">
                                        ✓ Factura completamente {isRectification ? 'pagada' : 'cobrada'}
                                    </p>
                                )}
                            </div>
                        }
                        type={(totalPaid + paymentAmount) >= total ? "success" : "info"}
                        showIcon
                        className="mb-4"
                    />
                )}

                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            label="Referencia"
                            name="reference"
                        >
                            <Input
                                placeholder="Nº de referencia opcional"
                                maxLength={100}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            label="Notas"
                            name="notes"
                        >
                            <Input
                                placeholder="Notas adicionales"
                                maxLength={500}
                            />
                        </Form.Item>
                    </Col>
                </Row>
            </Form>
        </Modal>
    );
};

export default PaymentModal;
