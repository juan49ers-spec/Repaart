/**
 * Invoice Stats Cards Component
 *
 * Displays key metrics and statistics for invoicing:
 * - Total invoiced amount
 * - Pending payments
 * - Collection rate
 * - Overdue debts
 *
 * Features:
 * - Real-time stats calculation
 * - Period filtering (month, quarter, year)
 * - Visual indicators for trends
 * - Quick action buttons
 */

import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, Row, Col, Statistic } from 'antd';
import { formatStatistic } from '../../../utils/formatters';

interface Props {
    franchiseId: string;
    refreshTrigger?: number;
}

export const InvoiceStatsCards: React.FC<Props> = ({ franchiseId, refreshTrigger }) => {
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState({
        totalInvoiced: 0,
        pendingPayments: 0,
        paidInvoices: 0,
        overdueInvoices: 0,
        collectionRate: 0,
        averagePaymentDays: 0
    });

    useEffect(() => {
        fetchStats();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [franchiseId, refreshTrigger]);

    const fetchStats = async () => {
        try {
            setLoading(true);

            // Fetch the pre-aggregated billing document (O(1) reading!)
            const { db } = await import('../../../lib/firebase');
            const { doc, getDoc } = await import('firebase/firestore');

            const statsRef = doc(db, 'billing_stats', franchiseId);
            const statsSnap = await getDoc(statsRef);

            if (statsSnap.exists()) {
                const data = statsSnap.data();
                const totalInvoiced = data.totalInvoiced || 0;
                const outstandingRaw = data.totalOutstanding || 0;
                const pendingPayments = outstandingRaw > 0 ? outstandingRaw : 0;
                
                const collectionRate = totalInvoiced > 0
                    ? ((totalInvoiced - pendingPayments) / totalInvoiced) * 100
                    : 100;

                setStats({
                    totalInvoiced,
                    pendingPayments,
                    paidInvoices: data.paidInvoicesCount || 0,
                    overdueInvoices: data.overdueInvoicesCount || 0,
                    collectionRate,
                    averagePaymentDays: data.averagePaymentDays || 0 
                });
            } else {
                setStats({
                    totalInvoiced: 0,
                    pendingPayments: 0,
                    paidInvoices: 0,
                    overdueInvoices: 0,
                    collectionRate: 100,
                    averagePaymentDays: 0
                });
            }
        } catch (error) {
            console.error('[InvoiceStatsCards] Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8} lg={6}>
                <Card className="h-full hover:shadow-md transition-shadow">
                    <Statistic
                        title={
                            <span className="flex items-center gap-2 text-sm">
                                <DollarSign className="w-4 h-4 text-blue-500" />
                                Total Facturado
                            </span>
                        }
                        value={stats.totalInvoiced}
                        formatter={formatStatistic}
                        prefix="€"
                        styles={{ content: { color: '#1890ff' } }}
                        loading={loading}
                    />
                </Card>
            </Col>

            <Col xs={24} sm={12} md={8} lg={6}>
                <Card className="h-full hover:shadow-md transition-shadow">
                    <Statistic
                        title={
                            <span className="flex items-center gap-2 text-sm">
                                <Clock className="w-4 h-4 text-orange-500" />
                                Pendiente de Cobro
                            </span>
                        }
                        value={stats.pendingPayments}
                        formatter={formatStatistic}
                        prefix="€"
                        styles={{
                            content: { color: stats.pendingPayments > 0 ? '#faad14' : '#52c41a' }
                        }}
                        loading={loading}
                    />
                </Card>
            </Col>

            <Col xs={24} sm={12} md={8} lg={6}>
                <Card className="h-full hover:shadow-md transition-shadow">
                    <Statistic
                        title={
                            <span className="flex items-center gap-2 text-sm">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                Tasa de Cobro
                            </span>
                        }
                        value={stats.collectionRate}
                        precision={1}
                        suffix="%"
                        styles={{
                            content: { color: stats.collectionRate >= 80 ? '#52c41a' : '#faad14' }
                        }}
                        loading={loading}
                        prefix={
                            stats.collectionRate >= 80 ?
                                <TrendingUp className="w-4 h-4" /> :
                                <TrendingDown className="w-4 h-4" />
                        }
                    />
                </Card>
            </Col>

            <Col xs={24} sm={12} md={8} lg={6}>
                <Card className="h-full hover:shadow-md transition-shadow">
                    <Statistic
                        title={
                            <span className="flex items-center gap-2 text-sm">
                                <AlertCircle className="w-4 h-4 text-red-500" />
                                Facturas Vencidas
                            </span>
                        }
                        value={stats.overdueInvoices}
                        styles={{
                            content: { color: stats.overdueInvoices > 0 ? '#ff4d4f' : '#52c41a' }
                        }}
                        loading={loading}
                    />
                </Card>
            </Col>
        </Row>
    );
};

export default InvoiceStatsCards;
