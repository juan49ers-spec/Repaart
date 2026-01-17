import React from 'react';
import { AlertTriangle } from 'lucide-react';
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
    // We still keep the original dashboard data hook if we need trendData for the lower section
    // but for the main "Control Center" row, we use useAdminControl.

    if (loading) return <DashboardSkeleton />;
    if (error) return <EmptyState title="Error de conexión" description={error || 'Unknown error'} icon={AlertTriangle} />;

    return (
        <div className="space-y-8 pb-12">

            {/* CONTROL CENTER AREA */}
            <section>
                <div className="flex items-center gap-3 mb-6">
                    <div className="h-6 w-1 bg-gradient-to-b from-indigo-500 to-violet-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                    <h2 className="text-xl font-medium text-slate-800 dark:text-white tracking-tight">Control Hub</h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

                    {/* Widget 3: Administrative Earnings (Royalties) - Previously Widget 4 */}
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
