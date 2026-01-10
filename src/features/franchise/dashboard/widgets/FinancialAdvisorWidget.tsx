import { useState, type FC, type CSSProperties } from 'react';
// FIX: Individual imports to enable tree-shaking (Ant Design barrel import prevents it)
import Card from 'antd/es/card';
import Button from 'antd/es/button';
import Drawer from 'antd/es/drawer';
import List from 'antd/es/list';
import Tag from 'antd/es/tag';
import Typography from 'antd/es/typography';
import Statistic from 'antd/es/statistic';
import Row from 'antd/es/row';
import Col from 'antd/es/col';
import Progress from 'antd/es/progress';
import Timeline from 'antd/es/timeline';
import Alert from 'antd/es/alert';
import Divider from 'antd/es/divider';

import {
    MedicineBoxOutlined,
    ExclamationCircleFilled,
    RightOutlined,
    ArrowUpOutlined,
    DashboardOutlined,
    SafetyCertificateFilled
} from '@ant-design/icons';
import { formatCurrency } from '../../../../lib/finance';

const { Title, Text, Paragraph } = Typography;

type AlertSeverity = 'critical' | 'warning';
type AlertType = 'PROFIT' | 'COSTS';

interface BreakdownItem {
    label: string;
    value: number;
    percentage: number;
}

interface AlertAction {
    title: string;
    desc: string;
}

interface AlertDetails {
    impact: string;
    diagnosis: string;
    actions: AlertAction[];
    breakdown?: BreakdownItem[];
}

interface FinancialAlert {
    title: string;
    description: string;
    severity: AlertSeverity;
    value: string;
    target: string;
    type: AlertType;
    details: AlertDetails;
}

interface AnalysisData {
    alerts: FinancialAlert[];
}

interface FinancialAdvisorWidgetProps {
    analysisData: AnalysisData | null;
}

interface DrawerState {
    open: boolean;
    insight: FinancialAlert | null;
}

// Sub-componente para el estado vacío (Clean Code)
const HealthyState: FC = () => (
    <div style={{ textAlign: 'center', padding: '32px 0', color: '#52c41a' } as CSSProperties}>
        <SafetyCertificateFilled style={{ fontSize: '48px', marginBottom: 16 }} />
        <Title level={4} style={{ color: '#389e0d', marginTop: 0 }}>Finanzas Saludables</Title>
        <Text type="secondary">Tus márgenes y estructura de costos están dentro de los objetivos óptimos.</Text>
    </div>
);

interface SeverityBadgeProps {
    level: AlertSeverity;
}

const SeverityBadge: FC<SeverityBadgeProps> = ({ level }) => {
    const config = level === 'critical'
        ? { color: '#f5222d', text: 'CRÍTICO' }
        : { color: '#fa8c16', text: 'ATENCIÓN' };
    return <Tag color={config.color} style={{ fontWeight: 600 }}>{config.text}</Tag>;
};

