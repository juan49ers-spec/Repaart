/**
 * Customer Invoice History Component
 * 
 * Muestra el historial completo de facturas de un cliente
 * con métricas y estadísticas
 */

import React, { useState, useEffect } from 'react';
import { 
    Modal, 
    Table, 
    Tag, 
    Spin, 
    Empty, 
    Row, 
    Col,
    Button,
    Tooltip
} from 'antd';
import { 
    FileText, 
    Euro, 
    CheckCircle,
    AlertTriangle,
    ExternalLink
} from 'lucide-react';
import { invoiceEngine } from '../../../services/billing/invoiceEngine';
import type { Invoice, InvoiceStatus, PaymentStatus } from '../../../types/invoicing';
import { InvoiceStatus as InvStatus, PaymentStatus as PayStatus } from '../../../types/invoicing';
import { Timestamp } from 'firebase/firestore';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    customerId: string;
    customerName: string;
    franchiseId: string;
    onViewInvoice?: (invoiceId: string) => void;
}

interface CustomerStats {
    totalInvoiced: number;
    totalPaid: number;
    totalPending: number;
    invoiceCount: number;
}

const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);

const formatDate = (date: Date | Timestamp | string) => {
    if (date instanceof Timestamp) return date.toDate().toLocaleDateString('es-ES');
    if (typeof date === 'string') return new Date(date).toLocaleDateString('es-ES');
    return date.toLocaleDateString('es-ES');
};

const getStatusTag = (status: InvoiceStatus) => {
    const config: Record<InvoiceStatus, { color: string; text: string }> = {
        [InvStatus.DRAFT]: { color: 'default', text: 'Borrador' },
        [InvStatus.ISSUED]: { color: 'blue', text: 'Emitida' },
        [InvStatus.RECTIFIED]: { color: 'red', text: 'Rectificada' }
    };
    const { color, text } = config[status] || { color: 'default', text: status };
    return <Tag color={color}>{text}</Tag>;
};

const getPaymentTag = (status: PaymentStatus) => {
    const config: Record<PaymentStatus, { color: string; text: string }> = {
        [PayStatus.PENDING]: { color: 'orange', text: 'Pendiente' },
        [PayStatus.PARTIAL]: { color: 'gold', text: 'Parcial' },
        [PayStatus.PAID]: { color: 'green', text: 'Pagada' }
    };
    const { color, text } = config[status] || { color: 'default', text: status };
    return <Tag color={color}>{text}</Tag>;
};

