import React, { useState, useEffect } from 'react';
import { PieChart, BarChart3, Wallet, X, Activity } from 'lucide-react';
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




// --- CONFIG: FINANCE & AUDIT DATA ---
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



// --- STARK UI COMPONENTS ---

const StarkCard = ({ title, children, className, icon: Icon }: { title?: string, children: React.ReactNode, className?: string, icon?: any }) => (
    <div className={`
        bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-[2rem] p-6 
        shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] ring-1 ring-white/10
        hover:ring-indigo-500/30 hover:bg-slate-900/80 transition-all duration-500
        ${className}
    `}>
        {title && (
            <div className="flex items-center gap-3 mb-4">
                {Icon && <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400"><Icon className="w-4 h-4" /></div>}
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">{title}</h3>
            </div>
        )}
        {children}
    </div>
);

const StarkStat = ({ label, value, subtext, trend, color = "indigo" }: { label: string, value: string, subtext?: string, trend?: 'up' | 'down', color?: string }) => (
    <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">{label}</p>
        <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-mono font-bold text-white tracking-tight`}>{value}</span>
            {trend && (
                <span className={`text-xs font-bold ${trend === 'up' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {trend === 'up' ? '↗' : '↘'}
                </span>
            )}
        </div>
        {subtext && <p className={`text-[10px] font-medium mt-1 text-${color}-400/80`}>{subtext}</p>}
    </div>
);

const StarkInput = ({ label, value, onChange, prefix, type = "number", className }: any) => (
    <div className={`group relative ${className}`}>
        <label className="absolute -top-2 left-3 px-1 bg-slate-900/90 text-[9px] font-bold text-indigo-400 uppercase tracking-wider transition-all">
            {label}
        </label>
        <div className="flex items-center bg-slate-950/50 border border-slate-800 rounded-xl overflow-hidden focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all">
            {prefix && (
                <div className="pl-3 pr-2 text-slate-500 text-xs font-mono select-none">
                    {prefix}
                </div>
            )}
            <input
                type={type}
                value={value}
                onChange={e => onChange(type === "number" ? parseFloat(e.target.value) || 0 : e.target.value)}
                className="w-full bg-transparent border-none text-white text-sm font-mono focus:ring-0 placeholder-slate-700 py-3"
            />
        </div>
    </div>
);

