import { type FC } from 'react';
import { Activity } from 'lucide-react';

interface FranchiseData {
    profit?: number;
    revenue?: number;
}

interface Franchise {
    data?: FranchiseData;
}

interface NetworkStatusCounts {
    excellent: number;
    acceptable: number;
    critical: number;
}

interface NetworkStatusWidgetProps {
    franchises: Franchise[];
}

const NetworkStatusWidget: FC<NetworkStatusWidgetProps> = ({ franchises }) => {
    // Calculate network status counts
    const counts = franchises.reduce<NetworkStatusCounts>((acc, f) => {
        const margin = f.data?.profit && f.data.profit > 0 && f.data?.revenue && f.data.revenue > 0
            ? (f.data.profit / f.data.revenue) * 100
            : 0;

        if (margin >= 20) acc.excellent++;
        else if (margin >= 10) acc.acceptable++;
        else acc.critical++;

        return acc;
    }, { excellent: 0, acceptable: 0, critical: 0 });

    return (
        <div className="lg:col-span-2 bg-white dark:bg-[#0B0E14] rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 p-6 relative overflow-hidden group/card hover:border-indigo-300 dark:hover:border-indigo-500/30 transition-all">
            {/* Ambient Base Layer */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent opacity-0 dark:opacity-100 pointer-events-none" />

            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center relative z-10">
                <div className="p-1.5 bg-indigo-50 dark:bg-white/5 rounded-lg border border-transparent dark:border-white/10 mr-3 group-hover/card:border-indigo-500/30 transition-colors">
                    <Activity className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                Estado de la Red
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
                <div className="bg-emerald-50 dark:bg-emerald-500/5 border-2 border-emerald-200 dark:border-emerald-500/20 rounded-xl p-4 hover:shadow-md transition-shadow group/status hover:border-emerald-300 dark:hover:border-emerald-500/40">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]">🟢</span>
                        <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums drop-shadow-sm">{counts.excellent}</span>
                    </div>
                    <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider group-hover/status:text-emerald-800 dark:group-hover/status:text-emerald-300 transition-colors">Excelente</p>
                    <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400/60 mt-1 font-mono">Margen &ge; 20%</p>
                </div>

                <div className="bg-amber-50 dark:bg-amber-500/5 border-2 border-amber-200 dark:border-amber-500/20 rounded-xl p-4 hover:shadow-md transition-shadow group/status hover:border-amber-300 dark:hover:border-amber-500/40">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]">🟡</span>
                        <span className="text-3xl font-black text-amber-600 dark:text-amber-400 tabular-nums drop-shadow-sm">{counts.acceptable}</span>
                    </div>
                    <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider group-hover/status:text-amber-800 dark:group-hover/status:text-amber-300 transition-colors">Aceptable</p>
                    <p className="text-[10px] text-amber-600/80 dark:text-amber-400/60 mt-1 font-mono">Margen 10-20%</p>
                </div>

                <div className="bg-rose-50 dark:bg-rose-500/5 border-2 border-rose-200 dark:border-rose-500/20 rounded-xl p-4 hover:shadow-md transition-shadow group/status hover:border-rose-300 dark:hover:border-rose-500/40">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]">🔴</span>
                        <span className="text-3xl font-black text-rose-600 dark:text-rose-400 tabular-nums drop-shadow-sm">{counts.critical}</span>
                    </div>
                    <p className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider group-hover/status:text-rose-800 dark:group-hover/status:text-rose-300 transition-colors">Crítico</p>
                    <p className="text-[10px] text-rose-600/80 dark:text-rose-400/60 mt-1 font-mono">Margen &lt; 10%</p>
                </div>
            </div>
        </div>
    );
};

export default NetworkStatusWidget;
