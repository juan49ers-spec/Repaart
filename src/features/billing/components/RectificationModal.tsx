/**
 * Rectification Modal Component
 *
 * Modal for creating rectifying invoices (R-series) when:
 * - Original invoice needs to be cancelled
 * - Errors in original invoice
 * - Returns or discounts
 *
 * Features:
 * - R-series invoice generation (R-YYYY-X)
 * - Automatic link to original invoice
 * - Original invoice annulment
 * - Rectification reason tracking
 */

import React, { useState, useEffect } from 'react';
import { FileText, AlertCircle, Save } from 'lucide-react';
import { Modal, Form, Input, Button, Alert, Row, Col, message, Card } from 'antd';
import { billingController } from '../../../services/billing';
import type { RectifyInvoiceRequest, Invoice } from '../../../types/invoicing';
import { formatCurrency } from '../../../utils/formatters';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    invoice: Invoice;
}

export const RectificationModal: React.FC<Props> = ({
    isOpen,
    onClose,
    onSuccess,
    invoice
}) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            form.resetFields();
        }
    }, [isOpen, form]);

    const handleSubmit = async () => {
        try {
            setLoading(true);

            const values = await form.validateFields();

            const request: RectifyInvoiceRequest = {
                invoiceId: invoice.id,
                reason: values.reason,
                rectifiedBy: 'current_user'
            };

            const result = await billingController.rectifyInvoice(request);

            if (result.success) {
                message.success(
                    `Factura rectificativa ${result.data.rectifying.fullNumber} creada.`
                );

                form.resetFields();
                onSuccess();
                onClose();
            } else {
                message.error(`Error: ${result.error.type}`);
            }
        } catch (error: any) {
            message.error(`Error al crear rectificativa: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title={
                <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-red-600" />
                    <span>Rectificar Factura {invoice.fullNumber}</span>
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
                    danger
                    icon={<Save />}
                    loading={loading}
                    onClick={handleSubmit}
                >
                    Crear Rectificativa
                </Button>
            ]}
        >
            <Alert
                message="Factura Rectificativa"
                description={
                    <div>
                        <p className="mb-2">
                            Se creará una factura con serie <strong>R</strong> (R-YYYY-X) que anulará la factura original.
                        </p>
                        <p className="mb-0">
                            <strong>Número de serie:</strong> R-{new Date().getFullYear()}-X
                        </p>
                    </div>
                }
                type="warning"
                showIcon
                icon={<AlertCircle className="w-4 h-4" />}
                className="mb-4"
            />

            <Card className="mb-4" size="small">
                <Row gutter={16}>
                    <Col span={12}>
                        <div className="text-sm text-gray-500">Factura Original</div>
                        <div className="font-semibold">{invoice.fullNumber}</div>
                    </Col>
                    <Col span={12}>
                        <div className="text-sm text-gray-500">Importe</div>
                        <div className="font-semibold text-blue-600">{formatCurrency(invoice.total)}</div>
                    </Col>
                </Row>
            </Card>

            <Form
                form={form}
                layout="vertical"
            >
                <Form.Item
                    label="Motivo de la Rectificación"
                    name="reason"
                    rules={[
                        { required: true, message: 'Describe el motivo de la rectificación' },
                        { min: 20, message: 'El motivo debe tener al menos 20 caracteres' }
                    ]}
                >
                    <Input.TextArea
                        rows={4}
                        placeholder="Explica detalladamente el motivo de la rectificación..."
                        maxLength={500}
                        showCount
                    />
                </Form.Item>

                <Alert
                    message="Importante"
                    description={
                        <ul className="mb-0 ml-4">
                            <li>La factura rectificativa tendrá números de serie R (R-YYYY-X)</li>
                            <li>La factura original quedará anulada</li>
                            <li>Esta acción es irreversible</li>
                            <li>Se cumplirá con la normativa europea de facturación</li>
                        </ul>
                    }
                    type="info"
                    showIcon
                />
            </Form>
        </Modal>
    );
};

export default RectificationModal;
