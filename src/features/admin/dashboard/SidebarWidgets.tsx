import { type FC } from 'react';
import { AlertTriangle, Award, Users } from 'lucide-react';
import { detectAnomalies } from '../../../lib/fraudDetection';
import { formatMoney } from '../../../lib/finance';
import RealMadridWidget from '../../user/components/RealMadridWidget';

interface FranchiseMetrics {
    profit: number;
    totalKm: number;
    gasoline?: number;
    incidentCost: number;
    otherExpenses: number;
    laborRatio: number;
    orders: number;
    avgTicket: number;
    productivity: number;
    revenue: number;
}

interface Franchise {
    id: string;
    name: string;
    metrics: FranchiseMetrics;
}

interface Alert {
    type?: string;
    title: string;
    message: string;
    metric?: string;
}

interface EnrichedAlert extends Alert {
    franchiseName: string;
    franchiseId: string;
    franchise: Franchise;
}

interface SidebarWidgetsProps {
    franchises: Franchise[];
    setSelectedScorecard: (franchise: Franchise) => void;
}

const SidebarWidgets: FC<SidebarWidgetsProps> = ({ franchises, setSelectedScorecard }) => {
    console.log('DEBUG: SidebarWidgets mounted');
    // Collect all alerts
    const allAlerts: EnrichedAlert[] = franchises.flatMap(f => {
        const fAlerts = detectAnomalies(f as any) as Alert[];
        return fAlerts.map(a => ({ ...a, franchiseName: f.name, franchiseId: f.id, franchise: f }));
    });

    return (
        <div className="space-y-6">
            {/* REAL MADRID WIDGET */}
            <RealMadridWidget variant="sidebar" />

            {/* ALERTS SECTION (Dynamic Fraud Detection) */}
            {allAlerts.length > 0 && (
                <div className="bg-rose-50/50 backdrop-blur-md border border-rose-100 rounded-2xl p-6 relative overflow-hidden shadow-sm">
                    <div className="flex items-center mb-4 relative z-10">
                        <span className="bg-rose-100 p-1.5 rounded-lg mr-2"><AlertTriangle className="w-4 h-4 text-rose-600" /></span>
                        <h3 className="font-bold text-rose-800 text-sm">Centro de Alertas & Anomalías</h3>
                    </div>
                    <div className="space-y-3 relative z-10 max-h-96 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-rose-200">
                        {allAlerts.map((alert, idx) => (
                            <div
                                key={`${alert.franchiseId}-${idx}`}
                                className="bg-white p-3 rounded-xl border border-rose-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                                onClick={() => setSelectedScorecard(alert.franchise)}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-bold text-slate-700 text-xs uppercase tracking-wider">{alert.franchiseName}</span>
                                    {alert.type === 'CRITICAL' && <span className="bg-rose-100 text-rose-600 text-[10px] font-bold px-1.5 py-0.5 rounded">CRÍTICO</span>}
                                </div>
                                <p className="font-bold text-rose-800 text-sm leading-tight">{alert.title}</p>
                                <p className="text-xs text-slate-500 mt-1">{alert.message}</p>
                                <p className="text-xs font-black text-rose-500 mt-1 text-right tracking-tighter">{alert.metric}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* TOP 3 PODIUM */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 relative overflow-hidden">
                <h3 className="font-bold text-slate-800 mb-6 flex items-center">
                    <Award className="w-5 h-5 mr-3 text-blue-500" />
                    Top Rendimiento
                </h3>
                <div className="space-y-4 relative z-10">
                    {franchises.map((f) => {
                        const genericStyle = {
                            border: 'border-slate-200',
                            bg: 'bg-slate-100',
                            color: 'text-slate-600',
                            label: 'Franquicia',
                            icon: Users // Using Users icon as a generic placeholder
                        };
                        return (
                            <div key={f.id} onClick={() => setSelectedScorecard(f)} className={`flex items-center p-3 rounded-xl bg-slate-50 border ${genericStyle.border} hover:shadow-md transition-all cursor-pointer group`}>
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${genericStyle.bg} ${genericStyle.color} shadow-sm group-hover:scale-110 transition-transform`}>
                                    <Users className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{genericStyle.label}</p>
                                    <p className="font-bold text-slate-800">{f.name}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-black text-emerald-600">+{formatMoney(f.metrics.profit, 0)}€</p>
                                </div>
                            </div>
                        )
                    })}
                </div>
                {/* Decoration */}
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-32 h-32 bg-gradient-to-br from-yellow-100 to-amber-100 rounded-full mix-blend-multiply opacity-50 blur-xl" />
            </div>
        </div>
    );
};

export default SidebarWidgets;
