import React from 'react';
import { format, startOfWeek, endOfWeek, isSameWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar, RotateCcw } from 'lucide-react';

interface OperationsHeaderProps {
    currentDate: Date;
    onNavigate: (direction: 'prev' | 'next') => void;
    onToday: () => void;
}

const OperationsHeader: React.FC<OperationsHeaderProps> = ({ currentDate, onNavigate, onToday }) => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    const end = endOfWeek(currentDate, { weekStartsOn: 1 });
    const isCurrentWeek = isSameWeek(currentDate, new Date(), { weekStartsOn: 1 });

    return (
        <div className="bg-white border-b border-slate-200 px-6 py-5">
            <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
                {/* Título y Contexto */}
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                        Horarios
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase tracking-wider">
                            Command Center
                        </span>
                    </h1>
                    <p className="text-slate-500 text-sm mt-1 flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                        </span>
                        Sistema activo • Madrid Centro
                    </p>
                </div>

                {/* Controles de Tiempo */}
                <div className="flex items-center gap-3">
                    {!isCurrentWeek && (
                        <button
                            onClick={onToday}
                            className="hidden md:flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-blue-700 bg-slate-50 border border-slate-200 rounded-lg hover:border-blue-300 hover:bg-white transition-all animate-in fade-in slide-in-from-right-4 shadow-sm"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Volver a Hoy
                        </button>
                    )}

                    <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200 shadow-sm">
                        <button
                            onClick={() => onNavigate('prev')}
                            className="p-2 hover:bg-white rounded-lg transition-all text-slate-500 hover:text-blue-600 hover:shadow-sm border border-transparent hover:border-slate-100"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-3 px-4 min-w-[220px] justify-center border-x border-slate-200">
                            <Calendar className="w-4 h-4 text-indigo-600" />
                            <div className="flex flex-col items-center leading-none">
                                <span className="text-sm font-bold text-slate-800 capitalize">
                                    {format(start, "d MMM", { locale: es })} - {format(end, "d MMM", { locale: es })}
                                </span>
                                <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                                    {format(end, "yyyy")}
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={() => onNavigate('next')}
                            className="p-2 hover:bg-white rounded-lg transition-all text-slate-500 hover:text-blue-600 hover:shadow-sm border border-transparent hover:border-slate-100"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OperationsHeader;
