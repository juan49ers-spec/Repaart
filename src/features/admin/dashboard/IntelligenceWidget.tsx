import { memo, type FC } from 'react';
import { ShieldCheck, Zap } from 'lucide-react';
import AlertItem from './AlertItem';

interface Alert {
    level: 'high' | 'warning' | 'med';
    type: string;
    message: string;
    timestamp?: Date;
}

interface Predictions {
    supportLoad?: 'increasing' | 'stable';
    growth?: 'organic' | 'aggressive';
}

interface IntelligenceWidgetProps {
    healthScore: number;
    alerts?: Alert[];
    predictions: Predictions;
}

const IntelligenceWidget: FC<IntelligenceWidgetProps> = memo(({ healthScore, alerts = [], predictions }) => {

    // Determine status color based on score
    const getScoreColor = (score: number): string => {
        if (score >= 80) return 'text-emerald-500';
        if (score >= 50) return 'text-amber-500';
        return 'text-rose-500';
    };

    const scoreColor = getScoreColor(healthScore);
    const isHealthy = alerts.length === 0;
    const healthStatus = isHealthy ? 'Saludable' : 'Anomalía';

    return (
        <div className={`h-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col transition-all duration-300 relative ${isHealthy ? 'hover:border-emerald-200' : 'hover:border-rose-200'}`}>

            {/* Header / Score */}
            <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Zap className={`w-4 h-4 ${scoreColor}`} />
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                Estado del Sistema
                            </h3>
                        </div>
                        <p className="text-[10px] text-gray-400 mb-2">Análisis automático de métricas</p>
                        <p className={`text-3xl font-bold tracking-tighter ${scoreColor}`}>
                            {healthScore}% <span className="text-sm font-medium text-gray-400">/ 100</span>
                        </p>
                    </div>
                    <div className={`mt-1 px-2 py-1 rounded-md border text-[10px] font-bold uppercase tracking-wide ${isHealthy
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        : 'bg-rose-50 text-rose-700 border-rose-100'
                        }`}>
                        {healthStatus}
                    </div>
                </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 p-0 overflow-y-auto max-h-[400px]">
                {/* Predictions / Trends Mini-Section */}
                {(predictions.supportLoad || predictions.growth) && (
                    <div className="grid grid-cols-2 gap-px bg-gray-100 border-b border-gray-100">
                        <div className="bg-white p-3 text-center">
                            <span className="block text-[10px] uppercase text-gray-400 font-bold mb-1">Carga Soporte</span>
                            <span className="text-xs font-semibold text-gray-700">
                                {predictions.supportLoad === 'increasing' ? '↗ Creciendo' : '→ Estable'}
                            </span>
                        </div>
                        <div className="bg-white p-3 text-center">
                            <span className="block text-[10px] uppercase text-gray-400 font-bold mb-1">Crecimiento</span>
                            <span className="text-xs font-semibold text-gray-700">
                                {predictions.growth === 'organic' ? '🌱 Orgánico' : '🚀 Agresivo'}
                            </span>
                        </div>
                    </div>
                )}

                {/* Alerts List */}
                <div className="p-4 space-y-3">
                    {alerts.length > 0 ? (
                        alerts.map((alert, idx) => (
                            <AlertItem key={idx} alert={alert} />
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-center opacity-60">
                            <div className="p-3 bg-emerald-50 rounded-full mb-3 animate-pulse">
                                <ShieldCheck className="w-8 h-8 text-emerald-500" />
                            </div>
                            <h4 className="text-sm font-bold text-gray-800">Todo en Orden</h4>
                            <p className="text-xs text-gray-400 max-w-[150px] mt-1">
                                No se detectan anomalías en métricas clave.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer decoration */}
            <div className={`h-1 w-full ${isHealthy ? 'bg-emerald-500' : 'bg-rose-500'}`} />
        </div>
    );
});

IntelligenceWidget.displayName = 'IntelligenceWidget';

export default IntelligenceWidget;
