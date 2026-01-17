import React from 'react';
import { createPortal } from 'react-dom';
import { X, ShieldCheck, AlertTriangle, Check, TrendingUp, Clock, Users } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SheriffReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: {
        score: number;
        status: 'optimal' | 'warning' | 'critical';
        details: {
            totalHours: number;
            overtimeCount: number;
            underutilizedCount: number;
            coverageScore: number; // 0-100
            costEfficiency: number; // Simulated
        };
        feedback: string[];
    } | null;
}

export const SheriffReportModal: React.FC<SheriffReportModalProps> = ({ isOpen, onClose, data }) => {
    if (!isOpen || !data) return null;

    // Determine visual theme based on status
    const themes = {
        optimal: {
            bg: "bg-emerald-50",
            border: "border-emerald-100",
            text: "text-emerald-900",
            accent: "bg-emerald-500",
            icon: ShieldCheck,
            seal: "border-emerald-500 text-emerald-600"
        },
        warning: {
            bg: "bg-amber-50",
            border: "border-amber-100",
            text: "text-amber-900",
            accent: "bg-amber-500",
            icon: AlertTriangle,
            seal: "border-amber-500 text-amber-600"
        },
        critical: {
            bg: "bg-rose-50",
            border: "border-rose-100",
            text: "text-rose-900",
            accent: "bg-rose-500",
            icon: AlertTriangle,
            seal: "border-rose-500 text-rose-600"
        }
    };

    const theme = themes[data.status] || themes.optimal;

    // Using theme.icon directly if needed in future

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] animate-in zoom-in-95 slide-in-from-bottom-5 duration-300"
            >
                {/* LEFT PANEL: SCORE & VERDICT */}
                <div className={cn("w-full md:w-1/3 p-8 flex flex-col items-center justify-center text-center relative overflow-hidden", theme.bg)}>
                    {/* Background Decor */}
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                        <div className={cn("absolute -top-20 -left-20 w-64 h-64 rounded-full mix-blend-multiply filter blur-3xl", theme.accent)}></div>
                        <div className={cn("absolute -bottom-20 -right-20 w-64 h-64 rounded-full mix-blend-multiply filter blur-3xl", theme.accent)}></div>
                    </div>

                    <div className="relative z-10 w-full flex flex-col items-center">
                        <h3 className="text-xs font-black uppercase tracking-widest opacity-60 mb-8">Sheriff Audit 3.0</h3>

                        {/* Score Ring */}
                        <div className="relative w-40 h-40 mb-8 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-white/30" />
                                <circle
                                    cx="80" cy="80" r="70"
                                    stroke="currentColor"
                                    strokeWidth="12"
                                    fill="transparent"
                                    strokeDasharray={440}
                                    strokeDashoffset={440 - (440 * data.score) / 100}
                                    className={cn("text-current transition-all duration-1000 ease-out", theme.text.replace('900', '600'))}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-5xl font-black">{data.score}</span>
                                <span className="text-[10px] font-bold uppercase opacity-60">Global Score</span>
                            </div>
                        </div>

                        {/* Verdict Stamp */}
                        <div className={cn(
                            "border-4 border-double px-6 py-2 rounded-lg transform -rotate-6 shadow-sm mb-8",
                            theme.seal
                        )}>
                            <span className="text-xl font-black uppercase tracking-widest">
                                {data.status === 'optimal' ? 'APPROVED' : data.status === 'warning' ? 'REVIEW' : 'CRITICAL'}
                            </span>
                        </div>

                        <p className="text-xs font-medium opacity-70 px-4 leading-relaxed">
                            {data.status === 'optimal'
                                ? "Cuadrante optimizado y listo para publicar."
                                : "Se requieren ajustes antes de publicar."}
                        </p>
                    </div>
                </div>

                {/* RIGHT PANEL: METRICS & FEEDBACK */}
                <div className="w-full md:w-2/3 p-8 bg-white flex flex-col">
                    <div className="flex items-start justify-between mb-8">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900">Informe de Operaciones</h2>
                            <p className="text-slate-500 text-sm">Análisis detallado de eficiencia y cumplimiento.</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                            <X size={20} className="text-slate-400" />
                        </button>
                    </div>

                    {/* Metric Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <MetricCard
                            label="Riders Activos"
                            value={String(data.details.totalHours > 0 ? Math.round(data.details.totalHours / 40) : 0)}
                            icon={Users}
                        />
                        <MetricCard
                            label="Horas Totales"
                            value={`${data.details.totalHours.toFixed(0)}h`}
                            subValue={`${data.details.costEfficiency.toFixed(1)}€/h (est)`}
                            icon={Clock}
                        />
                        <MetricCard
                            label="Overtime"
                            value={String(data.details.overtimeCount)}
                            status={data.details.overtimeCount > 0 ? "danger" : "success"}
                            icon={AlertTriangle}
                        />
                        <MetricCard
                            label="Infrautilizados"
                            value={String(data.details.underutilizedCount)}
                            status={data.details.underutilizedCount > 0 ? "warning" : "success"}
                            icon={TrendingUp}
                        />
                    </div>

                    {/* Detailed Feedback List */}
                    <div className="flex-1 overflow-y-auto pr-2">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Hallazgos Clave</h4>
                        <div className="space-y-3">
                            {data.feedback.map((item, idx) => (
                                <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 group hover:bg-slate-100 transition-colors">
                                    <div className={cn(
                                        "mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0",
                                        item.includes("⚠️") ? "bg-amber-100 text-amber-600" :
                                            item.includes("🛑") ? "bg-rose-100 text-rose-600" :
                                                "bg-emerald-100 text-emerald-600"
                                    )}>
                                        {item.includes("⚠️") || item.includes("🛑") ? <AlertTriangle size={12} /> : <Check size={12} />}
                                    </div>
                                    <p className="text-sm text-slate-600 leading-snug">{item.replace(/^[^\w\s]+\s*/, '')}</p>
                                </div>
                            ))}
                            {data.feedback.length === 0 && (
                                <div className="text-center py-8 text-slate-400 italic">
                                    Sin hallazgos críticos. Todo parece en orden.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end gap-3">
                        <button onClick={onClose} className="px-6 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                            Cerrar
                        </button>
                        <button onClick={onClose} className="px-6 py-2.5 text-sm font-bold bg-slate-900 text-white rounded-xl shadow-lg shadow-slate-900/10 hover:shadow-xl hover:-translate-y-0.5 transition-all">
                            Entendido
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

interface MetricCardProps {
    label: string;
    value: string;
    subValue?: string;
    status?: 'neutral' | 'success' | 'warning' | 'danger';
    icon: React.ComponentType<{ size?: number; className?: string }>;
}

const MetricCard = ({ label, value, subValue, status = 'neutral', icon: Icon }: MetricCardProps) => {
    const colorMap: Record<string, string> = {
        neutral: "bg-slate-50 border-slate-100 text-slate-900",
        success: "bg-emerald-50 border-emerald-100 text-emerald-700",
        warning: "bg-amber-50 border-amber-100 text-amber-700",
        danger: "bg-rose-50 border-rose-100 text-rose-700",
    };
    const colors = colorMap[status] || colorMap.neutral;

    return (
        <div className={cn("p-4 rounded-2xl border flex flex-col items-start gap-3", colors)}>
            <div className="p-2 rounded-lg bg-white/50 border border-black/5">
                <Icon size={16} className="opacity-70" />
            </div>
            <div>
                <div className="text-2xl font-bold tracking-tight">{value}</div>
                <div className="text-[10px] uppercase font-bold opacity-60">{label}</div>
                {subValue && <div className="text-[10px] opacity-50 mt-0.5">{subValue}</div>}
            </div>
        </div>
    );
};
