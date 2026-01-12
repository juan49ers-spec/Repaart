import React from 'react';
import { Shield, CheckCircle2, AlertTriangle, XCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Franchise {
    id: string;
    name: string;
    metrics?: {
        margin: number;
    };
}

interface ControlNetworkWidgetProps {
    data: {
        total: number;
        excellent: number;
        acceptable: number;
        critical: number;
        franchises: Franchise[];
    };
    loading?: boolean;
}

const ControlNetworkWidget: React.FC<ControlNetworkWidgetProps> = ({ data, loading }) => {
    const navigate = useNavigate();

    if (loading) {
        return (
            <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-md rounded-2xl border border-white/20 dark:border-slate-800/50 p-6 h-full animate-pulse">
                <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded mb-6" />
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800/50 rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-slate-800/50 p-6 flex flex-col h-full shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                        <Shield className="w-4 h-4 text-indigo-500" />
                        Control de Red
                    </h3>
                    <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-tight mt-1">
                        {data.total} Sedes Activas
                    </p>
                </div>
                <div className="flex gap-1">
                    <StatusBadge count={data.excellent} type="excellent" />
                    <StatusBadge count={data.acceptable} type="acceptable" />
                    <StatusBadge count={data.critical} type="critical" />
                </div>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-1">
                {data.franchises.slice(0, 5).map(f => {
                    const margin = f.metrics?.margin || 0;
                    const status = margin > 20 ? 'excellent' : margin > 10 ? 'acceptable' : 'critical';

                    return (
                        <div
                            key={f.id}
                            onClick={() => navigate(`/admin/franchise/${f.id}`)}
                            className="group flex items-center justify-between p-3 rounded-xl bg-white/50 dark:bg-slate-800/30 border border-slate-100 dark:border-white/5 hover:border-indigo-500/30 hover:bg-white dark:hover:bg-slate-800 transition-all cursor-pointer"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${status === 'excellent' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' :
                                    status === 'acceptable' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' :
                                        'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'
                                    }`} />
                                <div>
                                    <p className="text-xs font-bold text-slate-900 dark:text-white tracking-tight uppercase line-clamp-1">
                                        {f.name}
                                    </p>
                                    <p className="text-[9px] text-slate-500 font-semibold tracking-tighter uppercase">
                                        Margen: {margin.toFixed(1)}%
                                    </p>
                                </div>
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                        </div>
                    );
                })}
            </div>

            <button
                onClick={() => navigate('/dashboard?view=franchises')}
                className="mt-4 w-full py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
            >
                Ver Directorio Completo
            </button>
        </div>
    );
};

const StatusBadge = ({ count, type }: { count: number, type: 'excellent' | 'acceptable' | 'critical' }) => {
    const config = {
        excellent: { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        acceptable: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50/10' },
        critical: { icon: XCircle, color: 'text-rose-500', bg: 'bg-rose-500/10' }
    }[type];

    const Icon = config.icon;

    return (
        <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md ${config.bg} border border-white/10`}>
            <Icon className={`w-2.5 h-2.5 ${config.color}`} />
            <span className={`text-[10px] font-bold ${config.color}`}>{count}</span>
        </div>
    );
};

export default ControlNetworkWidget;