const FinancialAdvisorWidget: FC<FinancialAdvisorWidgetProps> = ({ analysisData }) => {
    const [drawerData, setDrawerData] = useState<DrawerState>({ open: false, insight: null });

    // Accedemos a los datos procesados por el hook
    const { alerts } = analysisData || { alerts: [] };

    const handleOpen = (insight: FinancialAlert): void => setDrawerData({ open: true, insight });
    const handleClose = (): void => setDrawerData({ open: false, insight: null });

    return (
        <>
            <Card
                title={<><MedicineBoxOutlined /> Diagnóstico Financiero</>}
                bordered={false}
                className="advisor-widget"
                style={{ height: '100%', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}
            >
                {(!alerts || alerts.length === 0) ? <HealthyState /> : (
                    <List
                        itemLayout="vertical"
                        dataSource={alerts}
                        renderItem={(item: FinancialAlert) => (
                            <List.Item
                                style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}
                                actions={[
                                    <Button key="action-plan" type="link" onClick={() => handleOpen(item)} style={{ paddingLeft: 0 }}>
                                        Ver Plan de Acción <RightOutlined />
                                    </Button>
                                ]}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <Text strong style={{ fontSize: 16 }}>{item.title}</Text>
                                    <SeverityBadge level={item.severity} />
                                </div>
                                <Text type="secondary">{item.description}</Text>

                                {/* Micro-visualización en la lista */}
                                <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <Text type="secondary" style={{ fontSize: 12 }}>Actual: <strong style={{ color: '#262626' }}>{item.value}</strong></Text>
                                    <Progress
                                        percent={item.type === 'PROFIT' ? parseFloat(item.value) * 3 : 70} // Visual fake scale for effect
                                        status={item.severity === 'critical' ? 'exception' : 'normal'}
                                        showInfo={false}
                                        size="small"
                                        style={{ width: 100, margin: 0 }}
                                    />
                                </div>
                            </List.Item>
                        )}
                    />
                )}
            </Card>

            {/* DRAWER EJECUTIVO */}
            <Drawer
                title="Informe de Inteligencia"
                placement="right"
                width={520}
                onClose={handleClose}
                open={drawerData.open}
                styles={{ header: { borderBottom: '1px solid #f0f0f0' } }}
            >
                {drawerData.insight && (
                    <div className="insight-detail">
                        {/* 1. Header de Impacto */}
                        <Alert
                            message="Impacto Directo en Utilidad"
                            description={drawerData.insight.details.impact}
                            type={drawerData.insight.severity === 'critical' ? 'error' : 'warning'}
                            showIcon
                            icon={<ExclamationCircleFilled />}
                            style={{ marginBottom: 24, border: 'none', background: drawerData.insight.severity === 'critical' ? '#fff1f0' : '#fffbe6' }}
                        />

                        {/* 2. Métricas Clave */}
                        <Row gutter={16} style={{ marginBottom: 24 }}>
                            <Col span={12}>
                                <Statistic
                                    title="Valor Actual"
                                    value={drawerData.insight.value}
                                    valueStyle={{ color: drawerData.insight.severity === 'critical' ? '#cf1322' : '#d48806' }}
                                />
                            </Col>
                            <Col span={12}>
                                <Statistic
                                    title="Objetivo Ideal"
                                    value={drawerData.insight.target}
                                    prefix={<DashboardOutlined />}
                                />
                            </Col>
                        </Row>

                        {/* 3. Breakdown visual (solo para costos) */}
                        {drawerData.insight.type === 'COSTS' && drawerData.insight.details.breakdown && (
                            <div style={{ marginBottom: 32, background: '#fafafa', padding: 16, borderRadius: 8 }}>
                                <Title level={5} style={{ marginTop: 0, fontSize: 14 }}>Desglose de Factores</Title>
                                {drawerData.insight.details.breakdown.map((b, i) => (
                                    <div key={i} style={{ marginBottom: 8 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                                            <span>{b.label}</span>
                                            <strong>{formatCurrency(b.value)}</strong>
                                        </div>
                                        <Progress percent={b.percentage} size="small" showInfo={false} strokeColor="#8c8c8c" />
                                    </div>
                                ))}
                            </div>
                        )}

                        <Divider>Diagnóstico</Divider>
                        <Paragraph type="secondary" style={{ fontStyle: 'italic' }}>
                            &quot;{drawerData.insight.details.diagnosis}&quot;
                        </Paragraph>

                        <Divider>Plan de Recuperación</Divider>

                        {/* 4. Timeline de Acción */}
                        <Timeline
                            items={drawerData.insight.details.actions.map((action: AlertAction) => ({
                                color: 'blue',
                                children: (
                                    <>
                                        <Text strong>{action.title}</Text>
                                        <p style={{ color: '#8c8c8c', margin: 0, fontSize: 13 }}>{action.desc}</p>
                                    </>
                                ),
                            }))}
                        />

                        <div style={{ marginTop: 40 }}>
                            <Button type="primary" block size="large" icon={<ArrowUpOutlined />}>
                                Aplicar Correcciones
                            </Button>
                        </div>
                    </div>
                )}
            </Drawer>
        </>
    );
};

export default FinancialAdvisorWidget;
