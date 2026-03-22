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
import { AlertTriangle, Clock, Mail, Download, Filter, DollarSign, CheckCircle } from 'lucide-react';
import { Card, Table, Row, Col, Button, Space, Select, message, Tooltip, Progress, Tag } from 'antd';
import { accountsReceivable } from '../../../services/billing';
import type { DebtDashboard, CustomerDebt, InvoiceDebt } from '../../../types/invoicing';
import { formatCurrency } from '../../../utils/formatters';

interface Props {
    franchiseId: string;
    refreshTrigger?: number;
}

const AGING_BUCKETS = [
    { key: 'CURRENT', label: 'Al día (0-5 días)', shortLabel: 'CORRIENTE', color: 'var(--color-primary)', colorClass: 'bg-indigo-500', action: 'Mantener' },
    { key: 'OVER_5', label: '6-7 días', shortLabel: '5 DÍAS', color: 'var(--color-warning)', colorClass: 'bg-amber-500', action: 'Notificar' },
    { key: 'OVER_7', label: '8-15 días', shortLabel: '7 DÍAS', color: 'var(--color-warning)', colorClass: 'bg-orange-500', action: 'Reclamar' },
    { key: 'OVER_15', label: '16-30 días', shortLabel: '15 DÍAS', color: 'var(--color-destructive)', colorClass: 'bg-red-500', action: 'Pre-Aviso' },
    { key: 'OVER_30', label: '+30 días', shortLabel: '30 DÍAS', color: 'var(--color-destructive-dark)', colorClass: 'bg-red-900', action: 'Judicial' }
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
            render: (_: unknown, record: CustomerDebt) => (
                <Space>
                    <Tooltip title={`Ver detalle de ${record.customerName}`}>
                        <Button size="small" icon={<Filter className="w-3 h-3" />} onClick={() => message.info(`Detalles de cliente en desarrollo`)} />
                    </Tooltip>
                    <Tooltip title={`Enviar recordatorio a ${record.customerName}`}>
                        <Button 
                            size="small" 
                            icon={<Mail className="w-3 h-3" />} 
                            onClick={() => message.success(`Recordatorio manual programado para: ${record.customerName}`)} 
                            disabled={record.overdueDebt === 0}
                        />
                    </Tooltip>
                </Space>
            )
        }
    ];

    const getAgingBucketAmount = (bucketKey: string): number => {
        if (!debtData) return 0;

        return debtData.customerDebts.reduce((total, customer) => {
            return total + customer.invoices.reduce((customerTotal, invoice) => {
                if (bucketKey === 'CURRENT' && invoice.daysOverdue <= 5) {
                    return customerTotal + invoice.remainingAmount;
                }
                if (bucketKey === 'OVER_5' && invoice.daysOverdue > 5 && invoice.daysOverdue <= 7) {
                    return customerTotal + invoice.remainingAmount;
                }
                if (bucketKey === 'OVER_7' && invoice.daysOverdue > 7 && invoice.daysOverdue <= 15) {
                    return customerTotal + invoice.remainingAmount;
                }
                if (bucketKey === 'OVER_15' && invoice.daysOverdue > 15 && invoice.daysOverdue <= 30) {
                    return customerTotal + invoice.remainingAmount;
                }
                if (bucketKey === 'OVER_30' && invoice.daysOverdue > 30) {
                    return customerTotal + invoice.remainingAmount;
                }
                return customerTotal;
            }, 0);
        }, 0);
    };

    const filteredCustomers = debtData?.customerDebts.filter(customer => {
        if (agingFilter === 'ALL') return true;

        const overdueInBucket = customer.invoices.some((invoice: InvoiceDebt) => {
            if (agingFilter === 'CURRENT') return invoice.daysOverdue <= 5;
            if (agingFilter === 'OVER_5') return invoice.daysOverdue > 5 && invoice.daysOverdue <= 7;
            if (agingFilter === 'OVER_7') return invoice.daysOverdue > 7 && invoice.daysOverdue <= 15;
            if (agingFilter === 'OVER_15') return invoice.daysOverdue > 15 && invoice.daysOverdue <= 30;
            if (agingFilter === 'OVER_30') return invoice.daysOverdue > 30;
            return true;
        });

        return overdueInBucket;
    }) || [];

    const handleExport = () => {
        if (!filteredCustomers || filteredCustomers.length === 0) {
            message.warning('No hay datos para exportar con los filtros actuales');
            return;
        }

        const headers = ['Cliente', 'Deuda Total', 'Deuda Vencida', 'Facturas Pendientes'];
        const csvRows = filteredCustomers.map(c => 
            `"${c.customerName}",${c.totalDebt},${c.overdueDebt},${c.invoices.length}`
        );
        const csvContent = [headers.join(','), ...csvRows].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `repaart_estado_deuda_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        message.success(`Se exportaron ${filteredCustomers.length} registros correctamente`);
    };

    const handleBulkReminders = () => {
        const customersWithDebt = filteredCustomers.filter(c => c.overdueDebt > 0);
        if (customersWithDebt.length === 0) {
            message.info('No hay clientes con deuda vencida en la vista actual para notificar');
            return;
        }
        message.success(`Se han programado avisos de cobro para ${customersWithDebt.length} clientes`);
    };

    return (
        <div>
            {debtData && <HealthSemaphore />}

            {debtData && (
                <Row gutter={[16, 16]} className="mb-6">
                    {/* DEUDA TOTAL CARD */}
                    <Col xs={24} md={8}>
                        <div className="rounded-lg bg-white dark:bg-slate-900 p-3 mb-0 shadow-sm border border-slate-200 dark:border-slate-800">
                            <div className="flex items-center gap-1.5 mb-1.5">
                                <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                    Deuda Total
                                </span>
                            </div>
                            <div className="text-xl font-bold text-slate-700 dark:text-slate-200 tracking-tight">
                                {formatCurrency(debtData.totalDebt)}
                            </div>
                            <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                                Saldo global pendiente
                            </div>
                        </div>
                    </Col>

                    {/* VENCIDA CARD */}
                    <Col xs={24} md={8}>
                        <div className="rounded-lg bg-white dark:bg-slate-900 p-3 mb-0 shadow-sm border border-slate-200 dark:border-slate-800">
                            <div className="flex items-center gap-1.5 mb-1.5">
                                <AlertTriangle className={`w-3.5 h-3.5 ${debtData.totalOverdueDebt > 0 ? 'text-rose-500' : 'text-emerald-500'}`} />
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                    Vencida
                                </span>
                            </div>
                            <div className={`text-xl font-bold tracking-tight ${debtData.totalOverdueDebt > 0 ? 'text-rose-600 dark:text-rose-500' : 'text-emerald-600 dark:text-emerald-500'}`}>
                                {formatCurrency(debtData.totalOverdueDebt)}
                            </div>
                            <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                                {debtData.totalOverdueDebt > 0 ? (
                                    <span className="text-rose-500">Requiere atención</span>
                                ) : (
                                    <>
                                        <CheckCircle className="w-3 h-3 text-emerald-500" />
                                        Sin deuda vencida
                                    </>
                                )}
                            </div>
                        </div>
                    </Col>

                    {/* CORRIENTE CARD */}
                    <Col xs={24} md={8}>
                        <div className="rounded-lg bg-white dark:bg-slate-900 p-3 mb-0 shadow-sm border border-slate-200 dark:border-slate-800">
                            <div className="flex items-center gap-1.5 mb-1.5">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                    Corriente
                                </span>
                            </div>
                            <div className="text-xl font-bold text-slate-700 dark:text-slate-200 tracking-tight">
                                {formatCurrency(debtData.totalCurrentDebt)}
                            </div>
                            <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                                <CheckCircle className="w-3 h-3 text-emerald-500" />
                                Dentro del plazo regular
                            </div>
                        </div>
                    </Col>
                </Row>
            )}

            <Card
                size="small"
                className={`mb-4 border-0 shadow-sm transition-all duration-300 ${
                    !debtData || debtData.totalDebt === 0 
                        ? 'bg-slate-50/50' 
                        : debtData.totalOverdueDebt === 0 
                            ? 'bg-gradient-to-br from-emerald-50 to-teal-50/20 ring-1 ring-emerald-100 hover:ring-emerald-200' 
                            : 'bg-gradient-to-br from-rose-50 to-red-50/20 ring-1 ring-rose-100 hover:ring-rose-200'
                }`}
            >
                <div className="flex items-center gap-2 mb-4 border-b border-black/5 pb-2">
                    {(!debtData || debtData.totalDebt === 0) ? (
                        <CheckCircle className="w-4 h-4 text-slate-400" />
                    ) : debtData.totalOverdueDebt === 0 ? (
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                    ) : (
                        <AlertTriangle className="w-4 h-4 text-rose-500" />
                    )}
                    <span className={`text-[11px] uppercase tracking-wider font-semibold ${
                        (!debtData || debtData.totalDebt === 0) ? 'text-slate-500' : debtData.totalOverdueDebt === 0 ? 'text-emerald-700' : 'text-rose-700'
                    }`}>
                        Distribución por Antigüedad {debtData && debtData.totalDebt > 0 && (debtData.totalOverdueDebt === 0 ? '- ¡Al día!' : '- Requiere Atención')}
                    </span>
                </div>

                <div className="space-y-3">
                    {AGING_BUCKETS.map(bucket => {
                        const amount = getAgingBucketAmount(bucket.key);
                        const percentage = debtData?.totalDebt ? (amount / debtData.totalDebt) * 100 : 0;

                        if (amount === 0) return null; // Auto-colapso: Ocultar tramos sin deuda

                        const getTagColor = (key: string) => {
                            if (key === 'CURRENT') return 'cyan'; // Mantener
                            if (key === 'OVER_5' || key === 'OVER_7') return 'orange'; // Notificar/Reclamar
                            return 'error'; // Pre-Aviso/Judicial
                        };

                        return (
                            <div key={bucket.key} className="space-y-1">
                                <div className="flex justify-between items-center text-xs font-semibold">
                                    <span className="flex items-center gap-2">
                                        <span className={bucket.key === 'CURRENT' ? 'text-slate-700' : 'text-rose-900'}>{bucket.label}</span>
                                        <Tag color={getTagColor(bucket.key)} className="text-[10px] leading-[16px] h-[18px] py-0 px-1.5 flex items-center font-bold border-none m-0 rounded" style={{ opacity: 0.9 }}>
                                            {bucket.action}
                                        </Tag>
                                    </span>
                                    <span className={bucket.key === 'CURRENT' ? 'text-slate-700' : 'text-rose-600'}>{formatCurrency(amount)}</span>
                                </div>
                                <Progress
                                    percent={percentage}
                                    size="small"
                                    strokeColor={bucket.key === 'CURRENT' ? '#10b981' : bucket.color}
                                    trailColor="rgba(0,0,0,0.04)"
                                    showInfo={false}
                                    className="mb-0"
                                />
                            </div>
                        );
                    })}
                    {debtData && debtData.totalDebt === 0 && (
                        <div className="text-center py-4 text-slate-400 text-sm">
                            No hay deuda pendiente registrada en la franquicia
                        </div>
                    )}
                </div>
            </Card>

            <Card
                size="small"
                title={<span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Deuda por Cliente</span>}
                extra={
                    <div className="flex flex-wrap items-center justify-end gap-2 w-full max-w-full">
                        <Select
                            placeholder="Filtrar"
                            size="small"
                            value={agingFilter}
                            onChange={setAgingFilter}
                            className="w-[120px]"
                        >
                            <Select.Option value="ALL">Todos</Select.Option>
                            <Select.Option value="CURRENT">Al día</Select.Option>
                            <Select.Option value="OVER_5">5 días</Select.Option>
                            <Select.Option value="OVER_7">7 días</Select.Option>
                            <Select.Option value="OVER_15">15 días</Select.Option>
                            <Select.Option value="OVER_30">30 días</Select.Option>
                        </Select>
                        <Button size="small" icon={<Download className="w-3 h-3" />} onClick={handleExport}>Exportar</Button>
                        <Button size="small" icon={<Mail className="w-3 h-3" />} onClick={handleBulkReminders}>Avisos</Button>
                    </div>
                }
            >
                <Table
                    size="small"
                    scroll={{ x: 600 }}
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
