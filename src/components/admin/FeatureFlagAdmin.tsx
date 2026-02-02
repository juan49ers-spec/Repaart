import React from 'react';
import { useFeatureFlags } from '../../context/FeatureFlags';
import { Switch } from '../ui/forms/Switch';
import { ResponsiveCard } from '../ui/primitives/Card';

/**
 * FeatureFlagAdmin - Panel de administración de feature flags
 * 
 * Solo disponible para admins/developers
 * Permite activar/desactivar features en tiempo real
 */
export const FeatureFlagAdmin: React.FC = () => {
  const { flags, updateFlag } = useFeatureFlags();

  const handleToggle = (key: string, currentValue: boolean) => {
    updateFlag(key, !currentValue);
  };

  // Agrupar flags por categoría
  const categories = {
    'UI/UX': ['darkMode', 'compactView', 'experimentalCharts'],
    'Funcionalidad': ['bulkOperations', 'exportData', 'importData', 'autoSave'],
    'Beta': ['newDashboard', 'advancedAnalytics', 'betaFeatures'],
    'Configuración': ['maxItemsPerPage', 'enableNotifications']
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
        Feature Flags
      </h1>
      
      <p className="text-slate-600 dark:text-slate-400">
        Activa o desactiva características de la aplicación en tiempo real.
        Los cambios se guardan localmente.
      </p>

      {Object.entries(categories).map(([category, flagKeys]) => (
        <ResponsiveCard key={category} className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
            {category}
          </h2>
          
          <div className="space-y-3">
            {flagKeys.map(key => {
              const value = flags[key];
              const isBoolean = typeof value === 'boolean';
              
              if (!isBoolean) {
                return (
                  <div key={key} className="flex items-center justify-between py-2">
                    <span className="text-slate-700 dark:text-slate-300">{key}</span>
                    <input
                      type="number"
                      value={value as number}
                      onChange={(e) => updateFlag(key, parseInt(e.target.value))}
                      className="w-24 px-3 py-1 border rounded-lg"
                    />
                  </div>
                );
              }
              
              return (
                <div key={key} className="flex items-center justify-between py-2">
                  <div>
                    <span className="text-slate-700 dark:text-slate-300 font-medium">
                      {key}
                    </span>
                    <p className="text-sm text-slate-500">
                      {value ? 'Activado' : 'Desactivado'}
                    </p>
                  </div>
                  
                  <Switch
                    checked={value as boolean}
                    onChange={() => handleToggle(key, value as boolean)}
                  />
                </div>
              );
            })}
          </div>
        </ResponsiveCard>
      ))}

      <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
        <p className="text-sm text-amber-800 dark:text-amber-200">
          💡 Los cambios se aplican inmediatamente y se guardan en el almacenamiento local.
          En producción, estos valores pueden ser sobrescritos por Firebase Remote Config.
        </p>
      </div>
    </div>
  );
};

export default FeatureFlagAdmin;
