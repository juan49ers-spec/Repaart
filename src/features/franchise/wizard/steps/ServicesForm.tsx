import React from 'react';
import InputCard from '../../../../ui/inputs/InputCard';
import { ExpenseData } from '../../types';

interface ServicesFormProps {
    expenses: ExpenseData;
    updateExpense: (field: keyof ExpenseData, value: number) => void;
}

const ServicesForm: React.FC<ServicesFormProps> = ({ expenses, updateExpense }) => {
    return (
        <div className="space-y-6 animate-in slide-in-from-right duration-500">
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
                <h4 className="text-purple-600 font-bold uppercase text-xs tracking-wider mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                    Servicios Profesionales
                </h4>
                <div className="space-y-4">
                    <InputCard label="Gestoría / Asesoría" value={expenses.agencyFee} onChange={(v) => updateExpense('agencyFee', v)} icon="file-text" variant="light" />
                    <InputCard label="Prevención Riesgos (PRL)" value={expenses.prlFee} onChange={(v) => updateExpense('prlFee', v)} icon="shield" variant="light" />
                    <InputCard label="Servicios Financieros / Bancarios" value={expenses.accountingFee} onChange={(v) => updateExpense('accountingFee', v)} icon="credit-card" variant="light" />
                    <InputCard label="Otros Servicios Profesionales" value={expenses.professionalServices} onChange={(v) => updateExpense('professionalServices', v)} icon="briefcase" variant="light" />
                </div>
            </div>
        </div>
    );
};

export default ServicesForm;
