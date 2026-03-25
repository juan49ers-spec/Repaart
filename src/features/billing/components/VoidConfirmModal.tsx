import React, { useState, useEffect } from 'react';
import { XCircle, AlertCircle, Trash2 } from 'lucide-react';
import { Modal, Form, Input, Button, Alert, message, Card, Row, Col } from 'antd';
import { invoiceEngine } from '../../../services/billing';
import type { Invoice } from '../../../types/invoicing';
import { formatCurrency } from '../../../utils/formatters';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  invoice: Invoice | null;
}

export const VoidConfirmModal: React.FC<Props> = ({
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
    if (!invoice) return;

    try {
      setLoading(true);
      const values = await form.validateFields();

      const result = await invoiceEngine.voidInvoice({
        invoiceId: invoice.id,
        reason: values.reason,
        voidedBy: 'current_user', // Replace with actual user context later if available
        franchiseId: invoice.franchiseId,
        issueDate: invoice.issueDate instanceof Date ? invoice.issueDate : new Date((invoice.issueDate as unknown as { seconds: number }).seconds * 1000)
      });

      if (result.success) {
        message.success(`Factura ${invoice.fullNumber} anulada correctamente.`);
        form.resetFields();
        onSuccess();
        onClose();
      } else {
        message.error(`Error: ${result.error?.type || 'No se pudo anular'}`);
      }
    } catch (error: unknown) {
      message.error(`Error al anular factura: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  if (!invoice) return null;

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <Trash2 className="w-5 h-5 text-red-600" />
          <span>Anular Factura (Baja Lógica) {invoice.fullNumber}</span>
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      width={600}
      footer={[
        <Button key="cancel" onClick={onClose} disabled={loading}>
          Cancelar
        </Button>,
        <Button
          key="submit"
          type="primary"
          danger
          icon={<XCircle className="w-4 h-4" />}
          loading={loading}
          onClick={handleSubmit}
        >
          Confirmar Anulación
        </Button>
      ]}
    >
      <Alert
        message="Atención: Vas a anular una factura"
        description={
          <div>
            <p className="mb-2 text-sm">
              Esta acción marcará la factura como completamente <strong>ANULADA (Roba-Errores)</strong> sin generar nota de crédito y borrará su registro en la <strong>Hucha Fiscal</strong>.
            </p>
            <ul className="list-disc pl-5 mb-0 text-sm">
              <li>Mantiene el agujero en la numeración (salto de correlatividad).</li>
              <li>El cliente ya no verá esta factura como válida.</li>
            </ul>
          </div>
        }
        type="warning"
        showIcon
        icon={<AlertCircle className="w-4 h-4" />}
        className="mb-4"
      />

      <Card className="mb-4 bg-slate-50 border-slate-200" size="small">
        <Row gutter={16}>
          <Col span={12}>
            <div className="text-xs text-slate-500 font-medium">Factura</div>
            <div className="font-semibold text-slate-900">{invoice.fullNumber}</div>
          </Col>
          <Col span={12}>
            <div className="text-xs text-slate-500 font-medium">Importe Original</div>
            <div className="font-semibold text-red-600">{formatCurrency(invoice.total)}</div>
          </Col>
        </Row>
      </Card>

      <Form form={form} layout="vertical">
        <Form.Item
          label={<span className="font-medium text-slate-700">Motivo interno de la anulación</span>}
          name="reason"
          rules={[
            { required: true, message: 'El motivo es obligatorio para justificar el salto frente a Hacienda.' },
            { min: 10, message: 'El motivo debe ser algo descriptivo (mín. 10 caract.)' }
          ]}
        >
          <Input.TextArea
            rows={4}
            placeholder="Ej: Emitida por error a CIF incorrecto, duplicada, etc."
            maxLength={300}
            showCount
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};
