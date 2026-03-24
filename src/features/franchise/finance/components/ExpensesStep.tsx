import React, { useState, useEffect } from 'react';
import { RefreshCw, Users, Truck, Building2, Wallet, Calculator } from 'lucide-react';
import { motion } from 'framer-motion';
import { ProfessionalInput } from './ui/ProfessionalInput';
import { formatMoney } from '../../../../lib/finance';
import { analyzeExpenseAmount } from '../../../../lib/gemini';

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

interface ExpensesStepProps {
    expenses: ExpenseData;
    setExpenses: React.Dispatch<React.SetStateAction<ExpenseData>>;
    totalHours: number;
    setTotalHours: (val: number) => void;
    totalExpenses: number;
    royaltyAmount: number;
    calculatedOperativeHours?: number;
    calculatedRiderExpenses?: { payroll: number; socialSecurity: number };
    historicalAvg?: Record<string, number>;
}

interface SectionProps {
    title: string;
    icon?: React.ReactNode;
    highlight?: boolean;
    children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, icon, highlight, children }) => (
    <div className={`p-2.5 rounded-lg border transition-all duration-200 ${highlight
        ? 'bg-gradient-to-br from-indigo-50/40 to-white border-indigo-100/60 shadow-sm dark:from-indigo-900/10 dark:to-slate-900/50 dark:border-indigo-800/20'
        : 'bg-slate-50/30 border-slate-200/50 dark:bg-slate-800/10 dark:border-white/5 hover:bg-white dark:hover:bg-slate-800/30'
        }`}>
        <div className="flex items-center gap-1.5 mb-2">
            {icon && (
                <div className={`p-1 rounded-md border ${highlight
                    ? 'bg-indigo-100/80 text-indigo-600 border-indigo-200/50 dark:bg-indigo-500/20 dark:text-indigo-400 dark:border-indigo-500/30'
                    : 'bg-white text-slate-500 border-slate-200 shadow-sm dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                    }`}>
                    {icon}
                </div>
            )}
            <div>
                <h3 className={`text-[8px] font-bold uppercase tracking-tight ${highlight ? 'text-indigo-900 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-400'
                    }`}>
                    {title}
                </h3>
            </div>
        </div>

        <div className={`grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-x-2 gap-y-2`}>
            {children}
        </div>
    </div>
);

