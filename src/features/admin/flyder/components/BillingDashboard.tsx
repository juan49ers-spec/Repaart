import React, { useState, useEffect, useCallback } from 'react';
import { useBilling } from '../../../../hooks/useBilling';
import { 
  DollarSign, 
  Settings, 
  FileText, 
  Download, 
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  Users,
  Clock,
  Bike,
  X
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface BillingDashboardProps {
  franchiseId?: string;
}

interface ConfigForm {
  hourlyRateGross: number;
  kmRate: number;
  irpfRate: number;
  otherDeductions: number;
}

const DEFAULT_CONFIG: ConfigForm = {
  hourlyRateGross: 12.50,
  kmRate: 0.50,
  irpfRate: 15,
  otherDeductions: 0
};

export const BillingDashboard: React.FC<BillingDashboardProps> = ({ 
  franchiseId 
}) => {
  const [selectedMonth, setSelectedMonth] = useState(() =>
    new Date().toISOString().slice(0, 7) // YYYY-MM
  );
  const [showConfig, setShowConfig] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const { 
    config,
    closure,
    riders,
    loading, 
    error,
    saveConfig,
    generateClosure,
    refresh 
  } = useBilling(franchiseId, selectedMonth);

  const [configForm, setConfigForm] = useState<ConfigForm>(DEFAULT_CONFIG);

  // Sync form with config when it loads
  useEffect(() => {
    if (config) {
      setConfigForm({
        hourlyRateGross: config.hourlyRateGross,
        kmRate: config.kmRate,
        irpfRate: config.irpfRate,
        otherDeductions: config.otherDeductions || 0
      });
    }
  }, [config]);

  const handleSaveConfig = useCallback(async () => {
    if (!franchiseId || !config) return;
    
    setIsSaving(true);
    try {
      await saveConfig({
        ...config,
        ...configForm
      });
      setShowConfig(false);
    } catch (err) {
      console.error('Error saving config:', err);
    } finally {
      setIsSaving(false);
    }
  }, [franchiseId, config, configForm, saveConfig]);

  const exportToExcel = useCallback(async () => {
    if (!closure || riders.length === 0) return;

    setIsExporting(true);
    try {
      // Preparar datos para Excel
      const data = riders.map(rider => ({
        'Rider ID': rider.riderId,
        'Nombre': rider.riderName,
        'Mes': rider.month,
        'Año': rider.year,
        'Horas Trabajadas': rider.totalHours,
        'Tarifa/Hora (€)': rider.hourlyRateGross,
        'Importe Horas (€)': rider.hoursGrossAmount,
        'Total Pedidos': rider.totalOrders,
        'Distancia Total (km)': rider.totalDistance,
        'Tarifa/KM (€)': rider.kmRate,
        'Importe KM (€)': rider.ordersGrossAmount,
        'Total Bruto (€)': rider.grossTotal,
        'Seguridad Social (€)': rider.socialSecurity,
        'IRPF (€)': rider.irpfDeduction,
        'Otras Deducciones (€)': rider.otherDeductions,
        'Total Neto (€)': rider.netTotal
      }));

      // Crear workbook
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);

      // Añadir resumen al final
      const summaryRow = [
        '',
        'RESUMEN',
        '',
        '',
        closure.summary.totalHours,
        '',
        '',
        closure.summary.totalOrders,
        closure.summary.totalDistance,
        '',
        '',
        closure.summary.totalGross,
        '',
        '',
        '',
        closure.summary.totalNet
      ];
      
      XLSX.utils.sheet_add_aoa(ws, [summaryRow], { origin: -1 });

      // Añadir hoja al libro
      XLSX.utils.book_append_sheet(wb, ws, 'Nóminas');

      // Generar archivo
      const fileName = `nomina_${franchiseId || 'all'}_${selectedMonth}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (err) {
      console.error('Error exporting to Excel:', err);
      alert('Error al exportar. Por favor, inténtalo de nuevo.');
    } finally {
      setIsExporting(false);
    }
  }, [closure, riders, franchiseId, selectedMonth]);

  const handleConfigChange = useCallback((field: keyof ConfigForm, value: number) => {
    setConfigForm(prev => ({ ...prev, [field]: value }));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" role="status" aria-label="Cargando">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4" role="alert">
        <div className="text-red-500 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-2" aria-hidden="true" />
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
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Facturación Automatizada</h1>
          <p className="text-slate-500">Gestión de nóminas y cierres mensuales</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="relative">
            <label htmlFor="month-select" className="sr-only">Seleccionar mes</label>
            <input
              id="month-select"
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <button
            onClick={() => setShowConfig(true)}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-2"
            aria-label="Configurar tarifas"
          >
            <Settings className="w-4 h-4" aria-hidden="true" />
            <span className="hidden sm:inline">Configurar</span>
          </button>
          <button
            onClick={refresh}
            className="p-2 text-slate-600 hover:text-blue-600 transition-colors"
            aria-label="Actualizar datos"
            title="Actualizar"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Config Modal */}
      {showConfig && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="config-title"
        >
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 id="config-title" className="text-xl font-bold">Configuración de Tarifas</h2>
              <button
                onClick={() => setShowConfig(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSaveConfig(); }}>
              <div>
                <label htmlFor="hourly-rate" className="block text-sm font-medium text-slate-700 mb-1">
                  Tarifa por Hora (Bruta) €
                </label>
                <input
                  id="hourly-rate"
                  type="number"
                  step="0.01"
                  min="0"
                  value={configForm.hourlyRateGross}
                  onChange={(e) => handleConfigChange('hourlyRateGross', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                <p className="text-xs text-slate-500 mt-1">Incluye Seguridad Social</p>
              </div>

              <div>
                <label htmlFor="km-rate" className="block text-sm font-medium text-slate-700 mb-1">
                  Tarifa por KM €
                </label>
                <input
                  id="km-rate"
                  type="number"
                  step="0.01"
                  min="0"
                  value={configForm.kmRate}
                  onChange={(e) => handleConfigChange('kmRate', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label htmlFor="irpf-rate" className="block text-sm font-medium text-slate-700 mb-1">
                  Retención IRPF %
                </label>
                <input
                  id="irpf-rate"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={configForm.irpfRate}
                  onChange={(e) => handleConfigChange('irpfRate', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label htmlFor="other-deductions" className="block text-sm font-medium text-slate-700 mb-1">
                  Otras Deducciones €
                </label>
                <input
                  id="other-deductions"
                  type="number"
                  step="0.01"
                  min="0"
                  value={configForm.otherDeductions}
                  onChange={(e) => handleConfigChange('otherDeductions', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowConfig(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resumen General */}
      {closure?.summary && (
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4" aria-label="Resumen">
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-3 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-slate-500">Riders</p>
                <p className="text-xl sm:text-2xl font-bold">{closure.summary.totalRiders}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-3 bg-purple-100 rounded-lg">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-slate-500">Horas Totales</p>
                <p className="text-xl sm:text-2xl font-bold">{closure.summary.totalHours.toFixed(1)}h</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-3 bg-green-100 rounded-lg">
                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-slate-500">Total Bruto</p>
                <p className="text-xl sm:text-2xl font-bold">{closure.summary.totalGross.toFixed(2)}€</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-3 bg-orange-100 rounded-lg">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-slate-500">Total Neto</p>
                <p className="text-xl sm:text-2xl font-bold">{closure.summary.totalNet.toFixed(2)}€</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Acciones */}
      <section className="flex flex-wrap gap-3 sm:gap-4" aria-label="Acciones">
        <button
          onClick={generateClosure}
          disabled={!config}
          className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <FileText className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
          <span className="text-sm sm:text-base">Generar Cierre</span>
        </button>
        
        {closure && (
          <button
            onClick={exportToExcel}
            disabled={isExporting}
            className="px-4 sm:px-6 py-2 sm:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Download className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
            <span className="text-sm sm:text-base">{isExporting ? 'Exportando...' : 'Exportar Excel'}</span>
          </button>
        )}
      </section>

      {/* Tabla de Riders */}
      {riders.length > 0 && (
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden" aria-label="Detalle por rider">
          <div className="px-4 sm:px-6 py-4 border-b border-slate-200">
            <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2">
              <Bike className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" aria-hidden="true" />
              Detalle por Rider
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-medium text-slate-600">Rider</th>
                  <th scope="col" className="px-3 sm:px-4 py-3 text-right text-xs sm:text-sm font-medium text-slate-600">Horas</th>
                  <th scope="col" className="px-3 sm:px-4 py-3 text-right text-xs sm:text-sm font-medium text-slate-600">Pedidos</th>
                  <th scope="col" className="px-3 sm:px-4 py-3 text-right text-xs sm:text-sm font-medium text-slate-600">KM</th>
                  <th scope="col" className="px-3 sm:px-4 py-3 text-right text-xs sm:text-sm font-medium text-slate-600">Bruto</th>
                  <th scope="col" className="px-3 sm:px-4 py-3 text-right text-xs sm:text-sm font-medium text-slate-600">SS</th>
                  <th scope="col" className="px-3 sm:px-4 py-3 text-right text-xs sm:text-sm font-medium text-slate-600">IRPF</th>
                  <th scope="col" className="px-3 sm:px-4 py-3 text-right text-xs sm:text-sm font-medium text-slate-600">Neto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {riders.map((rider) => (
                  <tr key={rider.riderId} className="hover:bg-slate-50">
                    <td className="px-3 sm:px-4 py-3">
                      <div className="font-medium text-sm">{rider.riderName}</div>
                      <div className="text-xs text-slate-500">{rider.riderId.slice(0, 8)}...</div>
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-right text-sm">{rider.totalHours.toFixed(1)}h</td>
                    <td className="px-3 sm:px-4 py-3 text-right text-sm">{rider.totalOrders}</td>
                    <td className="px-3 sm:px-4 py-3 text-right text-sm">{rider.totalDistance.toFixed(1)}</td>
                    <td className="px-3 sm:px-4 py-3 text-right text-sm font-medium">{rider.grossTotal.toFixed(2)}€</td>
                    <td className="px-3 sm:px-4 py-3 text-right text-sm text-red-600">-{rider.socialSecurity.toFixed(2)}€</td>
                    <td className="px-3 sm:px-4 py-3 text-right text-sm text-red-600">-{rider.irpfDeduction.toFixed(2)}€</td>
                    <td className="px-3 sm:px-4 py-3 text-right text-sm font-bold text-green-600">{rider.netTotal.toFixed(2)}€</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Estado vacío */}
      {!closure && !loading && (
        <section className="bg-slate-50 rounded-xl p-8 sm:p-12 text-center" aria-label="Sin datos">
          <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-slate-400 mx-auto mb-4" aria-hidden="true" />
          <h3 className="text-base sm:text-lg font-medium text-slate-700 mb-2">No hay cierre generado</h3>
          <p className="text-sm text-slate-500 mb-4">Genera el cierre mensual para ver el desglose de facturación</p>
          <button
            onClick={generateClosure}
            disabled={!config}
            className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            Generar Cierre
          </button>
        </section>
      )}
    </div>
  );
};

export default BillingDashboard;
