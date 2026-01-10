import React, { type FC, type CSSProperties } from 'react';
import { Trophy, Award, Star, type LucideIcon } from 'lucide-react';
import { formatMoney } from '../../../../lib/finance';

type Tier = 'BRONCE' | 'PLATA' | 'ORO';

interface GamificationWidgetProps {
    revenue: number;
}

const GamificationWidget: FC<GamificationWidgetProps> = ({ revenue }) => {
    // SIMULATED RANKING LOGIC FOR MVP
    // In production, this would come from the backend comparison.

    // Determine Tier based on Revenue
    let tier: Tier = 'BRONCE';
    let color = 'text-amber-700 bg-amber-100 border-amber-200';
    let icon: LucideIcon = Award;
    let percentile = 65; // Top 65%

    if (revenue > 15000) {
        tier = 'PLATA';
        color = 'text-slate-500 bg-slate-100 border-slate-200';
        icon = Star;
        percentile = 35; // Top 35%
    }

    if (revenue > 25000) {
        tier = 'ORO';
        color = 'text-yellow-600 bg-yellow-100 border-yellow-200';
        icon = Trophy;
        percentile = 8; // Top 8%
    }

    return (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xl shadow-indigo-100/50 relative overflow-hidden mb-6 flex items-center justify-between">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-50 to-transparent rounded-bl-full -mr-10 -mt-10 opacity-50" />

            <div className="flex items-center gap-6 relative z-10">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border-4 ${color} shadow-sm`}>
                    {React.createElement(icon, { className: "w-8 h-8" })}
                </div>

                <div>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Tu Posición Mensual
                    </h3>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-slate-800">{tier}</span>
                        <span className="text-sm font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                            Top {percentile}%
                        </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 font-medium">
                        ¡Estás facturando más que el {100 - percentile}% de la red!
                    </p>
                </div>
            </div>

            <div className="hidden md:block text-right relative z-10">
                <div className="flex flex-col items-end">
                    <span className="text-xs font-bold text-slate-400 uppercase">Siguiente Nivel</span>
                    {tier === 'ORO' ? (
                        <span className="text-indigo-600 font-bold text-sm">¡Eres el Líder! 👑</span>
                    ) : (
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm font-bold text-slate-600">
                                +{formatMoney(tier === 'BRONCE' ? 15000 - revenue : 25000 - revenue)}€
                            </span>
                            <span className="text-xs text-slate-400">para subir</span>
                        </div>
                    )}
                </div>
                {/* Progress Bar */}
                {tier !== 'ORO' && (
                    <div className="w-32 h-2 bg-slate-100 rounded-full mt-2 overflow-hidden">
                        <div
                            className="h-full bg-indigo-500 rounded-full"
                            style={{ width: `${(revenue / (tier === 'BRONCE' ? 15000 : 25000)) * 100}%` } as CSSProperties}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default GamificationWidget;
