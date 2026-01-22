import React, { useState, useEffect } from 'react';
import { PieChart, Wallet, X, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
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
    repaartServices?: number;
}




    const FRANCHISE_CONFIG = {
    packType: 'PREMIUM',
    entryFee: 3000,
    amortizationMonths: 12,
    laborCostHour: 11.64,
    targetPPH: 3.2,
    flyderFee: 0.35,
    hasAccounting: true,
    hasAnalytics: true
};

const REAL_DIST_FACTORS = {
    range_0_4: 2.9,
    range_4_5: 8.0,
    range_5_7: 10.4,
    range_7_plus: 15.9
};



// --- HELPER: KM ESTIMATION (UPDATED) ---
const estimateTotalKm = (orders: OrderCounts): number => {
    const km0_4 = (orders['0-4 km'] || 0) * REAL_DIST_FACTORS.range_0_4;
    const km4_5 = (orders['4-5 km'] || 0) * REAL_DIST_FACTORS.range_4_5;
    const km5_6 = (orders['5-6 km'] || 0) * REAL_DIST_FACTORS.range_5_7;
    const km6_7 = (orders['6-7 km'] || 0) * REAL_DIST_FACTORS.range_5_7;
    const kmGt7 = (orders['>7 km'] || 0) * REAL_DIST_FACTORS.range_7_plus;
    return km0_4 + km4_5 + km5_6 + km6_7 + kmGt7;
};



// --- PROFESSIONAL UI COMPONENTS ---

const ProfessionalCard = ({ title, children, className, icon: Icon, action }: { title?: string, children: React.ReactNode, className?: string, icon?: any, action?: React.ReactNode }) => (
    <div className={`
        bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-xl
        shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] transition-all duration-300 backdrop-blur-sm h-full flex flex-col overflow-hidden group/card
        ${className}
    `}>
        {title && (
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700/30 bg-gradient-to-b from-white to-slate-50/50 dark:from-slate-800 dark:to-slate-800/50 shrink-0">
                <div className="flex items-center gap-3">
                    {Icon && (
                        <div className="p-1.5 rounded-lg bg-indigo-50/50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-100 dark:ring-indigo-500/20 shadow-sm group-hover/card:scale-110 transition-transform duration-300">
                            <Icon className="w-4 h-4" strokeWidth={2} />
                        </div>
                    )}
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 tracking-tight">{title}</h3>
                </div>
                {action && <div>{action}</div>}
            </div>
        )}
        <div className="flex-1 min-h-0 overflow-y-auto p-6">{children}</div>
    </div>
);

const ProfessionalInput = ({ label, value, onChange, prefix, suffix, type = "number", className, placeholder, size = "default", readOnly = false }: any) => (
    <div className={`group relative ${className}`}>
        <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 ml-1 transition-colors group-focus-within:text-indigo-600 truncate">
            {label}
        </label>
        <div className={`
            flex items-center rounded-xl overflow-hidden transition-all duration-200
            ${readOnly 
                ? 'bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200/50 dark:border-slate-800' 
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm hover:border-indigo-200 dark:hover:border-indigo-800 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10'
            }
            ${size === 'small' ? 'h-9' : 'h-11'}
        `}>
            {prefix && (
                <div className={`
                    pl-3 pr-2.5 text-[11px] font-bold select-none h-full flex items-center
                    ${readOnly 
                        ? 'bg-transparent text-slate-400' 
                        : 'bg-slate-50/50 dark:bg-slate-800/50 text-slate-500 border-r border-slate-100 dark:border-slate-700'
                    }
                `}>
                    {prefix}
                </div>
            )}
            <input
                type={type}
                value={value || ''}
                onChange={e => !readOnly && onChange(type === "number" ? parseFloat(e.target.value) || 0 : e.target.value)}
                placeholder={placeholder || "0"}
                readOnly={readOnly}
                className={`
                    w-full bg-transparent border-none text-slate-900 dark:text-white font-mono font-medium focus:ring-0 placeholder-slate-300 px-3
                    ${size === 'small' ? 'text-sm py-1' : 'text-base py-2'}
                    ${readOnly ? 'cursor-default text-slate-500' : ''}
                `}
            />
            {suffix && (
                <div className={`
                    pr-3 pl-2.5 text-[11px] font-bold select-none h-full flex items-center
                    ${readOnly 
                        ? 'bg-transparent text-slate-400' 
                        : 'bg-slate-50/50 dark:bg-slate-800/50 text-slate-500 border-l border-slate-100 dark:border-slate-700'
                    }
                `}>
                    {suffix}
                </div>
            )}
        </div>
    </div>
);

