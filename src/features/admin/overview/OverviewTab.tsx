import React from 'react';
import { AlertTriangle } from 'lucide-react';
import DashboardSkeleton from '../../../ui/layout/DashboardSkeleton';
import EmptyState from '../../../ui/feedback/EmptyState';
import { useAdminControl } from '../../../hooks/useAdminControl';

// Control Widgets
import ControlNetworkWidget from '../dashboard/widgets/ControlNetworkWidget';
import PendingActionsWidget from '../dashboard/widgets/PendingActionsWidget';
import ControlEventsWidget from '../dashboard/widgets/ControlEventsWidget';
import ControlEarningsWidget from '../dashboard/widgets/ControlEarningsWidget';
import IntelligenceWidget from '../dashboard/widgets/IntelligenceWidget';

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
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Control Hub</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Widget 1: Network Health */}
                    <div className="h-[420px]">
                        <ControlNetworkWidget data={data.network} loading={loading} />
                    </div>

                    {/* Widget 2: Pending Actions */}
                    <div className="h-[420px]">
                        <PendingActionsWidget
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


            {/* ANOMALY DETECTION SECTION */}
            <section className="pt-2">
                <div className="h-[280px]">
                    <IntelligenceWidget franchises={data.network.franchises} loading={loading} />
                </div>
            </section>
        </div>
    );
};

export default OverviewTab;
