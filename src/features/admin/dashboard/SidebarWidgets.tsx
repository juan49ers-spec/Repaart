import { type FC } from 'react';
import { AlertTriangle, Award, Star } from 'lucide-react';
import { detectAnomalies } from '../../../lib/fraudDetection';
import { formatMoney } from '../../../lib/finance';


interface FranchiseMetrics {
    profit: number;
    totalKm: number;
    gasoline?: number;
    incidentCost: number;
    otherExpenses: number;
    laborRatio: number;
    orders: number;
    avgTicket: number;
    productivity: number;
    revenue: number;
}

interface Franchise {
    id: string;
    name: string;
    metrics: FranchiseMetrics;
}

interface Alert {
    type?: string;
    title: string;
    message: string;
    metric?: string;
}

interface EnrichedAlert extends Alert {
    franchiseName: string;
    franchiseId: string;
    franchise: Franchise;
}

interface SidebarWidgetsProps {
    franchises: Franchise[];
    setSelectedScorecard: (franchise: Franchise) => void;
}

const SidebarWidgets: FC<SidebarWidgetsProps> = ({ franchises, setSelectedScorecard }) => {
    // Collect all alerts
    const allAlerts: EnrichedAlert[] = franchises.flatMap(f => {
        const fAlerts = detectAnomalies(f as any) as Alert[];
        return fAlerts.map(a => ({ ...a, franchiseName: f.name, franchiseId: f.id, franchise: f }));
    });

    return (
        <div className="space-y-8">

            {/* ALERTS SECTION (Dynamic Fraud Detection) */}
            {allAlerts.length > 0 && (
                <div className="bg-ruby-950/20 dark:bg-ruby-900/10 backdrop-blur-2xl border border-ruby-500/20 rounded-[2rem] p-7 relative overflow-hidden shadow-2xl shadow-ruby-900/10 animate-in fade-in slide-in-from-right-4 duration-700">
                    <div className="flex items-center mb-6 relative z-10 gap-3">
                        <div className="bg-ruby-600 p-2.5 rounded-2xl shadow-lg shadow-ruby-900/40">
                            <AlertTriangle className="w-4 h-4 text-white" strokeWidth={3} />
                        </div>
                        <div>
                            <h3 className="font-black text-ruby-600 dark:text-ruby-400 text-xs uppercase tracking-[0.2em] italic">Intelligence</h3>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Alertas Operativas</p>
                        </div>
                    </div>
                    <div className="space-y-4 relative z-10 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {allAlerts.map((alert, idx) => (
                            <div
                                key={`${alert.franchiseId}-${idx}`}
                                className="bg-white/40 dark:bg-white/5 p-4 rounded-2xl border border-ruby-500/10 hover:border-ruby-500/30 transition-all duration-500 cursor-pointer group hover:bg-white/60 dark:hover:bg-white/10"
                                onClick={() => setSelectedScorecard(alert.franchise)}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-black text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-[0.15em]">{alert.franchiseName}</span>
                                    {alert.type === 'CRITICAL' && (
                                        <span className="bg-ruby-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full tracking-tighter animate-pulse">CRITICAL</span>
                                    )}
                                </div>
                                <p className="font-black text-slate-900 dark:text-white text-[13px] leading-tight group-hover:text-ruby-600 transition-colors uppercase italic">{alert.title}</p>
                                <p className="text-[11px] font-bold text-slate-500 mt-2 line-clamp-2">{alert.message}</p>
                                <div className="mt-3 flex justify-end">
                                    <span className="text-[10px] font-black text-ruby-600 px-2 py-1 bg-ruby-600/10 rounded-lg tracking-tighter">
                                        ANOMALY: {alert.metric}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                    {/* Glowing background hint */}
                    <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-ruby-600/10 rounded-full blur-[60px]" />
                </div>
            )}

            {/* TOP 3 PODIUM */}
            <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl rounded-[2.5rem] border border-white/20 dark:border-white/5 p-7 relative overflow-hidden shadow-2xl shadow-black/5">
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-2.5 bg-slate-900 dark:bg-white rounded-2xl">
                        <Award className="w-5 h-5 text-white dark:text-slate-900" strokeWidth={3} />
                    </div>
                    <div>
                        <h3 className="font-black text-slate-900 dark:text-white text-xs uppercase tracking-[0.2em] italic">Prestige</h3>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Top Rendimiento</p>
                    </div>
                </div>

                <div className="space-y-4 relative z-10">
                    {[...franchises].sort((a, b) => b.metrics.profit - a.metrics.profit).slice(0, 5).map((f, index) => {
                        const isTop = index < 3;
                        return (
                            <div
                                key={f.id}
                                onClick={() => setSelectedScorecard(f)}
                                className={`flex items-center p-4 rounded-2xl transition-all duration-500 cursor-pointer group ${index === 0 ? 'bg-ruby-600/5 dark:bg-ruby-600/10 border border-ruby-600/20' : 'hover:bg-white dark:hover:bg-white/5'
                                    }`}
                            >
                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mr-4 shadow-inner transition-all duration-500 group-hover:rotate-6 ${index === 0 ? 'bg-ruby-600 text-white' :
                                        index === 1 ? 'bg-slate-300 text-slate-700' :
                                            index === 2 ? 'bg-amber-600 text-white' :
                                                'bg-slate-100 dark:bg-slate-800 text-slate-400 font-black'
                                    }`}>
                                    {isTop ? <Star className="w-5 h-5" fill="currentColor" /> : <span className="text-xs">{index + 1}</span>}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[12px] font-black text-slate-900 dark:text-white truncate uppercase italic">{f.name}</p>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Franquicia</p>
                                </div>
                                <div className="text-right ml-3 text-sm font-black italic tracking-tighter">
                                    <span className={index === 0 ? 'text-ruby-600' : 'text-slate-900 dark:text-white'}>
                                        {formatMoney(f.metrics.profit, 0).replace('€', '')}
                                        <span className="text-[9px] ml-0.5 tracking-normal uppercase not-italic">€</span>
                                    </span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    );
};

export default SidebarWidgets;
