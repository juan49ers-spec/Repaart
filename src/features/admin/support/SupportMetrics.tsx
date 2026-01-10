import React from 'react';
import { Inbox, Eye, Clock, TrendingUp, CheckCircle } from 'lucide-react';
import { useSupport } from '../../../hooks/useSupport';
import { SupportMetrics as ISupportMetrics } from '../../../hooks/useSupportManager';

interface SupportMetricsProps {
    viewMode: string;
}

const SupportMetrics: React.FC<SupportMetricsProps> = ({ viewMode }) => {
    // Assert usage of SupportManager context structure
    const { metrics } = useSupport() as { metrics: ISupportMetrics };

    if (!metrics) return null; // Safety check

    if (viewMode === 'analytics') {
        return (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm animate-in fade-in zoom-in-95 duration-300 transition-colors">
                <h2 className="text-xl font-black text-slate-800 dark:text-white mb-6">Métricas de Rendimiento</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {/* Categories */}
                    <div>
                        <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase mb-4 tracking-widest">Volumen por Categoría</h3>
                        <div className="space-y-4">
                            {Object.entries(metrics.byCategory || {}).map(([key, val]) => (
                                <div key={key}>
                                    <div className="flex justify-between text-sm mb-1.5">
                                        <span className="font-bold capitalize text-slate-700 dark:text-slate-300">{key}</span>
                                        <span className="font-bold text-slate-900 dark:text-white">{val} / {metrics.total}</span>
                                    </div>
                                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                                        <div
                                            className="bg-indigo-600 dark:bg-indigo-500 h-2.5 rounded-full transition-all duration-1000 ease-out"
                                            style={{ width: metrics.total > 0 ? `${(val / metrics.total) * 100}%` : '0%' }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* Efficiency */}
                    <div>
                        <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase mb-4 tracking-widest">Eficiencia Operativa</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-xl p-5 border border-emerald-100 dark:border-emerald-500/20 transition-colors">
                                <p className="text-emerald-800 dark:text-emerald-400 text-xs font-black uppercase mb-1">Tasa de Resolución</p>
                                <p className="text-3xl font-black text-emerald-600 dark:text-emerald-300">
                                    {metrics.total > 0 ? ((metrics.resolved / metrics.total) * 100).toFixed(0) : 0}%
                                </p>
                            </div>
                            <div className="bg-rose-50 dark:bg-rose-500/10 rounded-xl p-5 border border-rose-100 dark:border-rose-500/20 transition-colors">
                                <p className="text-rose-800 dark:text-rose-400 text-xs font-black uppercase mb-1">Alta Prioridad</p>
                                <p className="text-3xl font-black text-rose-600 dark:text-rose-300">{metrics.critical + metrics.high}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const StatCard = ({ label, value, icon: Icon, colorClass, bgColorClass, iconColorClass }: { label: string, value: string | number, icon: any, colorClass: string, bgColorClass: string, iconColorClass: string }) => (
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between group hover:border-indigo-500/30 transition-all duration-300">
            <span className={`text-[10px] font-black uppercase tracking-widest mb-1 ${colorClass}`}>{label}</span>
            <div className="flex items-end justify-between">
                <span className="text-3xl font-black text-slate-900 dark:text-white">{value}</span>
                <div className={`p-2 rounded-lg ${bgColorClass} ${iconColorClass} transition-colors`}>
                    <Icon className="w-5 h-5" />
                </div>
            </div>
        </div>
    );

    return (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <StatCard label="Total" value={metrics.total} icon={Inbox} colorClass="text-slate-400 dark:text-slate-500" bgColorClass="bg-slate-50 dark:bg-slate-800" iconColorClass="text-slate-400 dark:text-slate-500" />
            <StatCard label="Sin Leer" value={metrics.unread} icon={Eye} colorClass="text-indigo-500 dark:text-indigo-400" bgColorClass="bg-indigo-50 dark:bg-indigo-500/10" iconColorClass="text-indigo-600 dark:text-indigo-400" />
            <StatCard label="Abiertos" value={metrics.open} icon={Clock} colorClass="text-amber-500 dark:text-amber-400" bgColorClass="bg-amber-50 dark:bg-amber-500/10" iconColorClass="text-amber-600 dark:text-amber-400" />
            <StatCard label="Resueltos" value={metrics.resolved} icon={CheckCircle} colorClass="text-emerald-500 dark:text-emerald-400" bgColorClass="bg-emerald-50 dark:bg-emerald-500/10" iconColorClass="text-emerald-600 dark:text-emerald-400" />
            <StatCard
                label="T. Medio"
                value={metrics.avgResponseMinutes < 60 ? Math.round(metrics.avgResponseMinutes) + 'm' : (metrics.avgResponseMinutes / 60).toFixed(1) + 'h'}
                icon={TrendingUp}
                colorClass="text-purple-500 dark:text-purple-400"
                bgColorClass="bg-purple-50 dark:bg-purple-500/10"
                iconColorClass="text-purple-600 dark:text-purple-400"
            />
        </div>
    );
};

export default SupportMetrics;
