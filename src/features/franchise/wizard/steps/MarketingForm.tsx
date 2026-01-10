import React from 'react';
import InputCard from '../../../../ui/inputs/InputCard';
import { ExpenseData } from '../../types';

interface MarketingFormProps {
    expenses: ExpenseData;
    updateExpense: (field: keyof ExpenseData, value: number) => void;
}

const MarketingForm: React.FC<MarketingFormProps> = ({ expenses, updateExpense }) => {
    return (
        <div className="space-y-6 animate-in slide-in-from-right duration-500">
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
                <h4 className="text-pink-600 font-bold uppercase text-xs tracking-wider mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-500"></span>
                    Growth & Marketing
                </h4>
                <div className="space-y-4">
                    <InputCard label="Software (AppFlyder / Otros)" value={expenses.appFlyder} onChange={(v) => updateExpense('appFlyder', v)} icon="smartphone" variant="light" />
                    <InputCard label="Marketing y Publicidad" value={expenses.marketing} onChange={(v) => updateExpense('marketing', v)} icon="megaphone" variant="light" />
                    <InputCard label="Otros Gastos Generales" value={expenses.other} onChange={(v) => updateExpense('other', v)} icon="layers" variant="light" />

                    {/* Royalty Input */}
                    <div className="pt-4 border-t border-slate-200 mt-4">
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Royalty %</label>
                            <span className="text-xs font-mono text-pink-600">{(expenses.royaltyPercent || 5)}%</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="10"
                            step="0.5"
                            value={expenses.royaltyPercent || 5}
                            onChange={(e) => updateExpense('royaltyPercent', parseFloat(e.target.value))}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-pink-500"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">* Porcentaje sobre Ventas Netas</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MarketingForm;
