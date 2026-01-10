import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    TrendingUp, DollarSign, AlertTriangle,
    CheckCircle, Wallet, Search, ArrowRight, ShieldCheck, AlertCircle, Filter
} from 'lucide-react';
import { useNetworkFinance } from '../../../hooks/useNetworkFinance';
import { formatMoney } from '../../../lib/finance';
import DashboardSkeleton from '../../../ui/layout/DashboardSkeleton';

interface AdminNetworkDashboardProps {
    selectedMonth: string;
}

// Simple Sparkline Component (Visual Simulation of "Trend")
const Sparkline = ({ trend }: { trend: 'up' | 'down' | 'neutral' }) => {
    // Determine color
    const color = trend === 'up' ? '#34d399' : trend === 'down' ? '#f43f5e' : '#94a3b8';

    // Generate a simple path based on trend
    // 0,10 -> 10,8 -> 20,5 -> 30,2 (Up)
    // 0,2 -> 10,5 -> 20,8 -> 30,10 (Down)
    const points = trend === 'up'
        ? "0,20 10,15 20,18 30,10 40,5 50,0" // Upward slope
        : trend === 'down'
            ? "0,0 10,5 20,2 30,12 40,15 50,20" // Downward slope
            : "0,10 10,8 20,12 30,10 40,11 50,10"; // Flat

    return (
        <svg width="60" height="25" viewBox="0 0 50 20" className="opacity-80">
            <polyline
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
            />
        </svg>
    );
};

