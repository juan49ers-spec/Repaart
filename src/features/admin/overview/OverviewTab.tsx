import React from 'react';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import DashboardSkeleton from '../../../ui/layout/DashboardSkeleton';
import EmptyState from '../../../ui/feedback/EmptyState';
import { useAdminControl } from '../../../hooks/useAdminControl';

// Control Widgets
import ControlNetworkWidget from '../dashboard/widgets/ControlNetworkWidget';
import ControlPendingActionsWidget from '../dashboard/widgets/ControlPendingActionsWidget';
import ControlEventsWidget from '../dashboard/widgets/ControlEventsWidget';
import ControlEarningsWidget from '../dashboard/widgets/ControlEarningsWidget';

interface OverviewTabProps {
    onNavigate: (view: string) => void;
    selectedMonth: string;
}

const OverviewTab: React.FC<OverviewTabProps> = ({ onNavigate, selectedMonth }) => {
    const { data, loading, error } = useAdminControl(selectedMonth);
    // We still keep the original dashboard data hook if we need trendData for the lower section
    // but for the main "Control Center" row, we use useAdminControl.

    if (loading) return <DashboardSkeleton />;
    if (error) return <EmptyState title="Error de conexión" description={error || 'Unknown error'} icon={AlertTriangle} />;

    return (
        <div className="space-y-8 pb-12">

            {/* CONTROL CENTER AREA */}
            <section>
                <div className="flex items-center gap-3 mb-6">
                    <div className="h-6 w-1 bg-indigo-600 rounded-full" />
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-wider">Control Hub</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Widget 1: Network Health */}
                    <div className="h-[420px]">
                        <ControlNetworkWidget data={data.network} loading={loading} />
                    </div>

                    {/* Widget 2: Pending Actions */}
                    <div className="h-[420px]">
                        <ControlPendingActionsWidget
                            data={data.pending}
                            loading={loading}
                            onNavigate={onNavigate}
                        />
                    </div>

                    {/* Widget 3: Upcoming Intel/Events */}
                    <div className="h-[420px]">
                        <ControlEventsWidget events={data.events} loading={loading} />
                    </div>

                    {/* Widget 4: Administrative Earnings (Royalties) */}
                    <div className="h-[420px]">
                        <ControlEarningsWidget
                            data={data.earnings}
                            loading={loading}
                            onNavigate={onNavigate}
                        />
                    </div>
                </div>
            </section>

            {/* SECONDARY INSIGHTS (Optional Bottom Row) */}
            <section className="pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="col-span-3 bg-gradient-to-br from-indigo-900 to-slate-900 rounded-3xl p-10 text-white shadow-2xl shadow-indigo-900/40 flex flex-col lg:flex-row justify-between items-center overflow-hidden relative border border-white/10">
                        {/* Aesthetic Element */}
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/20 blur-[150px] rounded-full -mr-32 -mt-32 pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full -ml-20 -mb-20 pointer-events-none" />

                        <div className="relative z-10 max-w-2xl">
                            <h3 className="text-3xl font-bold uppercase tracking-tight mb-4 flex items-center gap-3">
                                <span className="p-2 bg-white/10 rounded-xl backdrop-blur-md border border-white/10">
                                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
                                </span>
                                Visión Estratégica & Tendencias
                            </h3>
                            <p className="text-indigo-100/80 text-lg font-medium leading-relaxed">
                                El Centro de Control unifica la operativa de toda la red, supervisando el crecimiento de los royalties, la facturación global y las tendencias de mercado a largo plazo.
                            </p>

                            <div className="mt-8 flex flex-wrap gap-4">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-300 mb-1">Facturación Global (Red)</span>
                                    <span className="text-4xl font-bold tracking-tight tabular-nums text-white">
                                        {data.earnings.totalNetworkRevenue.toLocaleString()}€
                                    </span>
                                </div>
                                <div className="w-px bg-white/10 mx-4 h-12 hidden lg:block" />
                                <div className="flex flex-col justify-center">
                                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-300 mb-1">Estado de Red</span>
                                    <div className="flex items-center gap-2 text-emerald-400 font-bold">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                        Operativo - Crecimiento Sostenido
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 lg:mt-0 relative z-10 flex flex-col gap-3 min-w-[300px]">
                            <button
                                onClick={() => onNavigate('finance')}
                                className="bg-white text-indigo-950 w-full py-4 px-8 rounded-2xl font-bold uppercase tracking-widest text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-black/20 flex items-center justify-center gap-2 group"
                            >
                                Gestionar Finanzas Globales
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                            <button
                                onClick={() => onNavigate('finance')}
                                className="bg-indigo-500/10 text-indigo-200 border border-indigo-500/30 w-full py-4 px-8 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-indigo-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                Ver Reportes de Tendencia
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default OverviewTab;
