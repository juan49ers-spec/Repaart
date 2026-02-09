import React from 'react';
import { PieChart } from 'lucide-react';
import { motion } from 'framer-motion';
import { ProfessionalCard } from './ui/ProfessionalCard';
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
}

export const ExpensesStep: React.FC<ExpensesStepProps> = ({
    expenses,
    setExpenses,
    totalHours,
    setTotalHours,
    totalExpenses,
    royaltyAmount
}) => {
    return (
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
                        <span className="text-lg font-black text-rose-600 dark:text-rose-400 tabular-nums">-{formatMoney(totalExpenses)}€</span>
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
                            <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">{formatMoney(royaltyAmount)}€</span>
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
    );
};
