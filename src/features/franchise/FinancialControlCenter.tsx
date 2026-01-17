import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, Users, DollarSign, Info, Lock, Save, Copy as _Copy, X, Flame, AlertTriangle, CheckCircle, Lightbulb, Sparkles, TrendingDown, Target, Building, ArrowRight, MapPin } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { financeService } from '../../services/financeService';
import { userService } from '../../services/userService';
import { notificationService } from '../../services/notificationService';
import { formatMoney } from '../../lib/finance';

// --- TYPES ---
interface OrderCounts {
    [key: string]: number;
}

interface ExpenseData {
    renting?: {
        count: number;
        pricePerUnit: number;
    };
    royaltyPercent?: number;
    advertising?: number;
    civLiability?: number;
    agencyFee?: number;
    prlFee?: number;
    accountingFee?: number;
    services?: number;
    appFlyder?: number;
    marketing?: number;
    incidents?: number;
    otherExpenses?: number;
    irpfPercent?: number;
    socialSecurity?: number;
    payroll?: number;
    insurance?: number;
    fuel?: number;
    repairs?: number;
    professionalServices?: number;
    other?: number;
    quota?: number;
}
type AdvisoryStatus = 'safe' | 'warning' | 'danger' | 'neutral';

interface AdvisoryTip {
    title: string;
    content: string;
    status: AdvisoryStatus;
    metric?: string;
    icon: React.ReactNode;
}

// --- CONFIG: FINANCE & AUDIT DATA ---
const FRANCHISE_CONFIG = {
    packType: 'PREMIUM', // Variar a 'BASIC' para simular
    entryFee: 3000,      // Inversión a recuperar
    amortizationMonths: 12, // Meta recuperación
    laborCostHour: 11.64,   // Coste Empresa Real
    targetPPH: 3.2,         // Objetivo Pedidos/Hora
    flyderFee: 0.35,        // Coste variable software
    hasAccounting: true,    // +100€/mes
    hasAnalytics: true      // +100€/mes
};

// Factores de Distancia Real (Auditoría Retornos)
const REAL_DIST_FACTORS = {
    range_0_4: 2.9,   // Eficiente
    range_4_5: 8.0,   // Penalización retorno
    range_5_7: 10.4,  // Media
    range_7_plus: 15.9 // Larga distancia
};

// Estimación de Tiempos (para cálculo de Yield)
const EST_MINUTES = {
    range_0_4: 15,
    range_4_5: 22,
    range_5_7: 30,
    range_7_plus: 45
};

// --- HELPER: KM ESTIMATION (UPDATED) ---
const estimateTotalKm = (orders: OrderCounts): number => {
    // Usamos los factores reales de auditoría
    const km0_4 = (orders['0-4 km'] || 0) * REAL_DIST_FACTORS.range_0_4;
    const km4_5 = (orders['4-5 km'] || 0) * REAL_DIST_FACTORS.range_4_5;
    const km5_6 = (orders['5-6 km'] || 0) * REAL_DIST_FACTORS.range_5_7; // Agrupamos 5-7
    const km6_7 = (orders['6-7 km'] || 0) * REAL_DIST_FACTORS.range_5_7;
    const kmGt7 = (orders['>7 km'] || 0) * REAL_DIST_FACTORS.range_7_plus;

    return km0_4 + km4_5 + km5_6 + km6_7 + kmGt7;
};

