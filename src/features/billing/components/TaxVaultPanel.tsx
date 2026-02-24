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
import type { TaxVaultEntry } from '../../../types/invoicing';
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
        } catch (error: any) {
            message.error(`Error al cargar impuestos: ${error.message}`);
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
        } catch (error: any) {
            message.error(`Error al cerrar mes: ${error.message}`);
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
        } catch (error: any) {
            message.error(`Error al sincronizar: ${error.message}`);
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
        } catch (error: any) {
            message.error(`Error al solicitar desbloqueo: ${error.message}`);
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
            render: (period: string) => (
                <span className="font-mono">{period}</span>
            )
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
            render: (_: any, record: TaxVaultEntry) => {
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
            render: (_: any, record: TaxVaultEntry) => (
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
                <Row gutter={12}>
                    <Col span={8}>
                        <Statistic
                            title={<span className="text-[10px] uppercase tracking-tight font-medium text-slate-400">IVA Repercutido</span>}
                            value={totalStats.ivaRepercutido}
                            precision={2}
                            prefix="€"
                            styles={{ content: { color: '#10b981', fontSize: '16px', fontWeight: 'bold' } }}
                        />
                    </Col>
                    <Col span={8}>
                        <Statistic
                            title={<span className="text-[10px] uppercase tracking-tight font-medium text-slate-400">IVA Soportado</span>}
                            value={totalStats.ivaSoportado}
                            precision={2}
                            prefix="€"
                            styles={{ content: { color: '#ef4444', fontSize: '16px', fontWeight: 'bold' } }}
                        />
                    </Col>
                    <Col span={8}>
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
                    <Space>
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
                    </Space>
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
                    columns={columns}
                    dataSource={taxEntries}
                    rowKey="id"
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

export default TaxVaultPanel;