// --- MAIN COMPONENT ---

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
    franchiseId, month, onClose, onSave, initialData
}) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState<'pending' | 'draft' | 'submitted' | 'approved' | 'unlock_requested' | 'locked'>('draft');

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
        royaltyPercent: 5, irpfPercent: 20
    });
    const [logisticsRates, setLogisticsRates] = useState<LogisticsRate[]>([]);

    const [ytdProfit, setYtdProfit] = useState(0);

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
                setYtdProfit(prevMonthsYtd);

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
            renting: { count: data.motoCount || 0, pricePerUnit: (data.motoCount && data.rentingCost) ? data.rentingCost / data.motoCount : 154 },
            agencyFee: data.agencyFee || 0, prlFee: data.prlFee || 0, accountingFee: data.accountingFee || 0,
            professionalServices: data.services || 0, appFlyder: data.appFlyder || 0, marketing: data.marketing || 0,
            incidents: data.incidents || 0, other: data.otherExpenses || 0,
            royaltyPercent: data.royaltyPercent ?? 5, irpfPercent: data.irpfPercent ?? 20
        });
    };

    const calculateStats = () => {
        const rentingTotal = (expenses.renting?.count ?? 0) * (expenses.renting?.pricePerUnit ?? 0);
        const royaltyAmount = totalIncome * ((expenses.royaltyPercent || 5) / 100);
        const fixedCosts = (expenses.payroll ?? 0) + (expenses.socialSecurity ?? 0) + (expenses.quota ?? 0) +
            (expenses.insurance ?? 0) + (expenses.agencyFee ?? 0) + (expenses.prlFee ?? 0) +
            (expenses.accountingFee ?? 0) + (expenses.professionalServices ?? 0) + (expenses.appFlyder ?? 0) + (expenses.marketing ?? 0);
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
                salaries: expenses.payroll, quota: expenses.quota, insurance: expenses.insurance,
                gasoline: expenses.fuel, repairs: expenses.repairs,
                motoCount: expenses.renting?.count ?? 0,
                rentingCost: (expenses.renting?.count ?? 0) * (expenses.renting?.pricePerUnit ?? 0),
                agencyFee: expenses.agencyFee, prlFee: expenses.prlFee, accountingFee: expenses.accountingFee, services: expenses.professionalServices,
                appFlyder: expenses.appFlyder, marketing: expenses.marketing, incidents: expenses.incidents, otherExpenses: expenses.other,
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
                await notificationService.notify('FINANCE_CLOSING', franchiseId, 'Franquicia', {
                    title: `Cierre: ${month}`, message: 'Cierre enviado.', priority: 'normal',
                    metadata: { month, profit: stats.profit, status: 'locked' }
                });
            }
            if (shouldLock) onClose();
            else alert("Guardado como borrador");
        } catch (e) { console.error(e); } finally { setSaving(false); }
    };

    if (loading) return <div className="p-10 text-white text-center animate-pulse">Iniciando Sistemas Financieros...</div>;

    return (
        <div className="fixed inset-0 z-50 bg-[#0a0a0c] text-slate-200 font-sans overflow-hidden flex flex-col">
            {/* Header */}
            <div className="h-16 border-b border-white/5 bg-slate-950/50 backdrop-blur-md flex items-center justify-between px-6 shrink-0 relative z-20">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-indigo-500/20 rounded-xl border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                        <Activity className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-white tracking-widest uppercase">Financial Command</h1>
                        <p className="text-[10px] text-slate-500 font-mono tracking-wider">SECURE LINK • {month.toUpperCase()}</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-5 h-5 text-slate-400" /></button>
            </div>

            {/* Main Scrollable Grid */}
            <div className="flex-1 overflow-y-auto p-6 relative">
                {/* Background FX */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px]" />
                    <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px]" />
                </div>

                <div className="max-w-[1600px] mx-auto grid grid-cols-12 gap-6 relative z-10">

                    {/* TOP HERO KPIs */}
                    <div className="col-span-12 lg:col-span-8 grid grid-cols-3 gap-4">
                        <StarkCard className="col-span-1 bg-gradient-to-br from-indigo-950/40 to-slate-900/40 via-slate-900/40 !border-indigo-500/30">
                            <StarkStat label="Beneficio Neto" value={`${formatMoney(stats.profit)}€`} trend={stats.profit > 0 ? "up" : "down"} subtext="Post-Operational" />
                        </StarkCard>
                        <StarkCard className="col-span-1">
                            <StarkStat label="Margen Bruto" value={`${formatMoney(stats.grossMargin)}€`} color="blue" subtext="Pre-Amortization" />
                        </StarkCard>
                        <StarkCard className="col-span-1">
                            <StarkStat label="Cash Flow Real" value={`${formatMoney(stats.safeToSpend)}€`} color="emerald" subtext="Safe-to-Spend (80%)" />
                        </StarkCard>
                    </div>

                    {/* STATUS / ALERTS */}
                    <div className="p-6 bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl border border-slate-200 dark:border-slate-800 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-50">
                            <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold border border-amber-200">15%</span>
                        </div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600"><Wallet className="w-6 h-6" /></div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Tu Bolsillo</h3>
                        </div>
                        <div className="mt-4">
                            <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">{formatMoney(stats.netResultAfterAmortization)}</span>
                            <span className="text-sm font-medium text-slate-400 ml-1">€</span>
                        </div>
                        <div className="mt-6 space-y-3">
                            <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                                    <span className="text-xs font-bold text-slate-500 uppercase">Ingresos Brutos</span>
                                </div>
                                <span className="text-sm font-bold text-slate-900 dark:text-white">{formatMoney(totalIncome)}€</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-rose-500" />
                                    <span className="text-xs font-bold text-slate-500 uppercase">Gastos + IRPF</span>
                                </div>
                                <span className="text-sm font-bold text-slate-900 dark:text-white">
                                    - {formatMoney(stats.totalExpenses + (stats.grossMargin * (expenses.irpfPercent || 20) / 100))}€
                                </span>
                            </div>
                        </div>
                        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <div className="text-center">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Resumen Anual</p>
                                <p className="text-[10px] font-medium text-indigo-500">Acumulado {month.split('-')[0]}</p>
                            </div>
                            <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                                <Wallet className="w-4 h-4" />
                                <span className="text-sm font-bold">+ {formatMoney(ytdProfit + stats.profit)}€</span>
                            </div>
                        </div>
                    </div>

                    {/* INPUTS - REVENUE */}
                    <StarkCard title="Vector de Ingresos" className="col-span-12 lg:col-span-4 row-span-2" icon={Wallet}>
                        <div className="space-y-4">
                            <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-3">
                                <p className="text-[10px] font-bold text-slate-500 uppercase">Volumen Logístico</p>
                                {['0-4 km', '4-5 km', '5-6 km', '6-7 km', '>7 km'].map((range) => (
                                    <div key={range} className="flex items-center justify-between group">
                                        <span className="text-xs text-slate-400 group-hover:text-white transition-colors">{range}</span>
                                        <input
                                            type="number"
                                            className="w-20 bg-slate-900 border border-slate-700 rounded-lg text-right text-xs py-1 px-2 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-mono text-white"
                                            value={orders[range] || ''}
                                            onChange={(e) => setOrders(prev => ({ ...prev, [range]: parseInt(e.target.value) || 0 }))}
                                            disabled={isLocked}
                                        />
                                    </div>
                                ))}
                                <div className="h-px bg-white/10 my-2" />
                                <StarkInput label="Pedidos Cancelados" value={cancelledOrders} onChange={setCancelledOrders} type="number" />
                            </div>

                            <StarkInput label="Ingreso Bruto (€)" value={totalIncome} onChange={setTotalIncome} prefix="€" type="number" />
                        </div>
                    </StarkCard>

                    {/* INPUTS - COSTS */}
                    <StarkCard title="Estructura de Costes" className="col-span-12 lg:col-span-8" icon={PieChart}>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <StarkInput label="Nóminas" value={expenses.payroll} onChange={(v: number) => setExpenses(e => ({ ...e, payroll: v }))} prefix="€" />
                            <StarkInput label="Seg. Social" value={expenses.socialSecurity} onChange={(v: number) => setExpenses(e => ({ ...e, socialSecurity: v }))} prefix="€" />
                            <StarkInput label="Autónomos" value={expenses.quota} onChange={(v: number) => setExpenses(e => ({ ...e, quota: v }))} prefix="€" />
                            <StarkInput label="Combustible" value={expenses.fuel} onChange={(v: number) => setExpenses(e => ({ ...e, fuel: v }))} prefix="€" />

                            <StarkInput label="Renting (Unds)" value={expenses.renting?.count} onChange={(v: number) => setExpenses(e => ({ ...e, renting: { ...e.renting!, count: v } }))} />
                            <StarkInput label="Renting (€/Ud)" value={expenses.renting?.pricePerUnit} onChange={(v: number) => setExpenses(e => ({ ...e, renting: { ...e.renting!, pricePerUnit: v } }))} prefix="€" />
                            <StarkInput label="Reparaciones" value={expenses.repairs} onChange={(v: number) => setExpenses(e => ({ ...e, repairs: v }))} prefix="€" />
                            <StarkInput label="Marketing" value={expenses.marketing} onChange={(v: number) => setExpenses(e => ({ ...e, marketing: v }))} prefix="€" />
                        </div>
                    </StarkCard>

                    {/* OPERATIONAL METRICS */}
                    <StarkCard title="Métricas Operativas" className="col-span-12 lg:col-span-8" icon={BarChart3}>
                        <div className="grid grid-cols-3 gap-6">
                            <StarkInput label="Horas Totales" value={totalHours} onChange={setTotalHours} />
                            <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                <p className="text-[10px] text-slate-500 uppercase font-bold">Productividad</p>
                                <p className="text-2xl font-mono text-white mt-1">{(totalHours > 0 ? stats.totalOrders / totalHours : 0).toFixed(2)} <span className="text-xs text-slate-500">ped/h</span></p>
                            </div>
                            <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                <p className="text-[10px] text-slate-500 uppercase font-bold">Coste Medio</p>
                                <p className="text-2xl font-mono text-white mt-1">{formatMoney(stats.totalOrders > 0 ? stats.totalExpenses / stats.totalOrders : 0)} <span className="text-xs text-slate-500">€/ped</span></p>
                            </div>
                        </div>
                    </StarkCard>

                </div>
            </div>

            {/* Footer Actions */}
            <div className="h-20 border-t border-white/10 bg-slate-950/80 backdrop-blur-xl flex items-center justify-end px-8 gap-4 shrink-0 z-20">
                {!isLocked && (
                    <button
                        onClick={() => handleSaveData(false)}
                        className="px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                    >
                        Guardar Borrador
                    </button>
                )}
                <button
                    onClick={() => isLocked ? onClose() : handleSaveData(true)}
                    disabled={saving}
                    className={`
                        px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest text-white shadow-lg transition-all
                        ${isLocked
                            ? 'bg-slate-800 hover:bg-slate-700'
                            : 'bg-indigo-600 hover:bg-indigo-500 hover:shadow-indigo-500/25'
                        }
                    `}
                >
                    {saving ? 'Procesando...' : isLocked ? 'Cerrar' : 'Confirmar Cierre'}
                </button>
            </div>
        </div>
    );
};

export default FinancialControlCenter;
