import React, { useState } from 'react';
import {
    Calendar,
    Zap,
    ArrowRight,
    Trophy
} from 'lucide-react';
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
            <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-md rounded-2xl border border-white/20 dark:border-slate-800/50 p-6 h-full animate-pulse">
                <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded mb-6" />
                <div className="space-y-4">
                    {[1, 2].map(i => (
                        <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800/50 rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-slate-800/50 p-6 flex flex-col h-full shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden relative group">

            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-[60px] rounded-full pointer-events-none group-hover:bg-amber-500/10 transition-colors" />

            <div className="flex justify-between items-center mb-6 relative z-10">
                <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-amber-500" />
                        Próximos Eventos
                    </h3>
                    <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-tight mt-1">
                        Inteligencia Operativa
                    </p>
                </div>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-1 relative z-10">
                {events.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-40 py-8">
                        <Zap className="w-8 h-8 mb-2" />
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 text-center">Sin eventos relevantes<br />esta semana</p>
                    </div>
                ) : (
                    events.slice(0, 4).map(event => (
                        <div
                            key={event.id}
                            className={`group/item flex gap-4 p-4 rounded-xl border transition-all ${event.severity === 'critical'
                                ? 'bg-rose-50/50 dark:bg-rose-500/5 border-rose-100 dark:border-rose-500/20'
                                : 'bg-white/50 dark:bg-slate-800/30 border-slate-100 dark:border-white/5 hover:border-amber-500/30'
                                }`}
                        >
                            <div className="flex flex-col items-center justify-center shrink-0 w-10 h-10 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm">
                                <span className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-0.5">{format(event.date, 'MMM', { locale: es })}</span>
                                <span className="text-lg font-bold text-slate-900 dark:text-white leading-none">{format(event.date, 'd')}</span>
                            </div>

                            <div className="min-w-0 flex-1">
                                <h4 className={`text-xs font-bold tracking-tight uppercase truncate ${event.severity === 'critical' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'
                                    }`}>
                                    {event.title}
                                </h4>
                                <p className="text-[10px] text-slate-500 font-medium leading-snug line-clamp-2 mt-0.5 mt-1">
                                    {event.impact}
                                </p>
                            </div>

                            <div className="flex -space-x-3 shrink-0">
                                {event.type === 'match' && event.metadata?.teamLogo && (
                                    <LogoWithFallback
                                        src={event.metadata.teamLogo}
                                        alt={event.metadata.team || 'Team'}
                                        className="w-9 h-9 border-2 border-white dark:border-slate-900 rounded-full"
                                    />
                                )}
                                {event.type === 'match' && event.metadata?.opponentLogo && (
                                    <LogoWithFallback
                                        src={event.metadata.opponentLogo}
                                        alt={event.metadata.opponent || 'Opponent'}
                                        className="w-9 h-9 border-2 border-white dark:border-slate-900 rounded-full"
                                    />
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            <button
                className="mt-4 w-full py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-amber-600 dark:hover:text-amber-400 transition-all flex items-center justify-center gap-2"
            >
                Calendario Operativo <ArrowRight className="w-3 h-3" />
            </button>
        </div>
    );
};

// --- Sub-components for stability ---

const LogoWithFallback = ({ src, alt, className }: { src: string, alt: string, className: string }) => {
    const [hasError, setHasError] = useState(false);

    if (hasError) {
        return (
            <div className={`${className} bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400`}>
                <Trophy className="w-4 h-4" />
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={alt}
            className={`${className} object-contain bg-white dark:bg-slate-900 shadow-sm`}
            onError={() => setHasError(true)}
        />
    );
};

export default ControlEventsWidget;
