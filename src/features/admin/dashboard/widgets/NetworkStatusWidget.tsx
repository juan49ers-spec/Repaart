import { type FC } from 'react';
import { Activity } from 'lucide-react';

interface FranchiseData {
    profit?: number;
    revenue?: number;
}

interface Franchise {
    data?: FranchiseData;
}

interface NetworkStatusCounts {
    excellent: number;
    acceptable: number;
    critical: number;
}

interface NetworkStatusWidgetProps {
    franchises: Franchise[];
}

const NetworkStatusWidget: FC<NetworkStatusWidgetProps> = ({ franchises }) => {
    // Calculate network status counts
    const counts = franchises.reduce<NetworkStatusCounts>((acc, f) => {
        const margin = f.data?.profit && f.data.profit > 0 && f.data?.revenue && f.data.revenue > 0
            ? (f.data.profit / f.data.revenue) * 100
            : 0;

        if (margin >= 20) acc.excellent++;
        else if (margin >= 10) acc.acceptable++;
        else acc.critical++;

        return acc;
    }, { excellent: 0, acceptable: 0, critical: 0 });

    return (
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-blue-600" />
                Estado de la Red
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl">🟢</span>
                        <span className="text-3xl font-black text-emerald-600">{counts.excellent}</span>
                    </div>
                    <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Excelente</p>
                    <p className="text-[10px] text-emerald-600 mt-1">Margen &ge; 20%</p>
                </div>

                <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl">🟡</span>
                        <span className="text-3xl font-black text-amber-600">{counts.acceptable}</span>
                    </div>
                    <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">Aceptable</p>
                    <p className="text-[10px] text-amber-600 mt-1">Margen 10-20%</p>
                </div>

                <div className="bg-rose-50 border-2 border-rose-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl">🔴</span>
                        <span className="text-3xl font-black text-rose-600">{counts.critical}</span>
                    </div>
                    <p className="text-xs font-bold text-rose-700 uppercase tracking-wider">Crítico</p>
                    <p className="text-[10px] text-rose-600 mt-1">Margen &lt; 10%</p>
                </div>
            </div>
        </div>
    );
};

export default NetworkStatusWidget;
