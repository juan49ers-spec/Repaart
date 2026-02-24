import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Input, DatePicker, Select, message, Card, Row, Col, InputNumber, Tooltip } from 'antd';
import { Edit, Trash2, Plus, Info } from 'lucide-react';
import type { Invoice, InvoiceLine } from '../../../types/invoicing';
import { invoiceEngine } from '../../../services/billing';
import dayjs from 'dayjs';

interface EditInvoiceModalProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  franchiseId: string;
}

export const EditInvoiceModal: React.FC<EditInvoiceModalProps> = ({
  invoice,
  isOpen,
  onClose,
  onSuccess,
  franchiseId
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [lines, setLines] = useState<InvoiceLine[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  // Cargar clientes y líneas cuando se abre el modal
  useEffect(() => {
    const loadData = async () => {
      if (isOpen && invoice) {
        // Cargar líneas de la factura
        setLines(invoice.lines || []);

        // Cargar datos en el formulario
        const toDate = (date: any): Date => {
          if (!date) return new Date();
          if (date.toDate) return date.toDate();
          if (date.seconds) return new Date(date.seconds * 1000);
          return new Date(date);
        };

        form.setFieldsValue({
          customerId: invoice.customerSnapshot?.id || invoice.customerId,
          issueDate: dayjs(toDate(invoice.issueDate)),
          dueDate: dayjs(toDate(invoice.dueDate)),
          template: invoice.template || 'modern'
        });

        // Cargar clientes
        await loadCustomers();
      }
    };

    loadData();
  }, [isOpen, invoice, form]);

  const loadCustomers = async () => {
    setLoadingCustomers(true);
    try {
      const { collection, getDocs, query, where } = await import('firebase/firestore');
      const { db } = await import('../../../lib/firebase');

      const customersRef = collection(db, 'customers');
      const q = query(customersRef, where('franchiseId', '==', franchiseId));
      const querySnap = await getDocs(q);

      const customersData = querySnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setCustomers(customersData);
    } catch (error) {
      console.error('[EditInvoiceModal] Error loading customers:', error);
    } finally {
      setLoadingCustomers(false);
    }
  };

  const addLine = () => {
    const newLine: InvoiceLine = {
      id: `line_${Date.now()}`,
      description: '',
      quantity: 1,
      unitPrice: 0,
      taxRate: 0.21,
      amount: 0,
      taxAmount: 0,
      total: 0
    };
    setLines([...lines, newLine]);
  };

  const updateLine = (id: string, field: keyof InvoiceLine, value: any) => {
    setLines(lines.map(line => {
      if (line.id === id) {
        const updated = { ...line, [field]: value };
        if (field === 'quantity' || field === 'unitPrice' || field === 'taxRate') {
          updated.amount = (updated.quantity || 0) * (updated.unitPrice || 0);
          updated.taxAmount = updated.amount * (updated.taxRate || 0);
        }
        return updated;
      }
      return line;
    }));
  };

  const removeLine = (id: string) => {
    setLines(lines.filter(l => l.id !== id));
  };

  const totals = React.useMemo(() => {
    const subtotal = lines.reduce((sum, line) => sum + (line.amount || 0), 0);
    const totalTax = lines.reduce((sum, line) => sum + (line.taxAmount || 0), 0);
    const total = subtotal + totalTax;
    return { subtotal, totalTax, total };
  }, [lines]);

  const handleSave = async () => {
    if (lines.length === 0) {
      message.error('Agrega al menos una línea a la factura');
      return;
    }

    try {
      setLoading(true);
      const values = await form.validateFields();

      const updates = {
        customerId: values.customerId,
        customerType: 'RESTAURANT' as const,
        issueDate: values.issueDate.toISOString(),
        dueDate: values.dueDate.toISOString(),
        template: values.template,
        lines: lines.map(l => ({ ...l, total: l.amount || 0 })),
        subtotal: totals.subtotal,
        total: totals.total,
        taxBreakdown: lines.reduce((acc: any[], line) => {
          const existing = acc.find(t => t.taxRate === line.taxRate);
          if (existing) {
            existing.taxableBase += line.amount;
            existing.taxAmount += line.taxAmount;
          } else {
            acc.push({
              taxRate: line.taxRate,
              taxableBase: line.amount,
              taxAmount: line.taxAmount
            });
          }
          return acc;
        }, [])
      };

      const result = await invoiceEngine.updateDraft(invoice!.id, updates);

      if (result.success) {
        message.success('Factura actualizada correctamente');
        onSuccess();
        onClose();
      } else {
        message.error(`Error: ${result.error.type}`);
      }
    } catch (error: any) {
      console.error('[EditInvoiceModal] Error updating invoice:', error);
      message.error(`Error: ${error.message || 'Error al actualizar la factura'}`);
    } finally {
      setLoading(false);
    }
  };

  const customerOptions = customers.map((c: any) => ({
    label: `${c.fiscalName} (${c.cif})`,
    value: c.id
  }));

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <Edit className="w-5 h-5 text-indigo-600" />
          <span>Editar Factura {invoice?.fullNumber}</span>
          <Tooltip title="Solo puedes editar facturas en estado BORRADOR">
            <Info className="w-4 h-4 text-slate-400" />
          </Tooltip>
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      width={900}
      footer={null}
      destroyOnHidden
    >
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Cliente"
              name="customerId"
              rules={[{ required: true, message: 'Selecciona un cliente' }]}
            >
              <Select
                placeholder="Seleccionar cliente"
                options={customerOptions}
                loading={loadingCustomers}
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
              />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="Fecha Emisión"
              name="issueDate"
              rules={[{ required: true, message: 'Requerido' }]}
            >
              <DatePicker className="w-full" format="DD/MM/YYYY" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="Fecha Vencimiento"
              name="dueDate"
              rules={[{ required: true, message: 'Requerido' }]}
            >
              <DatePicker className="w-full" format="DD/MM/YYYY" />
            </Form.Item>
          </Col>
        </Row>

        <Card
          title={
            <div className="flex items-center justify-between">
              <span>Líneas de Factura</span>
              <Button
                type="primary"
                size="small"
                icon={<Plus size={14} />}
                onClick={addLine}
              >
                Agregar Línea
              </Button>
            </div>
          }
          size="small"
          className="mb-4"
        >
          <div className="space-y-2">
            {lines.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                No hay líneas. Agrega una línea para comenzar.
              </div>
            ) : (
              lines.map((line) => (
                <Row key={line.id} gutter={8} align="middle">
                  <Col span={7}>
                    <Input
                      placeholder="Descripción del servicio/producto"
                      value={line.description}
                      onChange={(e) => updateLine(line.id, 'description', e.target.value)}
                    />
                  </Col>
                  <Col span={3}>
                    <InputNumber
                      placeholder="Cant."
                      min={0}
                      precision={0}
                      value={line.quantity}
                      onChange={(v) => updateLine(line.id, 'quantity', v || 0)}
                      className="w-full"
                    />
                  </Col>
                  <Col span={4}>
                    <InputNumber
                      placeholder="Precio"
                      min={0}
                      precision={2}
                      value={line.unitPrice}
                      onChange={(v) => updateLine(line.id, 'unitPrice', v || 0)}
                      className="w-full"
                      prefix="€"
                    />
                  </Col>
                  <Col span={3}>
                    <InputNumber
                      placeholder="IVA"
                      min={0}
                      max={1}
                      step={0.01}
                      value={line.taxRate}
                      onChange={(v) => updateLine(line.id, 'taxRate', v || 0)}
                      className="w-full"
                      formatter={(value) => `${(value ? value * 100 : 0).toFixed(0)}%`}
                      parser={(val) => {
                        const num = parseFloat(val?.replace('%', '') || '0');
                        return isNaN(num) ? 0 : num / 100;
                      }}
                    />
                  </Col>
                  <Col span={4}>
                    <div className="text-right font-medium">
                      <div className="text-xs text-slate-400">Total</div>
                      <div className="text-sm">€{(line.amount || 0).toFixed(2)}</div>
                    </div>
                  </Col>
                  <Col span={3}>
                    <Button
                      danger
                      size="small"
                      icon={<Trash2 size={14} />}
                      onClick={() => removeLine(line.id)}
                      block
                    >
                      Eliminar
                    </Button>
                  </Col>
                </Row>
              ))
            )}
          </div>

          <div className="flex justify-end mt-4 pt-4 border-t border-slate-200">
            <div className="text-right">
              <div className="flex justify-between gap-8 mb-1">
                <span className="text-slate-500">Subtotal:</span>
                <span className="font-medium">€{totals.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between gap-8 mb-1">
                <span className="text-slate-500">IVA:</span>
                <span className="font-medium">€{totals.totalTax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between gap-8 mt-2 pt-2 border-t border-slate-300">
                <span className="text-lg font-bold">TOTAL:</span>
                <span className="text-lg font-bold text-emerald-600">€{totals.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </Card>

        <div className="flex justify-end gap-2">
          <Button onClick={onClose} size="large">
            Cancelar
          </Button>
          <Button
            type="primary"
            onClick={handleSave}
            loading={loading}
            size="large"
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            Guardar Cambios
          </Button>
        </div>
      </Form>
    </Modal>
  );
};
