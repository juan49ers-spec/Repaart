import React, { useState } from 'react';
import { Sparkles, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, BrainCircuit } from 'lucide-react';
import { analyzeFinancialMonthlyReport } from '../../../lib/gemini';
import { SimpleFinanceData } from '../finance/types';

interface AIInsightCardProps {
    data: SimpleFinanceData & { orders: number };
}

interface AIAnalysisResult {
    summary: string;
    strengths: string[];
    weaknesses: string[];
    recommendation: string;
    sentiment: 'positive' | 'neutral' | 'negative' | 'critical';
}

export const AIInsightCard: React.FC<AIInsightCardProps> = ({ data }) => {
    const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
    const [loading, setLoading] = useState(false);

    const handleAnalyze = async () => {
        setLoading(true);
        try {
            const result = await analyzeFinancialMonthlyReport(data);
            setAnalysis(result);
        } catch (error) {
            console.error("AI Analysis failed", error);
        } finally {
            setLoading(false);
        }
    };

    if (!analysis && !loading) {
        return (
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-2xl border border-indigo-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-white rounded-xl shadow-sm">
                        <BrainCircuit className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-indigo-900">Auditoría IA</h3>
                        <p className="text-xs text-indigo-700 mt-1 max-w-md">
                            Deja que Gemini 2.5 analice tus números y encuentre fugas de dinero o éxitos ocultos.
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleAnalyze}
                    className="px-6 py-2.5 bg-white text-indigo-600 font-bold text-sm rounded-xl shadow-sm border border-indigo-100 hover:shadow-md hover:scale-105 transition-all flex items-center gap-2"
                >
                    <Sparkles className="w-4 h-4" />
                    Analizar Mes
                </button>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="bg-white p-8 rounded-2xl border border-gray-100 text-center animate-pulse">
                <BrainCircuit className="w-8 h-8 text-indigo-400 mx-auto animate-bounce" />
                <h3 className="mt-4 font-bold text-gray-900">El Auditor Virtual está pensando...</h3>
                <p className="text-xs text-gray-500 mt-2">Analizando márgenes, verificando costes y buscando patrones.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm ring-4 ring-indigo-50/50">
            {/* Header */}
            <div className={`px-6 py-4 border-b flex items-center justify-between ${analysis?.sentiment === 'positive' ? 'bg-emerald-50 border-emerald-100' :
                analysis?.sentiment === 'critical' || analysis?.sentiment === 'negative' ? 'bg-rose-50 border-rose-100' :
                    'bg-gray-50 border-gray-100'
                }`}>
                <div className="flex items-center gap-3">
                    <BrainCircuit className={`w-5 h-5 ${analysis?.sentiment === 'positive' ? 'text-emerald-600' : 'text-gray-600'
                        }`} />
                    <h3 className="font-bold text-gray-900">Informe del Auditor IA</h3>
                </div>
                <span className={`text-[10px] font-bold uppercase px-3 py-1 rounded-full ${analysis?.sentiment === 'positive' ? 'bg-emerald-100 text-emerald-700' :
                    analysis?.sentiment === 'negative' ? 'bg-rose-100 text-rose-700' :
                        'bg-gray-200 text-gray-700'
                    }`}>
                    {analysis?.sentiment === 'positive' ? 'Mes Excelente' : 'Requiere Atención'}
                </span>
            </div>

            <div className="p-6 space-y-6">
                {/* Summary */}
                <div>
                    <h4 className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-2">Resumen Ejecutivo</h4>
                    <p className="text-lg font-medium text-gray-800 leading-relaxed italic">
                        &quot;{analysis?.summary}&quot;
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Strengths */}
                    {analysis?.strengths && analysis.strengths.length > 0 && (
                        <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-100/50">
                            <h4 className="flex items-center gap-2 text-sm font-bold text-emerald-800 mb-3">
                                <TrendingUp className="w-4 h-4" /> Puntos Fuertes
                            </h4>
                            <ul className="space-y-2">
                                {analysis.strengths.map((s: string, i: number) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-emerald-900">
                                        <CheckCircle className="w-3.5 h-3.5 mt-0.5 text-emerald-500 shrink-0" />
                                        {s}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Weaknesses */}
                    {analysis?.weaknesses && analysis.weaknesses.length > 0 && (
                        <div className="bg-rose-50/50 rounded-xl p-4 border border-rose-100/50">
                            <h4 className="flex items-center gap-2 text-sm font-bold text-rose-800 mb-3">
                                <TrendingDown className="w-4 h-4" /> Áreas de Mejora
                            </h4>
                            <ul className="space-y-2">
                                {analysis.weaknesses.map((w: string, i: number) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-rose-900">
                                        <AlertTriangle className="w-3.5 h-3.5 mt-0.5 text-rose-500 shrink-0" />
                                        {w}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Recommendation */}
                <div className="bg-indigo-50 rounded-xl p-5 border border-indigo-100 flex gap-4">
                    <div className="p-2 bg-indigo-100 rounded-lg shrink-0 h-fit">
                        <Sparkles className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                        <h4 className="font-bold text-indigo-900 text-sm mb-1">Recomendación Estratégica</h4>
                        <p className="text-sm text-indigo-800 leading-relaxed">
                            {analysis?.recommendation}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
