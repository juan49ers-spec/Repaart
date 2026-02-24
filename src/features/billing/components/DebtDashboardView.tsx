/**
 * Debt Dashboard View Component
 *
 * Displays overdue debts with aging analysis:
 * - 0-30 days: Current
 * - 31-60 days: Warning
 * - 61-90 days: Critical
 * - >90 days: Legal action
 *
 * Features:
 * - Customer debt grouping
 * - Aging buckets
 * - Quick payment actions
 * - Export to Excel
 * - Payment reminders
 */

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, Mail, Download, Filter, DollarSign } from 'lucide-react';
import { Card, Table, Row, Col, Statistic, Button, Space, Select, message, Tooltip, Progress, Tag } from 'antd';
import { accountsReceivable } from '../../../services/billing';
import type { DebtDashboard, CustomerDebt, InvoiceDebt } from '../../../types/invoicing';
import { formatCurrency } from '../../../utils/formatters';

interface Props {
    franchiseId: string;
    refreshTrigger?: number;
}

export const DebtDashboardView: React.FC<Props> = ({ franchiseId, refreshTrigger }) => {
    const [loading, setLoading] = useState(false);
    const [debtData, setDebtData] = useState<DebtDashboard | null>(null);
    const [agingFilter, setAgingFilter] = useState<string>('ALL');

    const HealthSemaphore = () => {
        if (!debtData) return null;

        return (
            <div className="flex items-center gap-3 bg-slate-50/50 dark:bg-slate-900/30 p-1 rounded-md border border-slate-100 dark:border-slate-800/50 mb-2 overflow-x-auto scroller-hidden">
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter whitespace-nowrap">SALUD:</span>
                <div className="flex items-center gap-3">
                    {agingBuckets.map(bucket => {
                        const amount = getAgingBucketAmount(bucket.key);
                        const hasDebt = amount > 0;
                        return (
                            <div key={bucket.key} className="flex items-center gap-1.5">
                                <div
                                    className="w-2 h-2 rounded-full shadow-sm flex-shrink-0"
                                    style={{ backgroundColor: bucket.color }}
                                />
                                <span className={`text-[9px] font-medium whitespace-nowrap ${hasDebt ? 'text-slate-600 dark:text-slate-300' : 'text-slate-400'}`}>
                                    {bucket.shortLabel}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    useEffect(() => {
        fetchDebtData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [franchiseId, refreshTrigger]);

    const fetchDebtData = async () => {
        try {
            setLoading(true);

            const result = await accountsReceivable.generateDebtDashboard(franchiseId);

            if (result.success) {
                setDebtData(result.data);
            } else {
                message.error(`Error: ${result.error.type}`);
            }
        } catch (error: any) {
            message.error(`Error al cargar dashboard: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const customerColumns = [
        {
            title: 'Cliente',
            dataIndex: 'customerName',
            key: 'customerName',
            render: (name: string, record: CustomerDebt) => {
                const maxOverdue = Math.max(...record.invoices.map(inv => inv.daysOverdue));
                let statusColor = 'bg-emerald-500';
                if (maxOverdue > 15) statusColor = 'bg-red-500';
                else if (maxOverdue > 7) statusColor = 'bg-orange-500';
                else if (maxOverdue > 0) statusColor = 'bg-yellow-500';

                return (
                    <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${statusColor}`} />
                        <div>
                            <div className="font-semibold text-[13px] leading-tight">{name}</div>
                            <div className="text-[10px] text-gray-400">{record.invoices.length} facturas</div>
                        </div>
                    </div>
                );
            }
        },
        {
            title: 'Deuda Total',
            dataIndex: 'totalDebt',
            key: 'totalDebt',
            sorter: (a: CustomerDebt, b: CustomerDebt) => a.totalDebt - b.totalDebt,
            render: (amount: number) => (
                <span className="font-semibold text-red-600 text-[13px]">
                    {formatCurrency(amount)}
                </span>
            )
        },
        {
            title: 'Deuda Vencida',
            dataIndex: 'overdueDebt',
            key: 'overdueDebt',
            sorter: (a: CustomerDebt, b: CustomerDebt) => a.overdueDebt - b.overdueDebt,
            render: (amount: number, record: CustomerDebt) => {
                const isConcentrationRisk = debtData && (amount / debtData.totalDebt) > 0.5;
                const hasRecentPayment = record.invoices.some(inv => inv.paidAmount > 0);

                return (
                    <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-orange-600 text-[13px]">
                                {formatCurrency(amount)}
                            </span>
                            {isConcentrationRisk && (
                                <Tooltip title="Riesgo de Concentración (>50% de deuda total)">
                                    <AlertTriangle className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                                </Tooltip>
                            )}
                        </div>
                        {hasRecentPayment && (
                            <Tag color="cyan" style={{ fontSize: '9px', width: 'fit-content', padding: '0 4px', lineHeight: '14px' }}>
                                Voluntad de Pago
                            </Tag>
                        )}
                    </div>
                );
            }
        },
        {
            title: 'Progreso de Cobro',
            key: 'progress',
            width: 150,
            render: (_: any, record: CustomerDebt) => {
                const totalAmount = record.invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
                const paidAmount = record.invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
                const percentage = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;

                return (
                    <div className="w-full">
                        <div className="flex justify-between text-[10px] mb-1">
                            <span>{formatCurrency(paidAmount)} cobrados</span>
                            <span className="font-bold">{Math.round(percentage)}%</span>
                        </div>
                        <Progress
                            percent={percentage}
                            size="small"
                            strokeColor="#52c41a"
                            trailColor="#f0f0f0"
                            showInfo={false}
                        />
                    </div>
                );
            }
        },
        {
            title: 'Acciones',
            key: 'actions',
            render: () => (
                <Space>
                    <Tooltip title="Ver detalle">
                        <Button size="small" icon={<Filter />} />
                    </Tooltip>
                    <Tooltip title="Enviar recordatorio">
                        <Button size="small" icon={<Mail />} />
                    </Tooltip>
                </Space>
            )
        }
    ];

    const agingBuckets = [
        {
            key: 'current',
            label: 'Al día (Corriente)',
            shortLabel: 'Al día',
            color: '#52c41a',
            action: 'Seguimiento normal'
        },
        {
            key: '0-7',
            label: '1-7 días (Aviso)',
            shortLabel: '1-7 días',
            color: '#faad14',
            action: 'Email de cortesía'
        },
        {
            key: '8-15',
            label: '8-15 días (Crítico)',
            shortLabel: '8-15 días',
            color: '#ff9c6e',
            action: 'Aviso de Bloqueo'
        },
        {
            key: '>15',
            label: '>15 días (Corte)',
            shortLabel: '>15 días',
            color: '#ff4d4f',
            action: 'Suspensión de Servicio'
        }
    ];
    const getAgingBucketAmount = (bucketKey: string): number => {
        if (!debtData) return 0;

        return debtData.customerDebts.reduce((total, customer) => {
            return total + customer.invoices.reduce((customerTotal, invoice) => {
                if (bucketKey === 'current' && invoice.daysOverdue === 0) {
                    return customerTotal + invoice.remainingAmount;
                }
                if (bucketKey === '0-7' && invoice.daysOverdue >= 1 && invoice.daysOverdue <= 7) {
                    return customerTotal + invoice.remainingAmount;
                }
                if (bucketKey === '8-15' && invoice.daysOverdue >= 8 && invoice.daysOverdue <= 15) {
                    return customerTotal + invoice.remainingAmount;
                }
                if (bucketKey === '>15' && invoice.daysOverdue > 15) {
                    return customerTotal + invoice.remainingAmount;
                }
                return customerTotal;
            }, 0);
        }, 0);
    };

    const filteredCustomers = debtData?.customerDebts.filter(customer => {
        if (agingFilter === 'ALL') return true;

        const hasInvoicesInBucket = customer.invoices.some((invoice: InvoiceDebt) => {
            if (agingFilter === '0-30') return invoice.daysOverdue <= 30;
            if (agingFilter === '31-60') return invoice.daysOverdue > 30 && invoice.daysOverdue <= 60;
            if (agingFilter === '61-90') return invoice.daysOverdue > 60 && invoice.daysOverdue <= 90;
            if (agingFilter === '>90') return invoice.daysOverdue > 90;
            return true;
        });

        return hasInvoicesInBucket;
    }) || [];

    return (
        <div>
            {debtData && <HealthSemaphore />}

            {debtData && (
                <Row gutter={12} className="mb-4">
                    <Col span={8}>
                        <Card size="small" className="bg-slate-50/30">
                            <Statistic
                                title={<span className="flex items-center gap-2 text-[10px] uppercase tracking-tight font-medium text-slate-400"><DollarSign className="w-3 h-3" /> Deuda Total</span>}
                                value={debtData.totalDebt}
                                precision={2}
                                prefix="€"
                                styles={{ content: { color: '#ef4444', fontSize: '18px', fontWeight: 'bold' } }}
                            />
                        </Card>
                    </Col>
                    <Col span={8}>
                        <Card size="small" className="bg-slate-50/30">
                            <Statistic
                                title={<span className="flex items-center gap-2 text-[10px] uppercase tracking-tight font-medium text-slate-400"><AlertTriangle className="w-3 h-3" /> Vencida</span>}
                                value={debtData.totalOverdueDebt}
                                precision={2}
                                prefix="€"
                                styles={{ content: { color: debtData.totalOverdueDebt > 0 ? '#ef4444' : '#10b981', fontSize: '18px', fontWeight: 'bold' } }}
                            />
                        </Card>
                    </Col>
                    <Col span={8}>
                        <Card size="small" className="bg-slate-50/30">
                            <Statistic
                                title={<span className="flex items-center gap-2 text-[10px] uppercase tracking-tight font-medium text-slate-400"><Clock className="w-3 h-3" /> Corriente</span>}
                                value={debtData.totalCurrentDebt}
                                precision={2}
                                prefix="€"
                                styles={{ content: { color: '#3b82f6', fontSize: '18px', fontWeight: 'bold' } }}
                            />
                        </Card>
                    </Col>
                </Row>
            )}

            <Card
                size="small"
                title={<span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Distribución por Antigüedad</span>}
                className="mb-4 bg-slate-50/20"
            >
                {agingBuckets.map(bucket => {
                    const amount = getAgingBucketAmount(bucket.key);
                    const percentage = debtData?.totalDebt ? (amount / debtData.totalDebt) * 100 : 0;

                    if (amount === 0) return null; // Auto-colapso: Ocultar tramos sin deuda

                    return (
                        <div key={bucket.key} className="space-y-1">
                            <div className="flex justify-between text-xs font-semibold">
                                <span className="flex items-center gap-2">
                                    {bucket.label}
                                    <Tag color="blue" bordered={false} style={{ fontSize: '9px', lineHeight: '14px' }}>
                                        {bucket.action}
                                    </Tag>
                                </span>
                                <span>{formatCurrency(amount)}</span>
                            </div>
                            <Progress
                                percent={percentage}
                                size="small"
                                strokeColor={bucket.color}
                                showInfo={false}
                                className="mb-0"
                            />
                        </div>
                    );
                })}
            </Card>

            <Card
                size="small"
                title={<span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Deuda por Cliente</span>}
                extra={
                    <Space>
                        <Select
                            placeholder="Filtrar"
                            size="small"
                            value={agingFilter}
                            onChange={setAgingFilter}
                            style={{ width: 120 }}
                        >
                            <Select.Option value="ALL">Todos</Select.Option>
                            <Select.Option value="0-30">0-30 días</Select.Option>
                            <Select.Option value="31-60">31-60 días</Select.Option>
                            <Select.Option value="61-90">61-90 días</Select.Option>
                            <Select.Option value=">90">{'>90 días'}</Select.Option>
                        </Select>
                        <Button size="small" icon={<Download className="w-3 h-3" />}>Exportar</Button>
                        <Button size="small" icon={<Mail className="w-3 h-3" />}>Avisos</Button>
                    </Space>
                }
            >
                <Table
                    size="small"
                    columns={customerColumns}
                    dataSource={filteredCustomers}
                    rowKey="customerId"
                    loading={loading}
                    pagination={{
                        pageSize: 10,
                        size: 'small',
                        showSizeChanger: true,
                        showTotal: (total) => `${total} clientes`
                    }}
                />
            </Card>
        </div>
    );
};

export default DebtDashboardView;
