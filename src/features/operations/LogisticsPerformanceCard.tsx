import { Truck, MapPin } from 'lucide-react';
import { calculateLogisticsIntelligence, formatCurrency } from '../../utils/finance';

interface FinanceEntry {
    zone?: string;
    amount?: number;
    [key: string]: any;
}

interface LogisticsPerformanceCardProps {
    financeEntries: FinanceEntry[];
}

const LogisticsPerformanceCard = ({ financeEntries }: LogisticsPerformanceCardProps) => {
    // 1. Calculate Aggregated Stats
    const stats = calculateLogisticsIntelligence(financeEntries || []);
    const totalRevenue = stats.reduce((acc: number, curr: any) => acc + curr.revenue, 0);
    const totalOrders = stats.reduce((acc: number, curr: any) => acc + curr.count, 0);

    // If no data, render nothing (or a subtle empty state if preferred, but user said "null")
    if (totalRevenue === 0) return null;

    return (
        <div className="bg-slate-900/50 p-5 rounded-2xl border border-slate-800 shadow-sm backdrop-blur-sm">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-slate-200 font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                        <Truck className="h-4 w-4 text-indigo-500" />
                        Rendimiento Logístico
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">Eficiencia por zona de reparto</p>
                </div>
                <div className="text-right">
                    <div className="text-xl font-mono font-bold text-white">{formatCurrency(totalRevenue)}</div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase">{totalOrders} envíos totales</div>
                </div>
            </div>

            {/* List of Zones */}
            <div className="space-y-4">
                {stats.map((zone: any, index: number) => (
                    <div key={index} className="group">
                        {/* Label Row */}
                        <div className="flex justify-between text-xs mb-1.5">
                            <span className="font-bold text-slate-400 flex items-center gap-1.5 group-hover:text-indigo-400 transition-colors">
                                <MapPin className="h-3 w-3 opacity-50" />
                                {zone.name}
                            </span>
                            <span className="text-slate-200 font-mono">
                                {formatCurrency(zone.revenue)}
                                <span className="text-[10px] text-slate-600 ml-1.5">
                                    ({zone.count})
                                </span>
                            </span>
                        </div>

                        {/* Progress Bar Container */}
                        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div
                                className="bg-indigo-500 h-full rounded-full transition-all duration-1000 ease-out group-hover:bg-indigo-400 relative"
                                style={{ width: `${zone.percentage}%` }}
                            >
                                {/* Glow Effect */}
                                <div className="absolute right-0 top-0 bottom-0 w-2 bg-white/20 blur-[2px]" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-slate-800/50 text-[10px] text-center text-slate-600 uppercase tracking-widest font-bold">
                Analizando datos del periodo
            </div>
        </div>
    );
};

export default LogisticsPerformanceCard;
