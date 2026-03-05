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

const AGING_BUCKETS = [
    { key: 'CURRENT', label: 'Al día', shortLabel: 'CORRIENTE', color: 'var(--color-primary)', colorClass: 'bg-indigo-500', action: 'Mantener' },
    { key: '1_30', label: '1-30 días', shortLabel: '1-30D', color: 'var(--color-warning)', colorClass: 'bg-amber-500', action: 'Notificar' },
    { key: '31_60', label: '31-60 días', shortLabel: '31-60D', color: 'var(--color-warning-dark)', colorClass: 'bg-orange-500', action: 'Reclamar' },
    { key: '61_90', label: '61-90 días', shortLabel: '61-90D', color: 'var(--color-destructive)', colorClass: 'bg-red-500', action: 'Pre-Aviso' },
    { key: 'OVER_90', label: '+90 días', shortLabel: '+90D', color: 'var(--color-destructive-dark)', colorClass: 'bg-red-900', action: 'Judicial' }
];

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
                    {AGING_BUCKETS.map(bucket => {
                        const amount = getAgingBucketAmount(bucket.key);
                        const hasDebt = amount > 0;
                        return (
                            <div key={bucket.key} className="flex items-center gap-1.5">
                                <div
                                    className={`w-2 h-2 rounded-full shadow-sm flex-shrink-0 ${bucket.colorClass || 'bg-slate-300'}`}
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
        } catch (error: unknown) {
            const err = error as Error;
            message.error(`Error al cargar dashboard: ${err.message}`);
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
                            <Tag color="cyan" className="text-[9px] w-fit px-1 h-[14px] leading-[14px] flex items-center border-none">
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
            render: (_: unknown, record: CustomerDebt) => {
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
                            railColor="#f0f0f0"
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

    const getAgingBucketAmount = (bucketKey: string): number => {
        if (!debtData) return 0;

        return debtData.customerDebts.reduce((total, customer) => {
            return total + customer.invoices.reduce((customerTotal, invoice) => {
                if (bucketKey === 'CURRENT' && invoice.daysOverdue === 0) {
                    return customerTotal + invoice.remainingAmount;
                }
                if (bucketKey === '1_30' && invoice.daysOverdue >= 1 && invoice.daysOverdue <= 30) {
                    return customerTotal + invoice.remainingAmount;
                }
                if (bucketKey === '31_60' && invoice.daysOverdue >= 31 && invoice.daysOverdue <= 60) {
                    return customerTotal + invoice.remainingAmount;
                }
                if (bucketKey === '61_90' && invoice.daysOverdue >= 61 && invoice.daysOverdue <= 90) {
                    return customerTotal + invoice.remainingAmount;
                }
                if (bucketKey === 'OVER_90' && invoice.daysOverdue > 90) {
                    return customerTotal + invoice.remainingAmount;
                }
                return customerTotal;
            }, 0);
        }, 0);
    };

    const filteredCustomers = debtData?.customerDebts.filter(customer => {
        if (agingFilter === 'ALL') return true;

        const overdueInBucket = customer.invoices.some((invoice: InvoiceDebt) => {
            if (agingFilter === 'CURRENT') return invoice.daysOverdue === 0;
            if (agingFilter === '1_30') return invoice.daysOverdue >= 1 && invoice.daysOverdue <= 30;
            if (agingFilter === '31_60') return invoice.daysOverdue >= 31 && invoice.daysOverdue <= 60;
            if (agingFilter === '61_90') return invoice.daysOverdue >= 61 && invoice.daysOverdue <= 90;
            if (agingFilter === 'OVER_90') return invoice.daysOverdue > 90;
            return true;
        });

        return overdueInBucket;
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
                                styles={{ content: { color: 'var(--color-destructive)', fontSize: '18px', fontWeight: 'bold' } }}
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
                                styles={{
                                    content: {
                                        color: debtData.totalOverdueDebt > 0 ? 'var(--color-destructive)' : 'var(--color-success)',
                                        fontSize: '18px',
                                        fontWeight: 'bold'
                                    }
                                }}
                            />
                        </Card>
                    </Col>
                    <Col span={8}>
                        <Card size="small" className="bg-slate-50/30">
                            <Statistic
                                title={<span className="flex items-center gap-2 text-[10px] uppercase tracking-tight font-medium text-slate-400"><Clock className="w-3 h-3" /> Corriente</span>}
                                value={debtData.totalCurrentDebt}
                                precision={2}
                                suffix="€"
                                styles={{ content: { fontSize: '14px', fontWeight: '800', fontFamily: 'Outfit, sans-serif' } }}
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
                {AGING_BUCKETS.map(bucket => {
                    const amount = getAgingBucketAmount(bucket.key);
                    const percentage = debtData?.totalDebt ? (amount / debtData.totalDebt) * 100 : 0;

                    if (amount === 0) return null; // Auto-colapso: Ocultar tramos sin deuda

                    return (
                        <div key={bucket.key} className="space-y-1">
                            <div className="flex justify-between text-xs font-semibold">
                                <span className="flex items-center gap-2">
                                    {bucket.label}
                                    <Tag color="blue" variant="filled" className="text-[9px] leading-[14px] h-[14px] py-0 px-1 flex items-center">
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
                            className="w-[120px]"
                        >
                            <Select.Option value="ALL">Todos</Select.Option>
                            <Select.Option value="CURRENT">Al día</Select.Option>
                            <Select.Option value="1_30">1-30 días</Select.Option>
                            <Select.Option value="31_60">31-60 días</Select.Option>
                            <Select.Option value="61_90">61-90 días</Select.Option>
                            <Select.Option value="OVER_90">{'+90 días'}</Select.Option>
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
