import React from 'react';
import { PieChart, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { ProfessionalInput } from './ui/ProfessionalInput';
import { formatMoney } from '../../../../lib/finance';

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
}

interface SectionProps {
    title: string;
    children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, children }) => (
    <div>
        <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2.5 px-0.5">
            {title}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
    calculatedRiderExpenses = { payroll: 0, socialSecurity: 0 }
}) => {
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
            <div className="h-full bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200/60 dark:border-white/5 overflow-hidden flex flex-col">
                {/* ── Header ── */}
                <div className="px-5 py-3.5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <PieChart className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        <h2 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">Estructura de Costes</h2>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={syncWithLogistics}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-wider transition-all border border-indigo-100 dark:border-indigo-500/20"
                        >
                            <RefreshCw className="w-3 h-3" />
                            Sincronizar
                        </button>

                        {/* Total Badge */}
                        <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-900/20 px-3 py-1.5 rounded-lg border border-rose-100 dark:border-rose-800/30">
                            <span className="text-[10px] uppercase font-bold text-rose-400 dark:text-rose-500 tracking-wider">Total</span>
                            <span className="text-sm font-black text-rose-600 dark:text-rose-400 tabular-nums">
                                -{formatMoney(totalExpenses)}€
                            </span>
                        </div>
                    </div>
                </div>

                {/* ── Form Body ── */}
                <div className="flex-1 overflow-y-auto px-5 py-5 custom-scrollbar">
                    <div className="space-y-5">
                        {/* Personal & Horas */}
                        <Section title="Personal y Horas">
                            <ProfessionalInput label="Salarios" value={expenses.payroll} onChange={(v) => setExpenses(e => ({ ...e, payroll: v }))} prefix="€" size="medium" />
                            <ProfessionalInput label="Seg. Sociales" value={expenses.socialSecurity} onChange={(v) => setExpenses(e => ({ ...e, socialSecurity: v }))} prefix="€" size="medium" />
                            <ProfessionalInput label="Cuota Autónomo" value={expenses.quota} onChange={(v) => setExpenses(e => ({ ...e, quota: v }))} prefix="€" size="medium" />
                            <ProfessionalInput label="Horas Operativas" value={totalHours} onChange={setTotalHours} type="number" size="medium" />
                        </Section>

                        {/* Flota */}
                        <Section title="Flota y Vehículos">
                            <ProfessionalInput label="Renting (uds)" value={expenses.renting?.count} onChange={(v) => setExpenses(e => ({ ...e, renting: { ...e.renting!, count: v } }))} size="medium" />
                            <ProfessionalInput label="Precio/ud (€)" value={expenses.renting?.pricePerUnit} onChange={(v) => setExpenses(e => ({ ...e, renting: { ...e.renting!, pricePerUnit: v } }))} prefix="€" size="medium" />
                            <div className="flex flex-col justify-center px-3 py-2 bg-slate-50 dark:bg-slate-800/30 rounded-lg border border-slate-100 dark:border-slate-800/50">
                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Total Renting</span>
                                <span className="text-sm font-black text-slate-700 dark:text-slate-300 tabular-nums">{formatMoney(rentingTotal)}€</span>
                            </div>
                            <ProfessionalInput label="Gasolina" value={expenses.fuel} onChange={(v) => setExpenses(e => ({ ...e, fuel: v }))} prefix="€" size="medium" />
                        </Section>

                        {/* Estructura */}
                        <Section title="Estructura y Servicios">
                            <div className="flex flex-col justify-center px-3 py-2 bg-indigo-50 dark:bg-indigo-900/10 rounded-lg border border-indigo-100 dark:border-indigo-800/20">
                                <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider">Royalty Base</span>
                                <span className="text-sm font-black text-indigo-700 dark:text-indigo-400 tabular-nums">{formatMoney(royaltyAmount)}€</span>
                            </div>
                            <ProfessionalInput label="Royalty %" value={expenses.royaltyPercent} onChange={(v) => setExpenses(e => ({ ...e, royaltyPercent: v }))} suffix="%" size="medium" />
                            <ProfessionalInput label="App Flyder" value={expenses.appFlyder} onChange={(v) => setExpenses(e => ({ ...e, appFlyder: v }))} prefix="€" size="medium" />
                            <ProfessionalInput label="Gestoría" value={expenses.agencyFee} onChange={(v) => setExpenses(e => ({ ...e, agencyFee: v }))} prefix="€" size="medium" />
                        </Section>

                        {/* Varios */}
                        <Section title="Otros Gastos">
                            <ProfessionalInput label="Seguros RC" value={expenses.insurance} onChange={(v) => setExpenses(e => ({ ...e, insurance: v }))} prefix="€" size="medium" />
                            <ProfessionalInput label="Reparaciones" value={expenses.repairs} onChange={(v) => setExpenses(e => ({ ...e, repairs: v }))} prefix="€" size="medium" />
                            <ProfessionalInput label="Marketing" value={expenses.marketing} onChange={(v) => setExpenses(e => ({ ...e, marketing: v }))} prefix="€" size="medium" />
                            <ProfessionalInput label="Serv. Repaart" value={expenses.repaartServices} onChange={(v) => setExpenses(e => ({ ...e, repaartServices: v }))} prefix="€" size="medium" />
                            <ProfessionalInput label="Incidencias" value={expenses.incidents} onChange={(v) => setExpenses(e => ({ ...e, incidents: v }))} prefix="€" size="medium" />
                            <ProfessionalInput label="Otros" value={expenses.other} onChange={(v) => setExpenses(e => ({ ...e, other: v }))} prefix="€" size="medium" />
                        </Section>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
