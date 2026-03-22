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
import { CreditCard, DollarSign, Save, AlertCircle, CheckCircle2, Calendar, Wallet, Hash, FileText } from 'lucide-react';
import { Modal, Form, Input, InputNumber, Button, Select, DatePicker, Row, Col, message } from 'antd';
import { billingController } from '../../../services/billing';
import type { AddPaymentRequest, Invoice } from '../../../types/invoicing';
import { formatCurrency } from '../../../utils/formatters';
import { useAuth } from '../../../context/AuthContext';
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
    const { user } = useAuth();
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

            const result = await billingController.addPayment(request, user?.uid ?? 'unknown');

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
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg">
                        <CreditCard className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 leading-none mb-1">
                            {isRectification ? 'Registrar Devolución' : 'Registrar Cobro'}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium">
                            Factura {invoice.fullNumber}
                        </p>
                    </div>
                </div>
            }
            open={isOpen}
            onCancel={onClose}
            width={650}
            className="premium-modal"
            footer={
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <Button 
                        key="cancel" 
                        onClick={onClose}
                        className="border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50 font-medium px-5"
                    >
                        Cancelar
                    </Button>
                    <Button
                        key="submit"
                        type="primary"
                        icon={<Save className="w-4 h-4" />}
                        loading={loading}
                        onClick={handleSubmit}
                        disabled={paymentAmount <= 0 || paymentAmount > remainingAmount}
                        className="bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200 dark:shadow-none font-medium px-6 border-0"
                    >
                        {isRectification ? 'Registrar Devolución' : 'Confirmar Cobro'}
                    </Button>
                </div>
            }
        >
            {/* Header Metrics */}
            <div className="mb-6 mt-4">
                <div className="grid grid-cols-3 gap-4">
                    {/* Total Invoice */}
                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
                        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                            Total Factura
                        </div>
                        <div className="text-2xl font-black text-slate-700 dark:text-slate-200 tracking-tight">
                            {formatCurrency(total)}
                        </div>
                    </div>
                    
                    {/* Paid Amount */}
                    <div className="bg-emerald-50/50 dark:bg-emerald-900/10 rounded-xl p-4 border border-emerald-100 dark:border-emerald-900/30">
                        <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-widest mb-1">
                            {isRectification ? 'Pagado' : 'Cobrado'}
                        </div>
                        <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 tracking-tight">
                            {formatCurrency(totalPaid)}
                        </div>
                    </div>

                    {/* Pending Amount */}
                    <div className={`rounded-xl p-4 border ${remainingAmount > 0 ? 'bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-900/30' : 'bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800'}`}>
                        <div className={`text-[11px] font-bold uppercase tracking-widest mb-1 ${remainingAmount > 0 ? 'text-orange-600 dark:text-orange-500' : 'text-slate-500'}`}>
                            Pendiente
                        </div>
                        <div className={`text-2xl font-black tracking-tight ${remainingAmount > 0 ? 'text-orange-700 dark:text-orange-400' : 'text-slate-700 dark:text-slate-200'}`}>
                            {formatCurrency(remainingAmount)}
                        </div>
                    </div>
                </div>
            </div>

            {/* Smart Alerts */}
            {remainingAmount > 0 ? (
                <div className="mb-6 flex items-start gap-3 p-3.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl">
                    <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                        <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-400">
                            Pendiente de {isRectification ? 'devolución' : 'cobro'}
                        </h4>
                        <p className="text-xs text-amber-700 dark:text-amber-500 mt-0.5 font-medium">
                            Faltan {formatCurrency(remainingAmount)} para liquidar esta factura.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="mb-6 flex items-start gap-3 p-3.5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                        <h4 className="text-sm font-semibold text-emerald-800 dark:text-emerald-400">
                            Factura {isRectification ? 'pagada' : 'cobrada'}
                        </h4>
                        <p className="text-xs text-emerald-700 dark:text-emerald-500 mt-0.5 font-medium">
                            Esta factura ya ha sido completamente saldada. No hay acciones pendientes.
                        </p>
                    </div>
                </div>
            )}

            {/* Input Form */}
            <Form
                form={form}
                layout="vertical"
                initialValues={{
                    paymentDate: dayjs(),
                    paymentMethod: 'TRANSFER'
                }}
            >
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 mb-5 shadow-sm">
                    <Row gutter={20}>
                        <Col span={12}>
                            <Form.Item
                                label={<span className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2"><Calendar className="w-4 h-4 text-slate-400" /> Fecha de {isRectification ? 'Devolución' : 'Cobro'}</span>}
                                name="paymentDate"
                                rules={[{ required: true, message: 'Requerido' }]}
                                className="mb-5"
                            >
                                <DatePicker
                                    style={{ width: '100%' }}
                                    format="DD/MM/YYYY"
                                    placeholder="Seleccionar fecha"
                                    disabledDate={(current) => current && current > dayjs().endOf('day')}
                                    className="rounded-lg h-10"
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                label={<span className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2"><Wallet className="w-4 h-4 text-slate-400" /> Método de {isRectification ? 'Devolución' : 'Cobro'}</span>}
                                name="paymentMethod"
                                rules={[{ required: true, message: 'Selecciona método' }]}
                                className="mb-5"
                            >
                                <Select className="h-10 rounded-lg">
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
                        label={<span className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2"><DollarSign className="w-4 h-4 text-slate-400" /> Importe a {isRectification ? 'Devolver' : 'Cobrar'}</span>}
                        name="amount"
                        rules={[{ required: true, message: 'Ingresa el importe' }]}
                        className="mb-0"
                    >
                        <InputNumber
                            min={0.01}
                            max={remainingAmount}
                            precision={2}
                            prefix={<span className="text-slate-400 font-medium">€</span>}
                            className="w-full rounded-lg text-lg font-bold h-12 flex items-center"
                            placeholder="0.00"
                            onChange={handleAmountChange}
                        />
                    </Form.Item>
                </div>

                {/* Live Preview Card */}
                {paymentAmount > 0 && (
                    <div className={`mb-5 p-4 rounded-xl border transition-colors ${
                        (totalPaid + paymentAmount) >= total 
                            ? 'bg-emerald-50/50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20' 
                            : 'bg-indigo-50/50 border-indigo-100 dark:bg-indigo-500/10 dark:border-indigo-500/20'
                    }`}>
                        <div className="flex justify-between items-center mb-1.5">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Cobro Actualizado</span>
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{formatCurrency(paymentAmount)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Nuevo Saldo Pendiente</span>
                            <span className="text-sm font-black text-slate-800 dark:text-slate-100">{formatCurrency(remainingAmount - paymentAmount)}</span>
                        </div>
                        
                        {(totalPaid + paymentAmount) >= total && (
                            <div className="mt-3 pt-3 border-t border-emerald-100 dark:border-emerald-500/20 flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                                <span className="text-[13px] font-bold text-emerald-700 dark:text-emerald-400">
                                    Esta transacción liquidará la factura completamente
                                </span>
                            </div>
                        )}
                    </div>
                )}

                <Row gutter={20}>
                    <Col span={12}>
                        <Form.Item
                            label={<span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><Hash className="w-3.5 h-3.5" /> Referencia</span>}
                            name="reference"
                            className="mb-0"
                        >
                            <Input
                                placeholder="Nº de transferencia, recibo..."
                                maxLength={100}
                                className="rounded-lg h-9"
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            label={<span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Notas</span>}
                            name="notes"
                            className="mb-0"
                        >
                            <Input
                                placeholder="Observaciones adicionales"
                                maxLength={500}
                                className="rounded-lg h-9"
                            />
                        </Form.Item>
                    </Col>
                </Row>
            </Form>
        </Modal>
    );
};

export default PaymentModal;
