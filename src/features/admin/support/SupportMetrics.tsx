import React from 'react';
import { MessageSquare, EyeOff, Loader2, CheckCircle, Clock } from 'lucide-react';
import { useSupport } from '../../../hooks/useSupport';
import { SupportMetrics as ISupportMetrics } from '../../../hooks/useSupportManager';

interface SupportMetricsProps {
    viewMode: string;
}

interface MetricCardProps {
    icon: React.ElementType;
    label: string;
    value: string | number;
    color: string;
    description?: string;
}

const MetricCard = ({ icon: Icon, label, value, color, description }: MetricCardProps) => (
    <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-6 rounded-3xl shadow-sm border border-slate-200/50 dark:border-slate-800/50 group transition-all hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1">
        <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-2xl ${color} bg-opacity-10 dark:bg-opacity-20 transition-colors shadow-inner`}>
                <Icon size={20} className="transition-transform group-hover:scale-110" />
            </div>
            {description && (
                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{description}</span>
            )}
        </div>
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">{label}</p>
        <p className="text-3xl font-semibold text-slate-900 dark:text-white tracking-tight">{value}</p>
    </div>
);

const SupportMetrics: React.FC<SupportMetricsProps> = ({ viewMode }) => {
    // Assert usage of SupportManager context structure
    const { metrics } = useSupport() as { metrics: ISupportMetrics };

    if (!metrics) return null; // Safety check

    if (viewMode === 'analytics') {
        return (
            <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-sm border border-slate-200/50 dark:border-slate-800/50 animate-in fade-in zoom-in-95 duration-300 transition-colors">
                <h2 className="text-xl font-black text-slate-800 dark:text-white mb-6">Métricas de Rendimiento</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {/* Efficiency */}
                    <div>
                        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase mb-4 tracking-widest">Eficiencia Operativa</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-emerald-50/50 dark:bg-emerald-500/10 rounded-2xl p-5 border border-emerald-100/50 dark:border-emerald-500/20 transition-colors">
                                <p className="text-emerald-800 dark:text-emerald-400 text-xs font-semibold uppercase mb-1">Tasa de Resolución</p>
                                <p className="text-3xl font-semibold text-emerald-600 dark:text-emerald-300">
                                    {metrics.total > 0 ? ((metrics.resolved / metrics.total) * 100).toFixed(0) : 0}%
                                </p>
                            </div>
                            <div className="bg-rose-50/50 dark:bg-rose-500/10 rounded-2xl p-5 border border-rose-100/50 dark:border-rose-500/20 transition-colors">
                                <p className="text-rose-800 dark:text-rose-400 text-xs font-semibold uppercase mb-1">Alta Prioridad</p>
                                <p className="text-3xl font-semibold text-rose-600 dark:text-rose-300">{metrics.critical + metrics.high}</p>
                            </div>
                        </div>
                    </div>
                    {/* Category Breakdown */}
                    <div className={`bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-sm border border-slate-200/50 dark:border-slate-800/50 col-span-full`}>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                            <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
                            Distribución de Consultas
                        </h3>
                        <div className="flex flex-wrap gap-4">
                            {Object.entries(metrics.byCategory || {}).map(([key, val]) => (
                                <div key={key} className="flex items-center gap-3 bg-slate-50/50 dark:bg-slate-800/40 px-5 py-3 rounded-2xl border border-slate-100 dark:border-slate-700/50 transition-all hover:border-indigo-500/30 hover:shadow-md">
                                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 capitalize">{key}</span>
                                    <span className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
                                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{val}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }



    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8 mt-2">
            <MetricCard
                icon={MessageSquare}
                label="Total Consultas"
                value={metrics.total}
                color="text-indigo-600 dark:text-indigo-400"
                description="Global"
            />
            <MetricCard
                icon={EyeOff}
                label="Sin Leer"
                value={metrics.unread}
                color="text-amber-600 dark:text-amber-400"
                description="Pendientes"
            />
            <MetricCard
                icon={Loader2}
                label="Abiertos"
                value={metrics.open}
                color="text-indigo-500 dark:text-indigo-300"
                description="En Proceso"
            />
            <MetricCard
                icon={CheckCircle}
                label="Resueltos"
                value={metrics.resolved}
                color="text-emerald-600 dark:text-emerald-400"
                description="Operados"
            />
            <MetricCard
                icon={Clock}
                label="T. Respuesta"
                value={metrics.avgResponseMinutes < 60 ? Math.round(metrics.avgResponseMinutes) + 'm' : (metrics.avgResponseMinutes / 60).toFixed(1) + 'h'}
                color="text-slate-600 dark:text-slate-400"
                description="Eficiencia"
            />
        </div>
    );
};

export default SupportMetrics;
