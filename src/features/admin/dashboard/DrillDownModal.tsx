import React from 'react';
import { X, TrendingDown, TrendingUp, AlertCircle } from 'lucide-react';

interface DrillDownItem {
    label: string;
    value: string | number;
    pct: number | string;
    trend: 'up' | 'down';
}

interface DrillDownModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: DrillDownItem[];
    title: string;
}

const DrillDownModal: React.FC<DrillDownModalProps> = ({ isOpen, onClose, data, title }) => {
    if (!isOpen || !data) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[80vh]">

                {/* Header */}
                <div className="p-5 border-b border-slate-800 bg-slate-900/50 rounded-t-2xl flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-bold text-white">{title}</h3>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">Desglose detallado</p>
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content List */}
                <div className="p-0 overflow-y-auto custom-scrollbar">
                    {data.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 flex flex-col items-center">
                            <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
                            <p>No hay detalles disponibles para este registro.</p>
                        </div>
                    ) : (
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-900 font-bold sticky top-0">
                                <tr>
                                    <th className="px-5 py-3">Concepto</th>
                                    <th className="px-5 py-3 text-right">Valor</th>
                                    <th className="px-5 py-3 text-right">Impacto</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {data.map((item, index) => (
                                    <tr key={index} className="hover:bg-slate-900/30 transition-colors">
                                        <td className="px-5 py-3 font-medium text-slate-300">
                                            {item.label}
                                        </td>
                                        <td className="px-5 py-3 text-right font-mono text-slate-200">
                                            {item.value}
                                        </td>
                                        <td className="px-5 py-3 text-right">
                                            {item.trend === 'up' ? (
                                                <span className="text-emerald-400 flex items-center justify-end gap-1 text-xs font-bold">
                                                    <TrendingUp className="w-3 h-3" />
                                                    {typeof item.pct === 'number' ? `+${item.pct}%` : item.pct}
                                                </span>
                                            ) : (
                                                <span className="text-rose-400 flex items-center justify-end gap-1 text-xs font-bold">
                                                    <TrendingDown className="w-3 h-3" />
                                                    {typeof item.pct === 'number' ? `-${item.pct}%` : item.pct}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Footer Summary */}
                <div className="p-4 bg-slate-900/30 border-t border-slate-800 text-center">
                    <button onClick={onClose} className="text-xs text-blue-400 hover:text-blue-300 font-bold uppercase tracking-wider">
                        Cerrar Detalles
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DrillDownModal;
