import React from 'react';
import InputCard from '../../../../ui/inputs/InputCard';
import { ExpenseData } from '../../types';

interface VariableCostsFormProps {
    expenses: ExpenseData;
    updateExpense: (field: keyof ExpenseData, value: number) => void;
}

const VariableCostsForm: React.FC<VariableCostsFormProps> = ({ expenses, updateExpense }) => {
    return (
        <div className="space-y-6 animate-in slide-in-from-right duration-500">
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
                <h4 className="text-amber-600 font-bold uppercase text-xs tracking-wider mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    Costes Operativos
                </h4>
                <div className="grid grid-cols-1 gap-4">
                    <InputCard
                        label="Combustible (Gasolina/Luz)"
                        value={expenses.fuel}
                        onChange={(v) => updateExpense('fuel', v)}
                        icon="fuel"
                        highlight
                        variant="light"
                    />
                    <InputCard
                        label="Reparaciones y Mantenimiento"
                        value={expenses.repairs}
                        onChange={(v) => updateExpense('repairs', v)}
                        icon="tool"
                        variant="light"
                    />
                    <InputCard
                        label="Mermas / Incidentes"
                        value={expenses.incidents}
                        onChange={(v) => updateExpense('incidents', v)}
                        icon="alert"
                        variant="light"
                    />
                </div>
            </div>
        </div>
    );
};

export default VariableCostsForm;
