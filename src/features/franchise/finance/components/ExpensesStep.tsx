import React from 'react';
import { PieChart, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button, Tooltip } from 'antd';
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

    return (
        <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="h-full flex flex-col"
        >
            <div className="h-full bg-white dark:bg-slate-900/50 rounded-3xl border border-slate-200/60 dark:border-white/5 overflow-hidden shadow-sm flex flex-col p-2">
                <div className="px-6 py-5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-transparent">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl text-indigo-600 dark:text-indigo-400">
                            <PieChart className="w-5 h-5" strokeWidth={2} />
                        </div>
                        <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Estructura de Costes</h2>
                    </div>

                    <div className="flex items-center gap-4">
                        <Tooltip title="Sincronizar con cuadrante de turnos">
                            <Button
                                type="text"
                                size="small"
                                icon={<RefreshCw size={14} className="text-indigo-600" />}
                                onClick={syncWithLogistics}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest uppercase text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 border border-indigo-200/50 dark:border-indigo-500/20 transition-all h-auto"
                            >
                                SINCRONIZAR
                            </Button>
                        </Tooltip>
                        <div className="flex items-center gap-3 bg-gradient-to-r from-rose-50 to-white dark:from-rose-900/10 dark:to-slate-900/10 px-4 py-2 rounded-xl border border-rose-100 dark:border-rose-900/20 shadow-sm">
                            <span className="text-[11px] uppercase font-bold text-rose-500 dark:text-rose-400 tracking-widest">Total</span>
                            <span className="text-lg font-black text-rose-600 dark:text-rose-400 tabular-nums leading-none">-{formatMoney(totalExpenses)}€</span>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
                    <div className="flex flex-col gap-6">
                        {/* Row 1: Personal & Horas */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <ProfessionalInput label="Salarios" value={expenses.payroll} onChange={(v: number) => setExpenses(e => ({ ...e, payroll: v }))} prefix="€" size="medium" />
                            <ProfessionalInput label="Seguros Sociales" value={expenses.socialSecurity} onChange={(v: number) => setExpenses(e => ({ ...e, socialSecurity: v }))} prefix="€" size="medium" />
                            <ProfessionalInput label="Cuota Autónomo" value={expenses.quota} onChange={(v: number) => setExpenses(e => ({ ...e, quota: v }))} prefix="€" size="medium" />
                            <ProfessionalInput label="Horas Operativas" value={totalHours} onChange={setTotalHours} type="number" size="medium" />
                        </div>

                        <div className="h-px bg-slate-100 dark:bg-slate-800/50 w-full" />

                        {/* Row 2: Flota */}
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            <ProfessionalInput label="Renting (Unds)" value={expenses.renting?.count} onChange={(v: number) => setExpenses(e => ({ ...e, renting: { ...e.renting!, count: v } }))} size="medium" />
                            <ProfessionalInput label="Precio Unit. (€)" value={expenses.renting?.pricePerUnit} onChange={(v: number) => setExpenses(e => ({ ...e, renting: { ...e.renting!, pricePerUnit: v } }))} size="medium" />
                            <div className="flex flex-col justify-center px-4 py-2 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Total Renting</span>
                                <span className="text-sm font-black text-slate-700 dark:text-slate-300 tabular-nums">{formatMoney((expenses.renting?.count || 0) * (expenses.renting?.pricePerUnit || 0))}€</span>
                            </div>
                            <ProfessionalInput label="Gasolina" value={expenses.fuel} onChange={(v: number) => setExpenses(e => ({ ...e, fuel: v }))} prefix="€" size="medium" />
                            <ProfessionalInput label="Reparaciones" value={expenses.repairs} onChange={(v: number) => setExpenses(e => ({ ...e, repairs: v }))} prefix="€" size="medium" />
                        </div>

                        <div className="h-px bg-slate-100 dark:bg-slate-800/50 w-full" />

                        {/* Row 3: Estructura & Tech */}
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            <div className="flex flex-col justify-center px-4 py-2 bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-800/20">
                                <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mb-1">Royalty Base</span>
                                <span className="text-sm font-black text-indigo-700 dark:text-indigo-400 tabular-nums">{formatMoney(royaltyAmount)}€</span>
                            </div>
                            <ProfessionalInput label="Royalty %" value={expenses.royaltyPercent} onChange={(v: number) => setExpenses(e => ({ ...e, royaltyPercent: v }))} suffix="%" size="medium" />
                            <ProfessionalInput label="App Flyder" value={expenses.appFlyder} onChange={(v: number) => setExpenses(e => ({ ...e, appFlyder: v }))} prefix="€" size="medium" />
                            <ProfessionalInput label="Gestoría" value={expenses.agencyFee} onChange={(v: number) => setExpenses(e => ({ ...e, agencyFee: v }))} prefix="€" size="medium" />
                            <ProfessionalInput label="Seguros RC" value={expenses.insurance} onChange={(v: number) => setExpenses(e => ({ ...e, insurance: v }))} prefix="€" size="medium" />
                        </div>

                        <div className="h-px bg-slate-100 dark:bg-slate-800/50 w-full" />

                        {/* Row 4: Varios */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pb-2">
                            <ProfessionalInput label="Marketing" value={expenses.marketing} onChange={(v: number) => setExpenses(e => ({ ...e, marketing: v }))} prefix="€" size="medium" />
                            <ProfessionalInput label="Serv. Repaart" value={expenses.repaartServices} onChange={(v: number) => setExpenses(e => ({ ...e, repaartServices: v }))} prefix="€" size="medium" />
                            <ProfessionalInput label="Incidencias" value={expenses.incidents} onChange={(v: number) => setExpenses(e => ({ ...e, incidents: v }))} prefix="€" size="medium" />
                            <ProfessionalInput label="Otros" value={expenses.other} onChange={(v: number) => setExpenses(e => ({ ...e, other: v }))} prefix="€" size="medium" />
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
