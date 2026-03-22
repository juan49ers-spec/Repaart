/**
 * Tax Vault Panel Component
 *
 * Panel for managing monthly tax closing:
 * - Tax aggregation (IVA, IRPF)
 * - Monthly closing wizard
 * - Period locking
 * - Export to tax formats
 *
 * Features:
 * - Monthly tax summaries
 * - Closing status indicators
 * - Period lock/unlock
 * - Excel export for accounting
 */

import React, { useState, useEffect } from 'react';
import { Lock, Unlock, Download, RefreshCw } from 'lucide-react';
import { Card, Table, Button, Space, Alert, Row, Col, Statistic, Tag, Modal, message, DatePicker, Tooltip } from 'antd';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { monthlyCloseWizard } from '../../../services/billing';
import type { TaxVaultEntry, Invoice } from '../../../types/invoicing';
import { formatCurrency } from '../../../utils/formatters';
import dayjs from 'dayjs';

interface Props {
    franchiseId: string;
    refreshTrigger?: number;
}

export const TaxVaultPanel: React.FC<Props> = ({ franchiseId, refreshTrigger }) => {
    const [loading, setLoading] = useState(false);
    const [taxEntries, setTaxEntries] = useState<TaxVaultEntry[]>([]);
    const [closingModalOpen, setClosingModalOpen] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState<string>(dayjs().format('YYYY-MM'));

    useEffect(() => {
        fetchTaxEntries();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [franchiseId, refreshTrigger]);

    const fetchTaxEntries = async () => {
        try {
            setLoading(true);

            // Query all tax vault entries for this franchise
            const q = query(
                collection(db, 'tax_vault'),
                where('franchiseId', '==', franchiseId),
                orderBy('period', 'desc')
            );

            const querySnapshot = await getDocs(q);
            const entries = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as TaxVaultEntry));

            setTaxEntries(entries);
        } catch (error: unknown) {
            message.error(`Error al cargar impuestos: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleCloseMonth = async () => {
        try {
            setLoading(true);

            const request = {
                franchiseId,
                period: selectedPeriod,
                requestedBy: 'current_user'
            };

            const result = await monthlyCloseWizard.executeMonthlyClose(request);

            if (result.success) {
                message.success(`Periodo ${selectedPeriod} cerrado correctamente`);
                setClosingModalOpen(false);
                fetchTaxEntries();
            } else {
                message.error(`Error: ${result.error.type}`);
            }
        } catch (error: unknown) {
            message.error(`Error al cerrar mes: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleSyncPeriod = async (period: string) => {
        try {
            setLoading(true);
            const result = await monthlyCloseWizard.recalculateMonthData(franchiseId, period);

            if (result.success) {
                message.success(`Periodo ${period} sincronizado correctamente`);
                // Refresh local data to reflect changes
                await fetchTaxEntries();
            } else {
                message.error(`Error al sincronizar: ${result.error.type}`);
            }
        } catch (error: unknown) {
            message.error(`Error al sincronizar: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleRequestUnlock = async () => {
        try {
            setLoading(true);

            const result = await monthlyCloseWizard.requestMonthUnlock(
                franchiseId,
                selectedPeriod,
                'current_user',
                'Necesidad de realizar ajustes'
            );

            if (result.success) {
                message.success('Solicitud de desbloqueo enviada');
                setClosingModalOpen(false);
            } else {
                message.error(`Error: ${result.error.type}`);
            }
        } catch (error: unknown) {
            message.error(`Error al solicitar desbloqueo: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        } finally {
            setLoading(false);
        }
    };

    const exportToExcel = () => {
        message.info('Exportación a Excel próximamente');
    };

    const columns = [
        {
            title: 'Periodo',
            dataIndex: 'period',
            key: 'period',
            render: (period: string) => {
                const month = parseInt(period.split('-')[1] || '1', 10);
                const trimester = Math.ceil(month / 3);
                return (
                    <div className="flex flex-col">
                        <span className="font-mono text-[13px]">{period}</span>
                        <span className="text-[10px] uppercase text-slate-500 font-semibold">{trimester}º Trimestre</span>
                    </div>
                );
            }
        },
        {
            title: 'Estado',
            dataIndex: 'isLocked',
            key: 'isLocked',
            render: (isLocked: boolean) => (
                <Tag
                    color={isLocked ? 'success' : 'warning'}
                    icon={isLocked ? <Lock className="w-2.5 h-2.5" /> : <Unlock className="w-2.5 h-2.5" />}
                    style={{ fontSize: '10px', padding: '0 4px', lineHeight: '16px' }}
                >
                    {isLocked ? 'Bloqueado' : 'Abierto'}
                </Tag>
            )
        },
        {
            title: 'IVA Repercutido',
            dataIndex: 'ivaRepercutido',
            key: 'ivaRepercutido',
            render: (amount: number) => (
                <span className="text-blue-600 font-semibold text-[13px]">{formatCurrency(amount)}</span>
            )
        },
        {
            title: 'IVA Soportado',
            dataIndex: 'ivaSoportado',
            key: 'ivaSoportado',
            render: (amount: number) => (
                <span className="text-red-600">{formatCurrency(amount)}</span>
            )
        },
        {
            title: 'IRPF Reserva',
            dataIndex: 'irpfReserva',
            key: 'irpfReserva',
            render: (amount: number) => (
                <span className="text-orange-600">{formatCurrency(amount)}</span>
            )
        },
        {
            title: 'Total IVA',
            key: 'totalIva',
            render: (_: unknown, record: TaxVaultEntry) => {
                const total = record.ivaRepercutido - record.ivaSoportado;
                return (
                    <span className={`font-bold ${total >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(total)}
                    </span>
                );
            }
        },
        {
            title: 'Acciones',
            key: 'actions',
            render: (_: unknown, record: TaxVaultEntry) => (
                <Space>
                    {!record.isLocked && (
                        <Tooltip title="Recalcular datos del periodo (corrige discrepancias)">
                            <Button
                                size="small"
                                icon={<RefreshCw className="w-3 h-3" />}
                                onClick={() => handleSyncPeriod(record.period)}
                                loading={loading}
                            >
                                Sincronizar
                            </Button>
                        </Tooltip>
                    )}
                    <Button
                        size="small"
                        icon={<Download className="w-3 h-3" />}
                        onClick={() => message.info('Exportar periodo')}
                    >
                        Exportar
                    </Button>
                </Space>
            )
        }
    ];

    const totalStats = taxEntries.reduce((acc, entry) => {
        return {
            ivaRepercutido: acc.ivaRepercutido + entry.ivaRepercutido,
            ivaSoportado: acc.ivaSoportado + entry.ivaSoportado,
            irpfReserva: acc.irpfReserva + entry.irpfReserva
        };
    }, { ivaRepercutido: 0, ivaSoportado: 0, irpfReserva: 0 });

    return (
        <div>
            <Card
                size="small"
                title={
                    <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Resumen de Impuestos (Total)</span>
                }
                className="mb-4 bg-slate-50/20"
            >
                <Row gutter={[12, 12]}>
                    <Col xs={24} md={8}>
                        <Statistic
                            title={<span className="text-[10px] uppercase tracking-tight font-medium text-slate-400">IVA Repercutido</span>}
                            value={totalStats.ivaRepercutido}
                            precision={2}
                            prefix="€"
                            styles={{ content: { color: '#10b981', fontSize: '16px', fontWeight: 'bold' } }}
                        />
                    </Col>
                    <Col xs={24} md={8}>
                        <Statistic
                            title={<span className="text-[10px] uppercase tracking-tight font-medium text-slate-400">IVA Soportado</span>}
                            value={totalStats.ivaSoportado}
                            precision={2}
                            prefix="€"
                            styles={{ content: { color: '#ef4444', fontSize: '16px', fontWeight: 'bold' } }}
                        />
                    </Col>
                    <Col xs={24} md={8}>
                        <Statistic
                            title={<span className="text-[10px] uppercase tracking-tight font-medium text-slate-400">IVA Neto</span>}
                            value={totalStats.ivaRepercutido - totalStats.ivaSoportado}
                            precision={2}
                            prefix="€"
                            styles={{
                                content: {
                                    fontSize: '16px',
                                    fontWeight: 'bold',
                                    color: (totalStats.ivaRepercutido - totalStats.ivaSoportado) >= 0 ? '#10b981' : '#ef4444'
                                }
                            }}
                        />
                    </Col>
                </Row>
            </Card>

            <Card
                size="small"
                title={<span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Tax Vault - Agregación de Impuestos</span>}
                extra={
                    <div className="flex flex-wrap items-center justify-end gap-2 w-full max-w-full">
                        <DatePicker.MonthPicker
                            size="small"
                            placeholder="Periodo"
                            value={dayjs(selectedPeriod, 'YYYY-MM')}
                            onChange={(date) => setSelectedPeriod(date?.format('YYYY-MM') || '')}
                        />
                        <Button
                            size="small"
                            type="primary"
                            icon={<Lock className="w-3 h-3" />}
                            onClick={() => setClosingModalOpen(true)}
                        >
                            Cerrar Mes
                        </Button>
                        <Button
                            size="small"
                            icon={<Download className="w-3 h-3" />}
                            onClick={exportToExcel}
                        >
                            Exportar
                        </Button>
                    </div>
                }
            >
                <Alert
                    title="Tax Vault"
                    description="Los impuestos se agregan automáticamente cuando se emiten facturas. Cierra el mes al finalizar cada periodo para bloquearlo y evitar modificaciones."
                    type="info"
                    showIcon
                    className="mb-4"
                />

                <Table
                    size="small"
                    scroll={{ x: 600 }}
                    columns={columns}
                    dataSource={taxEntries}
                    rowKey="id"
                    expandable={{
                        expandedRowRender: record => <TaxVaultInvoiceDetail invoiceIds={record.invoiceIds} />
                    }}
                    loading={loading}
                    pagination={{
                        pageSize: 10,
                        size: 'small',
                        showSizeChanger: true
                    }}
                    summary={(pageData) => {
                        const totalIva = pageData.reduce((sum, item) =>
                            sum + (item.ivaRepercutido - item.ivaSoportado), 0
                        );
                        return (
                            <Table.Summary>
                                <Table.Summary.Row className="bg-slate-50/50">
                                    <Table.Summary.Cell index={0} colSpan={5}>
                                        <span className="text-[11px] uppercase tracking-tight font-medium text-slate-400">Total Mostrado</span>
                                    </Table.Summary.Cell>
                                    <Table.Summary.Cell index={1}>
                                        <span className={`font-bold text-[13px] ${totalIva >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {formatCurrency(totalIva)}
                                        </span>
                                    </Table.Summary.Cell>
                                </Table.Summary.Row>
                            </Table.Summary>
                        );
                    }}
                />
            </Card>

            <Modal
                title={
                    <span className="flex items-center gap-2">
                        <Lock className="w-5 h-5" />
                        Cierre de Periodo
                    </span>
                }
                open={closingModalOpen}
                onCancel={() => setClosingModalOpen(false)}
                destroyOnHidden
                footer={[
                    <Button key="cancel" onClick={() => setClosingModalOpen(false)}>
                        Cancelar
                    </Button>,
                    <Button
                        key="unlock"
                        onClick={handleRequestUnlock}
                    >
                        Solicitar Desbloqueo
                    </Button>,
                    <Button
                        key="close"
                        type="primary"
                        danger
                        icon={<Lock />}
                        onClick={handleCloseMonth}
                    >
                        Cerrar Periodo
                    </Button>
                ]}
            >
                <Alert
                    title="Cierre Mensual"
                    description={
                        <div>
                            <p className="mb-2">
                                Vas a cerrar el periodo <strong>{selectedPeriod}</strong>.
                            </p>
                            <ul className="mb-0 ml-4">
                                <li>Todas las facturas del periodo quedarán bloqueadas</li>
                                <li>No se podrán crear ni modificar facturas de este periodo</li>
                                <li>Se generará el reporte fiscal del mes</li>
                                <li>Esta acción requiere permisos de administrador</li>
                            </ul>
                        </div>
                    }
                    type="warning"
                    showIcon
                />
            </Modal>
        </div>
    );
};

const TaxVaultInvoiceDetail: React.FC<{ invoiceIds: string[] }> = ({ invoiceIds }) => {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!invoiceIds || invoiceIds.length === 0) return;
        fetchInvoices();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [invoiceIds]);

    const fetchInvoices = async () => {
        try {
            setLoading(true);
            const chunks = [];
            for (let i = 0; i < invoiceIds.length; i += 10) {
                chunks.push(invoiceIds.slice(i, i + 10));
            }

            const promises = chunks.map(chunk => {
                const q = query(
                    collection(db, 'invoices'),
                    where('__name__', 'in', chunk)
                );
                return getDocs(q);
            });

            const snapshots = await Promise.all(promises);
            const loadedInvoices = snapshots.flatMap(snap =>
                snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invoice))
            );

            // Sort by issue date descending
            loadedInvoices.sort((a, b) => {
                const dateA = a.issueDate instanceof Date ? a.issueDate : new Date((a.issueDate as unknown as { seconds: number }).seconds * 1000);
                const dateB = b.issueDate instanceof Date ? b.issueDate : new Date((b.issueDate as unknown as { seconds: number }).seconds * 1000);
                return dateB.getTime() - dateA.getTime();
            });

            setInvoices(loadedInvoices);
        } catch (error: unknown) {
            console.error('Error fetching invoices details:', error);
            message.error('Error al cargar detalle de facturas.');
        } finally {
            setLoading(false);
        }
    };

    const detailColumns = [
        {
            title: 'Número',
            dataIndex: 'fullNumber',
            key: 'fullNumber',
            render: (text: string) => <span className="font-mono text-xs font-semibold text-slate-700">{text}</span>
        },
        {
            title: 'Fecha Emisión',
            key: 'issueDate',
            render: (_: unknown, record: Invoice) => {
                const date = record.issueDate instanceof Date ? record.issueDate : new Date((record.issueDate as unknown as { seconds: number }).seconds * 1000);
                return <span className="text-slate-500">{dayjs(date).format('DD/MM/YYYY')}</span>;
            }
        },
        {
            title: 'Cliente',
            key: 'customer',
            render: (_: unknown, record: Invoice) => (
                <span className="truncate max-w-[150px] block" title={record.customerSnapshot?.fiscalName}>
                    {record.customerSnapshot?.fiscalName || 'Desconocido'}
                </span>
            )
        },
        {
            title: 'Base Imponible',
            dataIndex: 'subtotal',
            key: 'subtotal',
            align: 'right' as const,
            render: (val: number) => <span className="text-slate-600">{formatCurrency(val)}</span>
        },
        {
            title: 'IVA %',
            key: 'taxRate',
            align: 'right' as const,
            render: (_: unknown, record: Invoice) => {
                if (!record.taxBreakdown || record.taxBreakdown.length === 0) return <span className="text-slate-400">0%</span>;
                return <span className="text-slate-500">{record.taxBreakdown.map(tb => `${tb.taxRate * 100}%`).join(', ')}</span>;
            }
        },
        {
            title: 'IVA Repercutido',
            key: 'taxAmount',
            align: 'right' as const,
            render: (_: unknown, record: Invoice) => {
                const totalTax = record.taxBreakdown?.reduce((sum, tb) => sum + tb.taxAmount, 0) || 0;
                return <span className="text-blue-600 font-medium">{formatCurrency(totalTax)}</span>;
            }
        },
        {
            title: 'Total',
            dataIndex: 'total',
            key: 'total',
            align: 'right' as const,
            render: (val: number) => <span className="font-bold text-slate-800">{formatCurrency(val)}</span>
        }
    ];

    if (!invoiceIds || invoiceIds.length === 0) {
        return <div className="p-4 text-center text-slate-500 text-sm">No hay facturas asociadas a este periodo.</div>;
    }

    return (
        <div className="bg-slate-50 p-4 border-y border-slate-200 shadow-inner">
            <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">Detalle de Facturas Emitidas ({invoices.length})</h4>
            <Table
                columns={detailColumns}
                dataSource={invoices}
                rowKey="id"
                pagination={false}
                size="small"
                loading={loading}
                className="shadow-sm border border-slate-200 rounded-md overflow-hidden bg-white"
                summary={pageData => {
                    const totalBase = pageData.reduce((sum, inv) => sum + (inv.subtotal || 0), 0);
                    const totalIva = pageData.reduce((sum, inv) => sum + (inv.taxBreakdown?.reduce((t, tb) => t + tb.taxAmount, 0) || 0), 0);
                    const totalAmount = pageData.reduce((sum, inv) => sum + (inv.total || 0), 0);

                    return (
                        <Table.Summary>
                            <Table.Summary.Row className="bg-slate-50 border-t border-slate-200">
                                <Table.Summary.Cell index={0} colSpan={3} align="right">
                                    <span className="text-xs uppercase tracking-tight font-bold text-slate-600">Total Desglose</span>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={1} align="right">
                                    <span className="font-semibold text-slate-700">{formatCurrency(totalBase)}</span>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={2} />
                                <Table.Summary.Cell index={3} align="right">
                                    <span className="font-bold text-blue-600">{formatCurrency(totalIva)}</span>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={4} align="right">
                                    <span className="font-bold text-slate-900">{formatCurrency(totalAmount)}</span>
                                </Table.Summary.Cell>
                            </Table.Summary.Row>
                        </Table.Summary>
                    );
                }}
            />
        </div>
    );
};

export default TaxVaultPanel;
