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
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-[#12141A] rounded-xl border border-white/10 shadow-lg relative overflow-hidden">
                            <div className="absolute inset-0 bg-indigo-500/10 blur-xl" />
                            <Activity className="w-5 h-5 text-indigo-400 relative z-10" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white uppercase tracking-tight leading-tight">
                                Centro de Control
                            </h2>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
                                Visión general del estado de la red
                            </p>
                        </div>
                    </div>

                    <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Sistema Activo</span>
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
                    <h2 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest bg-[#12141A] px-4 py-2 rounded-lg border border-indigo-500/20 shadow-sm">
                        Inteligencia Artificial Operativa
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
