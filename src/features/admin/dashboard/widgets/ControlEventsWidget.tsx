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
            <div className="bg-white dark:bg-[#0B0E14] rounded-xl border border-slate-200 dark:border-white/5 shadow-sm p-4 h-full relative overflow-hidden">
                <div className="h-3 w-24 bg-slate-100 dark:bg-white/5 rounded animate-pulse mb-4" />
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-10 bg-slate-50 dark:bg-white/5 rounded animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-[#0B0E14] rounded-xl border border-slate-200 dark:border-white/5 shadow-sm p-4 flex flex-col h-full group/card hover:border-ruby-300 dark:hover:border-ruby-500/30 hover:shadow-md dark:shadow-none transition-all cursor-pointer relative overflow-hidden">
            {/* Ambient Base Layer */}
            <div className="absolute inset-0 bg-gradient-to-br from-ruby-500/5 via-transparent to-transparent opacity-0 dark:opacity-100 pointer-events-none" />

            {/* COMPACT TECHNICAL HEADER */}
            <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-slate-100 dark:bg-white/5 rounded-lg border border-transparent dark:border-white/10 group-hover/card:border-ruby-500/30 transition-colors">
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
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 -mx-1 px-1 relative z-10">
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
                                    flex items-center gap-3 p-2 rounded-xl transition-all border
                                    ${event.severity === 'critical'
                                        ? 'bg-ruby-50/50 dark:bg-ruby-500/10 border-ruby-100/50 dark:border-ruby-500/20'
                                        : 'border-transparent hover:bg-slate-50 dark:hover:bg-white/5 dark:hover:border-white/10'
                                    }
                                `}
                            >
                                {/* Minimal Dot Indicator */}
                                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${event.severity === 'critical' ? 'bg-ruby-500 shadow-[0_0_6px_rgba(225,29,72,0.4)]' : 'bg-slate-300 dark:bg-slate-600'
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
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between relative z-10">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest lowercase">status: optimal</span>
                <span className="text-[9px] font-bold text-ruby-600 dark:text-ruby-400 hover:underline cursor-pointer">History →</span>
            </div>
        </div>
    );
};

export default ControlEventsWidget;
