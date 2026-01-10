import { type FC, type CSSProperties } from 'react';
import { TrendingUp, Calendar, AlertTriangle, CheckCircle } from 'lucide-react';
import { formatMoney, projectMonthEnd } from '../../../../lib/finance';

interface ForecastingWidgetProps {
    currentRevenue: number;
    breakEvenOrders: number | string;
    avgTicket: number;
}

const ForecastingWidget: FC<ForecastingWidgetProps> = ({ currentRevenue, breakEvenOrders, avgTicket }) => {
    const projectedRevenue = projectMonthEnd(currentRevenue);

    // Calculate Break Even Revenue
    const breakEvenRevenue = (breakEvenOrders !== "N/A" && typeof breakEvenOrders === 'number' && breakEvenOrders > 0)
        ? breakEvenOrders * avgTicket
        : 0;

    const isOnTrack = projectedRevenue > breakEvenRevenue;
    const daysLeft = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - new Date().getDate();

    return (
        <div className="bg-gradient-to-r from-slate-900 to-indigo-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden mb-6">
            <div className="flex justify-between items-start relative z-10">
                <div>
                    <h3 className="text-lg font-bold flex items-center mb-1">
                        <TrendingUp className="w-5 h-5 mr-2 text-emerald-400" />
                        Proyección Cierre de Mes
                    </h3>
                    <p className="text-slate-300 text-xs">
                        Estimación basada en tu ritmo actual.
                    </p>
                </div>
                <div className="text-right bg-white/10 p-2 rounded-lg backdrop-blur-sm border border-white/10">
                    <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-wider">Días Restantes</p>
                    <p className="text-xl font-black text-white flex items-center justify-end">
                        <Calendar className="w-4 h-4 mr-2 opacity-70" /> {daysLeft}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-6 relative z-10">
                {/* CURRENT */}
                <div>
                    <p className="text-xs font-bold text-slate-400 uppercase">Facturado (Hoy)</p>
                    <p className="text-2xl font-bold text-white mt-1">{formatMoney(currentRevenue)}€</p>
                </div>

                {/* PROJECTED */}
                <div>
                    <p className="text-xs font-bold text-emerald-400 uppercase">Proyección (Fin Mes)</p>
                    <p className="text-3xl font-black text-emerald-400 mt-1">{formatMoney(projectedRevenue)}€</p>
                </div>

                {/* STATUS */}
                <div className={`p-4 rounded-xl border ${isOnTrack ? 'bg-emerald-500/20 border-emerald-500/30' : 'bg-amber-500/20 border-amber-500/30'} flex items-center`}>
                    {isOnTrack ? (
                        <>
                            <CheckCircle className="w-8 h-8 text-emerald-400 mr-3" />
                            <div>
                                <p className="font-bold text-emerald-200 text-sm">Ritmo Saludable</p>
                                <p className="text-xs text-emerald-100/70">Superarás el Break-even.</p>
                            </div>
                        </>
                    ) : (
                        <>
                            <AlertTriangle className="w-8 h-8 text-amber-400 mr-3" />
                            <div>
                                <p className="font-bold text-amber-200 text-sm">Riesgo Detectado</p>
                                <p className="text-xs text-amber-100/70">Necesitas +{formatMoney(Math.max(0, breakEvenRevenue - projectedRevenue))}€.</p>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* PROGRESS BAR */}
            <div className="mt-6 relative pt-4">
                <div className="flex justify-between text-xs text-slate-400 mb-2 font-medium">
                    <span>0€</span>
                    <span className="text-indigo-300">Break-even: {formatMoney(breakEvenRevenue)}€</span>
                    <span>Objetivo: {formatMoney(breakEvenRevenue * 1.5)}€</span>
                </div>
                <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden relative">
                    {/* Break Even Marker */}
                    <div className="absolute top-0 bottom-0 w-0.5 bg-indigo-500 z-20" style={{ left: `${Math.min(100, (breakEvenRevenue / (breakEvenRevenue * 1.5)) * 100)}%` } as CSSProperties} />

                    {/* Projected Bar */}
                    <div className="h-full bg-emerald-500/50 absolute top-0 left-0 transition-all duration-1000" style={{ width: `${Math.min(100, (projectedRevenue / (breakEvenRevenue * 1.5)) * 100)}%` } as CSSProperties} />

                    {/* Current Bar */}
                    <div className="h-full bg-emerald-400 relative z-10 rounded-r-full transition-all duration-1000 shadow-[0_0_10px_rgba(52,211,153,0.5)]" style={{ width: `${Math.min(100, (currentRevenue / (breakEvenRevenue * 1.5)) * 100)}%` } as CSSProperties} />
                </div>
            </div>

            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-emerald-500 rounded-full mix-blend-overlay filter blur-3xl opacity-10 animate-pulse" />
        </div>
    );
};

export default ForecastingWidget;