// --- DATA: DYNAMIC ADVISOR ENGINE ---
const getAdvisoryData = (
    field: string,
    values: {
        income: number, expenses: ExpenseData, orders: number,
        totalHours: number, estimatedKm: number, cancelled: number,
        ordersMap: OrderCounts
    }
): AdvisoryTip => {

    const { expenses, orders, estimatedKm, ordersMap, totalHours } = values;

    switch (field) {
        case 'labor': {
            // METRIC 1: Productivity (Orders/Hour)
            const pph = totalHours > 0 ? orders / totalHours : 0;
            const laborCost = (expenses.payroll ?? 0) + (expenses.insurance ?? 0);

            // ALERT: Low Productivity
            if (pph < 2.2 && orders > 10) return {
                title: 'CRÍTICO: Baja Productividad',
                content: `Haces ${pph.toFixed(1)} pedidos/hora. El mínimo para ser rentable es 2.5 (Meta: ${FRANCHISE_CONFIG.targetPPH}). \n\nEstás perdiendo dinero en salarios. Revisa si hay exceso de riders en horas valle.`,
                status: 'danger',
                metric: `${pph.toFixed(1)} ped/h`,
                icon: <TrendingDown className="w-6 h-6 text-red-500" />
            };

            const costPerOrder = orders > 0 ? laborCost / orders : 0;
            if (costPerOrder > (FRANCHISE_CONFIG.laborCostHour / FRANCHISE_CONFIG.targetPPH)) return {
                title: 'Coste Laboral Alto',
                content: `Productividad actual: ${pph.toFixed(1)} ped/h (vs Meta ${FRANCHISE_CONFIG.targetPPH}).\nTu coste real es ${formatMoney(costPerOrder)}€/pedido. \n\nDebes aumentar el volumen de pedidos o reducir horas para bajar el coste.`,
                status: 'warning',
                metric: `${formatMoney(costPerOrder)}€ / ped`,
                icon: <AlertTriangle className="w-6 h-6 text-amber-500" />
            };

            return {
                title: 'Excelente Gestión Laboral',
                content: `Tu productividad (${pph.toFixed(1)} ped/h) cubre sobradamente los costes salariales. Estás generando plusvalía por cada hora trabajada.`,
                status: 'safe',
                metric: 'Top Tier',
                icon: <CheckCircle className="w-6 h-6 text-emerald-500" />
            };
        }

        case 'orders': {
            // METRIC 2: Yield Analysis (Long vs Short)
            // Yield = (Price - VarCost) / Time
            // VarCost approx = DistanceFactor * 0.08

            // Short: 0-4 km vs Long >7km
            // Use rates... we don't have rates here easily accessible without passing them.
            // Assumption: Avg Revenue per Order ~ Income/Orders. 
            // Let's use simplified proxy: 
            // Yield ~ (AvgTicket - (Dist * 0.08)) / Minutes

            const costKm = 0.08;

            const yieldShort = (7 - (REAL_DIST_FACTORS.range_0_4 * costKm)) / EST_MINUTES.range_0_4;
            const yieldLong = (11 - (REAL_DIST_FACTORS.range_7_plus * costKm)) / EST_MINUTES.range_7_plus;

            // Is Long Yield < 50% Short Yield?
            const isDestructive = yieldLong < (yieldShort * 0.5);

            const longOrdersParams = (ordersMap['>7 km'] || 0) + (ordersMap['6-7 km'] || 0);
            const totalOrders = orders || 1;
            const longRatio = longOrdersParams / totalOrders;

            if (isDestructive && longRatio > 0.2) return {
                title: 'PELIGRO: Destrucción de Valor',
                content: `Los pedidos lejanos (>6km) son un 50% menos rentables por minuto que los cortos, y representan el ${(longRatio * 100).toFixed(0)}% de tu volumen. \n\nEstás trabajando más para ganar menos. ¡Corta el radio de entrega!`,
                status: 'danger',
                metric: 'Yield Crítico',
                icon: <Flame className="w-6 h-6 text-red-500" />
            };

            if (longRatio > 0.35) return {
                title: 'Alerta: Rutas Dispersas',
                content: `Tu flota pasa demasiado tiempo en carretera (>35% pedidos largos). Esto dispara el riesgo de accidentes y el desgaste de moto.`,
                status: 'warning',
                metric: `${(longRatio * 100).toFixed(0)}% Lejanos`,
                icon: <Truck className="w-6 h-6 text-amber-500" />
            };

            return {
                title: 'Mix de Distancia Saludable',
                content: 'Tu distribución de pedidos es correcta. Mantienes el núcleo de facturación en el "radio de oro" (0-5km), donde la rentabilidad es máxima.',
                status: 'safe',
                metric: 'Zona Óptima',
                icon: <Target className="w-6 h-6 text-blue-500" />
            };
        }

        // Reuse existing logic for others but refined
        case 'fuel': {
            const fuelPerKm = estimatedKm > 0 ? (expenses.fuel ?? 0) / estimatedKm : 0;
            // Refined limit for "Real" efficiency
            if (fuelPerKm > 0.055) return {
                title: 'Desperdicio de Combustible',
                content: `Consumo: ${formatMoney(fuelPerKm)}€/km. \nMedia eficiente: 0.04€/km. \n\nRevisa presión de neumáticos y conducción agresiva. 1 centimo extra por km son 300€/año por moto.`,
                status: 'danger',
                metric: `+${((fuelPerKm / 0.04) * 100 - 100).toFixed(0)}% Gasto`,
                icon: <Flame className="w-6 h-6 text-red-500" />
            };
            return {
                title: 'Combustible Eficiente',
                content: 'Estás en el rango óptimo. Buen mantenimiento de flota.',
                status: 'safe',
                icon: <Lightbulb className="w-6 h-6 text-amber-500" />
            };
        }

        default: // Fallback for everything else
            return {
                title: 'Asistente CFO Activo',
                content: 'Analizando rentabilidad en tiempo real basada en costes de auditoría y estructura de "Premium". Selecciona un campo para ver detalles.',
                status: 'neutral',
                icon: <Sparkles className="w-6 h-6 text-indigo-500" />
            };
    }
};

