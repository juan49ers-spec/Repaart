import React from 'react';
import { Calendar, Zap, MapPin, Server, Users, AlertCircle } from 'lucide-react';
import { IntellectualEvent } from '../../../../services/intelService';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ControlEventsWidgetProps {
    events: IntellectualEvent[];
    loading?: boolean;
}

const ControlEventsWidget: React.FC<ControlEventsWidgetProps> = ({ events, loading }) => {
    if (loading) {
        return (
            <div className="bg-white/50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 h-full">
                <div className="h-5 w-32 bg-slate-200 dark:bg-slate-800 rounded mb-6" />
                <div className="space-y-4">
                    {[1, 2].map(i => (
                        <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800/50 rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col h-full shadow-sm">

            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        Eventos & Alertas
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                        Inteligencia operativa
                    </p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                {events.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center py-8 text-slate-400">
                        <Zap className="w-10 h-10 mb-3 text-amber-500/50" />
                        <p className="text-sm font-medium text-center">Sin eventos relevantes<br />esta semana</p>
                    </div>
                ) : (
                    <div className="relative pl-6 space-y-6 border-l border-slate-200 dark:border-slate-800 ml-3">
                        {events.slice(0, 4).map((event) => (
                            <div key={event.id} className="relative group">
                                {/* Timeline Dot */}
                                <div className={`absolute -left-[31px] top-1.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${event.severity === 'critical' ? 'bg-rose-500' : 'bg-slate-300 dark:bg-slate-600 group-hover:bg-indigo-500'
                                    } transition-colors`} />

                                <div className={`flex gap-3 p-3 rounded-xl transition-all ${event.severity === 'critical'
                                        ? 'bg-rose-50 dark:bg-rose-900/10 border-l-2 border-l-rose-500'
                                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                    }`}>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className={`text-sm font-medium truncate ${event.severity === 'critical' ? 'text-rose-700 dark:text-rose-300' : 'text-slate-900 dark:text-white'
                                                }`}>
                                                {event.title}
                                            </h4>
                                            <span className="text-xs font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                                {format(event.date, 'd MMM', { locale: es })}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                                            {event.impact}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ControlEventsWidget;
