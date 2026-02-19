import React, { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../../lib/firebase';
import { 
  Play, 
  AlertCircle, 
  Check,
  RefreshCw,
  Calendar
} from 'lucide-react';
import { cn } from '../../../../lib/utils';

export const BulkSyncButton: React.FC = () => {
  const [syncing, setSyncing] = useState(false);
  const [progress, setProgress] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runBulkSync = async () => {
    if (!window.confirm(
      '¿Sincronizar TODOS los pedidos de Flyder?\n\n' +
      'Este proceso sincronizará los 102,720 pedidos semana por semana. ' +
      'Puede tardar varios minutos. No cierres la página.'
    )) {
      return;
    }

    setSyncing(true);
    setError(null);
    
    setProgress({ currentWeek: 0, totalWeeks: 0, totalSynced: 0 });

    // Generar semanas desde 2024-01-01 hasta hoy
    const weeks = [];
    const startDate = new Date('2024-01-01');
    const endDate = new Date();
    
    let current = new Date(startDate);
    while (current < endDate) {
      const weekEnd = new Date(current);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      weeks.push({
        start: current.toISOString().split('T')[0],
        end: weekEnd.toISOString().split('T')[0]
      });
      
      current = new Date(weekEnd);
      current.setDate(current.getDate() + 1);
    }

    let totalSynced = 0;
    let totalSkipped = 0;
    let totalFailed = 0;

    for (let i = 0; i < weeks.length; i++) {
      const week = weeks[i];
      setProgress({ 
        currentWeek: i + 1, 
        totalWeeks: weeks.length, 
        totalSynced,
        currentRange: `${week.start} a ${week.end}`
      });

      try {
        const syncFn = httpsCallable(functions, 'syncFlyderOrdersByWeek');
        const response = await syncFn({
          startDate: week.start,
          endDate: week.end
        });

        const data = response.data as any;
        if (data.stats) {
          totalSynced += data.stats.synced;
          totalSkipped += data.stats.skipped;
          totalFailed += data.stats.failed;
        }

        // Pequeña pausa para no saturar
        if (i < weeks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (err: any) {
        console.error(`Error en semana ${week.start}:`, err);
        setError(`Error en semana ${week.start}: ${err.message}`);
        // Continuar con la siguiente semana
      }
    }

    setProgress({ 
      currentWeek: weeks.length, 
      totalWeeks: weeks.length, 
      totalSynced,
      completed: true
    });
    
    setSyncing(false);
  };

  return (
    <div className="glass-card p-6 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
          <Calendar className="w-6 h-6 text-blue-600" />
        </div>
        
        <div className="flex-1">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
            Sincronización Masiva de Pedidos
          </h3>
          
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Sincroniza todos los 102,720 pedidos de Flyder semana por semana. 
            Este proceso automatizado evita timeouts y asegura que todos los pedidos se importen correctamente.
          </p>

          {!syncing && !progress?.completed && (
            <button
              onClick={runBulkSync}
              disabled={syncing}
              className={cn(
                'px-6 py-3 rounded-lg font-medium flex items-center gap-2',
                'bg-blue-600 text-white hover:bg-blue-700'
              )}
            >
              <Play className="w-5 h-5" />
              Iniciar Sincronización Total
            </button>
          )}

          {syncing && progress && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-blue-700">
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span className="font-medium">
                  Sincronizando semana {progress.currentWeek} de {progress.totalWeeks}...
                </span>
              </div>
              
              {progress.currentRange && (
                <p className="text-sm text-slate-600">
                  Periodo: {progress.currentRange}
                </p>
              )}
              
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${(progress.currentWeek / progress.totalWeeks) * 100}%` 
                  }}
                />
              </div>
              
              <p className="text-sm text-slate-600">
                Pedidos sincronizados hasta ahora: <strong>{progress.totalSynced}</strong>
              </p>
            </div>
          )}

          {progress?.completed && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center gap-2 text-green-700 mb-2">
                <Check className="w-5 h-5" />
                <span className="font-medium">¡Sincronización completada!</span>
              </div>
              <p className="text-sm text-green-600">
                Total de pedidos sincronizados: <strong>{progress.totalSynced}</strong>
              </p>
              <button
                onClick={() => {
                  setProgress(null);
                }}
                className="mt-3 text-sm text-blue-600 hover:text-blue-700"
              >
                Sincronizar de nuevo
              </button>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkSyncButton;
