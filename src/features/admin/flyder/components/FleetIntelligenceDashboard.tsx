import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { useFleetIntelligence } from '../../../../hooks/useFleetIntelligence';
import { 
  TrendingUp, 
  Users, 
  Clock, 
  AlertTriangle, 
  RefreshCw,
  MapPin,
  Activity,
  BarChart3,
  Info
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';

interface FleetIntelligenceDashboardProps {
  franchiseId?: string;
}

const COLORS = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e',
  primary: '#3b82f6',
  secondary: '#8b5cf6',
  accent: '#f59e0b'
};

export const FleetIntelligenceDashboard: React.FC<FleetIntelligenceDashboardProps> = ({ 
  franchiseId 
}) => {
  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), 'yyyy-MM-dd')
  );
  const [selectedChart, setSelectedChart] = useState<'demand' | 'performance' | 'coverage'>('demand');
  
  const { 
    report,
    topPerformers,
    hourlyDemand,
    franchiseCoverage,
    alerts,
    loading, 
    error,
    refresh 
  } = useFleetIntelligence(franchiseId, selectedDate);

  // Transformar datos para gráficos
  const demandChartData = useMemo(() => {
    return hourlyDemand.map(hd => ({
      hour: `${hd.hour}:00`,
      riders: hd.activeRiders,
      level: hd.demandLevel,
      fullHour: hd.hour
    }));
  }, [hourlyDemand]);

  const performanceChartData = useMemo(() => {
    return topPerformers.slice(0, 10).map(p => ({
      name: p.riderName.split(' ')[0],
      efficiency: p.efficiency,
      hours: p.totalHours,
      shifts: p.shiftsCount,
      fullName: p.riderName
    }));
  }, [topPerformers]);

  const coverageChartData = useMemo(() => {
    return franchiseCoverage.map(fc => ({
      name: `Franquicia ${fc.franchiseId.slice(0, 6)}`,
      coverage: fc.coverageScore,
      active: fc.activeNow,
      total: fc.totalRiders,
      risk: fc.saturationRisk
    }));
  }, [franchiseCoverage]);

  const alertDistribution = useMemo(() => {
    const distribution = { critical: 0, high: 0, medium: 0, low: 0 };
    alerts.forEach(alert => {
      distribution[alert.severity]++;
    });
    return [
      { name: 'Crítico', value: distribution.critical, color: COLORS.critical },
      { name: 'Alto', value: distribution.high, color: COLORS.high },
      { name: 'Medio', value: distribution.medium, color: COLORS.medium },
      { name: 'Bajo', value: distribution.low, color: COLORS.low }
    ].filter(item => item.value > 0);
  }, [alerts]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-slate-200 rounded-xl"></div>
          ))}
        </div>
        <div className="h-96 bg-slate-200 rounded-xl"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4 animate-fadeIn">
        <div className="text-red-500 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-2" />
          <p className="text-lg font-medium">Error al cargar datos</p>
          <p className="text-sm text-slate-500">{error}</p>
        </div>
        <button
          onClick={refresh}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Reintentar
        </button>
      </div>
    );
  }

  const criticalAlerts = alerts.filter(a => a.severity === 'critical');
  const highAlerts = alerts.filter(a => a.severity === 'high');

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Fleet Intelligence</h1>
          <p className="text-slate-500">Análisis operativo y alertas de la flota</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
          />
          <button
            onClick={refresh}
            className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
            title="Actualizar"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Alertas */}
      {alerts.length > 0 && (
        <section className="space-y-2 animate-slideIn">
          {criticalAlerts.map((alert, idx) => (
            <div 
              key={idx} 
              className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3 animate-pulse"
            >
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-red-900">{alert.message}</p>
                <p className="text-sm text-red-700">Crítico - Requiere atención inmediata</p>
              </div>
            </div>
          ))}
          {highAlerts.map((alert, idx) => (
            <div 
              key={idx} 
              className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-center gap-3"
            >
              <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-orange-900">{alert.message}</p>
                <p className="text-sm text-orange-700">Alta prioridad</p>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Métricas Principales */}
      {report?.overallMetrics && (
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-3 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-slate-500">Riders Activos</p>
                <p className="text-xl sm:text-2xl font-bold">{report.overallMetrics.activeRiders}</p>
                <p className="text-xs text-slate-400">de {report.overallMetrics.totalRiders} total</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-3 bg-green-100 rounded-lg">
                <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-slate-500">Turnos Completados</p>
                <p className="text-xl sm:text-2xl font-bold">{report.overallMetrics.completedShifts}</p>
                <p className="text-xs text-slate-400">de {report.overallMetrics.totalShifts} total</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-3 bg-purple-100 rounded-lg">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-slate-500">Horas Promedio</p>
                <p className="text-xl sm:text-2xl font-bold">{report.overallMetrics.avgHoursPerRider.toFixed(1)}h</p>
                <p className="text-xs text-slate-400">por rider</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-3 bg-orange-100 rounded-lg">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-slate-500">Eficiencia</p>
                <p className="text-xl sm:text-2xl font-bold">
                  {((report.overallMetrics.completedShifts / report.overallMetrics.totalShifts) * 100).toFixed(0)}%
                </p>
                <p className="text-xs text-slate-400">completados</p>
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico Principal */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                Análisis Visual
              </h2>
              <div className="flex gap-2">
                {[
                  { id: 'demand', label: 'Demanda' },
                  { id: 'performance', label: 'Rendimiento' },
                  { id: 'coverage', label: 'Cobertura' }
                ].map(chart => (
                  <button
                    key={chart.id}
                    onClick={() => setSelectedChart(chart.id as any)}
                    className={`px-3 py-1 text-xs sm:text-sm rounded-lg transition-colors ${
                      selectedChart === chart.id
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {chart.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <div className="p-4 sm:p-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              {selectedChart === 'demand' ? (
                <AreaChart data={demandChartData}>
                  <defs>
                    <linearGradient id="colorRiders" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="hour" tick={{fontSize: 12}} />
                  <YAxis tick={{fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                    formatter={(value: number) => [`${value} riders`, 'Activos']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="riders" 
                    stroke={COLORS.primary} 
                    fillOpacity={1} 
                    fill="url(#colorRiders)" 
                    strokeWidth={2}
                  />
                </AreaChart>
              ) : selectedChart === 'performance' ? (
                <BarChart data={performanceChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{fontSize: 12}} />
                  <YAxis tick={{fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                    formatter={(value: number) => {
                      return [`${value}h`, 'Eficiencia'];
                    }}
                    labelFormatter={(_label: string, payload: any[]) => {
                      if (payload && payload[0] && payload[0].payload) {
                        return payload[0].payload.fullName;
                      }
                      return '';
                    }}
                  />
                  <Bar dataKey="efficiency" fill={COLORS.secondary} radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : (
                <BarChart data={coverageChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" domain={[0, 100]} tick={{fontSize: 12}} />
                  <YAxis dataKey="name" type="category" tick={{fontSize: 11}} width={100} />
                  <Tooltip 
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                    formatter={(value: number, _name: string, item: any) => {
                      const data = item?.payload;
                      if (data) {
                        return [
                          `${value}% (${data.active}/${data.total})`,
                          'Cobertura'
                        ];
                      }
                      return [`${value}%`, 'Cobertura'];
                    }}
                  />
                  <Bar dataKey="coverage" radius={[0, 4, 4, 0]}>
                    {coverageChartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.risk ? COLORS.critical : COLORS.low} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Panel Lateral */}
        <div className="space-y-6">
          {/* Distribución de Alertas */}
          {alertDistribution.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Info className="w-4 h-4 text-slate-500" />
                  Distribución de Alertas
                </h3>
              </div>
              <div className="p-4">
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={alertDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {alertDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-2 justify-center mt-2">
                  {alertDistribution.map((item) => (
                    <div key={item.name} className="flex items-center gap-1 text-xs">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{backgroundColor: item.color}}
                      />
                      <span>{item.name}: {item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Top Performers */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                Top 5 Riders
              </h3>
            </div>
            
            <div className="divide-y divide-slate-200">
              {topPerformers.length === 0 ? (
                <div className="px-4 py-6 text-center text-slate-500 text-sm">
                  No hay datos de rendimiento
                </div>
              ) : (
                topPerformers.slice(0, 5).map((performer, idx) => (
                  <div 
                    key={performer.riderId} 
                    className="px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        idx === 0 ? 'bg-yellow-100 text-yellow-800' :
                        idx === 1 ? 'bg-gray-100 text-gray-800' :
                        idx === 2 ? 'bg-orange-100 text-orange-800' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {idx + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-sm truncate">{performer.riderName}</div>
                        <div className="text-xs text-slate-500">{performer.shiftsCount} turnos</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600 text-sm">{performer.efficiency.toFixed(1)}h</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Cobertura por Franquicia */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                Cobertura
              </h3>
            </div>
            
            <div className="divide-y divide-slate-200">
              {franchiseCoverage.length === 0 ? (
                <div className="px-4 py-6 text-center text-slate-500 text-sm">
                  No hay datos de franquicias
                </div>
              ) : (
                franchiseCoverage.slice(0, 3).map((fc) => (
                  <div key={fc.franchiseId} className="px-4 py-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-medium text-sm">Franquicia {fc.franchiseId.slice(0, 6)}...</div>
                      <span className={`text-xs font-medium ${
                        fc.saturationRisk ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {fc.coverageScore}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5">
                      <div 
                        className={`h-1.5 rounded-full transition-all ${
                          fc.saturationRisk ? 'bg-red-500' : 
                          fc.coverageScore > 70 ? 'bg-green-500' : 
                          fc.coverageScore > 40 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${fc.coverageScore}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                      <span>{fc.activeNow} activos</span>
                      <span>{fc.totalRiders} total</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FleetIntelligenceDashboard;
