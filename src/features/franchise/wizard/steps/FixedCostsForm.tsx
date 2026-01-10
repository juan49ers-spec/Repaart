import React from 'react';
import { formatMoney } from '../../../../lib/finance';
import InputCard from '../../../../ui/inputs/InputCard';
import { ExpenseData } from '../../types';

interface FixedCostsFormProps {
    expenses: ExpenseData;
    updateExpense: (field: keyof ExpenseData, value: number) => void;
    setExpenses: React.Dispatch<React.SetStateAction<ExpenseData>>;
    totalHours: number;
    setTotalHours: (val: number) => void;
}

const FixedCostsForm: React.FC<FixedCostsFormProps> = ({ expenses, updateExpense, setExpenses, totalHours, setTotalHours }) => {
    return (
        <div className="space-y-6 animate-in slide-in-from-right duration-500">
            <div className="grid grid-cols-1 gap-6">

                {/* Personal Section */}
                <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
                    <h4 className="text-emerald-600 font-bold uppercase text-xs tracking-wider mb-4 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Personal y Eficiencia
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputCard label="Nóminas (Neto + SS)" value={expenses.payroll} onChange={(v) => updateExpense('payroll', v)} icon="users" variant="light" />
                        <InputCard label="Cuota Autónomo / SS" value={expenses.quota} onChange={(v) => updateExpense('quota', v)} icon="user" variant="light" />
                    </div>

                    {/* Total Hours Block */}
                    <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-xl relative overflow-hidden group hover:border-blue-500/30 transition-colors">
                        <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                            {/* Assuming Clock icon is available or reused */}
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <h5 className="text-slate-700 font-bold text-sm mb-1">Horas Operativas Totales</h5>
                                <p className="text-[10px] text-slate-500 max-w-[200px] leading-tight">
                                    Suma total de horas trabajadas por el equipo (incluyendo socios) en el mes.
                                </p>
                            </div>
                            <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-lg p-1 pr-3 focus-within:ring-2 focus-within:ring-emerald-500/50 transition-all shadow-sm">
                                <input
                                    type="number"
                                    value={totalHours === 0 ? '' : totalHours}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setTotalHours(val === '' ? 0 : parseFloat(val));
                                    }}
                                    onWheel={(e) => e.currentTarget.blur()} // Prevent scroll change
                                    className="bg-transparent w-24 text-right font-mono font-bold text-slate-900 focus:outline-none p-2 placeholder:text-slate-400"
                                    placeholder="0"
                                    step="0.1"
                                />
                                <span className="text-xs font-bold text-slate-400">H</span>
                            </div>
                        </div>

                        {/* Always visible metrics block for feedback */}
                        <div className="mt-3 pt-3 border-t border-slate-200 space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] uppercase font-bold text-slate-500">Coste Equipo / Hora:</span>
                                <span className="text-sm font-mono font-bold text-emerald-400">
                                    {totalHours > 0 ? formatMoney((expenses.payroll + expenses.quota) / totalHours) : '---'}€/h
                                </span>
                            </div>


                        </div>
                    </div>
                </div>

                {/* Assets Section */}
                <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
                    <h4 className="text-blue-600 font-bold uppercase text-xs tracking-wider mb-4 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        Activos y Estructura
                    </h4>
                    <div className="space-y-4">
                        <InputCard label="Seguros (RC y Local)" value={expenses.insurance} onChange={(v) => updateExpense('insurance', v)} icon="shield" variant="light" />

                        {/* Renting Logic Block */}
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                            <div className="flex justify-between items-center mb-4">
                                <label className="text-sm font-bold text-slate-700">Renting de Motos</label>
                                <span className="text-xs text-slate-500 font-mono">Coste Flota</span>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <p className="text-[10px] text-slate-500 mb-1 uppercase font-bold">Unidades</p>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={expenses.renting?.count ?? ''}
                                            onChange={e => setExpenses(prev => ({ ...prev, renting: { ...prev.renting, count: parseFloat(e.target.value) || 0 } }))}
                                            className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 font-bold text-center focus:border-indigo-500 placeholder-slate-400"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] text-slate-500 mb-1 uppercase font-bold">Precio / Moto</p>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={expenses.renting?.pricePerUnit ?? ''}
                                            onChange={e => setExpenses(prev => ({ ...prev, renting: { ...prev.renting, pricePerUnit: parseFloat(e.target.value) || 0 } }))}
                                            className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 font-bold text-center focus:border-indigo-500 placeholder-slate-400"
                                            placeholder="0"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">€</span>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-3 pt-3 border-t border-slate-200 flex justify-between items-center">
                                <span className="text-xs text-slate-500">Total Renting:</span>
                                <span className="text-emerald-600 font-mono font-bold">{formatMoney((expenses.renting?.count ?? 0) * (expenses.renting?.pricePerUnit ?? 0))}€</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FixedCostsForm;
