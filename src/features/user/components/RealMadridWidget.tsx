import { FC } from 'react';
import { useRealMadridMatch } from '../../../services/sportsService';
import { Radio, MapPin, Clock, Trophy, PlayCircle, Loader2 } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface RealMadridWidgetProps {
    variant?: 'sidebar' | 'header';
    className?: string;
}

const RealMadridWidget: FC<RealMadridWidgetProps> = ({ variant = 'sidebar', className }) => {
    const { match, loading, isSimulating, toggleSimulation } = useRealMadridMatch();

    if (loading) return <div className={cn("rounded-2xl bg-slate-100 animate-pulse", variant === 'sidebar' ? "h-48" : "h-12 w-48")} />;

    if (!match) return null;

    const isLive = match.status === 'live';

    // --- VARIANT: SIDEBAR (Full Card) ---
    if (variant === 'sidebar') {
        return (
            <div className={cn("relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group", className)}>
                {/* BACKGROUND PATTERN */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                    style={{ backgroundImage: `url('https://upload.wikimedia.org/wikipedia/en/thumb/5/56/Real_Madrid_CF.svg/1200px-Real_Madrid_CF.svg.png')`, backgroundSize: '150%', backgroundPosition: 'center' }}
                />

                {/* HEADER */}
                <div className="relative px-5 py-3 flex items-center justify-between border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="flex items-center gap-2">
                        <Trophy className="w-3.5 h-3.5 text-amber-500" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{match.competition}</span>
                    </div>
                    {isLive ? (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full animate-pulse border border-red-200 dark:border-red-800">
                            <Radio className="w-3 h-3" />
                            <span className="text-[9px] font-black uppercase tracking-widest">Live</span>
                            <span className="text-[10px] font-bold tabular-nums">{match.minute}'</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-slate-400">
                            <span className="text-[10px] font-medium">
                                {match.date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                            </span>
                            <Clock className="w-3 h-3" />
                            <span className="text-[10px] font-medium">
                                {match.date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    )}
                </div>

                {/* SCOREBOARD */}
                <div className="relative p-5 flex items-center justify-between">
                    {/* HOME (Real Madrid) */}
                    <div className="flex flex-col items-center gap-2 flex-1">
                        <div className="w-12 h-12 relative transition-transform group-hover:scale-110 duration-300">
                            <img
                                src="https://upload.wikimedia.org/wikipedia/en/thumb/5/56/Real_Madrid_CF.svg/1200px-Real_Madrid_CF.svg.png"
                                alt="Real Madrid"
                                className="w-full h-full object-contain drop-shadow-lg"
                            />
                        </div>
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-xs text-center leading-tight">Real Madrid</span>
                    </div>

                    {/* SCORE / VERSUS */}
                    <div className="flex flex-col items-center justify-center px-2 min-w-[80px]">
                        {isLive || match.status === 'finished' ? (
                            <div className="flex items-center gap-3 text-3xl font-black text-slate-800 dark:text-white tracking-tighter tabular-nums shadow-sm">
                                <span>{match.score.realMadrid}</span>
                                <span className="text-slate-300 dark:text-slate-600 text-xl">-</span>
                                <span>{match.score.opponent}</span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center">
                                <span className="text-2xl font-black text-slate-200 dark:text-slate-700">VS</span>
                            </div>
                        )}
                    </div>

                    {/* AWAY */}
                    <div className="flex flex-col items-center gap-2 flex-1">
                        <div className="w-12 h-12 relative transition-transform group-hover:scale-110 duration-300">
                            <img
                                src={match.opponentLogo}
                                alt={match.opponent}
                                className="w-full h-full object-contain drop-shadow-lg grayscale group-hover:grayscale-0 transition-all duration-500"
                            />
                        </div>
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-xs text-center leading-tight max-w-[80px] truncate">{match.opponent}</span>
                    </div>
                </div>

                {/* FOOTER */}
                <div className="px-5 py-2.5 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center text-[10px] text-slate-400">
                    <div className="flex items-center gap-1.5 overflow-hidden">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate max-w-[120px]">Santiago Bernabéu</span>
                    </div>

                    <button
                        onClick={toggleSimulation}
                        className={cn("flex items-center gap-1 px-2 py-1 rounded-md transition-all flex-shrink-0",
                            isSimulating
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                                : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600'
                        )}
                        title="Simular partido"
                    >
                        {isSimulating ? <Loader2 className="w-3 h-3 animate-spin" /> : <PlayCircle className="w-3 h-3" />}
                    </button>
                </div>
            </div>
        );
    }

    // --- VARIANT: HEADER (Compact) ---
    return (
        <div className={cn(
            "flex items-center gap-3 px-3 py-1.5 rounded-xl border transition-all duration-300",
            isLive
                ? "bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-red-100 dark:border-red-900/30 shadow-sm ring-1 ring-red-500/10"
                : "bg-white/50 dark:bg-slate-800/50 border-transparent hover:bg-white hover:border-slate-200 dark:hover:border-slate-700 hover:shadow-sm",
            className
        )}>
            {/* Competition Icon */}
            <div className={cn("hidden lg:flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0", isLive ? "bg-red-50 dark:bg-red-900/10" : "bg-slate-100 dark:bg-slate-800")}>
                {isLive ? <Radio className="w-4 h-4 text-red-500 animate-pulse" /> : <Trophy className="w-4 h-4 text-amber-500" />}
            </div>

            {/* Match Info */}
            <div className="flex items-center gap-3">
                {/* RM Logo */}
                <img
                    src="https://upload.wikimedia.org/wikipedia/en/thumb/5/56/Real_Madrid_CF.svg/1200px-Real_Madrid_CF.svg.png"
                    alt="RM"
                    className="w-6 h-6 object-contain"
                />

                {/* Score / Time */}
                <div className="flex flex-col items-center min-w-[40px]">
                    {isLive || match.status === 'finished' ? (
                        <div className="text-sm font-black text-slate-800 dark:text-slate-100 leading-none">
                            {match.score.realMadrid}-{match.score.opponent}
                        </div>
                    ) : (
                        <span className="text-[10px] font-bold text-slate-400">VS</span>
                    )}
                    {isLive ? (
                        <span className="text-[9px] font-bold text-red-500 animate-pulse">{match.minute}'</span>
                    ) : (
                        <span className="text-[9px] font-medium text-slate-400">
                            {match.date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    )}
                </div>

                {/* Opponent Logo */}
                <img
                    src={match.opponentLogo}
                    alt={match.opponent}
                    className="w-6 h-6 object-contain"
                />
            </div>

            {/* Opponent & Simulate (Hover only) */}
            <div className="hidden xl:flex flex-col ml-1">
                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate max-w-[80px]">
                    {match.opponent}
                </span>
                <span className="text-[9px] text-slate-400 truncate max-w-[80px]">
                    {match.competition}
                </span>
            </div>

            {/* Hidden simulation trigger for demo purposes */}
            <button onClick={toggleSimulation} className="opacity-0 w-0 h-0 overflow-hidden focus:opacity-100 focus:w-auto focus:h-auto">
                Sim
            </button>
        </div>
    );
};

export default RealMadridWidget;
