import React from 'react';
import {
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend
} from 'recharts';
import { X, TrendingUp, Target, Users, CheckCircle } from 'lucide-react';

// --- INTERFACES ---
interface FranchiseMetrics {
    revenue: number;
    profit: number;
    orders: number;
    laborRatio: number; // Percentage 0-100
    incidentRatio: number; // Percentage 0-100
    safetyMargin: number; // Percentage
    margin: number; // Percentage
}

interface Franchise {
    id: string;
    name: string;
    email: string;
    metrics: FranchiseMetrics;
}

interface GlobalStats {
    totalRevenue: number;
    totalProfit: number;
    franchiseCount: number;
    totalOrders: number;
    margin: number;
    powerMetrics: {
        avgLaborRatio: number;
    };
}

interface FranchiseScorecardProps {
    franchise: Franchise | null;
    globalStats: GlobalStats;
    onClose: () => void;
}

const FranchiseScorecard: React.FC<FranchiseScorecardProps> = ({ franchise, globalStats, onClose }) => {
    if (!franchise) return null;

    // --- DATA NORMALIZATION FOR RADAR ---
    const getScore = (val: number, max: number) => Math.min(100, Math.max(0, (val / (max || 1)) * 100));

    // Define Baselines
    const avgRevenue = globalStats.totalRevenue / (globalStats.franchiseCount || 1);
    const targetRevenue = avgRevenue * 1.5 || 20000;

    const avgProfit = globalStats.totalProfit / (globalStats.franchiseCount || 1);
    const targetProfit = avgProfit * 1.5 || 5000;

    // Efficiency Score: Best 40%, Worst 80%
    const laborScore = (ratio: number) => {
        if (!ratio && ratio !== 0) return 0;
        return Math.max(0, Math.min(100, 100 - ((ratio - 40) * 2.5)));
    };

    // Quality Score: Best 0%, Worst 5%
    const qualityScore = (ratio: number) => {
        if (ratio === undefined) return 100;
        return Math.max(0, Math.min(100, 100 - (ratio * 20)));
    };

    const radarData = [
        { subject: 'Ventas', A: getScore(franchise.metrics.revenue, targetRevenue), fullMark: 100 },
        { subject: 'Beneficio', A: getScore(franchise.metrics.profit, targetProfit), fullMark: 100 },
        { subject: 'Eficiencia', A: laborScore(franchise.metrics.laborRatio), fullMark: 100 },
        { subject: 'Calidad', A: qualityScore(franchise.metrics.incidentRatio), fullMark: 100 },
        { subject: 'Crecimiento', A: getScore(franchise.metrics.orders, 1000), fullMark: 100 }, // Assuming 1000 orders is target
    ];

    // --- SAFETY ZONE CALC ---
    const safetyMargin = franchise.metrics.safetyMargin || 0;
    let safetyColor = 'text-rose-500';
    let safetyLabel = 'PELIGRO';
    if (safetyMargin > 15) { safetyColor = 'text-amber-500'; safetyLabel = 'ALERTA'; }
    if (safetyMargin > 30) { safetyColor = 'text-emerald-500'; safetyLabel = 'SEGURO'; }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden animate-scale-up border border-slate-200">

                {/* HEADER */}
                <div className="bg-gradient-to-r from-slate-900 to-indigo-900 p-6 flex justify-between items-start text-white">
                    <div>
                        <h2 className="text-2xl font-bold flex items-center">
                            <span className="bg-white/20 p-2 rounded-lg mr-3 text-2xl">🏢</span>
                            {franchise.name}
                        </h2>
                        <p className="text-indigo-200 mt-1 pl-14 opacity-80">{franchise.email}</p>
                    </div>
                    <button onClick={onClose} className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition text-white">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3">

                    {/* LEFT: RADAR CHART */}
                    <div className="col-span-1 bg-slate-50 p-6 border-r border-slate-100 flex flex-col items-center justify-center relative">
                        <h3 className="font-bold text-slate-700 mb-2 absolute top-6 left-6 flex items-center">
                            <Target className="w-4 h-4 mr-2 text-indigo-500" /> Puntuación 360º
                        </h3>
                        <div className="w-full h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="60%" data={radarData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                                    <PolarGrid stroke="#e2e8f0" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                    <Radar
                                        name={franchise.name}
                                        dataKey="A"
                                        stroke="#6366f1"
                                        strokeWidth={3}
                                        fill="#818cf8"
                                        fillOpacity={0.4}
                                    />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="text-center mt-4">
                            <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Nota Global</p>
                            <p className="text-3xl font-black text-indigo-600">
                                {(radarData.reduce((acc, curr) => acc + curr.A, 0) / 5).toFixed(1)}
                                <span className="text-sm font-normal text-slate-400">/100</span>
                            </p>
                        </div>
                    </div>

                    {/* RIGHT: METRICS GRID */}
                    <div className="col-span-2 p-8 space-y-8">

                        {/* 1. SAFETY GAUGE */}
                        <div className="mb-8">
                            <div className="flex justify-between items-end mb-2">
                                <h4 className="font-bold text-slate-700">Zona de Seguridad (Break-even)</h4>
                                <span className={`font-black ${safetyColor}`}>{safetyMargin.toFixed(1)}% ({safetyLabel})</span>
                            </div>
                            <div className="w-full bg-slate-200 h-4 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-1000 ease-out ${safetyMargin > 30 ? 'bg-emerald-500' : safetyMargin > 15 ? 'bg-amber-400' : 'bg-rose-500'}`}
                                    style={{ width: `${Math.min(100, Math.max(0, safetyMargin))}%` }}
                                />
                            </div>
                            <p className="text-xs text-slate-400 mt-2">
                                Margen de caída de pedidos permitida antes de entrar en pérdidas.
                            </p>
                        </div>

                        {/* 2. KEY METRIC CARDS */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white border border-slate-100 shadow-sm rounded-xl p-4 hover:shadow-md transition-shadow">
                                <p className="text-xs font-bold text-slate-400 uppercase">Eficiencia Laboral</p>
                                <div className="flex items-end justify-between mt-1">
                                    <p className="text-2xl font-bold text-slate-800">{franchise.metrics.laborRatio.toFixed(1)}%</p>
                                    <Users className={`w-5 h-5 ${franchise.metrics.laborRatio < 60 ? 'text-emerald-500' : 'text-amber-500'}`} />
                                </div>
                                <p className="text-xs text-slate-400 mt-1">Objetivo: &lt;60%</p>
                            </div>

                            <div className="bg-white border border-slate-100 shadow-sm rounded-xl p-4 hover:shadow-md transition-shadow">
                                <p className="text-xs font-bold text-slate-400 uppercase">Beneficio Neto</p>
                                <div className="flex items-end justify-between mt-1">
                                    <p className={`text-2xl font-bold ${franchise.metrics.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {franchise.metrics.profit.toFixed(0)}€
                                    </p>
                                    <TrendingUp className="w-5 h-5 text-indigo-500" />
                                </div>
                                <p className="text-xs text-slate-400 mt-1">Margen: {franchise.metrics.margin.toFixed(1)}%</p>
                            </div>
                        </div>

                        {/* 3. COMPARISON MODULE */}
                        <div className="bg-white border border-slate-100 shadow-sm rounded-xl p-6">
                            <h4 className="font-bold text-slate-700 mb-4 flex items-center">
                                <Users className="w-4 h-4 mr-2 text-indigo-500" /> Comparativa con la Red
                            </h4>
                            <div className="h-48 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={[
                                            {
                                                name: 'Margen (%)',
                                                Franquicia: franchise.metrics.margin,
                                                Red: globalStats.margin, // Global Avg Margin
                                            },
                                            {
                                                name: 'Laboral (%)',
                                                Franquicia: franchise.metrics.laborRatio,
                                                Red: globalStats.powerMetrics.avgLaborRatio,
                                            },
                                            {
                                                name: 'Ticket Medio (€)',
                                                Franquicia: franchise.metrics.revenue / (franchise.metrics.orders || 1),
                                                Red: globalStats.totalRevenue / (globalStats.totalOrders || 1),
                                            }
                                        ]}
                                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 'bold' }} />
                                        <YAxis />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                            cursor={{ fill: '#f8fafc' }}
                                        />
                                        <Bar dataKey="Franquicia" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={30} />
                                        <Bar dataKey="Red" fill="#cbd5e1" radius={[4, 4, 0, 0]} barSize={30} />
                                        <Legend />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <p className="text-xs text-center text-slate-400 mt-2">
                                Azul: {franchise.name} | Gris: Promedio Global
                            </p>
                        </div>

                        {/* RECOMMENDATION */}
                        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-start">
                            <CheckCircle className="w-5 h-5 text-indigo-600 mr-3 mt-0.5 flex-shrink-0" />
                            <div>
                                <h4 className="font-bold text-indigo-900 text-sm">Diagnóstico IA</h4>
                                <p className="text-sm text-indigo-700 mt-1 leading-relaxed">
                                    {franchise.metrics.profit < 0
                                        ? "⚠️ PRIORIDAD: La franquicia pierde dinero. Revisar estructura de costes fijos o aumentar volumen urgentemente. Riesgo financiero alto."
                                        : franchise.metrics.laborRatio > 65
                                            ? "⚠️ ALERTA: Exceso de personal. El ratio laboral supera el 65%. Revisar horas de riders o eficiencia de repartos."
                                            : franchise.metrics.margin < 10
                                                ? "ℹ️ OK PERO BAJO MARGEN: Operativa rentable pero vulnerable. Enfocarse en subir ticket medio."
                                                : "✅ EXCELENTE: La franquicia opera con métricas saludables y alta eficiencia. Modelo a replicar."
                                    }
                                </p>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default FranchiseScorecard;
