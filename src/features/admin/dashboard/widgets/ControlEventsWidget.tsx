import React from 'react';
import { Zap } from 'lucide-react';
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
            <div className="workstation-card p-4 h-full">
                <div className="h-3 w-24 bg-slate-100 dark:bg-slate-800 rounded animate-pulse mb-4" />
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-10 bg-slate-50 dark:bg-slate-800/40 rounded animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="workstation-card workstation-scanline p-4 flex flex-col h-full group/card hover:border-ruby-500/50 transition-all mechanical-press cursor-pointer">
            {/* COMPACT TECHNICAL HEADER */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        <Zap className="w-3.5 h-3.5 text-amber-500" />
                    </div>
                    <div>
                        <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] leading-tight font-mono">
                            event.log
                        </h3>
                        <div className="text-[8px] font-bold text-slate-400/60 uppercase">System Pulse</div>
                    </div>
                </div>
                <div className="flex items-center gap-1 bg-slate-50 dark:bg-white/5 px-2 py-1 rounded-full border border-slate-100 dark:border-white/5">
                    <span className="text-[9px] font-black text-slate-800 dark:text-slate-300 font-mono">{events.length}</span>
                    <span className="text-[7px] font-bold text-slate-400 uppercase">Alerts</span>
                </div>
            </div>

            {/* HIGH DENSITY EVENT LIST */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 -mx-1 px-1">
                {events.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center py-6 text-slate-300 dark:text-slate-700">
                        <Zap className="w-8 h-8 mb-2 opacity-20" />
                        <p className="text-[10px] font-bold uppercase tracking-widest text-center">No active<br />alerts</p>
                    </div>
                ) : (
                    <div className="space-y-1.5">
                        {events.slice(0, 6).map((event) => (
                            <div
                                key={event.id}
                                className={`
                                    flex items-center gap-3 p-2 rounded-xl transition-all border border-transparent
                                    ${event.severity === 'critical'
                                        ? 'bg-ruby-50/50 dark:bg-ruby-900/10 border-ruby-100/50 dark:border-ruby-900/20'
                                        : 'hover:bg-slate-50 dark:hover:bg-white/5'
                                    }
                                `}
                            >
                                {/* Minimal Dot Indicator */}
                                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${event.severity === 'critical' ? 'bg-ruby-500 shadow-[0_0_6px_rgba(225,29,72,0.4)]' : 'bg-slate-300 dark:bg-slate-700'
                                    }`} />

                                <div className="min-w-0 flex-1">
                                    <div className="flex justify-between items-center">
                                        <h4 className={`text-[11px] font-bold truncate tracking-tight ${event.severity === 'critical' ? 'text-ruby-700 dark:text-ruby-400' : 'text-slate-700 dark:text-slate-300'
                                            }`}>
                                            {event.title}
                                        </h4>
                                        <span className="text-[8px] font-black text-slate-400 font-mono ml-2">
                                            {format(event.date, 'HH:mm', { locale: es })}
                                        </span>
                                    </div>
                                    <p className="text-[9px] text-slate-400 leading-tight truncate mt-0.5">
                                        {event.impact}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* FOOTER ACTION */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/50 flex items-center justify-between">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest lowercase">status: optimal</span>
                <span className="text-[9px] font-bold text-ruby-600 hover:underline cursor-pointer">History →</span>
            </div>
        </div>
    );
};

export default ControlEventsWidget;