export const CustomerInvoiceHistory: React.FC<Props> = ({
    isOpen,
    onClose,
    customerId,
    customerName,
    franchiseId,
    onViewInvoice
}) => {
    const [loading, setLoading] = useState(false);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [stats, setStats] = useState<CustomerStats | null>(null);

    useEffect(() => {
        if (isOpen && customerId && franchiseId) {
            loadData();
        }
    }, [isOpen, customerId, franchiseId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [invoicesResult, statsResult] = await Promise.all([
                invoiceEngine.getInvoicesByCustomer(franchiseId, customerId),
                invoiceEngine.getCustomerStats(franchiseId, customerId)
            ]);

            if (invoicesResult.success) {
                setInvoices(invoicesResult.data);
            }

            if (statsResult.success) {
                setStats(statsResult.data);
            }
        } catch (error) {
            console.error('Error loading customer data:', error);
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            title: 'Nº Factura',
            dataIndex: 'fullNumber',
            key: 'fullNumber',
            render: (text: string, _: Invoice) => (
                <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span className="font-medium">{text}</span>
                </div>
            )
        },
        {
            title: 'Fecha',
            dataIndex: 'issueDate',
            key: 'issueDate',
            render: (date: Date | Timestamp) => formatDate(date)
        },
        {
            title: 'Total',
            dataIndex: 'total',
            key: 'total',
            render: (total: number) => (
                <span className="font-semibold">{formatCurrency(total)}</span>
            )
        },
        {
            title: 'Pagado',
            dataIndex: 'totalPaid',
            key: 'totalPaid',
            render: (paid: number, record: Invoice) => (
                <span className={paid >= record.total ? 'text-green-600' : 'text-slate-600'}>
                    {formatCurrency(paid || 0)}
                </span>
            )
        },
        {
            title: 'Estado',
            dataIndex: 'status',
            key: 'status',
            render: (status: InvoiceStatus) => getStatusTag(status)
        },
        {
            title: 'Pago',
            dataIndex: 'paymentStatus',
            key: 'paymentStatus',
            render: (status: PaymentStatus) => getPaymentTag(status)
        },
        {
            title: '',
            key: 'actions',
            width: 50,
            render: (_: unknown, record: Invoice) => (
                <Tooltip title="Ver factura">
                    <Button
                        type="text"
                        size="small"
                        icon={<ExternalLink className="w-4 h-4" />}
                        onClick={() => onViewInvoice?.(record.id)}
                    />
                </Tooltip>
            )
        }
    ];

    return (
        <Modal
            open={isOpen}
            onCancel={onClose}
            footer={null}
            width={900}
            title={
                <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-600" />
                    <span>Historial de {customerName}</span>
                </div>
            }
        >
            {loading ? (
                <div className="flex justify-center py-12">
                    <Spin size="large" />
                </div>
            ) : (
                <div className="space-y-6">
                    {stats && (
                        <Row gutter={16}>
                            <Col span={6}>
                                <div className="bg-slate-50 rounded-lg p-4 text-center">
                                    <div className="flex items-center justify-center gap-2 mb-1">
                                        <FileText className="w-4 h-4 text-slate-400" />
                                    </div>
                                    <div className="text-2xl font-bold text-slate-900">{stats.invoiceCount}</div>
                                    <div className="text-xs text-slate-500">Facturas</div>
                                </div>
                            </Col>
                            <Col span={6}>
                                <div className="bg-blue-50 rounded-lg p-4 text-center">
                                    <div className="flex items-center justify-center gap-2 mb-1">
                                        <Euro className="w-4 h-4 text-blue-500" />
                                    </div>
                                    <div className="text-2xl font-bold text-blue-900">{formatCurrency(stats.totalInvoiced)}</div>
                                    <div className="text-xs text-blue-600">Total Facturado</div>
                                </div>
                            </Col>
                            <Col span={6}>
                                <div className="bg-green-50 rounded-lg p-4 text-center">
                                    <div className="flex items-center justify-center gap-2 mb-1">
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                    </div>
                                    <div className="text-2xl font-bold text-green-900">{formatCurrency(stats.totalPaid)}</div>
                                    <div className="text-xs text-green-600">Cobrado</div>
                                </div>
                            </Col>
                            <Col span={6}>
                                <div className={`rounded-lg p-4 text-center ${stats.totalPending > 0 ? 'bg-orange-50' : 'bg-slate-50'}`}>
                                    <div className="flex items-center justify-center gap-2 mb-1">
                                        {stats.totalPending > 0 ? (
                                            <AlertTriangle className="w-4 h-4 text-orange-500" />
                                        ) : (
                                            <CheckCircle className="w-4 h-4 text-green-500" />
                                        )}
                                    </div>
                                    <div className={`text-2xl font-bold ${stats.totalPending > 0 ? 'text-orange-900' : 'text-slate-400'}`}>
                                        {formatCurrency(stats.totalPending)}
                                    </div>
                                    <div className={`text-xs ${stats.totalPending > 0 ? 'text-orange-600' : 'text-slate-500'}`}>
                                        Pendiente
                                    </div>
                                </div>
                            </Col>
                        </Row>
                    )}

                    {invoices.length === 0 ? (
                        <Empty
                            description="No hay facturas para este cliente"
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                        />
                    ) : (
                        <Table
                            dataSource={invoices}
                            columns={columns}
                            rowKey="id"
                            pagination={{ pageSize: 5, showSizeChanger: false }}
                            size="small"
                        />
                    )}
                </div>
            )}
        </Modal>
    );
};

export default CustomerInvoiceHistory;
