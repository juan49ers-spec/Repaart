import React from 'react';
import { 
    Shield, 
    AlertTriangle, 
    AlertCircle, 
    Info, 
    ChevronRight,
    CheckCircle2,
    FileWarning
} from 'lucide-react';
import { ComplianceReport, ComplianceSeverity } from '../../../hooks/useContractAI';

interface CompliancePanelProps {
    report: ComplianceReport | null;
    onNavigateToLine?: (lineNumber: number) => void;
    loading?: boolean;
}

const SEVERITY_CONFIG: Record<ComplianceSeverity, { 
    color: string; 
    bgColor: string; 
    borderColor: string;
    icon: React.ReactNode;
    label: string;
}> = {
    critical: {
        color: 'text-rose-600',
        bgColor: 'bg-rose-50 dark:bg-rose-900/20',
        borderColor: 'border-rose-200 dark:border-rose-800',
        icon: <AlertCircle className="w-4 h-4" />,
        label: 'Crítico'
    },
    warning: {
        color: 'text-amber-600',
        bgColor: 'bg-amber-50 dark:bg-amber-900/20',
        borderColor: 'border-amber-200 dark:border-amber-800',
        icon: <AlertTriangle className="w-4 h-4" />,
        label: 'Advertencia'
    },
    info: {
        color: 'text-blue-600',
        bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        borderColor: 'border-blue-200 dark:border-blue-800',
        icon: <Info className="w-4 h-4" />,
        label: 'Info'
    }
};

const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-amber-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-rose-600';
};

const getScoreBg = (score: number): string => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-amber-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-rose-500';
};

export const CompliancePanel: React.FC<CompliancePanelProps> = ({
    report,
    onNavigateToLine,
    loading
}) => {
    if (loading) {
        return (
            <div className="bg-slate-900 dark:bg-black rounded-3xl p-6 border border-slate-800 animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-slate-800 rounded-xl" />
                    <div className="flex-1">
                        <div className="h-4 bg-slate-800 rounded w-1/2 mb-2" />
                        <div className="h-3 bg-slate-800 rounded w-1/3" />
                    </div>
                </div>
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-16 bg-slate-800/50 rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    if (!report) {
        return (
            <div className="bg-slate-900 dark:bg-black rounded-3xl p-6 border border-slate-800">
                <div className="text-center py-8">
                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Shield className="w-8 h-8 text-slate-600" />
                    </div>
                    <p className="text-sm text-slate-400">
                        Ejecuta la auditoría para verificar el cumplimiento normativo
                    </p>
                </div>
            </div>
        );
    }

    const criticalCount = report.issues.filter(i => i.severity === 'critical').length;
    const warningCount = report.issues.filter(i => i.severity === 'warning').length;
    const infoCount = report.issues.filter(i => i.severity === 'info').length;

    return (
        <div className="bg-slate-900 dark:bg-black rounded-3xl border border-slate-800 overflow-hidden">
            {/* Header with Score */}
            <div className="p-6 border-b border-slate-800">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${getScoreBg(report.score)}/20`}>
                            <Shield className={`w-5 h-5 ${getScoreColor(report.score)}`} />
                        </div>
                        <div>
                            <h3 className="text-[10px] font-black text-white uppercase tracking-widest">
                                Compliance Check
                            </h3>
                            <p className="text-xs text-slate-400">
                                Ley Rider · RGPD · Laboral
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className={`text-3xl font-black ${getScoreColor(report.score)}`}>
                            {report.score}
                            <span className="text-base text-slate-500">/100</span>
                        </div>
                        <div className="text-[9px] text-slate-500 uppercase tracking-wider">
                            {report.score >= 80 ? '✓ Cumplimiento alto' : 
                             report.score >= 60 ? '⚠ Revisión necesaria' : 
                             '✗ Riesgo legal'}
                        </div>
                    </div>
                </div>

                {/* Score Bar */}
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                        className={`h-full ${getScoreBg(report.score)} transition-all duration-500`}
                        style={{ width: `${report.score}%` }}
                    />
                </div>

                {/* Summary */}
                <p className="text-xs text-slate-300 mt-4 leading-relaxed">
                    {report.summary}
                </p>
            </div>

            {/* Issue Counts */}
            <div className="grid grid-cols-3 border-b border-slate-800">
                <div className="p-4 text-center border-r border-slate-800">
                    <div className="text-lg font-bold text-rose-500">{criticalCount}</div>
                    <div className="text-[9px] text-slate-500 uppercase tracking-wider">Críticos</div>
                </div>
                <div className="p-4 text-center border-r border-slate-800">
                    <div className="text-lg font-bold text-amber-500">{warningCount}</div>
                    <div className="text-[9px] text-slate-500 uppercase tracking-wider">Advertencias</div>
                </div>
                <div className="p-4 text-center">
                    <div className="text-lg font-bold text-blue-500">{infoCount}</div>
                    <div className="text-[9px] text-slate-500 uppercase tracking-wider">Info</div>
                </div>
            </div>

            {/* Issues List */}
            <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                {report.issues.length === 0 ? (
                    <div className="p-8 text-center">
                        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                        <p className="text-sm text-slate-300">¡Sin incidencias!</p>
                        <p className="text-xs text-slate-500 mt-1">El contrato cumple todas las normativas</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-800">
                        {report.issues.map((issue) => {
                            const config = SEVERITY_CONFIG[issue.severity];
                            return (
                                <div 
                                    key={issue.id}
                                    className={`p-4 ${config.bgColor} border-l-4 ${config.borderColor.replace('border-', 'border-l-')}`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`mt-0.5 ${config.color}`}>
                                            {config.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <h4 className={`text-sm font-bold ${config.color}`}>
                                                    {issue.title}
                                                </h4>
                                                <span className={`text-[9px] px-2 py-0.5 rounded-full ${config.bgColor} ${config.color} border ${config.borderColor}`}>
                                                    {config.label}
                                                </span>
                                            </div>
                                            
                                            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                                                {issue.description}
                                            </p>

                                            {issue.lineNumber && onNavigateToLine && (
                                                <button
                                                    onClick={() => onNavigateToLine(issue.lineNumber!)}
                                                    className="mt-2 text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                                                >
                                                    <FileWarning className="w-3 h-3" />
                                                    Línea {issue.lineNumber}
                                                    <ChevronRight className="w-3 h-3" />
                                                </button>
                                            )}

                                            <div className="mt-2 text-[10px] text-slate-500">
                                                <span className="text-slate-400">Norma: </span>
                                                {issue.regulation}
                                            </div>

                                            {issue.suggestion && (
                                                <div className="mt-2 p-2 bg-slate-900/50 rounded-lg">
                                                    <span className="text-[9px] text-emerald-400 font-medium">Sugerencia: </span>
                                                    <span className="text-[10px] text-slate-400">{issue.suggestion}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Passed Items */}
            {report.passed.length > 0 && (
                <div className="border-t border-slate-800 p-4">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-3">
                        ✓ Aspectos que cumplen
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {report.passed.map((item, idx) => (
                            <span 
                                key={idx}
                                className="text-[9px] px-2 py-1 bg-emerald-900/20 text-emerald-400 rounded-full border border-emerald-800/50"
                            >
                                {item}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CompliancePanel;