// --- MAIN COMPONENT ---

interface FinancialRecord {
    revenue?: number;
    totalIncome?: number;
    totalHours?: number;
    cancelledOrders?: number;
    status?: 'pending' | 'draft' | 'submitted' | 'approved' | 'unlock_requested' | 'locked' | 'open';
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
    socialSecurity?: number;
    repaartServices?: number;
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
    franchiseId, month, onClose, onSave, initialData
}) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState<'pending' | 'draft' | 'submitted' | 'approved' | 'unlock_requested' | 'locked' | 'open'>('draft');
    const [step, setStep] = useState<1 | 2>(1);

    // State
    const [orders, setOrders] = useState<OrderCounts>({});
    const [cancelledOrders, setCancelledOrders] = useState(0);
    const [totalIncome, setTotalIncome] = useState(0);
    const [totalHours, setTotalHours] = useState(0);
    const [expenses, setExpenses] = useState<ExpenseData>({
        payroll: 0, quota: 0, insurance: 0, fuel: 0, repairs: 0,
        renting: { count: 0, pricePerUnit: 0 },
        agencyFee: 0, prlFee: 0, accountingFee: 0, professionalServices: 0,
        appFlyder: 0, marketing: 0, incidents: 0, other: 0,
        royaltyPercent: 5, irpfPercent: 20, repaartServices: 0, socialSecurity: 0
    });
    const [logisticsRates, setLogisticsRates] = useState<LogisticsRate[]>([]);

    const isLocked = status === 'submitted' || status === 'approved' || status === 'unlock_requested' || status === 'locked';

    // --- LOGIC ---
    useEffect(() => {
        if (logisticsRates.length > 0) {
            let calculatedIncome = 0;
            Object.entries(orders).forEach(([range, count]) => {
                const rate = logisticsRates.find(r => r.name === range || `${r.min}-${r.max} km` === range);
                if (rate && typeof rate.price === 'number') calculatedIncome += count * rate.price;
            });
            if (!isNaN(calculatedIncome) && calculatedIncome !== totalIncome) {
                if (calculatedIncome > 0 || Object.keys(orders).length > 0) setTotalIncome(calculatedIncome);
            }
        }
    }, [orders, logisticsRates, totalIncome]);

    useEffect(() => {
        async function loadData() {
            if (!franchiseId || !month) return;
            try {
                // Parse current year and month index from "YYYY-MM" string (e.g., "2026-01")
                const [yearStr, monthStr] = month.split('-');
                const currentYear = parseInt(yearStr);
                const currentMonthIndex = parseInt(monthStr) - 1; // 0-based index

                const [data, yearlyData] = await Promise.all([
                    initialData || await financeService.getFinancialData(franchiseId, month) as FinancialRecord,
                    financeService.getFinancialYearlyData(franchiseId, currentYear)
                ]);

                // Calculate YTD Profit
                // Sum profits of all months <= currentMonthIndex
                // Note: yearlyData might be keyed by month name or index. efficient approach: filter relevant months.
                // Assuming yearlyData is an array or object. Let's look at typical usage, usually it returns an object keyed by month.
                // Since I can't inspect the ReturnType easily at runtime, I'll assume standard service behavior or fetch all if needed.
                // Standard financeService.getFinancialYearlyData usually returns a map or list. 
                // Let's iterate. If it returns map: Object.values(yearlyData).

                let prevMonthsYtd = 0;

                if (Array.isArray(yearlyData)) {
                    console.log(`[FinancialControlCenter] Calculating YTD for ${currentYear} up to month index ${currentMonthIndex}`);
                    yearlyData.forEach((record: any) => {
                        // 1. Determine Month Index
                        let recordMonthIndex = -1;
                        let recordYear = -1;

                        if (record.month && typeof record.month === 'string' && record.month.includes('-')) {
                            // Format: "YYYY-MM"
                            const parts = record.month.split('-');
                            recordYear = parseInt(parts[0]);
                            recordMonthIndex = parseInt(parts[1]) - 1;
                        } else if (record.date) {
                            // Date Object or Timestamp
                            try {
                                const d = record.date.toDate ? record.date.toDate() : new Date(record.date);
                                recordYear = d.getFullYear();
                                recordMonthIndex = d.getMonth();
                            } catch (e) { console.warn("Date parse error", e); }
                        } else if (record.id && typeof record.id === 'string') {
                            // Fallback: Try to extract from ID "franchiseId_YYYY-MM"
                            const parts = record.id.split('_');
                            const potentialDate = parts[parts.length - 1]; // "YYYY-MM"
                            if (potentialDate && potentialDate.match(/^\d{4}-\d{2}$/)) {
                                const dParts = potentialDate.split('-');
                                recordYear = parseInt(dParts[0]);
                                recordMonthIndex = parseInt(dParts[1]) - 1;
                            }
                        }

                        // 2. Validate Year (Security check, though Service should have filtered)
                        if (recordYear !== currentYear) return;

                        // 3. Sum if strictly previous month
                        if (recordMonthIndex >= 0 && recordMonthIndex < currentMonthIndex) {
                            let val = 0;
                            if (typeof record.netResultAfterAmortization === 'number') val = record.netResultAfterAmortization;
                            else if (typeof record.profit === 'number') val = record.profit;
                            else val = (Number(record.revenue || record.totalIncome || 0) - Number(record.expenses || record.totalExpenses || 0));

                            console.log(`[YTD] Adding month ${recordMonthIndex + 1}: ${val}`);
                            prevMonthsYtd += val;
                        }
                    });
                }

                console.log(`[FinancialControlCenter] Total Previous YTD: ${prevMonthsYtd}`);

                let profile;
                if (user?.role === 'franchise' && user?.uid) profile = await userService.getUserProfile(user.uid);
                else profile = await userService.getUserByFranchiseId(franchiseId);

                if (profile && profile.logisticsRates) setLogisticsRates(profile.logisticsRates);
                if (data && Object.keys(data).length > 0) mapDataToState(data);
            } catch (err) { console.error("Error loading data", err); }
            finally { setLoading(false); }
        }
        loadData();
    }, [franchiseId, month, initialData, user?.role, user?.uid]);

    const mapDataToState = (data: FinancialRecord) => {
        setTotalIncome(data.revenue || data.totalIncome || 0);
        setTotalHours(data.totalHours || 0);
        setCancelledOrders(data.cancelledOrders || 0);
        setStatus(data.status || 'draft');

        const reconstructedOrders: OrderCounts = {};
        if (data.ordersDetail) Object.assign(reconstructedOrders, data.ordersDetail);
        else {
            if (data.ordersNew0To4) reconstructedOrders['0-4 km'] = data.ordersNew0To4;
            if (data.ordersNew4To5) reconstructedOrders['4-5 km'] = data.ordersNew4To5;
            if (data.ordersNew5To6) reconstructedOrders['5-6 km'] = data.ordersNew5To6;
            if (data.ordersNew6To7) reconstructedOrders['6-7 km'] = data.ordersNew6To7;
            if (data.ordersNewGt7) reconstructedOrders['>7 km'] = data.ordersNewGt7;
        }
        setOrders(reconstructedOrders);
        setExpenses({
            payroll: data.salaries || 0, quota: data.quota || 0, insurance: data.insurance || 0,
            fuel: data.gasoline || 0, repairs: data.repairs || 0,
            renting: { count: data.motoCount || 0, pricePerUnit: (data.motoCount && Number.isFinite(Number(data.rentingCost))) ? Number(data.rentingCost) / data.motoCount : 154 },
            agencyFee: data.agencyFee || 0, prlFee: data.prlFee || 0, accountingFee: data.accountingFee || 0,
            professionalServices: data.services || 0, appFlyder: data.appFlyder || 0, marketing: data.marketing || 0,
            incidents: data.incidents || 0, other: data.otherExpenses || 0,
            royaltyPercent: data.royaltyPercent ?? 5, irpfPercent: data.irpfPercent ?? 20,
            repaartServices: data.repaartServices || 0, socialSecurity: data.socialSecurity || 0
        });
    };

    const calculateStats = () => {
        const rentingTotal = (expenses.renting?.count ?? 0) * (expenses.renting?.pricePerUnit ?? 0);
        const royaltyAmount = totalIncome * ((expenses.royaltyPercent || 5) / 100);
        const fixedCosts = (expenses.payroll ?? 0) + (expenses.socialSecurity ?? 0) + (expenses.quota ?? 0) +
            (expenses.insurance ?? 0) + (expenses.agencyFee ?? 0) + (expenses.prlFee ?? 0) +
            (expenses.accountingFee ?? 0) + (expenses.professionalServices ?? 0) + (expenses.appFlyder ?? 0) + (expenses.marketing ?? 0) +
            (expenses.repaartServices ?? 0);
        const variableCosts = (expenses.fuel ?? 0) + (expenses.repairs ?? 0) + rentingTotal + (expenses.incidents ?? 0) + (expenses.other ?? 0) + royaltyAmount;
        const totalExpenses = fixedCosts + variableCosts;
        const grossMargin = totalIncome - totalExpenses;
        const amortizationCost = FRANCHISE_CONFIG.entryFee / FRANCHISE_CONFIG.amortizationMonths;
        const netResultAfterAmortization = grossMargin - amortizationCost;
        const safeToSpend = grossMargin > 0 ? grossMargin * 0.80 : 0;
        const totalOrders = Object.values(orders).reduce((sum, count) => sum + count, 0);
        const estimatedKm = estimateTotalKm(orders);
        return { totalExpenses, profit: grossMargin, grossMargin, amortizationCost, netResultAfterAmortization, safeToSpend, fixedCosts, variableCosts, royaltyAmount, totalOrders, estimatedKm };
    };

    const stats = calculateStats();



    // Save Logic (Simplified for brevity but functional)
    const handleSaveData = async (shouldLock: boolean = false) => {
        if (!onSave) return;
        setSaving(true);
        try {
            const persistenceStatus = shouldLock ? 'locked' : (status === 'locked' ? 'locked' : 'draft');
            const persistenceData: any = { // Using any to reuse existing mapping structure easily
                month, totalHours, totalIncome, revenue: totalIncome, grossIncome: totalIncome,
                salaries: expenses.payroll, socialSecurity: expenses.socialSecurity, quota: expenses.quota, insurance: expenses.insurance,
                gasoline: expenses.fuel, repairs: expenses.repairs,
                motoCount: expenses.renting?.count ?? 0,
                rentingCost: (expenses.renting?.count ?? 0) * (expenses.renting?.pricePerUnit ?? 0),
                agencyFee: expenses.agencyFee, prlFee: expenses.prlFee, accountingFee: expenses.accountingFee, services: expenses.professionalServices,
                appFlyder: expenses.appFlyder, marketing: expenses.marketing, incidents: expenses.incidents, otherExpenses: expenses.other,
                repaartServices: expenses.repaartServices,
                totalExpenses: stats.totalExpenses, expenses: stats.totalExpenses, profit: stats.profit,
                orders: stats.totalOrders, ordersDetail: orders, cancelledOrders,
                status: persistenceStatus, is_locked: shouldLock,
                royaltyPercent: expenses.royaltyPercent, irpfPercent: expenses.irpfPercent,
                updatedAt: new Date().toISOString()
            };

            // Legacy mapping
            if (orders['0-4 km']) persistenceData.ordersNew0To4 = orders['0-4 km'];
            if (orders['4-5 km']) persistenceData.ordersNew4To5 = orders['4-5 km'];
            if (orders['5-6 km']) persistenceData.ordersNew5To6 = orders['5-6 km'];
            if (orders['6-7 km']) persistenceData.ordersNew6To7 = orders['6-7 km'];
            if (orders['>7 km']) persistenceData.ordersNewGt7 = orders['>7 km'];

            await onSave(persistenceData);
            if (shouldLock) {
                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#4f46e5', '#818cf8', '#c7d2fe']
                });
                await notificationService.notify('FINANCE_CLOSING', franchiseId, 'Franquicia', {
                    title: `Cierre: ${month}`, message: 'Cierre enviado.', priority: 'normal',
                    metadata: { month, profit: stats.profit, status: 'locked' }
                });
            }
            if (shouldLock) onClose();
            else alert("Guardado como borrador");
        } catch (e) { console.error(e); } finally { setSaving(false); }
    };

    if (loading) return (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-xl flex flex-col items-center gap-4">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Cargando datos financieros...</p>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/60 backdrop-blur-md p-4 pt-8 lg:pt-12 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-[95vw] lg:max-w-[1200px] h-[85vh] max-h-[800px] rounded-2xl shadow-2xl flex flex-col overflow-hidden ring-1 ring-slate-900/5 dark:ring-slate-800">
                
                {/* Header Compacto */}
                <div className="h-14 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md flex items-center justify-between px-6 shrink-0 relative z-20 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg shadow-sm text-white">
                            <Activity className="w-4 h-4" strokeWidth={2} />
                        </div>
                        <div>
                            <h1 className="text-base font-bold text-slate-900 dark:text-white tracking-tight leading-none">Cierre Financiero</h1>
                            <p className="text-[10px] text-slate-500 font-bold tracking-wide mt-0.5 opacity-80">PERIODO: {month.toUpperCase()}</p>
                        </div>
                    </div>
                    
                    {/* Stepper Integrado en Header */}
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-lg">
                        <button 
                            onClick={() => !isLocked && setStep(1)}
                            className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${step === 1 ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            1. Ingresos
                        </button>
                        <button 
                            onClick={() => !isLocked && setStep(2)}
                            className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${step === 2 ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            2. Gastos
                        </button>
                    </div>

                    <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-400">
                        <X className="w-4 h-4" strokeWidth={2.5} />
                    </button>
                </div>

                {/* Main Content - Zero Scroll Layout */}
                <div className="flex-1 min-h-0 bg-slate-50 dark:bg-slate-950 p-4 relative overflow-hidden">
                    <AnimatePresence mode="wait">
                        {/* STEP 1: REVENUE - 2 COLUMNS LAYOUT */}
                        {step === 1 && (
                            <motion.div 
                                key="step1"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.2 }}
                                className="h-full"
                            >
                                <div className="grid grid-cols-2 gap-4 h-full">
                                    {/* Left: Km Breakdown */}
                                    <ProfessionalCard title="Desglose por Distancia" icon={Wallet} className="h-full">
                                        <div className="flex flex-col h-full gap-2">
                                            {['0-4 km', '4-5 km', '5-6 km', '6-7 km', '>7 km'].map((range, index) => (
                                                <div key={range} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 group transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-800">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`
                                                            w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold
                                                            ${index === 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                                                index === 1 ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' :
                                                                    index === 2 ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400' :
                                                                        index === 3 ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400' :
                                                                            'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'}
                                                        `}>
                                                            {index + 1}
                                                        </div>
                                                        <div>
                                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">{range}</span>
                                                            <span className="text-[9px] font-medium text-slate-400 uppercase tracking-wide">Pedidos</span>
                                                        </div>
                                                    </div>
                                                    <div className="w-24">
                                                        <input
                                                            type="number"
                                                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-right text-sm font-bold py-1 px-2 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono text-slate-900 dark:text-white"
                                                            value={orders[range] || ''}
                                                            onChange={(e) => setOrders(prev => ({ ...prev, [range]: parseInt(e.target.value) || 0 }))}
                                                            disabled={isLocked}
                                                            placeholder="0"
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                            <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center px-2">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Pedidos</span>
                                                <span className="text-sm font-black text-slate-900 dark:text-white tabular-nums">
                                                    {Object.values(orders).reduce((sum, count) => sum + count, 0)}
                                                </span>
                                            </div>
                                        </div>
                                    </ProfessionalCard>

                                    {/* Right: Totals & Adjustments */}
                                    <div className="flex flex-col gap-4 h-full">
                                        <ProfessionalCard title="Ajustes" className="flex-shrink-0">
                                            <ProfessionalInput label="Pedidos Cancelados" value={cancelledOrders} onChange={setCancelledOrders} type="number" size="small" />
                                        </ProfessionalCard>
                                        
                                        <div className="flex-1 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-xl p-6 shadow-xl shadow-indigo-500/20 flex flex-col justify-center items-center text-center relative overflow-hidden group border border-indigo-500/50">
                                            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                                            <div className="relative z-10">
                                                <p className="text-[10px] font-bold text-indigo-100 uppercase tracking-[0.2em] mb-3 opacity-80">Ingreso Bruto Total</p>
                                                <div className="flex items-baseline justify-center gap-1 mb-6">
                                                    <span className="text-5xl font-black text-white tracking-tighter tabular-nums drop-shadow-sm">
                                                        {formatMoney(totalIncome).split(',')[0]}
                                                    </span>
                                                    <span className="text-2xl font-bold text-indigo-200">,{formatMoney(totalIncome).split(',')[1]}€</span>
                                                </div>
                                                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/10 max-w-[220px] mx-auto">
                                                    <label className="block text-[9px] font-bold text-indigo-200 uppercase tracking-wider mb-1 text-left">Ajuste Manual (€)</label>
                                                    <input 
                                                        type="number" 
                                                        value={totalIncome}
                                                        onChange={(e) => setTotalIncome(parseFloat(e.target.value) || 0)}
                                                        className="w-full bg-transparent border-b border-indigo-300/30 text-white font-mono font-bold text-sm focus:outline-none focus:border-white py-1 text-center placeholder-indigo-300/50"
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 2: EXPENSES - HORIZONTAL GRID LAYOUT */}
                        {step === 2 && (
                            <motion.div 
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                                className="h-full flex flex-col"
                            >
                                <ProfessionalCard 
                                    title="Estructura de Costes" 
                                    icon={PieChart}
                                    action={
                                        <div className="flex items-center gap-3 bg-rose-50 dark:bg-rose-900/20 px-3 py-1 rounded-lg border border-rose-100 dark:border-rose-900/30">
                                            <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400">Total</span>
                                            <span className="text-lg font-black text-rose-600 dark:text-rose-400 tabular-nums">-{formatMoney(stats.totalExpenses)}€</span>
                                        </div>
                                    }
                                    className="h-full"
                                >
                                    <div className="flex flex-col gap-3 h-full">
                                        {/* Row 1: Personal & Horas */}
                                        <div className="grid grid-cols-4 gap-3">
                                            <ProfessionalInput label="Salarios" value={expenses.payroll} onChange={(v: number) => setExpenses(e => ({ ...e, payroll: v }))} prefix="€" size="small" />
                                            <ProfessionalInput label="Seguros Sociales" value={expenses.socialSecurity} onChange={(v: number) => setExpenses(e => ({ ...e, socialSecurity: v }))} prefix="€" size="small" />
                                            <ProfessionalInput label="Cuota Autónomo" value={expenses.quota} onChange={(v: number) => setExpenses(e => ({ ...e, quota: v }))} prefix="€" size="small" />
                                            <ProfessionalInput label="Horas Operativas" value={totalHours} onChange={setTotalHours} type="number" size="small" />
                                        </div>

                                        <div className="h-px bg-slate-100 dark:bg-slate-800" />

                                        {/* Row 2: Flota */}
                                        <div className="grid grid-cols-5 gap-3">
                                            <ProfessionalInput label="Renting (Unds)" value={expenses.renting?.count} onChange={(v: number) => setExpenses(e => ({ ...e, renting: { ...e.renting!, count: v } }))} size="small" />
                                            <ProfessionalInput label="Precio Unit. (€)" value={expenses.renting?.pricePerUnit} onChange={(v: number) => setExpenses(e => ({ ...e, renting: { ...e.renting!, pricePerUnit: v } }))} size="small" />
                                            <div className="flex flex-col justify-center px-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-800">
                                                <span className="text-[9px] text-slate-400 font-bold uppercase">Total Renting</span>
                                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{formatMoney((expenses.renting?.count || 0) * (expenses.renting?.pricePerUnit || 0))}€</span>
                                            </div>
                                            <ProfessionalInput label="Gasolina" value={expenses.fuel} onChange={(v: number) => setExpenses(e => ({ ...e, fuel: v }))} prefix="€" size="small" />
                                            <ProfessionalInput label="Reparaciones" value={expenses.repairs} onChange={(v: number) => setExpenses(e => ({ ...e, repairs: v }))} prefix="€" size="small" />
                                        </div>

                                        <div className="h-px bg-slate-100 dark:bg-slate-800" />

                                        {/* Row 3: Estructura & Tech */}
                                        <div className="grid grid-cols-5 gap-3">
                                            <div className="flex flex-col justify-center px-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800/30">
                                                <span className="text-[9px] text-indigo-400 font-bold uppercase">Royalty Base</span>
                                                <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">{formatMoney(stats.royaltyAmount)}€</span>
                                            </div>
                                            <ProfessionalInput label="Royalty %" value={expenses.royaltyPercent} onChange={(v: number) => setExpenses(e => ({ ...e, royaltyPercent: v }))} suffix="%" size="small" />
                                            <ProfessionalInput label="App Flyder" value={expenses.appFlyder} onChange={(v: number) => setExpenses(e => ({ ...e, appFlyder: v }))} prefix="€" size="small" />
                                            <ProfessionalInput label="Gestoría" value={expenses.agencyFee} onChange={(v: number) => setExpenses(e => ({ ...e, agencyFee: v }))} prefix="€" size="small" />
                                            <ProfessionalInput label="Seguros RC" value={expenses.insurance} onChange={(v: number) => setExpenses(e => ({ ...e, insurance: v }))} prefix="€" size="small" />
                                        </div>

                                        <div className="h-px bg-slate-100 dark:bg-slate-800" />

                                        {/* Row 4: Varios */}
                                        <div className="grid grid-cols-4 gap-3">
                                            <ProfessionalInput label="Marketing" value={expenses.marketing} onChange={(v: number) => setExpenses(e => ({ ...e, marketing: v }))} prefix="€" size="small" />
                                            <ProfessionalInput label="Serv. Repaart" value={expenses.repaartServices} onChange={(v: number) => setExpenses(e => ({ ...e, repaartServices: v }))} prefix="€" size="small" />
                                            <ProfessionalInput label="Incidencias" value={expenses.incidents} onChange={(v: number) => setExpenses(e => ({ ...e, incidents: v }))} prefix="€" size="small" />
                                            <ProfessionalInput label="Otros" value={expenses.other} onChange={(v: number) => setExpenses(e => ({ ...e, other: v }))} prefix="€" size="small" />
                                        </div>
                                    </div>
                                </ProfessionalCard>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer Compacto */}
                <div className="h-16 bg-white dark:bg-slate-900 flex items-center justify-end px-6 gap-3 shrink-0 z-20 border-t border-slate-100 dark:border-slate-800">
                    {step === 2 && (
                        <button
                            onClick={() => setStep(1)}
                            className="mr-auto px-4 py-2 rounded-lg text-xs font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center gap-2"
                        >
                            ← Atrás
                        </button>
                    )}

                    {step === 2 && !isLocked && (
                        <button
                            onClick={() => handleSaveData(false)}
                            className="px-4 py-2 rounded-lg text-xs font-bold text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition-all"
                        >
                            Guardar Borrador
                        </button>
                    )}
                    
                    {step === 1 ? (
                        <button
                            onClick={() => setStep(2)}
                            className="px-6 py-2 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md transition-all flex items-center gap-2"
                        >
                            Siguiente: Gastos →
                        </button>
                    ) : (
                        <button
                            onClick={() => isLocked ? onClose() : handleSaveData(true)}
                            disabled={saving}
                            className={`
                                px-6 py-2 rounded-lg text-xs font-bold text-white shadow-md transition-all flex items-center gap-2
                                ${isLocked ? 'bg-slate-800 hover:bg-slate-700' : 'bg-emerald-600 hover:bg-emerald-700'}
                            `}
                        >
                            {saving ? '...' : isLocked ? 'Cerrar' : 'Confirmar Cierre'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FinancialControlCenter;
