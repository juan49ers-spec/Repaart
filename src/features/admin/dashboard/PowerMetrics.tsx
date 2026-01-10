import { type FC, type CSSProperties } from 'react';
import { Users2, AlertOctagon, Users } from 'lucide-react';
import { formatMoney } from '../../../lib/finance';
import InfoTooltip from '../../InfoTooltip';

interface PowerMetricsData {
    globalCAC: number;
    globalIncidentRatio: number;
    avgLaborRatio: number;
}

interface Stats {
    powerMetrics: PowerMetricsData;
}

interface PowerMetricsProps {
    stats: Stats;
}

const PowerMetrics: FC<PowerMetricsProps> = ({ stats }) => {
    console.log('DEBUG: PowerMetrics mounted');
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg transition-all group relative">
                <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                </div>
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
                                CAC Global <InfoTooltip text="Coste de Adquisición de Cliente. Marketing / Nuevos Pedidos." />
                            </p>
                            <h3 className="text-3xl font-black text-slate-800 mt-1">{formatMoney(stats.powerMetrics.globalCAC)}€</h3>
                        </div>
                        <div className="bg-purple-100 p-2.5 rounded-xl text-purple-600 shadow-inner"><Users2 className="w-6 h-6" /></div>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-purple-500 h-full w-[45%]" />
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg transition-all group relative">
                <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                </div>
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
                                Incidencias <InfoTooltip text="Porcentaje de ingresos perdidos en devoluciones o errores." />
                            </p>
                            <h3 className={`text-3xl font-black mt-1 ${(stats.powerMetrics.globalIncidentRatio || 0) > 1 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                {(stats.powerMetrics.globalIncidentRatio || 0).toFixed(2)}%
                            </h3>
                        </div>
                        <div className="bg-rose-100 p-2.5 rounded-xl text-rose-600 shadow-inner"><AlertOctagon className="w-6 h-6" /></div>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className={`h-full ${stats.powerMetrics.globalIncidentRatio > 1 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${stats.powerMetrics.globalIncidentRatio * 20}%` } as CSSProperties} />
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg transition-all group relative">
                <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                </div>
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
                                Carga Laboral <InfoTooltip text="Porcentaje de la Venta destinado a Salarios. Debe ser < 60-65%." />
                            </p>
                            <h3 className="text-3xl font-black text-slate-800 mt-1">{(stats.powerMetrics.avgLaborRatio || 0).toFixed(1)}%</h3>
                        </div>
                        <div className="bg-blue-100 p-2.5 rounded-xl text-blue-600 shadow-inner"><Users className="w-6 h-6" /></div>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-blue-500 h-full" style={{ width: `${stats.powerMetrics.avgLaborRatio}%` } as CSSProperties} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PowerMetrics;
