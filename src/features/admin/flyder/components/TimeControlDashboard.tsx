import React, { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useTimeControl } from '../../../../hooks/useTimeControl';
import { Clock, Users, AlertTriangle, RefreshCw } from 'lucide-react';

interface TimeControlDashboardProps {
  franchiseId: string;
}

export const TimeControlDashboard: React.FC<TimeControlDashboardProps> = ({ 
  franchiseId 
}) => {
  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), 'yyyy-MM-dd')
  );
  
  const { 
    shifts, 
    workedHours, 
    metrics, 
    loading, 
    error,
    refresh 
  } = useTimeControl(franchiseId, selectedDate);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="text-red-500 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-2" />
          <p className="text-lg font-medium">Error al cargar datos</p>
          <p className="text-sm text-slate-500">{error}</p>
        </div>
        <button
          onClick={refresh}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Control Horario</h1>
          <p className="text-slate-500">Gestión de turnos y horas trabajadas</p>
        </div>
        <div className="flex items-center gap-4">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={refresh}
            className="p-2 text-slate-600 hover:text-blue-600 transition-colors"
            title="Actualizar"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Métricas */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Riders Activos</p>
                <p className="text-2xl font-bold">{metrics.activeRiders}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <Clock className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Horas Totales</p>
                <p className="text-2xl font-bold">{metrics.avgHoursPerRider.toFixed(1)}h</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Riders</p>
                <p className="text-2xl font-bold">{metrics.totalRiders}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Turnos Completados</p>
                <p className="text-2xl font-bold">{metrics.completedShifts}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabla de Horas Trabajadas */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold">Horas Trabajadas</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-slate-500">Rider</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-slate-500">Turnos</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-slate-500">Horas Totales</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-slate-500">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {workedHours.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                    No hay datos de turnos para esta fecha
                  </td>
                </tr>
              ) : (
                workedHours.map((report: { riderId: string; riderName: string; shiftsCount: number; totalHours: number }) => (
                  <tr key={report.riderId} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{report.riderName}</div>
                      <div className="text-sm text-slate-500">ID: {report.riderId.slice(0, 8)}...</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {report.shiftsCount} turnos
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium">{report.totalHours.toFixed(2)}h</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        report.totalHours >= 8 
                          ? 'bg-green-100 text-green-800' 
                          : report.totalHours >= 4
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {report.totalHours >= 8 ? 'Completo' 
                          : report.totalHours >= 4 ? 'Parcial' 
                          : 'Mínimo'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lista de Turnos */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold">Turnos del Día</h2>
        </div>
        
        <div className="divide-y divide-slate-200">
          {shifts.length === 0 ? (
            <div className="px-6 py-8 text-center text-slate-500">
              No hay turnos programados para esta fecha
            </div>
          ) : (
            shifts.map((shift: { id: string; riderName: string; startAt: { toDate: () => Date }; endAt: { toDate: () => Date }; status: string }) => (
              <div key={shift.id} className="px-6 py-4 hover:bg-slate-50">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{shift.riderName}</div>
                    <div className="text-sm text-slate-500">
                      {format(shift.startAt.toDate(), 'HH:mm', { locale: es })} - {''}
                      {format(shift.endAt.toDate(), 'HH:mm', { locale: es })}
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    shift.status === 'completed' ? 'bg-green-100 text-green-800' :
                    shift.status === 'active' ? 'bg-blue-100 text-blue-800' :
                    shift.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {shift.status === 'completed' ? 'Completado' :
                     shift.status === 'active' ? 'Activo' :
                     shift.status === 'cancelled' ? 'Cancelado' :
                     'Programado'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TimeControlDashboard;
