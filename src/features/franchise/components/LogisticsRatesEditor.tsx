import React, { useMemo } from 'react';
import { Plus, Trash2, MapPin, DollarSign, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
        const newMax = Number((newMin + 3).toFixed(1)); 

        const newRate: LogisticsRate = {
            min: newMin,
            max: newMax,
            price: 5,
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

        (rate as Record<keyof LogisticsRate, string | number | undefined>)[field] = value;

        if (field === 'min' || field === 'max') {
            const min = (rate as Record<keyof LogisticsRate, string | number | undefined>).min;
            const max = (rate as Record<keyof LogisticsRate, string | number | undefined>).max;
            rate.name = `${min}-${max} km`;
        }

        newRates[index] = rate;
        onChange(newRates);
    };

    // Calculate errors (overlaps, min >= max)
    const errors = useMemo(() => {
        const errs: Record<number, string> = {};
        
        rates.forEach((rate, i) => {
            const minNum = Number(rate.min);
            const maxNum = Number(rate.max);
            
            if (minNum >= maxNum && String(rate.max).trim() !== '' && String(rate.min).trim() !== '') {
                errs[i] = "Mínimo debe ser menor al máximo";
            }
            if (i > 0) {
                const prev = rates[i - 1];
                if (minNum < Number(prev.max) && String(rate.min).trim() !== '') {
                    errs[i] = `Solape con el rango anterior (Termina en ${prev.max}km)`;
                }
            }
        });
        return errs;
    }, [rates]);

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div>
                    <h4 className="text-[13px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-emerald-500" /> Tarifas por Distancia
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">Define los rangos de precios para el envío logístico</p>
                </div>
            </div>

            {rates.length > 0 ? (
                <div className="p-3 md:p-5 flex flex-col gap-3 bg-slate-50/30">
                    <AnimatePresence mode="popLayout">
                        {rates.map((rate, index) => {
                            const hasError = !!errors[index];
                            return (
                                <motion.div 
                                    layout
                                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                                    key={`rate-${index}-${rate.min}`} 
                                    className={`relative flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 md:px-5 md:py-4 rounded-xl border bg-white transition-all shadow-sm ${hasError ? 'border-rose-300 ring-2 ring-rose-50' : 'border-slate-200 hover:border-slate-300 hover:shadow-md'}`}
                                >
                                    {/* Index Identifier */}
                                    <div className="hidden sm:flex shrink-0 w-8 h-8 rounded-full bg-slate-100 text-slate-500 text-xs font-bold items-center justify-center border border-slate-200 shadow-inner">
                                        {index + 1}
                                    </div>

                                    {/* Distance Capsule */}
                                    <div className="flex-1 flex flex-col gap-1 w-full sm:w-auto">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rango de Distancia</div>
                                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-1 rounded-lg">
                                            <input
                                                type="number"
                                                step="0.1"
                                                value={rate.min}
                                                onChange={(e) => handleChange(index, 'min', e.target.value)}
                                                disabled={readOnly}
                                                aria-label={`Distancia mínima rango ${index + 1}`}
                                                className="w-full sm:w-24 bg-white border border-slate-200 shadow-sm rounded-md py-1.5 px-2 text-center text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none disabled:bg-slate-50"
                                            />
                                            <span className="text-slate-400 font-bold px-1">—</span>
                                            <input
                                                type="number"
                                                step="0.1"
                                                value={rate.max}
                                                onChange={(e) => handleChange(index, 'max', e.target.value)}
                                                disabled={readOnly}
                                                aria-label={`Distancia máxima rango ${index + 1}`}
                                                className="w-full sm:w-24 bg-white border border-slate-200 shadow-sm rounded-md py-1.5 px-2 text-center text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none disabled:bg-slate-50"
                                            />
                                            <span className="text-[11px] font-bold text-slate-400 px-2 uppercase">km</span>
                                        </div>
                                    </div>

                                    {/* Price Card */}
                                    <div className="flex flex-col gap-1 w-full sm:w-40">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Precio Final</div>
                                        <div className="relative group/price">
                                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                                <span className="text-emerald-600 font-bold text-sm">€</span>
                                            </div>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={rate.price}
                                                onChange={(e) => handleChange(index, 'price', e.target.value)}
                                                disabled={readOnly}
                                                aria-label={`Precio rango ${index + 1}`}
                                                className="w-full bg-emerald-50/50 border border-emerald-200 shadow-sm rounded-lg py-1.5 pl-3 pr-8 text-center text-base font-bold text-emerald-700 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none disabled:opacity-50 transition-colors hover:bg-emerald-50"
                                            />
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    {!readOnly && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemove(index)}
                                            className="absolute top-3 right-3 sm:relative sm:top-0 sm:right-0 p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                            title="Eliminar rango"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    )}

                                    {/* Error tooltip */}
                                    {hasError && (
                                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-rose-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1 z-10 whitespace-nowrap">
                                            <AlertTriangle className="w-3 h-3" /> {errors[index]}
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>

                    {/* Add Range Ghost Button inside the list */}
                    {!readOnly && (
                        <motion.button
                            layout
                            type="button"
                            onClick={handleAdd}
                            className="flex items-center justify-center gap-2 w-full p-4 rounded-xl border-2 border-dashed border-slate-300 hover:border-emerald-400 bg-transparent hover:bg-emerald-50/50 text-slate-400 hover:text-emerald-600 font-bold text-sm transition-all group mt-1"
                        >
                            <div className="w-6 h-6 rounded-full bg-slate-100 group-hover:bg-emerald-100 flex items-center justify-center transition-colors">
                                <Plus className="w-3.5 h-3.5" />
                            </div>
                            Añadir Siguiente Rango
                        </motion.button>
                    )}
                </div>
            ) : (
                <div className="p-12 flex flex-col items-center justify-center text-center bg-slate-50/30">
                    <div className="w-16 h-16 bg-white shadow-sm border border-slate-100 rounded-full flex items-center justify-center mb-5 relative group">
                        <div className="absolute inset-0 bg-emerald-100 rounded-full scale-0 group-hover:scale-110 transition-transform duration-300 ease-out opacity-50" />
                        <MapPin className="w-8 h-8 text-emerald-500 relative z-10" />
                    </div>
                    <h3 className="text-slate-900 font-bold text-lg mb-1">Sin tarifas configuradas</h3>
                    <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto leading-relaxed">Configura los precios de envío escalonados según la distancia percorrida por el rider.</p>
                    {!readOnly && (
                        <button
                            type="button"
                            onClick={handleAdd}
                            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 active:scale-95"
                        >
                            <Plus className="w-4 h-4" /> Crear Primera Tarifa
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};