const AdminNetworkDashboard: React.FC<AdminNetworkDashboardProps> = ({ selectedMonth }) => {
    const navigate = useNavigate();
    const { loading, networkData, aggregates } = useNetworkFinance(selectedMonth);
    const [filter, setFilter] = useState<'all' | 'healthy' | 'warning' | 'critical'>('all');
    const [searchTerm, setSearchTerm] = useState('');

    if (loading) return <DashboardSkeleton />;

    // --- FILTER ---
    const filteredData = networkData.filter(item => {
        // Text Search
        if (searchTerm && !item.franchiseName.toLowerCase().includes(searchTerm.toLowerCase())) return false;

        // Status Filter
        if (filter === 'all') return true;
        if (filter === 'critical') return item.riskScore > 50;
        if (filter === 'warning') return item.riskScore > 20 && item.riskScore <= 50;
        if (filter === 'healthy') return item.riskScore <= 20;
        return true;
    });

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3 transition-colors">
                        <div className="p-2 bg-indigo-600 dark:bg-indigo-500 rounded-lg shadow-lg shadow-indigo-200 dark:shadow-none">
                            <TrendingUp className="w-6 h-6 text-white" />
                        </div>
                        Centro de Control Financiero
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 ml-1 transition-colors">
                        Auditoría Global | {new Date(selectedMonth + '-01').toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                    </p>
                </div>

                <div className="flex gap-2">
                    <div className="relative group">
                        <input
                            type="text"
                            placeholder="Filtrar sede..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-64 pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 text-slate-900 dark:text-slate-200 text-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent outline-none transition-all shadow-sm dark:shadow-none"
                        />
                        <div className="absolute right-3 top-2.5 text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-500 transition-colors">
                            <Search className="w-5 h-5" />
                        </div>
                    </div>
                </div>
            </div>

            {/* BLOCK 1: NETWORK PULSE (AGGREGATES) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Network Revenue */}
                <div className="bg-white dark:bg-slate-900/50 backdrop-blur-md p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-lg transition-colors">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-emerald-500/10 rounded-xl">
                            <DollarSign className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg">
                            +100% vs LY
                        </span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Facturación Red</p>
                    <h3 className="text-3xl font-bold text-slate-900 dark:text-white mt-1 transition-colors">{formatMoney(aggregates.totalRevenue)}€</h3>
                </div>

                {/* Net Profit */}
                <div className="bg-white dark:bg-slate-900/50 backdrop-blur-md p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-lg transition-colors">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-indigo-500/10 rounded-xl">
                            <TrendingUp className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div className={`px-2 py-1 rounded-lg text-xs font-bold ${aggregates.totalRevenue > 0 && (aggregates.totalProfit / aggregates.totalRevenue) > 0.15
                            ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                            : 'text-yellow-600 dark:text-yellow-400 bg-yellow-500/10'
                            }`}>
                            {aggregates.totalRevenue > 0
                                ? ((aggregates.totalProfit / aggregates.totalRevenue) * 100).toFixed(1)
                                : 0}% Margen
                        </div>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Beneficio Neto Global</p>
                    <h3 className="text-3xl font-bold text-slate-900 dark:text-white mt-1 transition-colors">{formatMoney(aggregates.totalProfit)}€</h3>
                </div>

                {/* Global Tax Vault */}
                <div className="bg-white dark:bg-slate-900/50 backdrop-blur-md p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-lg transition-colors">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-500/10 rounded-xl">
                            <Wallet className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-1 rounded-lg">
                            Estimated
                        </span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Hucha Fiscal Global</p>
                    <h3 className="text-3xl font-bold text-slate-900 dark:text-white mt-1 transition-colors">{formatMoney(aggregates.totalTaxVault)}€</h3>
                </div>

                {/* Compliance */}
                <div className="bg-white dark:bg-slate-900/50 backdrop-blur-md p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-lg transition-colors">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-rose-500/10 rounded-xl">
                            <ShieldCheck className="w-6 h-6 text-rose-600 dark:text-rose-400" />
                        </div>
                        <span className={`text-xs font-bold px-2 py-1 rounded-lg ${aggregates.submittedCount === aggregates.activeFranchises
                            ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                            : 'text-rose-600 dark:text-rose-400 bg-rose-500/10'
                            }`}>
                            {aggregates.submittedCount}/{aggregates.activeFranchises}
                        </span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Cumplimiento</p>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-4 overflow-hidden">
                        <div
                            className="bg-rose-500 h-full rounded-full transition-all duration-1000"
                            style={{ width: `${(aggregates.submittedCount / (aggregates.activeFranchises || 1)) * 100}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* BLOCK 2: THE MATRIX (RISK TABLE) */}
            <div className="bg-white dark:bg-slate-900/50 backdrop-blur-md rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl overflow-hidden transition-colors">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center bg-slate-50/50 dark:bg-slate-900/80 gap-4">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 transition-colors">
                        <AlertTriangle className="w-5 h-5 text-yellow-500" />
                        Matriz de Riesgo
                    </h3>

                    {/* INTERACTIVE FILTERS */}
                    <div className="flex gap-2 text-xs font-bold uppercase tracking-wider">
                        <button
                            onClick={() => setFilter('all')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${filter === 'all' ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/50' : 'text-slate-500 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                        >
                            <Filter className="w-3 h-3" /> All
                        </button>
                        <button
                            onClick={() => setFilter('healthy')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${filter === 'healthy' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50' : 'text-slate-500 border-transparent hover:bg-emerald-500/10 hover:text-emerald-400'
                                }`}
                        >
                            <div className="w-2 h-2 rounded-full bg-emerald-400" /> Healthy
                        </button>
                        <button
                            onClick={() => setFilter('warning')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${filter === 'warning' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50' : 'text-slate-500 border-transparent hover:bg-yellow-500/10 hover:text-yellow-400'
                                }`}
                        >
                            <div className="w-2 h-2 rounded-full bg-yellow-400" /> Warning
                        </button>
                        <button
                            onClick={() => setFilter('critical')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${filter === 'critical' ? 'bg-rose-500/20 text-rose-300 border-rose-500/50' : 'text-slate-500 border-transparent hover:bg-rose-500/10 hover:text-rose-400'
                                }`}
                        >
                            <div className="w-2 h-2 rounded-full bg-rose-400" /> Critical
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                <th className="p-4 pl-6">Franquicia</th>
                                <th className="p-4 text-right">Facturación & Tendencia</th>
                                <th className="p-4 text-right">Margen Neto</th>
                                <th className="p-4 text-center">Estado</th>
                                <th className="p-4 text-center">Riesgo</th>
                                <th className="p-4"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-slate-500">
                                        No se encontraron resultados para los filtros actuales.
                                    </td>
                                </tr>
                            )}
                            {filteredData.map((item) => {
                                const rev = item.report ? (item.report.totalIncome || item.report.revenue || 0) : 0;
                                const prof = item.report ? ((item.report.totalIncome || 0) - (item.report.totalExpenses || 0)) : 0;
                                const margin = rev > 0 ? (prof / rev) * 100 : 0;

                                // Pseudo-random trend for MVP, in real app, fetch history
                                const trend = rev > 20000 ? 'up' : rev > 10000 ? 'neutral' : 'down';

                                return (
                                    <tr
                                        key={item.franchiseId}
                                        className="group border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                                    >
                                        <td className="p-4 pl-6">
                                            <div className="font-bold text-slate-900 dark:text-white transition-colors">{item.franchiseName}</div>
                                            <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider transition-colors">{item.franchiseId}</div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-3">
                                                {/* SPARKLINE */}
                                                <div className="hidden md:block" title="Tendencia últimos 3 meses">
                                                    <Sparkline trend={trend} />
                                                </div>
                                                <div className="font-bold text-slate-700 dark:text-slate-300 transition-colors">
                                                    {formatMoney(rev)}€
                                                </div>
                                            </div>
                                            {/* Mini Bar */}
                                            <div className="w-24 h-1 bg-slate-100 dark:bg-slate-800 rounded-full ml-auto mt-1 overflow-hidden">
                                                <div
                                                    className="h-full bg-indigo-500"
                                                    style={{ width: `${Math.min((rev / (aggregates.totalRevenue || 1)) * 100 * 5, 100)}%` }} // Visual scaling based on avg
                                                />
                                            </div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className={`font-bold transition-colors tabular-nums ${margin > 15 ? 'text-emerald-600 dark:text-emerald-400' : margin > 5 ? 'text-amber-600 dark:text-yellow-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                                {margin.toFixed(1)}%
                                            </div>
                                            <div className="text-xs text-slate-500 dark:text-slate-500 transition-colors">
                                                {formatMoney(prof)}€
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            {item.status === 'submitted' ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20">
                                                    <CheckCircle className="w-3 h-3" /> Submitted
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold border border-slate-200 dark:border-slate-700">
                                                    <AlertCircle className="w-3 h-3" /> Pending
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex justify-center group/tooltip relative">
                                                {item.riskScore > 50 ? (
                                                    <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center animate-pulse cursor-help" title="Riesgo Crítico">
                                                        <AlertTriangle className="w-4 h-4 text-rose-500" />
                                                    </div>
                                                ) : item.riskScore > 20 ? (
                                                    <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center cursor-help" title="Riesgo Moderado">
                                                        <AlertTriangle className="w-4 h-4 text-yellow-500" />
                                                    </div>
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center" title="Saludable">
                                                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                                    </div>
                                                )}

                                                {/* INTELLIGENCE TOOLTIP */}
                                                {item.riskFactors && item.riskFactors.length > 0 && (
                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-900 border border-slate-700 rounded-xl p-3 shadow-xl opacity-0 scale-90 group-hover/tooltip:opacity-100 group-hover/tooltip:scale-100 transition-all pointer-events-none z-50">
                                                        <p className="text-xs font-bold text-slate-300 mb-1 border-b border-slate-800 pb-1">Factores de Riesgo</p>
                                                        <ul className="space-y-1">
                                                            {item.riskFactors.map((factor, idx) => (
                                                                <li key={idx} className="text-[10px] text-rose-400 flex items-start gap-1">
                                                                    <div className="mt-0.5 min-w-[4px] min-h-[4px] rounded-full bg-rose-500" />
                                                                    {factor}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() => navigate(`/admin/finance/${item.franchiseId}`)}
                                                aria-label="Ver detalles"
                                                className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-600 dark:hover:bg-indigo-600 rounded-lg text-slate-500 dark:text-slate-400 hover:text-white dark:hover:text-white transition-all shadow-sm group-hover:shadow-indigo-500/20"
                                            >
                                                <ArrowRight className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminNetworkDashboard;
