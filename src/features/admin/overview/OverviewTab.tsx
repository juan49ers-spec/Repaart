import React from 'react';
import { AlertTriangle, Activity } from 'lucide-react';
import DashboardSkeleton from '../../../components/ui/layout/DashboardSkeleton';
import EmptyState from '../../../components/ui/feedback/EmptyState';
import { useAdminControl } from '../../../hooks/useAdminControl';

// Control Widgets
import ControlNetworkWidget from '../dashboard/widgets/ControlNetworkWidget';
import PendingActionsWidget from '../dashboard/widgets/PendingActionsWidget';
import ControlEarningsWidget from '../dashboard/widgets/ControlEarningsWidget';
import IntelligenceWidget from '../dashboard/widgets/IntelligenceWidget';

interface OverviewTabProps {
    onNavigate: (view: string) => void;
    selectedMonth: string;
}

const OverviewTab: React.FC<OverviewTabProps> = ({ onNavigate, selectedMonth }) => {
    const { data, loading, error } = useAdminControl(selectedMonth);

    if (loading) return <DashboardSkeleton />;
    if (error) return <EmptyState title="Error de conexión" description={error || 'Unknown error'} icon={AlertTriangle} />;

    return (
        <div className="space-y-8 pb-10 max-w-[1700px] mx-auto">

            {/* CONTROL HUB AREA - The Workstation Row */}
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex items-center justify-between mb-6 group/header">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-600/20 ring-4 ring-indigo-50">
                            <Activity className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                                Centro de Control
                            </h2>
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                                Visión general del estado de la red
                            </p>
                        </div>
                    </div>

                    <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full border border-emerald-100">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-700">Sistema Activo</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Widget 1: Network Health */}
                    <div className="h-[460px]">
                        <ControlNetworkWidget data={data.network} loading={loading} />
                    </div>

                    {/* Widget 2: Pending Actions */}
                    <div className="h-[460px]">
                        <PendingActionsWidget
                            data={data.pending}
                            loading={loading}
                            onNavigate={onNavigate}
                        />
                    </div>

                    {/* Widget 3: Administrative Earnings */}
                    <div className="h-[460px]">
                        <ControlEarningsWidget
                            data={data.earnings}
                            loading={loading}
                            onNavigate={onNavigate}
                        />
                    </div>
                </div>
            </section>


            {/* INTELLIGENCE LAYER - Refined Grid */}
            <section className="animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
                <div className="flex items-center gap-3 mb-5 group/header">
                    <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-white/5 px-4 py-1.5 rounded-full border border-slate-200 dark:border-white/5">
                        Inteligencia Artificial
                    </h2>
                </div>
                <div className="h-[400px]">
                    <IntelligenceWidget franchises={data.network.franchises} loading={loading} />
                </div>
            </section>
        </div>
    );
};

export default OverviewTab;
