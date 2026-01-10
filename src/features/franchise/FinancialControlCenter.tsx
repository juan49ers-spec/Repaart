import React, { useState, useEffect } from 'react';
import { Truck, Users, DollarSign, CreditCard, Info, Lock, Save, Copy, Settings, X, Flame, AlertTriangle, CheckCircle, Lightbulb, Sparkles, TrendingDown, Target } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { financeService } from '../../services/financeService';
import { userService } from '../../services/userService';
import { notificationService } from '../../services/notificationService';
import { OrderCounts, ExpenseData, SimpleFinanceData } from './finance/types';
import { formatMoney, MonthlyData } from '../../lib/finance';

// --- TYPES ---
type AdvisoryStatus = 'safe' | 'warning' | 'danger' | 'neutral';

interface AdvisoryTip {
// ...
// ...
    const mapDataToState = (data: MonthlyData) => {
    title: string;
    content: string;
    status: AdvisoryStatus;
    metric ?: string;
    icon: React.ReactNode;
}

// --- HELPER: KM ESTIMATION ---
const estimateTotalKm = (orders: OrderCounts): number => {
    const km0_4 = (orders['0-4 km'] || 0) * 3;
    const km4_5 = (orders['4-5 km'] || 0) * 5;
    const km5_6 = (orders['5-6 km'] || 0) * 6;
    const km6_7 = (orders['6-7 km'] || 0) * 7;
    const kmGt7 = (orders['>7 km'] || 0) * 9;
    return km0_4 + km4_5 + km5_6 + km6_7 + kmGt7;
};

// --- DATA: DYNAMIC ADVISOR ENGINE ---
const getAdvisoryData = (
    field: string,
    values: {
        income: number, expenses: ExpenseData, orders: number,
        totalHours: number, estimatedKm: number, cancelled: number
    }
): AdvisoryTip => {

    const { income, expenses, orders, estimatedKm, cancelled } = values;

    switch (field) {
        case 'labor':
            const laborCost = expenses.payroll + expenses.insurance;
            const laborRatio = income > 0 ? (laborCost / income) * 100 : 0;
            const costPerOrder = orders > 0 ? laborCost / orders : 0;

            if (costPerOrder > 3.5 || laborRatio > 45) return {
                title: 'Alerta: Coste Laboral Crítico',
                content: `Tu coste por pedido es ${formatMoney(costPerOrder)}€ (Meta: <2.50€). ¿Estás sobredimensionando la flota en horas valle ? Revisa el tiempo de espera en recogida.`,
                status: 'danger',
                metric: `${laborRatio.toFixed(1)}% vs 35 % `,
                icon: <Flame className="w-6 h-6 text-red-500" />
            };
            if (costPerOrder > 2.8) return {
                title: 'Eficiencia Laboral Mejorable',
                content: `Tu coste es de ${formatMoney(costPerOrder)}€/pedido. Estás ligeramente por encima del KPI óptimo (2.50€). \n\nCausa probable: Tiempos de espera en restaurante largos (>10 min) que "queman" horas de rider productivas.`,
                status: 'warning',
                metric: `${formatMoney(costPerOrder)}€ / pedido`,
                icon: <AlertTriangle className="w-6 h-6 text-amber-500" />
            };
            return {
                title: 'Excelente Gestión de Flota',
                content: 'Mantienes un coste laboral óptimo (<2.50€/drop). Esto indica una gran coordinación entre cocina y reparto, minimizando los tiempos muertos.',
                status: 'safe',
                metric: 'Top 10% Sector',
                icon: <CheckCircle className="w-6 h-6 text-emerald-500" />
            };

        case 'fuel':
            const fuelPerKm = estimatedKm > 0 ? expenses.fuel / estimatedKm : 0;
            if (fuelPerKm > 0.06) return {
                title: 'Desperdicio de Combustible',
                content: `Tu consumo es de ${formatMoney(fuelPerKm)}€/km, un 50% superior a la media de flota eficiente (0.04€/km). \n\nChecklist: 1) Presión neumáticos, 2) Riders acelerando bruscamente, 3) Motos encendidas en espera.`,
                status: 'danger',
                metric: `${formatMoney(fuelPerKm)}€ / km`,
                icon: <Flame className="w-6 h-6 text-red-500" />
            };
            return {
                title: 'Gasto en Combustible',
                content: 'Estás en el rango óptimo (~0.04€/km). Recuerda que una flota bien mantenida no solo ahorra gasolina, también reduce un 15% el gasto en reparaciones a largo plazo.',
                status: 'safe',
                metric: 'Eficiente',
                icon: <Lightbulb className="w-6 h-6 text-amber-500" />
            };

        case 'orders':
            const density = estimatedKm > 0 ? orders / estimatedKm : 0;
            const kmPerDrop = density > 0 ? 1 / density : 0;

            if (density < 0.25) return {
                title: 'Alerta: Rutas Ineficientes',
                content: `Tus riders recorren ${kmPerDrop.toFixed(1)} km para entregar UN solo pedido. Es insostenible (Meta: <2.5 km/drop). \n\nAcción: Acota tu radio de entrega en la App o lanza promociones en códigos postales cercanos (0-3km).`,
                status: 'warning',
                metric: `${density.toFixed(2)} ped/km`,
                icon: <Truck className="w-6 h-6 text-amber-500" />
            };
            return {
                title: 'Alta Densidad de Entrega',
                content: `¡Genial! Estás entregando casi 1 pedido cada 2 km. Esta "densidad" es lo que diferencia a una franquicia rentable de una que pierde dinero en gasolina y moto.`,
                status: 'safe',
                metric: `${density.toFixed(2)} ped/km`,
                icon: <Truck className="w-6 h-6 text-blue-500" />
            };

        case 'cancelled':
            const cancelRate = orders > 0 ? (cancelled / orders) * 100 : 0;
            if (cancelRate > 3) return {
                title: 'Hemorragia de Ingresos',
                content: `Tienes un ${cancelRate.toFixed(1)}% de fallos. El estándar es <1%. \n\nImpacto Real: Si un pedido medio son 20€, estás perdiendo ${formatMoney(cancelled * 20)}€ directos, más el coste de imagen. Revisa el packaging o los tiempos de cocina.`,
                status: 'danger',
                metric: `Pérdida: ~${cancelled * 20}€`,
                icon: <AlertTriangle className="w-6 h-6 text-red-500" />
            };
            return {
                title: 'Calidad del Servicio',
                content: 'Tasa de cancelación saludable (<1%). Mantener esto bajo es crucial porque recuperarse de una mala review cuesta 12 experiencias positivas nuevas.',
                status: 'safe',
                metric: `${cancelRate.toFixed(1)}%`,
                icon: <Sparkles className="w-6 h-6 text-purple-500" />
            };

        case 'renting':
            const costPerUnit = expenses.renting?.pricePerUnit || 0;
            if (costPerUnit > 170) return {
                title: 'Precio de Flota Fuera de Mercado',
                content: `Pagas ${Math.round(costPerUnit)}€/moto. El precio de grupo negociado ronda los 154€. \n\nSi tienes flota propia antigua, considera el renting: incluye seguro y mantenimiento (que te ahorraría los gastos de la partida "Reparaciones").`,
                status: 'warning',
                metric: `${costPerUnit}€ / ud`,
                icon: <Truck className="w-6 h-6 text-orange-500" />
            };
            return {
                title: 'Coste de Flota Controlado',
                content: 'Tu coste unitario es correcto. Asegúrate de rotar las motos entre riders para que todas tengan un desgaste similar y evitar penalizaciones por exceso de Km en una sola unidad.',
                status: 'safe',
                icon: <Truck className="w-6 h-6 text-blue-500" />
            };

        case 'repairs':
            const repairCostPerKm = estimatedKm > 0 ? expenses.repairs / estimatedKm : 0;
            if (repairCostPerKm > 0.03 && expenses.renting.count > 0) return {
                title: 'Reparaciones Sospechosas',
                content: 'Si tienes motos de renting, el mantenimiento debería estar incluido. ¿Por qué estás gastando en taller? Revisa si son daños por accidentes no cubiertos (franquicias).',
                status: 'warning',
                metric: `${formatMoney(expenses.repairs)}€`,
                icon: <AlertTriangle className="w-6 h-6 text-orange-500" />
            };
            return {
                title: 'Mantenimiento de Flota',
                content: 'El mantenimiento preventivo (aceite, frenos) evita el correctivo (motor gripado), que es 3 veces más caro. Lleva un registro de "Última Revisión" por matrícula.',
                status: 'safe',
                icon: <Lightbulb className="w-6 h-6 text-orange-500" />
            };

        default:
            return {
                title: 'Asistente Logístico IA',
                content: 'Selecciona un campo para analizar tu operativa en tiempo real. Cruzaré tus datos de costes con tus métricas de reparto.',
                status: 'neutral',
                icon: <Sparkles className="w-6 h-6 text-indigo-500" />
            };
    }
};

// --- NEW COMPONENT: HEALTH CHECK ---
const ActiveHealthCheck = ({
    tips
}: { tips: AdvisoryTip[] }) => {

    // Filter only warnings and dangers
    const alerts = tips.filter(t => t.status === 'warning' || t.status === 'danger');

    if (alerts.length === 0) return (
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-start gap-3">
            <div className="p-2 bg-emerald-100 rounded-full shrink-0">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
                <h4 className="font-bold text-emerald-900 text-sm">Todo en Orden</h4>
                <p className="text-emerald-700 text-xs mt-1">
                    Tus métricas clave (Laboral, Gasolina, Pedidos) están dentro de los rangos óptimos. ¡Buen trabajo de gestión!
                </p>
            </div>
        </div>
    );

    return (
        <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Alertas Activas ({alerts.length})
            </h3>
            {alerts.map((alert, idx) => (
                <div key={idx} className={`p-4 rounded-xl border flex gap-3 ${alert.status === 'danger'
                    ? 'bg-rose-50 border-rose-100'
                    : 'bg-amber-50 border-amber-100'
                    }`}>
                    <div className="shrink-0 mt-0.5">
                        {alert.icon}
                    </div>
                    <div>
                        <div className="flex justify-between items-start">
                            <h4 className={`text-sm font-bold ${alert.status === 'danger' ? 'text-rose-900' : 'text-amber-900'
                                }`}>
                                {alert.title}
                            </h4>
                            {alert.metric && (
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${alert.status === 'danger'
                                    ? 'bg-rose-100 text-rose-700 border-rose-200'
                                    : 'bg-amber-100 text-amber-700 border-amber-200'
                                    }`}>
                                    {alert.metric}
                                </span>
                            )}
                        </div>
                        <p className={`text-xs mt-1 leading-relaxed whitespace-pre-line ${alert.status === 'danger' ? 'text-rose-700' : 'text-amber-700'
                            }`}>
                            {alert.content}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
};

// --- NEW COMPONENTS: FINANCIAL WIDGETS ---

const BreakEvenWidget = ({
    fixedCosts,
    variableCosts,
    revenue,
    totalOrders
}: { fixedCosts: number, variableCosts: number, revenue: number, totalOrders: number }) => {

    if (revenue <= 0) return null;

    const contributionMargin = revenue - variableCosts;
    const cmRatio = contributionMargin / revenue;

    const breakEvenRevenue = cmRatio > 0 ? fixedCosts / cmRatio : 0;
    const breakEvenOrders = revenue > 0 ? (breakEvenRevenue / (revenue / totalOrders)) : 0;

    const progress = breakEvenRevenue > 0 ? (revenue / breakEvenRevenue) * 100 : 0;
    const isProfitable = revenue > breakEvenRevenue;

    return (
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                    <Target className="w-4 h-4" /> Punto de Equilibrio
                </h3>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${isProfitable ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                    {isProfitable ? 'En Beneficios' : 'En Pérdidas'}
                </span>
            </div>

            <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between text-xs">
                    <span className="text-gray-500 font-medium">
                        Meta: {formatMoney(breakEvenRevenue)}€
                        <span className="text-gray-400 mx-1">({Math.round(breakEvenOrders)} pedidos)</span>
                    </span>
                    <span className="text-gray-900 font-bold">{Math.round(progress)}%</span>
                </div>
                <div className="overflow-hidden h-2.5 mb-2 text-xs flex rounded-full bg-gray-100">
                    <div
                        style={{ width: `${Math.min(progress, 100)}%` }}
                        className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-500 ${isProfitable ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                    />
                </div>
                <p className="text-[10px] text-gray-400">
                    {isProfitable
                        ? `¡Genial! Has superado el punto de equilibrio en ${formatMoney(revenue - breakEvenRevenue)}€.`
                        : `Te faltan ${formatMoney(breakEvenRevenue - revenue)}€ para cubrir gastos.`}
                </p>
            </div>
        </div>
    );
};

interface FinancialControlCenterProps {
    franchiseId: string;
    month: string;
    onClose: () => void;
    onSave?: (data: SimpleFinanceData) => void;
    initialData?: any;
}

const FinancialControlCenter: React.FC<FinancialControlCenterProps> = ({
    franchiseId,
    month,
    onClose,
    onSave,
    initialData
}) => {

    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [focusedField, setFocusedField] = useState<string>('default');
    const [status, setStatus] = useState<'pending' | 'draft' | 'submitted' | 'approved' | 'unlock_requested' | 'locked'>('draft');

    // Unlock Workflow State
    const [showUnlockModal, setShowUnlockModal] = useState(false);
    const [unlockReason, setUnlockReason] = useState('');


    const isLocked = status === 'submitted' || status === 'approved' || status === 'unlock_requested';

    // --- STATE ---
    const [orders, setOrders] = useState<OrderCounts>({});
    const [cancelledOrders, setCancelledOrders] = useState(0);
    const [totalIncome, setTotalIncome] = useState(0);
    const [totalHours, setTotalHours] = useState(0);
    const [expenses, setExpenses] = useState<ExpenseData>({
        payroll: 0, quota: 0, insurance: 0,
        fuel: 0, repairs: 0,
        renting: { count: 0, pricePerUnit: 0 },
        agencyFee: 0, prlFee: 0, accountingFee: 0, professionalServices: 0,
        appFlyder: 0, marketing: 0, incidents: 0, other: 0,
        royaltyPercent: 5,
        irpfPercent: 20
    });
    const [logisticsRates, setLogisticsRates] = useState<any[]>([]);

    // --- AUTO-CALCULATE INCOME ---
    useEffect(() => {
        if (logisticsRates.length > 0) {
            let calculatedIncome = 0;
            // Iterate over active orders to calculate sum
            Object.entries(orders).forEach(([range, count]) => {
                const rate = logisticsRates.find(r =>
                    r.name === range ||
                    `${r.min}-${r.max} km` === range
                );
                if (rate && typeof rate.price === 'number') {
                    calculatedIncome += count * rate.price;
                }
            });

            // Update totalIncome if calculatedIncome has changed
            // We allow setting to 0 if orders were cleared
            // SAFETY CHECK: Prevent Infinite Loop (NaN !== NaN is true)
            if (!isNaN(calculatedIncome) && calculatedIncome !== totalIncome) {
                if (calculatedIncome > 0 || Object.keys(orders).length > 0) {
                    setTotalIncome(calculatedIncome);
                }
            }
        }
    }, [orders, logisticsRates, totalIncome]);

    // --- LOAD DATA ---
    useEffect(() => {
        async function loadData() {
            if (!franchiseId || !month) return;
            try {
                const data = initialData || await financeService.getFinancialData(franchiseId, month) as any;

                // Fetch Profile for Rates (using UID if it's a franchise, else mapping by franchiseId)
                let profile;
                if (user?.role === 'franchise' && user?.uid) {
                    profile = await userService.getUserProfile(user.uid);
                } else {
                    profile = await userService.getUserByFranchiseId(franchiseId);
                }

                if (profile && profile.logisticsRates) {
                    setLogisticsRates(profile.logisticsRates);
                }

                if (data && Object.keys(data).length > 0) {
                    mapDataToState(data);
                }
            } catch (err) {
                console.error("Error loading data", err);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [franchiseId, month, initialData]);

    const mapDataToState = (data: any) => {
        const revenue = data.revenue || data.totalIncome || 0;
        setTotalIncome(revenue);
        setTotalHours(data.totalHours || 0);
        setCancelledOrders(data.cancelledOrders || 0);
        setStatus(data.status || 'draft');

        const reconstructedOrders: OrderCounts = {};

        // 1. Try new dynamic field first
        if (data.ordersDetail) {
            Object.assign(reconstructedOrders, data.ordersDetail);
        } else {
            // 2. Fallback to Legacy Fixed Fields
            if (data.ordersNew0To4) reconstructedOrders['0-4 km'] = data.ordersNew0To4;
            if (data.ordersNew4To5) reconstructedOrders['4-5 km'] = data.ordersNew4To5;
            if (data.ordersNew5To6) reconstructedOrders['5-6 km'] = data.ordersNew5To6;
            if (data.ordersNew6To7) reconstructedOrders['6-7 km'] = data.ordersNew6To7;
            if (data.ordersNewGt7) reconstructedOrders['>7 km'] = data.ordersNewGt7;
        }

        setOrders(reconstructedOrders);

        setExpenses({
            payroll: data.salaries || 0,
            quota: data.quota || 0,
            insurance: data.insurance || 0,
            fuel: data.gasoline || 0,
            repairs: data.repairs || 0,
            renting: {
                count: data.motoCount || 0,
                pricePerUnit: data.motoCount > 0 && (data as any).rentingCost
                    ? (data as any).rentingCost / data.motoCount
                    : 154
            },
            agencyFee: data.agencyFee || 0,
            prlFee: data.prlFee || 0,
            accountingFee: data.accountingFee || 0,
            professionalServices: data.services || 0,
            appFlyder: data.appFlyder || 0,
            marketing: data.marketing || 0,
            incidents: data.incidents || 0,
            other: data.otherExpenses || 0,
            royaltyPercent: data.royaltyPercent ?? 5,
            irpfPercent: data.irpfPercent ?? 20
        });
    };

    // --- CALCULATIONS ---
    const calculateStats = () => {
        const rentingTotal = (expenses.renting?.count ?? 0) * (expenses.renting?.pricePerUnit ?? 0);
        const royaltyAmount = totalIncome * ((expenses.royaltyPercent || 5) / 100);

        const fixedCosts = expenses.payroll + expenses.quota + expenses.insurance +
            expenses.agencyFee + expenses.prlFee + expenses.accountingFee +
            expenses.professionalServices + expenses.appFlyder + expenses.marketing;

        const variableCosts = expenses.fuel + expenses.repairs + rentingTotal +
            expenses.incidents + expenses.other + royaltyAmount;

        const totalExpenses = fixedCosts + variableCosts;
        const profit = totalIncome - totalExpenses;

        const totalOrders = Object.values(orders).reduce((sum, count) => sum + count, 0);
        const estimatedKm = estimateTotalKm(orders);

        return { totalExpenses, profit, fixedCosts, variableCosts, royaltyAmount, totalOrders, estimatedKm };
    };

    const stats = calculateStats();

    // --- ADVISOR LOGIC ---
    // 1. Get Active Tip based on Focus
    const activeTip = getAdvisoryData(focusedField, {
        income: totalIncome, expenses, orders: stats.totalOrders,
        totalHours, estimatedKm: stats.estimatedKm, cancelled: cancelledOrders
    });

    // 2. Get All Tips for Health Check
    const allTips = [
        getAdvisoryData('labor', { income: totalIncome, expenses, orders: stats.totalOrders, totalHours, estimatedKm: stats.estimatedKm, cancelled: cancelledOrders }),
        getAdvisoryData('fuel', { income: totalIncome, expenses, orders: stats.totalOrders, totalHours, estimatedKm: stats.estimatedKm, cancelled: cancelledOrders }),
        getAdvisoryData('orders', { income: totalIncome, expenses, orders: stats.totalOrders, totalHours, estimatedKm: stats.estimatedKm, cancelled: cancelledOrders }),
        getAdvisoryData('cancelled', { income: totalIncome, expenses, orders: stats.totalOrders, totalHours, estimatedKm: stats.estimatedKm, cancelled: cancelledOrders }),
        getAdvisoryData('renting', { income: totalIncome, expenses, orders: stats.totalOrders, totalHours, estimatedKm: stats.estimatedKm, cancelled: cancelledOrders }),
    ];

    // --- HANDLERS ---
    const handleSave = async () => {
        if (!onSave || isLocked) return;

        const confirmMsg = "Al enviar el cierre, los datos quedarán bloqueados para su revisión por parte de la central. ¿Estás seguro de que deseas continuar?";
        if (!window.confirm(confirmMsg)) return;

        setSaving(true);
        try {
            // 1. Calculate Smart Alerts for Notification
            const criticalAlerts = allTips.filter(t => t.status === 'danger');
            const warningAlerts = allTips.filter(t => t.status === 'warning');
            const hasIssues = criticalAlerts.length > 0 || warningAlerts.length > 0;

            const notificationPriority = criticalAlerts.length > 0 ? 'high' : (warningAlerts.length > 0 ? 'normal' : 'low');
            const issueSummary = criticalAlerts.map(a => a.title).join(', ');

            if (isLocked) {
                // UNLOCK REQUEST LOGIC
                if (!window.confirm("¿Deseas solicitar al administrador el desbloqueo de este mes para realizar correcciones?")) {
                    return;
                }
                setSaving(true);
                try {
                    await notificationService.notify(
                        'UNLOCK_REQUEST',
                        franchiseId,
                        'Franquicia',
                        {
                            title: `Solicitud Desbloqueo: ${month}`,
                            message: `Solicitud para editar cierre de ${month}.`,
                            priority: 'normal',
                            metadata: { month, status: 'locked' }
                        }
                    );
                    alert("Solicitud enviada al administrador.");
                    onClose();
                } catch (error) {
                    console.error("Error asking for unlock", error);
                } finally {
                    setSaving(false);
                }
                return;
            }

            const mappedData = {
                month,
                totalIncome, revenue: totalIncome, grossIncome: totalIncome,
                salaries: expenses.payroll, quota: expenses.quota, insurance: expenses.insurance,
                gasoline: expenses.fuel, gasolinePrice: 0, repairs: expenses.repairs,
                motoCount: expenses.renting?.count ?? 0,
                rentingCost: (expenses.renting?.count ?? 0) * (expenses.renting?.pricePerUnit ?? 0),
                agencyFee: expenses.agencyFee, prlFee: expenses.prlFee, accountingFee: expenses.accountingFee, services: expenses.professionalServices,
                appFlyder: expenses.appFlyder, marketing: expenses.marketing, incidents: expenses.incidents, otherExpenses: expenses.other,
                totalExpenses: stats.totalExpenses, expenses: stats.totalExpenses, profit: stats.profit,
                orders: stats.totalOrders,
                ordersDetail: orders, // NEW: Store dynamic map
                cancelledOrders: cancelledOrders,
                // Legacy fields for backward compat (optional, but good for safety)
                ...(orders['0-4 km'] !== undefined && { ordersNew0To4: orders['0-4 km'] }),
                ...(orders['4-5 km'] !== undefined && { ordersNew4To5: orders['4-5 km'] }),
                ...(orders['5-6 km'] !== undefined && { ordersNew5To6: orders['5-6 km'] }),
                ...(orders['6-7 km'] !== undefined && { ordersNew6To7: orders['6-7 km'] }),
                ...(orders['>7 km'] !== undefined && { ordersNewGt7: orders['>7 km'] }),
                status: 'locked' as const, // LOCK upon save (Changed from submitted to locked as per user request for "Green/Cerrado")
                is_locked: true,
                royaltyPercent: expenses.royaltyPercent,
                irpfPercent: expenses.irpfPercent,
                updatedAt: new Date().toISOString()
            };

            await onSave(mappedData as any);

            // 2. Send Smart Notification
            await notificationService.notify(
                'FINANCE_CLOSING',
                franchiseId,
                'Franquicia', // We should ideally get the name, but ID is critical
                {
                    title: `Cierre Mensual: ${month}`,
                    message: hasIssues
                        ? `Cierre enviado con alertas: ${issueSummary}`
                        : `Cierre mensual de ${month} enviado correctamente.`,
                    priority: notificationPriority,
                    metadata: {
                        month,
                        profit: stats.profit,
                        alerts: criticalAlerts.map(a => a.title),
                        status: 'submitted'
                    }
                }
            );

            onClose();
        } catch (error) {
            console.error("Error saving", error);
        } finally {
            setSaving(false);
        }
    };

    const submitUnlockRequest = async () => {
        if (!unlockReason.trim()) {
            alert("Por favor, indica un motivo para la solicitud.");
            return;
        }

        setSaving(true);
        try {
            // Persist request in DB
            await financeService.requestUnlock(franchiseId, month, unlockReason);

            await notificationService.notify(
                'UNLOCK_REQUEST',
                franchiseId,
                'Franquicia',
                {
                    title: `Solicitud Desbloqueo: ${month}`,
                    message: `Motivo: ${unlockReason}`, // Include reason
                    priority: 'normal',
                    metadata: { month, status: 'locked', reason: unlockReason }
                }
            );

            // Optimistic update
            setStatus('unlock_requested' as any);

            alert("Solicitud enviada al administrador.");
            setShowUnlockModal(false);
            onClose();
        } catch (error) {
            console.error("Error asking for unlock", error);
        } finally {
            setSaving(false);
        }
    };

    const handleCopyPreviousMonth = async () => {
        const date = new Date(month + '-01');
        date.setMonth(date.getMonth() - 1);
        const prevMonthStr = date.toISOString().slice(0, 7);

        try {
            setLoading(true);
            const prevData = await financeService.getFinancialData(franchiseId, prevMonthStr);
            if (prevData) {
                const currentIncome = totalIncome;
                const currentOrders = orders;

                mapDataToState(prevData);

                if (currentIncome > 0) {
                    setTotalIncome(currentIncome);
                    setOrders(currentOrders);
                }
            }
        } catch (error) {
            console.error("Failed to copy", error);
        } finally {
            setLoading(false);
        }
    };

    const updateExpense = (field: keyof ExpenseData, value: number) => {
        setExpenses(prev => ({ ...prev, [field]: value }));
    };

    // --- UI HELPERS ---
    const getStatusColors = (status: AdvisoryStatus) => {
        switch (status) {
            case 'danger': return 'bg-red-50 border-red-100 shadow-red-100';
            case 'warning': return 'bg-amber-50 border-amber-100 shadow-amber-100';
            case 'safe': return 'bg-emerald-50 border-emerald-100 shadow-emerald-100';
            default: return 'bg-white border-indigo-50 shadow-indigo-100';
        }
    };

    // --- RENDER ---
    if (loading) return <div className="fixed inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-50"><div className="animate-spin text-indigo-600">Loading...</div></div>;

    return (
        <div className="fixed inset-0 bg-gray-50/95 backdrop-blur-md z-50 overflow-hidden flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-200">

            <div className="w-full h-full max-w-[1920px] bg-white shadow-2xl flex flex-col">

                {/* HEADER */}
                <header className="h-16 border-b border-gray-200 bg-white px-6 flex items-center justify-between shrink-0 z-10 sticky top-0">
                    <div className="flex items-center gap-4">
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-900 transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                                <span className={`w-2.5 h-2.5 rounded-full shadow-sm ${isLocked ? 'bg-amber-500' : 'bg-indigo-600'}`} />
                                Cierre Mensual: <span className="font-normal text-gray-600 ml-1">{month}</span>
                                {isLocked && (
                                    <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                                        <Lock className="w-3 h-3" /> Bloqueado
                                    </span>
                                )}
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleCopyPreviousMonth}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 text-gray-600 hover:text-gray-900 transition-all text-sm font-medium shadow-sm"
                        >
                            <Copy className="w-3.5 h-3.5" />
                            Copiar mes anterior
                        </button>

                        <button
                            onClick={handleSave}
                            disabled={saving || status === 'unlock_requested'}
                            className={`flex items-center gap-2 px-5 py-2 rounded-lg font-semibold shadow-md transition-all hover:translate-y-[-1px] active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed text-sm ${status === 'unlock_requested'
                                ? 'bg-slate-100 text-slate-500 border border-slate-200 shadow-none'
                                : isLocked
                                    ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 border border-amber-200 shadow-amber-500/10'
                                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20'
                                }`}
                        >
                            {saving ? 'Procesando...' : status === 'unlock_requested' ? (
                                <>
                                    <Lock className="w-4 h-4 opacity-50" />
                                    Solicitud Enviada
                                </>
                            ) : (
                                <>
                                    {isLocked ? <Lock className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                                    {isLocked ? 'Solicitar Desbloqueo' : 'Cerrar Mes'}
                                </>
                            )}
                        </button>
                    </div>
                </header>

                {/* MAIN GRID */}
                <div className={`flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-0 bg-gray-50 ${isLocked ? 'pointer-events-none opacity-80 grayscale-[0.3]' : ''}`}>

                    {/* COL 1: INCOME & OPS (Scrollable) */}
                    <div className="lg:col-span-4 border-r border-gray-200 overflow-y-auto custom-scrollbar bg-white p-8 space-y-8">
                        <section>
                            <h2 className="text-sm uppercase tracking-wide font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <div className="p-1.5 bg-emerald-100/50 rounded-md text-emerald-600">
                                    <DollarSign className="w-4 h-4" />
                                </div>
                                Ingresos
                            </h2>

                            <div className="bg-white p-6 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-indigo-50 space-y-2 ring-1 ring-emerald-100/50">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Ingresos Totales (Bruto)</label>
                                    <div className="relative group">
                                        <input
                                            type="number"
                                            value={totalIncome || ''}
                                            onChange={(e) => setTotalIncome(parseFloat(e.target.value) || 0)}
                                            onFocus={() => setFocusedField('income')}
                                            className="w-full bg-transparent border-0 border-b-2 border-gray-100 px-1 py-2 text-4xl font-mono font-bold text-gray-900 focus:ring-0 focus:border-emerald-500 outline-none transition-all placeholder-gray-200"
                                            placeholder="0.00"
                                            aria-label="Ingresos Totales (Bruto)"
                                        />
                                        <span className="absolute right-0 top-1/2 -translate-y-1/2 text-emerald-600/20 text-4xl font-light pointer-events-none">€</span>
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-2 text-right font-medium">
                                        Introduce el importe neto sin IVA si es posible
                                    </p>
                                </div>
                            </div>
                        </section>

                        <section>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-sm uppercase tracking-wide font-bold text-gray-900 flex items-center gap-2">
                                    <div className="p-1.5 bg-blue-100/50 rounded-md text-blue-600">
                                        <Truck className="w-4 h-4" />
                                    </div>
                                    Distribución & Eficiencia
                                </h2>
                                <a
                                    href="/profile"
                                    className="text-[10px] uppercase font-bold text-blue-500 hover:text-blue-700 flex items-center gap-1 transition-colors group"
                                >
                                    <Settings className="w-3 h-3 group-hover:rotate-90 transition-transform" />
                                    Configurar
                                </a>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] border border-gray-100 space-y-4">
                                <div className="space-y-3">
                                    {(logisticsRates.length > 0 ? logisticsRates : []).map((rate, index) => {
                                        const range = rate.name || (rate.min !== undefined && rate.max !== undefined ? `${rate.min}-${rate.max} km` : `Tarifa ${index + 1}`);
                                        const price = rate.price || 0;

                                        return (
                                            <div key={index} className="flex items-center justify-between group">
                                                <div className="flex flex-col">
                                                    <label className="text-gray-500 text-xs font-semibold group-hover:text-blue-600 transition-colors">{range}</label>
                                                    <span className={`text-[10px] font-mono font-medium ${price > 0 ? 'text-emerald-600' : 'text-amber-500'}`}>
                                                        {formatMoney(price)}€ <span className={`${price > 0 ? 'text-emerald-400' : 'text-amber-400'}`}>/ud</span>
                                                        {price === 0 && <span className="ml-1 text-[9px] text-amber-500">(Sin Tarifa)</span>}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="number"
                                                        value={orders[rate.name] || ''}
                                                        onChange={(e) => setOrders(prev => ({ ...prev, [rate.name]: parseInt(e.target.value) || 0 }))}
                                                        onFocus={() => setFocusedField('orders')}
                                                        className="w-20 bg-gray-50 hover:bg-white focus:bg-white border border-transparent hover:border-gray-200 focus:border-blue-500 rounded-lg px-2 py-1.5 text-right font-mono text-sm text-gray-900 transition-all outline-none"
                                                        placeholder="0"
                                                        aria-label={`Pedidos para tarifa ${range}`}
                                                    />
                                                    <span className="text-[10px] text-gray-300 w-4">pd</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {logisticsRates.length === 0 && (
                                        <div className="text-center py-4">
                                            <p className="text-xs text-amber-500 font-medium">No hay tarifas configuradas.</p>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-4 pt-4 border-t border-dashed border-gray-200">
                                    <div className="flex justify-between items-center px-2">
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Km Estimados</span>
                                        <span className="text-sm font-mono font-bold text-blue-900">{Math.round(stats.estimatedKm).toLocaleString()} km</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block pl-1">Incidencias</label>
                                <div className="bg-white p-4 rounded-xl border border-gray-200 hover:border-red-200 transition-colors shadow-sm flex items-center justify-between group">
                                    <span className="text-xs font-medium text-gray-600">Pedidos Cancelados</span>
                                    <input
                                        type="number"
                                        value={cancelledOrders || ''}
                                        onChange={(e) => setCancelledOrders(parseInt(e.target.value) || 0)}
                                        onFocus={() => setFocusedField('cancelled')}
                                        className="w-24 bg-red-50/50 border border-transparent focus:border-red-500 rounded-lg px-3 py-1.5 text-right font-mono text-red-900 outline-none transition-all group-hover:bg-red-50"
                                        aria-label="Pedidos Cancelados"
                                    />
                                </div>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-sm uppercase tracking-wide font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <div className="p-1.5 bg-purple-100/50 rounded-md text-purple-600">
                                    <Users className="w-4 h-4" />
                                </div>
                                Flota y Laboral
                            </h2>
                            <div className="bg-white p-6 rounded-2xl shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] border border-gray-100">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Horas Totales (Riders)</label>
                                    <input
                                        type="number"
                                        value={totalHours || ''}
                                        onChange={(e) => setTotalHours(parseFloat(e.target.value) || 0)}
                                        onFocus={() => setFocusedField('labor')}
                                        className="w-full bg-gray-50 border border-transparent hover:border-gray-200 hover:bg-white focus:bg-white rounded-xl px-4 py-3 text-gray-900 font-mono text-lg focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all"
                                        placeholder="0.0 hours"
                                        aria-label="Horas Totales (Riders)"
                                    />
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* COL 2: EXPENSES (Scrollable) */}
                    <div className="lg:col-span-5 overflow-y-auto custom-scrollbar p-8 space-y-8 bg-gray-50/50">

                        <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-200/60 sticky top-0 bg-gray-50/95 backdrop-blur-sm z-10 pt-2">
                            <h2 className="text-sm uppercase tracking-wide font-bold text-gray-900 flex items-center gap-2">
                                <div className="p-1.5 bg-rose-100/50 rounded-md text-rose-600">
                                    <CreditCard className="w-4 h-4" />
                                </div>
                                Estructura de Costes
                            </h2>
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Total Gastos</span>
                                <span className="text-lg font-mono font-bold text-gray-900 tracking-tight">{formatMoney(stats.totalExpenses)}€</span>
                            </div>
                        </div>

                        {/* FIXED COSTS */}
                        <div className="bg-white p-6 rounded-2xl shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] border border-gray-100">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-900/40 mb-5 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                                Fijos y Estructurales
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                                <ExpenseInput label="Nóminas" value={expenses.payroll} onChange={(v) => updateExpense('payroll', v)} onFocus={() => setFocusedField('labor')} totalIncome={totalIncome} />
                                <ExpenseInput label="Seguridad Social" value={expenses.insurance} onChange={(v) => updateExpense('insurance', v)} onFocus={() => setFocusedField('labor')} totalIncome={totalIncome} />
                                <ExpenseInput label="Cuota Autónomos" value={expenses.quota} onChange={(v) => updateExpense('quota', v)} onFocus={() => setFocusedField('quota')} totalIncome={totalIncome} />
                                <ExpenseInput label="Gestoría" value={expenses.agencyFee} onChange={(v) => updateExpense('agencyFee', v)} onFocus={() => setFocusedField('agencyFee')} totalIncome={totalIncome} />
                                <ExpenseInput label="PRL" value={expenses.prlFee} onChange={(v) => updateExpense('prlFee', v)} onFocus={() => setFocusedField('prlFee')} totalIncome={totalIncome} />
                                <ExpenseInput label="App Flyder" value={expenses.accountingFee} onChange={(v) => updateExpense('accountingFee', v)} onFocus={() => setFocusedField('accountingFee')} totalIncome={totalIncome} />

                                <ExpenseInput label="Servicios Financieros Repaart" value={expenses.appFlyder} onChange={(v) => updateExpense('appFlyder', v)} onFocus={() => setFocusedField('appFlyder')} totalIncome={totalIncome} />
                                <ExpenseInput label="Marketing Local" value={expenses.marketing} onChange={(v) => updateExpense('marketing', v)} onFocus={() => setFocusedField('marketing')} totalIncome={totalIncome} />
                            </div>
                        </div>

                        {/* VARIABLE COSTS */}
                        <div className="bg-white p-6 rounded-2xl shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] border border-gray-100">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-amber-900/40 mb-5 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                                Variables y Flota
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                                <ExpenseInput isVariable label="Gasolina" value={expenses.fuel} onChange={(v) => updateExpense('fuel', v)} onFocus={() => setFocusedField('fuel')} totalIncome={totalIncome} />
                                <ExpenseInput isVariable label="Reparaciones" value={expenses.repairs} onChange={(v) => updateExpense('repairs', v)} onFocus={() => setFocusedField('repairs')} totalIncome={totalIncome} />
                                <ExpenseInput isVariable label="Incidentes" value={expenses.incidents} onChange={(v) => updateExpense('incidents', v)} onFocus={() => setFocusedField('incidents')} totalIncome={totalIncome} />
                                <ExpenseInput isVariable label="Otros" value={expenses.other} onChange={(v) => updateExpense('other', v)} onFocus={() => setFocusedField('other')} totalIncome={totalIncome} />
                            </div>

                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mt-6 shadow-sm">
                                <div className="flex justify-between items-center mb-3">
                                    <label className="text-sm font-bold text-gray-700">Renting Motos</label>
                                    <span className="text-xs font-mono font-medium text-gray-500">{formatMoney((expenses.renting?.count ?? 0) * (expenses.renting?.pricePerUnit ?? 0))}€</span>
                                </div>
                                <div className="flex gap-4">
                                    <div>
                                        <label className="text-xs text-gray-500 block mb-1">Unidades</label>
                                        <input
                                            type="number"
                                            value={expenses.renting?.count || 0}
                                            onChange={(e) => setExpenses(prev => ({ ...prev, renting: { ...prev.renting!, count: parseInt(e.target.value) || 0 } }))}
                                            onFocus={() => setFocusedField('renting')}
                                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-900 font-mono text-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all shadow-sm"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-xs text-gray-500 block mb-1">Precio / Unidad</label>
                                        <input
                                            type="number"
                                            value={expenses.renting?.pricePerUnit || 0}
                                            onChange={(e) => setExpenses(prev => ({ ...prev, renting: { ...prev.renting!, pricePerUnit: parseFloat(e.target.value) || 0 } }))}
                                            onFocus={() => setFocusedField('renting')}
                                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-900 font-mono text-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all shadow-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ROYALTY & TAX */}
                        <div className="bg-white p-6 rounded-2xl shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] border border-gray-100">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-900/40 mb-5 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                                Fiscalidad
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 block mb-1.5">% Royalty</label>
                                    <input
                                        type="number"
                                        value={expenses.royaltyPercent}
                                        onChange={(e) => updateExpense('royaltyPercent', parseFloat(e.target.value))}
                                        onFocus={() => setFocusedField('royalty')}
                                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-900 font-mono text-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none shadow-sm"
                                        aria-label="Porcentaje de Royalty"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 block mb-1.5">% IRPF</label>
                                    <input
                                        type="number"
                                        value={expenses.irpfPercent}
                                        onChange={(e) => updateExpense('irpfPercent', parseFloat(e.target.value))}
                                        onFocus={() => setFocusedField('irpf')}
                                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-900 font-mono text-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none shadow-sm"
                                        aria-label="Porcentaje de IRPF"
                                    />
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* COL 3: ANALYTICS SIDEBAR */}
                    <div className="lg:col-span-3 bg-slate-50 border-l border-slate-200 flex flex-col relative overflow-hidden">

                        <div className="p-6 flex-1 overflow-y-auto relative z-10 flex flex-col gap-6">

                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-2 bg-slate-800 rounded-lg shadow-sm">
                                    <TrendingDown className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900 leading-tight">
                                        Análisis CFO
                                    </h2>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Vista Directiva</span>
                                </div>
                            </div>

                            {/* 1. ALWAYS SHOW BREAK EVEN (NORTH STAR) */}
                            <BreakEvenWidget
                                fixedCosts={stats.fixedCosts}
                                variableCosts={stats.variableCosts}
                                revenue={totalIncome}
                                totalOrders={stats.totalOrders}
                            />

                            <div className="w-full h-px bg-gray-200 my-2" />

                            {/* 2. DYNAMIC CONTENT: TIP or HEALTH CHECK */}
                            {focusedField !== 'default' ? (
                                <div className={`rounded-xl p-5 shadow-sm border transition-all duration-300 animate-in fade-in slide-in-from-right-4 ${getStatusColors(activeTip.status)}`}>
                                    <div className="mb-3">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="w-10 h-10 bg-white/80 rounded-full flex items-center justify-center shadow-sm">
                                                {activeTip.icon}
                                            </div>
                                            {activeTip.metric && (
                                                <div className="bg-white/80 px-2.5 py-1 rounded-full text-[10px] font-bold shadow-sm border border-gray-100">
                                                    {activeTip.metric}
                                                </div>
                                            )}
                                        </div>

                                        <h3 className="text-sm font-bold text-gray-900 mb-1.5">
                                            {activeTip.title}
                                        </h3>
                                        <p className="text-gray-600 leading-relaxed text-xs whitespace-pre-line">
                                            {activeTip.content}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setFocusedField('default')}
                                        className="mt-2 w-full py-1.5 bg-white/50 hover:bg-white/80 text-gray-600 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors border border-gray-100"
                                    >
                                        Ver Resumen Global
                                    </button>
                                </div>
                            ) : (
                                <ActiveHealthCheck tips={allTips} />
                            )}
                        </div>

                        {/* SIDEBAR FOOTER: EXECUTIVE KPIS */}
                        <div className="p-4 bg-white border-t border-slate-200 mt-auto shrink-0 z-20">
                            <div className="grid grid-cols-2 gap-3">
                                <div
                                    className="bg-slate-50 p-3 rounded-xl border border-slate-100 shadow-sm text-center group hover:bg-white hover:border-emerald-200 hover:shadow-md transition-all cursor-help"
                                    title="Rentabilidad real del negocio. Fórmula: ((Ingresos - Gastos) / Ingresos) × 100"
                                >
                                    <div className="flex items-center justify-center gap-1 mb-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Margen Neto</p>
                                        <Info className="w-3 h-3 text-slate-400" />
                                    </div>
                                    <p className={`text-lg font-mono font-bold ${stats.profit > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {totalIncome > 0 ? ((stats.profit / totalIncome) * 100).toFixed(1) : 0}%
                                    </p>
                                </div>
                                <div
                                    className="bg-slate-50 p-3 rounded-xl border border-slate-100 shadow-sm text-center group hover:bg-white hover:border-blue-200 hover:shadow-md transition-all cursor-help"
                                    title="Coste operativo promedio para entregar un pedido. Fórmula: Gastos Totales / Número de Pedidos"
                                >
                                    <div className="flex items-center justify-center gap-1 mb-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Coste/Pedido</p>
                                        <Info className="w-3 h-3 text-slate-400" />
                                    </div>
                                    <p className="text-lg font-mono font-bold text-slate-700 group-hover:text-blue-700 transition-colors">
                                        {stats.totalOrders > 0 ? formatMoney(stats.totalExpenses / stats.totalOrders) : '0.00'}€
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                </div >
            </div >

            {/* UNLOCK REASON MODAL */}
            {
                showUnlockModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-200">
                            <div className="flex items-center gap-3 text-amber-600 mb-2">
                                <div className="p-2 bg-amber-100 rounded-lg">
                                    <Lock className="w-5 h-5" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">Solicitar Desbloqueo</h3>
                            </div>

                            <p className="text-sm text-gray-500">
                                Para desbloquear el mes de <strong>{month}</strong>, debes indicar al administrador el motivo de la corrección.
                            </p>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Motivo</label>
                                <textarea
                                    value={unlockReason}
                                    onChange={(e) => setUnlockReason(e.target.value)}
                                    className="w-full h-24 p-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none resize-none"
                                    placeholder="Ej: Olvidé incluir una factura de proveedor..."
                                    autoFocus
                                />
                            </div>

                            <div className="flex gap-3 justify-end pt-2">
                                <button
                                    onClick={() => setShowUnlockModal(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={submitUnlockRequest}
                                    disabled={saving || !unlockReason.trim()}
                                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-lg shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {saving ? 'Enviando...' : 'Enviar Solicitud'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

// --- HELPER COMPONENTS ---

const ExpenseInput = ({
    label,
    value,
    onChange,
    onFocus,
    totalIncome, // New Prop for Context
    isVariable = false
}: {
    label: string,
    value: number,
    onChange: (val: number) => void,
    onFocus: () => void,
    totalIncome?: number,
    isVariable?: boolean
}) => {
    const ratio = totalIncome && totalIncome > 0 && value > 0
        ? ((value / totalIncome) * 100).toFixed(1)
        : null;

    return (
        <div className="group relative transition-all duration-300 hover:-translate-y-0.5">
            <div className="flex justify-between items-baseline mb-1.5">
                <label className="text-xs font-semibold text-gray-500 tracking-tight">{label}</label>
                {ratio && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isVariable ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                        {ratio}%
                    </span>
                )}
            </div>
            <div className="relative">
                <input
                    type="number"
                    value={value || ''}
                    onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
                    onFocus={onFocus}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-900 font-mono text-sm transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none placeholder-gray-300 hover:border-gray-300 shadow-sm"
                    placeholder="0.00"
                    aria-label={label}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 text-xs pointer-events-none">€</span>
            </div>
        </div>
    );
};

export default FinancialControlCenter;
