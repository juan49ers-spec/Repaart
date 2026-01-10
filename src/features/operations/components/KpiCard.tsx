import { type FC } from 'react';
import { type LucideIcon } from 'lucide-react';

type ColorType = 'indigo' | 'blue' | 'rose' | 'emerald' | 'amber' | 'slate';

interface KpiCardProps {
    title: string;
    value: string | number;
    subtext?: string;
    icon: LucideIcon;
    color: ColorType;
    trend?: number;
}

const KpiCard: FC<KpiCardProps> = ({ title, value, subtext, icon: Icon, color, trend }) => {
    // Colores ajustados para mejor contraste en Dark Mode
    const colorMap: Record<ColorType, string> = {
        indigo: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
        blue: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
        rose: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
        emerald: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
        amber: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
        slate: 'bg-slate-700/30 text-slate-300 border-slate-600/30',
    };

    const styleClass = colorMap[color] || colorMap.indigo;

    return (
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-900/50 p-5 rounded-xl border border-slate-800 hover:border-slate-700 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/5 group">

            {/* Background Glow Effect on Hover */}
            <div className={`absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 ${color === 'rose' ? 'bg-rose-500' : 'bg-indigo-500'}`} />

            <div className="relative z-10 flex justify-between items-start">
                <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 opacity-80">
                        {title}
                    </p>
                    <h3 className="text-2xl font-extrabold text-white tracking-tight tabular-nums">
                        {value}
                    </h3>
                </div>
                <div className={`p-2.5 rounded-lg border ${styleClass} group-hover:scale-105 transition-transform duration-300`}>
                    <Icon className="w-5 h-5" />
                </div>
            </div>

            {(subtext || trend !== undefined) && (
                <div className="relative z-10 mt-4 flex items-center gap-2.5">
                    {trend !== undefined && (
                        <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1 ${trend > 0
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : trend < 0
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                : 'bg-slate-800 text-slate-400'
                            }`}>
                            {trend > 0 ? '↑' : trend < 0 ? '↓' : '-'}{Math.abs(trend)}%
                        </span>
                    )}
                    <span className="text-xs font-medium text-slate-500 truncate">
                        {subtext}
                    </span>
                </div>
            )}
        </div>
    );
};

export default KpiCard;
