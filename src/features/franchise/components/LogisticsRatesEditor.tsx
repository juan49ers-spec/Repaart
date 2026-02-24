import React from 'react';
import { Plus, Trash2, MapPin, DollarSign } from 'lucide-react';
import { LogisticsRate } from '../../../types/franchise';

interface LogisticsRatesEditorProps {
    rates: LogisticsRate[];
    onChange: (rates: LogisticsRate[]) => void;
    readOnly?: boolean;
}

export const LogisticsRatesEditor: React.FC<LogisticsRatesEditorProps> = ({
    rates,
    onChange,
    readOnly = false
}) => {

    const handleAdd = () => {
        const lastRate = rates.length > 0 ? rates[rates.length - 1] : null;
        const newMin = lastRate ? Number(lastRate.max) : 0;
        const newMax = Number((newMin + 3).toFixed(1)); // Default 3km range, rounded to avoid floats

        const newRate: LogisticsRate = {
            min: newMin,
            max: newMax,
            price: 0,
            name: `${newMin}-${newMax} km`
        };

        onChange([...rates, newRate]);
    };

    const handleRemove = (index: number) => {
        const newRates = [...rates];
        newRates.splice(index, 1);
        onChange(newRates);
    };

    const handleChange = (index: number, field: keyof LogisticsRate, value: string | number) => {
        const newRates = [...rates];
        const rate = { ...newRates[index] };

        // Allow decimals by checking if it ends with a dot or is a partial float
        if (field === 'price' || field === 'min' || field === 'max') {
            // We store as string temporarily in the generic object if needed, 
            // but strict typing prevents it. 
            // However, we can trick React by NOT casting if it's a valid partial number
            // Actually, the best way for this codebase is to simply implicitly allow string-ish numbers 
            // during edit and clean on save.
            (rate as any)[field] = value;
        } else {
            (rate as any)[field] = value;
        }

        // Auto-update name if min/max changes
        if (field === 'min' || field === 'max') {
            const min = (rate as any).min;
            const max = (rate as any).max;
            rate.name = `${min}-${max} km`;
        }

        newRates[index] = rate;
        onChange(newRates);
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-500" /> Tarifas por Distancia
                </h4>
                {!readOnly && (
                    <button
                        type="button"
                        onClick={handleAdd}
                        aria-label="Añadir nuevo rango"
                        className="text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-emerald-500/20"
                    >
                        <Plus className="w-3 h-3" aria-hidden="true" /> Añadir Rango
                    </button>
                )}
            </div>

            {rates.length > 0 ? (
                <div className="divide-y divide-slate-100">
                    {/* Header Row */}
                    <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50/30 text-xs font-bold text-slate-400 uppercase tracking-wider">
                        <div className="col-span-1 text-center">#</div>
                        <div className="col-span-5 md:col-span-6">Distancia (KM)</div>
                        <div className="col-span-4 md:col-span-4 text-right pr-8">Precio</div>
                        <div className="col-span-2 md:col-span-1"></div>
                    </div>

                    {rates.map((rate, index) => (
                        <div key={index} className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-slate-50 transition-colors group">
                            {/* Index */}
                            <div className="col-span-1 flex justify-center">
                                <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-xs font-bold flex items-center justify-center border border-slate-200">
                                    {index + 1}
                                </div>
                            </div>

                            {/* Inputs */}
                            <div className="col-span-5 md:col-span-6 flex items-center gap-3">
                                <div className="relative w-20 md:w-24">
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={rate.min}
                                        onChange={(e) => handleChange(index, 'min', e.target.value)}
                                        disabled={readOnly}
                                        aria-label={`Distancia mínima rango ${index + 1}`}
                                        className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2 text-center text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none disabled:bg-slate-50 disabled:text-slate-500"
                                    />
                                </div>
                                <span className="text-slate-300 font-bold" aria-hidden="true">-</span>
                                <div className="relative w-20 md:w-24">
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={rate.max}
                                        onChange={(e) => handleChange(index, 'max', e.target.value)}
                                        disabled={readOnly}
                                        aria-label={`Distancia máxima rango ${index + 1}`}
                                        className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2 text-center text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none disabled:bg-slate-50 disabled:text-slate-500"
                                    />
                                </div>
                                <span className="text-xs font-bold text-slate-400 hidden md:inline-block" aria-hidden="true">km</span>
                            </div>

                            {/* Price */}
                            <div className="col-span-4 md:col-span-4 flex items-center justify-end gap-2 pr-4 md:pr-8">
                                <div className="relative w-24 md:w-28">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" aria-hidden="true">€</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={rate.price}
                                        onChange={(e) => handleChange(index, 'price', e.target.value)}
                                        disabled={readOnly}
                                        aria-label={`Precio rango ${index + 1}`}
                                        className="w-full bg-white border border-slate-200 rounded-lg py-1.5 pl-6 pr-3 text-right text-sm font-bold text-emerald-600 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none disabled:bg-slate-50 disabled:text-slate-500"
                                    />
                                </div>
                            </div>

                            {/* Delete */}
                            <div className="col-span-2 md:col-span-1 flex justify-end">
                                {!readOnly && (
                                    <button
                                        type="button"
                                        onClick={() => handleRemove(index)}
                                        aria-label={`Eliminar rango ${index + 1}`}
                                        className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                                    >
                                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="p-12 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <MapPin className="w-8 h-8 text-slate-300 p-0" />
                    </div>
                    <h3 className="text-slate-900 font-bold mb-1">Sin tarifas configuradas</h3>
                    <p className="text-slate-500 text-sm mb-6 max-w-xs mx-auto">Configura los precios de envío según la distancia.</p>
                    {!readOnly && (
                        <button
                            type="button"
                            onClick={handleAdd}
                            aria-label="Crear primera tarifa"
                            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" aria-hidden="true" /> Crear Primera Tarifa
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};