// --- NEW COMPONENT: HEALTH CHECK (Refined Grid) ---
const ActiveHealthCheck = ({
    tips
}: { tips: AdvisoryTip[] }) => {

    // Filter only warnings and dangers
    const alerts = tips.filter(t => t.status === 'warning' || t.status === 'danger');

    if (alerts.length === 0) return (
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 flex flex-col items-center text-center gap-3 w-full">
            <div className="p-3 bg-emerald-100/50 rounded-full text-emerald-600 mb-1">
                <CheckCircle className="w-8 h-8" />
            </div>
            <div>
                <h4 className="font-bold text-emerald-900 text-lg">Todo en Orden</h4>
                <p className="text-emerald-700/80 text-sm mt-1 max-w-sm mx-auto leading-relaxed">
                    Tus métricas clave (Laboral, Gasolina, Pedidos) están dentro de los rangos óptimos.
                </p>
            </div>
        </div>
    );

    return (
        <div className="space-y-4 w-full">
            <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-amber-100 rounded-lg text-amber-600">
                    <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">
                    Insights & Mejoras ({alerts.length})
                </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {alerts.map((alert, idx) => (
                    <div key={idx} className={`p-5 rounded-2xl border transition-all duration-300 hover:shadow-lg group ${alert.status === 'danger'
                        ? 'bg-white border-rose-100 shadow-sm hover:border-rose-200'
                        : 'bg-white border-amber-100 shadow-sm hover:border-amber-200'
                        }`}>
                        <div className="flex justify-between items-start mb-3">
                            <div className={`p-2 rounded-xl ${alert.status === 'danger' ? 'bg-rose-50 text-rose-500' : 'bg-amber-50 text-amber-500'
                                }`}>
                                {alert.icon}
                            </div>
                            {alert.metric && (
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${alert.status === 'danger'
                                    ? 'bg-rose-50 text-rose-700 border-rose-100'
                                    : 'bg-amber-50 text-amber-700 border-amber-100'
                                    }`}>
                                    {alert.metric}
                                </span>
                            )}
                        </div>

                        <h4 className={`text-base font-bold mb-2 ${alert.status === 'danger' ? 'text-slate-800' : 'text-slate-800'
                            }`}>
                            {alert.title}
                        </h4>

                        <p className="text-xs text-slate-500 leading-relaxed">
                            {alert.content}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- NEW COMPONENTS: FINANCIAL WIDGETS ---

const CfoHeroWidget = ({
    safeToSpend,
    amortization,
    netResult
}: { safeToSpend: number, amortization: number, netResult: number }) => {
    return (
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-5 rounded-2xl shadow-xl space-y-4 text-white relative overflow-hidden group">
            {/* Ambient Background */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-indigo-500/30 transition-all duration-700" />

            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 bg-emerald-500/20 rounded-lg border border-emerald-500/30">
                        <DollarSign className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Real en Banco</p>
                        <p className="text-xl font-mono font-bold leading-none">{formatMoney(safeToSpend)}€</p>
                    </div>
                </div>

                <div className="space-y-3 pt-3 border-t border-white/10">
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-medium">Amortización (Inv)</span>
                        <span className="font-mono font-bold text-slate-200">-{formatMoney(amortization)}€</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-medium">Beneficio tras Inv.</span>
                        <span className={`font-mono font-bold ${netResult > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {formatMoney(netResult)}€
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

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

// Define the structure of the financial record from Firestore
interface FinancialRecord {
    revenue?: number;
    totalIncome?: number;
    totalHours?: number;
    cancelledOrders?: number;
    status?: 'pending' | 'draft' | 'submitted' | 'approved' | 'unlock_requested' | 'locked';
    rejectionReason?: string;
    ordersDetail?: Record<string, number>;
    ordersNew0To4?: number;
    ordersNew4To5?: number;
    ordersNew5To6?: number;
    ordersNew6To7?: number;
    ordersNewGt7?: number;
    salaries?: number;
    quota?: number;
    insurance?: number;
    gasoline?: number;
    repairs?: number;
    motoCount?: number;
    rentingCost?: number;
    agencyFee?: number;
    prlFee?: number;
    accountingFee?: number;
    services?: number;
    appFlyder?: number;
    marketing?: number;
    incidents?: number;
    otherExpenses?: number;
    royaltyPercent?: number;
    irpfPercent?: number;
}

interface FinancialControlCenterProps {
    franchiseId: string;
    month: string;
    onClose: () => void;
    onSave?: (data: FinancialRecord) => void;
    initialData?: Partial<FinancialRecord>;
}

interface LogisticsRate {
    name?: string;
    min?: number;
    max?: number;
    price: number;
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
    // State to hold rejection reason from Admin, if any
    const [status, setStatus] = useState<'pending' | 'draft' | 'submitted' | 'approved' | 'unlock_requested' | 'locked'>('draft');

    // Unlock Workflow State
    const [showUnlockModal, setShowUnlockModal] = useState(false);
    const [unlockReason, setUnlockReason] = useState('');

    const [lastRejectionReason, setLastRejectionReason] = useState<string | null>(null);

    // WIZARD STEP STATE
    const [wizardStep, setWizardStep] = useState(1);
    const WIZARD_STEPS = [
        { id: 1, title: 'Ingresos', subtitle: 'Facturación' },
        { id: 2, title: 'Costes', subtitle: 'Estructura' },
        { id: 3, title: 'Análisis', subtitle: 'Resultados' }
    ];

    const navigate = useNavigate();


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
    const [logisticsRates, setLogisticsRates] = useState<LogisticsRate[]>([]);

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
                const data = initialData || await financeService.getFinancialData(franchiseId, month) as FinancialRecord;

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
    }, [franchiseId, month, initialData, user?.role, user?.uid]);

    const mapDataToState = (data: FinancialRecord) => {
        const revenue = data.revenue || data.totalIncome || 0;
        setTotalIncome(revenue);
        setTotalHours(data.totalHours || 0);
        setCancelledOrders(data.cancelledOrders || 0);
        setStatus(data.status || 'draft');

        // Map Rejection Reason if it exists
        if (data.rejectionReason) {
            setLastRejectionReason(data.rejectionReason);
        }

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
                pricePerUnit: data.motoCount && data.motoCount > 0 && data.rentingCost
                    ? data.rentingCost / data.motoCount
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
    // --- CALCULATIONS (CFO UPGRADE) ---
    const calculateStats = () => {
        const rentingTotal = (expenses.renting?.count ?? 0) * (expenses.renting?.pricePerUnit ?? 0);
        const royaltyAmount = totalIncome * ((expenses.royaltyPercent || 5) / 100);

        // Fixed / Structural Costs
        const fixedCosts =
            (expenses.payroll ?? 0) +
            (expenses.socialSecurity ?? 0) +
            (expenses.quota ?? 0) +
            (expenses.insurance ?? 0) +
            (expenses.agencyFee ?? 0) +
            (expenses.prlFee ?? 0) +
            (expenses.accountingFee ?? 0) +
            (expenses.professionalServices ?? 0) +
            (expenses.appFlyder ?? 0) +
            (expenses.marketing ?? 0);

        // Variable Costs (Operational)
        const variableCosts = (expenses.fuel ?? 0) + (expenses.repairs ?? 0) + rentingTotal +
            (expenses.incidents ?? 0) + (expenses.other ?? 0) + royaltyAmount;

        const totalExpenses = fixedCosts + variableCosts;

        // 1. Gross Margin (As per user def: Income - (Variable + Labor + Structural))
        const grossMargin = totalIncome - totalExpenses;

        // 2. Amortization (Virtual Cost)
        const amortizationCost = FRANCHISE_CONFIG.entryFee / FRANCHISE_CONFIG.amortizationMonths;

        // 3. Net Result (After paying back investment)
        const netResultAfterAmortization = grossMargin - amortizationCost;

        // 4. Safe To Spend (Tax Shield ~20%)
        const safeToSpend = grossMargin > 0 ? grossMargin * 0.80 : 0;

        const totalOrders = Object.values(orders).reduce((sum, count) => sum + count, 0);
        const estimatedKm = estimateTotalKm(orders);

        return {
            totalExpenses,
            profit: grossMargin, // Mapped to 'profit' for backward compat
            grossMargin,
            amortizationCost,
            netResultAfterAmortization,
            safeToSpend,
            fixedCosts,
            variableCosts,
            royaltyAmount,
            totalOrders,
            estimatedKm
        };
    };

    const stats = calculateStats();



    // 2. Get All Tips for Health Check
    const allTips = [
        getAdvisoryData('labor', { income: totalIncome, expenses, orders: stats.totalOrders, totalHours, estimatedKm: stats.estimatedKm, cancelled: cancelledOrders, ordersMap: orders }),
        getAdvisoryData('fuel', { income: totalIncome, expenses, orders: stats.totalOrders, totalHours, estimatedKm: stats.estimatedKm, cancelled: cancelledOrders, ordersMap: orders }),
        getAdvisoryData('orders', { income: totalIncome, expenses, orders: stats.totalOrders, totalHours, estimatedKm: stats.estimatedKm, cancelled: cancelledOrders, ordersMap: orders }),
        getAdvisoryData('cancelled', { income: totalIncome, expenses, orders: stats.totalOrders, totalHours, estimatedKm: stats.estimatedKm, cancelled: cancelledOrders, ordersMap: orders }),
        getAdvisoryData('renting', { income: totalIncome, expenses, orders: stats.totalOrders, totalHours, estimatedKm: stats.estimatedKm, cancelled: cancelledOrders, ordersMap: orders }),
    ];

    const handleSave = async () => {
        if (!onSave) return;

        // UNLOCK REQUEST LOGIC
        // If the month is locked, the 'Save' button acts as 'Request Unlock'
        if (isLocked) {
            setShowUnlockModal(true);
            return;
        }

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

            const mappedData = {
                month,
                totalHours, // Added totalHours to persistence persistence
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

            await onSave(mappedData);

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

    /**
     * DRAFT MODE: Save without locking or notifying.
     */
    const handleSaveDraft = async () => {
        if (!onSave || isLocked) return;

        setSaving(true);
        try {
            const mappedData = {
                month,
                totalHours, // Added totalHours to persistence
                totalIncome, revenue: totalIncome, grossIncome: totalIncome,
                salaries: expenses.payroll, quota: expenses.quota, insurance: expenses.insurance,
                gasoline: expenses.fuel, gasolinePrice: 0, repairs: expenses.repairs,
                motoCount: expenses.renting?.count ?? 0,
                rentingCost: (expenses.renting?.count ?? 0) * (expenses.renting?.pricePerUnit ?? 0),
                agencyFee: expenses.agencyFee, prlFee: expenses.prlFee, accountingFee: expenses.accountingFee, services: expenses.professionalServices,
                appFlyder: expenses.appFlyder, marketing: expenses.marketing, incidents: expenses.incidents, otherExpenses: expenses.other,
                totalExpenses: stats.totalExpenses, expenses: stats.totalExpenses, profit: stats.profit,
                orders: stats.totalOrders,
                ordersDetail: orders,
                cancelledOrders: cancelledOrders,
                status: 'draft' as const, // DRAFT STATUS
                is_locked: false, // NOT LOCKED
                royaltyPercent: expenses.royaltyPercent,
                irpfPercent: expenses.irpfPercent,
                updatedAt: new Date().toISOString()
            };

            await onSave(mappedData);
            // Don't close, just save toast ideally, but for now just finish
            onClose();
        } catch (error) {
            console.error("Error saving draft", error);
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
            setStatus('unlock_requested');

            alert("Solicitud enviada al administrador.");
            setShowUnlockModal(false);
            onClose();
        } catch (error) {
            console.error("Error asking for unlock", error);
        } finally {
            setSaving(false);
        }
    };

    // const _handleCopyPreviousMonth = async () => {
    //     const date = new Date(month + '-01');
    //     date.setMonth(date.getMonth() - 1);
    //     const prevMonthStr = date.toISOString().slice(0, 7);

    //     try {
    //         setLoading(true);
    //         const prevData = await financeService.getFinancialData(franchiseId, prevMonthStr);
    //         if (prevData) {
    //             const currentIncome = totalIncome;
    //             const currentOrders = orders;

    //             mapDataToState(prevData as unknown as FinancialRecord);

    //             if (currentIncome > 0) {
    //                 setTotalIncome(currentIncome);
    //                 setOrders(currentOrders);
    //             }
    //         }
    //     } catch (error) {
    //         console.error("Failed to copy", error);
    //     } finally {
    //         setLoading(false);
    //     }
    // };

    const updateExpense = (field: keyof ExpenseData, value: number) => {
        setExpenses((prev: ExpenseData) => ({ ...prev, [field]: value }));
    };



    // --- RENDER ---
    if (loading) return <div className="fixed inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-50"><div className="animate-spin text-indigo-600">Loading...</div></div>;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-all duration-500">
            {/* Backdrop with Blur */}
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

            {/* Modal Container - Glassmorphism & Apple Style */}
            <div className="bg-white/95 backdrop-blur-xl w-full max-w-5xl rounded-[32px] shadow-[0_40px_100px_-12px_rgba(0,0,0,0.1)] border border-white/60 overflow-hidden flex flex-col max-h-[85vh] relative animation-scale-in ring-1 ring-black/5">

                {/* REJECTION REASON BANNER */}
                {lastRejectionReason && (
                    <div className="bg-rose-50 border-b border-rose-100 px-5 py-2 flex items-center gap-3 shrink-0">
                        <AlertTriangle className="w-4 h-4 text-rose-500" />
                        <p className="text-xs text-rose-700 font-medium">Motivo de rechazo: <span className="font-bold">{lastRejectionReason}</span></p>
                    </div>
                )}

                {/* Header - Transparent & Breathable */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100/50">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-10 h-10 rounded-2xl bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30">
                                <Sparkles className="w-5 h-5" />
                            </div>
                            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Cierre Mensual</h2>
                        </div>
                        <p className="text-sm font-medium text-slate-400 pl-1">
                            {month}
                        </p>
                    </div>
                    {/* Progress Steps - Centered in Header */}
                    <div className="flex items-center gap-1 bg-gray-50/50 p-1 rounded-lg">
                        {WIZARD_STEPS.map((step) => {
                            const isActive = wizardStep === step.id;
                            const isPast = wizardStep > step.id;
                            return (
                                <div
                                    key={step.id}
                                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg transition-all ${isActive ? 'bg-white shadow-sm text-indigo-600 ring-1 ring-gray-200' : 'text-gray-400 hover:bg-white/50'
                                        }`}
                                >
                                    <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-indigo-500' : isPast ? 'bg-emerald-400' : 'bg-gray-300'}`} />
                                    <span className={`text-xs font-bold uppercase tracking-wider ${isActive ? 'text-indigo-900' : ''}`}>{step.title}</span>
                                </div>
                            );
                        })}
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Close Button */}
                        <button onClick={onClose} aria-label="Cerrar modal" className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-900 transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* SCROLLABLE CONTENT AREA */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-50/50 p-5">

                    {/* LOADING STATE */}
                    {loading && (
                        <div className="h-full flex items-center justify-center flex-col gap-3">
                            <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                            <p className="text-xs font-medium text-slate-400">Cargando datos...</p>
                        </div>
                    )}

                    {!loading && (
                        <div className="max-w-4xl mx-auto h-full flex flex-col">

                            {/* STEP 1: INGRESOS - Re-designed Compact Split */}
                            {wizardStep === 1 && (
                                <div className="flex flex-col lg:flex-row gap-5 h-full animate-in slide-in-from-right-4 duration-300">

                                    {/* LEFT: Income Input (Focus) */}
                                    <div className="lg:w-5/12 flex flex-col gap-4">
                                        {/* Tip */}
                                        <div className="bg-blue-50/50 border border-blue-100 p-3 rounded-xl flex gap-3">
                                            <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-xs font-bold text-blue-900">Ingresos Totales</p>
                                                <p className="text-[10px] text-blue-700 leading-relaxed mt-0.5">
                                                    Son ingresos sin IVA.
                                                </p>
                                            </div>
                                        </div>

                                        {/* APPLE HERO INPUT - Massive & Clean */}
                                        <div className="flex-1 flex flex-col justify-center items-center py-2">

                                            <div className="relative group">
                                                <div className="text-center mb-6">
                                                    <span className="inline-block px-4 py-1 rounded-full bg-slate-100/80 text-xs font-bold tracking-widest text-slate-500 uppercase backdrop-blur-md">Facturación Total</span>
                                                </div>

                                                <div className="relative flex items-baseline justify-center">
                                                    <input
                                                        type="number"
                                                        value={totalIncome || ''}
                                                        onChange={(e) => setTotalIncome(parseFloat(e.target.value) || 0)}
                                                        className="w-full max-w-[500px] text-center text-4xl tracking-tight font-medium text-slate-800 bg-transparent outline-none placeholder:text-slate-200 transition-all selection:bg-indigo-100 font-feature-settings-tnum"
                                                        placeholder="0"
                                                        aria-label="Facturación Total del Mes"
                                                    />
                                                    <span className="text-4xl font-light text-slate-400 ml-2 animate-pulse mt-4">€</span>
                                                </div>

                                                {/* Subtle Glow Effect */}
                                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-indigo-500/20 rounded-full blur-[100px] -z-10 group-focus-within:bg-indigo-500/30 transition-all duration-700" />
                                            </div>

                                        </div>
                                    </div>

                                    {/* RIGHT: Logistics Grid */}
                                    <div className="lg:w-7/12 flex flex-col h-full bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
                                        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
                                            <div className="flex items-center gap-2">
                                                <Truck className="w-4 h-4 text-gray-400" />
                                                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide">Distribución Logística</h3>
                                            </div>
                                            <button
                                                onClick={() => navigate('/profile', { state: { tab: 'logistics' } })}
                                                className="text-[10px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded transition-colors"
                                            >
                                                Configuración
                                            </button>
                                        </div>

                                        <div className="flex-1 p-4 overflow-y-auto">
                                            <div className="grid grid-cols-2 gap-4">
                                                {(logisticsRates.length > 0 ? logisticsRates : []).map((rate, index) => {
                                                    const range = rate.name || `T${index + 1}`;
                                                    // Determine visual style based on range name logic
                                                    let meta = { label: 'Tramo', color: 'text-slate-400', desc: 'General' };
                                                    if (range.includes('0-4')) meta = { label: 'Zona de Oro', color: 'text-emerald-500', desc: 'Rentabilidad Máxima' };
                                                    else if (range.includes('4-5')) meta = { label: 'Zona Estándar', color: 'text-indigo-500', desc: 'Rentabilidad Alta' };
                                                    else if (range.includes('5-6')) meta = { label: 'Zona Límite', color: 'text-amber-500', desc: 'Rentabilidad Media-Baja' };
                                                    else if (range.includes('6-7')) meta = { label: 'Zona Riesgo', color: 'text-orange-500', desc: 'Rentabilidad Baja' };
                                                    else if (range.includes('>7')) meta = { label: 'Zona Pérdidas', color: 'text-rose-500', desc: 'Destruye Valor' };

                                                    // APPLE BENTO GRID CARD
                                                    return (
                                                        <div key={index} className="bg-slate-50/50 hover:bg-white border border-slate-100/50 hover:border-slate-200/50 shadow-sm hover:shadow-xl rounded-2xl p-3 flex flex-col items-center justify-between transition-all duration-300 group cursor-default h-[130px]">

                                                            <div className="w-full flex justify-between items-start">
                                                                <div className="flex flex-col">
                                                                    <span className={`text-[10px] font-bold tracking-widest uppercase ${meta.color}`}>{meta.label}</span>
                                                                    <span className="text-[11px] font-medium text-slate-400 mt-0.5">{range}</span>
                                                                </div>
                                                                <div className={`w-8 h-8 rounded-full ${meta.color.replace('text-', 'bg-').replace('500', '100')} flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity`}>
                                                                    <MapPin className={`w-3.5 h-3.5 ${meta.color}`} />
                                                                </div>
                                                            </div>

                                                            <input
                                                                type="number"
                                                                value={(rate.name && orders[rate.name]) || ''}
                                                                onChange={(e) => rate.name && setOrders((prev: OrderCounts) => ({ ...prev, [rate.name!]: parseInt(e.target.value) || 0 }))}
                                                                className="w-full text-center bg-transparent text-4xl font-semibold tracking-tighter text-slate-800 outline-none placeholder:text-slate-200 transition-colors focus:text-indigo-600 focus:scale-110 duration-200"
                                                                placeholder="0"
                                                                aria-label={`Pedidos para ${range}`}
                                                            />

                                                            <div className="w-full border-t border-slate-100 pt-3 mt-1">
                                                                <p className="text-[9px] font-bold text-slate-400 text-center uppercase tracking-wide opacity-60 group-hover:opacity-100 transition-opacity">{meta.desc}</p>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div className="bg-slate-900 p-4 text-white flex items-center justify-between">
                                            <div className="flex gap-6">
                                                <div>
                                                    <span className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-0.5">Volumen</span>
                                                    <span className="font-mono text-xl font-bold">{stats.totalOrders}</span>
                                                </div>
                                                <div>
                                                    <span className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-0.5">KM Recorridos</span>
                                                    <span className="font-mono text-xl font-bold text-emerald-400">{Math.round(stats.estimatedKm)}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Cancelados:</span>
                                                <input
                                                    type="number"
                                                    value={cancelledOrders}
                                                    onChange={(e) => setCancelledOrders(parseInt(e.target.value) || 0)}
                                                    className="w-16 bg-slate-800 border border-slate-700 rounded-lg text-center font-bold text-rose-400 text-lg py-1 focus:ring-2 focus:ring-rose-500/50 outline-none transition-all"
                                                    aria-label="Pedidos Cancelados"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STEP 2: COSTES - Compact List */}
                            {wizardStep === 2 && (
                                <div className="h-full flex flex-col gap-4 animate-in slide-in-from-right-4 duration-300">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full overflow-y-auto pr-1">

                                        {/* GROUP 1: PERSONAL */}
                                        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                                            <h4 className="text-xs font-bold text-gray-900 border-b border-gray-100 pb-2 mb-3 flex items-center gap-2">
                                                <Users className="w-3.5 h-3.5 text-indigo-500" /> Equipo
                                            </h4>

                                            {/* iOS Inset Group */}
                                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50">
                                                <div className="flex justify-between items-center p-2.5 hover:bg-slate-50 transition-colors group">
                                                    <label className="text-sm text-slate-600 font-medium">Total Horas</label>
                                                    <div className="flex items-center gap-2">
                                                        <input type="number"
                                                            value={totalHours || ''}
                                                            onChange={(e) => setTotalHours(parseFloat(e.target.value) || 0)}
                                                            className="w-24 text-right bg-transparent text-xl font-semibold text-slate-700 outline-none placeholder:text-gray-300"
                                                            placeholder="0"
                                                        />
                                                        <span className="text-sm text-slate-400 font-medium">h</span>
                                                    </div>
                                                </div>
                                                <div className="flex justify-between items-center p-2.5 hover:bg-slate-50 transition-colors group">
                                                    <label className="text-sm text-slate-600 font-medium">Nóminas + Seg. Social</label>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="number"
                                                            value={(expenses.payroll || 0) + (expenses.socialSecurity || 0) || ''}
                                                            onChange={(e) => {
                                                                // Simple logic: Assign all to payroll for simplicity as requested, keep SS 0 or split if needed. 
                                                                // User asked to join them, so we just treat the input as the sum. 
                                                                // We will assign to payroll and zero out SS to avoid double counting if logic changes.
                                                                const val = parseFloat(e.target.value) || 0;
                                                                setExpenses({ ...expenses, payroll: val, socialSecurity: 0 });
                                                            }}
                                                            className="w-24 text-right bg-transparent text-xl font-semibold text-slate-700 outline-none placeholder:text-gray-300"
                                                            placeholder="0"
                                                        />
                                                        <span className="text-sm text-slate-400 font-medium">€</span>
                                                    </div>
                                                </div>
                                                <div className="flex justify-between items-center p-2.5 hover:bg-slate-50 transition-colors group">
                                                    <label className="text-sm text-slate-600 font-medium">Cuota Autónomo</label>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="number"
                                                            value={expenses.quota || ''}
                                                            onChange={(e) => updateExpense('quota', parseFloat(e.target.value))}
                                                            className="w-24 text-right bg-transparent text-xl font-semibold text-slate-700 outline-none placeholder:text-gray-300"
                                                            placeholder="0.00"
                                                        />
                                                        <span className="text-sm text-slate-400 font-medium">€</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Flota - iOS Style */}
                                        <div className="bg-slate-50/50 p-4 rounded-2xl border border-white/60">
                                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2 pl-2">
                                                <Truck className="w-3.5 h-3.5 text-emerald-500" /> Flota y Renting
                                            </h4>

                                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50">
                                                <div className="flex items-center divide-x divide-gray-50">
                                                    <div className="flex-1 p-2 hover:bg-slate-50 transition-colors">
                                                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Nº Motos</label>
                                                        <input type="number" value={expenses.renting?.count || ''} onChange={(e) => setExpenses({ ...expenses, renting: { ...(expenses.renting || { pricePerUnit: 159 }), count: parseFloat(e.target.value) || 0 } })} className="w-full bg-transparent text-2xl font-bold text-slate-800 outline-none" placeholder="0" />
                                                    </div>
                                                    <div className="flex-1 p-2 hover:bg-slate-50 transition-colors">
                                                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Precio/U</label>
                                                        <input type="number" value={expenses.renting?.pricePerUnit || ''} onChange={(e) => setExpenses(prev => ({ ...prev, renting: { ...prev.renting!, pricePerUnit: parseFloat(e.target.value) || 0 } }))} className="w-full bg-transparent text-2xl font-bold text-slate-800 outline-none" placeholder="0" />
                                                    </div>
                                                </div>
                                                <div className="flex justify-between items-center p-2 hover:bg-slate-50 transition-colors">
                                                    <label className="text-sm text-slate-600 font-medium">Gasolina</label>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="number"
                                                            value={expenses.fuel || ''}
                                                            onChange={(e) => updateExpense('fuel', parseFloat(e.target.value))}
                                                            className="w-24 text-right bg-transparent text-xl font-semibold text-slate-700 outline-none placeholder:text-gray-300"
                                                            placeholder="0.00"
                                                        />
                                                        <span className="text-sm text-slate-400 font-medium">€</span>
                                                    </div>
                                                </div>
                                                <div className="flex justify-between items-center p-2 hover:bg-slate-50 transition-colors">
                                                    <label className="text-sm text-slate-600 font-medium">Reparaciones</label>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="number"
                                                            value={expenses.repairs || ''}
                                                            onChange={(e) => updateExpense('repairs', parseFloat(e.target.value))}
                                                            className="w-24 text-right bg-transparent text-xl font-semibold text-slate-700 outline-none placeholder:text-gray-300"
                                                            placeholder="0.00"
                                                        />
                                                        <span className="text-sm text-slate-400 font-medium">€</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* GROUP 3: LOCAL & ESTRUCTURA */}
                                        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm md:col-span-2">
                                            <h4 className="text-xs font-bold text-gray-900 border-b border-gray-100 pb-2 mb-3 flex items-center gap-2">
                                                <Building className="w-3.5 h-3.5 text-blue-500" /> Estructura
                                            </h4>

                                            {/* iOS Grid Layout */}
                                            <div className="mt-1">
                                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                                                    {[
                                                        { label: 'Servicios Repaart', key: 'professionalServices' }, // Was Alquiler
                                                        { label: 'Gestoría', key: 'agencyFee' },
                                                        { label: 'Seguros', key: 'insurance' }, // Was Seguro HC
                                                        { label: 'Marketing', key: 'marketing' },
                                                        { label: 'Royalty %', key: 'royaltyPercent' },
                                                        { label: 'IRPF %', key: 'irpfPercent' },
                                                        { label: 'Flyder', key: 'appFlyder' }, // Was Software
                                                        { label: 'Otros', key: 'other' }
                                                    ].map((item, idx) => {
                                                        const val = expenses[item.key as keyof ExpenseData];
                                                        const displayVal = typeof val === 'number' ? val : '';

                                                        return (
                                                            <div key={idx} className="bg-slate-50/50 hover:bg-indigo-50/30 p-2 rounded-xl transition-colors cursor-pointer group border border-transparent hover:border-indigo-100">
                                                                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block group-hover:text-indigo-400 transition-colors">{item.label}</label>
                                                                <div className="flex items-baseline gap-1">
                                                                    <input
                                                                        type="number"
                                                                        value={displayVal}
                                                                        onChange={(e) => updateExpense(item.key as keyof ExpenseData, parseFloat(e.target.value))}
                                                                        className="w-full bg-transparent text-lg font-bold text-slate-700 outline-none border-b border-transparent focus:border-indigo-300 transition-all placeholder:text-gray-200"
                                                                    />
                                                                    <span className="text-sm text-slate-300 font-medium">€</span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            )}

                            {/* STEP 3: ANALISIS */}
                            {wizardStep === 3 && (
                                <div className="h-full flex flex-col gap-4 animate-in slide-in-from-right-4 duration-300 overflow-y-auto pr-1">

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <CfoHeroWidget safeToSpend={stats.safeToSpend} amortization={stats.amortizationCost} netResult={stats.netResultAfterAmortization} />
                                        <BreakEvenWidget fixedCosts={stats.fixedCosts} variableCosts={stats.variableCosts} revenue={totalIncome} totalOrders={stats.totalOrders} />
                                    </div>

                                    <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Health Check</h4>
                                        <ActiveHealthCheck tips={allTips} />
                                    </div>

                                </div>
                            )}

                        </div>
                    )}
                </div>

                {/* MODAL FOOTER - Compact & Action Oriented */}
                <div className="p-6 border-t border-gray-100 bg-white/50 backdrop-blur-md flex justify-end items-center gap-3">
                    {wizardStep > 1 && (
                        <button
                            onClick={() => setWizardStep(Math.max(1, wizardStep - 1))}
                            className="px-6 py-2.5 rounded-xl border border-gray-200 text-slate-600 font-bold text-sm hover:bg-gray-50 transition-colors active:scale-95"
                        >
                            Atrás
                        </button>
                    )}

                    {!isLocked && (
                        <button
                            onClick={handleSaveDraft}
                            disabled={saving}
                            className="px-6 py-2.5 rounded-xl bg-indigo-50 text-indigo-600 font-bold text-sm hover:bg-indigo-100 transition-all disabled:opacity-50 active:scale-95"
                        >
                            {saving ? '...' : 'Guardar Borrador'}
                        </button>
                    )}

                    {wizardStep === 3 ? (
                        <button
                            onClick={handleSave}
                            disabled={saving || isLocked}
                            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-lg shadow-indigo-500/20 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {saving ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                            {isLocked ? 'Solicitar Desbloqueo' : 'Confirmar Cierre'}
                        </button>
                    ) : (
                        <button
                            onClick={() => setWizardStep(Math.min(3, wizardStep + 1))}
                            className="flex items-center gap-2 px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-lg shadow-slate-900/10 transition-all active:scale-95"
                        >
                            Siguiente <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>

            </div >

            {/* UNLOCK MODAL OVERLAY (Keep existing logic if any, or inline) */}
            {
                showUnlockModal && (
                    <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
                        <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full animate-in zoom-in-95">
                            <div className="bg-amber-100 w-12 h-12 rounded-full flex items-center justify-center mb-4 mx-auto">
                                <Lock className="w-6 h-6 text-amber-600" />
                            </div>
                            <h3 className="text-lg font-bold text-center text-gray-900 mb-2">Solicitar Desbloqueo</h3>
                            <p className="text-xs text-center text-gray-500 mb-6">Explica por qué necesitas modificar este cierre.</p>

                            <textarea
                                value={unlockReason}
                                onChange={(e) => setUnlockReason(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-amber-500/20 outline-none mb-4"
                                rows={3}
                                placeholder="Motivo del desbloqueo..."
                            />

                            <div className="flex gap-3">
                                <button onClick={() => setShowUnlockModal(false)} className="flex-1 py-2 text-xs font-bold text-gray-500 hover:bg-gray-50 rounded-xl">Cancelar</button>
                                <button onClick={submitUnlockRequest} className="flex-1 py-2 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl shadow-lg shadow-amber-500/20">Enviar Solicitud</button>
                            </div>
                        </div>
                    </div>
                )
            }

        </div >
    );
};

// --- HELPER COMPONENTS ---



export default FinancialControlCenter;
