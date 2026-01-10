import { type FC, type ChangeEvent } from 'react';
import { DollarSign, Calculator, Store, Plus, Users2, Activity } from 'lucide-react';

interface Stats {
    franchiseCount?: number;
    totalProfit?: number;
    margin?: number;
}

type NavigationTarget = 'onboarding' | 'permissions';

interface AdminHeroProps {
    stats: Stats;
    selectedMonth: string;
    onMonthChange: (month: string) => void;
    onManageTariffs: () => void;
    onOpenSimulator: () => void;
    onNavigate: (target: NavigationTarget) => void;
}

const AdminHero: FC<AdminHeroProps> = ({
    stats,
    selectedMonth,
    onMonthChange,
    onManageTariffs,
    onOpenSimulator,
    onNavigate
}) => {
    console.log('DEBUG: AdminHero mounted');
    return (
        <div className="relative rounded-3xl bg-gradient-to-br from-blue-900 to-blue-800 p-6 md:p-10 shadow-2xl text-white overflow-hidden border border-blue-500/20">
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end">
                <div className="space-y-4">
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tight mb-2 text-white drop-shadow-lg">
                        DASHBOARD REPAART
                    </h2>
                    <div className="flex space-x-6 text-blue-200 text-sm font-medium items-center">
                        <button
                            onClick={onManageTariffs}
                            className="flex items-center bg-blue-500/20 hover:bg-blue-500/40 text-blue-100 px-3 py-1.5 rounded-lg border border-blue-400/30 transition-all text-xs font-bold uppercase tracking-wider"
                        >
                            <DollarSign className="w-4 h-4 mr-2" />
                            Tarifas
                        </button>
                        <button
                            onClick={onOpenSimulator}
                            className="flex items-center bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-100 px-3 py-1.5 rounded-lg border border-indigo-400/30 transition-all text-xs font-bold uppercase tracking-wider"
                        >
                            <Calculator className="w-4 h-4 mr-2" />
                            Simulador
                        </button>
                        <span className="flex items-center"><Store className="w-4 h-4 mr-2 opacity-70" /> {stats?.franchiseCount || 0} Franquicias</span>
                        <button
                            onClick={() => onNavigate('onboarding')}
                            className="flex items-center bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-400/30 transition-all text-xs font-bold uppercase tracking-wider"
                        >
                            <Plus className="w-4 h-4 mr-1" />
                            Nueva
                        </button>
                        <button
                            onClick={() => onNavigate('permissions')}
                            className="flex items-center bg-purple-500/20 hover:bg-purple-500/40 text-purple-100 px-3 py-1.5 rounded-lg border border-purple-400/30 transition-all text-xs font-bold uppercase tracking-wider"
                        >
                            <Users2 className="w-4 h-4 mr-1" />
                            Permisos
                        </button>
                        <div className="flex items-center bg-blue-800/50 rounded-lg p-1 border border-blue-500/30">
                            <Activity className="w-4 h-4 mr-2 opacity-70 ml-2" />
                            <input
                                type="month"
                                value={selectedMonth}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => onMonthChange(e.target.value)}
                                className="bg-transparent text-white font-bold outline-none border-none text-sm uppercase cursor-pointer"
                            />
                        </div>
                    </div>
                </div>
                <div className="mt-8 md:mt-0 text-right">
                    <p className="text-xs text-blue-300 uppercase tracking-widest font-bold mb-1">Beneficio Neto Consolidado</p>
                    <p className={`text-3xl md:text-4xl lg:text-5xl font-black tracking-tight ${(stats?.totalProfit || 0) >= 0 ? "text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300" : "text-rose-400"}`}>
                        {(stats?.totalProfit || 0).toLocaleString('es-ES', { minimumFractionDigits: 0 })}€
                    </p>
                    <div className="flex justify-end mt-2">
                        <span className={`text-sm font-bold px-3 py-1 rounded-lg backdrop-blur-md border ${(stats?.margin || 0) > 15 ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300' : 'bg-amber-500/20 border-amber-500/30 text-amber-300'}`}>
                            Margen Red: {(stats?.margin || 0).toFixed(1)}%
                        </span>
                    </div>
                </div>
            </div>
            <div className="absolute top-0 right-0 -mr-32 -mt-32 w-96 h-96 bg-blue-500 rounded-full mix-blend-overlay filter blur-[80px] opacity-20 animate-pulse-slow" />
        </div>
    );
};

export default AdminHero;