export const ExpensesStep: React.FC<ExpensesStepProps> = ({
    expenses,
    setExpenses,
    totalHours,
    setTotalHours,
    totalExpenses,
    royaltyAmount,
    calculatedOperativeHours = 0,
    calculatedRiderExpenses = { payroll: 0, socialSecurity: 0 },
    historicalAvg = {},
}) => {
    const [expenseHints, setExpenseHints] = useState<Record<string, { message: string; level: string }>>({});

    useEffect(() => {
        const categoriesToCheck: Array<{ key: string; value: number | undefined }> = [
            { key: 'fuel', value: expenses.fuel },
            { key: 'repairs', value: expenses.repairs },
            { key: 'payroll', value: expenses.payroll },
            { key: 'marketing', value: expenses.marketing },
            { key: 'insurance', value: expenses.insurance },
        ];

        const timer = setTimeout(async () => {
            const updates: Record<string, { message: string; level: string }> = {};
            await Promise.all(
                categoriesToCheck.map(async ({ key, value }) => {
                    const avg = historicalAvg[key] ?? 0;
                    if (!value || avg === 0 || value <= avg * 1.2) return;
                    const result = await analyzeExpenseAmount(key, value, avg);
                    if (result) updates[key] = result;
                })
            );
            setExpenseHints(updates);
        }, 800);

        return () => clearTimeout(timer);
    }, [expenses.fuel, expenses.repairs, expenses.payroll, expenses.marketing, expenses.insurance, historicalAvg]);

    const syncWithLogistics = () => {
        setTotalHours(calculatedOperativeHours);
        setExpenses(prev => ({
            ...prev,
            payroll: calculatedRiderExpenses.payroll,
            socialSecurity: calculatedRiderExpenses.socialSecurity
        }));
    };

    const rentingTotal = (expenses.renting?.count || 0) * (expenses.renting?.pricePerUnit || 0);

    return (
        <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="h-full flex flex-col"
        >
            <div className="h-full bg-white dark:bg-slate-900/40 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm overflow-hidden flex flex-col relative">

                {/* ── Decoración de fondo suave ── */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-50 dark:bg-indigo-900/10 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                {/* ── Header ── */}
                <div className="px-3 py-2 border-b border-slate-100 dark:border-white/5 flex items-center justify-between gap-3 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm relative z-10">
                    <div className="flex items-center gap-2">
                        <div className="p-1 bg-indigo-100/80 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-md">
                            <Calculator className="w-3.5 h-3.5" />
                        </div>
                        <h2 className="text-[10px] font-bold text-slate-800 dark:text-slate-100 uppercase tracking-tight truncate">Flujo de Gastos</h2>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Legend */}
                        <div className="hidden md:flex items-center gap-3 mr-2 bg-slate-50 dark:bg-slate-800/50 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-1.5 opacity-80 hover:opacity-100 transition-opacity">
                                <span className="w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.5)]"></span>
                                <span className="text-[7.5px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">+IVA</span>
                            </div>
                            <div className="w-px h-3 bg-slate-200 dark:bg-slate-700"></div>
                            <div className="flex items-center gap-1.5 opacity-80 hover:opacity-100 transition-opacity">
                                <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]"></span>
                                <span className="text-[7.5px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Exento</span>
                            </div>
                        </div>

                        <button
                            onClick={syncWithLogistics}
                            className="group flex items-center gap-1 px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 text-[8px] font-bold uppercase tracking-tight transition-all border border-slate-200 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-500/30 shadow-sm"
                            title="Sincronizar con datos de cuadrantes"
                        >
                            <RefreshCw className="w-3 h-3 group-hover:rotate-180 transition-transform duration-500" />
                            <span className="hidden sm:inline">Autocompletar</span>
                        </button>

                        {/* Total Badge */}
                        <div className="flex items-center gap-1 bg-gradient-to-r from-rose-50 to-red-50 dark:from-rose-900/20 dark:to-red-900/10 px-2 py-0.5 rounded-md border border-rose-100/80 dark:border-rose-800/30 shadow-sm">
                            <span className="text-[7px] uppercase font-bold text-rose-500 dark:text-rose-400 tracking-tight opacity-80">Total</span>
                            <span className="text-[10px] font-black text-rose-600 dark:text-rose-400 tabular-nums tracking-tight">
                                -{formatMoney(totalExpenses)}€
                            </span>
                        </div>
                    </div>
                </div>

                {/* ── Form Body ── */}
                <div className="flex-1 overflow-y-auto p-3 custom-scrollbar relative z-10">
                    <div className="space-y-2.5 max-w-7xl mx-auto">

                        {/* Personal & Horas */}
                        <Section
                            title="Capital Humano"
                            icon={<Users className="w-3.5 h-3.5" />}
                            highlight={true}
                        >
                            <div>
                                <ProfessionalInput label="Salarios Netos" value={expenses.payroll} onChange={(v) => setExpenses(e => ({ ...e, payroll: v }))} prefix="€" size="small" taxType="exempt" />
                                {expenseHints.payroll && (
                                    <p className={`text-xs mt-1 ${expenseHints.payroll.level === 'very_high' ? 'text-amber-600' : 'text-slate-500'}`}>
                                        ℹ️ {expenseHints.payroll.message}
                                    </p>
                                )}
                            </div>
                            <ProfessionalInput label="Seg. Sociales" value={expenses.socialSecurity} onChange={(v) => setExpenses(e => ({ ...e, socialSecurity: v }))} prefix="€" size="small" taxType="exempt" />
                            <ProfessionalInput label="Cuota Autónomo" value={expenses.quota} onChange={(v) => setExpenses(e => ({ ...e, quota: v }))} prefix="€" size="small" taxType="exempt" />
                            <ProfessionalInput label="Horas Operativas" value={totalHours} onChange={setTotalHours} type="number" size="small" />
                        </Section>

                        {/* Flota */}
                        <Section
                            title="Logística y Flota"
                            icon={<Truck className="w-3.5 h-3.5" />}
                        >
                            <ProfessionalInput label="Vehículos (Uds)" value={expenses.renting?.count} onChange={(v) => setExpenses(e => ({ ...e, renting: { ...e.renting!, count: v } }))} size="small" taxType="standard" />
                            <ProfessionalInput label="Precio Renting/Ud" value={expenses.renting?.pricePerUnit} onChange={(v) => setExpenses(e => ({ ...e, renting: { ...e.renting!, pricePerUnit: v } }))} prefix="€" size="small" taxType="standard" />

                            <div className="flex flex-col justify-center px-2 py-0.5 bg-slate-100/50 dark:bg-slate-900/50 rounded-md border border-slate-200/60 dark:border-slate-800">
                                <span className="text-[7px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-tight mb-0.5">Subtotal Renting</span>
                                <span className="text-[10px] font-black text-slate-800 dark:text-slate-200 tabular-nums tracking-tight">{formatMoney(rentingTotal)}€</span>
                            </div>

                            <div>
                                <ProfessionalInput label="Gasto Gasolina" value={expenses.fuel} onChange={(v) => setExpenses(e => ({ ...e, fuel: v }))} prefix="€" size="small" taxType="standard" />
                                {expenseHints.fuel && (
                                    <p className={`text-xs mt-1 ${expenseHints.fuel.level === 'very_high' ? 'text-amber-600' : 'text-slate-500'}`}>
                                        ℹ️ {expenseHints.fuel.message}
                                    </p>
                                )}
                            </div>
                        </Section>

                        {/* Estructura */}
                        <Section
                            title="Costes de Estructura"
                            icon={<Building2 className="w-3.5 h-3.5" />}
                        >
                            <div className="flex flex-col justify-center px-2 py-0.5 bg-indigo-50/80 dark:bg-indigo-900/20 rounded-md border border-indigo-100 dark:border-indigo-800/30">
                                <span className="text-[7px] text-indigo-500 dark:text-indigo-400 font-bold uppercase tracking-tight mb-0.5">Royalty Base</span>
                                <span className="text-[10px] font-black text-indigo-700 dark:text-indigo-300 tabular-nums tracking-tight">{formatMoney(royaltyAmount)}€</span>
                            </div>
                            <ProfessionalInput label="% Royalty Final" value={expenses.royaltyPercent} onChange={(v) => setExpenses(e => ({ ...e, royaltyPercent: v }))} suffix="%" size="small" taxType="standard" />
                            <ProfessionalInput label="App Flyder (Tech)" value={expenses.appFlyder} onChange={(v) => setExpenses(e => ({ ...e, appFlyder: v }))} prefix="€" size="small" taxType="standard" />
                            <ProfessionalInput label="Gestoría / Asesoría" value={expenses.agencyFee} onChange={(v) => setExpenses(e => ({ ...e, agencyFee: v }))} prefix="€" size="small" taxType="standard" />
                        </Section>

                        {/* Varios */}
                        <Section
                            title="Gastos Extraordinarios"
                            icon={<Wallet className="w-3.5 h-3.5" />}
                        >
                            <div>
                                <ProfessionalInput label="Seguros RC/Flota" value={expenses.insurance} onChange={(v) => setExpenses(e => ({ ...e, insurance: v }))} prefix="€" size="small" taxType="exempt" />
                                {expenseHints.insurance && (
                                    <p className={`text-xs mt-1 ${expenseHints.insurance.level === 'very_high' ? 'text-amber-600' : 'text-slate-500'}`}>
                                        ℹ️ {expenseHints.insurance.message}
                                    </p>
                                )}
                            </div>
                            <div>
                                <ProfessionalInput label="Mantenimiento" value={expenses.repairs} onChange={(v) => setExpenses(e => ({ ...e, repairs: v }))} prefix="€" size="small" taxType="standard" />
                                {expenseHints.repairs && (
                                    <p className={`text-xs mt-1 ${expenseHints.repairs.level === 'very_high' ? 'text-amber-600' : 'text-slate-500'}`}>
                                        ℹ️ {expenseHints.repairs.message}
                                    </p>
                                )}
                            </div>
                            <div>
                                <ProfessionalInput label="Marketing" value={expenses.marketing} onChange={(v) => setExpenses(e => ({ ...e, marketing: v }))} prefix="€" size="small" taxType="standard" />
                                {expenseHints.marketing && (
                                    <p className={`text-xs mt-1 ${expenseHints.marketing.level === 'very_high' ? 'text-amber-600' : 'text-slate-500'}`}>
                                        ℹ️ {expenseHints.marketing.message}
                                    </p>
                                )}
                            </div>
                            <ProfessionalInput label="Servicios Repaart" value={expenses.repaartServices} onChange={(v) => setExpenses(e => ({ ...e, repaartServices: v }))} prefix="€" size="small" taxType="standard" />
                            <ProfessionalInput label="Incidencias" value={expenses.incidents} onChange={(v) => setExpenses(e => ({ ...e, incidents: v }))} prefix="€" size="small" taxType="standard" />
                            <ProfessionalInput label="Otros Gastos" value={expenses.other} onChange={(v) => setExpenses(e => ({ ...e, other: v }))} prefix="€" size="small" taxType="standard" />
                        </Section>

                    </div>

                    <div className="h-6 w-full"></div>
                </div>
            </div>
        </motion.div>
    );
};

